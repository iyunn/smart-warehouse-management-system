"use client";

/**
 * DATvsLPPCards.tsx
 * Dashboard Baris 2 — Rekonsiliasi DAT vs LPP Web Tracking per CGA.
 * Self-contained: fetch data sendiri via useReconciliation (reuse hook yang
 * sudah dibangun untuk halaman /reconciliation), tidak perlu props dari
 * parent. Untuk tiap CGA, breakdown dihitung client-side dari `items`:
 *   - Total DAT          = item dengan toko===CGA & (kondisi 1 atau 2)
 *   - Total LPP           = item dengan toko===CGA & (kondisi 1 atau 4)
 *   - Belum Mutasi Oracle = kondisi 2 (ada di DAT, belum di LPP)
 *   - Belum Mutasi WT     = kondisi 4 (ada di LPP, belum di DAT)
 *
 * Angka "Belum Mutasi Oracle"/"Belum Mutasi WT" clickable — navigasi ke
 * /reconciliation?kondisi=X&cga=Y, halaman tujuan baca query param ini
 * (lihat reconciliation/page.tsx) dan pre-apply filter kondisi+CGA yang
 * sesuai, jadi user langsung lihat detail aset-nya tanpa filter manual.
 */

import { memo, useMemo } from "react";
import Link from "next/link";
import { useReconciliation } from "@/hooks/useReconciliation";

const CGA_COLORS: Record<string, {
  border: string; bg: string; bgHeader: string; text: string; dot: string;
}> = {
  CGA1: {
    border:   "border-emerald-500/25",
    bg:       "bg-gradient-to-br from-emerald-500/[0.07] to-emerald-500/[0.02]",
    bgHeader: "bg-emerald-500/10",
    text:     "text-emerald-300",
    dot:      "bg-emerald-400",
  },
  CGA2: {
    border:   "border-amber-500/25",
    bg:       "bg-gradient-to-br from-amber-500/[0.07] to-amber-500/[0.02]",
    bgHeader: "bg-amber-500/10",
    text:     "text-amber-300",
    dot:      "bg-amber-400",
  },
  CGA3: {
    border:   "border-rose-500/25",
    bg:       "bg-gradient-to-br from-rose-500/[0.07] to-rose-500/[0.02]",
    bgHeader: "bg-rose-500/10",
    text:     "text-rose-300",
    dot:      "bg-rose-400",
  },
};

interface CGABreakdown {
  code: string;
  totalDAT: number;
  totalLPP: number;
  belumMutasiOracle: number; // Kondisi 2: ada di DAT, belum di LPP
  belumMutasiWT: number;     // Kondisi 4: ada di LPP, belum di DAT
}

function CGACard({ stats }: { stats: CGABreakdown }) {
  const c = CGA_COLORS[stats.code] ?? CGA_COLORS.CGA1;
  const selisih = stats.belumMutasiOracle + stats.belumMutasiWT;
  const hasSelisih = selisih > 0;

  return (
    <div className={`rounded-2xl border ${c.border} ${c.bg} overflow-hidden`}>
      <div className={`${c.bgHeader} px-4 py-2.5 border-b ${c.border} flex items-center justify-between gap-2`}>
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${c.dot}`} />
          <span className={`text-[13px] font-bold ${c.text}`}>DAT {stats.code} vs LPP {stats.code}</span>
        </div>
        {hasSelisih && (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400 shrink-0">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        )}
      </div>

      <div className="p-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Total DAT</p>
          <p className="text-[18px] font-bold text-white font-mono">{stats.totalDAT.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Total LPP</p>
          <p className="text-[18px] font-bold text-white font-mono">{stats.totalLPP.toLocaleString()}</p>
        </div>
      </div>

      <div className={`px-4 pb-4 grid grid-cols-2 gap-3 pt-3 border-t ${c.border}`}>
        <Link
          href={`/reconciliation?kondisi=2&cga=${stats.code}`}
          className="rounded-lg -m-1 p-1 transition-colors hover:bg-white/[0.04]"
        >
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1 leading-tight">Belum Mutasi Oracle</p>
          <p className={`text-[15px] font-bold font-mono underline-offset-2 hover:underline ${stats.belumMutasiOracle > 0 ? "text-amber-400" : "text-white/30"}`}>
            {stats.belumMutasiOracle.toLocaleString()}
          </p>
        </Link>
        <Link
          href={`/reconciliation?kondisi=4&cga=${stats.code}`}
          className="rounded-lg -m-1 p-1 transition-colors hover:bg-white/[0.04]"
        >
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1 leading-tight">Belum Mutasi WT</p>
          <p className={`text-[15px] font-bold font-mono underline-offset-2 hover:underline ${stats.belumMutasiWT > 0 ? "text-rose-400" : "text-white/30"}`}>
            {stats.belumMutasiWT.toLocaleString()}
          </p>
        </Link>
      </div>
    </div>
  );
}

function DATvsLPPCards() {
  const { items, loading } = useReconciliation();

  const breakdown: CGABreakdown[] = useMemo(() => {
    return ["CGA1", "CGA2", "CGA3"].map((code) => {
      const cgaItems = items.filter((it) => it.toko === code);
      const totalDAT = cgaItems.filter((it) => it.kondisi === 1 || it.kondisi === 2).length;
      const totalLPP = cgaItems.filter((it) => it.kondisi === 1 || it.kondisi === 4).length;
      const belumMutasiOracle = cgaItems.filter((it) => it.kondisi === 2).length;
      const belumMutasiWT     = cgaItems.filter((it) => it.kondisi === 4).length;
      return { code, totalDAT, totalLPP, belumMutasiOracle, belumMutasiWT };
    });
  }, [items]);

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-2">
        Rekonsiliasi DAT vs LPP Web Tracking
      </p>
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] h-[110px] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {breakdown.map((stats) => <CGACard key={stats.code} stats={stats} />)}
        </div>
      )}
    </div>
  );
}

export default memo(DATvsLPPCards);
