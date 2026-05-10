type SummaryCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: string; positive: boolean };
  icon: React.ReactNode;
  accentColor: "cyan" | "blue" | "violet" | "amber";
};

const accentMap = {
  cyan: {
    glow: "hover:shadow-cyan-500/10",
    iconBg: "bg-cyan-500/10 border-cyan-500/20",
    iconColor: "text-cyan-400",
    trendPos: "text-emerald-400 bg-emerald-400/10",
    trendNeg: "text-rose-400 bg-rose-400/10",
    bar: "from-cyan-500 to-cyan-400",
  },
  blue: {
    glow: "hover:shadow-blue-500/10",
    iconBg: "bg-blue-500/10 border-blue-500/20",
    iconColor: "text-blue-400",
    trendPos: "text-emerald-400 bg-emerald-400/10",
    trendNeg: "text-rose-400 bg-rose-400/10",
    bar: "from-blue-500 to-blue-400",
  },
  violet: {
    glow: "hover:shadow-violet-500/10",
    iconBg: "bg-violet-500/10 border-violet-500/20",
    iconColor: "text-violet-400",
    trendPos: "text-emerald-400 bg-emerald-400/10",
    trendNeg: "text-rose-400 bg-rose-400/10",
    bar: "from-violet-500 to-violet-400",
  },
  amber: {
    glow: "hover:shadow-amber-500/10",
    iconBg: "bg-amber-500/10 border-amber-500/20",
    iconColor: "text-amber-400",
    trendPos: "text-emerald-400 bg-emerald-400/10",
    trendNeg: "text-rose-400 bg-rose-400/10",
    bar: "from-amber-500 to-amber-400",
  },
};

export default function SummaryCard({ title, value, subtitle, trend, icon, accentColor }: SummaryCardProps) {
  const acc = accentMap[accentColor];

  return (
    <div
      className={`
        relative bg-[#111827] border border-white/[0.06] rounded-2xl p-5
        hover:border-white/[0.10] hover:shadow-xl ${acc.glow}
        transition-all duration-300 group overflow-hidden
      `}
    >
      {/* Background gradient blob */}
      <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${acc.bar} opacity-[0.07] blur-2xl group-hover:opacity-[0.12] transition-opacity`} />

      <div className="relative flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${acc.iconBg} ${acc.iconColor}`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg ${trend.positive ? acc.trendPos : acc.trendNeg}`}>
            {trend.positive ? "▲" : "▼"} {trend.value}
          </span>
        )}
      </div>

      <div className="mt-4">
        <p className="text-slate-500 text-[11px] uppercase tracking-widest font-medium">{title}</p>
        <p className="text-white text-2xl font-bold mt-1 tracking-tight">{typeof value === "number" ? value.toLocaleString() : value}</p>
        {subtitle && <p className="text-slate-600 text-[11px] mt-1">{subtitle}</p>}
      </div>

      {/* Bottom bar accent */}
      <div className={`absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full bg-gradient-to-r ${acc.bar} transition-all duration-500 rounded-b-2xl`} />
    </div>
  );
}
