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
    <tr className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group">
      {/* kode_asset */}
      <td className="px-4 py-3">
        <span className="text-cyan-400 text-[11px] font-mono font-medium">
          {asset.kode_asset || "—"}
        </span>
      </td>

      {/* original_description */}
      <td className="px-4 py-3 max-w-[220px]">
        <p className="text-slate-300 text-[12px] truncate" title={asset.original_description}>
          {asset.original_description || "—"}
        </p>
      </td>

      {/* jenis */}
      <td className="px-4 py-3">
        <UnknownBadge value={asset.jenis} />
      </td>

      {/* merk */}
      <td className="px-4 py-3">
        <UnknownBadge value={asset.merk} />
      </td>

      {/* kategori */}
      <td className="px-4 py-3">
        <span className="text-slate-500 text-[11px]">{asset.kategori || "—"}</span>
      </td>

      {/* confidence_score */}
      <td className="px-4 py-3">
        <ConfidenceBadge score={asset.confidence_score} />
      </td>

      {/* action */}
      <td className="px-4 py-3">
        <button
          onClick={handleClick}
          className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 border border-white/10 px-3 py-1.5 rounded-lg hover:text-cyan-400 hover:border-cyan-500/40 hover:bg-cyan-500/[0.05] transition-all"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Rule
        </button>
      </td>
    </tr>
  );
}

export default memo(ReviewTableRow);