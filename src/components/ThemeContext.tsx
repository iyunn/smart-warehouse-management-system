"use client";

/**
 * ThemeContext — kelola tema dark/light untuk seluruh app.
 *
 * Sumber kebenaran: kolom `theme` di profiles (ikut akun user).
 * Cache: localStorage 'swms-theme' untuk apply instan tanpa flash (FOUC)
 * sebelum profile ke-fetch dari DB.
 *
 * Cara pakai:
 *   - Wrap app dengan <ThemeProvider> di layout (di dalam SessionProvider).
 *   - Komponen pakai useTheme() untuk baca theme + toggle.
 *   - Tema diterapkan sebagai class 'dark'/'light' di <html>.
 *
 * Styling: pakai CSS variable yang di-scope ke .dark / .light (lihat globals.css).
 */

import {
  createContext, useContext, useEffect, useState, useCallback,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase-client/client";
import { useSession } from "@/components/SessionContext";

export type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggleTheme: () => {},
  setTheme: () => {},
});

const STORAGE_KEY = "swms-theme";

function applyThemeClass(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(theme);
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const { user, profile } = useSession();
  const [theme, setThemeState] = useState<Theme>("dark");

  // 1. Apply cache localStorage secepatnya (anti-flash) saat mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (cached === "dark" || cached === "light") {
        setThemeState(cached);
        applyThemeClass(cached);
      } else {
        applyThemeClass("dark");
      }
    } catch {
      applyThemeClass("dark");
    }
  }, []);

  // 2. Kalau profile sudah ke-load, DB adalah sumber kebenaran → sync
  useEffect(() => {
    const dbTheme = (profile as { theme?: Theme } | null)?.theme;
    if (dbTheme === "dark" || dbTheme === "light") {
      setThemeState(dbTheme);
      applyThemeClass(dbTheme);
      try { localStorage.setItem(STORAGE_KEY, dbTheme); } catch { /* ignore */ }
    }
  }, [profile]);

  const persistTheme = useCallback(async (next: Theme) => {
    // Cache instan
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
    // Simpan ke DB (ikut akun) — best-effort, kalau gagal cache tetap jalan
    if (user?.id) {
      await supabase.from("profiles").update({ theme: next }).eq("id", user.id);
    }
  }, [supabase, user]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyThemeClass(next);
    void persistTheme(next);
  }, [persistTheme]);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
