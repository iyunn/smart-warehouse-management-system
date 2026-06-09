"use client";

import { useState, useEffect, useCallback } from "react";

export interface MonitoringAsset {
  clean_id:        string;
  jenis:           string;
  merk:            string;
  confidence:      string;
  kode_asset:      string;
  deskripsi:       string;
  toko:            string;
  kategori_oracle: string;
  kuantitas:       number;
  biaya_perolehan: number;
  jumlah_tercatat: number;
}

export function useMonitoring() {
  const [assets, setAssets]   = useState<MonitoringAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/monitoring');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) setAssets(json.assets ?? []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Gagal memuat data monitoring');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [refreshTick]);

  const refresh = useCallback(() => setRefreshTick(t => t + 1), []);

  return { assets, loading, error, refresh };
}
