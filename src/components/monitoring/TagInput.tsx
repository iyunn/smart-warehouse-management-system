"use client";

import { memo, useState, useRef, useCallback, KeyboardEvent } from "react";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

/**
 * Input multi-tag: ketik → tekan Enter/koma → jadi tag yang bisa dihapus.
 * Untuk search multi-keyword di Monitoring.
 */
function TagInputBase({ tags, onChange, placeholder = "Ketik lalu Enter...", maxTags = 10 }: TagInputProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = useCallback((val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) { setInput(""); return; } // no duplicate
    if (tags.length >= maxTags) return;
    onChange([...tags, trimmed]);
    setInput("");
  }, [tags, onChange, maxTags]);

  const removeTag = useCallback((idx: number) => {
    onChange(tags.filter((_, i) => i !== idx));
  }, [tags, onChange]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && input === "" && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  }, [input, tags, addTag, removeTag]);

  return (
    <div
      className="flex flex-wrap items-center gap-1.5 min-h-[34px] w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1.5 cursor-text focus-within:border-cyan-500/50 transition-all"
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag, idx) => (
        <span key={tag} className="inline-flex items-center gap-1 bg-cyan-500/15 border border-cyan-500/25 text-cyan-300 text-[11px] font-medium rounded-md px-2 py-0.5">
          {tag}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); removeTag(idx); }}
            className="text-cyan-400/60 hover:text-cyan-200 transition-colors ml-0.5"
          >
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M1 1l8 8M9 1L1 9" />
            </svg>
          </button>
        </span>
      ))}
      {tags.length < maxTags && (
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => { if (input.trim()) addTag(input); }}
          placeholder={tags.length === 0 ? placeholder : ""}
          suppressHydrationWarning
          className="flex-1 min-w-[120px] bg-transparent text-[12px] text-slate-300 placeholder:text-slate-600 outline-none"
        />
      )}
    </div>
  );
}

export default memo(TagInputBase);
