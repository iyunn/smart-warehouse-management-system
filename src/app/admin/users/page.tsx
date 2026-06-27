"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { useSession } from "@/components/SessionContext";

interface Profile {
  id: string;
  username: string;
  nik: string;
  email: string;
  role: "super_admin" | "admin";
  status: "pending" | "active" | "rejected";
  created_at: string;
}

const STATUS_BADGE: Record<string, string> = {
  pending:  "bg-amber-500/10 text-amber-300 border-amber-500/20",
  active:   "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  rejected: "bg-rose-500/10 text-rose-300 border-rose-500/20",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu", active: "Aktif", rejected: "Ditolak",
};

export default function AdminUsersPage() {
  const router = useRouter();
  const { profile: myProfile, isSuperAdmin, loading: sessionLoading } = useSession();
  const [users, setUsers]       = useState<Profile[]>([]);
  const [loading, setLoading]   = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionLoading && !isSuperAdmin) router.push("/");
  }, [sessionLoading, isSuperAdmin, router]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    const json = await res.json();
    setUsers(json.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const updateUser = useCallback(async (
    id: string,
    patch: Partial<Pick<Profile, "status" | "role">>
  ) => {
    setActionId(id);
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    await fetchUsers();
    setActionId(null);
  }, [fetchUsers]);

  const pending = users.filter(u => u.status === "pending");
  const others  = users.filter(u => u.status !== "pending");

  if (sessionLoading) return null;
  if (!isSuperAdmin) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-[#080e18] text-white">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title="Manajemen User" />
        <main className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white">Manajemen User</h1>
            <p className="mt-0.5 text-xs text-white/40">Kelola pendaftaran dan akses user SmartWMS</p>
          </div>

          {/* Pending approval */}
          {pending.length > 0 && (
            <div>
              <h2 className="text-[12px] font-semibold uppercase tracking-widest text-amber-400/70 mb-3">
                Menunggu Persetujuan ({pending.length})
              </h2>
              <div className="rounded-2xl border border-amber-500/10 bg-amber-500/[0.02] overflow-hidden">
                <div className="grid grid-cols-[1fr_120px_120px_160px] gap-3 px-5 py-3 border-b border-white/[0.04] text-[10px] font-semibold uppercase tracking-widest text-white/30">
                  <span>User</span><span>NIK</span><span>Role</span><span className="text-right">Aksi</span>
                </div>
                {pending.map(u => (
                  <div key={u.id} className="grid grid-cols-[1fr_120px_120px_160px] gap-3 items-center px-5 py-3 border-b border-white/[0.03] last:border-0">
                    <div>
                      <p className="text-[12px] font-medium text-white">{u.username}</p>
                      <p className="text-[10px] text-white/40">{u.email}</p>
                    </div>
                    <span className="text-[11px] text-white/60 font-mono">{u.nik}</span>
                    <span className="text-[11px] text-white/60">Admin</span>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => updateUser(u.id, { status: "active" })}
                        disabled={actionId === u.id}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                      >
                        {actionId === u.id ? "..." : "✓ Setujui"}
                      </button>
                      <button
                        onClick={() => updateUser(u.id, { status: "rejected" })}
                        disabled={actionId === u.id}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20 transition-all disabled:opacity-50"
                      >
                        Tolak
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Semua user */}
          <div>
            <h2 className="text-[12px] font-semibold uppercase tracking-widest text-white/30 mb-3">
              Semua User ({users.length})
            </h2>
            <div className="rounded-2xl border border-white/[0.06] bg-[#111827] overflow-hidden">
              <div className="grid grid-cols-[1fr_120px_100px_100px_180px] gap-3 px-5 py-3 border-b border-white/[0.04] text-[10px] font-semibold uppercase tracking-widest text-white/30">
                <span>User</span><span>NIK</span><span>Role</span><span>Status</span><span className="text-right">Aksi</span>
              </div>
              {loading ? (
                <div className="px-5 py-8 text-center text-[12px] text-white/30">Memuat...</div>
              ) : users.length === 0 ? (
                <div className="px-5 py-8 text-center text-[12px] text-white/30">Belum ada user</div>
              ) : users.map(u => {
                const isMe = u.id === myProfile?.id;
                return (
                  <div key={u.id} className="grid grid-cols-[1fr_120px_100px_100px_180px] gap-3 items-center px-5 py-3 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors">
                    <div>
                      <p className="text-[12px] font-medium text-white">
                        {u.username} {isMe && <span className="text-[10px] text-cyan-400 ml-1">(Anda)</span>}
                      </p>
                      <p className="text-[10px] text-white/40">{u.email}</p>
                    </div>
                    <span className="text-[11px] text-white/60 font-mono">{u.nik}</span>
                    <span className="text-[11px] text-white/60">
                      {u.role === "super_admin" ? "Super Admin" : "Admin"}
                    </span>
                    <span className={`inline-flex w-fit items-center text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md border ${STATUS_BADGE[u.status]}`}>
                      {STATUS_LABEL[u.status]}
                    </span>
                    <div className="flex items-center justify-end gap-1.5">
                      {!isMe && u.status === "active" && u.role !== "super_admin" && (
                        <button
                          onClick={() => updateUser(u.id, { role: "super_admin" })}
                          disabled={actionId === u.id}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-violet-500/10 border border-violet-500/20 text-violet-300 hover:bg-violet-500/20 transition-all disabled:opacity-50"
                        >
                          → Super Admin
                        </button>
                      )}
                      {!isMe && u.role === "super_admin" && (
                        <button
                          onClick={() => updateUser(u.id, { role: "admin" })}
                          disabled={actionId === u.id}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-white/[0.05] border border-white/10 text-white/50 hover:bg-white/[0.08] transition-all disabled:opacity-50"
                        >
                          → Admin
                        </button>
                      )}
                      {!isMe && u.status === "active" && (
                        <button
                          onClick={() => updateUser(u.id, { status: "rejected" })}
                          disabled={actionId === u.id}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20 transition-all disabled:opacity-50"
                        >
                          Nonaktifkan
                        </button>
                      )}
                      {!isMe && u.status === "rejected" && (
                        <button
                          onClick={() => updateUser(u.id, { status: "active" })}
                          disabled={actionId === u.id}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                        >
                          Aktifkan
                        </button>
                      )}
                      {isMe && <span className="text-[10px] text-white/20 italic">—</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
