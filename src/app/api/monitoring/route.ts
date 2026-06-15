import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const FETCH_SIZE = 1000

// GET /api/monitoring
// Return semua aset DAT (assets_raw + assets_clean join)
// Filter dilakukan client-side untuk konsistensi pattern
export async function GET(_req: NextRequest) {
  try {
    let allData: any[] = []
    let from = 0

    while (true) {
      const { data, error } = await supabase
        .from('assets_clean')
        .select(`
          id,
          jenis,
          merk,
          confidence,
          tag,
          raw:assets_raw!inner (
            id,
            kode_asset,
            deskripsi,
            toko,
            kategori_oracle,
            kuantitas,
            biaya_perolehan,
            jumlah_tercatat,
            invoice_number,
            tanggal_dokumen
          )
        `)
        .range(from, from + FETCH_SIZE - 1)

      if (error) throw new Error(error.message)
      const batch = data ?? []
      allData = [...allData, ...batch]
      if (batch.length < FETCH_SIZE) break
      from += FETCH_SIZE
      if (from > 100000) break
    }

    // Fetch semua catatan, map by kode_asset untuk merge client-side (di server).
    // asset_notes tabel kecil (hanya aset yang punya catatan), jadi ringan.
    const notesMap = new Map<string, string>()
    {
      const { data: notes } = await supabase
        .from('asset_notes')
        .select('kode_asset, catatan')
      for (const n of (notes ?? [])) {
        if (n.kode_asset) notesMap.set(n.kode_asset, n.catatan ?? '')
      }
    }

    // Flatten ke 1 row per aset
    const assets = allData.map((item: any) => {
      const raw = Array.isArray(item.raw) ? item.raw[0] : item.raw
      return {
        clean_id:          item.id,
        jenis:             item.jenis ?? 'Unknown',
        merk:              item.merk ?? 'Unknown',
        confidence:        item.confidence ?? 'low',
        kode_asset:        raw?.kode_asset ?? '',
        deskripsi:         raw?.deskripsi ?? '',
        toko:              raw?.toko ?? '',
        kategori_oracle:   raw?.kategori_oracle ?? '',
        kuantitas:         raw?.kuantitas ?? 1,
        biaya_perolehan:   raw?.biaya_perolehan ?? 0,
        jumlah_tercatat:   raw?.jumlah_tercatat ?? 0,
        tag:               item.tag ?? null,
        invoice_number:    raw?.invoice_number ?? '',
        tanggal_dokumen:   raw?.tanggal_dokumen ?? '',
        catatan:           notesMap.get(raw?.kode_asset ?? '') ?? '',
      }
    })

    return NextResponse.json({ assets, total: assets.length })

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error' },
      { status: 500 }
    )
  }
}

// ════════════════════════════════════════════════════════════════════════
// PATCH /api/monitoring — update catatan per kode_asset
// ════════════════════════════════════════════════════════════════════════
// Upsert ke asset_notes. Kalau catatan dikosongkan → hapus baris (hemat ruang).
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { kode_asset, catatan } = body as { kode_asset?: string; catatan?: string }

    if (!kode_asset) {
      return NextResponse.json({ error: 'kode_asset wajib' }, { status: 400 })
    }

    const trimmed = (catatan ?? '').trim()

    if (!trimmed) {
      // Catatan kosong → hapus baris (tidak simpan baris kosong)
      const { error } = await supabase
        .from('asset_notes')
        .delete()
        .eq('kode_asset', kode_asset)
      if (error) throw new Error(error.message)
      return NextResponse.json({ success: true, catatan: '' })
    }

    // Upsert: insert baru atau update existing
    const { error } = await supabase
      .from('asset_notes')
      .upsert(
        { kode_asset, catatan: trimmed, updated_at: new Date().toISOString() },
        { onConflict: 'kode_asset' }
      )
    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true, catatan: trimmed })

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error' },
      { status: 500 }
    )
  }
}
