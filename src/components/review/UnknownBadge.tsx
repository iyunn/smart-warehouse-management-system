import { memo } from "react";

interface UnknownBadgeProps {
  value: string;
}

function UnknownBadge({ value }: UnknownBadgeProps) {
  if (!value || value === "Unknown") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-lg border text-amber-400 bg-amber-400/10 border-amber-400/20">
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        Unknown
      </span>
    );
  }
  return <span className="text-slate-300 text-[12px]">{value}</span>;
}

export default memo(UnknownBadge);