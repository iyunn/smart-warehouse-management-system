"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  totalCount: number;
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
  const [assets, setAssets] = useState<AssetClean[]>([]);
  const [summary, setSummary] = useState<ReviewSummary>({
    total: 0, unknownJenis: 0, unknownMerk: 0, completionPct: 100,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPageState] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilterState] = useState<FilterType>("all");
  const [search, setSearchState] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("original_description");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [refreshTick, setRefreshTick] = useState(0);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setSearch = useCallback((s: string) => {
    setSearchState(s);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearch(s);
      setPageState(1);
    }, 400);
  }, []);

  const setFilter = useCallback((f: FilterType) => {
    setFilterState(f);
    setPageState(1);
  }, []);

  const setPage = useCallback((p: number) => setPageState(p), []);

  // ── Single fetch ke API route (semua query di server) ─────────────────────
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: String(page),
          filter,
          search: debouncedSearch,
          sort: sortField,
          dir: sortDir,
        });

        const res = await fetch(`/api/classification?${params}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();

        if (!cancelled) {
          setAssets(data.assets ?? []);
          setTotalCount(data.pagination.totalCount ?? 0);
          setTotalPages(data.pagination.totalPages ?? 1);
          setSummary(data.summary);
        }
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Gagal memuat data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [page, filter, debouncedSearch, sortField, sortDir, refreshTick]);

  const setSort = useCallback((field: SortField, dir: SortDir) => {
    setSortField(field);
    setSortDir(dir);
    setPageState(1);
  }, []);

  const refresh = useCallback(() => {
    setRefreshTick((t) => t + 1);
    setPageState(1);
  }, []);

  const removeById = useCallback((id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
    setTotalCount((prev) => Math.max(0, prev - 1));
  }, []);

  return {
    assets,
    allAssets: assets,
    summary,
    loading,
    error,
    page,
    totalPages,
    totalCount,
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
