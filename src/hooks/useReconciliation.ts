"use client";

import { useState, useEffect, useCallback } from "react";

export interface ReconciliationItem {
  kode_asset: string;
  toko: string;
  tokoLPP: string | null; // hanya diisi untuk kondisi 6 (mismatch CGA)
  deskripsi: string;
  kondisi: 1 | 2 | 4 | 5 | 6;
  inDAT: boolean;
  inLPP: boolean;
}

export interface ReconciliationSummary {
  kondisi1: number;
  kondisi2: number;
  kondisi4: number;
  kondisi5: number;
  kondisi6: number;
}

export function useReconciliation() {
  const [items, setItems]     = useState<ReconciliationItem[]>([]);
  const [summary, setSummary] = useState<ReconciliationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/reconciliation');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) {
          setItems(json.items ?? []);
          setSummary(json.summary ?? null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Gagal memuat data reconciliation');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [refreshTick]);

  const refresh = useCallback(() => setRefreshTick(t => t + 1), []);

  return { items, summary, loading, error, refresh };
}
