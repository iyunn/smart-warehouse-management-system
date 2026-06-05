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
// Supabase max rows per request = 1000. Kita fetch semua dengan loop pagination.
const FETCH_BATCH = 1000;

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
  const [totalAssetCount, setTotalAssetCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("original_description");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [refreshTick, setRefreshTick] = useState(0);

  // ── Fetch ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function fetchAssets() {
      setLoading(true);
      setError(null);

      try {
        const validSortField =
          sortField === "confidence_score" ? "confidence" : sortField;

        // ── Fetch semua unknown assets dengan loop (bypass limit 1000) ──────────
        let allRows: any[] = [];
        let from = 0;
        let hasMore = true;

        while (hasMore) {
          const { data, error: sbError } = await supabase
            .from("assets_clean")
            .select(
              "id, original_description, normalized_description, jenis, merk, kategori, confidence, status"
            )
            .or("jenis.eq.Unknown,merk.eq.Unknown")
            .order(validSortField, { ascending: sortDir === "asc" })
            .range(from, from + FETCH_BATCH - 1);

          if (sbError) throw new Error(sbError.message);

          const batch = data ?? [];
          allRows = [...allRows, ...batch];

          // Kalau batch < 1000, berarti sudah habis
          hasMore = batch.length === FETCH_BATCH;
          from += FETCH_BATCH;

          // Safety: stop kalau sudah fetch terlalu banyak (50k rows)
          if (from > 50000) break;
        }

        // ── Hitung total semua aset (untuk completionPct) ───────────────────────
        const { count, error: countError } = await supabase
          .from("assets_clean")
          .select("*", { count: "exact", head: true });

        if (countError) throw new Error(countError.message);

        if (!cancelled) {
          // Map 'confidence' (DB) → 'confidence_score' (type lokal)
          const mapped = allRows.map((row: any) => ({
            ...row,
            confidence_score: row.confidence ?? null,
          })) as AssetClean[];

          setAllAssets(mapped);
          setTotalAssetCount(count ?? 0);
        }
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Gagal memuat data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAssets();
    return () => {
      cancelled = true;
    };
  }, [sortField, sortDir, refreshTick]);

  // ── Client-side filter + search ───────────────────────────────────────────────
  const filtered = useMemo(() => {
    let rows = allAssets;

    if (filter === "unknown_jenis")
      rows = rows.filter((r) => r.jenis === "Unknown");
    else if (filter === "unknown_merk")
      rows = rows.filter((r) => r.merk === "Unknown");
    else if (filter === "both")
      rows = rows.filter(
        (r) => r.jenis === "Unknown" && r.merk === "Unknown"
      );

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.original_description?.toLowerCase().includes(q) ||
          r.normalized_description?.toLowerCase().includes(q) ||
          r.kategori?.toLowerCase().includes(q)
      );
    }

    return rows;
  }, [allAssets, filter, search]);

  // ── Pagination ────────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const assets = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [filter, search]);

  // ── Summary ───────────────────────────────────────────────────────────────────
  // completionPct dihitung dari totalAssetCount (semua aset di assets_clean)
  // bukan dari jumlah unknown saja, agar angkanya akurat
  const summary = useMemo<ReviewSummary>(() => {
    const totalUnknown = allAssets.length;
    const unknownJenis = allAssets.filter((r) => r.jenis === "Unknown").length;
    const unknownMerk = allAssets.filter((r) => r.merk === "Unknown").length;

    const completionPct =
      totalAssetCount === 0
        ? 100
        : Math.round(
            ((totalAssetCount - totalUnknown) / totalAssetCount) * 100
          );

    return { total: totalUnknown, unknownJenis, unknownMerk, completionPct };
  }, [allAssets, totalAssetCount]);

  const setSort = useCallback((field: SortField, dir: SortDir) => {
    setSortField(field);
    setSortDir(dir);
  }, []);

  const refresh = useCallback(() => setRefreshTick((t) => t + 1), []);

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
