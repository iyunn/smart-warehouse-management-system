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

function LiveStockPage() {
  const [data, setData]         = useState<LiveStockData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [autoCycle, setAutoCycle]     = useState(true);

  const cycleRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    if (!autoCycle || !data || data.jenisList.length === 0) return;

    cycleRef.current = setInterval(() => {
      setSelectedIdx(prev => (prev + 1) % data.jenisList.length);
    }, CYCLE_MS);

    return () => { if (cycleRef.current) clearInterval(cycleRef.current); };
  }, [autoCycle, data]);

  // Klik manual: pilih jenis + pause auto-cycle sementara
  const handleSelect = useCallback((idx: number) => {
    setSelectedIdx(idx);
    setAutoCycle(false);
  }, []);

  const jenisList = data?.jenisList ?? [];
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
    <div className="flex h-screen overflow-hidden theme-surface">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title="Live Stock" />
        <main className="flex-1 overflow-hidden px-6 py-5">

          {/* Header bar */}
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-semibold tracking-tight" style={{ color: "var(--text)" }}>
                Live Stock
              </h1>
              <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                Stock per jenis barang — akumulasi CGA1 + CGA2 (CGA3 dikecualikan)
              </p>
            </div>
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
              <div className="w-[150px]"><ThemeToggle /></div>
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
            <div className="grid grid-cols-[minmax(280px,340px)_1fr] gap-5 h-[calc(100vh-140px)]">

              {/* ── KIRI: Tabel Jenis ─────────────────────────────────────── */}
              <div className="rounded-2xl border overflow-hidden flex flex-col"
                style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
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
                  {jenisList.map((j, idx) => {
                    const active = idx === selectedIdx;
                    return (
                      <button
                        key={j.jenis}
                        onClick={() => handleSelect(idx)}
                        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left transition-all border-l-2"
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
              </div>

              {/* ── KANAN: Detail jenis terpilih ──────────────────────────── */}
              {selected && (
                <div className="rounded-2xl border p-6 overflow-y-auto flex flex-col gap-6"
                  style={{ borderColor: "var(--border)", background: "var(--surface)" }}>

                  {/* Angka besar + nama jenis + list merk */}
                  <div className="grid grid-cols-[1fr_minmax(200px,280px)] gap-6 items-start">
                    {/* Angka besar */}
                    <div>
                      <p className="text-[12px] uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
                        Total Stock
                      </p>
                      <div className="flex items-baseline gap-3">
                        <span className="font-mono font-bold leading-none tabular-nums"
                          style={{ color: "var(--accent)", fontSize: "clamp(3.5rem, 9vw, 7rem)" }}>
                          {selected.total.toLocaleString()}
                        </span>
                        <span className="text-[15px]" style={{ color: "var(--text-dim)" }}>item</span>
                      </div>
                      <h2 className="mt-2 text-[22px] font-semibold" style={{ color: "var(--text)" }}>
                        {selected.jenis}
                      </h2>
                      {/* Breakdown CGA1 / CGA2 */}
                      <div className="flex items-center gap-4 mt-4">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--cga1)" }} />
                          <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                            CGA1: <span className="font-mono font-semibold" style={{ color: "var(--text)" }}>{selected.cga1.toLocaleString()}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--cga2)" }} />
                          <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                            CGA2: <span className="font-mono font-semibold" style={{ color: "var(--text)" }}>{selected.cga2.toLocaleString()}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* List Merk */}
                    <div className="rounded-xl border p-4"
                      style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
                      <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
                        List Merk
                      </p>
                      <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto">
                        {selected.merkBreakdown.map((m) => (
                          <div key={m.merk} className="flex items-center justify-between gap-2">
                            <span className="text-[13px] truncate" style={{ color: "var(--text)" }} title={m.merk}>
                              {m.merk}
                            </span>
                            <span className="text-[13px] font-mono font-semibold shrink-0" style={{ color: "var(--accent)" }}>
                              {m.count.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Pie chart: proporsi jenis ini vs total CGA1+CGA2 */}
                  <div className="rounded-xl border p-5 mt-auto"
                    style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
                    <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
                      Proporsi terhadap Total Stock (CGA1 + CGA2)
                    </p>
                    <div className="flex items-center gap-6">
                      <div className="w-[160px] h-[160px] shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%" cy="50%"
                              innerRadius={45} outerRadius={72}
                              startAngle={90} endAngle={-270}
                              stroke="none"
                            >
                              <Cell fill="var(--accent)" />
                              <Cell fill="var(--surface-3)" />
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-mono font-bold text-[32px]" style={{ color: "var(--accent)" }}>{pct}%</span>
                          <span className="text-[12px]" style={{ color: "var(--text-dim)" }}>dari total stock</span>
                        </div>
                        <p className="text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>
                          <span className="font-mono font-semibold" style={{ color: "var(--text)" }}>{selected.total.toLocaleString()}</span>
                          {" "}dari{" "}
                          <span className="font-mono font-semibold" style={{ color: "var(--text)" }}>{totalCGADisplay.toLocaleString()}</span>
                          {" "}total item
                        </p>
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--accent)" }} />
                            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{selected.jenis}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--surface-3)" }} />
                            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Jenis lain</span>
                          </div>
                        </div>
                      </div>
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

const PlayIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
);
const PauseIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
);

export default memo(LiveStockPage);
