import { memo } from "react";

interface BreakdownItem {
  code: string;
  label: string;
  items: number;
  qty: number;
  perolehan: number;
  tercatat: number;
}

interface Props {
  breakdown: BreakdownItem[];
  loading: boolean;
}

function formatRupiahShort(value: number): string {
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(2)} M`;
  if (value >= 1_000_000)     return `Rp ${(value / 1_000_000).toFixed(1)} Jt`;
  if (value >= 1_000)         return `Rp ${(value / 1_000).toFixed(0)} Rb`;
  return `Rp ${value}`;
}

const COST_CENTER_COLORS: Record<string, string> = {
  CGA1: "bg-cyan-500",
  CGA2: "bg-blue-500",
  CGA3: "bg-amber-500",
};

function DistribusiCostCenter({ breakdown, loading }: Props) {
  const totalItems = breakdown.reduce((sum, b) => sum + b.items, 0);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="mb-4">
        <h3 className="text-[13px] font-semibold text-white">Distribusi Aset per Gudang</h3>
        <p className="text-[11px] text-white/40 mt-0.5">Berdasarkan cost center</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 rounded-lg bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      ) : breakdown.length === 0 ? (
        <p className="text-xs text-white/30 py-8 text-center">Belum ada data</p>
      ) : (
        <div className="space-y-3">
          {breakdown.map(b => {
            const pct = totalItems === 0 ? 0 : Math.round((b.items / totalItems) * 100);
            return (
              <div key={b.code}>
                <div className="flex justify-between items-baseline mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${COST_CENTER_COLORS[b.code] ?? "bg-white/30"}`} />
                    <span className="text-[12px] font-semibold text-white/80">{b.code}</span>
                    <span className="text-[10px] text-white/40">— {b.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[12px] font-mono text-white/80">{b.items.toLocaleString()}</span>
                    <span className="text-[10px] text-white/40 ml-1.5">/ {pct}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${COST_CENTER_COLORS[b.code] ?? "bg-white/30"} rounded-full transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5 text-[10px] text-white/30 font-mono">
                  <span>Qty: {b.qty.toLocaleString()}</span>
                  <span>{formatRupiahShort(b.tercatat)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default memo(DistribusiCostCenter);
