"use client";

/**
 * UploadWTSJSection.tsx
 * Upload PDF Surat Jalan Web Tracking → parse → preview → import ke SmartWMS.
 *
 * Flow:
 *   1. Drag/pilih file PDF SJ WT
 *   2. Parse text via pdfjs-dist (client-side, tidak upload file ke server)
 *   3. Tampilkan preview modal — user bisa edit jenis/merk tiap item sebelum save
 *   4. Submit → POST /api/sj/import-wt → SJ + items otomatis dibuat
 *      (tujuan auto-create kalau belum ada, kode_asset terisi → masuk Rekap Alokasi)
 */

import { useState, useCallback, useRef } from "react";
import { parseWTSJText, type WTParsedSJ, type WTParsedItem } from "@/lib/wtSJParser";
import { SATUAN_OPTIONS, type SatuanType } from "@/lib/sjTypes";

// Item yang bisa diedit user di preview modal
interface EditableItem extends WTParsedItem {
  jenis: string;
  merk: string;
  qty: number;
  satuan: SatuanType;
  is_baru: boolean;
}

type Phase = "idle" | "parsing" | "preview" | "submitting" | "success" | "error";

// ─── Helper extract jenis & merk dari nama_barang ─────────────────────────
// Heuristik sederhana: word 0 = jenis, word 1+ cek apakah ada di list merk umum.
// User bisa koreksi di preview kalau salah.
const KNOWN_MERKS = [
  "zyrex", "epson", "canon", "hp", "dell", "lenovo", "asus", "acer", "samsung",
  "dahua", "honeywell", "zebra", "brother", "panasonic", "lg", "sharp",
];

function extractJenisMerk(namaBarang: string): { jenis: string; merk: string } {
  const words = namaBarang.trim().toUpperCase().split(/\s+/);
  const jenis = words[0] ?? "";
  const merkWord = words.find(w => KNOWN_MERKS.includes(w.toLowerCase())) ?? "";
  return { jenis: jenis.charAt(0) + jenis.slice(1).toLowerCase(), merk: merkWord.charAt(0) + merkWord.slice(1).toLowerCase() };
}

// ─── Sub-komponen: baris item di preview ─────────────────────────────────
function ItemPreviewRow({
  item, idx, onChange,
}: {
  item: EditableItem;
  idx: number;
  onChange: (idx: number, patch: Partial<EditableItem>) => void;
}) {
  return (
    <div className="grid grid-cols-[90px_1fr_1fr_60px_70px_1fr] gap-2 items-center py-2 border-b border-white/[0.04] last:border-0">
      <span className="text-[10px] font-mono text-cyan-300/80">{item.kode_asset}</span>
      <input type="text" value={item.jenis}
        onChange={e => onChange(idx, { jenis: e.target.value })}
        placeholder="Jenis"
        className="bg-white/[0.04] border border-white/[0.08] text-white/80 text-[11px] rounded-lg px-2 py-1.5 focus:outline-none focus:border-cyan-500/50"
      />
      <input type="text" value={item.merk}
        onChange={e => onChange(idx, { merk: e.target.value })}
        placeholder="Merk"
        className="bg-white/[0.04] border border-white/[0.08] text-white/80 text-[11px] rounded-lg px-2 py-1.5 focus:outline-none focus:border-cyan-500/50"
      />
      <input type="text" inputMode="numeric" value={item.qty || ""}
        onChange={e => { const v = e.target.value.replace(/\D/g, ""); onChange(idx, { qty: v ? parseInt(v) : 1 }); }}
        className="bg-white/[0.04] border border-white/[0.08] text-white/80 text-[11px] rounded-lg px-2 py-1.5 text-right focus:outline-none focus:border-cyan-500/50"
      />
      <div className="flex items-center gap-1">
        <input type="checkbox" checked={item.is_baru}
          onChange={e => onChange(idx, { is_baru: e.target.checked })}
          className="w-3.5 h-3.5 rounded accent-emerald-500 cursor-pointer"
        />
        <span className="text-[10px] text-white/40">Baru</span>
      </div>
      <input type="text" value={item.keterangan}
        onChange={e => onChange(idx, { keterangan: e.target.value })}
        placeholder="Keterangan..."
        className="bg-white/[0.04] border border-white/[0.08] text-white/80 text-[11px] rounded-lg px-2 py-1.5 focus:outline-none focus:border-cyan-500/50"
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────
export default function UploadWTSJSection() {
  const [phase, setPhase]         = useState<Phase>("idle");
  const [dragging, setDragging]   = useState(false);
  const [parsed, setParsed]       = useState<WTParsedSJ | null>(null);
  const [items, setItems]         = useState<EditableItem[]>([]);
  const [errorMsg, setErrorMsg]   = useState("");
  const [successInfo, setSuccessInfo] = useState<{ no_sj: string; tujuan_created: boolean } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file || file.type !== "application/pdf") {
      setErrorMsg("File harus berformat PDF.");
      setPhase("error");
      return;
    }

    setPhase("parsing");
    setErrorMsg("");

    try {
      // Baca PDF sebagai ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Load pdfjs-dist v3 (lazy import supaya tidak tambah bundle size initial)
      // Gunakan v3 bukan v4/v6 — v3 tidak butuh Promise.withResolvers/Promise.try
      // yang hanya ada di ES2024 dan menyebabkan error di Codespace/Node.js < 22.
      // Install: npm install pdfjs-dist@3.11.174
      const pdfjsLib = await import("pdfjs-dist");

      // Worker dari public/ — copy sekali:
      //   cp node_modules/pdfjs-dist/build/pdf.worker.min.js public/pdf.worker.min.js
      // v3 pakai .js bukan .mjs
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      // Extract text dari semua halaman.
      // pdfjs-dist v3 mengembalikan items per "text run" PDF (bisa sangat terfragmentasi).
      // Kita join items dalam satu page dengan "\n" per item — parser akan
      // handle dua mode: fullText (join spasi) untuk header, lineText (newline) untuk tabel.
      let fullText = "";
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((it: any) => (it.str ?? "").trim())
          .filter((s: string) => s.length > 0)
          .join("\n");
        fullText += pageText + "\n";
      }

      const result = parseWTSJText(fullText);
      setParsed(result);

      // Build editable items — pre-fill jenis/merk dari nama_barang
      const editables: EditableItem[] = result.items.map(it => {
        const { jenis, merk } = extractJenisMerk(it.nama_barang);
        return { ...it, jenis, merk, qty: 1, satuan: "Unit", is_baru: false };
      });
      setItems(editables);
      setPhase("preview");

    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Gagal membaca PDF.");
      setPhase("error");
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleItemChange = useCallback((idx: number, patch: Partial<EditableItem>) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!parsed) return;
    setPhase("submitting");

    try {
      const res = await fetch("/api/sj/import-wt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tujuan_kode: parsed.tujuan_kode,
          tujuan_nama: parsed.tujuan_nama,
          tanggal:     parsed.tanggal,
          pembawa:     parsed.pembawa,
          no_sj_wt:   parsed.no_sj_wt,
          items:       items.map(it => ({
            kode_asset:  it.kode_asset,
            jenis:       it.jenis,
            merk:        it.merk,
            keterangan:  it.keterangan || it.nama_barang,
            qty:         it.qty,
            satuan:      it.satuan,
            is_baru:     it.is_baru,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal import");

      setSuccessInfo({ no_sj: data.no_sj, tujuan_created: data.tujuan_created });
      setPhase("success");

    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Gagal import SJ.");
      setPhase("error");
    }
  }, [parsed, items]);

  const reset = useCallback(() => {
    setPhase("idle");
    setParsed(null);
    setItems([]);
    setErrorMsg("");
    setSuccessInfo(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-[13px] font-semibold text-white">Import SJ Web Tracking</h3>
          <p className="text-[11px] text-white/40 mt-0.5">
            Upload PDF SJ WT → otomatis dibuat SJ SmartWMS + terisi di Rekap Alokasi
          </p>
        </div>
      </div>

      <input ref={inputRef} type="file" accept="application/pdf" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      {/* ── Idle/Error — dropzone ── */}
      {(phase === "idle" || phase === "error") && (
        <>
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl py-10 flex flex-col items-center justify-center cursor-pointer transition-all ${
              dragging ? "border-rose-400/50 bg-rose-500/[0.04]" : "border-white/[0.1] hover:border-white/20"
            }`}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20 mb-2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            <p className="text-[12px] text-white/40">Drag PDF SJ WT atau klik untuk pilih</p>
          </div>
          {phase === "error" && (
            <p className="mt-3 text-[11px] text-rose-400">{errorMsg}</p>
          )}
        </>
      )}

      {/* ── Parsing ── */}
      {phase === "parsing" && (
        <div className="border-2 border-dashed border-white/[0.08] rounded-2xl py-10 flex flex-col items-center gap-3">
          <svg className="animate-spin text-rose-400" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-6.22-8.56"/>
          </svg>
          <p className="text-[12px] text-white/50">Membaca PDF SJ WT...</p>
        </div>
      )}

      {/* ── Preview Modal ── */}
      {phase === "preview" && parsed && (
        <div className="space-y-4">
          {/* Header info */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2 text-[11px]">
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-white/40">No SJ WT:</span> <span className="font-mono text-white/80">{parsed.no_sj_wt || "—"}</span></div>
              <div><span className="text-white/40">Tanggal:</span> <span className="text-white/80">{parsed.tanggal}</span></div>
              <div><span className="text-white/40">Tujuan:</span> <span className="text-cyan-300">{parsed.tujuan_kode} — {parsed.tujuan_nama}</span></div>
              <div><span className="text-white/40">Pembawa:</span> <span className="text-white/80">{parsed.pembawa || "—"}</span></div>
            </div>
          </div>

          {/* Items editor */}
          <div>
            <div className="grid grid-cols-[90px_1fr_1fr_60px_70px_1fr] gap-2 mb-2 text-[9px] font-semibold uppercase tracking-widest text-white/30">
              <span>Kode Aset</span><span>Jenis</span><span>Merk</span><span className="text-right">Qty</span><span>Baru?</span><span>Keterangan</span>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3">
              {items.map((it, idx) => (
                <ItemPreviewRow key={idx} item={it} idx={idx} onChange={handleItemChange} />
              ))}
            </div>
            <p className="text-[10px] text-white/25 mt-2">
              {items.length} item · Jenis & Merk bisa diedit sebelum disimpan · Semua item otomatis is_aktiva = true
            </p>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button onClick={reset} className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.04] text-white/70 text-[12px] hover:bg-white/[0.08] transition-all">
              Batal
            </button>
            <button onClick={handleSubmit}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-orange-600 text-white text-[12px] font-semibold hover:from-rose-400 hover:to-orange-500 transition-all shadow-lg shadow-rose-500/20">
              Import ke SmartWMS
            </button>
          </div>
        </div>
      )}

      {/* ── Submitting ── */}
      {phase === "submitting" && (
        <div className="border-2 border-dashed border-white/[0.08] rounded-2xl py-10 flex flex-col items-center gap-3">
          <svg className="animate-spin text-rose-400" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-6.22-8.56"/>
          </svg>
          <p className="text-[12px] text-white/50">Menyimpan SJ ke SmartWMS...</p>
        </div>
      )}

      {/* ── Success ── */}
      {phase === "success" && successInfo && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
            <span className="text-[13px] font-semibold">SJ berhasil diimport!</span>
          </div>
          <p className="text-[11px] text-white/60">
            No SJ SmartWMS: <span className="font-mono text-cyan-300">{successInfo.no_sj}</span>
          </p>
          {successInfo.tujuan_created && (
            <p className="text-[11px] text-amber-300/80">
              ⚠ Tujuan baru otomatis dibuat dari data PDF — cek di Master Tujuan
            </p>
          )}
          <p className="text-[11px] text-white/40">
            Kode aset sudah terisi di Rekap Alokasi. Buka halaman SJ untuk lihat detail.
          </p>
          <div className="flex gap-2 mt-3">
            <a href="/sj/list" className="text-[11px] text-cyan-400 hover:text-cyan-300">Lihat daftar SJ →</a>
            <span className="text-white/20">·</span>
            <button onClick={reset} className="text-[11px] text-white/40 hover:text-white">Import SJ lain</button>
          </div>
        </div>
      )}
    </div>
  );
}
