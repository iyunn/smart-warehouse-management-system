import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const FETCH_SIZE = 1000

// GET /api/sj/report — fetch all items flat dengan info SJ + tujuan
// 1 row = 1 item (untuk tabel report + export Excel single sheet flat)
export async function GET() {
  try {
    let allItems: any[] = []
    let from = 0

    while (true) {
      const { data, error } = await supabase
        .from('surat_jalan_items')
        .select(`
          id, urutan, jenis, merk, serial_number, qty, satuan,
          is_baru, is_aktiva, keterangan, mutasi_oracle_status, kode_asset,
          sj:surat_jalan!inner (
            id, no_sj, tanggal, pembawa, penerima, status, approved_by,
            tujuan:sj_tujuan (id, kode, nama)
          )
        `)
        .range(from, from + FETCH_SIZE - 1)

      if (error) throw new Error(error.message)
      const batch = data ?? []
      allItems = [...allItems, ...batch]
      if (batch.length < FETCH_SIZE) break
      from += FETCH_SIZE
      if (from > 100000) break
    }

    // Flatten: ratakan ke 1 row per item
    const flatItems = allItems.map((it: any) => {
      const sj = Array.isArray(it.sj) ? it.sj[0] : it.sj
      const tujuan = sj?.tujuan
        ? (Array.isArray(sj.tujuan) ? sj.tujuan[0] : sj.tujuan)
        : null

      return {
        item_id:         it.id,
        urutan:          it.urutan,
        jenis:           it.jenis ?? '',
        merk:            it.merk ?? '',
        serial_number:   it.serial_number ?? '',
        qty:             it.qty ?? 1,
        satuan:          it.satuan ?? 'Unit',
        is_baru:         !!it.is_baru,
        is_aktiva:       !!it.is_aktiva,
        keterangan:      it.keterangan ?? '',
        mutasi_oracle:   !!it.mutasi_oracle_status,
        kode_asset:      it.kode_asset ?? '',
        // SJ info
        sj_id:           sj?.id,
        no_sj:           sj?.no_sj ?? '',
        tanggal:         sj?.tanggal ?? '',
        pembawa:         sj?.pembawa ?? '',
        penerima:        sj?.penerima ?? '',
        status:          sj?.status ?? '',
        approved_by:     sj?.approved_by ?? '',
        // Tujuan info
        tujuan_id:       tujuan?.id ?? null,
        tujuan_kode:     tujuan?.kode ?? '',
        tujuan_nama:     tujuan?.nama ?? '',
      }
    })

    // Sort by tanggal desc + urutan asc
    flatItems.sort((a, b) => {
      const dateCompare = b.tanggal.localeCompare(a.tanggal)
      if (dateCompare !== 0) return dateCompare
      return a.urutan - b.urutan
    })

    return NextResponse.json({
      items: flatItems,
      total: flatItems.length,
    })

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error' },
      { status: 500 }
    )
  }
}

// ════════════════════════════════════════════════════════════════════════
// PATCH /api/sj/report — update alokasi 1 item (kode_asset + mutasi_oracle)
// ════════════════════════════════════════════════════════════════════════
// Dipanggil onBlur dari kolom input di Rekap Alokasi.
// Logic:
//   - Update kode_asset + mutasi_oracle_status di surat_jalan_items
//   - Kalau kode_asset diisi & cocok di assets_clean → tag 'Allocated'
//   - Kalau kode_asset dikosongkan → bersihkan tag aset yang sebelumnya
//     ter-tag oleh item ini (kalau tidak dipakai item lain)
export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { item_id, kode_asset, mutasi_oracle_status } = body as {
      item_id?: string
      kode_asset?: string
      mutasi_oracle_status?: boolean
    }

    if (!item_id) {
      return NextResponse.json({ error: 'item_id wajib' }, { status: 400 })
    }

    const newKode = (kode_asset ?? '').trim()

    // ── 1. Ambil kode_asset lama untuk deteksi perubahan ────────────────────
    const { data: oldItem, error: fetchErr } = await supabase
      .from('surat_jalan_items')
      .select('kode_asset')
      .eq('id', item_id)
      .single()

    if (fetchErr) throw new Error(fetchErr.message)
    const oldKode = (oldItem?.kode_asset ?? '').trim()

    // ── 2. Update item ──────────────────────────────────────────────────────
    const { error: updErr } = await supabase
      .from('surat_jalan_items')
      .update({
        kode_asset:           newKode || null,
        mutasi_oracle_status: !!mutasi_oracle_status,
        mutasi_oracle_at:     mutasi_oracle_status ? new Date().toISOString() : null,
      })
      .eq('id', item_id)

    if (updErr) throw new Error(updErr.message)

    // ── 3. Tag baru di assets_clean (kalau kode diisi & cocok) ──────────────
    // assets_clean tidak punya kolom kode_asset langsung — relasinya via raw_id
    // ke assets_raw. Jadi 2-step: cari raw_id dari kode, lalu tag clean-nya.
    let tagged = false
    if (newKode) {
      const { data: rawRow } = await supabase
        .from('assets_raw')
        .select('id')
        .eq('kode_asset', newKode)
        .maybeSingle()

      if (rawRow?.id) {
        await supabase
          .from('assets_clean')
          .update({ tag: 'Allocated' })
          .eq('raw_id', rawRow.id)
        tagged = true
      }
    }

    // ── 4. Bersihkan tag lama kalau kode berubah/dikosongkan ────────────────
    // Hanya bersihkan kalau kode lama tidak dipakai item SJ lain.
    if (oldKode && oldKode !== newKode) {
      const { data: stillUsed } = await supabase
        .from('surat_jalan_items')
        .select('id')
        .eq('kode_asset', oldKode)
        .limit(1)

      if (!stillUsed || stillUsed.length === 0) {
        const { data: oldRaw } = await supabase
          .from('assets_raw')
          .select('id')
          .eq('kode_asset', oldKode)
          .maybeSingle()

        if (oldRaw?.id) {
          await supabase
            .from('assets_clean')
            .update({ tag: null })
            .eq('raw_id', oldRaw.id)
        }
      }
    }

    return NextResponse.json({ success: true, tagged })

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error' },
      { status: 500 }
    )
  }
}
