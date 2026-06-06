"use client";

import { useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { WAREHOUSE_COST_CENTERS, WAREHOUSE_LABELS } from "@/lib/types";

type CostCenterFilter = "ALL" | "CGA1" | "CGA2" | "CGA3";
type DownloadStatus = "idle" | "loading" | "error";

const FILTER_OPTIONS: { value: CostCenterFilter; label: string; desc: string }[] = [
  { value: "ALL",  label: "Semua Gudang",  desc: "CGA1 + CGA2 + CGA3" },
  { value: "CGA1", label: "CGA1", desc: WAREHOUSE_LABELS.CGA1 },
  { value: "CGA2", label: "CGA2", desc: WAREHOUSE_LABELS.CGA2 },
  { value: "CGA3", label: "CGA3", desc: WAREHOUSE_LABELS.CGA3 },
]

export default function ReportsPage() {
  const [selected, setSelected] = useState<CostCenterFilter>("ALL")
  const [status, setStatus] = useState<DownloadStatus>("idle")
  const [errorMsg, setErrorMsg] = useState("")

  const handleDownload = useCallback(async () => {
    setStatus("loading")
    setErrorMsg("")

    try {
      const res = await fetch(`/api/reports/dat-summary?cost_center=${selected}`)

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `Server error ${res.status}`)
      }

      // Trigger download
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `DAT-Summary-${selected}-${new Date().toISOString().slice(0, 10)}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setStatus("idle")
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Gagal generate report")
      setStatus("error")
    }
  }, [selected])

  return (
    <div className="flex h-screen overflow-hidden bg-[#080e18] text-white">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title="Reports" />

        <main className="flex-1 overflow-y-auto px-6 py-5">
          <div className="mb-6">
            <h1 className="text-lg font-semibold tracking-tight text-white">Reports</h1>
            <p className="mt-0.5 text-xs text-white/40">
              Export laporan rekap aset gudang dari data DAT Oracle
            </p>
          </div>

          {/* Report cards */}
          <div className="grid grid-cols-1 gap-4 max-w-2xl">

            {/* DAT Summary Report */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
              <div className="flex items-start gap-4 mb-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-white">Rekap DAT per Jenis Barang</h3>
                  <p className="mt-0.5 text-[11px] text-white/40 leading-relaxed">
                    Summary aset per cost center, dikelompokkan per kategori Oracle dan jenis barang. 
                    Menampilkan jumlah item, qty, nilai perolehan, dan nilai tercatat.
                  </p>
                </div>
              </div>

              {/* Filter cost center */}
              <div className="mb-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-2">
                  Cost Center
                </p>
                <div className="flex flex-wrap gap-2">
                  {FILTER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSelected(opt.value)}
                      className={[
                        "flex flex-col items-start px-3 py-2 rounded-xl border text-left transition-all",
                        selected === opt.value
                          ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                          : "border-white/10 bg-white/[0.03] text-white/50 hover:border-white/20 hover:text-white/80",
                      ].join(" ")}
                    >
                      <span className="text-[12px] font-semibold">{opt.label}</span>
                      <span className="text-[10px] opacity-70 mt-0.5">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Error message */}
              {status === "error" && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] px-3 py-2.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-400 shrink-0">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <p className="text-xs text-rose-300">{errorMsg}</p>
                </div>
              )}

              {/* Download button */}
              <button
                onClick={handleDownload}
                disabled={status === "loading"}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-[12px] font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-500/30 disabled:opacity-50 disabled:pointer-events-none"
              >
                {status === "loading" ? (
                  <>
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M7 1.5A5.5 5.5 0 1 1 1.5 7" />
                    </svg>
                    Generating PDF…
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download PDF
                  </>
                )}
              </button>
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}
