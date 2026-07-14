import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { WAREHOUSE_LABELS } from '@/lib/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    // ── Hitung rentang bulan berjalan untuk Card 3 (daily shipment) ─────────
    const now = new Date()
    // Gunakan WIB (UTC+7) untuk tanggal — hindari off-by-one saat tengah malam
    const wibOffset = 7 * 60 * 60 * 1000
    const nowWIB = new Date(now.getTime() + wibOffset)
    const todayIso = nowWIB.toISOString().slice(0, 10)
    const monthStartIso = todayIso.slice(0, 7) + '-01'
    const bulanLabel = nowWIB.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

    const [
      totalAssetsResult,
      totalUnknownResult,
      lastUploadResult,
      assetsForBreakdownResult,
      // ── Sesi 4: warning counts ────────────────────────────────────────────
      // Barang AT yang sudah dikirim (ada SJ) tapi belum input kode aset
      belumInputResult,
      // Barang AT yang sudah input kode aset tapi belum dicentang mutasi Oracle
      belumMutasiResult,
      // Barang AT yang belum dicentang mutasi WT
      belumMutasiWTResult,
      // ── Rekap Pengiriman ──────────────────────────────────────────────────
      // Card 1: semua AT items (tanpa filter tanggal) untuk mutasi progress
      atItemsResult,
      // Card 2: SJ IDs bulan berjalan untuk top jenis
      assetsCleanJenisResult,
      // Card 3: SJ bulan berjalan berbasis WIB untuk daily shipment
      sjBulanResult,
    ] = await Promise.all([
      supabase.from('assets_raw').select('*', { count: 'exact', head: true }),

      supabase.from('assets_clean')
        .select('*', { count: 'exact', head: true })
        .or('jenis.eq.Unknown,merk.eq.Unknown'),

      supabase.from('assets_raw')
        .select('uploaded_at')
        .order('uploaded_at', { ascending: false })
        .limit(1)
        .single(),

      // Ambil minimal field untuk breakdown per CGA
      supabase.from('assets_raw')
        .select('toko, kuantitas, biaya_perolehan, jumlah_tercatat')
        .limit(10000),

      // Belum input kode aset: item AT, kode_asset NULL
      supabase.from('surat_jalan_items')
        .select('*', { count: 'exact', head: true })
        .eq('is_aktiva', true)
        .is('kode_asset', null),

      // Belum mutasi Oracle: item AT, mutasi_oracle_status false
      supabase.from('surat_jalan_items')
        .select('*', { count: 'exact', head: true })
        .eq('is_aktiva', true)
        .eq('mutasi_oracle_status', false),

      // Belum mutasi WT: item AT, mutasi_wt_status false
      supabase.from('surat_jalan_items')
        .select('*', { count: 'exact', head: true })
        .eq('is_aktiva', true)
        .eq('mutasi_wt_status', false),

      // AT items dari SJ status submitted+completed — ALL time untuk Card 1 (mutasi progress).
      // Ambil semua item tanpa filter tanggal karena mutasi progress perlu data keseluruhan.
      supabase.from('surat_jalan_items')
        .select(`
          mutasi_oracle_status,
          sj:surat_jalan!inner (tanggal, status)
        `)
        .eq('is_aktiva', true)
        .limit(50000),

      // SJ bulan berjalan untuk Card 3 (daily shipment) — filter tanggal di DB langsung
      // menggunakan todayIso berbasis WIB agar tidak off-by-one saat tengah malam.
      supabase.from('surat_jalan')
        .select('id, tanggal')
        .in('status', ['submitted', 'completed'])
        .gte('tanggal', monthStartIso)
        .lte('tanggal', todayIso),

      // Card 2 source: fetch SJ IDs bulan berjalan dulu (2-step) untuk filter
      // tanggal yang reliable — filter via join PostgREST tidak reliable.
      // Semua items dihitung (tidak filter kode_asset) karena yang mau disorot
      // adalah semua barang yang keluar, bukan hanya yang sudah dialokasikan.
      supabase.from('surat_jalan')
        .select('id')
        .in('status', ['submitted', 'completed'])
        .gte('tanggal', monthStartIso)
        .lte('tanggal', todayIso),
    ])

    // ── Aggregate per cost center ───────────────────────────────────────────
    type CGAStats = {
      code: string
      label: string
      items: number
      qty: number
      perolehan: number
      tercatat: number
    }
    const breakdownMap = new Map<string, CGAStats>()

    for (const row of (assetsForBreakdownResult.data ?? [])) {
      const toko = row.toko ?? 'Unknown'
      const code = toko.split(' - ')[0]?.trim() ?? toko

      if (!breakdownMap.has(code)) {
        breakdownMap.set(code, {
          code,
          label: (WAREHOUSE_LABELS as any)[code] ?? code,
          items: 0, qty: 0, perolehan: 0, tercatat: 0,
        })
      }
      const b = breakdownMap.get(code)!
      b.items += 1
      b.qty += row.kuantitas ?? 0
      b.perolehan += row.biaya_perolehan ?? 0
      b.tercatat += row.jumlah_tercatat ?? 0
    }

    const breakdown = Array.from(breakdownMap.values()).sort((a, b) => a.code.localeCompare(b.code))

    // ════════════════════════════════════════════════════════════════════════
    // Rekap Pengiriman processing
    // ════════════════════════════════════════════════════════════════════════

    // ── Card 1: Mutasi Progress ─────────────────────────────────────────────
    // Total AT yang keluar (SJ submitted+completed) vs yang sudah mutasi.
    // Terlama: cari item belum mutasi dengan tanggal SJ paling lama (hari).
    let mutasiTotalAT = 0
    let mutasiSudah = 0
    let oldestUnmutatedDate: string | null = null

    for (const it of (atItemsResult.data ?? [])) {
      mutasiTotalAT += 1
      if (it.mutasi_oracle_status) {
        mutasiSudah += 1
      } else {
        // Item belum mutasi — track tanggal SJ-nya untuk cari yang terlama
        const sj = Array.isArray(it.sj) ? it.sj[0] : it.sj
        const tgl = sj?.tanggal as string | undefined
        if (tgl && (!oldestUnmutatedDate || tgl < oldestUnmutatedDate)) {
          oldestUnmutatedDate = tgl
        }
      }
    }

    const mutasiBelum = mutasiTotalAT - mutasiSudah
    const mutasiProgressPct = mutasiTotalAT === 0
      ? 0
      : Math.round((mutasiSudah / mutasiTotalAT) * 100)

    // Hitung hari sejak SJ terlama yang belum mutasi
    let terlamaHari: number | null = null
    if (oldestUnmutatedDate) {
      const oldest = new Date(oldestUnmutatedDate)
      const diffMs = now.getTime() - oldest.getTime()
      terlamaHari = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
    }

    // ── Card 2: Top 5 Jenis Keluar (bulan berjalan) ─────────────────────────
    // Step 2: fetch items berdasarkan SJ IDs bulan berjalan, aggregate per jenis.
    const sjIds = (assetsCleanJenisResult.data ?? []).map((r: any) => r.id).filter(Boolean)
    const jenisMap = new Map<string, number>()

    if (sjIds.length > 0) {
      // Batch fetch items by sj_id (max 500 IDs per request)
      const SJ_BATCH = 500
      for (let i = 0; i < sjIds.length; i += SJ_BATCH) {
        const batchIds = sjIds.slice(i, i + SJ_BATCH)
        const { data: itemsBatch } = await supabase
          .from('surat_jalan_items')
          .select('jenis')
          .in('sj_id', batchIds)

        for (const row of (itemsBatch ?? [])) {
          const jenis = (row.jenis ?? '').trim()
          if (!jenis) continue
          jenisMap.set(jenis, (jenisMap.get(jenis) ?? 0) + 1)
        }
      }
    }

    const topJenisBelumAlokasi = Array.from(jenisMap.entries())
      .map(([jenis, total]) => ({ jenis, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    // ── Card 3: Daily Shipment (bulan berjalan) ────────────────────────────
    // Gunakan sjBulanResult (sudah difilter bulan berjalan + status di DB).
    // Count items per SJ tanggal dengan 2-step: fetch item counts per sj_id.
    const sjBulanIds = (sjBulanResult.data ?? []).map((r: any) => r.id).filter(Boolean)
    const sjTanggalMap = new Map<string, string>() // id -> tanggal
    for (const r of (sjBulanResult.data ?? [])) {
      if (r.id && r.tanggal) sjTanggalMap.set(r.id, r.tanggal)
    }

    const dailyMap = new Map<string, number>()
    if (sjBulanIds.length > 0) {
      const BATCH = 500
      for (let i = 0; i < sjBulanIds.length; i += BATCH) {
        const batchIds = sjBulanIds.slice(i, i + BATCH)
        const { data: batchItems } = await supabase
          .from('surat_jalan_items')
          .select('sj_id')
          .eq('is_aktiva', true)
          .in('sj_id', batchIds)

        for (const row of (batchItems ?? [])) {
          const tgl = sjTanggalMap.get(row.sj_id)
          if (!tgl) continue
          dailyMap.set(tgl, (dailyMap.get(tgl) ?? 0) + 1)
        }
      }
    }

    // Fill semua tanggal di bulan berjalan (1 sampai hari ini WIB) dengan 0
    const dailyShipment: { tanggal: string; total: number }[] = []
    const startDay = new Date(monthStartIso + 'T00:00:00+07:00')
    const endDay   = new Date(todayIso   + 'T00:00:00+07:00')
    const cursor   = new Date(startDay)
    while (cursor <= endDay) {
      const iso = cursor.toISOString().slice(0, 10)
      dailyShipment.push({
        tanggal: iso,
        total: dailyMap.get(iso) ?? 0,
      })
      cursor.setDate(cursor.getDate() + 1)
    }

    const totalAsset      = totalAssetsResult.count ?? 0
    const totalUnknown    = totalUnknownResult.count ?? 0
    const totalClassified = totalAsset - totalUnknown
    const completionPct   = totalAsset === 0 ? 0 : Math.round((totalClassified / totalAsset) * 100)

    return NextResponse.json({
      summary: {
        totalAsset, totalUnknown, totalClassified, completionPct,
      },
      dataStatus: {
        datUpdate:  lastUploadResult.data?.uploaded_at ?? null,
        datClosing: null,
        lppUpdate:  null,
        lppClosing: null,
      },
      breakdown,  // [{code: CGA1, items, qty, perolehan, tercatat}, ...]
      // ── Sesi 4: warning counts ────────────────────────────────────────────
      warnings: {
        belumInputKodeAset: belumInputResult.count ?? 0,
        belumMutasiOracle:  belumMutasiResult.count ?? 0,
        belumMutasiWT:      belumMutasiWTResult.count ?? 0,
      },
      // ── Rekap Pengiriman (3 cards) ────────────────────────────────────────
      rekapPengiriman: {
        mutasiProgress: {
          totalAT:     mutasiTotalAT,
          sudahMutasi: mutasiSudah,
          belumMutasi: mutasiBelum,
          progressPct: mutasiProgressPct,
          terlamaHari,
        },
        topJenisBelumAlokasi,
        dailyShipment,
        bulanLabel,
      },
    })

  } catch (error) {
    console.error('[dashboard/stats]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}
