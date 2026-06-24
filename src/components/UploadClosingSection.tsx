"use client";

/**
 * UploadClosingSection.tsx
 * Upload DAT Closing bulanan → hitung stats per CGA (client-side) →
 * simpan hanya hasil agregasi ke DB (TIDAK raw rows).
 *
 * Stats yang dihitung (sama persis dengan Monitoring):
 *   - total_items: count rows per CGA
 *   - total_qty:   sum kuantitas per CGA
 *   - total_nilai: sum biaya_perolehan per CGA
 *   - total_tercatat: sum jumlah_tercatat per CGA
 *
 * Parsing DAT: reuse txtParser dari monitoring (format identik).
 */

import { useState, useCallback, useRef } from "react";
import { parseTxtFile } from "@/lib/txtParser";

// Ekstrak kode CGA dari field toko (sama seperti monitoring page)
// "CGA1 – CADANGAN GENERAL AFFAIRS 1" → "CGA1"
function extractCGA(toko: string): string {
  const m = toko.match(/CGA\d/i);
  return m ? m[0].toUpperCase() : "LAINNYA";
}

interface CGAStats {
  cga: string;
  total_items: number;
  total_qty: number;
  total_nilai: number;
  total_tercatat: number;
}

function calcStats(records: any[]): CGAStats[] {
  const map: Record<string, CGAStats> = {};
  for (const r of records) {
    const cga = extractCGA(r.toko ?? "");
    if (!["CGA1","CGA2","CGA3"].includes(cga)) continue; // skip non-CGA rows
    if (!map[cga]) map[cga] = { cga, total_items: 0, total_qty: 0, total_nilai: 0, total_tercatat: 0 };
    map[cga].total_items    += 1;
    map[cga].total_qty      += Number(r.kuantitas ?? 0);
    map[cga].total_nilai    += Number(r.biaya_perolehan ?? 0);
    map[cga].total_tercatat += Number(r.jumlah_tercatat ?? 0);
  }
  return Object.values(map).sort((a,b) => a.cga.localeCompare(b.cga));
}

function formatCurrency(v: number): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(v);
}

type Phase = "idle" | "parsing" | "preview" | "submitting" | "success" | "error";

export default function UploadClosingSection() {
  const [phase, setPhase]       = useState<Phase>("idle");
  const [dragging, setDragging] = useState(false);
  const [bulan, setBulan]       = useState(() => {
    // Default = bulan lalu
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [stats, setStats]   = useState<CGAStats[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file) return;
    setPhase("parsing");
    setErrorMsg("");
    try {
      const text = await file.text();
      const { records } = parseTxtFile(text);
      if (records.length === 0) throw new Error("File tidak mengandung data valid.");
      const computed = calcStats(records);
      if (computed.length === 0) throw new Error("Tidak ada data CGA1/CGA2/CGA3 ditemukan.");
      setStats(computed);
      setPhase("preview");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Gagal membaca file.");
      setPhase("error");
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleSubmit = useCallback(async () => {
    setPhase("submitting");
    try {
      const res = await fetch("/api/closing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bulan, stats }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menyimpan");
      setPhase("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Gagal upload.");
      setPhase("error");
    }
  }, [bulan, stats]);

  const reset = useCallback(() => {
    setPhase("idle"); setStats([]); setErrorMsg("");
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const isLoading = phase === "parsing" || phase === "submitting";
  const loadingText = phase === "parsing" ? "Membaca & menghitung data..." : "Menyimpan ke database...";

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-[13px] font-semibold text-white">Upload DAT Closing</h3>
          <p className="text-[11px] text-white/40 mt-0.5">
            Snapshot bulanan — hanya agregasi per CGA yang disimpan, bukan raw data
          </p>
        </div>
      </div>

      {/* Month picker */}
      <div className="mb-4">
        <label className="block text-[11px] font-medium text-white/50 mb-1.5">Bulan Closing *</label>
        <input
          type="month"
          value={bulan}
          onChange={e => setBulan(e.target.value)}
          disabled={isLoading}
          className="bg-white/[0.04] border border-white/[0.08] text-white/80 text-[12px] rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500/50 disabled:opacity-50"
        />
      </div>

      <input ref={inputRef} type="file" accept=".txt" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

      {/* Idle / Error — dropzone */}
      {(phase === "idle" || phase === "error") && (
        <>
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl py-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
              dragging ? "border-cyan-400/50 bg-cyan-500/[0.04]" : "border-white/[0.1] hover:border-white/20"
            }`}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20 mb-2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <p className="text-[12px] text-white/40">Drag file DAT (.txt) atau klik untuk pilih</p>
          </div>
          {phase === "error" && <p className="mt-2 text-[11px] text-rose-400">{errorMsg}</p>}
        </>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="border-2 border-dashed border-white/[0.08] rounded-2xl py-8 flex flex-col items-center gap-3">
          <svg className="animate-spin text-cyan-400" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-6.22-8.56"/>
          </svg>
          <p className="text-[12px] text-white/50">{loadingText}</p>
        </div>
      )}

      {/* Preview stats */}
      {phase === "preview" && (
        <div className="space-y-3">
          <div className="rounded-xl border border-white/[0.06] overflow-hidden">
            <div className="grid grid-cols-5 gap-2 px-4 py-2 bg-white/[0.03] text-[9px] font-semibold uppercase tracking-widest text-white/30">
              <span>CGA</span>
              <span className="text-right">Total Item</span>
              <span className="text-right">Total Qty</span>
              <span className="text-right">Nilai Perolehan</span>
              <span className="text-right">Tercatat</span>
            </div>
            {stats.map(s => (
              <div key={s.cga} className="grid grid-cols-5 gap-2 px-4 py-2.5 border-t border-white/[0.04] text-[11px]">
                <span className="font-semibold text-cyan-300">{s.cga}</span>
                <span className="font-mono text-white/80 text-right">{s.total_items.toLocaleString()}</span>
                <span className="font-mono text-white/70 text-right">{s.total_qty.toLocaleString()}</span>
                <span className="font-mono text-white/60 text-right">{formatCurrency(s.total_nilai)}</span>
                <span className="font-mono text-white/60 text-right">{formatCurrency(s.total_tercatat)}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-white/30">
            Bulan: <span className="text-cyan-300">{bulan}</span> · {stats.length} CGA terdeteksi
          </p>
          <div className="flex items-center justify-end gap-2">
            <button onClick={reset} className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.04] text-white/70 text-[12px] hover:bg-white/[0.08] transition-all">
              Batal
            </button>
            <button onClick={handleSubmit}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[12px] font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20">
              Simpan Closing {bulan}
            </button>
          </div>
        </div>
      )}

      {/* Success */}
      {phase === "success" && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
            <span className="text-[13px] font-semibold">Closing {bulan} berhasil disimpan!</span>
          </div>
          <p className="text-[11px] text-white/50">Data agregasi {stats.length} CGA tersimpan. Trend CGA di Dashboard diperbarui.</p>
          <button onClick={reset} className="text-[11px] text-cyan-400 hover:text-cyan-300 mt-1">Upload bulan lain →</button>
        </div>
      )}
    </div>
  );
}
