"use client";

import { memo, useState, useMemo, useCallback, useRef, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { useMonitoring } from "@/hooks/useMonitoring";
import { exportMonitoringToExcel, buildMonitoringFilename } from "@/lib/monitoringExporter";

type CostCenter  = "ALL" | "CGA1" | "CGA2" | "CGA3";
type SearchField = "jenis" | "merk" | "kode_asset" | "kategori_oracle" | "deskripsi" | "invoice_number" | "catatan";

// Tag punya field + value masing-masing
interface FilterTag {
  field: SearchField;
  value: string;
  label: string; // display: "Jenis: CPU"
}

const PAGE_SIZE = 30;

// ─── Field config ─────────────────────────────────────────────────────────
const FIELD_OPTIONS: { value: SearchField; label: string }[] = [
  { value: "jenis",           label: "Jenis"           },
  { value: "merk",            label: "Merk"            },
  { value: "kode_asset",      label: "Kode Aset"       },
  { value: "kategori_oracle", label: "Kategori Oracle" },
  { value: "deskripsi",       label: "Deskripsi"       },
  { value: "invoice_number",  label: "Invoice Number"  },
  { value: "catatan",         label: "Catatan"         },
];

const FIELD_LABEL: Record<SearchField, string> = {
  jenis:           "Jenis",
  merk:            "Merk",
  kode_asset:      "Kode Aset",
  kategori_oracle: "Kategori",
  deskripsi:       "Deskripsi",
  invoice_number:  "Invoice Number",
  catatan:         "Catatan",
};

// ─── CGA config ───────────────────────────────────────────────────────────
const CGA_BADGE: Record<string, string> = {
  CGA1: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  CGA2: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  CGA3: "bg-rose-500/10 text-rose-300 border-rose-500/20",
};

// Extract kode CGA dari nama panjang DB
// "CGA1 – CADANGAN GENERAL AFFAIRS 1" → "CGA1"
function extractCGACode(toko: string): string {
  const match = toko.match(/CGA\d/i);
  return match ? match[0].toUpperCase() : toko;
}

// Extract kode kategori dari format "C - PERALATAN KOMPUTER" → "C"
// Format selalu: "kode + spasi + - + spasi + nama". Ambil sebelum " - " pertama.
function extractKategoriCode(kategori: string): string {
  const idx = kategori.indexOf(" - ");
  return idx > 0 ? kategori.slice(0, idx).trim() : kategori;
}

const CGABadge = memo(({ toko }: { toko: string }) => {
  const code = extractCGACode(toko);
  return (
    <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
      CGA_BADGE[code] ?? "bg-white/5 text-white/50 border-white/10"
    }`}>{code}</span>
  );
});
CGABadge.displayName = "CGABadge";

// ─── StyledSelect ─────────────────────────────────────────────────────────
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
        <div className="absolute z-50 mt-1 w-full min-w-[140px] bg-[#0d1117] border border-white/[0.1] rounded-lg shadow-2xl shadow-black/50 overflow-hidden">
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

// ─── Multi-field Tag Input ────────────────────────────────────────────────
// User pilih field → ketik value → Enter → jadi tag "Jenis: CPU"
// Ganti field dropdown → ketik lagi → tag baru "Merk: Zyrex"
// Logic filter: AND antar tag

interface MultiFieldTagInputProps {
  tags: FilterTag[];
  onChange: (tags: FilterTag[]) => void;
}

const MultiFieldTagInput = memo(({ tags, onChange }: MultiFieldTagInputProps) => {
  const [selectedField, setSelectedField] = useState<SearchField>("jenis");
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = useCallback((val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    // Cek duplikat field+value yang sama
    const exists = tags.some(t => t.field === selectedField && t.value.toLowerCase() === trimmed.toLowerCase());
    if (exists) { setInput(""); return; }
    const newTag: FilterTag = {
      field: selectedField,
      value: trimmed,
      label: `${FIELD_LABEL[selectedField]}: ${trimmed}`,
    };
    onChange([...tags, newTag]);
    setInput("");
  }, [tags, selectedField, onChange]);

  const removeTag = useCallback((idx: number) => {
    onChange(tags.filter((_, i) => i !== idx));
  }, [tags, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && input === "" && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  }, [input, tags, addTag, removeTag]);

  // Warna per field untuk tag
  const TAG_COLORS: Record<SearchField, string> = {
    jenis:           "bg-cyan-500/15 border-cyan-500/25 text-cyan-300",
    merk:            "bg-violet-500/15 border-violet-500/25 text-violet-300",
    kode_asset:      "bg-blue-500/15 border-blue-500/25 text-blue-300",
    kategori_oracle: "bg-amber-500/15 border-amber-500/25 text-amber-300",
    deskripsi:       "bg-slate-500/15 border-slate-500/25 text-slate-300",
    invoice_number:  "bg-emerald-500/15 border-emerald-500/25 text-emerald-300",
    catatan:         "bg-rose-500/15 border-rose-500/25 text-rose-300",
  };

  return (
    <div className="flex items-start gap-2 flex-wrap">
      {/* Field selector */}
      <div className="w-[145px] shrink-0">
        <StyledSelect<SearchField>
          value={selectedField}
          onChange={setSelectedField}
          options={FIELD_OPTIONS}
        />
      </div>

      {/* Tag container + input */}
      <div
        className="flex flex-wrap items-center gap-1.5 flex-1 min-h-[34px] min-w-[200px] rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1.5 cursor-text focus-within:border-cyan-500/50 transition-all"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag, idx) => (
          <span key={`${tag.field}-${tag.value}`}
            className={`inline-flex items-center gap-1 text-[11px] font-medium rounded-md px-2 py-0.5 border ${TAG_COLORS[tag.field]}`}>
            <span className="opacity-60 text-[9px] mr-0.5">{FIELD_LABEL[tag.field]}:</span>
            {tag.value}
            <button type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(idx); }}
              className="opacity-60 hover:opacity-100 transition-opacity ml-0.5"
            >
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M1 1l8 8M9 1L1 9" />
              </svg>
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => { if (input.trim()) addTag(input); }}
          placeholder={tags.length === 0 ? `Ketik ${FIELD_LABEL[selectedField]} lalu Enter...` : ""}
          suppressHydrationWarning
          className="flex-1 min-w-[120px] bg-transparent text-[12px] text-slate-300 placeholder:text-slate-600 outline-none"
        />
      </div>
    </div>
  );
});
MultiFieldTagInput.displayName = "MultiFieldTagInput";

// ─── Helpers ──────────────────────────────────────────────────────────────
function formatRupiah(n: number): string {
  if (n === 0) return "—";
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000)     return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  return `Rp ${n.toLocaleString("id-ID")}`;
}

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
        Menampilkan <span className="text-white/60">{from}–{to}</span> dari{" "}
        <span className="text-white/60">{totalItems.toLocaleString()}</span> aset
      </p>
      <div className="flex items-center gap-1">
        <PBtn onClick={() => onPage(page - 1)} disabled={page === 1}>‹</PBtn>
        {buildPNums(page, totalPages).map((p, i) =>
          p === "…"
            ? <span key={`e-${i}`} className="px-1 text-xs text-white/20">…</span>
            : <PBtn key={p} onClick={() => onPage(p as number)} active={p === page}>{p}</PBtn>
        )}
        <PBtn onClick={() => onPage(page + 1)} disabled={page === totalPages}>›</PBtn>
      </div>
    </div>
  );
});
Pagination.displayName = "Pagination";

function buildPNums(cur: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  if (cur > 3) pages.push("…");
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i);
  if (cur < total - 2) pages.push("…");
  pages.push(total);
  return pages;
}

const PBtn = memo(({ active, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean; children: React.ReactNode;
}) => (
  <button {...props} className={`flex h-7 min-w-7 items-center justify-center rounded-lg px-2 text-xs font-medium transition-colors ${
    active
      ? "border border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
      : "text-white/40 hover:bg-white/5 hover:text-white disabled:pointer-events-none disabled:opacity-25"
  }`}>{children}</button>
));
PBtn.displayName = "PBtn";

// ─── Sorting ────────────────────────────────────────────────────────────────
type SortKey =
  | "kategori_oracle" | "jenis" | "merk" | "toko" | "kode_asset"
  | "deskripsi" | "kuantitas" | "biaya_perolehan" | "jumlah_tercatat"
  | "invoice_number" | "tanggal_dokumen" | "catatan";

type SortDir = "asc" | "desc";

interface SortState {
  key: SortKey | null;   // null = default multi-sort
  dir: SortDir;
}

// Header kolom yang bisa diklik untuk sort
const SortableHeader = memo(({
  label, sortKey, currentSort, onSort, align = "left",
}: {
  label: string;
  sortKey: SortKey;
  currentSort: SortState;
  onSort: (key: SortKey) => void;
  align?: "left" | "right";
}) => {
  const active = currentSort.key === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={`flex items-center gap-1 group transition-colors hover:text-white/60 ${
        align === "right" ? "justify-end" : ""
      } ${active ? "text-cyan-300" : ""}`}
    >
      <span>{label}</span>
      <span className="flex flex-col -space-y-1.5 shrink-0">
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
          className={active && currentSort.dir === "asc" ? "text-cyan-400" : "text-white/20"}>
          <polyline points="18 15 12 9 6 15" />
        </svg>
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
          className={active && currentSort.dir === "desc" ? "text-cyan-400" : "text-white/20"}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </span>
    </button>
  );
});
SortableHeader.displayName = "SortableHeader";

// ─── Catatan Cell ───────────────────────────────────────────────────────────
// Input bebas per kode_asset. Save onBlur ke PATCH /api/monitoring.
const CatatanCell = memo(({ kodeAsset, initialCatatan, onSaved }: {
  kodeAsset: string;
  initialCatatan: string;
  onSaved: (kodeAsset: string, catatan: string) => void;
}) => {
  const [val, setVal]       = useState(initialCatatan);
  const [saving, setSaving] = useState(false);
  const lastSaved = useRef(initialCatatan);

  useEffect(() => {
    setVal(initialCatatan);
    lastSaved.current = initialCatatan;
  }, [initialCatatan]);

  const handleBlur = useCallback(async () => {
    const trimmed = val.trim();
    if (trimmed === lastSaved.current.trim()) return; // no change

    setSaving(true);
    try {
      const res = await fetch("/api/monitoring", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kode_asset: kodeAsset, catatan: trimmed }),
      });
      const json = await res.json();
      if (json.success) {
        lastSaved.current = trimmed;
        onSaved(kodeAsset, trimmed);
      }
    } catch {
      // diam — biarkan user retry
    } finally {
      setSaving(false);
    }
  }, [val, kodeAsset, onSaved]);

  return (
    <div className="relative">
      <input
        type="text"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={handleBlur}
        placeholder="—"
        suppressHydrationWarning
        className="w-full bg-white/[0.03] border border-white/[0.06] text-[10px] text-amber-200/80 placeholder:text-white/15 rounded-md px-2 py-1 focus:outline-none focus:border-amber-500/40 focus:bg-white/[0.05]"
      />
      {saving && <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-white/30">…</span>}
    </div>
  );
});
CatatanCell.displayName = "CatatanCell";

// ─── Main Page ────────────────────────────────────────────────────────────
export default function MonitoringPage() {
  const { assets, loading } = useMonitoring();

  const [activeTab, setActiveTab]   = useState<"dat" | "lpp">("dat");
  const [costCenter, setCostCenter] = useState<CostCenter>("ALL");
  const [filterTags, setFilterTags] = useState<FilterTag[]>([]);
  const [page, setPage]             = useState(1);
  const [sort, setSort]             = useState<SortState>({ key: null, dir: "asc" });

  // Local override catatan — biar tidak refetch semua setelah save
  const [catatanOverride, setCatatanOverride] = useState<Record<string, string>>({});
  const handleCatatanSaved = useCallback((kodeAsset: string, catatan: string) => {
    setCatatanOverride((prev) => ({ ...prev, [kodeAsset]: catatan }));
  }, []);

  // ── Filter logic ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = assets;

    // Cost center filter — bandingkan kode extracted
    if (costCenter !== "ALL") {
      result = result.filter(a => extractCGACode(a.toko) === costCenter);
    }

    // AND logic: semua tag harus match
    if (filterTags.length > 0) {
      result = result.filter(a =>
        filterTags.every(tag => {
          const q = tag.value.toLowerCase();
          switch (tag.field) {
            case "jenis":           return a.jenis.toLowerCase().includes(q);
            case "merk":            return a.merk.toLowerCase().includes(q);
            case "kode_asset":      return a.kode_asset.toLowerCase().includes(q);
            case "kategori_oracle": return a.kategori_oracle.toLowerCase().includes(q);
            case "deskripsi":       return a.deskripsi.toLowerCase().includes(q);
            case "invoice_number":  return a.invoice_number.toLowerCase().includes(q);
            case "catatan":         return (catatanOverride[a.kode_asset] ?? a.catatan).toLowerCase().includes(q);
            default:                return true;
          }
        })
      );
    }

    return result;
  }, [assets, costCenter, filterTags, catatanOverride]);

  // Sort: kalau sort.key null → default multi-sort (Kategori→Jenis→Merk→CGA→Kode).
  // Kalau ada sort.key → sort by kolom itu (asc/desc).
  const sorted = useMemo(() => {
    const arr = [...filtered];

    if (sort.key === null) {
      // Default multi-sort
      return arr.sort((a, b) => {
        const ca = extractCGACode(a.toko);
        const cb = extractCGACode(b.toko);
        return (
          a.kategori_oracle.localeCompare(b.kategori_oracle) ||
          a.jenis.localeCompare(b.jenis) ||
          a.merk.localeCompare(b.merk) ||
          ca.localeCompare(cb) ||
          a.kode_asset.localeCompare(b.kode_asset)
        );
      });
    }

    // Sort per kolom
    const key = sort.key;
    const mult = sort.dir === "asc" ? 1 : -1;
    const NUMERIC_KEYS = new Set<SortKey>(["kuantitas", "biaya_perolehan", "jumlah_tercatat"]);

    return arr.sort((a, b) => {
      let av: string | number;
      let bv: string | number;

      if (key === "toko") {
        av = extractCGACode(a.toko); bv = extractCGACode(b.toko);
      } else if (key === "kategori_oracle") {
        av = extractKategoriCode(a.kategori_oracle); bv = extractKategoriCode(b.kategori_oracle);
      } else if (key === "catatan") {
        av = catatanOverride[a.kode_asset] ?? a.catatan;
        bv = catatanOverride[b.kode_asset] ?? b.catatan;
      } else {
        av = (a as any)[key] ?? "";
        bv = (b as any)[key] ?? "";
      }

      if (NUMERIC_KEYS.has(key)) {
        return ((av as number) - (bv as number)) * mult;
      }
      return String(av).localeCompare(String(bv)) * mult;
    });
  }, [filtered, sort, catatanOverride]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated  = useMemo(
    () => sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [sorted, page]
  );

  const handleReset = useCallback(() => {
    setCostCenter("ALL");
    setFilterTags([]);
    setSort({ key: null, dir: "asc" });  // reset sort ke default
    setPage(1);
  }, []);

  // Toggle sort: klik kolom sama → asc → desc → balik ke default (null)
  const handleSort = useCallback((key: SortKey) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return { key: null, dir: "asc" }; // klik ke-3 → reset ke default
    });
    setPage(1);
  }, []);

  const handleTagChange = useCallback((tags: FilterTag[]) => {
    setFilterTags(tags);
    setPage(1);
  }, []);

  const handleExport = useCallback(() => {
    if (filtered.length === 0) {
      alert("Tidak ada data untuk diekspor.");
      return;
    }
    // Build tags string untuk filename
    const tagSlugs = filterTags.map(t => `${FIELD_LABEL[t.field]}-${t.value}`);
    exportMonitoringToExcel({
      assets: filtered,
      searchField: filterTags.length > 0 ? filterTags[0].field : "all",
      tags: tagSlugs,
      costCenter,
    });
  }, [filtered, filterTags, costCenter]);

  // Summary stats
  const totalItem      = filtered.length;
  const totalQty       = filtered.reduce((s, a) => s + a.kuantitas, 0);
  const totalPerolehan = filtered.reduce((s, a) => s + a.biaya_perolehan, 0);
  const totalTercatat  = filtered.reduce((s, a) => s + a.jumlah_tercatat, 0);

  const hasActiveFilter = costCenter !== "ALL" || filterTags.length > 0;

  return (
    <div className="flex h-screen overflow-hidden bg-[#080e18] text-white">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title="Monitoring" />
        <main className="flex-1 overflow-y-auto px-6 py-5">

          {/* Header */}
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-white">Monitoring Aset</h1>
              <p className="mt-0.5 text-xs text-white/40">
                Monitor status aset DAT. Gunakan filter multi-kolom untuk analisis spesifik.
              </p>
            </div>
            {activeTab === "dat" && (
              <button onClick={handleExport}
                disabled={loading || filtered.length === 0}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50 disabled:pointer-events-none">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export Excel
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="mb-4 flex items-center gap-1 border-b border-white/[0.06] pb-0">
            {([
              { id: "dat" as const, label: "DAT Monitoring" },
              { id: "lpp" as const, label: "LPP Monitoring" },
            ]).map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-[12px] font-medium border-b-2 transition-all -mb-px ${
                  activeTab === tab.id
                    ? "border-cyan-400 text-cyan-300"
                    : "border-transparent text-white/40 hover:text-white/70"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "lpp" ? (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] py-20 text-center">
              <p className="text-sm text-white/40">Data LPP Web Tracking belum tersedia</p>
              <p className="text-xs text-white/25 mt-1">Fitur ini akan aktif setelah integrasi LPP selesai</p>
            </div>
          ) : (
            <>
              {/* Filter Panel */}
              <div className="mb-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">

                {/* Row 1: Cost center chips */}
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Cost Center</span>
                  <div className="flex items-center gap-1.5">
                    {(["ALL", "CGA1", "CGA2", "CGA3"] as CostCenter[]).map(cc => (
                      <button key={cc} onClick={() => { setCostCenter(cc); setPage(1); }}
                        className={`text-[11px] px-3 py-1.5 rounded-lg font-medium transition-all border ${
                          costCenter === cc
                            ? "bg-white/10 text-white border-white/20"
                            : "text-slate-500 border-transparent hover:text-slate-300 hover:border-white/10"
                        }`}
                      >
                        {cc}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Row 2: Multi-field tag filter + Reset */}
                <div className="pt-2 border-t border-white/[0.04] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40 shrink-0">Filter Kolom</span>
                    <p className="text-[10px] text-white/25">
                      Pilih kolom → ketik value → Enter. Tambah kolom lain untuk filter AND.
                    </p>
                  </div>
                  <div className="flex items-start gap-2 flex-wrap">
                    <div className="flex-1">
                      <MultiFieldTagInput tags={filterTags} onChange={handleTagChange} />
                    </div>
                    <button
                      onClick={handleReset}
                      disabled={!hasActiveFilter}
                      className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/40 disabled:opacity-40 disabled:pointer-events-none transition-all shrink-0"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12a9 9 0 1 0 9-9" />
                        <polyline points="3 4 3 10 9 10" />
                      </svg>
                      Reset Filter
                    </button>
                  </div>
                </div>
              </div>

              {/* Summary cards */}
              <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Total Item",      value: loading ? "—" : totalItem.toLocaleString(),   color: "text-cyan-300"    },
                  { label: "Total Qty",       value: loading ? "—" : totalQty.toLocaleString(),    color: "text-violet-300"  },
                  { label: "Biaya Perolehan", value: loading ? "—" : formatRupiah(totalPerolehan), color: "text-amber-300"   },
                  { label: "Jumlah Tercatat", value: loading ? "—" : formatRupiah(totalTercatat),  color: "text-emerald-300" },
                ].map(c => (
                  <div key={c.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">{c.label}</p>
                    <p className={`text-lg font-bold mt-1 ${c.color}`}>{c.value}</p>
                  </div>
                ))}
              </div>

              {/* Result info */}
              <div className="mb-3 flex items-center justify-between text-[11px]">
                <p className="text-white/40">
                  Menampilkan{" "}
                  <span className="text-white/80 font-semibold">{sorted.length.toLocaleString()} aset</span>
                  {filterTags.length > 0 && (
                    <span className="text-white/30">
                      {" "}— {filterTags.map(t => (
                        <span key={`${t.field}-${t.value}`} className="text-white/50 mx-0.5">
                          {t.label}
                        </span>
                      ))}
                    </span>
                  )}
                </p>
              </div>

              {/* Table dengan horizontal scroll */}
              <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] shadow-xl shadow-black/30">
                <div className="overflow-x-auto">
                  <div className="min-w-[1880px]">
                    <div className="grid grid-cols-[55px_140px_110px_70px_115px_1fr_50px_110px_110px_150px_120px_150px] gap-3 border-b border-white/[0.06] px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-white/25">
                      <SortableHeader label="Kat." sortKey="kategori_oracle" currentSort={sort} onSort={handleSort} />
                      <SortableHeader label="Jenis" sortKey="jenis" currentSort={sort} onSort={handleSort} />
                      <SortableHeader label="Merk" sortKey="merk" currentSort={sort} onSort={handleSort} />
                      <SortableHeader label="CGA" sortKey="toko" currentSort={sort} onSort={handleSort} />
                      <SortableHeader label="Kode Aset" sortKey="kode_asset" currentSort={sort} onSort={handleSort} />
                      <SortableHeader label="Deskripsi" sortKey="deskripsi" currentSort={sort} onSort={handleSort} />
                      <SortableHeader label="Qty" sortKey="kuantitas" currentSort={sort} onSort={handleSort} align="right" />
                      <SortableHeader label="Perolehan" sortKey="biaya_perolehan" currentSort={sort} onSort={handleSort} align="right" />
                      <SortableHeader label="Tercatat" sortKey="jumlah_tercatat" currentSort={sort} onSort={handleSort} align="right" />
                      <SortableHeader label="Invoice No." sortKey="invoice_number" currentSort={sort} onSort={handleSort} />
                      <SortableHeader label="Tgl Dokumen" sortKey="tanggal_dokumen" currentSort={sort} onSort={handleSort} />
                      <SortableHeader label="Catatan" sortKey="catatan" currentSort={sort} onSort={handleSort} />
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
                      <div className="divide-y divide-white/[0.04]">
                        {paginated.map((a) => (
                          <div key={a.clean_id}
                            className="grid grid-cols-[55px_140px_110px_70px_115px_1fr_50px_110px_110px_150px_120px_150px] gap-3 items-center px-4 py-2.5 hover:bg-white/[0.02] transition-colors text-[11px]">
                            <span className="text-white/50 truncate text-[10px] font-mono" title={a.kategori_oracle}>{extractKategoriCode(a.kategori_oracle)}</span>
                            <span className="text-white/80 font-medium truncate" title={a.jenis}>{a.jenis}</span>
                            <span className="text-white/60 truncate" title={a.merk}>{a.merk}</span>
                            <div><CGABadge toko={a.toko} /></div>
                            <span className="font-mono text-[10px] text-cyan-400/70 truncate" title={a.kode_asset}>{a.kode_asset}</span>
                            <span className="text-white/50 truncate text-[10px]" title={a.deskripsi}>
                              {a.tag === "Allocated" && (
                                <span className="inline-flex items-center mr-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-md border bg-blue-500/15 text-blue-300 border-blue-500/25 align-middle">
                                  Allocated
                                </span>
                              )}
                              {a.deskripsi}
                            </span>
                            <span className="text-right font-mono text-white/70">{a.kuantitas}</span>
                            <span className="text-right text-[10px] text-white/50 font-mono">{formatRupiah(a.biaya_perolehan)}</span>
                            <span className="text-right text-[10px] text-white/40 font-mono">{formatRupiah(a.jumlah_tercatat)}</span>
                            <span className="font-mono text-[10px] text-white/50 truncate" title={a.invoice_number}>{a.invoice_number || "—"}</span>
                            <span className="text-[10px] text-white/50 truncate" title={a.tanggal_dokumen}>{a.tanggal_dokumen || "—"}</span>
                            <CatatanCell
                              kodeAsset={a.kode_asset}
                              initialCatatan={catatanOverride[a.kode_asset] ?? a.catatan}
                              onSaved={handleCatatanSaved}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <Pagination
                  page={page} totalPages={totalPages} onPage={setPage}
                  totalItems={sorted.length} pageSize={PAGE_SIZE}
                />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
