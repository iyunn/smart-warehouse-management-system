"use client";

import { memo, useCallback, useState, useRef, useEffect } from "react";
import SearchableDropdown from "@/components/sj/SearchableDropdown";
import { SATUAN_OPTIONS, createEmptyItem, type SJItem, type SatuanType } from "@/lib/sjTypes";

interface SJItemsTableProps {
  items: SJItem[];
  jenisOptions: string[];
  merkOptions: string[];
  onChange: (items: SJItem[]) => void;
}

// ─── Satuan custom dropdown (styled sesuai tema) ──────────────────────────
interface SatuanSelectProps {
  value: SatuanType;
  onChange: (v: SatuanType) => void;
}

const SatuanSelect = memo(({ value, onChange }: SatuanSelectProps) => {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Saat dibuka, set highlight ke opsi yang sedang terpilih
  useEffect(() => {
    if (open) {
      const idx = SATUAN_OPTIONS.indexOf(value);
      setHighlight(idx >= 0 ? idx : 0);
    }
  }, [open, value]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!open) {
      // Buka dropdown dengan Enter / Space / ArrowDown saat fokus
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight(h => (h + 1) % SATUAN_OPTIONS.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight(h => (h - 1 + SATUAN_OPTIONS.length) % SATUAN_OPTIONS.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      onChange(SATUAN_OPTIONS[highlight]);
      setOpen(false);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  }, [open, highlight, onChange]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onKeyDown={handleKeyDown}
        className={`w-full flex items-center justify-between gap-1 px-2 py-1.5 rounded-lg border bg-white/[0.04] text-[12px] text-white/80 transition-all ${
          open ? "border-cyan-500/50 bg-white/[0.06]" : "border-white/[0.08] hover:border-white/[0.15]"
        }`}
      >
        <span className="truncate">{value}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform shrink-0 ${open ? "rotate-180" : ""}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-[60] mt-1 w-full bg-[#0d1117] border border-white/[0.1] rounded-lg shadow-2xl shadow-black/50 overflow-hidden">
          {SATUAN_OPTIONS.map((opt, i) => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false); }}
              onMouseEnter={() => setHighlight(i)}
              className={`w-full text-left px-3 py-1.5 text-[12px] transition-all ${
                i === highlight
                  ? "bg-cyan-500/10 text-cyan-300"
                  : opt === value
                  ? "text-cyan-300/70"
                  : "text-white/70 hover:bg-white/[0.04]"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
SatuanSelect.displayName = "SatuanSelect";

// ─── Main table ───────────────────────────────────────────────────────────
function SJItemsTable({ items, jenisOptions, merkOptions, onChange }: SJItemsTableProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll ke baris paling bawah (dipakai saat tambah/duplikat baris).
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = bottomRef.current;
        if (!el) return;
        let parent = el.parentElement;
        while (parent) {
          const oy = getComputedStyle(parent).overflowY;
          if ((oy === "auto" || oy === "scroll") && parent.scrollHeight > parent.clientHeight) {
            parent.scrollTo({ top: parent.scrollHeight, behavior: "smooth" });
            return;
          }
          parent = parent.parentElement;
        }
        el.scrollIntoView({ behavior: "smooth", block: "end" });
      });
    });
  }, []);

  // Auto-scroll saat field dapat fokus (via Tab/Shift+Tab/klik) agar field yang
  // aktif selalu kelihatan — tidak tersembunyi di bawah/atas viewport.
  const handleFocusCapture = useCallback((e: React.FocusEvent) => {
    const target = e.target as HTMLElement;
    if (!target || typeof target.scrollIntoView !== "function") return;
    // block: "nearest" → hanya scroll kalau elemen di luar viewport, arah otomatis
    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }, []);

  const updateItem = useCallback((idx: number, patch: Partial<SJItem>) => {
    const next = items.map((item, i) => i === idx ? { ...item, ...patch } : item);
    onChange(next);
  }, [items, onChange]);

  const duplicateRow = useCallback((idx: number) => {
    const copy = { ...items[idx], serial_number: "" };
    const next = [...items];
    next.splice(idx + 1, 0, copy);
    next.forEach((item, i) => item.urutan = i + 1);
    onChange(next);
    scrollToBottom();
  }, [items, onChange, scrollToBottom]);

  const removeRow = useCallback((idx: number) => {
    if (items.length === 1) {
      onChange([createEmptyItem(1)]);
      return;
    }
    const next = items.filter((_, i) => i !== idx);
    next.forEach((item, i) => item.urutan = i + 1);
    onChange(next);
  }, [items, onChange]);

  const addRow = useCallback(() => {
    onChange([...items, createEmptyItem(items.length + 1)]);
    scrollToBottom();
  }, [items, onChange, scrollToBottom]);

  const jenisOpts = jenisOptions.map(j => ({ value: j, label: j }));
  const merkOpts  = merkOptions.map(m => ({ value: m, label: m }));

  // Grid: No(40) | Jenis(1.2fr) | Merk(1.2fr) | SN(140) | Qty(60) | Satuan(85) | Baru(50) | AT(50) | Ket(1fr) | Aksi(70)
  const gridCols = "grid-cols-[40px_minmax(160px,1.2fr)_minmax(160px,1.2fr)_140px_60px_85px_50px_50px_minmax(150px,1fr)_70px]";

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-visible" onFocusCapture={handleFocusCapture}>

      {/* Header */}
      <div className={`grid ${gridCols} gap-2 border-b border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-white/40`}>
        <span className="text-center">No</span>
        <span>Jenis *</span>
        <span>Merk</span>
        <span>Serial Number</span>
        <span className="text-right">Qty</span>
        <span>Satuan</span>
        <span className="text-center">Baru</span>
        <span className="text-center">AT</span>
        <span>Keterangan</span>
        <span className="text-center">Aksi</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-white/[0.04]">
        {items.map((item, idx) => (
          <div key={idx} className={`grid ${gridCols} gap-2 px-3 py-2 items-center hover:bg-white/[0.02] transition-colors`}>

            {/* No */}
            <span className="text-[11px] font-mono text-white/40 text-center">{item.urutan}</span>

            {/* Jenis */}
            <SearchableDropdown
              options={jenisOpts}
              value={item.jenis}
              onChange={(v) => updateItem(idx, { jenis: v })}
              placeholder="Pilih jenis"
              allowCustom
            />

            {/* Merk */}
            <SearchableDropdown
              options={merkOpts}
              value={item.merk}
              onChange={(v) => updateItem(idx, { merk: v })}
              placeholder="Pilih merk"
              allowCustom
            />

            {/* Serial Number */}
            <input
              type="text"
              value={item.serial_number}
              onChange={(e) => updateItem(idx, { serial_number: e.target.value })}
              placeholder="SN..."
              suppressHydrationWarning
              className="bg-white/[0.04] border border-white/[0.08] text-white/80 text-[12px] placeholder:text-slate-600 rounded-lg px-2 py-1.5 focus:outline-none focus:border-cyan-500/50"
            />

            {/* Qty — text input, no spinner */}
            <input
              type="text"
              inputMode="numeric"
              value={item.qty || ""}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "");
                updateItem(idx, { qty: v ? parseInt(v) : 1 });
              }}
              placeholder="1"
              suppressHydrationWarning
              className="bg-white/[0.04] border border-white/[0.08] text-white/80 text-[12px] rounded-lg px-2 py-1.5 text-right focus:outline-none focus:border-cyan-500/50"
            />

            {/* Satuan — custom styled dropdown */}
            <SatuanSelect
              value={item.satuan}
              onChange={(v) => updateItem(idx, { satuan: v })}
            />

            {/* Baru */}
            <div className="flex justify-center">
              <input
                type="checkbox"
                checked={item.is_baru}
                onChange={(e) => updateItem(idx, { is_baru: e.target.checked })}
                className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* AT */}
            <div className="flex justify-center">
              <input
                type="checkbox"
                checked={item.is_aktiva}
                onChange={(e) => updateItem(idx, { is_aktiva: e.target.checked })}
                className="w-4 h-4 rounded accent-blue-500 cursor-pointer"
              />
            </div>

            {/* Keterangan */}
            <input
              type="text"
              value={item.keterangan}
              onChange={(e) => updateItem(idx, { keterangan: e.target.value })}
              placeholder="Catatan..."
              suppressHydrationWarning
              className="bg-white/[0.04] border border-white/[0.08] text-white/80 text-[12px] placeholder:text-slate-600 rounded-lg px-2 py-1.5 focus:outline-none focus:border-cyan-500/50"
            />

            {/* Aksi */}
            <div className="flex items-center justify-center gap-1">
              <button
                type="button"
                onClick={() => duplicateRow(idx)}
                title="Duplikat baris ke bawah"
                className="flex items-center justify-center w-6 h-6 rounded-md text-cyan-400/60 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12l7 7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => removeRow(idx)}
                title="Hapus baris"
                className="flex items-center justify-center w-6 h-6 rounded-md text-rose-400/60 hover:text-rose-300 hover:bg-rose-500/10 transition-all"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                </svg>
              </button>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Add row footer */}
      <div className="border-t border-white/[0.06] px-3 py-2.5">
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1.5 text-[11px] font-medium text-cyan-400 hover:text-cyan-300 px-3 py-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/[0.04] hover:bg-cyan-500/10 transition-all"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Tambah Baris
        </button>
      </div>
    </div>
  );
}

export default memo(SJItemsTable);
