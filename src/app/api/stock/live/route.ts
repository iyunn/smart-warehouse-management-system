import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Ekstrak kode CGA dari toko — sama dengan Monitoring (regex, robust).
function extractCGA(toko: string): string {
  const m = (toko ?? '').match(/CGA\d/i)
  return m ? m[0].toUpperCase() : ''
}

export interface MerkCount {
  merk: string
  count: number
}

export interface JenisStock {
  jenis: string
  total: number          // total item jenis ini (CGA1 + CGA2)
  cga1: number           // jumlah di CGA1
  cga2: number           // jumlah di CGA2
  merkBreakdown: MerkCount[]  // per merk, urut desc
}

export interface LiveStockResponse {
  success: boolean
  jenisList: JenisStock[]
  totalStock: number     // total semua jenis (CGA1 + CGA2)
  totalCGA1: number
  totalCGA2: number
  updatedAt: string | null
  error?: string
}

/**
 * GET /api/stock/live
 * Live Stock = jumlah item per Jenis Barang, akumulasi CGA1 + CGA2 saja.
 * CGA3 TIDAK dihitung (barang yang akan dimusnahkan, bukan stock).
 *
 * Sumber: assets_clean join assets_raw!inner (SAMA dengan Monitoring) —
 * pakai pagination range loop (assets bisa >1000 baris).
 */
export async function GET() {
  try {
    // Map jenis → { total, cga1, cga2, merk: Map<merk, count> }
    const jenisMap = new Map<string, {
      total: number
      cga1: number
      cga2: number
      merk: Map<string, number>
    }>()

    let totalCGA1 = 0
    let totalCGA2 = 0
    let from = 0
    const FETCH_SIZE = 1000

    while (true) {
      const { data, error } = await supabase
        .from('assets_clean')
        .select(`jenis, merk, raw:assets_raw!inner(toko)`)
        .range(from, from + FETCH_SIZE - 1)

      if (error) throw new Error(error.message)
      const batch = data ?? []

      for (const row of batch) {
        const raw = Array.isArray((row as any).raw) ? (row as any).raw[0] : (row as any).raw
        if (!raw) continue

        const cga = extractCGA(raw.toko)
        // Hanya CGA1 & CGA2 yang dihitung sebagai stock. CGA3 di-skip.
        if (cga !== 'CGA1' && cga !== 'CGA2') continue

        const jenis = ((row as any).jenis ?? '').trim() || 'Unknown'
        const merk  = ((row as any).merk ?? '').trim() || 'Unknown'

        if (!jenisMap.has(jenis)) {
          jenisMap.set(jenis, { total: 0, cga1: 0, cga2: 0, merk: new Map() })
        }
        const j = jenisMap.get(jenis)!
        j.total += 1
        if (cga === 'CGA1') { j.cga1 += 1; totalCGA1 += 1 }
        else                { j.cga2 += 1; totalCGA2 += 1 }
        j.merk.set(merk, (j.merk.get(merk) ?? 0) + 1)
      }

      if (batch.length < FETCH_SIZE) break
      from += FETCH_SIZE
      if (from > 200000) break // safety guard
    }

    // Build response: urut jenis by total desc, merk by count desc
    const jenisList: JenisStock[] = Array.from(jenisMap.entries())
      .map(([jenis, v]) => ({
        jenis,
        total: v.total,
        cga1: v.cga1,
        cga2: v.cga2,
        merkBreakdown: Array.from(v.merk.entries())
          .map(([merk, count]) => ({ merk, count }))
          .sort((a, b) => b.count - a.count),
      }))
      .sort((a, b) => b.total - a.total)

    const totalStock = totalCGA1 + totalCGA2

    // Timestamp DAT terakhir (sama sumber dengan freshness)
    let updatedAt: string | null = null
    {
      const { data: last } = await supabase
        .from('assets_raw')
        .select('uploaded_at')
        .order('uploaded_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      updatedAt = (last as any)?.uploaded_at ?? null
    }

    return NextResponse.json({
      success: true,
      jenisList,
      totalStock,
      totalCGA1,
      totalCGA2,
      updatedAt,
    } satisfies LiveStockResponse)
  } catch (err) {
    return NextResponse.json(
      { success: false, jenisList: [], totalStock: 0, totalCGA1: 0, totalCGA2: 0, updatedAt: null, error: err instanceof Error ? err.message : 'Error' },
      { status: 500 }
    )
  }
}
