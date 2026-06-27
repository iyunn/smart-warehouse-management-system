"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-client/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleLogin = useCallback(async () => {
    setError("");
    if (!email || !password) {
      setError("Email dan password wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message === "Invalid login credentials"
          ? "Email atau password salah."
          : signInError.message);
        return;
      }

      // Cek status akun di profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("status, role")
        .eq("id", data.user.id)
        .maybeSingle();

      if (!profile) {
        setError("Profil tidak ditemukan. Hubungi administrator.");
        await supabase.auth.signOut();
        return;
      }

      if (profile.status === "pending") {
        setError("Akun Anda masih menunggu persetujuan Super Admin.");
        await supabase.auth.signOut();
        return;
      }

      if (profile.status === "rejected") {
        setError("Akun Anda ditolak. Hubungi administrator.");
        await supabase.auth.signOut();
        return;
      }

      // Active → masuk
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }, [email, password, supabase, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080e18] px-4">
      {/* Background accent */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/[0.03] rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/[0.03] rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-white tracking-tight">SmartWMS</h1>
          <p className="text-[12px] text-white/40 mt-1">Smart Asset Monitoring & Reconciliation</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#111827] p-6">
          <h2 className="text-[15px] font-semibold text-white mb-1">Masuk ke akun Anda</h2>
          <p className="text-[12px] text-white/40 mb-5">Gunakan email dan password yang terdaftar</p>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] px-3 py-2.5 mb-4">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rose-400 shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-[11px] text-rose-300 leading-relaxed">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-white/50 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                placeholder="nama@perusahaan.com"
                className="w-full bg-white/[0.04] border border-white/[0.08] text-white/80 text-[13px] placeholder:text-slate-600 rounded-lg px-3 py-2.5 focus:outline-none focus:border-cyan-500/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-white/50 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                placeholder="••••••••"
                className="w-full bg-white/[0.04] border border-white/[0.08] text-white/80 text-[13px] placeholder:text-slate-600 rounded-lg px-3 py-2.5 focus:outline-none focus:border-cyan-500/50 transition-all"
              />
            </div>

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors">
                Lupa password?
              </Link>
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[13px] font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.22-8.56"/>
                  </svg>
                  Memproses...
                </>
              ) : "Masuk"}
            </button>
          </div>

          <div className="mt-5 pt-5 border-t border-white/[0.06] text-center">
            <p className="text-[12px] text-white/40">
              Belum punya akun?{" "}
              <Link href="/register" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                Daftar di sini
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-[10px] text-white/20 mt-6">
          PT. Indomarco Prismatama — General Affairs
        </p>
      </div>
    </div>
  );
}
