import { NextResponse } from 'next/server'
import { classifyAsset } from '@/lib/classifier'
import { supabase } from '@/lib/supabaseClient'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { data } = body

    if (!data || data.length === 0) {
      return NextResponse.json({ success: false, error: 'No data provided' })
    }

    // ── 1. Fetch keyword_rules sekali ─────────────────────────────────────────
    const { data: keywordRules, error: rulesError } = await supabase
      .from('keyword_rules')
      .select('keyword, rule_type, value')

    if (rulesError) {
      return NextResponse.json({ success: false, error: 'Failed to fetch keyword rules' })
    }

    // ── 2. Classify semua data di memory ──────────────────────────────────────
    const classifiedData = data.map((item: any) => ({
      raw: {
        kode_asset:      item.kode_asset,
        deskripsi:       item.deskripsi,
        toko:            item.toko,
        kategori_oracle: item.kategori_oracle,
        status:          item.status,
        kuantitas:       item.kuantitas       ?? 1,
        biaya_perolehan: item.biaya_perolehan ?? 0,
        jumlah_tercatat: item.jumlah_tercatat ?? 0,
      },
      result: classifyAsset(item.deskripsi, keywordRules ?? []),
    }))

    // ── 3. Bulk upsert assets_raw ─────────────────────────────────────────────
    const rawRows = classifiedData.map(({ raw }: any) => raw)

    const { data: upsertedRaw, error: rawError } = await supabase
      .from('assets_raw')
      .upsert(rawRows, {
        onConflict: 'kode_asset',
        ignoreDuplicates: false,
      })
      .select('id, kode_asset')

    if (rawError) {
      console.error('[route] assets_raw upsert error:', rawError)
      return NextResponse.json({ success: false, error: rawError.message })
    }

    // ── 4. Map kode_asset → raw_id ────────────────────────────────────────────
    const rawIdMap = new Map<string, string>()
    for (const row of upsertedRaw ?? []) {
      rawIdMap.set(row.kode_asset, row.id)
    }

    // ── 5. Bulk upsert assets_clean ───────────────────────────────────────────
    const cleanRows = classifiedData
      .map(({ raw, result }: any) => {
        const rawId = rawIdMap.get(raw.kode_asset)
        if (!rawId) return null
        return {
          raw_id:                 rawId,
          original_description:   result.original_description,
          normalized_description: result.normalized_description,
          jenis:                  result.jenis,
          merk:                   result.merk,
          kategori:               result.kategori,
          confidence:             result.confidence,
          status:                 raw.status,
        }
      })
      .filter(Boolean)

    const { error: cleanError } = await supabase
      .from('assets_clean')
      .upsert(cleanRows, {
        onConflict: 'raw_id',
        ignoreDuplicates: false,
      })

    if (cleanError) {
      console.error('[route] assets_clean upsert error:', cleanError)
      // Tidak fatal — raw sudah tersimpan, clean bisa di-reclassify nanti
    }

    return NextResponse.json({
      success: true,
      inserted: upsertedRaw?.length ?? 0,
      preview:  classifiedData.slice(0, 5).map(({ result }: any) => result),
    })

  } catch (error) {
    console.error('[route] error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
