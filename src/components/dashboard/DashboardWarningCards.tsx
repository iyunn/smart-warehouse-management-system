import { memo } from "react";

// ─── Dashboard Warning Cards (Sesi 4) ───────────────────────────────────────
// Menggantikan welcome banner "Selamat datang, Admin".
// Menampilkan warning penting yang butuh tindakan user:
//   - Barang sudah dikirim (AT) tapi belum input kode aset
//   - Barang sudah input kode aset tapi belum dicentang mutasi Oracle
//   - Belum mutasi Web Tracking (placeholder, aktif setelah integrasi LPP/WT)

export interface DashboardWarnings {
  belumInputKodeAset: number;
  belumMutasiOracle: number;
  belumMutasiWT: number;
}

interface WarningCardProps {
  label: string;
  count: number | null;
  hint: string;
  href?: string;
  variant: "rose" | "amber" | "violet" | "slate";
  loading: boolean;
}

const VARIANT_MAP: Record<string, { border: string; bg: string; text: string; dot: string }> = {
  rose:  { border: "border-rose-500/25",  bg: "bg-rose-500/[0.05]",  text: "text-rose-300",  dot: "bg-rose-400"  },
  amber: { border: "border-amber-500/25", bg: "bg-amber-500/[0.05]", text: "text-amber-300", dot: "bg-amber-400" },
  violet: { border: "border-violet-500/25", bg: "bg-violet-500/[0.05]", text: "text-violet-300", dot: "bg-violet-400" },
  slate: { border: "border-white/[0.08]", bg: "bg-white/[0.02]",     text: "text-white/40",  dot: "bg-white/20"  },
};

const WarningCard = memo(({ label, count, hint, href, variant, loading }: WarningCardProps) => {
  // count null = fitur belum aktif (placeholder). count 0 = aman (tetap tampil tapi tenang).
  const isPlaceholder = count === null;
  const isClear = count === 0;
  const v = isClear || isPlaceholder ? VARIANT_MAP.slate : VARIANT_MAP[variant];

  const inner = (
    <div className={`rounded-xl border ${v.border} ${v.bg} px-4 py-3 h-full transition-all ${href && !isPlaceholder && !isClear ? "hover:border-white/20 cursor-pointer" : ""}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${v.dot}`} />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <p className={`text-xl font-bold ${v.text}`}>
          {loading ? "—" : isPlaceholder ? "—" : count.toLocaleString()}
        </p>
        <span className="text-[10px] text-white/30">
          {isPlaceholder ? "belum aktif" : isClear ? "tidak ada" : hint}
        </span>
      </div>
    </div>
  );

  if (href && !isPlaceholder && !isClear) {
    return <a href={href} className="block h-full">{inner}</a>;
  }
  return inner;
});
WarningCard.displayName = "WarningCard";

function DashboardWarningCards({
  warnings, loading,
}: {
  warnings: DashboardWarnings | null;
  loading: boolean;
}) {
  const w = warnings ?? { belumInputKodeAset: 0, belumMutasiOracle: 0, belumMutasiWT: 0 };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <WarningCard
        label="Belum Mutasi Oracle"
        count={w.belumMutasiOracle}
        hint="item AT belum dimutasi"
        href="/sj/report"
        variant="amber"
        loading={loading}
      />
      <WarningCard
        label="Belum Mutasi Web Tracking"
        count={w.belumMutasiWT}
        hint="item AT belum dimutasi WT"
        href="/sj/report"
        variant="violet"
        loading={loading}
      />
    </div>
  );
}

export default memo(DashboardWarningCards);
