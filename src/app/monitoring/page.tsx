"use client";

import { memo, useMemo, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import SummaryCard from "@/components/SummaryCard";
import { useMonitoring, type MonitoringAsset } from "@/hooks/useMonitoring";

type TabType = "dat" | "lpp";
type CGAFilter = "ALL" | "CGA1" | "CGA2" | "CGA3";

const PAGE_SIZE = 20;

const CGA_BADGE: Record<string, string> = {
  CGA1: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  CGA2: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  CGA3: "bg-rose-500/10 text-rose-300 border-rose-500/20",
};

// ─── Pagination ──────────────────────────────────────────────────────────────
interface PaginationProps {
  page: number; totalPages: number; onPage: (p: number) => void;
  totalItems: number; pageSize: number;
}
const Pagination = memo(({ page, totalPages, onPage, totalItems, pageSize }: PaginationProps) => {
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);
  return (
    <div className="flex items-center justify-between border-t border-white/5 px-5 py-3">
      <p className="text-xs text-white/30">
        Menampilkan <span className="text-white/60">{from}–{to}</span> dari <span className="text-white/60">{totalItems.toLocaleString()}</span> aset
      </p>
      <div className="flex items-center gap-1">
        <PageBtn onClick={() => onPage(page - 1)} disabled={page === 1}>‹</PageBtn>
        {buildPageNums(page, totalPages).map((p, i) =>
          p === "…" ? <span key={`e-${i}`} className="px-1 text-xs text-white/20">…</span>
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

interface PageBtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean; children: React.ReactNode;
}
const PageBtn = memo(({ active, children, ...props }: PageBtnProps) => (
  <button {...props} className={`flex h-7 min-w-7 items-center justify-center rounded-lg px-2 text-xs font-medium transition-colors ${
    active ? "border border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
           : "text-white/40 hover:bg-white/5 hover:text-white disabled:pointer-events-none disabled:opacity-25"
  }`}>{children}</button>
));
PageBtn.displayName = "PageBtn";

// ─── Table Header ────────────────────────────────────────────────────────────
const TableHeader = memo(() => (
  <div className="grid grid-cols-[150px_120px_120px_70px_120px_1fr_110px] gap-3 border-b border-white/[0.06] px-5 py-3">
    {["Kategori", "Jenis", "Merk", "Cost Center", "Kode Aset", "Deskripsi", "Status"].map((h) => (
      <span key={h} className="text-[10px] font-semibold uppercase tracking-widest text-white/25">{h}</span>
    ))}
  </div>
));
TableHeader.displayName = "TableHeader";

// ─── Table Row ───────────────────────────────────────────────────────────────
const TableRow = memo(({ asset }: { asset: MonitoringAsset }) => {
  const cgaBadge = CGA_BADGE[asset.toko_code] ?? "bg-white/5 text-white/40 border-white/10";
  return (
    <div className="grid grid-cols-[150px_120px_120px_70px_120px_1fr_110px] gap-3 items-center border-b border-white/[0.04] px-5 py-3 hover:bg-white/[0.02] transition-colors">
      <span className="text-[11px] text-white/50 truncate" title={asset.kategori}>{asset.kategori || "-"}</span>
      <span className="text-[11px] text-white/70 truncate">{asset.jenis}</span>
      <span className="text-[11px] text-white/70 truncate">{asset.merk}</span>
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border w-fit ${cgaBadge}`}>{asset.toko_code}</span>
      <span className="text-[11px] font-mono text-white/60 truncate">{asset.kode_asset}</span>
      <span className="text-[11px] text-white/50 truncate" title={asset.deskripsi}>{asset.deskripsi}</span>
      <span className="text-[10px] font-medium px-2 py-1 rounded-md bg-white/[0.04] text-white/40 border border-white/[0.06] w-fit">
        ⏳ Pending
      </span>
    </div>
  );
});
TableRow.displayName = "TableRow";

// ─── Page ────────────────────────────────────────────────────────────────────
export default function MonitoringPage() {
  const { assets, loading } = useMonitoring();
  const [activeTab, setActiveTab] = useState<TabType>("dat");
  const [cgaFilter, setCgaFilter] = useState<CGAFilter>("ALL");
  const [search, setSearch]       = useState("");
  const [page, setPage]           = useState(1);

  // Filter assets
  const filtered = useMemo(() => {
    let list = assets;
    if (cgaFilter !== "ALL") list = list.filter(a => a.toko_code === cgaFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.kode_asset?.toLowerCase().includes(q) ||
        a.deskripsi?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [assets, cgaFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  const handleCgaFilter = useCallback((f: CGAFilter) => { setCgaFilter(f); setPage(1); }, []);
  const handleSearch    = useCallback((v: string)    => { setSearch(v); setPage(1); }, []);
  const handleTab       = useCallback((t: TabType)   => { setActiveTab(t); setPage(1); setSearch(""); setCgaFilter("ALL"); }, []);

  // Summary per tab
  const summaryDAT = {
    total: assets.length,
    pendingSjWt: assets.length, // dummy: semua pending
    sinkron: 0,
  };
  const summaryLPP = {
    total: 0,
    belumMutasiDAT: 0,
    sinkron: 0,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#080e18] text-white">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title="Monitoring" />
        <main className="flex-1 overflow-y-auto px-6 py-5">

          {/* Page header */}
          <div className="mb-5">
            <h1 className="text-lg font-semibold tracking-tight text-white">Monitoring</h1>
            <p className="mt-0.5 text-xs text-white/40">
              Monitoring rekonsiliasi aset antara DAT Oracle dan LPP Web Tracking
            </p>
          </div>

          {/* Tab switcher */}
          <div className="mb-5 flex items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1 w-fit">
            {([
              { id: "dat", label: "DAT Monitoring", desc: "Belum ada SJ Web Tracking" },
              { id: "lpp", label: "LPP Monitoring", desc: "Belum dimutasi Oracle" },
            ] as { id: TabType; label: string; desc: string }[]).map((tab) => (
              <button key={tab.id} onClick={() => handleTab(tab.id)}
                className={`flex flex-col items-start gap-0 rounded-lg px-4 py-2 text-left transition-all ${
                  activeTab === tab.id ? "bg-white/10 shadow-sm" : "hover:bg-white/[0.04]"
                }`}>
                <span className={`text-xs font-medium ${activeTab === tab.id ? "text-white" : "text-white/40"}`}>{tab.label}</span>
                <span className={`text-[10px] ${activeTab === tab.id ? "text-white/50" : "text-white/25"}`}>{tab.desc}</span>
              </button>
            ))}
          </div>

          {/* Summary cards per tab */}
          <div className="mb-5 grid grid-cols-1 md:grid-cols-3 gap-3">
            {activeTab === "dat" ? (
              <>
                <SummaryCard
                  title="Total DAT Aset"
                  value={loading ? "—" : summaryDAT.total.toLocaleString()}
                  subtitle="Semua aset gudang"
                  accentColor="cyan"
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>}
                />
                <SummaryCard
                  title="Pending SJ WT"
                  value={loading ? "—" : summaryDAT.pendingSjWt.toLocaleString()}
                  subtitle="Belum ada di Web Tracking"
                  accentColor="amber"
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
                />
                <SummaryCard
                  title="Sinkron"
                  value={loading ? "—" : summaryDAT.sinkron.toLocaleString()}
                  subtitle="DAT & WT match"
                  accentColor="violet"
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>}
                />
              </>
            ) : (
              <>
                <SummaryCard
                  title="Total LPP"
                  value="—"
                  subtitle="Data LPP belum tersedia"
                  accentColor="cyan"
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>}
                />
                <SummaryCard
                  title="Belum Mutasi DAT"
                  value="—"
                  subtitle="Sudah keluar via WT, DAT belum"
                  accentColor="amber"
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
                />
                <SummaryCard
                  title="Sinkron"
                  value="—"
                  subtitle="LPP & DAT match"
                  accentColor="violet"
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>}
                />
              </>
            )}
          </div>

          {/* Table */}
          {activeTab === "dat" ? (
            <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] shadow-xl shadow-black/30">

              {/* Toolbar */}
              <div className="border-b border-white/[0.06] px-5 py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  {(["ALL", "CGA1", "CGA2", "CGA3"] as CGAFilter[]).map(f => (
                    <button key={f} onClick={() => handleCgaFilter(f)}
                      className={`text-[11px] px-3 py-1.5 rounded-lg font-medium transition-all border ${
                        cgaFilter === f
                          ? "bg-white/10 text-white border-white/20"
                          : "text-slate-500 border-transparent hover:text-slate-300 hover:border-white/10"
                      }`}>
                      {f === "ALL" ? "Semua" : f}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-600 text-[11px] hidden sm:block">
                    <span className="text-slate-400 font-mono">{filtered.length.toLocaleString()}</span>
                    {filtered.length !== assets.length && (
                      <> / <span className="text-slate-600 font-mono">{assets.length.toLocaleString()}</span></>
                    )}{" "}aset
                  </span>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"
                      width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="Cari kode atau deskripsi..."
                      suppressHydrationWarning
                      className="bg-white/[0.04] border border-white/[0.08] text-slate-300 text-[12px] placeholder:text-slate-600 rounded-xl pl-8 pr-3 py-1.5 w-56 focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.06] transition-all"
                    />
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="divide-y divide-white/5">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                      <div className="h-3 rounded bg-white/5 w-1/3 animate-pulse" />
                      <div className="h-3 w-20 rounded bg-white/5 animate-pulse" />
                      <div className="h-3 w-16 rounded bg-white/5 animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24">
                  <p className="text-sm text-white/40">Tidak ada aset ditemukan</p>
                </div>
              ) : (
                <>
                  <TableHeader />
                  <div className="divide-y divide-white/[0.04]">
                    {paginated.map(asset => <TableRow key={asset.id} asset={asset} />)}
                  </div>
                  <Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
                </>
              )}
            </div>
          ) : (
            /* LPP Tab — empty state */
            <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.015] p-12 flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] text-white/30 mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-white/60 mb-1">Belum ada data LPP Web Tracking</h3>
              <p className="text-xs text-white/30 max-w-md">
                Fitur upload dan monitoring LPP Web Tracking akan tersedia setelah modul LPP Web Tracking dibangun.
              </p>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
