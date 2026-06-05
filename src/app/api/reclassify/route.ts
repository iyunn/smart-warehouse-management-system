import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { classifyAsset } from '@/lib/classifier'

// Pakai service role untuk bypass RLS saat batch update
// Kalau belum punya service role key, anon key juga bisa selama policy mengizinkan UPDATE
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const BATCH_SIZE = 500

export async function POST() {
  try {
    // ── 1. Fetch semua keyword_rules ──────────────────────────────────────────
    const { data: keywordRules, error: rulesError } = await supabase
      .from('keyword_rules')
      .select('keyword, rule_type, value')

    if (rulesError) throw new Error(`Failed to fetch keyword rules: ${rulesError.message}`)
    if (!keywordRules || keywordRules.length === 0) {
      return NextResponse.json({ success: true, updated: 0, message: 'No keyword rules found' })
    }

    // ── 2. Fetch semua assets_clean yang masih Unknown ────────────────────────
    // Fetch dengan loop untuk bypass limit 1000
    let allUnknown: any[] = []
    let from = 0
    const FETCH_SIZE = 1000

    while (true) {
      const { data, error } = await supabase
        .from('assets_clean')
        .select('id, original_description, jenis, merk')
        .or('jenis.eq.Unknown,merk.eq.Unknown')
        .range(from, from + FETCH_SIZE - 1)

      if (error) throw new Error(`Failed to fetch assets: ${error.message}`)

      const batch = data ?? []
      allUnknown = [...allUnknown, ...batch]

      if (batch.length < FETCH_SIZE) break
      from += FETCH_SIZE
      if (from > 100000) break // safety cap
    }

    if (allUnknown.length === 0) {
      return NextResponse.json({ success: true, updated: 0, message: 'No unknown assets to reclassify' })
    }

    // ── 3. Reclassify setiap asset ────────────────────────────────────────────
    const toUpdate: Array<{
      id: string
      jenis: string
      merk: string
      confidence: string
    }> = []

    for (const asset of allUnknown) {
      const result = classifyAsset(asset.original_description, keywordRules)

      // Hanya update kalau ada perubahan
      const jenisChanged = result.jenis !== 'Unknown' && result.jenis !== asset.jenis
      const merkChanged = result.merk !== 'Unknown' && result.merk !== asset.merk

      if (jenisChanged || merkChanged) {
        toUpdate.push({
          id: asset.id,
          jenis: jenisChanged ? result.jenis : asset.jenis,
          merk: merkChanged ? result.merk : asset.merk,
          confidence: result.confidence,
        })
      }
    }

    if (toUpdate.length === 0) {
      return NextResponse.json({
        success: true,
        updated: 0,
        message: 'No assets matched new rules',
      })
    }

    // ── 4. Batch update assets_clean ──────────────────────────────────────────
    let totalUpdated = 0
    const errors: string[] = []

    for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
      const batch = toUpdate.slice(i, i + BATCH_SIZE)

      // Update satu per satu dalam batch — Supabase JS tidak support bulk update by id list
      const promises = batch.map((item) =>
        supabase
          .from('assets_clean')
          .update({
            jenis: item.jenis,
            merk: item.merk,
            confidence: item.confidence,
          })
          .eq('id', item.id)
      )

      const results = await Promise.allSettled(promises)

      for (const result of results) {
        if (result.status === 'fulfilled') {
          if (!result.value.error) totalUpdated++
          else errors.push(result.value.error.message)
        } else {
          errors.push(result.reason?.message ?? 'Unknown error')
        }
      }
    }

    return NextResponse.json({
      success: true,
      updated: totalUpdated,
      total_unknown: allUnknown.length,
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined, // max 5 error samples
      message: `Reclassified ${totalUpdated} of ${allUnknown.length} unknown assets`,
    })

  } catch (error) {
    console.error('[reclassify]', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}
