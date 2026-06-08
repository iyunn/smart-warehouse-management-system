"use client";

import { memo, useState, useEffect } from "react";
import { generateSJPdfBlob, downloadSJPdf, openSJPdfForPrint } from "@/lib/sjPdfHelpers";
import type { SJDataForPDF } from "@/components/sj/SuratJalanPDF";

interface SJPreviewModalProps {
  data: SJDataForPDF;
  title?: string;
  onClose: () => void;
}

function SJPreviewModal({ data, title = "Surat Jalan Berhasil Disimpan", onClose }: SJPreviewModalProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate PDF saat modal terbuka
  useEffect(() => {
    let cancelled = false;
    let urlToRevoke: string | null = null;

    async function generate() {
      setLoading(true);
      setError(null);
      try {
        const blob = await generateSJPdfBlob(data);
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        urlToRevoke = url;
        setPdfUrl(url);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Gagal generate PDF");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    generate();
    return () => {
      cancelled = true;
      if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
    };
  }, [data]);

  const handleDownload = async () => {
    try {
      await downloadSJPdf(data);
    } catch (err) {
      alert("Gagal download PDF: " + (err instanceof Error ? err.message : "Error"));
    }
  };

  const handlePrint = async () => {
    try {
      await openSJPdfForPrint(data);
    } catch (err) {
      alert("Gagal buka PDF: " + (err instanceof Error ? err.message : "Error"));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-[#0d1117] border border-white/10 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/30">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                <circle cx="8" cy="8" r="6.5" /><path d="M5 8l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">{title}</h3>
              <p className="text-[11px] text-white/40 mt-0.5">
                <span className="font-mono text-cyan-400">{data.no_sj}</span>
                {" "}— {data.tujuan_kode} ({data.items.length} item)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={loading || !!error}
              className="flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 disabled:opacity-50"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download PDF
            </button>

            <button
              onClick={handlePrint}
              disabled={loading || !!error}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Print
            </button>

            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.05] transition-all"
              title="Tutup"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* PDF Preview */}
        <div className="flex-1 overflow-hidden bg-[#1a1a1f]">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <svg className="animate-spin mx-auto mb-3 text-cyan-400" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2A10 10 0 1 1 2 12" />
                </svg>
                <p className="text-sm text-white/60">Membuat PDF preview...</p>
              </div>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <p className="text-sm text-rose-400 mb-2">⚠ Gagal generate PDF</p>
                <p className="text-xs text-white/50">{error}</p>
                <p className="text-xs text-white/40 mt-3">
                  Coba klik Download PDF untuk generate ulang.
                </p>
              </div>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title="Surat Jalan PDF Preview"
            />
          ) : null}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-white/40">
          <span>Tip: Gunakan tombol "Print" untuk membuka PDF di tab baru dan langsung print fisik.</span>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(SJPreviewModal);
