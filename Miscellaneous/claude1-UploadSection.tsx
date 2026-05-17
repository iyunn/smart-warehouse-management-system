"use client";

import { useState, useCallback, useRef } from "react";

type UploadStatus = "idle" | "dragging" | "selected" | "uploading" | "success" | "error";

export default function UploadSection() {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file) return;
    const valid = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
    if (!valid) {
      setStatus("error");
      setFileName("Invalid file type. Please upload .xlsx or .xls");
      return;
    }
    const kb = file.size / 1024;
    setFileName(file.name);
    setFileSize(kb > 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(1)} KB`);
    setStatus("selected");
    setProgress(0);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setStatus("idle");
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setStatus("dragging"); };
  const handleDragLeave = () => setStatus(s => s === "dragging" ? "idle" : s);

  const simulateUpload = () => {
    if (status !== "selected") return;
    setStatus("uploading");
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setStatus("success");
          return 100;
        }
        return p + Math.random() * 15 + 5;
      });
    }, 200);
  };

  const reset = () => {
    setStatus("idle");
    setFileName("");
    setFileSize("");
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white text-[14px] font-semibold">Upload Asset File</h3>
          <p className="text-slate-500 text-[11px] mt-0.5">Import data aset dari file Excel (.xlsx / .xls)</p>
        </div>
        <span className="text-[10px] font-medium px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-wider">
          DAT Import
        </span>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => status === "idle" && inputRef.current?.click()}
        className={`
          relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer
          flex flex-col items-center justify-center gap-3 min-h-[148px] px-6 py-8
          ${status === "dragging" ? "border-cyan-400/60 bg-cyan-500/[0.07]" : ""}
          ${status === "idle" ? "border-white/10 hover:border-cyan-500/40 hover:bg-white/[0.02]" : ""}
          ${status === "selected" ? "border-cyan-500/40 bg-cyan-500/[0.04] cursor-default" : ""}
          ${status === "uploading" ? "border-blue-500/40 bg-blue-500/[0.04] cursor-default" : ""}
          ${status === "success" ? "border-emerald-500/40 bg-emerald-500/[0.04] cursor-default" : ""}
          ${status === "error" ? "border-rose-500/40 bg-rose-500/[0.04] cursor-default" : ""}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />

        {/* IDLE */}
        {status === "idle" && (
          <>
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-500">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-slate-300 text-[13px] font-medium">Drag & drop file di sini</p>
              <p className="text-slate-600 text-[11px] mt-1">atau klik untuk memilih file</p>
            </div>
            <div className="flex gap-2">
              {[".xlsx", ".xls"].map(ext => (
                <span key={ext} className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/10 text-slate-500 font-mono">{ext}</span>
              ))}
            </div>
          </>
        )}

        {/* DRAGGING */}
        {status === "dragging" && (
          <>
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center animate-pulse">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cyan-400">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p className="text-cyan-400 text-[13px] font-semibold">Lepaskan file di sini</p>
          </>
        )}

        {/* SELECTED */}
        {status === "selected" && (
          <div className="flex items-center gap-4 w-full max-w-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-400">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-[13px] font-medium truncate">{fileName}</p>
              <p className="text-slate-500 text-[11px] mt-0.5">{fileSize} · Siap diupload</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); reset(); }} className="text-slate-600 hover:text-white transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {/* UPLOADING */}
        {status === "uploading" && (
          <div className="w-full max-w-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400 animate-spin" style={{ animationDuration: "1.5s" }}>
                  <path d="M21 12a9 9 0 1 1-6.22-8.56" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1.5">
                  <p className="text-white text-[12px] font-medium truncate">{fileName}</p>
                  <p className="text-blue-400 text-[11px] font-semibold ml-2">{Math.min(Math.round(progress), 100)}%</p>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-200"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUCCESS */}
        {status === "success" && (
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <p className="text-emerald-400 text-[13px] font-semibold">Upload berhasil!</p>
              <p className="text-slate-500 text-[11px] mt-0.5">{fileName} · Data sedang diproses</p>
            </div>
          </div>
        )}

        {/* ERROR */}
        {status === "error" && (
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rose-400">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div>
              <p className="text-rose-400 text-[13px] font-semibold">Format tidak valid</p>
              <p className="text-slate-500 text-[11px] mt-0.5">Hanya file .xlsx dan .xls yang diterima</p>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 mt-4">
        {(status === "idle" || status === "error") && (
          <button
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-2 bg-white/[0.05] border border-white/10 text-slate-300 text-[12px] font-medium px-4 py-2 rounded-xl hover:bg-white/[0.08] hover:text-white transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Pilih File
          </button>
        )}

        {status === "selected" && (
          <>
            <button
              onClick={simulateUpload}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[12px] font-semibold px-5 py-2 rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload Sekarang
            </button>
            <button onClick={reset} className="text-slate-500 text-[12px] hover:text-white transition-colors">
              Batal
            </button>
          </>
        )}

        {status === "success" && (
          <button
            onClick={reset}
            className="flex items-center gap-2 bg-white/[0.05] border border-white/10 text-slate-300 text-[12px] font-medium px-4 py-2 rounded-xl hover:bg-white/[0.08] hover:text-white transition-all"
          >
            Upload File Lain
          </button>
        )}

        {status === "uploading" && (
          <p className="text-slate-500 text-[11px]">Sedang mengupload, harap tunggu...</p>
        )}
      </div>
    </div>
  );
}
