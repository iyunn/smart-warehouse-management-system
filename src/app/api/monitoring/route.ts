import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const FETCH_SIZE = 1000

// GET /api/monitoring
// Return semua aset DAT (assets_raw + assets_clean join)
// Filter dilakukan client-side untuk konsistensi pattern
export async function GET(_req: NextRequest) {
  try {
    let allData: any[] = []
    let from = 0

    while (true) {
      const { data, error } = await supabase
        .from('assets_clean')
        .select(`
          id,
          jenis,
          merk,
          confidence,
          raw:assets_raw!inner (
            id,
            kode_asset,
            deskripsi,
            toko,
            kategori_oracle,
            kuantitas,
            biaya_perolehan,
            jumlah_tercatat
          )
        `)
        .range(from, from + FETCH_SIZE - 1)

      if (error) throw new Error(error.message)
      const batch = data ?? []
      allData = [...allData, ...batch]
      if (batch.length < FETCH_SIZE) break
      from += FETCH_SIZE
      if (from > 100000) break
    }

    // Flatten ke 1 row per aset
    const assets = allData.map((item: any) => {
      const raw = Array.isArray(item.raw) ? item.raw[0] : item.raw
      return {
        clean_id:          item.id,
        jenis:             item.jenis ?? 'Unknown',
        merk:              item.merk ?? 'Unknown',
        confidence:        item.confidence ?? 'low',
        kode_asset:        raw?.kode_asset ?? '',
        deskripsi:         raw?.deskripsi ?? '',
        toko:              raw?.toko ?? '',
        kategori_oracle:   raw?.kategori_oracle ?? '',
        kuantitas:         raw?.kuantitas ?? 1,
        biaya_perolehan:   raw?.biaya_perolehan ?? 0,
        jumlah_tercatat:   raw?.jumlah_tercatat ?? 0,
      }
    })

    return NextResponse.json({ assets, total: assets.length })

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error' },
      { status: 500 }
    )
  }
}
