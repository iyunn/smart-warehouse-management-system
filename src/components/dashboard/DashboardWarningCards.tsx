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
  icon: React.ReactNode;
  loading: boolean;
}

const WarningCard = memo(({ label, count, hint, href, icon, loading }: WarningCardProps) => {
  const isPlaceholder = count === null;

  const inner = (
    <div className={`rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.08] to-cyan-500/[0.02] px-5 py-5 h-full flex flex-col transition-all ${href && !isPlaceholder ? "hover:border-cyan-500/40 cursor-pointer" : ""}`}>
      {/* Ikon */}
      <div className="w-11 h-11 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center text-cyan-300 mb-4">
        {icon}
      </div>
      {/* Label */}
      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-1.5">{label}</p>
      {/* Angka besar */}
      <p className="text-4xl font-bold text-cyan-300 font-mono leading-none mb-2">
        {loading ? "—" : isPlaceholder ? "—" : count.toLocaleString()}
      </p>
      {/* Hint */}
      <p className="text-[11px] text-white/35 mt-auto">
        {isPlaceholder ? "belum aktif" : hint}
      </p>
    </div>
  );

  if (href && !isPlaceholder) {
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
    <div className="grid grid-cols-2 gap-3 h-full">
      <WarningCard
        label="Belum Mutasi Oracle"
        count={w.belumMutasiOracle}
        hint="item AT belum dimutasi"
        href="/sj/report"
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v14a9 3 0 0 0 18 0V5" /><path d="M3 12a9 3 0 0 0 18 0" />
          </svg>
        }
        loading={loading}
      />
      <WarningCard
        label="Belum Mutasi Web Tracking"
        count={w.belumMutasiWT}
        hint="item AT belum dimutasi WT"
        href="/sj/report"
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        }
        loading={loading}
      />
    </div>
  );
}

export default memo(DashboardWarningCards);
