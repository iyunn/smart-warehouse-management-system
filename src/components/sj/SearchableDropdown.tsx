"use client";

import { useState, useRef, useEffect, useMemo, useCallback, forwardRef, memo } from "react";
import { createPortal } from "react-dom";

interface Option {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchableDropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  allowCustom?: boolean;
}

const SearchableDropdown = forwardRef<HTMLButtonElement, SearchableDropdownProps>(
  function SearchableDropdown(
    {
      options,
      value,
      onChange,
      placeholder = "Pilih...",
      className = "",
      disabled = false,
      allowCustom = false,
    },
    externalRef
  ) {
    const [open, setOpen]                 = useState(false);
    const [search, setSearch]             = useState("");
    const [highlightIdx, setHighlightIdx] = useState(0);
    const [position, setPosition]         = useState({ top: 0, left: 0, width: 0 });
    const [mounted, setMounted]           = useState(false);

    const triggerRef  = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const listRef     = useRef<HTMLDivElement>(null);
    const inputRef    = useRef<HTMLInputElement>(null);

    // Merge external ref dengan internal ref
    useEffect(() => {
      if (!externalRef) return;
      if (typeof externalRef === "function") externalRef(triggerRef.current);
      else externalRef.current = triggerRef.current;
    });

    useEffect(() => setMounted(true), []);

    useEffect(() => {
      if (!open || !triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({ top: rect.bottom + 4, left: rect.left, width: rect.width });
      setHighlightIdx(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }, [open]);

    useEffect(() => {
      if (!open) return;
      function handleClick(e: MouseEvent) {
        const target = e.target as Node;
        if (
          triggerRef.current && !triggerRef.current.contains(target) &&
          dropdownRef.current && !dropdownRef.current.contains(target)
        ) {
          setOpen(false);
          setSearch("");
        }
      }
      function handleScrollOrResize(e: Event) {
        // Hanya close kalau scroll terjadi di luar dropdown (bukan scroll dalam list)
        if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) return;
        setOpen(false);
        setSearch("");
      }
      document.addEventListener("mousedown", handleClick);
      window.addEventListener("scroll", handleScrollOrResize, true);
      window.addEventListener("resize", handleScrollOrResize);
      return () => {
        document.removeEventListener("mousedown", handleClick);
        window.removeEventListener("scroll", handleScrollOrResize, true);
        window.removeEventListener("resize", handleScrollOrResize);
      };
    }, [open]);

    const filtered = useMemo(() => {
      if (!search.trim()) return options;
      const q = search.toLowerCase();
      return options.filter(
        o => o.label.toLowerCase().includes(q) || o.sublabel?.toLowerCase().includes(q)
      );
    }, [options, search]);

    useEffect(() => { setHighlightIdx(0); }, [filtered]);

    useEffect(() => {
      if (!listRef.current) return;
      const items = listRef.current.querySelectorAll<HTMLButtonElement>("[data-item]");
      const el = items[highlightIdx];
      if (el) el.scrollIntoView({ block: "nearest" });
    }, [highlightIdx]);

    // Setelah pilih: tutup dropdown, kembalikan fokus ke trigger
    // Browser Tab dari trigger akan otomatis pindah ke elemen berikutnya
    const handleSelect = useCallback((val: string) => {
      onChange(val);
      setOpen(false);
      setSearch("");
      // Kembalikan fokus ke trigger button supaya Tab natural bisa jalan
      setTimeout(() => triggerRef.current?.focus(), 10);
    }, [onChange]);

    const handleCustomSubmit = useCallback(() => {
      if (allowCustom && search.trim()) {
        onChange(search.trim());
        setOpen(false);
        setSearch("");
        setTimeout(() => triggerRef.current?.focus(), 10);
      }
    }, [allowCustom, search, onChange]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!open) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIdx(i => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIdx(i => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered.length > 0 && filtered[highlightIdx]) {
          handleSelect(filtered[highlightIdx].value);
        } else if (allowCustom && search.trim()) {
          handleCustomSubmit();
        }
      } else if (e.key === "Tab") {
        // Tab dari search input: pilih highlighted item (kalau ada) lalu biarkan Tab jalan
        if (filtered.length > 0 && filtered[highlightIdx]) {
          e.preventDefault();
          handleSelect(filtered[highlightIdx].value);
          // Setelah fokus balik ke trigger, simulate Tab ke elemen berikutnya
          setTimeout(() => {
            const trigger = triggerRef.current;
            if (!trigger) return;
            const focusable = Array.from(
              document.querySelectorAll<HTMLElement>(
                'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
              )
            );
            const idx = focusable.indexOf(trigger);
            if (idx !== -1 && focusable[idx + 1]) {
              focusable[idx + 1].focus();
            }
          }, 20);
        } else {
          // Tidak ada item ter-highlight, tutup dropdown dan Tab natural
          setOpen(false);
          setSearch("");
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        setSearch("");
        setTimeout(() => triggerRef.current?.focus(), 10);
      }
    }, [open, filtered, highlightIdx, handleSelect, allowCustom, search, handleCustomSubmit]);

    // Tab dari trigger button (saat dropdown tutup): biarkan browser handle natural
    const handleTriggerKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (!disabled) setOpen(o => !o);
      }
      // Tab saat dropdown tutup → browser natural Tab, tidak perlu handle
    }, [disabled]);

    const selected = options.find(o => o.value === value);
    const displayLabel = selected?.label ?? (allowCustom && value ? value : "");

    return (
      <>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => !disabled && setOpen(!open)}
          onKeyDown={handleTriggerKeyDown}
          disabled={disabled}
          className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border bg-white/[0.04] text-[12px] transition-all ${className} ${
            disabled
              ? "border-white/[0.04] text-white/20 cursor-not-allowed"
              : open
                ? "border-cyan-500/50 bg-white/[0.06]"
                : "border-white/[0.08] hover:border-white/[0.15] text-white/70"
          }`}
        >
          <span className={`truncate text-left ${displayLabel ? "text-white/80" : "text-white/30"}`}>
            {displayLabel || placeholder}
          </span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={`transition-transform shrink-0 ${open ? "rotate-180" : ""}`}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {open && mounted && createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              top:   position.top,
              left:  position.left,
              width: position.width,
              zIndex: 9999,
            }}
            className="bg-[#0d1117] border border-white/[0.1] rounded-lg shadow-2xl shadow-black/60 overflow-hidden"
          >
            <div className="border-b border-white/[0.06] p-2">
              <div className="relative">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"
                  width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Cari... (↑↓ navigasi, Enter/Tab pilih)"
                  suppressHydrationWarning
                  className="w-full bg-white/[0.04] border border-white/[0.06] text-white/80 text-[12px] placeholder:text-slate-600 rounded-md pl-7 pr-2 py-1 focus:outline-none focus:border-cyan-500/40"
                />
              </div>
            </div>

            <div ref={listRef} className="max-h-56 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="py-4 text-center text-xs text-white/30">
                  {allowCustom && search.trim() ? (
                    <button
                      onClick={handleCustomSubmit}
                      className="text-cyan-400 hover:text-cyan-300 px-3 py-1.5 hover:bg-white/[0.04] rounded-md transition-all"
                    >
                      Gunakan: <span className="font-semibold">&quot;{search.trim()}&quot;</span>
                    </button>
                  ) : (
                    "Tidak ada hasil"
                  )}
                </div>
              ) : (
                filtered.map((opt, idx) => (
                  <button
                    key={opt.value}
                    data-item
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightIdx(idx)}
                    className={`w-full flex flex-col items-start px-3 py-2 text-[12px] transition-all ${
                      idx === highlightIdx
                        ? "bg-cyan-500/15 text-cyan-200"
                        : opt.value === value
                          ? "bg-cyan-500/10 text-cyan-300"
                          : "text-white/70 hover:bg-white/[0.04]"
                    }`}
                  >
                    <span className="font-medium truncate w-full text-left">{opt.label}</span>
                    {opt.sublabel && (
                      <span className="text-[10px] text-white/40 truncate w-full text-left">{opt.sublabel}</span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body
        )}
      </>
    );
  }
);

SearchableDropdown.displayName = "SearchableDropdown";
export default SearchableDropdown;
