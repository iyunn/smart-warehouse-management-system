"use client";

/**
 * Live Stock — halaman idle/screensaver.
 * Menampilkan stock per Jenis Barang (akumulasi CGA1 + CGA2, CGA3 dikecualikan).
 *
 * Layout:
 *   - Kiri: tabel list Jenis + jumlah item (klik untuk pilih)
 *   - Kanan: angka besar (total item jenis terpilih) + nama jenis
 *            + List Merk (breakdown per merk)
 *            + Pie chart (proporsi jenis ini vs total CGA1+CGA2)
 *
 * Mode idle: auto-cycle antar jenis tiap beberapa detik (bisa di-pause,
 * dan tetap bisa diklik manual di tabel kiri).
 *
 * Theme-aware: pakai CSS token var(--...) agar ikut dark/light.
 */

import { memo, useState, useEffect, useCallback, useRef, useMemo } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import ThemeToggle from "@/components/ThemeToggle";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts";

interface MerkCount { merk: string; count: number }
interface JenisStock {
  jenis: string;
  kategori: string;
  total: number;
  cga1: number;
  cga2: number;
  merkBreakdown: MerkCount[];
}
interface LiveStockData {
  jenisList: JenisStock[];
  totalStock: number;
  totalCGA1: number;
  totalCGA2: number;
  updatedAt: string | null;
}

const CYCLE_MS = 6000;         // ganti jenis tiap 6 detik saat auto-cycle
const REFRESH_MS = 60000;      // re-fetch data tiap 60 detik (idle screen)

// Ekstrak kode kategori: "C - PERALATAN KOMPUTER" → "C"
function extractKategoriCode(kategori: string): string {
  const idx = kategori.indexOf(" - ");
  return idx > 0 ? kategori.slice(0, idx).trim() : kategori;
}

// Format timestamp DAT update untuk info bar
function formatUpdatedAt(iso: string | null): string {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) +
      " " + d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  } catch { return "-"; }
}

interface KategoriGroup {
  kategori: string;              // label penuh, mis. "C - PERALATAN KOMPUTER"
  items: { jenis: JenisStock; flatIdx: number }[];
}

function LiveStockPage() {
  const [data, setData]         = useState<LiveStockData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [autoCycle, setAutoCycle]     = useState(true);
  const [fullscreen, setFullscreen]   = useState(false);
  const [now, setNow]                 = useState<Date | null>(null);
  const [cycleProgress, setCycleProgress] = useState(0);

  const cycleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const activeRowRef = useRef<HTMLButtonElement | null>(null);

  // Auto-scroll tabel kiri ke item aktif (biar highlight selalu kelihatan saat cycle)
  useEffect(() => {
    activeRowRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedIdx]);

  // ── Fetch data ────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/stock/live");
      const json = await res.json();
      if (json.success) {
        setData({
          jenisList: json.jenisList ?? [],
          totalStock: json.totalStock ?? 0,
          totalCGA1: json.totalCGA1 ?? 0,
          totalCGA2: json.totalCGA2 ?? 0,
          updatedAt: json.updatedAt ?? null,
        });
      }
    } catch { /* silent — idle screen, jangan crash */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, REFRESH_MS);
    return () => clearInterval(t);
  }, [fetchData]);

  // ── Auto-cycle antar jenis ─────────────────────────────────────────────────
  useEffect(() => {
    if (cycleRef.current) clearInterval(cycleRef.current);
    setCycleProgress(0);
    if (!autoCycle || !data || data.jenisList.length === 0) return;

    cycleRef.current = setInterval(() => {
      setSelectedIdx(prev => (prev + 1) % data.jenisList.length);
      setCycleProgress(0);
    }, CYCLE_MS);

    return () => { if (cycleRef.current) clearInterval(cycleRef.current); };
  }, [autoCycle, data]);

  // Progress bar auto-cycle — naik smooth dari 0→100 tiap siklus
  useEffect(() => {
    if (!autoCycle) { setCycleProgress(0); return; }
    const STEP = 50; // ms
    const timer = setInterval(() => {
      setCycleProgress(prev => Math.min(100, prev + (STEP / CYCLE_MS) * 100));
    }, STEP);
    return () => clearInterval(timer);
  }, [autoCycle, selectedIdx]);

  // Reset progress tiap ganti jenis (klik manual atau cycle)
  useEffect(() => { setCycleProgress(0); }, [selectedIdx]);

  // Jam live — update tiap detik (untuk info bar idle screen)
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Klik manual: pilih jenis + pause auto-cycle sementara
  const handleSelect = useCallback((idx: number) => {
    setSelectedIdx(idx);
    setAutoCycle(false);
  }, []);

  // ── Fullscreen (mode idle/screensaver untuk monitor kantor) ────────────────
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await wrapperRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch { /* browser tolak / tidak didukung — abaikan */ }
  }, []);

  // Sync state saat user keluar fullscreen via ESC / tombol browser
  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Saat masuk fullscreen, aktifkan auto-cycle otomatis (mode idle)
  useEffect(() => {
    if (fullscreen) setAutoCycle(true);
  }, [fullscreen]);

  // ── Grouping per kategori + sort A-Z ────────────────────────────────────
  // Kategori diurut A-Z (by kode), jenis di dalam tiap kategori diurut A-Z.
  // flatOrder = urutan jenis mengikuti tampilan grouped, untuk auto-cycle.
  const { grouped, flatOrder } = useMemo(() => {
    const list = data?.jenisList ?? [];
    const byKat = new Map<string, JenisStock[]>();
    for (const j of list) {
      const key = j.kategori || "Tanpa Kategori";
      if (!byKat.has(key)) byKat.set(key, []);
      byKat.get(key)!.push(j);
    }
    // Sort kategori A-Z by kode, jenis A-Z by nama
    const sortedKats = Array.from(byKat.keys()).sort((a, b) =>
      extractKategoriCode(a).localeCompare(extractKategoriCode(b), "id") || a.localeCompare(b, "id")
    );
    const flat: JenisStock[] = [];
    const groups: KategoriGroup[] = sortedKats.map(kat => {
      const items = byKat.get(kat)!.slice().sort((a, b) => a.jenis.localeCompare(b.jenis, "id"));
      const withIdx = items.map(j => {
        const flatIdx = flat.length;
        flat.push(j);
        return { jenis: j, flatIdx };
      });
      return { kategori: kat, items: withIdx };
    });
    return { grouped: groups, flatOrder: flat };
  }, [data]);

  const jenisList = flatOrder;
  const selected  = jenisList[selectedIdx] ?? null;
  const totalCGADisplay = (data?.totalCGA1 ?? 0) + (data?.totalCGA2 ?? 0);

  // Pie: jenis terpilih vs sisa total CGA1+CGA2
  const pieData = useMemo(() => {
    if (!selected || totalCGADisplay === 0) return [];
    return [
      { name: selected.jenis, value: selected.total },
      { name: "Jenis Lain", value: Math.max(0, totalCGADisplay - selected.total) },
    ];
  }, [selected, totalCGADisplay]);

  const pct = selected && totalCGADisplay > 0
    ? ((selected.total / totalCGADisplay) * 100).toFixed(1)
    : "0";

  return (
    <div ref={wrapperRef} className="flex h-screen overflow-hidden theme-surface">
      {!fullscreen && <Sidebar />}
      <div className="flex flex-1 flex-col overflow-hidden">
        {!fullscreen && <Topbar title="Live Stock" />}
        <main className="flex-1 overflow-hidden px-6 py-5">

          {/* Header bar */}
          <div className="mb-4 flex items-center justify-between gap-4">
            {fullscreen ? (
              /* Mode idle: jam besar + tanggal + status DAT (ala papan bandara) */
              <div className="flex items-baseline gap-5">
                <span className="font-mono font-bold tabular-nums leading-none" style={{ color: "var(--text)", fontSize: "2rem" }}>
                  {now ? now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "--:--:--"}
                </span>
                <div className="flex flex-col">
                  <span className="text-[13px] font-medium" style={{ color: "var(--text)" }}>
                    {now ? now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : ""}
                  </span>
                  <span className="text-[11px]" style={{ color: "var(--text-dim)" }}>
                    Live Stock — CGA1 + CGA2 · DAT update: {formatUpdatedAt(data?.updatedAt ?? null)}
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-lg font-semibold tracking-tight" style={{ color: "var(--text)" }}>
                  Live Stock
                </h1>
                <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                  Stock per jenis barang — akumulasi CGA1 + CGA2 (CGA3 dikecualikan)
                </p>
              </div>
            )}
            <div className="flex items-center gap-3">
              {/* Toggle auto-cycle */}
              <button
                onClick={() => setAutoCycle(v => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border text-[12px] font-medium transition-all"
                style={{
                  borderColor: "var(--border)",
                  background: autoCycle ? "var(--accent-soft)" : "var(--surface-2)",
                  color: autoCycle ? "var(--accent)" : "var(--text-muted)",
                }}
                title={autoCycle ? "Auto-cycle aktif — klik untuk pause" : "Auto-cycle pause — klik untuk aktifkan"}
              >
                {autoCycle ? <PlayIcon /> : <PauseIcon />}
                {autoCycle ? "Auto" : "Manual"}
              </button>
              {/* Tombol Fullscreen (mode idle/screensaver) */}
              <button
                onClick={toggleFullscreen}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border text-[12px] font-medium transition-all"
                style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text-muted)" }}
                title={fullscreen ? "Keluar fullscreen (ESC)" : "Mode layar penuh (idle screen)"}
              >
                {fullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
                {fullscreen ? "Keluar" : "Fullscreen"}
              </button>
              {!fullscreen && <div className="w-[150px]"><ThemeToggle /></div>}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-[70vh]" style={{ color: "var(--text-dim)" }}>
              Memuat data stock...
            </div>
          ) : jenisList.length === 0 ? (
            <div className="flex items-center justify-center h-[70vh]" style={{ color: "var(--text-dim)" }}>
              Belum ada data stock. Upload DAT terlebih dahulu.
            </div>
          ) : (
            <div className="grid grid-cols-[minmax(280px,340px)_1fr] gap-5" style={{ height: fullscreen ? "calc(100vh - 90px)" : "calc(100vh - 140px)" }}>

              {/* ── KIRI: Tabel Jenis ─────────────────────────────────────── */}
              <div className="rounded-2xl border overflow-hidden flex flex-col"
                style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                {/* Progress bar auto-cycle — habis tiap siklus, tanda kapan ganti jenis */}
                <div className="h-0.5 w-full" style={{ background: "var(--surface-3)" }}>
                  <div className="h-full transition-none"
                    style={{
                      width: autoCycle ? `${cycleProgress}%` : "0%",
                      background: "var(--accent)",
                    }}
                  />
                </div>
                <div className="px-4 py-3 border-b flex items-center justify-between"
                  style={{ borderColor: "var(--border)" }}>
                  <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                    Jenis Barang
                  </span>
                  <span className="text-[11px] font-mono" style={{ color: "var(--text-dim)" }}>
                    {jenisList.length} jenis
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {grouped.map((group) => (
                    <div key={group.kategori}>
                      {/* Header kategori */}
                      <div className="sticky top-0 z-10 px-4 py-1.5 border-b backdrop-blur-sm"
                        style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                          {group.kategori}
                        </span>
                      </div>
                      {group.items.map(({ jenis: j, flatIdx }) => {
                        const active = flatIdx === selectedIdx;
                        return (
                          <button
                            key={j.jenis}
                            ref={active ? activeRowRef : undefined}
                            onClick={() => handleSelect(flatIdx)}
                            className="w-full flex items-center justify-between gap-3 px-4 py-2 text-left transition-all border-l-2"
                            style={{
                              borderLeftColor: active ? "var(--accent)" : "transparent",
                              background: active ? "var(--accent-soft)" : "transparent",
                            }}
                          >
                            <span className="text-[13px] truncate"
                              style={{ color: active ? "var(--accent)" : "var(--text)", fontWeight: active ? 600 : 400 }}
                              title={j.jenis}>
                              {j.jenis}
                            </span>
                            <span className="text-[13px] font-mono font-semibold shrink-0"
                              style={{ color: active ? "var(--accent)" : "var(--text-muted)" }}>
                              {j.total.toLocaleString()}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* ── KANAN: Detail jenis terpilih ──────────────────────────── */}
              {selected && (
                <div className="rounded-2xl border overflow-hidden grid grid-cols-[1fr_minmax(220px,300px)]"
                  style={{ borderColor: "var(--border)", background: "var(--surface)" }}>

                  {/* Kolom utama: hero (angka+jenis+pie) + stat cards */}
                  <div className="flex flex-col p-8 overflow-y-auto">
                    {/* Hero: angka besar + pie berdampingan */}
                    <div className="flex items-center gap-10 flex-1">
                      {/* Angka besar */}
                      <div className="flex-1">
                        <p className="text-[12px] uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
                          Total Stock
                        </p>
                        <div className="flex items-baseline gap-3">
                          <span className="font-mono font-bold leading-none tabular-nums"
                            style={{ color: "var(--accent)", fontSize: "clamp(4rem, 11vw, 9rem)" }}>
                            {selected.total.toLocaleString()}
                          </span>
                          <span className="text-[18px]" style={{ color: "var(--text-dim)" }}>item</span>
                        </div>
                        <h2 className="mt-3 text-[28px] font-bold leading-tight" style={{ color: "var(--text)" }}>
                          {selected.jenis}
                        </h2>
                        <p className="text-[13px] mt-1" style={{ color: "var(--text-dim)" }}>
                          {selected.kategori}
                        </p>
                      </div>

                      {/* Pie chart besar dengan persen di tengah */}
                      <div className="relative w-[220px] h-[220px] shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              dataKey="value" nameKey="name"
                              cx="50%" cy="50%"
                              innerRadius={72} outerRadius={104}
                              startAngle={90} endAngle={-270}
                              stroke="none"
                            >
                              <Cell fill="var(--accent)" />
                              <Cell fill="var(--surface-3)" />
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        {/* Persen di tengah donut */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="font-mono font-bold text-[30px] leading-none" style={{ color: "var(--accent)" }}>{pct}%</span>
                          <span className="text-[10px] mt-1" style={{ color: "var(--text-dim)" }}>dari total</span>
                        </div>
                      </div>
                    </div>

                    {/* Stat cards: CGA1, CGA2, Total keseluruhan */}
                    <div className="grid grid-cols-3 gap-4 mt-8">
                      <StatCard label="CGA1" value={selected.cga1} dot="var(--cga1)" />
                      <StatCard label="CGA2" value={selected.cga2} dot="var(--cga2)" />
                      <StatCard label="Total Stock (CGA1+2)" value={totalCGADisplay} dot="var(--accent)" muted />
                    </div>

                    {/* Legend proporsi */}
                    <div className="flex items-center gap-5 mt-5 text-[11px]" style={{ color: "var(--text-muted)" }}>
                      <span>
                        <span className="font-mono font-semibold" style={{ color: "var(--text)" }}>{selected.total.toLocaleString()}</span> item{" "}
                        <span style={{ color: "var(--accent)" }}>{selected.jenis}</span>
                      </span>
                      <span>dari total <span className="font-mono font-semibold" style={{ color: "var(--text)" }}>{totalCGADisplay.toLocaleString()}</span> item seluruh jenis</span>
                    </div>
                  </div>

                  {/* Kolom kanan: List Merk (full height) */}
                  <div className="border-l flex flex-col" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
                    <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
                      <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                        List Merk
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: "var(--text-dim)" }}>
                        {selected.merkBreakdown.length} merk
                      </p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3">
                      {selected.merkBreakdown.map((m) => {
                        const merkPct = selected.total > 0 ? (m.count / selected.total) * 100 : 0;
                        return (
                          <div key={m.merk} className="px-2 py-2 rounded-lg" style={{ background: "transparent" }}>
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-[13px] truncate" style={{ color: "var(--text)" }} title={m.merk}>{m.merk}</span>
                              <span className="text-[13px] font-mono font-semibold shrink-0" style={{ color: "var(--accent)" }}>{m.count.toLocaleString()}</span>
                            </div>
                            {/* Bar proporsi merk */}
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-3)" }}>
                              <div className="h-full rounded-full" style={{ width: `${merkPct}%`, background: "var(--accent)" }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

const StatCard = ({ label, value, dot, muted }: { label: string; value: number; dot: string; muted?: boolean }) => (
  <div className="rounded-xl border px-4 py-3"
    style={{ borderColor: "var(--border)", background: muted ? "var(--accent-soft)" : "var(--surface-2)" }}>
    <div className="flex items-center gap-2 mb-1.5">
      <span className="w-2 h-2 rounded-full" style={{ background: dot }} />
      <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{label}</span>
    </div>
    <span className="font-mono font-bold text-[22px] tabular-nums" style={{ color: "var(--text)" }}>
      {value.toLocaleString()}
    </span>
  </div>
);

const PlayIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
);
const PauseIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
);
const FullscreenIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
  </svg>
);
const ExitFullscreenIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" />
  </svg>
);

export default memo(LiveStockPage);
