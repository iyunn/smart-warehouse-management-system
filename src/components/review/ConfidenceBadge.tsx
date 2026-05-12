import { memo } from "react";

interface ConfidenceBadgeProps {
  score: number | null;
}

function ConfidenceBadge({ score }: ConfidenceBadgeProps) {
  if (score === null || score === undefined) {
    return <span className="text-slate-700 text-[11px]">—</span>;
  }

  const pct = Math.round(score * 100);

  let color: string;
  if (pct >= 80) color = "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
  else if (pct >= 50) color = "text-amber-400 bg-amber-400/10 border-amber-400/20";
  else color = "text-rose-400 bg-rose-400/10 border-rose-400/20";

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold font-mono px-2 py-0.5 rounded-lg border ${color}`}>
      {pct}%
    </span>
  );
}

export default memo(ConfidenceBadge);