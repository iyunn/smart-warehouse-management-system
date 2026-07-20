import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { WAREHOUSE_LABELS } from '@/lib/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Ambil SEMUA item AT (is_aktiva) dari SJ keluar submitted+completed untuk
// Card 1 (Progres Mutasi). Pakai pagination range loop — PostgREST diam-diam
// truncate 1000 baris meski .limit() diset lebih besar, terutama saat ada
// join !inner. Tanpa loop ini, progres mutasi cuma menghitung 1000 item
// pertama (bug: total AT mentok di 1.000 padahal aslinya lebih).
async function fetchAllATItems(): Promise<{ mutasi_oracle_status: boolean; tanggal: string | null }[]> {
  const all: { mutasi_oracle_status: boolean; tanggal: string | null }[] = []
  let from = 0
  const FETCH_SIZE = 1000

  while (true) {
    const { data, error } = await supabase
      .from('surat_jalan_items')
      .select(`mutasi_oracle_status, sj:surat_jalan!inner(tanggal, status, jenis)`)
      .eq('is_aktiva', true)
      .range(from, from + FETCH_SIZE - 1)

    if (error) throw new Error(error.message)
    const batch = data ?? []

    for (const it of batch) {
      const sj = Array.isArray((it as any).sj) ? (it as any).sj[0] : (it as any).sj
      // Hanya SJ keluar submitted/completed (barang benar-benar keluar CGA).
      // SJ masuk & draft tidak dihitung dalam progres mutasi keluar.
      if (!sj) continue
      if (sj.jenis === 'masuk') continue
      if (sj.status !== 'submitted' && sj.status !== 'completed') continue
      all.push({
        mutasi_oracle_status: !!(it as any).mutasi_oracle_status,
        tanggal: sj.tanggal ?? null,
      })
    }

    if (batch.length < FETCH_SIZE) break
    from += FETCH_SIZE
    if (from > 200000) break // safety guard
  }

  return all
}

// Ekstrak kode CGA dari toko pakai regex — SAMA seperti monitoring
// (extractCGACode). Sebelumnya dashboard pakai toko.split(' - ')[0] yang
// fragile (tergantung format persis), bikin angka beda dengan monitoring.
function extractCGACode(toko: string): string {
  const match = (toko ?? '').match(/CGA\d/i)
  return match ? match[0].toUpperCase() : (toko ?? 'Unknown')
}

interface CGABreakdown {
  code: string
  label: string
  items: number
  qty: number
  perolehan: number
  tercatat: number
}

// Breakdown aset per CGA — pagination range loop (assets_raw bisa >1000 baris,
// .limit(10000) polos bisa kena truncate senyap 1000 dari PostgREST). Angka
// harus SAMA dengan halaman Monitoring, jadi hitung dari sumber yang SAMA:
// assets_clean join assets_raw!inner (monitoring pakai ini, bukan assets_raw polos).
async function fetchBreakdownPerCGA(): Promise<CGABreakdown[]> {
  const map = new Map<string, CGABreakdown>()
  let from = 0
  const FETCH_SIZE = 1000

  while (true) {
    const { data, error } = await supabase
      .from('assets_clean')
      .select(`id, raw:assets_raw!inner(toko, kuantitas, biaya_perolehan, jumlah_tercatat)`)
      .range(from, from + FETCH_SIZE - 1)

    if (error) throw new Error(error.message)
    const batch = data ?? []

    for (const row of batch) {
      const raw = Array.isArray((row as any).raw) ? (row as any).raw[0] : (row as any).raw
      if (!raw) continue
      const code = extractCGACode(raw.toko)
      if (!map.has(code)) {
        map.set(code, {
          code,
          label: (WAREHOUSE_LABELS as any)[code] ?? code,
          items: 0, qty: 0, perolehan: 0, tercatat: 0,
        })
      }
      const b = map.get(code)!
      b.items += 1
      b.qty += raw.kuantitas ?? 0
      b.perolehan += raw.biaya_perolehan ?? 0
      b.tercatat += raw.jumlah_tercatat ?? 0
    }

    if (batch.length < FETCH_SIZE) break
    from += FETCH_SIZE
    if (from > 200000) break
  }

  return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code))
}

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

      // Breakdown per CGA dipindah ke fetchBreakdownPerCGA() (pagination loop).
      // Placeholder null agar posisi destructuring Promise.all tetap.
      Promise.resolve({ data: null }),

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

      // (Card 1 mutasi progress dipindah ke fetchAllATItems() dengan pagination
      //  loop — tidak lagi di Promise.all karena butuh range loop, bukan 1 query.)

      // Card 2 source: fetch SJ IDs bulan berjalan dulu (2-step) untuk filter
      // tanggal yang reliable — filter via join PostgREST tidak reliable.
      // Semua items dihitung (tidak filter kode_asset) karena yang mau disorot
      // adalah semua barang yang keluar, bukan hanya yang sudah dialokasikan.
      supabase.from('surat_jalan')
        .select('id')
        .in('status', ['submitted', 'completed'])
        .gte('tanggal', monthStartIso)
        .lte('tanggal', todayIso),

      // SJ bulan berjalan untuk Card 3 (daily shipment) — filter tanggal di DB langsung
      // menggunakan todayIso berbasis WIB agar tidak off-by-one saat tengah malam.
      supabase.from('surat_jalan')
        .select('id, tanggal')
        .in('status', ['submitted', 'completed'])
        .gte('tanggal', monthStartIso)
        .lte('tanggal', todayIso),
    ])

    // ── Aggregate per cost center ───────────────────────────────────────────
    // Pakai fetchBreakdownPerCGA() — pagination loop + extractCGACode regex,
    // angka SAMA dengan halaman Monitoring.
    const breakdown = await fetchBreakdownPerCGA()

    // ════════════════════════════════════════════════════════════════════════
    // Rekap Pengiriman processing
    // ════════════════════════════════════════════════════════════════════════

    // ── Card 1: Mutasi Progress ─────────────────────────────────────────────
    // Total AT yang keluar (SJ submitted+completed) vs yang sudah mutasi.
    // Terlama: cari item belum mutasi dengan tanggal SJ paling lama (hari).
    // Data via fetchAllATItems() — pagination loop, tidak mentok di 1000.
    const atItems = await fetchAllATItems()
    let mutasiTotalAT = 0
    let mutasiSudah = 0
    let oldestUnmutatedDate: string | null = null

    for (const it of atItems) {
      mutasiTotalAT += 1
      if (it.mutasi_oracle_status) {
        mutasiSudah += 1
      } else {
        // Item belum mutasi — track tanggal SJ-nya untuk cari yang terlama
        const tgl = it.tanggal ?? undefined
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
    for (const r of (sjBulanResult.data ?? []) as any[]) {
      if (r.id && r.tanggal) sjTanggalMap.set(r.id, r.tanggal)
    }

    const dailyMap = new Map<string, number>()
    if (sjBulanIds.length > 0) {
      const sjBulanIdSet = new Set(sjBulanIds)
      // Range loop penuh pada surat_jalan_items — hitung item per SJ bulan ini.
      // Pakai .in() per batch 300 sj_id DAN range loop di dalamnya, karena satu
      // batch bisa menghasilkan >1000 item (PostgREST truncate senyap 1000).
      const BATCH = 300
      for (let i = 0; i < sjBulanIds.length; i += BATCH) {
        const batchIds = sjBulanIds.slice(i, i + BATCH)
        let from = 0
        const FETCH_SIZE = 1000
        while (true) {
          const { data: batchItems } = await supabase
            .from('surat_jalan_items')
            .select('sj_id')
            .in('sj_id', batchIds)
            .range(from, from + FETCH_SIZE - 1)

          const rows = batchItems ?? []
          for (const row of rows) {
            if (!sjBulanIdSet.has((row as any).sj_id)) continue
            const tgl = sjTanggalMap.get((row as any).sj_id)
            if (!tgl) continue
            dailyMap.set(tgl, (dailyMap.get(tgl) ?? 0) + 1)
          }

          if (rows.length < FETCH_SIZE) break
          from += FETCH_SIZE
          if (from > 200000) break
        }
      }
    }

    // Fill semua tanggal di bulan berjalan (1 sampai hari ini WIB) dengan 0
    // Pakai string arithmetic bukan Date object agar tidak ada UTC offset issue
    const dailyShipment: { tanggal: string; total: number }[] = []
    {
      const [y, m] = monthStartIso.split('-').map(Number)
      const [ey, em, ed] = todayIso.split('-').map(Number)
      let cy = y, cm = m, cd = 1
      while (cy < ey || (cy === ey && cm < em) || (cy === ey && cm === em && cd <= ed)) {
        const iso = `${cy}-${String(cm).padStart(2,'0')}-${String(cd).padStart(2,'0')}`
        dailyShipment.push({ tanggal: iso, total: dailyMap.get(iso) ?? 0 })
        cd++
        const daysInMonth = new Date(cy, cm, 0).getDate()
        if (cd > daysInMonth) { cd = 1; cm++; if (cm > 12) { cm = 1; cy++ } }
      }
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
