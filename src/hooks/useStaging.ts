"use client";

import { useState, useEffect, useCallback } from "react";

export interface StagingItem {
  id: string;
  kode_asset: string | null;
  jenis: string;
  merk: string;
  deskripsi: string;
  catatan: string;
  asal_toko: string;
  is_at_lebih: boolean;
  sj_id: string | null;
  tanggal_masuk: string;
  created_at: string;
}

export function useStaging() {
  const [items, setItems]   = useState<StagingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);

  const refresh = useCallback(() => setRefreshTick(t => t + 1), []);

  // Update satu item di state lokal tanpa re-fetch (untuk edit catatan).
  // Catatan sudah tersimpan di DB via PATCH — tidak perlu refresh seluruh list.
  const updateItemLocal = useCallback((id: string, patch: Partial<StagingItem>) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/staging")
      .then(r => r.json())
      .then(j => { if (!cancelled) setItems(j.data ?? []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [refreshTick]);

  return { items, loading, refresh, updateItemLocal };
}
