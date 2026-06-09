"use client";

import { memo, useState, useEffect, useRef, useCallback, useMemo } from "react";

interface AutocompleteInputProps {
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  maxSuggestions?: number;
  /**
   * Dipanggil setiap value berubah dengan info apakah ada exact case-insensitive
   * match dengan suggestion existing tapi casing user beda.
   * Parent bisa pakai untuk disable submit button.
   */
  onMismatchChange?: (mismatch: { hasMismatch: boolean; existingValue: string | null }) => void;
}

/**
 * Input dengan autocomplete suggestion.
 * - Matching case-insensitive
 * - Klik suggestion → auto-replace ke casing existing (konsistensi)
 * - Kalau user ketik value yang case-insensitive match existing tapi casing beda:
 *   → tampil warning + panggil onMismatchChange dengan hasMismatch=true
 */
function AutocompleteInputBase({
  value,
  onChange,
  suggestions,
  placeholder,
  className,
  disabled,
  loading,
  maxSuggestions = 8,
  onMismatchChange,
}: AutocompleteInputProps) {
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return suggestions.slice(0, maxSuggestions);
    return suggestions
      .filter(s => s.toLowerCase().includes(q))
      .slice(0, maxSuggestions);
  }, [value, suggestions, maxSuggestions]);

  // Detect kalau input case-insensitive match dengan existing tapi casing beda
  const mismatch = useMemo(() => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const existing = suggestions.find(s => s.toLowerCase() === trimmed.toLowerCase());
    if (existing && existing !== trimmed) return existing;
    return null;
  }, [value, suggestions]);

  // Notify parent saat mismatch state berubah
  useEffect(() => {
    onMismatchChange?.({
      hasMismatch: mismatch !== null,
      existingValue: mismatch,
    });
  }, [mismatch, onMismatchChange]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => { setHighlightIdx(0); }, [value]);

  const handleSelectSuggestion = useCallback((suggestion: string) => {
    onChange(suggestion);
    setOpen(false);
    inputRef.current?.focus();
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || filtered.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[highlightIdx]) {
        handleSelectSuggestion(filtered[highlightIdx]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }, [open, filtered, highlightIdx, handleSelectSuggestion]);

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        suppressHydrationWarning
        className={className}
      />

      {/* Warning hint kalau case-insensitive match tapi casing beda */}
      {mismatch && (
        <p className="mt-1 text-[10.5px] text-amber-400/90 flex items-center gap-1">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          Sudah ada value <button type="button" onClick={() => handleSelectSuggestion(mismatch)} className="underline font-semibold hover:text-amber-300">&quot;{mismatch}&quot;</button> — klik untuk pakai casing yang sudah ada.
        </p>
      )}

      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-[#0d1117] border border-white/[0.12] rounded-lg shadow-2xl shadow-black/60 overflow-hidden max-h-60 overflow-y-auto">
          {loading && (
            <div className="px-3 py-2 text-[11px] text-white/30">Memuat suggestion...</div>
          )}
          {filtered.map((s, idx) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelectSuggestion(s)}
              onMouseEnter={() => setHighlightIdx(idx)}
              className={`w-full text-left px-3 py-1.5 text-[12px] transition-all ${
                idx === highlightIdx
                  ? "bg-cyan-500/15 text-cyan-200"
                  : "text-white/70 hover:bg-white/[0.04]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(AutocompleteInputBase);
