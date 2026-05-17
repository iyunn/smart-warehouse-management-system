import { NextResponse } from 'next/server'
import { classifyAsset } from '@/lib/classifier'
import { supabase } from '@/lib/supabaseClient'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { data } = body

    // Fetch keyword_rules once before processing loop
    const { data: keywordRules, error: rulesError } = await supabase
      .from('keyword_rules')
      .select('keyword, rule_type, value')

    if (rulesError) {
      console.error(rulesError)
      return NextResponse.json({ success: false, error: 'Failed to fetch keyword rules' })
    }

    let results = []

    for (const item of data) {
      // 1. simpan raw data
      const { data: rawData, error: rawError } = await supabase
        .from('assets_raw')
        .insert({
          kode_asset: item.kode_asset,
          deskripsi: item.deskripsi,
          toko: item.toko,
          kategori_oracle: item.kategori_oracle,
          status: item.status
        })
        .select()
        .single()

      if (rawError) {
        console.error(rawError)
        continue
      }

      // 2. classify
      const result = classifyAsset(item.deskripsi, keywordRules ?? [])

      // 3. simpan clean data
      const { error: cleanError } = await supabase
        .from('assets_clean')
        .insert({
          raw_id: rawData.id,
          original_description: result.original_description,
          normalized_description: result.normalized_description,
          jenis: result.jenis,
          merk: result.merk,
          kategori: result.kategori,
          confidence: result.confidence,
          status: item.status
        })

      if (cleanError) {
        console.error(cleanError)
      }

      results.push(result)
    }

    return NextResponse.json({
      success: true,
      preview: results
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json({
      success: false,
      error: 'Internal Server Error'
    })
  }
}