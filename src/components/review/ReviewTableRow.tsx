import { memo, useCallback } from "react";
import ConfidenceBadge from "./ConfidenceBadge";
import UnknownBadge from "./UnknownBadge";
import type { AssetClean } from "../../lib/reviewTypes";

interface ReviewTableRowProps {
  asset: AssetClean;
  onAddRule: (asset: AssetClean) => void;
}

function ReviewTableRow({ asset, onAddRule }: ReviewTableRowProps) {
  const handleClick = useCallback(() => onAddRule(asset), [asset, onAddRule]);

  return (
    <div className="grid grid-cols-[1fr_160px_140px_80px_44px] gap-4 items-center border-b border-white/[0.04] px-5 py-3.5 hover:bg-white/[0.025] transition-colors group">

      {/* Deskripsi */}
      <div className="min-w-0">
        <p className="text-slate-300 text-[12px] truncate" title={asset.original_description}>
          {asset.original_description || "—"}
        </p>
        {asset.normalized_description &&
          asset.normalized_description !== asset.original_description && (
            <p className="text-slate-600 text-[10px] truncate mt-0.5" title={asset.normalized_description}>
              {asset.normalized_description}
            </p>
          )}
      </div>

      {/* Jenis */}
      <div><UnknownBadge value={asset.jenis} /></div>

      {/* Merk */}
      <div><UnknownBadge value={asset.merk} /></div>

      {/* Confidence */}
      <div><ConfidenceBadge score={asset.confidence_score} /></div>

      {/* Action */}
      <div className="flex justify-end">
        <button
          onClick={handleClick}
          aria-label="Tambah rule untuk aset ini"
          className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 text-slate-500 hover:text-cyan-400 hover:border-cyan-500/40 hover:bg-cyan-500/[0.05] transition-all"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default memo(ReviewTableRow);
