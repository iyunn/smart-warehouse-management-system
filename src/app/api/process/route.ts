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

    // ── 3. Batch insert assets_raw (500 rows per batch) ─────────────────────
    // DELETE sudah dilakukan sekali via POST /api/process/clear
    // sebelum batch pertama dikirim dari UploadSection.tsx.
    const BATCH_SIZE = 500
    const rawRows = classifiedData.map(({ raw }: any) => raw)

    let allInsertedRaw: { id: string; kode_asset: string }[] = []

    for (let i = 0; i < rawRows.length; i += BATCH_SIZE) {
      const batch = rawRows.slice(i, i + BATCH_SIZE)
      const { data: batchResult, error: rawError } = await supabase
        .from('assets_raw')
        .insert(batch)
        .select('id, kode_asset')

      if (rawError) {
        console.error(`[route] assets_raw insert error batch ${i}:`, rawError)
        return NextResponse.json({ success: false, error: rawError.message })
      }

      allInsertedRaw = [...allInsertedRaw, ...(batchResult ?? [])]
    }

    // ── 4. Map kode_asset → raw_id ────────────────────────────────────────────
    const rawIdMap = new Map<string, string>()
    for (const row of allInsertedRaw) {
      rawIdMap.set(row.kode_asset, row.id)
    }

    // ── 5. Batch insert assets_clean (500 rows per batch) ────────────────────
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

    for (let i = 0; i < cleanRows.length; i += BATCH_SIZE) {
      const batch = cleanRows.slice(i, i + BATCH_SIZE)
      const { error: cleanError } = await supabase
        .from('assets_clean')
        .insert(batch)

      if (cleanError) {
        console.error(`[route] assets_clean insert error batch ${i}:`, cleanError)
        // Tidak fatal — raw sudah tersimpan, clean bisa di-reclassify nanti
      }
    }

    // ── 6. Re-apply tag "Allocated" berdasarkan surat_jalan_items ───────────
    // DAT full-replace menghapus assets_clean via CASCADE, sehingga tag
    // "Allocated" ikut hilang. Step ini me-restore tag untuk kode_asset yang
    // sudah pernah diinput di Rekap Alokasi — tanpa ini user harus input ulang
    // setiap kali upload DAT baru.
    // Pakai rawIdMap yang sudah dibangun di step 4 untuk lookup O(1).
    {
      const { data: allocatedItems } = await supabase
        .from('surat_jalan_items')
        .select('kode_asset')
        .not('kode_asset', 'is', null)

      if (allocatedItems && allocatedItems.length > 0) {
        // Kumpulkan raw_id yang perlu di-tag dari rawIdMap
        const rawIdsToTag = allocatedItems
          .map((it: any) => rawIdMap.get(it.kode_asset))
          .filter(Boolean) as string[]

        // Deduplicate — satu raw_id mungkin muncul di beberapa SJ item
        const uniqueRawIds = [...new Set(rawIdsToTag)]

        // Batch update assets_clean tag = 'Allocated' (500 per batch)
        for (let i = 0; i < uniqueRawIds.length; i += BATCH_SIZE) {
          const batch = uniqueRawIds.slice(i, i + BATCH_SIZE)
          await supabase
            .from('assets_clean')
            .update({ tag: 'Allocated' })
            .in('raw_id', batch)
        }
      }
    }

    return NextResponse.json({
      success:  true,
      inserted: allInsertedRaw.length,
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
