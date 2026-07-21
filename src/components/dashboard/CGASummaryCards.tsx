import { memo } from "react";
import type { CGAStats } from "@/hooks/useDashboardStats";

interface Props {
  breakdown: CGAStats[];
  loading: boolean;
}

function formatRupiahShort(value: number): string {
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(2)} M`;
  if (value >= 1_000_000)     return `Rp ${(value / 1_000_000).toFixed(1)} Jt`;
  if (value >= 1_000)         return `Rp ${(value / 1_000).toFixed(0)} Rb`;
  return `Rp ${value.toLocaleString()}`;
}

const CGA_COLORS: Record<string, {
  border: string; bg: string; bgHeader: string; text: string; dot: string; ring: string;
}> = {
  CGA1: {
    border:   "border-emerald-500/25",
    bg:       "bg-gradient-to-br from-emerald-500/[0.07] to-emerald-500/[0.02]",
    bgHeader: "bg-emerald-500/10",
    text:     "text-emerald-300",
    dot:      "bg-emerald-400",
    ring:     "ring-emerald-500/20",
  },
  CGA2: {
    border:   "border-amber-500/25",
    bg:       "bg-gradient-to-br from-amber-500/[0.07] to-amber-500/[0.02]",
    bgHeader: "bg-amber-500/10",
    text:     "text-amber-300",
    dot:      "bg-amber-400",
    ring:     "ring-amber-500/20",
  },
  CGA3: {
    border:   "border-rose-500/25",
    bg:       "bg-gradient-to-br from-rose-500/[0.07] to-rose-500/[0.02]",
    bgHeader: "bg-rose-500/10",
    text:     "text-rose-300",
    dot:      "bg-rose-400",
    ring:     "ring-rose-500/20",
  },
};

function CGARow({ stats }: { stats: CGAStats }) {
  const c = CGA_COLORS[stats.code] ?? CGA_COLORS.CGA1;

  return (
    <div className="px-5 py-4 border-b last:border-b-0 border-white/[0.06]">
      <div className="flex items-start justify-between gap-3">
        {/* Kiri: kode + label + detail inline */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`h-2 w-2 rounded-full ${c.dot} shrink-0`} />
            <span className={`text-[14px] font-bold ${c.text}`}>{stats.code}</span>
            <span className="text-[11px] text-white/35 truncate">— {stats.label}</span>
          </div>
          <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-white/45">
            <span>Qty: <span className="font-mono font-semibold text-white/75">{stats.qty.toLocaleString()}</span></span>
            <span>Perolehan: <span className={`font-mono font-semibold ${c.text}`}>{formatRupiahShort(stats.perolehan)}</span></span>
            <span>Tercatat: <span className={`font-mono font-semibold ${c.text}`}>{formatRupiahShort(stats.tercatat)}</span></span>
          </div>
        </div>
        {/* Kanan: angka besar */}
        <div className="text-right shrink-0">
          <p className="text-[26px] font-bold text-white font-mono leading-none">{stats.items.toLocaleString()}</p>
          <p className="text-[10px] text-white/35 mt-0.5">barang</p>
        </div>
      </div>
    </div>
  );
}

function CGASummaryCards({ breakdown, loading }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] h-full min-h-[200px] animate-pulse" />
    );
  }

  // Pastikan urutan CGA1, CGA2, CGA3
  const ordered = ["CGA1", "CGA2", "CGA3"].map(
    code => breakdown.find(b => b.code === code) ?? {
      code, label: "", items: 0, qty: 0, perolehan: 0, tercatat: 0,
    } as CGAStats
  );

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden h-full flex flex-col">
      <div className="flex-1">
        {ordered.map(stats => <CGARow key={stats.code} stats={stats} />)}
      </div>
      <a href="/monitoring" className="mx-4 mb-4 mt-2 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition-all py-2.5 flex items-center justify-center gap-2 text-[12px] font-medium text-white/60 hover:text-white/90">
        Lihat detail gudang
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
        </svg>
      </a>
    </div>
  );
}

export default memo(CGASummaryCards);
