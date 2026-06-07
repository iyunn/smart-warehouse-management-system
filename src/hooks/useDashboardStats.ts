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
