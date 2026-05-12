"use client";

import { memo, useCallback } from "react";
import type { FilterType } from "../../lib/reviewTypes";

interface ReviewTableToolbarProps {
  search: string;
  filter: FilterType;
  totalFiltered: number;
  totalAll: number;
  onSearch: (v: string) => void;
  onFilter: (f: FilterType) => void;
}

const FILTERS: { value: FilterType; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "unknown_jenis", label: "Unknown Jenis" },
  { value: "unknown_merk", label: "Unknown Merk" },
  { value: "both", label: "Keduanya" },
];

function ReviewTableToolbar({
  search,
  filter,
  totalFiltered,
  totalAll,
  onSearch,
  onFilter,
}: ReviewTableToolbarProps) {
  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onSearch(e.target.value),
    [onSearch]
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* Left: filter chips */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => onFilter(f.value)}
            className={`text-[11px] px-3 py-1.5 rounded-lg font-medium transition-all border ${
              filter === f.value
                ? "bg-white/10 text-white border-white/20"
                : "text-slate-500 border-transparent hover:text-slate-300 hover:border-white/10"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Right: search + count */}
      <div className="flex items-center gap-3">
        <span className="text-slate-600 text-[11px] hidden sm:block">
          <span className="text-slate-400 font-mono">{totalFiltered}</span>
          {totalFiltered !== totalAll && (
            <> / <span className="text-slate-600 font-mono">{totalAll}</span></>
          )}{" "}
          aset
        </span>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"
            width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Cari kode, deskripsi..."
            className="bg-white/[0.04] border border-white/[0.08] text-slate-300 text-[12px] placeholder:text-slate-600 rounded-xl pl-8 pr-3 py-1.5 w-44 focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.06] transition-all"
          />
        </div>
      </div>
    </div>
  );
}

export default memo(ReviewTableToolbar);