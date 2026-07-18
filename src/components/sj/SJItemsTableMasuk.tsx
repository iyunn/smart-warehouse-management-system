"use client";

/**
 * SJItemsTableMasuk.tsx
 * Varian SJItemsTable untuk Penerimaan Barang (SJ jenis masuk).
 * Perbedaan utama: ADA kolom "Kode Aset" untuk input manual.
 * Kalau kode aset kosong → nanti masuk staging sebagai "AT Lebih".
 */

import { memo, useCallback, useState, useRef, useEffect } from "react";
import SearchableDropdown from "@/components/sj/SearchableDropdown";
import { SATUAN_OPTIONS, createEmptyItem, type SJItem, type SatuanType } from "@/lib/sjTypes";

interface Props {
  items: SJItem[];
  jenisOptions: string[];
  merkOptions: string[];
  onChange: (items: SJItem[]) => void;
}

const SatuanSelect = memo(({ value, onChange }: { value: SatuanType; onChange: (v: SatuanType) => void }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-1 px-2 py-1.5 rounded-lg border bg-white/[0.04] text-[12px] text-white/80 transition-all ${open ? "border-emerald-500/50 bg-white/[0.06]" : "border-white/[0.08] hover:border-white/[0.15]"}`}>
        <span className="truncate">{value}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform shrink-0 ${open ? "rotate-180" : ""}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-[60] mt-1 w-full bg-[#0d1117] border border-white/[0.1] rounded-lg shadow-2xl shadow-black/50 overflow-hidden">
          {SATUAN_OPTIONS.map(opt => (
            <button key={opt} type="button" onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full text-left px-3 py-1.5 text-[12px] transition-all ${opt === value ? "bg-emerald-500/10 text-emerald-300" : "text-white/70 hover:bg-white/[0.04]"}`}>
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
SatuanSelect.displayName = "SatuanSelect";

function SJItemsTableMasuk({ items, jenisOptions, merkOptions, onChange }: Props) {
  const updateItem = useCallback((idx: number, patch: Partial<SJItem>) => {
    onChange(items.map((item, i) => i === idx ? { ...item, ...patch } : item));
  }, [items, onChange]);

  const duplicateRow = useCallback((idx: number) => {
    const copy = { ...items[idx], serial_number: "", kode_asset: "" };
    const next = [...items];
    next.splice(idx + 1, 0, copy);
    next.forEach((item, i) => item.urutan = i + 1);
    onChange(next);
  }, [items, onChange]);

  const removeRow = useCallback((idx: number) => {
    if (items.length === 1) { onChange([createEmptyItem(1)]); return; }
    const next = items.filter((_, i) => i !== idx);
    next.forEach((item, i) => item.urutan = i + 1);
    onChange(next);
  }, [items, onChange]);

  const addRow = useCallback(() => {
    onChange([...items, createEmptyItem(items.length + 1)]);
  }, [items, onChange]);

  const jenisOpts = jenisOptions.map(j => ({ value: j, label: j }));
  const merkOpts  = merkOptions.map(m => ({ value: m, label: m }));

  // Grid via inline style — reliable tanpa bergantung Tailwind JIT arbitrary class
  const gridStyle = {
    gridTemplateColumns: "36px minmax(130px,1fr) minmax(130px,1fr) minmax(130px,1fr) 120px 50px 76px 44px 44px minmax(130px,1fr) 60px",
  };

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-visible">
      {/* Header */}
      <div style={gridStyle} className="grid gap-2 border-b border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-white/40">
        <span className="text-center">No</span>
        <span>Kode Aset</span>
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
        {items.map((item, idx) => {
          const isAtLebih = !(item.kode_asset ?? "").trim();
          return (
            <div key={idx} style={gridStyle} className="grid gap-2 px-3 py-2 items-center hover:bg-white/[0.02] transition-colors">
              <span className="text-[11px] font-mono text-white/40 text-center">{item.urutan}</span>

              {/* Kode Aset */}
              <div className="relative">
                <input type="text" value={item.kode_asset ?? ""}
                  onChange={(e) => updateItem(idx, { kode_asset: e.target.value })}
                  placeholder="Kode aset..."
                  suppressHydrationWarning
                  className={`w-full bg-white/[0.04] border text-[12px] placeholder:text-slate-600 rounded-lg px-2 py-1.5 focus:outline-none transition-all ${
                    isAtLebih
                      ? "border-amber-500/30 text-amber-300/80 focus:border-amber-500/60"
                      : "border-white/[0.08] text-white/80 focus:border-emerald-500/50"
                  }`}
                />
                {isAtLebih && (
                  <span className="absolute -top-1.5 right-1 text-[8px] font-semibold text-amber-400/70 bg-[#080e18] px-1 rounded">
                    AT Lebih
                  </span>
                )}
              </div>

              {/* Jenis */}
              <SearchableDropdown options={jenisOpts} value={item.jenis}
                onChange={(v) => updateItem(idx, { jenis: v })} placeholder="Pilih jenis" allowCustom />

              {/* Merk */}
              <SearchableDropdown options={merkOpts} value={item.merk}
                onChange={(v) => updateItem(idx, { merk: v })} placeholder="Pilih merk" allowCustom />

              {/* Serial Number */}
              <input type="text" value={item.serial_number}
                onChange={(e) => updateItem(idx, { serial_number: e.target.value })}
                placeholder="SN..." suppressHydrationWarning
                className="bg-white/[0.04] border border-white/[0.08] text-white/80 text-[12px] placeholder:text-slate-600 rounded-lg px-2 py-1.5 focus:outline-none focus:border-emerald-500/50" />

              {/* Qty */}
              <input type="text" inputMode="numeric" value={item.qty || ""}
                onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); updateItem(idx, { qty: v ? parseInt(v) : 1 }); }}
                placeholder="1" suppressHydrationWarning
                className="bg-white/[0.04] border border-white/[0.08] text-white/80 text-[12px] rounded-lg px-2 py-1.5 text-right focus:outline-none focus:border-emerald-500/50" />

              {/* Satuan */}
              <SatuanSelect value={item.satuan} onChange={(v) => updateItem(idx, { satuan: v })} />

              {/* Baru */}
              <div className="flex justify-center">
                <input type="checkbox" checked={item.is_baru}
                  onChange={(e) => updateItem(idx, { is_baru: e.target.checked })}
                  className="w-4 h-4 rounded accent-emerald-500 cursor-pointer" />
              </div>

              {/* AT (is_aktiva) */}
              <div className="flex justify-center">
                <input type="checkbox" checked={item.is_aktiva}
                  onChange={(e) => updateItem(idx, { is_aktiva: e.target.checked })}
                  className="w-4 h-4 rounded accent-blue-500 cursor-pointer" />
              </div>

              {/* Keterangan */}
              <input type="text" value={item.keterangan}
                onChange={(e) => updateItem(idx, { keterangan: e.target.value })}
                placeholder="Catatan..." suppressHydrationWarning
                className="bg-white/[0.04] border border-white/[0.08] text-white/80 text-[12px] placeholder:text-slate-600 rounded-lg px-2 py-1.5 focus:outline-none focus:border-emerald-500/50" />

              {/* Aksi */}
              <div className="flex items-center justify-center gap-1">
                <button type="button" onClick={() => duplicateRow(idx)} title="Duplikat baris"
                  className="flex items-center justify-center w-6 h-6 rounded-md text-emerald-400/60 hover:text-emerald-300 hover:bg-emerald-500/10 transition-all">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12l7 7 7-7" />
                  </svg>
                </button>
                <button type="button" onClick={() => removeRow(idx)} title="Hapus baris"
                  className="flex items-center justify-center w-6 h-6 rounded-md text-rose-400/60 hover:text-rose-300 hover:bg-rose-500/10 transition-all">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add row */}
      <div className="border-t border-white/[0.06] px-3 py-2.5">
        <button type="button" onClick={addRow}
          className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] hover:bg-emerald-500/10 transition-all">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Tambah Baris
        </button>
      </div>
    </div>
  );
}

export default memo(SJItemsTableMasuk);
