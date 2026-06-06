import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { buildWarehouseFilter } from '@/lib/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const PAGE_SIZE = 20

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page     = parseInt(searchParams.get('page')   ?? '1')
    const filter   = searchParams.get('filter')  ?? 'all'
    const search   = searchParams.get('search')  ?? ''
    const sortField = searchParams.get('sort')   ?? 'original_description'
    const sortDir  = searchParams.get('dir')     ?? 'asc'

    const warehouseFilter = buildWarehouseFilter()
    const validSort = sortField === 'confidence_score' ? 'confidence' : sortField
    const from = (page - 1) * PAGE_SIZE
    const to   = from + PAGE_SIZE - 1
    const searchQ = search.trim()

    // Build unknown condition berdasarkan filter tab
    let unknownCondition = 'jenis.eq.Unknown,merk.eq.Unknown'
    if (filter === 'unknown_jenis') unknownCondition = 'jenis.eq.Unknown'
    else if (filter === 'unknown_merk') unknownCondition = 'merk.eq.Unknown'

    // ── Query page data ───────────────────────────────────────────────────────
    let pageQ = supabase
      .from('assets_clean')
      .select('id, original_description, normalized_description, jenis, merk, kategori, confidence, status, assets_raw!inner(toko)')
      .or(unknownCondition)
      .or(warehouseFilter, { referencedTable: 'assets_raw' })
      .order(validSort, { ascending: sortDir === 'asc' })
      .range(from, to)

    // ── Query count filtered ──────────────────────────────────────────────────
    let countQ = supabase
      .from('assets_clean')
      .select('assets_raw!inner(toko)', { count: 'exact', head: true })
      .or(unknownCondition)
      .or(warehouseFilter, { referencedTable: 'assets_raw' })

    if (searchQ) {
      pageQ  = pageQ.or(`original_description.ilike.%${searchQ}%,normalized_description.ilike.%${searchQ}%`)
      countQ = countQ.or(`original_description.ilike.%${searchQ}%,normalized_description.ilike.%${searchQ}%`)
    }

    // ── Run 6 queries parallel di server ─────────────────────────────────────
    const [
      pageResult,
      countResult,
      unknownJenisResult,
      unknownMerkResult,
      totalGudangResult,
      totalUnknownResult,
    ] = await Promise.all([
      pageQ,
      countQ,
      // count: unknown jenis
      supabase.from('assets_clean')
        .select('assets_raw!inner(toko)', { count: 'exact', head: true })
        .eq('jenis', 'Unknown')
        .or(warehouseFilter, { referencedTable: 'assets_raw' }),
      // count: unknown merk
      supabase.from('assets_clean')
        .select('assets_raw!inner(toko)', { count: 'exact', head: true })
        .eq('merk', 'Unknown')
        .or(warehouseFilter, { referencedTable: 'assets_raw' }),
      // count: total semua aset gudang
      supabase.from('assets_clean')
        .select('assets_raw!inner(toko)', { count: 'exact', head: true })
        .or(warehouseFilter, { referencedTable: 'assets_raw' }),
      // count: total unknown (jenis OR merk) — untuk summary card
      supabase.from('assets_clean')
        .select('assets_raw!inner(toko)', { count: 'exact', head: true })
        .or('jenis.eq.Unknown,merk.eq.Unknown')
        .or(warehouseFilter, { referencedTable: 'assets_raw' }),
    ])

    if (pageResult.error) throw new Error(pageResult.error.message)
    if (countResult.error) throw new Error(countResult.error.message)

    const unknownJenis    = unknownJenisResult.count  ?? 0
    const unknownMerk     = unknownMerkResult.count   ?? 0
    const totalGudang     = totalGudangResult.count   ?? 0
    const totalUnknown    = totalUnknownResult.count  ?? 0
    const totalClassified = totalGudang - totalUnknown

    return NextResponse.json({
      assets: (pageResult.data ?? []).map((row: any) => ({
        ...row,
        confidence_score: row.confidence ?? null,
      })),
      pagination: {
        page,
        totalCount:  countResult.count ?? 0,
        totalPages:  Math.max(1, Math.ceil((countResult.count ?? 0) / PAGE_SIZE)),
        pageSize:    PAGE_SIZE,
      },
      summary: {
        total:           totalUnknown,
        unknownJenis,
        unknownMerk,
        completionPct:   totalGudang === 0
          ? 100
          : Math.round((totalClassified / totalGudang) * 100),
        // Untuk subtitle "X / Y classified" di Completion card
        totalClassified,
        totalGudang,
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
