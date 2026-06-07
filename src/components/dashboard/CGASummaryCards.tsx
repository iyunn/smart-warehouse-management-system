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

function CGACard({ stats }: { stats: CGAStats }) {
  const c = CGA_COLORS[stats.code] ?? CGA_COLORS.CGA1;

  return (
    <div className={`rounded-2xl border ${c.border} ${c.bg} overflow-hidden`}>
      {/* Header */}
      <div className={`${c.bgHeader} px-4 py-2.5 border-b ${c.border} flex items-center gap-2`}>
        <span className={`h-2 w-2 rounded-full ${c.dot}`} />
        <span className={`text-[13px] font-bold ${c.text}`}>{stats.code}</span>
        <span className="text-[10px] text-white/40 truncate">— {stats.label}</span>
      </div>

      {/* Body — 2x2 grid */}
      <div className="p-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Total Barang</p>
          <p className="text-[18px] font-bold text-white font-mono">{stats.items.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Total Qty</p>
          <p className="text-[18px] font-bold text-white font-mono">{stats.qty.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Biaya Perolehan</p>
          <p className={`text-[14px] font-semibold ${c.text} font-mono`}>{formatRupiahShort(stats.perolehan)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Tercatat</p>
          <p className={`text-[14px] font-semibold ${c.text} font-mono`}>{formatRupiahShort(stats.tercatat)}</p>
        </div>
      </div>
    </div>
  );
}

function CGASummaryCards({ breakdown, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] h-[170px] animate-pulse" />
        ))}
      </div>
    );
  }

  // Pastikan urutan CGA1, CGA2, CGA3
  const ordered = ["CGA1", "CGA2", "CGA3"].map(
    code => breakdown.find(b => b.code === code) ?? {
      code, label: "", items: 0, qty: 0, perolehan: 0, tercatat: 0,
    } as CGAStats
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      {ordered.map(stats => <CGACard key={stats.code} stats={stats} />)}
    </div>
  );
}

export default memo(CGASummaryCards);
