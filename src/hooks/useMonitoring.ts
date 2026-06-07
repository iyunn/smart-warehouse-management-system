"use client";

import { useState, useEffect } from "react";

export interface MonitoringAsset {
  id: string;
  kode_asset: string;
  deskripsi: string;
  kategori: string;
  jenis: string;
  merk: string;
  toko: string;
  toko_code: string;
  reconciliation_tag: string;
}

export function useMonitoring() {
  const [assets, setAssets]   = useState<MonitoringAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch("/api/monitoring");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) setAssets(json.assets ?? []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Gagal memuat data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  return { assets, loading, error };
}
