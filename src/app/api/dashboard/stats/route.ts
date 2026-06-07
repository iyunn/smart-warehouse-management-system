import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { WAREHOUSE_LABELS } from '@/lib/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    const [
      totalAssetsResult,
      totalUnknownResult,
      lastUploadResult,
      assetsForBreakdownResult,
    ] = await Promise.all([
      supabase.from('assets_raw').select('*', { count: 'exact', head: true }),

      supabase.from('assets_clean')
        .select('*', { count: 'exact', head: true })
        .or('jenis.eq.Unknown,merk.eq.Unknown'),

      supabase.from('assets_raw')
        .select('uploaded_at')
        .order('uploaded_at', { ascending: false })
        .limit(1)
        .single(),

      // Ambil minimal field untuk breakdown per CGA
      supabase.from('assets_raw')
        .select('toko, kuantitas, biaya_perolehan, jumlah_tercatat')
        .limit(10000),
    ])

    // ── Aggregate per cost center ───────────────────────────────────────────
    type CGAStats = {
      code: string
      label: string
      items: number
      qty: number
      perolehan: number
      tercatat: number
    }
    const breakdownMap = new Map<string, CGAStats>()

    for (const row of (assetsForBreakdownResult.data ?? [])) {
      const toko = row.toko ?? 'Unknown'
      const code = toko.split(' - ')[0]?.trim() ?? toko

      if (!breakdownMap.has(code)) {
        breakdownMap.set(code, {
          code,
          label: (WAREHOUSE_LABELS as any)[code] ?? code,
          items: 0, qty: 0, perolehan: 0, tercatat: 0,
        })
      }
      const b = breakdownMap.get(code)!
      b.items += 1
      b.qty += row.kuantitas ?? 0
      b.perolehan += row.biaya_perolehan ?? 0
      b.tercatat += row.jumlah_tercatat ?? 0
    }

    const breakdown = Array.from(breakdownMap.values()).sort((a, b) => a.code.localeCompare(b.code))

    const totalAsset      = totalAssetsResult.count ?? 0
    const totalUnknown    = totalUnknownResult.count ?? 0
    const totalClassified = totalAsset - totalUnknown
    const completionPct   = totalAsset === 0 ? 0 : Math.round((totalClassified / totalAsset) * 100)

    return NextResponse.json({
      summary: {
        totalAsset, totalUnknown, totalClassified, completionPct,
      },
      dataStatus: {
        datUpdate:  lastUploadResult.data?.uploaded_at ?? null,
        datClosing: null,
        lppUpdate:  null,
        lppClosing: null,
      },
      breakdown,  // [{code: CGA1, items, qty, perolehan, tercatat}, ...]
    })

  } catch (error) {
    console.error('[dashboard/stats]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}
