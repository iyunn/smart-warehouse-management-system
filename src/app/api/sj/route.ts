import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── Helper: generate No SJ format SJ-Manual/CGA/YYYY/MM/XXXX ──────────────
async function generateNoSJ(tanggal: string): Promise<string> {
  const date = new Date(tanggal)
  const year  = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const prefix = `SJ-Manual/CGA/${year}/${month}/`

  const { data } = await supabase
    .from('surat_jalan')
    .select('no_sj')
    .like('no_sj', `${prefix}%`)
    .order('no_sj', { ascending: false })
    .limit(1)

  let nextSeq = 1
  if (data && data.length > 0) {
    const lastSeq = data[0].no_sj.split('/').pop() ?? '0000'
    nextSeq = parseInt(lastSeq) + 1
  }

  return `${prefix}${String(nextSeq).padStart(4, '0')}`
}

// ─── GET /api/sj — list all SJ atau detail by id ──────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (id) {
      // Get detail SJ + items
      const { data: sj, error: sjError } = await supabase
        .from('surat_jalan')
        .select(`
          *,
          tujuan:sj_tujuan(id, kode, nama),
          items:surat_jalan_items(*)
        `)
        .eq('id', id)
        .single()

      if (sjError) throw new Error(sjError.message)

      // Sort items by urutan
      if (sj?.items) {
        sj.items.sort((a: any, b: any) => a.urutan - b.urutan)
      }

      return NextResponse.json({ sj })
    }

    // List all SJ dengan tujuan info + items count
    const { data, error } = await supabase
      .from('surat_jalan')
      .select(`
        id, no_sj, tanggal, pembawa, penerima, status, approved_by, is_archived, jenis,
        created_at, updated_at,
        tujuan:sj_tujuan(id, kode, nama),
        items:surat_jalan_items(jenis, serial_number)
      `)
      .order('tanggal', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)

    // Transform: hitung items count + flatten data untuk search
    const list = (data ?? []).map((sj: any) => ({
      ...sj,
      items_count: sj.items?.length ?? 0,
      // Untuk client-side search by SN/jenis tanpa fetch items lagi
      jenis_list: [...new Set((sj.items ?? []).map((i: any) => i.jenis).filter(Boolean))],
      sn_list:    [...new Set((sj.items ?? []).map((i: any) => i.serial_number).filter(Boolean))],
      items: undefined,  // jangan kirim full items (hemat payload)
    }))

    return NextResponse.json({ sj: list })

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error' },
      { status: 500 }
    )
  }
}

// ─── POST /api/sj — create new SJ ──────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tanggal, tujuan_id, pembawa, penerima, approved_by, items, status, jenis } = body

    if (!tanggal || !tujuan_id) {
      return NextResponse.json({ error: 'Tanggal dan tujuan wajib diisi' }, { status: 400 })
    }
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Minimal 1 item barang' }, { status: 400 })
    }

    const no_sj = await generateNoSJ(tanggal)

    const { data: sjData, error: sjError } = await supabase
      .from('surat_jalan')
      .insert({
        no_sj,
        tanggal,
        tujuan_id,
        pembawa:     pembawa ?? '',
        penerima:    penerima ?? '',
        approved_by: approved_by ?? '',
        status:      status ?? 'draft',
        jenis:       jenis === 'masuk' ? 'masuk' : 'keluar', // default 'keluar'
      })
      .select()
      .single()

    if (sjError) throw new Error(sjError.message)

    const itemsToInsert = items.map((item: any, idx: number) => ({
      sj_id:         sjData.id,
      urutan:        idx + 1,
      jenis:         item.jenis ?? '',
      merk:          item.merk ?? '',
      serial_number: item.serial_number ?? '',
      qty:           item.qty ?? 1,
      satuan:        item.satuan ?? 'Unit',
      is_baru:       !!item.is_baru,
      is_aktiva:     !!item.is_aktiva,
      keterangan:    item.keterangan ?? '',
      // kode_asset ikut disimpan (penting untuk Penerimaan Barang — agar muncul
      // di Rekap Alokasi & PDF). Barang masuk: kode terisi tapi mutasi_oracle_status
      // tetap default false (logika terbalik — user konfirmasi mutasi manual).
      kode_asset:    (item.kode_asset ?? '').trim() || null,
    }))

    const { error: itemsError } = await supabase
      .from('surat_jalan_items')
      .insert(itemsToInsert)

    if (itemsError) {
      await supabase.from('surat_jalan').delete().eq('id', sjData.id)
      throw new Error(itemsError.message)
    }

    // ── Auto-insert ke staging_area untuk SJ jenis 'masuk' ──────────────────
    // Barang yang dikembalikan ke CGA ditampung di staging agar user bisa
    // menambahkan catatan sebelum DAT terbaru di-upload.
    if (jenis === 'masuk') {
      // Ambil kode tujuan (asal toko) dari tujuan_id
      const { data: tujuanData } = await supabase
        .from('sj_tujuan')
        .select('kode, nama')
        .eq('id', tujuan_id)
        .maybeSingle();
      const asalToko = tujuanData
        ? `${tujuanData.kode} - ${tujuanData.nama}`
        : '';

      const stagingRows = items.map((item: any) => {
        const kode = (item.kode_asset ?? '').trim();
        return {
          kode_asset:    kode || null,
          jenis:         item.jenis ?? '',
          merk:          item.merk ?? '',
          deskripsi:     item.keterangan ?? '',
          catatan:       '',
          asal_toko:     asalToko,
          is_at_lebih:   !kode,   // tidak ada kode_asset = AT Lebih
          sj_id:         sjData.id,
        };
      });
      // Best-effort — kalau gagal, SJ tetap tersimpan (tidak rollback)
      await supabase.from('staging_area').insert(stagingRows);
    }

    return NextResponse.json({ sj: sjData, no_sj })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error' },
      { status: 500 }
    )
  }
}

// ─── PATCH /api/sj — update existing SJ ──────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, tanggal, tujuan_id, pembawa, penerima, approved_by, items, status, reschedule_only, archive_only, is_archived, jenis } = body

    if (!id) {
      return NextResponse.json({ error: 'ID wajib' }, { status: 400 })
    }

    // ── Mode 0: Archive toggle only (cuma update is_archived) ───────────────
    if (archive_only) {
      const { data, error } = await supabase
        .from('surat_jalan')
        .update({ is_archived: !!is_archived, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return NextResponse.json({ sj: data })
    }

    // ── Mode 1: Reschedule only (cuma update tanggal) ──────────────────────
    if (reschedule_only) {
      if (!tanggal) {
        return NextResponse.json({ error: 'Tanggal wajib diisi' }, { status: 400 })
      }
      const { data, error } = await supabase
        .from('surat_jalan')
        .update({ tanggal, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return NextResponse.json({ sj: data })
    }

    // ── Mode 2: Full edit (update header + replace items) ──────────────────
    if (!tanggal || !tujuan_id) {
      return NextResponse.json({ error: 'Tanggal dan tujuan wajib diisi' }, { status: 400 })
    }
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Minimal 1 item barang' }, { status: 400 })
    }

    // Update header.
    // [FIX] `jenis` HANYA di-update kalau body memang mengirimnya. Sebelumnya
    // selalu di-set (`jenis === 'masuk' ? 'masuk' : 'keluar'`), sehingga SJ
    // 'masuk' yang diedit dari halaman Buat SJ (yang tidak mengirim `jenis`)
    // ikut berubah jadi 'keluar'.
    const headerPatch: Record<string, unknown> = {
      tanggal,
      tujuan_id,
      pembawa:     pembawa ?? '',
      penerima:    penerima ?? '',
      approved_by: approved_by ?? '',
      status:      status ?? 'draft',
      updated_at:  new Date().toISOString(),
    }
    if (jenis === 'masuk' || jenis === 'keluar') {
      headerPatch.jenis = jenis
    }

    const { data: sjData, error: sjError } = await supabase
      .from('surat_jalan')
      .update(headerPatch)
      .eq('id', id)
      .select()
      .single()

    if (sjError) throw new Error(sjError.message)

    // Replace items: delete lama, insert baru
    // Lebih simpel & aman dibanding diff per row, payload kecil
    const { error: delError } = await supabase
      .from('surat_jalan_items')
      .delete()
      .eq('sj_id', id)

    if (delError) throw new Error(delError.message)

    const itemsToInsert = items.map((item: any, idx: number) => ({
      sj_id:         id,
      urutan:        idx + 1,
      jenis:         item.jenis ?? '',
      merk:          item.merk ?? '',
      serial_number: item.serial_number ?? '',
      qty:           item.qty ?? 1,
      satuan:        item.satuan ?? 'Unit',
      is_baru:       !!item.is_baru,
      is_aktiva:     !!item.is_aktiva,
      keterangan:    item.keterangan ?? '',
      kode_asset:    (item.kode_asset ?? '').trim() || null,
    }))

    const { error: itemsError } = await supabase
      .from('surat_jalan_items')
      .insert(itemsToInsert)

    if (itemsError) throw new Error(itemsError.message)

    // ── Sinkronkan staging_area untuk SJ jenis 'masuk' ──────────────────────
    // POST menulis ke staging_area dan DELETE membersihkannya, tapi PATCH
    // dulu tidak menyentuhnya sama sekali. Akibatnya setelah SJ masuk diedit:
    // barang yang dihapus tetap nyangkut di staging, dan barang yang baru
    // ditambahkan tidak pernah muncul di sana (jadi tidak bisa diberi catatan
    // sebelum di-sync ke asset_notes saat upload DAT).
    //
    // Pakai pola yang sama dengan items: replace penuh. Catatan yang sudah
    // diketik dipertahankan dengan mencocokkan kode_asset. Barang yang kode
    // asetnya SUDAH muncul di DAT/CGA tidak dimasukkan lagi — aturan yang sama
    // dipakai syncStagingToNotes() saat membersihkan staging.
    const sjJenis = (sjData as { jenis?: string })?.jenis
    if (sjJenis === 'masuk') {
      // Simpan catatan lama (per kode_asset) agar tidak hilang saat replace
      const { data: oldStaging } = await supabase
        .from('staging_area')
        .select('kode_asset, catatan')
        .eq('sj_id', id)

      const catatanLama = new Map<string, string>()
      for (const row of oldStaging ?? []) {
        const k = (row as { kode_asset?: string }).kode_asset
        const c = (row as { catatan?: string }).catatan
        if (k && c && c.trim()) catatanLama.set(k, c)
      }

      await supabase.from('staging_area').delete().eq('sj_id', id)

      // Kode aset yang sudah tercatat di CGA → tidak perlu ditampung staging
      const kodeItems: string[] = items
        .map((it: any) => (it.kode_asset ?? '').trim())
        .filter((k: string) => !!k)

      const sudahDiCGA = new Set<string>()
      if (kodeItems.length > 0) {
        const { data: existingAssets } = await supabase
          .from('assets_raw')
          .select('kode_asset, toko')
          .in('kode_asset', kodeItems)
        for (const r of existingAssets ?? []) {
          const kode = (r as { kode_asset?: string }).kode_asset
          const toko = (r as { toko?: string }).toko ?? ''
          if (kode && /CGA\d/i.test(toko)) sudahDiCGA.add(kode)
        }
      }

      const { data: tujuanData } = await supabase
        .from('sj_tujuan')
        .select('kode, nama')
        .eq('id', tujuan_id)
        .maybeSingle()
      const asalToko = tujuanData
        ? `${tujuanData.kode} - ${tujuanData.nama}`
        : ''

      const stagingRows = items
        .filter((item: any) => {
          const kode = (item.kode_asset ?? '').trim()
          return !kode || !sudahDiCGA.has(kode)
        })
        .map((item: any) => {
          const kode = (item.kode_asset ?? '').trim()
          return {
            kode_asset:  kode || null,
            jenis:       item.jenis ?? '',
            merk:        item.merk ?? '',
            deskripsi:   item.keterangan ?? '',
            catatan:     kode ? (catatanLama.get(kode) ?? '') : '',
            asal_toko:   asalToko,
            is_at_lebih: !kode,
            sj_id:       id,
          }
        })

      // Best-effort — kalau gagal, perubahan SJ tetap tersimpan
      if (stagingRows.length > 0) {
        await supabase.from('staging_area').insert(stagingRows)
      }
    }

    return NextResponse.json({ sj: sjData })

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error' },
      { status: 500 }
    )
  }
}

// ─── DELETE /api/sj?id=xxx — hard delete (CASCADE items) ─────────────────
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID wajib' }, { status: 400 })
    }

    // Hapus item staging yang terkait SJ ini DULU (sebelum SJ dihapus).
    // staging_area.sj_id pakai ON DELETE SET NULL, jadi kalau SJ dihapus
    // duluan, link-nya hilang dan item staging nyangkut selamanya. Hapus
    // di sini best-effort — item staging dari Penerimaan Barang ikut terhapus
    // saat SJ-nya dihapus dari Daftar Surat Jalan.
    await supabase.from('staging_area').delete().eq('sj_id', id)

    const { error } = await supabase.from('surat_jalan').delete().eq('id', id)
    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error' },
      { status: 500 }
    )
  }
}
