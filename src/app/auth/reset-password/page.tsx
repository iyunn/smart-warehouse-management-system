"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState(false);

  const handleReset = useCallback(async () => {
    setError("");
    if (!password || !confirm) { setError("Semua field wajib diisi."); return; }
    if (password.length < 8)   { setError("Password minimal 8 karakter."); return; }
    if (password !== confirm)   { setError("Konfirmasi password tidak cocok."); return; }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) { setError(updateError.message); return; }
      setSuccess(true);
      setTimeout(() => router.push("/"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }, [password, confirm, supabase, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080e18] px-4">
      <div className="relative w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 mb-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-white">SmartWMS</h1>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-[#111827] p-6">
          {success ? (
            <div className="text-center py-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h2 className="text-[14px] font-semibold text-white mb-2">Password Berhasil Diubah!</h2>
              <p className="text-[11px] text-white/50">Mengalihkan ke dashboard...</p>
            </div>
          ) : (
            <>
              <h2 className="text-[15px] font-semibold text-white mb-1">Buat Password Baru</h2>
              <p className="text-[11px] text-white/40 mb-5">Masukkan password baru untuk akun Anda</p>

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] px-3 py-2.5 mb-4">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rose-400 shrink-0 mt-0.5">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <p className="text-[11px] text-rose-300">{error}</p>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-white/50 mb-1.5">Password Baru</label>
                  <input type="password" value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 8 karakter"
                    className="w-full bg-white/[0.04] border border-white/[0.08] text-white/80 text-[13px] placeholder:text-slate-600 rounded-lg px-3 py-2.5 focus:outline-none focus:border-cyan-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-white/50 mb-1.5">Konfirmasi Password</label>
                  <input type="password" value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleReset()}
                    placeholder="Ulangi password baru"
                    className="w-full bg-white/[0.04] border border-white/[0.08] text-white/80 text-[13px] placeholder:text-slate-600 rounded-lg px-3 py-2.5 focus:outline-none focus:border-cyan-500/50 transition-all"
                  />
                </div>
                <button onClick={handleReset} disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[13px] font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50">
                  {loading ? (
                    <>
                      <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 1 1-6.22-8.56"/>
                      </svg>
                      Menyimpan...
                    </>
                  ) : "Simpan Password Baru"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
