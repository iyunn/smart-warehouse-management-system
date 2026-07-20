"use client";

/**
 * ThemeToggle — switch dark/light ala website konvensional.
 * Menampilkan track dengan knob yang geser + ikon matahari/bulan.
 */

import { memo } from "react";
import { useTheme } from "@/components/ThemeContext";

function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  if (collapsed) {
    // Mode sidebar collapsed — hanya ikon
    return (
      <button
        onClick={toggleTheme}
        title={isDark ? "Beralih ke Light Mode" : "Beralih ke Dark Mode"}
        className="flex items-center justify-center w-9 h-9 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)] transition-all"
      >
        {isDark ? <MoonIcon /> : <SunIcon />}
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? "Beralih ke Light Mode" : "Beralih ke Dark Mode"}
      className="flex items-center gap-2 w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-all group"
    >
      {/* Track */}
      <span className="relative inline-flex items-center w-10 h-5 rounded-full bg-[var(--surface-3)] border border-[var(--border)] transition-colors shrink-0">
        <span
          className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-[var(--accent)] transition-all duration-200 ${
            isDark ? "left-0.5" : "left-[22px]"
          }`}
        />
      </span>
      <span className="text-[12px] font-medium text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors">
        {isDark ? "Dark Mode" : "Light Mode"}
      </span>
      <span className="ml-auto text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors">
        {isDark ? <MoonIcon /> : <SunIcon />}
      </span>
    </button>
  );
}

const SunIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);

const MoonIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export default memo(ThemeToggle);
