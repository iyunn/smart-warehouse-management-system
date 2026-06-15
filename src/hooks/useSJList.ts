"use client";

import { useState, useEffect, useCallback } from "react";

export interface SJListItem {
  id: string;
  no_sj: string;
  tanggal: string;
  pembawa: string;
  penerima: string;
  status: 'draft' | 'submitted' | 'completed';
  approved_by: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  tujuan: { id: string; kode: string; nama: string } | null;
  items_count: number;
  jenis_list: string[];
  sn_list:    string[];
}

export function useSJList() {
  const [list, setList] = useState<SJListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function fetchList() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/sj");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) setList(json.sj ?? []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Gagal memuat list SJ");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchList();
    return () => { cancelled = true; };
  }, [refreshTick]);

  const refresh = useCallback(() => setRefreshTick(t => t + 1), []);

  return { list, loading, error, refresh };
}

// Hook untuk fetch detail SJ (untuk edit mode)
export function useSJDetail(id: string | null) {
  const [sj, setSj] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) { setSj(null); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/sj?id=${id}`)
      .then(r => r.json())
      .then(json => {
        if (!cancelled) {
          if (json.error) setError(json.error);
          else setSj(json.sj);
        }
      })
      .catch(err => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error");
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [id]);

  return { sj, loading, error };
}
