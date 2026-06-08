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
          is_baru, is_aktiva, keterangan, mutasi_oracle_status,
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
