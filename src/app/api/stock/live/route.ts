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

export interface SubCoceCount {
  subCoce: string   // nilai sub_coce (prodsus), mis. "FRDCHICKEN", "SAYB"
  count: number
}

export interface JenisStock {
  jenis: string
  kategori: string       // kategori_oracle mentah, mis. "C - PERALATAN KOMPUTER"
  total: number          // total item jenis ini (CGA1 + CGA2)
  cga1: number           // jumlah di CGA1
  cga2: number           // jumlah di CGA2
  merkBreakdown: MerkCount[]  // per merk, urut desc
  // ── Prodsus / Non-prodsus (dari kolom sub_coce) ──
  nonProdsus: number         // sub_coce == '0'
  nonProdsusCga1: number
  nonProdsusCga2: number
  prodsus: number            // sub_coce != '0'
  prodsusCga1: number
  prodsusCga2: number
  prodsusBreakdown: SubCoceCount[]  // per nilai sub_coce (prodsus), urut desc
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
    // Map jenis → agregasi termasuk prodsus/non-prodsus + breakdown sub_coce
    const jenisMap = new Map<string, {
      total: number
      cga1: number
      cga2: number
      kategori: string
      merk: Map<string, number>
      nonProdsus: number
      nonProdsusCga1: number
      nonProdsusCga2: number
      prodsus: number
      prodsusCga1: number
      prodsusCga2: number
      subCoce: Map<string, number>   // per nilai sub_coce (prodsus saja)
    }>()

    let totalCGA1 = 0
    let totalCGA2 = 0
    let from = 0
    const FETCH_SIZE = 1000

    while (true) {
      const { data, error } = await supabase
        .from('assets_clean')
        .select(`jenis, merk, raw:assets_raw!inner(toko, kategori_oracle, sub_coce, is_prodsus)`)
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
        const kategori = (raw.kategori_oracle ?? '').trim() || 'Tanpa Kategori'
        const subCoce = (raw.sub_coce ?? '0').toString().trim() || '0'
        // Non-prodsus kalau sub_coce semua nol (0, 00000000, dst) atau kosong.
        // Selain itu prodsus (FRDCHICKEN, SAYB, PCAFE, YCGOLD, dll).
        const isProdsus = !/^0*$/.test(subCoce)

        if (!jenisMap.has(jenis)) {
          jenisMap.set(jenis, {
            total: 0, cga1: 0, cga2: 0, kategori, merk: new Map(),
            nonProdsus: 0, nonProdsusCga1: 0, nonProdsusCga2: 0,
            prodsus: 0, prodsusCga1: 0, prodsusCga2: 0,
            subCoce: new Map(),
          })
        }
        const j = jenisMap.get(jenis)!
        j.total += 1
        if (cga === 'CGA1') { j.cga1 += 1; totalCGA1 += 1 }
        else                { j.cga2 += 1; totalCGA2 += 1 }
        j.merk.set(merk, (j.merk.get(merk) ?? 0) + 1)

        // Prodsus vs non-prodsus (dengan CGA split masing-masing)
        if (isProdsus) {
          j.prodsus += 1
          if (cga === 'CGA1') j.prodsusCga1 += 1; else j.prodsusCga2 += 1
          j.subCoce.set(subCoce, (j.subCoce.get(subCoce) ?? 0) + 1)
        } else {
          j.nonProdsus += 1
          if (cga === 'CGA1') j.nonProdsusCga1 += 1; else j.nonProdsusCga2 += 1
        }
      }

      if (batch.length < FETCH_SIZE) break
      from += FETCH_SIZE
      if (from > 200000) break // safety guard
    }

    // Build response: sertakan kategori, merk & prodsus breakdown urut desc.
    const jenisList: JenisStock[] = Array.from(jenisMap.entries())
      .map(([jenis, v]) => ({
        jenis,
        kategori: v.kategori,
        total: v.total,
        cga1: v.cga1,
        cga2: v.cga2,
        merkBreakdown: Array.from(v.merk.entries())
          .map(([merk, count]) => ({ merk, count }))
          .sort((a, b) => b.count - a.count),
        nonProdsus: v.nonProdsus,
        nonProdsusCga1: v.nonProdsusCga1,
        nonProdsusCga2: v.nonProdsusCga2,
        prodsus: v.prodsus,
        prodsusCga1: v.prodsusCga1,
        prodsusCga2: v.prodsusCga2,
        prodsusBreakdown: Array.from(v.subCoce.entries())
          .map(([subCoce, count]) => ({ subCoce, count }))
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
