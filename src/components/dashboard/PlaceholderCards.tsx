import { memo } from "react";

/* ─── Placeholder universal ───────────────────────────────────────────────── */
interface PlaceholderProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  height?: string;
}

const PlaceholderCard = memo(({ title, description, icon, height = "h-32" }: PlaceholderProps) => (
  <div className={`rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.015] p-5 flex items-center gap-4 ${height}`}>
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-white/30">
      {icon ?? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-[13px] font-semibold text-white/60 truncate">{title}</h3>
        <span className="text-[9px] font-semibold uppercase tracking-widest text-amber-400/70 bg-amber-500/10 border border-amber-500/20 rounded-md px-1.5 py-0.5">
          Coming Soon
        </span>
      </div>
      <p className="text-[11px] text-white/30 leading-relaxed">{description}</p>
    </div>
  </div>
));
PlaceholderCard.displayName = "PlaceholderCard";

/* ─── Baris 2: DAT vs LPP Comparison — DIPINDAH ke DATvsLPPCards.tsx ──────
   (live sejak 18 Juni 2026, reuse useReconciliation) ───────────────────── */

/* ─── Baris 3: Trend Closing (1 card panjang) ─────────────────────────────── */
export const TrendClosingPlaceholder = memo(() => (
  <div>
    <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-2">
      Trend Pergerakan Aset Bulanan
    </p>
    <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.015] p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-white/30">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <polyline points="3 17 9 11 13 15 21 7" />
              <polyline points="14 7 21 7 21 14" />
            </svg>
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-white/60">Trend CGA1 / CGA2 / CGA3</h3>
            <p className="text-[11px] text-white/30 mt-0.5">Pergerakan aset antar gudang berdasarkan data closing bulanan</p>
          </div>
        </div>
        <span className="text-[9px] font-semibold uppercase tracking-widest text-amber-400/70 bg-amber-500/10 border border-amber-500/20 rounded-md px-2 py-1">
          Coming Soon
        </span>
      </div>

      {/* Chart skeleton */}
      <div className="h-32 flex items-end gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex-1 flex flex-col gap-1">
            <div className="bg-emerald-500/[0.08] rounded-t" style={{ height: `${20 + (i * 7) % 40}%` }} />
            <div className="bg-amber-500/[0.08] rounded-t" style={{ height: `${15 + (i * 11) % 30}%` }} />
            <div className="bg-rose-500/[0.08] rounded-t" style={{ height: `${10 + (i * 5) % 20}%` }} />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-white/30">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500/40" />CGA1</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500/40" />CGA2</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500/40" />CGA3</span>
      </div>
    </div>
  </div>
));
TrendClosingPlaceholder.displayName = "TrendClosingPlaceholder";

/* ─── Baris 5: Closing vs Update Comparison (3 cards) ─────────────────────── */
export const ClosingVsUpdatePlaceholder = memo(() => (
  <div>
    <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-2">
      Perbandingan Closing vs Update
    </p>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      {[
        { code: "CGA1", color: "emerald" },
        { code: "CGA2", color: "amber" },
        { code: "CGA3", color: "rose" },
      ].map(item => (
        <div key={item.code} className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.015] p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full bg-${item.color}-400/40`} />
              <span className="text-[12px] font-semibold text-white/50">{item.code}</span>
            </div>
            <span className="text-[9px] font-semibold uppercase tracking-widest text-amber-400/70 bg-amber-500/10 border border-amber-500/20 rounded-md px-1.5 py-0.5">
              Soon
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] text-white/30">Closing Mei</span>
              <span className="text-[12px] font-mono text-white/40">— —</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] text-white/30">Update Terkini</span>
              <span className="text-[12px] font-mono text-white/40">— —</span>
            </div>
            <div className="flex items-baseline justify-between pt-2 border-t border-white/[0.04]">
              <span className="text-[10px] text-white/30">Selisih</span>
              <div className="flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/20">
                  <path d="M2 7l4-4 4 4" />
                </svg>
                <span className="text-[12px] font-mono text-white/40">— —</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
));
ClosingVsUpdatePlaceholder.displayName = "ClosingVsUpdatePlaceholder";

/* ─── Baris 6: Rekap Pengiriman (1 card panjang) ──────────────────────────── */
export const RekapPengirimanPlaceholder = memo(() => (
  <div>
    <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-2">
      Rekap Pengiriman dari Gudang ke Toko
    </p>
    <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.015] p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-white/30">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="1" y="3" width="15" height="13" />
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-white/60">Pengiriman per Kategori</h3>
            <p className="text-[11px] text-white/30 mt-0.5">Histori pengiriman aset dari CGA ke toko berdasarkan kategori Oracle</p>
          </div>
        </div>
        <span className="text-[9px] font-semibold uppercase tracking-widest text-amber-400/70 bg-amber-500/10 border border-amber-500/20 rounded-md px-2 py-1">
          Coming Soon
        </span>
      </div>

      {/* Table skeleton */}
      <div className="grid grid-cols-5 gap-3 text-[10px] uppercase tracking-widest text-white/25 pb-2 border-b border-white/[0.04]">
        <span>Kategori</span>
        <span className="text-right">CGA1 →</span>
        <span className="text-right">CGA2 →</span>
        <span className="text-right">CGA3 →</span>
        <span className="text-right">Total</span>
      </div>
      {["C - PERALATAN KOMPUTER", "T - PERALATAN TOKO", "S - PERALATAN PENDINGIN", "E - PERALATAN KANTOR"].map((cat, i) => (
        <div key={i} className="grid grid-cols-5 gap-3 py-2.5 text-[11px] border-b border-white/[0.03]">
          <span className="text-white/30 truncate">{cat}</span>
          <span className="text-right font-mono text-white/20">— —</span>
          <span className="text-right font-mono text-white/20">— —</span>
          <span className="text-right font-mono text-white/20">— —</span>
          <span className="text-right font-mono text-white/20">— —</span>
        </div>
      ))}
    </div>
  </div>
));
RekapPengirimanPlaceholder.displayName = "RekapPengirimanPlaceholder";
