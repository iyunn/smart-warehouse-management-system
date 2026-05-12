import { memo } from "react";
import SummaryCard from "@/components/SummaryCard";
import type { ReviewSummary } from "../../lib/reviewTypes";

interface ReviewSummaryCardsProps {
  summary: ReviewSummary;
  loading: boolean;
}

function ReviewSummaryCards({ summary, loading }: ReviewSummaryCardsProps) {
  const completionStr = loading ? "—" : `${summary.completionPct}%`;

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      <SummaryCard
        title="Total Unknown"
        value={loading ? "—" : summary.total}
        subtitle="Aset belum terklasifikasi"
        accentColor="amber"
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        }
      />
      <SummaryCard
        title="Unknown Merk"
        value={loading ? "—" : summary.unknownMerk}
        subtitle="Merk belum diidentifikasi"
        accentColor="violet"
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
          </svg>
        }
      />
      <SummaryCard
        title="Unknown Jenis"
        value={loading ? "—" : summary.unknownJenis}
        subtitle="Jenis belum dikategorikan"
        accentColor="blue"
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 10h16M4 14h10M4 18h6" />
          </svg>
        }
      />
      <SummaryCard
        title="Completion"
        value={completionStr}
        subtitle={loading ? "" : `${summary.total - summary.unknownJenis} / ${summary.total} classified`}
        accentColor="cyan"
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        }
      />
    </div>
  );
}

export default memo(ReviewSummaryCards);