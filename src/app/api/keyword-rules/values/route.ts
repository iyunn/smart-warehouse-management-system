import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type CacheEntry = { data: string[]; expires: number }
const cache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 5 * 60 * 1000

function getCached(key: string): string[] | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expires) { cache.delete(key); return null }
  return entry.data
}

function setCached(key: string, data: string[]) {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL_MS })
}

export function invalidateKRValuesCache() {
  cache.clear()
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const ruleType = searchParams.get('type')

    if (!ruleType || (ruleType !== 'jenis' && ruleType !== 'merk')) {
      return NextResponse.json(
        { error: "Query param 'type' wajib (jenis atau merk)" },
        { status: 400 }
      )
    }

    const cacheKey = `kr-values-${ruleType}`
    const cached = getCached(cacheKey)
    if (cached) {
      return NextResponse.json({ values: cached, source: 'cache' })
    }

    const { data, error } = await supabase
      .from('keyword_rules')
      .select('value')
      .eq('rule_type', ruleType)
      .not('value', 'is', null)

    if (error) throw new Error(error.message)

    const seen = new Set<string>()
    const unique: string[] = []
    for (const row of data ?? []) {
      const v = (row.value ?? '').trim()
      if (!v) continue
      const key = v.toLowerCase()
      if (!seen.has(key)) {
        seen.add(key)
        unique.push(v)
      }
    }

    unique.sort((a, b) => a.localeCompare(b))
    setCached(cacheKey, unique)

    return NextResponse.json({ values: unique, source: 'db' })

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error' },
      { status: 500 }
    )
  }
}

// DELETE /api/keyword-rules/values — invalidate cache
export async function DELETE() {
  cache.clear()
  return NextResponse.json({ success: true, message: 'Cache invalidated' })
}
