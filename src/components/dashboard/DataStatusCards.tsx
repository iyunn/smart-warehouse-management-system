import { memo } from "react";

interface DataStatusCardsProps {
  datUpdate:  string | null;
  datClosing: string | null;
  lppUpdate:  string | null;
  lppClosing: string | null;
  loading:    boolean;
}

function formatUpdateDate(iso: string | null): string {
  if (!iso) return "Belum ada data";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

function formatClosingPeriod(period: string | null): string {
  if (!period) return "Belum ada data";
  const [year, month] = period.split("-");
  const monthNames = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  return `${monthNames[parseInt(month)] ?? month} ${year}`;
}

interface CardProps {
  label: string;
  source: "DAT" | "LPP";
  variant: "update" | "closing";
  value: string;
  isEmpty: boolean;
  loading: boolean;
}

const StatusCard = memo(({ label, source, variant, value, isEmpty, loading }: CardProps) => {
  const isDat = source === "DAT";
  const accentColor = isDat
    ? variant === "update" ? "cyan" : "blue"
    : variant === "update" ? "violet" : "amber";

  const colorMap: Record<string, { border: string; bg: string; text: string; dot: string }> = {
    cyan:   { border: "border-cyan-500/20",   bg: "bg-cyan-500/[0.04]",   text: "text-cyan-300",   dot: "bg-cyan-400" },
    blue:   { border: "border-blue-500/20",   bg: "bg-blue-500/[0.04]",   text: "text-blue-300",   dot: "bg-blue-400" },
    violet: { border: "border-violet-500/20", bg: "bg-violet-500/[0.04]", text: "text-violet-300", dot: "bg-violet-400" },
    amber:  { border: "border-amber-500/20",  bg: "bg-amber-500/[0.04]",  text: "text-amber-300",  dot: "bg-amber-400" },
  };
  const c = colorMap[accentColor];

  return (
    <div className={`rounded-xl border ${isEmpty ? "border-white/[0.06] bg-white/[0.02]" : `${c.border} ${c.bg}`} px-4 py-3`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${isEmpty ? "bg-white/20" : c.dot}`} />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">{label}</span>
      </div>
      <p className={`text-[13px] font-semibold ${isEmpty ? "text-white/30" : c.text}`}>
        {loading ? "—" : value}
      </p>
    </div>
  );
});
StatusCard.displayName = "StatusCard";

function DataStatusCards({ datUpdate, datClosing, lppUpdate, lppClosing, loading }: DataStatusCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatusCard label="DAT Update"   source="DAT" variant="update"  value={formatUpdateDate(datUpdate)}    isEmpty={!datUpdate}  loading={loading} />
      <StatusCard label="DAT Closing"  source="DAT" variant="closing" value={formatClosingPeriod(datClosing)} isEmpty={!datClosing} loading={loading} />
      <StatusCard label="LPP Update"   source="LPP" variant="update"  value={formatUpdateDate(lppUpdate)}    isEmpty={!lppUpdate}  loading={loading} />
      <StatusCard label="LPP Closing"  source="LPP" variant="closing" value={formatClosingPeriod(lppClosing)} isEmpty={!lppClosing} loading={loading} />
    </div>
  );
}

export default memo(DataStatusCards);
