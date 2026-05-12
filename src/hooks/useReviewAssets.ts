"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import type {
  AssetClean,
  ReviewSummary,
  FilterType,
  SortField,
  SortDir,
} from "../lib/reviewTypes";

const PAGE_SIZE = 20;

interface UseReviewAssetsReturn {
  assets: AssetClean[];
  allAssets: AssetClean[];
  summary: ReviewSummary;
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  filter: FilterType;
  search: string;
  sortField: SortField;
  sortDir: SortDir;
  setPage: (p: number) => void;
  setFilter: (f: FilterType) => void;
  setSearch: (s: string) => void;
  setSort: (field: SortField, dir: SortDir) => void;
  refresh: () => void;
  removeById: (id: string) => void;
}

export function useReviewAssets(): UseReviewAssetsReturn {
  const [allAssets, setAllAssets] = useState<AssetClean[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("kode_asset");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [refreshTick, setRefreshTick] = useState(0);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function fetchAssets() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: sbError } = await supabase
          .from("assets_clean")
          .select(
            "id, kode_asset, original_description, jenis, merk, kategori, confidence_score, toko, status"
          )
          .or("jenis.eq.Unknown,merk.eq.Unknown")
          .order(sortField, { ascending: sortDir === "asc" });

        if (sbError) throw new Error(sbError.message);
        if (!cancelled) setAllAssets((data as AssetClean[]) ?? []);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Gagal memuat data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAssets();
    return () => { cancelled = true; };
  }, [sortField, sortDir, refreshTick]);

  // ── Client-side filter + search (memoised) ───────────────────────────────────
  const filtered = useMemo(() => {
    let rows = allAssets;

    if (filter === "unknown_jenis") rows = rows.filter((r) => r.jenis === "Unknown");
    else if (filter === "unknown_merk") rows = rows.filter((r) => r.merk === "Unknown");
    else if (filter === "both")
      rows = rows.filter((r) => r.jenis === "Unknown" && r.merk === "Unknown");

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.kode_asset?.toLowerCase().includes(q) ||
          r.original_description?.toLowerCase().includes(q) ||
          r.kategori?.toLowerCase().includes(q)
      );
    }

    return rows;
  }, [allAssets, filter, search]);

  // ── Pagination ───────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const assets = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  // Reset to page 1 when filter/search changes
  useEffect(() => { setPage(1); }, [filter, search]);

  // ── Summary (memoised off allAssets, not filtered) ───────────────────────────
  const summary = useMemo<ReviewSummary>(() => {
    const total = allAssets.length;
    const unknownJenis = allAssets.filter((r) => r.jenis === "Unknown").length;
    const unknownMerk = allAssets.filter((r) => r.merk === "Unknown").length;
    return {
      total,
      unknownJenis,
      unknownMerk,
      completionPct: total === 0 ? 100 : Math.round(((total - unknownJenis) / total) * 100),
    };
  }, [allAssets]);

  const setSort = useCallback((field: SortField, dir: SortDir) => {
    setSortField(field);
    setSortDir(dir);
  }, []);

  const refresh = useCallback(() => setRefreshTick((t) => t + 1), []);

  /** Optimistic remove — called after a row is classified / dismissed */
  const removeById = useCallback((id: string) => {
    setAllAssets((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return {
    assets,
    allAssets,
    summary,
    loading,
    error,
    page,
    totalPages,
    filter,
    search,
    sortField,
    sortDir,
    setPage,
    setFilter,
    setSearch,
    setSort,
    refresh,
    removeById,
  };
}