import { memo } from "react";
import { NO_MERK_VALUE } from "@/lib/classifier";

interface UnknownBadgeProps {
  value: string | null | undefined;
}

function UnknownBadge({ value }: UnknownBadgeProps) {
  // Unknown — amber warning
  if (!value || value === "Unknown") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-lg border text-amber-400 bg-amber-400/10 border-amber-400/20">
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        Unknown
      </span>
    );
  }

  // Non-Merk — slate, sudah di-review, memang tidak bermerek
  if (value === NO_MERK_VALUE) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-lg border text-slate-400 bg-slate-400/10 border-slate-400/20">
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="8" y1="12" x2="16" y2="12" />
        </svg>
        Non-Merk
      </span>
    );
  }

  // Nilai normal — plain text
  return <span className="text-slate-300 text-[12px]">{value}</span>;
}

export default memo(UnknownBadge);
