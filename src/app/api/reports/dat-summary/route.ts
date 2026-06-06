import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { renderToBuffer } from '@react-pdf/renderer'
import { DATSummaryDocument } from '@/components/reports/DATSummaryDocument'
import { WAREHOUSE_COST_CENTERS } from '@/lib/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const costCenterFilter = searchParams.get('cost_center') // 'ALL' | 'CGA1' | 'CGA2' | 'CGA3'

    // ── 1. Build toko filter ──────────────────────────────────────────────────
    const targetCenters = costCenterFilter && costCenterFilter !== 'ALL'
      ? [costCenterFilter]
      : [...WAREHOUSE_COST_CENTERS]

    // ── 2. Query assets_raw JOIN assets_clean untuk aset gudang ───────────────
    // Fetch semua sekaligus dengan pagination
    let allData: any[] = []
    let from = 0
    const FETCH_SIZE = 1000

    const tokoConditions = targetCenters.map(c => `toko.ilike.${c}%`).join(',')

    while (true) {
      const { data, error } = await supabase
        .from('assets_raw')
        .select(`
          id,
          kode_asset,
          toko,
          kategori_oracle,
          kuantitas,
          biaya_perolehan,
          jumlah_tercatat,
          assets_clean (
            jenis,
            merk,
            confidence
          )
        `)
        .or(tokoConditions)
        .range(from, from + FETCH_SIZE - 1)

      if (error) throw new Error(error.message)

      const batch = data ?? []
      allData = [...allData, ...batch]

      if (batch.length < FETCH_SIZE) break
      from += FETCH_SIZE
      if (from > 100000) break
    }

    // ── 3. Agregasi data: toko → kategori_oracle → jenis ─────────────────────
    // Struktur: Map<toko, Map<kategori, Map<jenis, { item, qty, perolehan, tercatat }>>>
    
    type JenisData = {
      jenis: string
      item: number
      qty: number
      perolehan: number
      tercatat: number
    }

    type KategoriData = {
      kategori: string
      items: JenisData[]
      totalItem: number
      totalQty: number
      totalPerolehan: number
      totalTercatat: number
    }

    type TokoData = {
      toko: string
      tokoCode: string
      kategoris: KategoriData[]
      totalItem: number
      totalQty: number
      totalPerolehan: number
      totalTercatat: number
    }

    const tokoMap = new Map<string, Map<string, Map<string, JenisData>>>()

    for (const row of allData) {
      const toko = row.toko ?? 'Unknown'
      const kategori = row.kategori_oracle ?? 'Unknown'
      const cleanData = Array.isArray(row.assets_clean) ? row.assets_clean[0] : row.assets_clean
      const jenis = cleanData?.jenis ?? 'Unknown'
      const qty = row.kuantitas ?? 1
      const perolehan = row.biaya_perolehan ?? 0
      const tercatat = row.jumlah_tercatat ?? 0

      if (!tokoMap.has(toko)) tokoMap.set(toko, new Map())
      const kategoriMap = tokoMap.get(toko)!

      if (!kategoriMap.has(kategori)) kategoriMap.set(kategori, new Map())
      const jenisMap = kategoriMap.get(kategori)!

      if (!jenisMap.has(jenis)) {
        jenisMap.set(jenis, { jenis, item: 0, qty: 0, perolehan: 0, tercatat: 0 })
      }
      const jenisData = jenisMap.get(jenis)!
      jenisData.item += 1
      jenisData.qty += qty
      jenisData.perolehan += perolehan
      jenisData.tercatat += tercatat
    }

    // ── 4. Convert Map ke array yang bisa dirender ────────────────────────────
    const reportData: TokoData[] = []

    for (const [toko, kategoriMap] of tokoMap) {
      // Ekstrak kode CGA dari nama toko (misal "CGA1 - CADANGAN..." → "CGA1")
      const tokoCode = toko.split(' - ')[0]?.trim() ?? toko

      const kategoris: KategoriData[] = []
      let tokoTotalItem = 0
      let tokoTotalQty = 0
      let tokoTotalPerolehan = 0
      let tokoTotalTercatat = 0

      for (const [kategori, jenisMap] of kategoriMap) {
        const items = Array.from(jenisMap.values())
          .sort((a, b) => a.jenis.localeCompare(b.jenis))

        const kategoriTotal = items.reduce(
          (acc, i) => ({
            item: acc.item + i.item,
            qty: acc.qty + i.qty,
            perolehan: acc.perolehan + i.perolehan,
            tercatat: acc.tercatat + i.tercatat,
          }),
          { item: 0, qty: 0, perolehan: 0, tercatat: 0 }
        )

        kategoris.push({
          kategori,
          items,
          totalItem: kategoriTotal.item,
          totalQty: kategoriTotal.qty,
          totalPerolehan: kategoriTotal.perolehan,
          totalTercatat: kategoriTotal.tercatat,
        })

        tokoTotalItem += kategoriTotal.item
        tokoTotalQty += kategoriTotal.qty
        tokoTotalPerolehan += kategoriTotal.perolehan
        tokoTotalTercatat += kategoriTotal.tercatat
      }

      // Sort kategori alphabetically
      kategoris.sort((a, b) => a.kategori.localeCompare(b.kategori))

      reportData.push({
        toko,
        tokoCode,
        kategoris,
        totalItem: tokoTotalItem,
        totalQty: tokoTotalQty,
        totalPerolehan: tokoTotalPerolehan,
        totalTercatat: tokoTotalTercatat,
      })
    }

    // Sort by toko code (CGA1 → CGA2 → CGA3)
    reportData.sort((a, b) => a.tokoCode.localeCompare(b.tokoCode))

    // ── 5. Generate PDF ───────────────────────────────────────────────────────
    const pdfBuffer = await renderToBuffer(
      DATSummaryDocument({ data: reportData, generatedAt: new Date().toISOString() })
    )

    const filename = `DAT-Summary-${costCenterFilter ?? 'ALL'}-${new Date().toISOString().slice(0, 10)}.pdf`

    // Fix: wrap dengan Uint8Array
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('[report/dat-summary]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}
