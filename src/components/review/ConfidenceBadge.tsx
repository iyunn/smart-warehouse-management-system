import { memo } from "react";

interface ConfidenceBadgeProps {
  score: number | string | null;
}

// Map string label dari DB → style + label display
const STRING_MAP: Record<string, { color: string; label: string }> = {
  high:   { color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", label: "High" },
  medium: { color: "text-amber-400 bg-amber-400/10 border-amber-400/20",       label: "Med"  },
  low:    { color: "text-rose-400 bg-rose-400/10 border-rose-400/20",           label: "Low"  },
};

function ConfidenceBadge({ score }: ConfidenceBadgeProps) {
  // Null / undefined → dash
  if (score === null || score === undefined) {
    return <span className="text-slate-700 text-[11px]">—</span>;
  }

  // String label: "low" | "medium" | "high" (dari DB kolom confidence text)
  if (typeof score === "string") {
    const key = score.toLowerCase().trim();
    const mapped = STRING_MAP[key];

    if (mapped) {
      return (
        <span className={`inline-flex items-center text-[10px] font-semibold font-mono px-2 py-0.5 rounded-lg border ${mapped.color}`}>
          {mapped.label}
        </span>
      );
    }

    // String tidak dikenali → dash
    return <span className="text-slate-700 text-[11px]">—</span>;
  }

  // Number: 0–1 (float) atau 0–100 (integer)
  const pct = score <= 1 ? Math.round(score * 100) : Math.round(score);

  let color: string;
  if (pct >= 80)      color = "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
  else if (pct >= 50) color = "text-amber-400 bg-amber-400/10 border-amber-400/20";
  else                color = "text-rose-400 bg-rose-400/10 border-rose-400/20";

  return (
    <span className={`inline-flex items-center text-[10px] font-semibold font-mono px-2 py-0.5 rounded-lg border ${color}`}>
      {pct}%
    </span>
  );
}

export default memo(ConfidenceBadge);
