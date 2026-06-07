"use client";

import { memo, useState, useRef, useEffect, useMemo } from "react";
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

function SearchableDropdown({
  options,
  value,
  onChange,
  placeholder = "Pilih...",
  className = "",
  disabled = false,
  allowCustom = false,
}: SearchableDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const [mounted, setMounted] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  // Calculate position when open
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }, [open]);

  // Click outside
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
    // Scroll/resize → close
    function handleScrollOrResize() {
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

  // Filter options
  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(
      o => o.label.toLowerCase().includes(q) || o.sublabel?.toLowerCase().includes(q)
    );
  }, [options, search]);

  const selected = options.find(o => o.value === value);
  const displayLabel = selected?.label ?? (allowCustom && value ? value : "");

  function handleSelect(val: string) {
    onChange(val);
    setOpen(false);
    setSearch("");
  }

  function handleCustomSubmit() {
    if (allowCustom && search.trim()) {
      onChange(search.trim());
      setOpen(false);
      setSearch("");
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setOpen(!open)}
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
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform shrink-0 ${open ? "rotate-180" : ""}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown via Portal — bebas dari overflow:hidden parent */}
      {open && mounted && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: "fixed",
            top: position.top,
            left: position.left,
            width: position.width,
            zIndex: 9999,
          }}
          className="bg-[#0d1117] border border-white/[0.1] rounded-lg shadow-2xl shadow-black/60 overflow-hidden"
        >
          {/* Search input */}
          <div className="border-b border-white/[0.06] p-2">
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && allowCustom) handleCustomSubmit();
                  if (e.key === "Escape") setOpen(false);
                }}
                placeholder="Cari..."
                autoFocus
                suppressHydrationWarning
                className="w-full bg-white/[0.04] border border-white/[0.06] text-white/80 text-[12px] placeholder:text-slate-600 rounded-md pl-7 pr-2 py-1 focus:outline-none focus:border-cyan-500/40"
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="py-4 text-center text-xs text-white/30">
                {allowCustom && search.trim() ? (
                  <button
                    onClick={handleCustomSubmit}
                    className="text-cyan-400 hover:text-cyan-300 px-3 py-1.5 hover:bg-white/[0.04] rounded-md transition-all"
                  >
                    Gunakan: <span className="font-semibold">"{search.trim()}"</span>
                  </button>
                ) : (
                  "Tidak ada hasil"
                )}
              </div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full flex flex-col items-start px-3 py-2 text-[12px] hover:bg-white/[0.04] transition-all ${
                    opt.value === value ? "bg-cyan-500/10 text-cyan-300" : "text-white/70"
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

export default memo(SearchableDropdown);
