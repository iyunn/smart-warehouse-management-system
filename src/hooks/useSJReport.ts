"use client";

import { useState, useEffect, useCallback } from "react";

export interface SJReportItem {
  item_id: string;
  urutan: number;
  jenis: string;
  merk: string;
  serial_number: string;
  qty: number;
  satuan: string;
  is_baru: boolean;
  is_aktiva: boolean;
  keterangan: string;
  mutasi_oracle: boolean;
  // SJ info
  sj_id: string;
  no_sj: string;
  tanggal: string;
  pembawa: string;
  penerima: string;
  status: string;
  approved_by: string;
  // Tujuan info
  tujuan_id: string | null;
  tujuan_kode: string;
  tujuan_nama: string;
}

export function useSJReport() {
  const [items, setItems] = useState<SJReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/sj/report");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) setItems(json.items ?? []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Gagal memuat report");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [refreshTick]);

  const refresh = useCallback(() => setRefreshTick(t => t + 1), []);

  return { items, loading, error, refresh };
}
