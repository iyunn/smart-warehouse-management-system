"use client";

import { memo, useCallback, useRef } from "react";
import SearchableDropdown from "@/components/sj/SearchableDropdown";

export interface PendinganDraftItem {
  urutan: number;
  jenis: string;
  qty: number;
  keterangan: string;
}

export function createEmptyPendinganItem(urutan: number): PendinganDraftItem {
  return { urutan, jenis: "", qty: 1, keterangan: "" };
}

interface Props {
  items: PendinganDraftItem[];
  jenisOptions: string[];
  onChange: (items: PendinganDraftItem[]) => void;
}

function PendinganItemsTable({ items, jenisOptions, onChange }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

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

  const handleFocusCapture = useCallback((e: React.FocusEvent) => {
    const target = e.target as HTMLElement;
    if (!target || typeof target.scrollIntoView !== "function") return;
    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }, []);

  const updateItem = useCallback((idx: number, patch: Partial<PendinganDraftItem>) => {
    const next = items.map((item, i) => i === idx ? { ...item, ...patch } : item);
    onChange(next);
  }, [items, onChange]);

  const addRow = useCallback(() => {
    onChange([...items, createEmptyPendinganItem(items.length + 1)]);
    scrollToBottom();
  }, [items, onChange, scrollToBottom]);

  const duplicateRow = useCallback((idx: number) => {
    const copy = { ...items[idx] };
    const next = [...items];
    next.splice(idx + 1, 0, copy);
    next.forEach((item, i) => item.urutan = i + 1);
    onChange(next);
    scrollToBottom();
  }, [items, onChange, scrollToBottom]);

  const removeRow = useCallback((idx: number) => {
    if (items.length === 1) {
      onChange([createEmptyPendinganItem(1)]);
      return;
    }
    const next = items.filter((_, i) => i !== idx);
    next.forEach((item, i) => item.urutan = i + 1);
    onChange(next);
  }, [items, onChange]);

  const jenisDropdownOptions = jenisOptions.map(j => ({ value: j, label: j }));

  const gridCols = "grid-cols-[36px_minmax(180px,1.6fr)_70px_minmax(150px,1fr)_74px]";

  return (
    <div className="rounded-2xl border border-[color:var(--pend-border)] bg-[color:var(--pend-row)] overflow-visible" onFocusCapture={handleFocusCapture}>
      {/* Header */}
      <div className={`grid ${gridCols} gap-2 border-b border-[color:var(--pend-border)] px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-[color:var(--pend-text-dim)]`}>
        <span>No</span>
        <span>Jenis Barang</span>
        <span className="text-center">Jumlah</span>
        <span>Keterangan</span>
        <span className="text-center">Aksi</span>
      </div>

      {/* Rows */}
      <div className="max-h-[320px] overflow-y-auto">
        {items.map((item, idx) => (
          <div key={idx} className={`grid ${gridCols} gap-2 px-3 py-2 items-center border-b border-[color:var(--pend-border)] last:border-b-0`}>
            <span className="text-[12px] text-[color:var(--pend-text-dim)] text-center">{item.urutan}</span>

            <SearchableDropdown
              options={jenisDropdownOptions}
              value={item.jenis}
              onChange={(v) => updateItem(idx, { jenis: v })}
              placeholder="Jenis..."
              allowCustom
            />

            <input
              type="number" min="1" value={item.qty}
              onChange={(e) => updateItem(idx, { qty: Math.max(1, Number(e.target.value) || 1) })}
              className="w-full px-2 py-1.5 rounded-lg border border-[color:var(--pend-border)] bg-[color:var(--pend-input)] text-[12px] text-[color:var(--pend-text)] text-center focus:outline-none focus:border-cyan-500/50"
            />

            <input
              type="text" value={item.keterangan}
              onChange={(e) => updateItem(idx, { keterangan: e.target.value })}
              placeholder="Keterangan..."
              className="w-full px-2 py-1.5 rounded-lg border border-[color:var(--pend-border)] bg-[color:var(--pend-input)] text-[12px] text-[color:var(--pend-text)] placeholder:text-[color:var(--pend-text-dim)] focus:outline-none focus:border-cyan-500/50"
            />

            {/* Aksi: duplikat + hapus */}
            <div className="flex items-center justify-center gap-1">
              <button
                type="button" onClick={() => duplicateRow(idx)} title="Duplikat baris ke bawah"
                className="w-6 h-6 rounded-md border border-[color:var(--pend-border)] text-[color:var(--pend-text-dim)] hover:text-cyan-400 hover:border-cyan-500/40 transition-all flex items-center justify-center"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
                </svg>
              </button>
              <button
                type="button" onClick={() => removeRow(idx)} title="Hapus baris"
                className="w-6 h-6 rounded-md border border-[color:var(--pend-border)] text-[color:var(--pend-text-dim)] hover:text-rose-400 hover:border-rose-500/40 transition-all flex items-center justify-center"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Add row footer */}
      <button
        type="button" onClick={addRow}
        className="w-full py-2.5 border-t border-[color:var(--pend-border)] text-[12px] font-medium text-cyan-400 hover:bg-cyan-500/10 transition-all flex items-center justify-center gap-2"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Tambah Baris
      </button>
    </div>
  );
}

export default memo(PendinganItemsTable);
