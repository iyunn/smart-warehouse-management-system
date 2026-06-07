import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const FETCH_SIZE = 1000

export async function GET() {
  try {
    // Fetch semua aset dengan classification join
    let allRows: any[] = []
    let from = 0

    while (true) {
      const { data, error } = await supabase
        .from('assets_raw')
        .select(`
          id,
          kode_asset,
          deskripsi,
          toko,
          kategori_oracle,
          assets_clean (jenis, merk)
        `)
        .range(from, from + FETCH_SIZE - 1)

      if (error) throw new Error(error.message)

      const batch = data ?? []
      allRows = [...allRows, ...batch]

      if (batch.length < FETCH_SIZE) break
      from += FETCH_SIZE
      if (from > 50000) break
    }

    // Map data + tambah tag dummy "Pending"
    const assets = allRows.map((row: any) => {
      const cleanData = Array.isArray(row.assets_clean) ? row.assets_clean[0] : row.assets_clean
      const tokoCode  = row.toko?.split(' - ')[0]?.trim() ?? row.toko ?? '-'

      return {
        id:          row.id,
        kode_asset:  row.kode_asset,
        deskripsi:   row.deskripsi,
        kategori:    row.kategori_oracle,
        jenis:       cleanData?.jenis ?? 'Unknown',
        merk:        cleanData?.merk  ?? 'Unknown',
        toko:        row.toko,
        toko_code:   tokoCode,
        // Tag dummy — semua Pending karena LPP belum ada
        reconciliation_tag: 'Pending',
      }
    })

    return NextResponse.json({
      assets,
      total: assets.length,
    })

  } catch (error) {
    console.error('[monitoring]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}
