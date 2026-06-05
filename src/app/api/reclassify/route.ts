import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { classifyAsset } from '@/lib/classifier'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const BATCH_SIZE = 500

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    
    // ── Mode detection ────────────────────────────────────────────────────────
    // revert_merk / revert_jenis → targeted revert setelah rule dihapus
    // (kosong) → normal reclassify untuk aset Unknown
    const revertMerk: string | undefined = body.revert_merk
    const revertJenis: string | undefined = body.revert_jenis

    const isRevertMode = !!(revertMerk || revertJenis)

    // ── 1. Fetch keyword_rules yang aktif ─────────────────────────────────────
    const { data: keywordRules, error: rulesError } = await supabase
      .from('keyword_rules')
      .select('keyword, rule_type, value')

    if (rulesError) throw new Error(`Failed to fetch keyword rules: ${rulesError.message}`)

    // ── 2. Fetch target aset ──────────────────────────────────────────────────
    let allTargets: any[] = []
    let from = 0
    const FETCH_SIZE = 1000

    while (true) {
      let query = supabase
        .from('assets_clean')
        .select('id, original_description, jenis, merk')

      if (isRevertMode) {
        // Targeted: hanya aset yang nilainya cocok dengan rule yang dihapus
        const conditions: string[] = []
        if (revertMerk) conditions.push(`merk.eq.${revertMerk}`)
        if (revertJenis) conditions.push(`jenis.eq.${revertJenis}`)
        query = query.or(conditions.join(','))
      } else {
        // Normal: hanya aset yang masih Unknown
        query = query.or('jenis.eq.Unknown,merk.eq.Unknown')
      }

      const { data, error } = await query.range(from, from + FETCH_SIZE - 1)

      if (error) throw new Error(`Failed to fetch assets: ${error.message}`)

      const batch = data ?? []
      allTargets = [...allTargets, ...batch]

      if (batch.length < FETCH_SIZE) break
      from += FETCH_SIZE
      if (from > 100000) break
    }

    if (allTargets.length === 0) {
      return NextResponse.json({
        success: true,
        updated: 0,
        total_unknown: 0,
        message: isRevertMode
          ? 'Tidak ada aset yang terdampak rule yang dihapus'
          : 'Tidak ada aset unknown untuk diklasifikasi',
      })
    }

    // ── 3. Reclassify setiap target ───────────────────────────────────────────
    const toUpdate: Array<{ id: string; jenis: string; merk: string; confidence: string }> = []

    for (const asset of allTargets) {
      if (isRevertMode) {
        // Revert mode: reset nilai yang terdampak ke Unknown dulu,
        // lalu coba classify ulang dengan rules yang tersisa
        const currentJenis = revertJenis && asset.jenis === revertJenis ? 'Unknown' : asset.jenis
        const currentMerk = revertMerk && asset.merk === revertMerk ? 'Unknown' : asset.merk

        // Classify ulang dari original description
        const result = classifyAsset(asset.original_description, keywordRules ?? [])

        // Pakai hasil classifier kalau berhasil, atau nilai yang sudah direset
        const newJenis = result.jenis !== 'Unknown' ? result.jenis : currentJenis
        const newMerk = result.merk !== 'Unknown' ? result.merk : currentMerk

        // Hitung confidence baru
        let confidence: string = 'low'
        if (newJenis !== 'Unknown' && newMerk !== 'Unknown') confidence = 'high'
        else if (newJenis !== 'Unknown' || newMerk !== 'Unknown') confidence = 'medium'

        toUpdate.push({ id: asset.id, jenis: newJenis, merk: newMerk, confidence })
      } else {
        // Normal mode: hanya update kalau classifier bisa mengisi yang Unknown
        const result = classifyAsset(asset.original_description, keywordRules ?? [])

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
    }

    if (toUpdate.length === 0) {
      return NextResponse.json({
        success: true,
        updated: 0,
        total_unknown: allTargets.length,
        message: isRevertMode
          ? 'Aset sudah di-revert, tidak ada perubahan tambahan'
          : 'Tidak ada aset yang cocok dengan rule baru',
      })
    }

    // ── 4. Batch update ───────────────────────────────────────────────────────
    let totalUpdated = 0

    for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
      const batch = toUpdate.slice(i, i + BATCH_SIZE)

      const results = await Promise.allSettled(
        batch.map((item) =>
          supabase
            .from('assets_clean')
            .update({ jenis: item.jenis, merk: item.merk, confidence: item.confidence })
            .eq('id', item.id)
        )
      )

      for (const result of results) {
        if (result.status === 'fulfilled' && !result.value.error) totalUpdated++
      }
    }

    return NextResponse.json({
      success: true,
      updated: totalUpdated,
      total_unknown: allTargets.length,
      message: isRevertMode
        ? `Revert selesai: ${totalUpdated} aset diperbarui`
        : `Reclassified ${totalUpdated} of ${allTargets.length} unknown assets`,
    })

  } catch (error) {
    console.error('[reclassify]', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}
