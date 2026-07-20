"use client";

/**
 * SessionContext — expose user + profile (username, role) ke semua komponen.
 * Wrap di layout.tsx agar tersedia di seluruh app.
 */

import {
  createContext, useContext, useEffect, useState, useCallback,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase-client/client";
import type { User } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  username: string;
  nik: string;
  email: string;
  role: "super_admin" | "admin";
  status: "pending" | "active" | "rejected";
  theme?: "dark" | "light";
}

interface SessionContextValue {
  user:    User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isSuperAdmin: boolean;
  isAdmin: boolean;
}

const SessionContext = createContext<SessionContextValue>({
  user: null, profile: null, loading: true,
  signOut: async () => {},
  isSuperAdmin: false, isAdmin: false,
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const [user, setUser]       = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("id, username, nik, email, role, status, theme")
      .eq("id", userId)
      .maybeSingle();
    setProfile(data as UserProfile | null);
  }, [supabase]);

  useEffect(() => {
    // Cek session awal
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) fetchProfile(user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    // Listen perubahan auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const u = session?.user ?? null;
        setUser(u);
        if (u) await fetchProfile(u.id);
        else setProfile(null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    window.location.href = "/login";
  }, [supabase]);

  const isSuperAdmin = profile?.role === "super_admin" && profile?.status === "active";
  const isAdmin      = (profile?.role === "admin" || isSuperAdmin) && profile?.status === "active";

  return (
    <SessionContext.Provider value={{ user, profile, loading, signOut, isSuperAdmin, isAdmin }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
