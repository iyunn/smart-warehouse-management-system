"use client";

import { memo, useState, useMemo, useCallback, useRef, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { useSJReport, type SJReportItem } from "@/hooks/useSJReport";
import { exportSJReportToExcel } from "@/lib/excelExporter";

// ─── Types ────────────────────────────────────────────────────────────────
type PeriodPreset = "all" | "today" | "yesterday" | "week" | "month" | "custom";
type SearchField  =
  | "all" | "no_sj" | "sn" | "pembawa"
  | "tujuan" | "jenis" | "status" | "keterangan";

const PAGE_SIZE = 30;

// ─── StyledSelect (sama pattern existing) ────────────────────────────────
function StyledSelect<T extends string>({
  value, onChange, options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border bg-white/[0.04] text-[12px] text-white/80 transition-all ${
          open ? "border-cyan-500/50 bg-white/[0.06]" : "border-white/[0.08] hover:border-white/[0.15]"
        }`}
      >
        <span className="truncate">{selected?.label ?? "Pilih..."}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`transition-transform shrink-0 ${open ? "rotate-180" : ""}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[160px] bg-[#0d1117] border border-white/[0.1] rounded-lg shadow-2xl shadow-black/50 overflow-hidden max-h-72 overflow-y-auto">
          {options.map(opt => (
            <button key={opt.value} type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left px-3 py-1.5 text-[12px] transition-all ${
                opt.value === value ? "bg-cyan-500/10 text-cyan-300" : "text-white/70 hover:bg-white/[0.04]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function formatTanggal(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function isInDateRange(tanggal: string, from: string, to: string): boolean {
  if (!from && !to) return true;
  if (from && tanggal < from) return false;
  if (to   && tanggal > to)   return false;
  return true;
}

function getPresetRange(preset: PeriodPreset): { from: string; to: string } {
  const today    = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  if (preset === "today")     return { from: todayStr, to: todayStr };
  if (preset === "yesterday") {
    const y = new Date(); y.setDate(y.getDate() - 1);
    const s = y.toISOString().slice(0, 10);
    return { from: s, to: s };
  }
  if (preset === "week") {
    const w = new Date(); w.setDate(w.getDate() - 6);
    return { from: w.toISOString().slice(0, 10), to: todayStr };
  }
  if (preset === "month") {
    const m = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: m.toISOString().slice(0, 10), to: todayStr };
  }
  return { from: "", to: "" };
}

// ── Label untuk display & nama file ───────────────────────────────────────
const PERIOD_LABEL: Record<PeriodPreset, string> = {
  all:       "Semua Periode",
  today:     "Hari Ini",
  yesterday: "Kemarin",
  week:      "Minggu Ini",      // ← diganti sesuai permintaan
  month:     "Bulan Ini",
  custom:    "Custom",
};

function getPeriodLabel(preset: PeriodPreset, from: string, to: string): string {
  if (preset === "custom" && from && to)
    return `${formatTanggal(from)} - ${formatTanggal(to)}`;
  if (preset === "custom") return "Custom";
  return PERIOD_LABEL[preset];
}

// ── Slug untuk nama file Excel ─────────────────────────────────────────────
const PERIOD_SLUG: Record<PeriodPreset, string> = {
  all:       "Semua-Periode",
  today:     "Hari-Ini",
  yesterday: "Kemarin",
  week:      "Minggu-Ini",
  month:     "Bulan-Ini",
  custom:    "Custom",
};

const SEARCH_FIELD_LABEL: Record<SearchField, string> = {
  all:        "Semua",
  no_sj:      "No-SJ",
  sn:         "SN",
  pembawa:    "Pembawa",
  tujuan:     "Tujuan",
  jenis:      "Jenis",
  status:     "Status",
  keterangan: "Keterangan",
};

/**
 * Build nama file Excel berdasarkan filter aktif.
 * Format: Report-Alokasi-{Periode}-sort-by-{Field}-{Value}
 * Contoh: Report-Alokasi-Minggu-Ini-sort-by-Jenis-CPU
 */
function buildExcelFilename(
  periodPreset: PeriodPreset,
  dateFrom: string,
  dateTo: string,
  searchField: SearchField,
  search: string,
): string {
  const period = periodPreset === "custom" && dateFrom && dateTo
    ? `${dateFrom}-sd-${dateTo}`
    : PERIOD_SLUG[periodPreset];

  const cleanSearch = search.trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-_]/g, "");

  if (searchField !== "all" && cleanSearch) {
    const fieldLabel = SEARCH_FIELD_LABEL[searchField];
    return `Report-Alokasi-${period}-sort-by-${fieldLabel}-${cleanSearch}`;
  }

  return `Report-Alokasi-${period}`;
}

// ─── Status Badge ─────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  draft:     "bg-slate-500/10 text-slate-300 border-slate-500/20",
  submitted: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
  completed: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
};
const STATUS_LABEL: Record<string, string> = {
  draft: "Draft", submitted: "Submitted", completed: "Completed",
};

const StatusBadge = memo(({ status }: { status: string }) => (
  <span className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${
    STATUS_STYLES[status] ?? STATUS_STYLES.draft
  }`}>
    {STATUS_LABEL[status] ?? status}
  </span>
));
StatusBadge.displayName = "StatusBadge";

// ─── Pagination ───────────────────────────────────────────────────────────
const Pagination = memo(({ page, totalPages, onPage, totalItems, pageSize }: {
  page: number; totalPages: number; onPage: (p: number) => void;
  totalItems: number; pageSize: number;
}) => {
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, totalItems);
  return (
    <div className="flex items-center justify-between border-t border-white/5 px-5 py-3">
      <p className="text-xs text-white/30">
        Menampilkan <span className="text-white/60">{from}–{to}</span> dari <span className="text-white/60">{totalItems.toLocaleString()}</span> item
      </p>
      <div className="flex items-center gap-1">
        <PageBtn onClick={() => onPage(page - 1)} disabled={page === 1}>‹</PageBtn>
        {buildPageNums(page, totalPages).map((p, i) =>
          p === "…"
            ? <span key={`e-${i}`} className="px-1 text-xs text-white/20">…</span>
            : <PageBtn key={p} onClick={() => onPage(p as number)} active={p === page}>{p}</PageBtn>
        )}
        <PageBtn onClick={() => onPage(page + 1)} disabled={page === totalPages}>›</PageBtn>
      </div>
    </div>
  );
});
Pagination.displayName = "Pagination";

function buildPageNums(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  if (current > 3) pages.push("…");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
  if (current < total - 2) pages.push("…");
  pages.push(total);
  return pages;
}

const PageBtn = memo(({ active, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean; children: React.ReactNode;
}) => (
  <button {...props} className={`flex h-7 min-w-7 items-center justify-center rounded-lg px-2 text-xs font-medium transition-colors ${
    active
      ? "border border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
      : "text-white/40 hover:bg-white/5 hover:text-white disabled:pointer-events-none disabled:opacity-25"
  }`}>{children}</button>
));
PageBtn.displayName = "PageBtn";

// ─── Main Page ────────────────────────────────────────────────────────────
export default function SJReportPage() {
  const { items, loading } = useSJReport();

  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>("all");
  const [dateFrom, setDateFrom]         = useState("");
  const [dateTo, setDateTo]             = useState("");
  const [searchField, setSearchField]   = useState<SearchField>("all");
  const [search, setSearch]             = useState("");
  const [page, setPage]                 = useState(1);

  // Period preset handler
  const handlePeriodPreset = useCallback((preset: PeriodPreset) => {
    setPeriodPreset(preset);
    setPage(1);
    if (preset !== "custom") {
      const { from, to } = getPresetRange(preset);
      setDateFrom(from);
      setDateTo(to);
    }
  }, []);

  const handleDateFrom = useCallback((v: string) => {
    setDateFrom(v); setPeriodPreset("custom"); setPage(1);
  }, []);
  const handleDateTo = useCallback((v: string) => {
    setDateTo(v); setPeriodPreset("custom"); setPage(1);
  }, []);

  // ── Filter logic ───────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = items;

    // Date range
    if (dateFrom || dateTo) {
      result = result.filter(it => isInDateRange(it.tanggal, dateFrom, dateTo));
    }

    // Search by kolom
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(it => {
        switch (searchField) {
          case "no_sj":      return it.no_sj.toLowerCase().includes(q);
          case "sn":         return it.serial_number.toLowerCase().includes(q);
          case "pembawa":    return it.pembawa.toLowerCase().includes(q);
          case "tujuan":     return (it.tujuan_kode + " " + it.tujuan_nama).toLowerCase().includes(q);
          case "jenis":      return it.jenis.toLowerCase().includes(q);
          case "status":     return it.status.toLowerCase().includes(q) ||
                                    (STATUS_LABEL[it.status] ?? it.status).toLowerCase().includes(q);
          case "keterangan": return it.keterangan.toLowerCase().includes(q);
          default: // "all"
            return (
              it.no_sj.toLowerCase().includes(q) ||
              it.serial_number.toLowerCase().includes(q) ||
              it.pembawa.toLowerCase().includes(q) ||
              (it.tujuan_kode + " " + it.tujuan_nama).toLowerCase().includes(q) ||
              it.jenis.toLowerCase().includes(q) ||
              it.status.toLowerCase().includes(q) ||
              it.keterangan.toLowerCase().includes(q)
            );
        }
      });
    }

    // Sort by No. SJ desc (terbaru di atas) → urutan asc (item dalam 1 SJ berurutan)
    return [...result].sort((a, b) =>
      b.no_sj.localeCompare(a.no_sj) || a.urutan - b.urutan
    );
  }, [items, dateFrom, dateTo, search, searchField]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  // Reset filter
  const handleReset = useCallback(() => {
    setPeriodPreset("all");
    setDateFrom(""); setDateTo("");
    setSearchField("all"); setSearch("");
    setPage(1);
  }, []);

  // Export Excel dengan nama file dinamis
  const handleExport = useCallback(() => {
    if (filtered.length === 0) {
      alert("Tidak ada data untuk diekspor. Sesuaikan filter terlebih dahulu.");
      return;
    }
    const filename = buildExcelFilename(periodPreset, dateFrom, dateTo, searchField, search);
    const periodLabel = getPeriodLabel(periodPreset, dateFrom, dateTo);
    exportSJReportToExcel({ items: filtered, filename, periodLabel });
  }, [filtered, periodPreset, dateFrom, dateTo, searchField, search]);

  // Stats
  const uniqueSJ     = new Set(filtered.map(it => it.sj_id)).size;
  const uniqueTujuan = new Set(filtered.map(it => it.tujuan_id).filter(Boolean)).size;
  const totalQty     = filtered.reduce((s, it) => s + (it.qty ?? 0), 0);
  const periodLabel  = getPeriodLabel(periodPreset, dateFrom, dateTo);

  const hasActiveFilter = periodPreset !== "all" || !!search.trim();

  return (
    <div className="flex h-screen overflow-hidden bg-[#080e18] text-white">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title="Report Surat Jalan" />
        <main className="flex-1 overflow-y-auto px-6 py-5">

          {/* Header */}
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-white">Report Surat Jalan</h1>
              <p className="mt-0.5 text-xs text-white/40">
                Filter dan export laporan pengiriman barang berdasarkan periode dan kriteria pencarian
              </p>
            </div>
            <button
              onClick={handleExport}
              disabled={loading || filtered.length === 0}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50 disabled:pointer-events-none"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export Excel
            </button>
          </div>

          {/* Filter Panel */}
          <div className="mb-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">

            {/* Row 1: Period preset chips */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mr-1">Periode</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {([
                  { v: "all" as PeriodPreset,       label: "Semua"     },
                  { v: "today" as PeriodPreset,     label: "Hari Ini"  },
                  { v: "yesterday" as PeriodPreset, label: "Kemarin"   },
                  { v: "week" as PeriodPreset,      label: "Minggu Ini"},
                  { v: "month" as PeriodPreset,     label: "Bulan Ini" },
                  { v: "custom" as PeriodPreset,    label: "Custom"    },
                ]).map(p => (
                  <button key={p.v} onClick={() => handlePeriodPreset(p.v)}
                    className={`text-[11px] px-3 py-1.5 rounded-lg font-medium transition-all border ${
                      periodPreset === p.v
                        ? "bg-white/10 text-white border-white/20"
                        : "text-slate-500 border-transparent hover:text-slate-300 hover:border-white/10"
                    }`}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 2: Custom date range */}
            {periodPreset === "custom" && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-white/40 ml-1">Dari:</span>
                <input type="date" value={dateFrom}
                  onChange={(e) => handleDateFrom(e.target.value)}
                  suppressHydrationWarning
                  className="bg-white/[0.04] border border-white/[0.08] text-slate-300 text-[12px] rounded-lg px-2 py-1.5 focus:outline-none focus:border-cyan-500/50"
                />
                <span className="text-[11px] text-white/40">Sampai:</span>
                <input type="date" value={dateTo}
                  onChange={(e) => handleDateTo(e.target.value)}
                  suppressHydrationWarning
                  className="bg-white/[0.04] border border-white/[0.08] text-slate-300 text-[12px] rounded-lg px-2 py-1.5 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            )}

            {/* Row 3: Search by field + input + Reset */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.04]">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mr-1">Cari</span>
              <div className="w-[160px]">
                <StyledSelect<SearchField>
                  value={searchField}
                  onChange={(v) => { setSearchField(v); setPage(1); }}
                  options={[
                    { value: "all",        label: "Semua Field"   },
                    { value: "tujuan",     label: "Tujuan"        },
                    { value: "jenis",      label: "Jenis Barang"  },
                    { value: "status",     label: "Status SJ"     },
                    { value: "no_sj",      label: "No. SJ"        },
                    { value: "sn",         label: "Serial Number" },
                    { value: "pembawa",    label: "Pembawa"       },
                    { value: "keterangan", label: "Keterangan"    },
                  ]}
                />
              </div>
              <div className="relative flex-1 max-w-sm">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"
                  width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input type="text" value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder={
                    searchField === "status"
                      ? "Draft / Submitted / Completed"
                      : searchField === "tujuan"
                      ? "Cari kode atau nama tujuan..."
                      : "Cari..."
                  }
                  suppressHydrationWarning
                  className="w-full bg-white/[0.04] border border-white/[0.08] text-slate-300 text-[12px] placeholder:text-slate-600 rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div className="flex-1" />
              <button
                onClick={handleReset}
                disabled={!hasActiveFilter}
                className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/40 disabled:opacity-40 disabled:pointer-events-none transition-all"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9" />
                  <polyline points="3 4 3 10 9 10" />
                </svg>
                Reset Filter
              </button>
            </div>
          </div>

          {/* Result info */}
          <div className="mb-3 flex items-center justify-between text-[11px]">
            <p className="text-white/40">
              Menampilkan <span className="text-white/80 font-semibold">{filtered.length.toLocaleString()} item</span>
              {" "}dari <span className="text-white/60">{uniqueSJ}</span> Surat Jalan ke{" "}
              <span className="text-white/60">{uniqueTujuan}</span> tujuan
              {" "}— Total Qty: <span className="text-white/60">{totalQty.toLocaleString()}</span>
            </p>
            <p className="text-white/30">
              Periode: <span className="text-white/60">{periodLabel}</span>
            </p>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] shadow-xl shadow-black/30">
            <div className="overflow-x-auto">
              <div className="min-w-[1380px]">
                <div className="grid grid-cols-[90px_180px_140px_100px_130px_100px_80px_50px_70px_220px_90px] gap-2 border-b border-white/[0.06] px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-white/25">
                  <span>Tanggal</span>
                  <span>No. SJ</span>
                  <span>Tujuan</span>
                  <span>Pembawa</span>
                  <span>Jenis</span>
                  <span>Merk</span>
                  <span>SN</span>
                  <span className="text-right">Qty</span>
                  <span>Satuan</span>
                  <span>Keterangan</span>
                  <span>Status</span>
                </div>

                {loading ? (
                  <div className="divide-y divide-white/5">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="px-4 py-3">
                        <div className="h-4 bg-white/5 rounded w-3/4 animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="py-16 text-center">
                    <p className="text-sm text-white/40">Tidak ada data untuk filter ini</p>
                    <button onClick={handleReset} className="mt-3 text-xs text-amber-400 hover:text-amber-300">
                      Reset filter →
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-white/[0.04]">
                      {paginated.map((it) => (
                        <div key={it.item_id}
                          className="grid grid-cols-[90px_180px_140px_100px_130px_100px_80px_50px_70px_220px_90px] gap-2 items-center px-4 py-2.5 hover:bg-white/[0.02] transition-colors text-[11px]">
                          <span className="text-white/60">{formatTanggal(it.tanggal)}</span>
                          <span className="font-mono text-cyan-400 truncate" title={it.no_sj}>{it.no_sj}</span>
                          <div className="min-w-0">
                            <p className="text-white/80 truncate" title={it.tujuan_kode}>{it.tujuan_kode}</p>
                            <p className="text-[9px] text-white/40 truncate" title={it.tujuan_nama}>{it.tujuan_nama}</p>
                          </div>
                          <span className="text-white/60 truncate" title={it.pembawa}>{it.pembawa || "—"}</span>
                          <span className="text-white/70 truncate" title={it.jenis}>{it.jenis || "—"}</span>
                          <span className="text-white/60 truncate" title={it.merk}>{it.merk || "—"}</span>
                          <span className="font-mono text-white/50 truncate" title={it.serial_number}>{it.serial_number || "—"}</span>
                          <span className="text-right font-mono text-white/70">{it.qty}</span>
                          <span className="text-white/50">{it.satuan}</span>
                          <span className="text-white/50 truncate" title={it.keterangan}>{it.keterangan || "—"}</span>
                          <div><StatusBadge status={it.status} /></div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            <Pagination
              page={page} totalPages={totalPages} onPage={setPage}
              totalItems={filtered.length} pageSize={PAGE_SIZE}
            />
          </div>

        </main>
      </div>
    </div>
  );
}
