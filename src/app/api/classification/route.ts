import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { buildWarehouseFilter, WAREHOUSE_COST_CENTERS } from '@/lib/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const PAGE_SIZE = 20

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const filter = searchParams.get('filter') ?? 'all'
    const search = searchParams.get('search') ?? ''
    const sortField = searchParams.get('sort') ?? 'original_description'
    const sortDir = searchParams.get('dir') ?? 'asc'

    const warehouseFilter = buildWarehouseFilter()
    const validSort = sortField === 'confidence_score' ? 'confidence' : sortField
    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    // Build unknown condition
    let unknownCondition = 'jenis.eq.Unknown,merk.eq.Unknown'
    if (filter === 'unknown_jenis') unknownCondition = 'jenis.eq.Unknown'
    else if (filter === 'unknown_merk') unknownCondition = 'merk.eq.Unknown'
    else if (filter === 'both') unknownCondition = 'jenis.eq.Unknown,merk.eq.Unknown'

    // ── Jalankan semua query parallel di server ───────────────────────────────
    // Hanya 1 round-trip dari browser ke server, bukan 5

    let pageQ = supabase
      .from('assets_clean')
      .select('id, original_description, normalized_description, jenis, merk, kategori, confidence, status, assets_raw!inner(toko)')
      .or(unknownCondition)
      .or(warehouseFilter, { referencedTable: 'assets_raw' })
      .order(validSort, { ascending: sortDir === 'asc' })
      .range(from, to)

    let countQ = supabase
      .from('assets_clean')
      .select('assets_raw!inner(toko)', { count: 'exact', head: true })
      .or(unknownCondition)
      .or(warehouseFilter, { referencedTable: 'assets_raw' })

    if (search.trim()) {
      const q = search.trim()
      pageQ = pageQ.or(`original_description.ilike.%${q}%,normalized_description.ilike.%${q}%`)
      countQ = countQ.or(`original_description.ilike.%${q}%,normalized_description.ilike.%${q}%`)
    }

    const [
      pageResult,
      countResult,
      unknownJenisResult,
      unknownMerkResult,
      totalGudangResult,
    ] = await Promise.all([
      pageQ,
      countQ,
      supabase.from('assets_clean').select('assets_raw!inner(toko)', { count: 'exact', head: true })
        .eq('jenis', 'Unknown').or(warehouseFilter, { referencedTable: 'assets_raw' }),
      supabase.from('assets_clean').select('assets_raw!inner(toko)', { count: 'exact', head: true })
        .eq('merk', 'Unknown').or(warehouseFilter, { referencedTable: 'assets_raw' }),
      supabase.from('assets_clean').select('assets_raw!inner(toko)', { count: 'exact', head: true })
        .or(warehouseFilter, { referencedTable: 'assets_raw' }),
    ])

    if (pageResult.error) throw new Error(pageResult.error.message)
    if (countResult.error) throw new Error(countResult.error.message)

    const totalUnknown = filter === 'all' && !search.trim()
      ? (countResult.count ?? 0)
      : (() => {
          // Untuk summary, pakai unknown jenis + merk (approx)
          return countResult.count ?? 0
        })()

    const unknownJenis = unknownJenisResult.count ?? 0
    const unknownMerk = unknownMerkResult.count ?? 0
    const totalGudang = totalGudangResult.count ?? 0

    return NextResponse.json({
      assets: (pageResult.data ?? []).map((row: any) => ({
        ...row,
        confidence_score: row.confidence ?? null,
      })),
      pagination: {
        page,
        totalCount: countResult.count ?? 0,
        totalPages: Math.max(1, Math.ceil((countResult.count ?? 0) / PAGE_SIZE)),
        pageSize: PAGE_SIZE,
      },
      summary: {
        total: unknownJenis > unknownMerk ? unknownJenis : (
          // total unique yang unknown jenis OR merk
          filter === 'all' && !search.trim() ? (countResult.count ?? 0) : totalUnknown
        ),
        unknownJenis,
        unknownMerk,
        completionPct: totalGudang === 0
          ? 100
          : Math.round(((totalGudang - unknownJenis) / totalGudang) * 100),
      },
    })

  } catch (error) {
    console.error('[classification]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}
