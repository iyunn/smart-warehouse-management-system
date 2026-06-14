"use client";

import { useState, useEffect } from "react";

export interface CGAStats {
  code: string;
  label: string;
  items: number;
  qty: number;
  perolehan: number;
  tercatat: number;
}

// ─── Sesi 4 Lanjutan: Rekap Pengiriman ────────────────────────────────────
export interface MutasiProgress {
  totalAT: number;        // semua item AT yang keluar via SJ submitted
  sudahMutasi: number;    // dari totalAT, yang mutasi_oracle_status=true
  belumMutasi: number;    // totalAT - sudahMutasi
  progressPct: number;    // sudahMutasi / totalAT * 100
  terlamaHari: number | null;  // umur item terlama yang belum mutasi (hari)
}

export interface TopJenis {
  jenis: string;
  total: number;
}

export interface DailyShipment {
  tanggal: string;  // YYYY-MM-DD
  total: number;    // jumlah item yang keluar di tanggal itu
}

export interface RekapPengiriman {
  mutasiProgress: MutasiProgress;
  topJenisBelumAlokasi: TopJenis[];   // top 5 dari assets_clean tag IS NULL
  dailyShipment: DailyShipment[];     // bulan berjalan, semua tanggal terisi
  bulanLabel: string;                  // "Juni 2026"
}

export interface DashboardStats {
  summary: {
    totalAsset: number;
    totalUnknown: number;
    totalClassified: number;
    completionPct: number;
  };
  dataStatus: {
    datUpdate:  string | null;
    datClosing: string | null;
    lppUpdate:  string | null;
    lppClosing: string | null;
  };
  breakdown: CGAStats[];
  warnings?: {
    belumInputKodeAset: number;
    belumMutasiOracle: number;
    belumMutasiWT: number;
  };
  rekapPengiriman?: RekapPengiriman;
}

export function useDashboardStats() {
  const [data, setData]       = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchStats() {
      setLoading(true);
      try {
        const res = await fetch("/api/dashboard/stats");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Gagal memuat statistik");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchStats();
    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
}
