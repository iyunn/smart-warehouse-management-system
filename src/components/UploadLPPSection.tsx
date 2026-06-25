"use client";

/**
 * UploadLPPSection.tsx
 * Upload pipeline untuk LPP Web Tracking:
 *   1. Drag-and-drop / file picker — terima MULTIPLE file sekaligus (3 file,
 *      satu per CGA1/CGA2/CGA3, auto-detect dari nama file)
 *   2. Parse client-side (HTML-table-as-.xls via DOMParser, lihat lppParser.ts)
 *   3. DELETE semua lpp_raw (full replace) → batch insert ke /api/lpp/process
 *   4. Live progress UI
 */

import { useState, useCallback, useRef, useReducer } from "react";
import { parseLPPFiles, type LPPFileSummary } from "@/lib/lppParser";
import { processLPPBatches, type LPPProcessSummary } from "@/lib/lppBatchProcessor";

// ─── State management ───────────────────────────────────────────────────
type Phase = "idle" | "dragging" | "selected" | "parsing" | "processing" | "success" | "error";

interface State {
  phase: Phase;
  files: File[];
  fileSummaries: LPPFileSummary[];
  parseWarnings: string[];
  batchProgress: number;
  currentBatch: number;
  totalBatches: number;
  summary: LPPProcessSummary | null;
  errorMessage: string;
  errorDetail: string;
}

type Action =
  | { type: "DRAG_ENTER" }
  | { type: "DRAG_LEAVE" }
  | { type: "FILES_SELECTED"; files: File[] }
  | { type: "PARSE_START" }
  | { type: "PARSE_DONE"; fileSummaries: LPPFileSummary[]; warnings: string[] }
  | { type: "PROCESS_START"; totalBatches: number }
  | { type: "BATCH_DONE"; current: number; total: number; progress: number }
  | { type: "SUCCESS"; summary: LPPProcessSummary }
  | { type: "ERROR"; message: string; detail: string }
  | { type: "RESET" };

const initialState: State = {
  phase: "idle",
  files: [],
  fileSummaries: [],
  parseWarnings: [],
  batchProgress: 0,
  currentBatch: 0,
  totalBatches: 0,
  summary: null,
  errorMessage: "",
  errorDetail: "",
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "DRAG_ENTER":
      return state.phase === "idle" ? { ...state, phase: "dragging" } : state;
    case "DRAG_LEAVE":
      return state.phase === "dragging" ? { ...state, phase: "idle" } : state;
    case "FILES_SELECTED":
      return { ...initialState, phase: "selected", files: action.files };
    case "PARSE_START":
      return { ...state, phase: "parsing" };
    case "PARSE_DONE":
      return { ...state, fileSummaries: action.fileSummaries, parseWarnings: action.warnings };
    case "PROCESS_START":
      return { ...state, phase: "processing", totalBatches: action.totalBatches, currentBatch: 0, batchProgress: 0 };
    case "BATCH_DONE":
      return { ...state, currentBatch: action.current + 1, totalBatches: action.total, batchProgress: action.progress };
    case "SUCCESS":
      return { ...state, phase: "success", summary: action.summary };
    case "ERROR":
      return { ...state, phase: "error", errorMessage: action.message, errorDetail: action.detail };
    case "RESET":
      return { ...initialState };
    default:
      return state;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

const CGA_BADGE: Record<string, string> = {
  CGA1: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  CGA2: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  CGA3: "bg-rose-500/10 text-rose-300 border-rose-500/20",
};

// ─── Component ───────────────────────────────────────────────────────────
export default function UploadLPPSection() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [showWarnings, setShowWarnings] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const isProcessing = state.phase === "parsing" || state.phase === "processing";

  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    dispatch({ type: "FILES_SELECTED", files });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dispatch({ type: "DRAG_LEAVE" });
    if (state.phase !== "idle") return;
    handleFiles(e.dataTransfer.files);
  }, [state.phase, handleFiles]);

  const startPipeline = useCallback(async () => {
    dispatch({ type: "PARSE_START" });
    abortRef.current = new AbortController();

    try {
      const { records, fileSummaries, warnings } = await parseLPPFiles(state.files);
      dispatch({ type: "PARSE_DONE", fileSummaries, warnings });

      // Full replace: DELETE semua lpp_raw sebelum batch pertama
      const clearRes = await fetch("/api/lpp/clear", { method: "POST" });
      if (!clearRes.ok) {
        const errData = await clearRes.json().catch(() => ({}));
        throw new Error(errData.error ?? "Gagal menghapus data LPP lama");
      }

      const totalBatches = Math.ceil(records.length / 500);
      dispatch({ type: "PROCESS_START", totalBatches });

      const summary = await processLPPBatches(
        records,
        (evt) => dispatch({ type: "BATCH_DONE", current: evt.batchIndex, total: evt.totalBatches, progress: evt.percentComplete }),
        abortRef.current.signal
      );

      if (summary.failedBatches > 0 && summary.successfulBatches === 0) {
        throw new Error("Semua batch gagal diupload. " + (summary.errors[0] ?? ""));
      }

      dispatch({ type: "SUCCESS", summary });
    } catch (err) {
      dispatch({
        type: "ERROR",
        message: "Gagal memproses file LPP",
        detail: err instanceof Error ? err.message : String(err),
      });
    }
  }, [state.files]);

  const cancelUpload = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#111827] p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-[13px] font-semibold text-white">Upload LPP Update</h3>
          <p className="text-[11px] text-white/40 mt-0.5">
            Drag 3 file .xls sekaligus (CGA1, CGA2, CGA3) — CGA otomatis terdeteksi dari nama file
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".xls,.html"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div
        onDragOver={(e) => { e.preventDefault(); if (state.phase === "idle") dispatch({ type: "DRAG_ENTER" }); }}
        onDragLeave={() => dispatch({ type: "DRAG_LEAVE" })}
        onDrop={handleDrop}
        onClick={() => (state.phase === "idle") && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl py-10 flex flex-col items-center justify-center transition-all ${
          state.phase === "dragging"
            ? "border-violet-400/50 bg-violet-500/[0.04] cursor-pointer"
            : state.phase === "idle"
              ? "border-white/[0.1] hover:border-white/20 cursor-pointer"
              : "border-white/[0.08]"
        }`}
      >
        {(state.phase === "idle" || state.phase === "dragging") && (
          <>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={state.phase === "dragging" ? "text-violet-400 mb-2" : "text-white/20 mb-2"}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className="text-[12px] text-white/40">
              {state.phase === "dragging" ? "Lepas file di sini..." : "Drag 3 file LPP atau klik untuk pilih"}
            </p>
          </>
        )}

        {state.phase === "selected" && (
          <div className="w-full max-w-md px-4 space-y-2">
            <p className="text-[11px] text-white/40 mb-1">{state.files.length} file dipilih:</p>
            {state.files.map((f, i) => {
              const cga = f.name.match(/CGA\s*([123])/i);
              return (
                <div key={i} className="flex items-center gap-2 bg-white/[0.03] rounded-lg px-3 py-2">
                  <span className="text-[11px] text-white/70 truncate flex-1">{f.name}</span>
                  {cga ? (
                    <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded border ${CGA_BADGE[`CGA${cga[1]}`]}`}>
                      CGA{cga[1]}
                    </span>
                  ) : (
                    <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded border bg-rose-500/10 text-rose-300 border-rose-500/20">
                      CGA?
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {(state.phase === "parsing" || state.phase === "processing") && (
          <div className="w-full max-w-md px-4 space-y-3">
            <div className="flex items-center gap-3">
              <svg className="animate-spin text-violet-400" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.22-8.56" />
              </svg>
              <p className="text-[12px] text-white/60">
                {state.phase === "parsing" ? "Membaca & parsing file LPP..." : `Mengupload batch ${state.currentBatch}/${state.totalBatches}...`}
              </p>
            </div>
            {state.phase === "processing" && (
              <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-300" style={{ width: `${state.batchProgress}%` }} />
              </div>
            )}
          </div>
        )}

        {state.phase === "success" && state.summary && (
          <div className="w-full max-w-md px-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-[12px] font-semibold text-emerald-400">
                {state.summary.totalRows.toLocaleString()} baris LPP berhasil diupload
              </p>
            </div>
            <div className="space-y-1.5">
              {state.fileSummaries.map((f) => (
                <div key={f.filename} className="flex items-center justify-between text-[11px]">
                  <span className="text-white/50 truncate">{f.filename}</span>
                  <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded border ${CGA_BADGE[f.cga]}`}>
                    {f.cga} · {f.rowCount} baris
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-white/25 mt-2">Durasi: {formatDuration(state.summary.durationMs)}</p>
          </div>
        )}

        {state.phase === "error" && (
          <div className="w-full max-w-md px-4 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rose-400">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div>
              <p className="text-[12px] font-semibold text-rose-400">{state.errorMessage}</p>
              <p className="text-[11px] text-white/40 mt-1 leading-relaxed">{state.errorDetail}</p>
            </div>
          </div>
        )}
      </div>

      {state.phase === "success" && state.parseWarnings.length > 0 && (
        <div className="mt-3">
          <button onClick={() => setShowWarnings((v) => !v)} className="text-[11px] text-amber-400 hover:text-amber-300">
            {showWarnings ? "Sembunyikan" : "Lihat"} {state.parseWarnings.length} peringatan
          </button>
          {showWarnings && (
            <div className="mt-2 rounded-xl bg-amber-500/[0.05] border border-amber-500/20 p-3 space-y-1">
              {state.parseWarnings.map((w, i) => <p key={i} className="text-[11px] text-amber-300">{w}</p>)}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 mt-4">
        {(state.phase === "idle" || state.phase === "error") && (
          <button onClick={() => inputRef.current?.click()} className="flex items-center gap-2 bg-white/[0.05] border border-white/10 text-slate-300 text-[12px] font-medium px-4 py-2 rounded-xl hover:bg-white/[0.08] hover:text-white transition-all">
            Pilih File
          </button>
        )}

        {state.phase === "selected" && (
          <>
            <button onClick={startPipeline} className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-[12px] font-semibold px-5 py-2 rounded-xl hover:from-violet-400 hover:to-purple-500 transition-all shadow-lg shadow-violet-500/20">
              Proses & Upload
            </button>
            <button onClick={reset} className="text-slate-500 text-[12px] hover:text-white transition-colors">Batal</button>
          </>
        )}

        {isProcessing && (
          <button onClick={cancelUpload} className="flex items-center gap-2 bg-white/[0.05] border border-rose-500/20 text-rose-400 text-[12px] font-medium px-4 py-2 rounded-xl hover:bg-rose-500/10 transition-all">
            Batalkan
          </button>
        )}

        {state.phase === "success" && (
          <button onClick={reset} className="flex items-center gap-2 bg-white/[0.05] border border-white/10 text-slate-300 text-[12px] font-medium px-4 py-2 rounded-xl hover:bg-white/[0.08] hover:text-white transition-all">
            Upload File Lain
          </button>
        )}
      </div>
    </div>
  );
}
