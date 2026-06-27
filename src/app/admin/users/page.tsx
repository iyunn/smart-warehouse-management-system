"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/compogit nents/Sidebar";
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

// ── Modal Tambah User ─────────────────────────────────────────────────────
function AddUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ username: "", nik: "", email: "", password: "", role: "admin" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async () => {
    setError("");
    if (!form.username || !form.nik || !form.email || !form.password) {
      setError("Semua field wajib diisi."); return;
    }
    if (form.password.length < 8) { setError("Password minimal 8 karakter."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Gagal membuat user."); return; }
      onSuccess();
      onClose();
    } catch { setError("Terjadi kesalahan."); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#111827] p-6">
        <h3 className="text-[14px] font-semibold text-white mb-1">Tambah User Baru</h3>
        <p className="text-[11px] text-white/40 mb-4">User langsung aktif tanpa perlu konfirmasi email</p>

        {error && (
          <div className="text-[11px] text-rose-300 bg-rose-500/[0.06] border border-rose-500/20 rounded-xl px-3 py-2.5 mb-4">{error}</div>
        )}

        <div className="space-y-3">
          {([
            { key: "username", label: "Username",  type: "text",     placeholder: "nama_pengguna" },
            { key: "nik",      label: "NIK",       type: "text",     placeholder: "1234567890123456" },
            { key: "email",    label: "Email",     type: "email",    placeholder: "nama@perusahaan.com" },
            { key: "password", label: "Password",  type: "password", placeholder: "Min. 8 karakter" },
          ] as const).map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="block text-[11px] font-medium text-white/50 mb-1">{label}</label>
              <input type={type} value={form[key]} onChange={set(key)} placeholder={placeholder}
                className="w-full bg-white/[0.04] border border-white/[0.08] text-white/80 text-[12px] placeholder:text-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500/50 transition-all" />
            </div>
          ))}
          <div>
            <label className="block text-[11px] font-medium text-white/50 mb-1">Role</label>
            <select value={form.role} onChange={set("role")}
              className="w-full bg-white/[0.04] border border-white/[0.08] text-white/80 text-[12px] rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500/50 transition-all">
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.04] text-white/60 text-[12px] hover:bg-white/[0.08] transition-all">
            Batal
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[12px] font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50">
            {loading ? "Menyimpan..." : "Buat User"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Konfirmasi Hapus ────────────────────────────────────────────────
function DeleteModal({ user, onClose, onSuccess }: { user: Profile; onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Gagal hapus."); return; }
      onSuccess();
      onClose();
    } catch { setError("Terjadi kesalahan."); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-xs rounded-2xl border border-white/[0.08] bg-[#111827] p-6">
        <h3 className="text-[14px] font-semibold text-white mb-2">Hapus User?</h3>
        <p className="text-[12px] text-white/50 mb-1">
          <span className="text-white font-medium">{user.username}</span> ({user.email})
        </p>
        <p className="text-[11px] text-rose-400/80 mb-5">⚠ User akan dihapus permanen dari sistem.</p>
        {error && <p className="text-[11px] text-rose-300 mb-3">{error}</p>}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.04] text-white/60 text-[12px] hover:bg-white/[0.08] transition-all">
            Batal
          </button>
          <button onClick={handleDelete} disabled={loading}
            className="flex-1 px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[12px] font-semibold hover:bg-rose-500/30 transition-all disabled:opacity-50">
            {loading ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const router = useRouter();
  const { profile: myProfile, isSuperAdmin, loading: sessionLoading } = useSession();

  const [users, setUsers]         = useState<Profile[]>([]);
  const [loading, setLoading]     = useState(true);
  const [actionId, setActionId]   = useState<string | null>(null);
  const [showAdd, setShowAdd]     = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);

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

  const updateUser = useCallback(async (id: string, patch: Partial<Pick<Profile, "status" | "role">>) => {
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

  if (sessionLoading || !isSuperAdmin) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-[#080e18] text-white">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title="Manajemen User" />
        <main className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-white">Manajemen User</h1>
              <p className="mt-0.5 text-xs text-white/40">Kelola pendaftaran dan akses user SmartWMS</p>
            </div>
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[12px] font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Tambah User
            </button>
          </div>

          {/* Pending approval */}
          {pending.length > 0 && (
            <div>
              <h2 className="text-[12px] font-semibold uppercase tracking-widest text-amber-400/70 mb-3">
                Menunggu Persetujuan ({pending.length})
              </h2>
              <div className="rounded-2xl border border-amber-500/10 bg-amber-500/[0.02] overflow-hidden">
                <div className="grid grid-cols-[1fr_120px_120px_180px] gap-3 px-5 py-3 border-b border-white/[0.04] text-[10px] font-semibold uppercase tracking-widest text-white/30">
                  <span>User</span><span>NIK</span><span>Role</span><span className="text-right">Aksi</span>
                </div>
                {pending.map(u => (
                  <div key={u.id} className="grid grid-cols-[1fr_120px_120px_180px] gap-3 items-center px-5 py-3 border-b border-white/[0.03] last:border-0">
                    <div>
                      <p className="text-[12px] font-medium text-white">{u.username}</p>
                      <p className="text-[10px] text-white/40">{u.email}</p>
                    </div>
                    <span className="text-[11px] text-white/60 font-mono">{u.nik}</span>
                    <span className="text-[11px] text-white/60">Admin</span>
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => updateUser(u.id, { status: "active" })} disabled={actionId === u.id}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 transition-all disabled:opacity-50">
                        {actionId === u.id ? "..." : "✓ Setujui"}
                      </button>
                      <button onClick={() => updateUser(u.id, { status: "rejected" })} disabled={actionId === u.id}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20 transition-all disabled:opacity-50">
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
              <div className="grid grid-cols-[1fr_120px_110px_100px_220px] gap-3 px-5 py-3 border-b border-white/[0.04] text-[10px] font-semibold uppercase tracking-widest text-white/30">
                <span>User</span><span>NIK</span><span>Role</span><span>Status</span><span className="text-right">Aksi</span>
              </div>
              {loading ? (
                <div className="px-5 py-8 text-center text-[12px] text-white/30">Memuat...</div>
              ) : users.length === 0 ? (
                <div className="px-5 py-8 text-center text-[12px] text-white/30">Belum ada user</div>
              ) : users.map(u => {
                const isMe = u.id === myProfile?.id;
                return (
                  <div key={u.id} className="grid grid-cols-[1fr_120px_110px_100px_220px] gap-3 items-center px-5 py-3 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02]">
                    <div>
                      <p className="text-[12px] font-medium text-white">
                        {u.username} {isMe && <span className="text-[10px] text-cyan-400 ml-1">(Anda)</span>}
                      </p>
                      <p className="text-[10px] text-white/40">{u.email}</p>
                    </div>
                    <span className="text-[11px] text-white/60 font-mono">{u.nik}</span>
                    <span className="text-[11px] text-white/60">{u.role === "super_admin" ? "Super Admin" : "Admin"}</span>
                    <span className={`inline-flex w-fit items-center text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md border ${STATUS_BADGE[u.status]}`}>
                      {STATUS_LABEL[u.status]}
                    </span>
                    <div className="flex items-center justify-end gap-1.5">
                      {!isMe && u.status === "active" && u.role !== "super_admin" && (
                        <button onClick={() => updateUser(u.id, { role: "super_admin" })} disabled={actionId === u.id}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-violet-500/10 border border-violet-500/20 text-violet-300 hover:bg-violet-500/20 transition-all disabled:opacity-50">
                          → Super Admin
                        </button>
                      )}
                      {!isMe && u.role === "super_admin" && (
                        <button onClick={() => updateUser(u.id, { role: "admin" })} disabled={actionId === u.id}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-white/[0.05] border border-white/10 text-white/50 hover:bg-white/[0.08] transition-all disabled:opacity-50">
                          → Admin
                        </button>
                      )}
                      {!isMe && u.status === "active" && (
                        <button onClick={() => updateUser(u.id, { status: "rejected" })} disabled={actionId === u.id}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/20 transition-all disabled:opacity-50">
                          Nonaktifkan
                        </button>
                      )}
                      {!isMe && u.status !== "active" && (
                        <button onClick={() => updateUser(u.id, { status: "active" })} disabled={actionId === u.id}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 transition-all disabled:opacity-50">
                          Aktifkan
                        </button>
                      )}
                      {!isMe && (
                        <button onClick={() => setDeleteTarget(u)} disabled={actionId === u.id}
                          className="p-1.5 rounded-lg text-rose-400/50 hover:text-rose-300 hover:bg-rose-500/10 transition-all disabled:opacity-50" title="Hapus user">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                          </svg>
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

      {showAdd && (
        <AddUserModal onClose={() => setShowAdd(false)} onSuccess={fetchUsers} />
      )}
      {deleteTarget && (
        <DeleteModal user={deleteTarget} onClose={() => setDeleteTarget(null)} onSuccess={fetchUsers} />
      )}
    </div>
  );
}
