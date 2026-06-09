import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

let cachedJenis: string[] | null = null
let lastFetched = 0
const CACHE_TTL = 5 * 60 * 1000

export async function GET() {
  try {
    const now = Date.now()
    if (cachedJenis && (now - lastFetched) < CACHE_TTL) {
      return NextResponse.json({ jenis: cachedJenis, cached: true })
    }

    let allRows: any[] = []
    let from = 0
    const FETCH_SIZE = 1000

    while (true) {
      const { data, error } = await supabase
        .from('assets_clean')
        .select('jenis')
        .neq('jenis', 'Unknown')
        .range(from, from + FETCH_SIZE - 1)

      if (error) throw new Error(error.message)
      const batch = data ?? []
      allRows = [...allRows, ...batch]
      if (batch.length < FETCH_SIZE) break
      from += FETCH_SIZE
      if (from > 50000) break
    }

    const uniqueSet = new Set<string>()
    for (const row of allRows) {
      if (row.jenis) uniqueSet.add(row.jenis)
    }

    cachedJenis = Array.from(uniqueSet).sort((a, b) => a.localeCompare(b))
    lastFetched = now

    return NextResponse.json({ jenis: cachedJenis, cached: false })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error' },
      { status: 500 }
    )
  }
}

// DELETE /api/sj/master/jenis — invalidate cache
export async function DELETE() {
  cachedJenis = null
  lastFetched = 0
  return NextResponse.json({ success: true, message: 'Jenis cache invalidated' })
}
