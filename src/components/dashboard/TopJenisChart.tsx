import { memo } from "react";

interface Props {
  topJenis: Array<{ jenis: string; count: number }>;
  loading: boolean;
}

function TopJenisChart({ topJenis, loading }: Props) {
  const maxCount = topJenis[0]?.count ?? 1;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="mb-4">
        <h3 className="text-[13px] font-semibold text-white">Top 10 Jenis Barang</h3>
        <p className="text-[11px] text-white/40 mt-0.5">Aset yang sudah terklasifikasi</p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-6 rounded bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      ) : topJenis.length === 0 ? (
        <p className="text-xs text-white/30 py-8 text-center">Belum ada aset terklasifikasi</p>
      ) : (
        <div className="space-y-2">
          {topJenis.map((j, idx) => {
            const pct = (j.count / maxCount) * 100;
            return (
              <div key={j.jenis} className="group">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono text-white/30 w-4">{idx + 1}.</span>
                  <span className="text-[11px] text-white/70 flex-1 truncate" title={j.jenis}>{j.jenis}</span>
                  <span className="text-[11px] font-mono text-white/60">{j.count.toLocaleString()}</span>
                </div>
                <div className="h-1 bg-white/[0.03] rounded-full overflow-hidden ml-6">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500/50 to-blue-500/50 rounded-full transition-all group-hover:from-cyan-500 group-hover:to-blue-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default memo(TopJenisChart);
