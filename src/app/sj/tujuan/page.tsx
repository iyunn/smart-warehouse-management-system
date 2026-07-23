"use client";

import { useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { useMasterTujuan } from "@/hooks/useSJMaster";
import type { SJTujuan } from "@/lib/sjTypes";

export default function MasterTujuanPage() {
  const { tujuan, loading, refresh } = useMasterTujuan();

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SJTujuan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SJTujuan | null>(null);

  // Form state
  const [kode, setKode] = useState("");
  const [nama, setNama] = useState("");
  const [kota, setKota] = useState("");
  const [kecamatan, setKecamatan] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const filtered = tujuan.filter(t => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return t.kode.toLowerCase().includes(q)
      || t.nama.toLowerCase().includes(q)
      || (t.kota ?? "").toLowerCase().includes(q)
      || (t.kecamatan ?? "").toLowerCase().includes(q);
  });

  const openCreate = () => {
    setEditTarget(null);
    setKode(""); setNama(""); setKota(""); setKecamatan(""); setError("");
    setModalOpen(true);
  };

  const openEdit = (t: SJTujuan) => {
    setEditTarget(t);
    setKode(t.kode); setNama(t.nama);
    setKota(t.kota ?? ""); setKecamatan(t.kecamatan ?? "");
    setError("");
    setModalOpen(true);
  };

  const handleSave = useCallback(async () => {
    setError("");
    if (!kode.trim() || !nama.trim()) {
      setError("Kode dan nama wajib diisi");
      return;
    }
    setSaving(true);
    try {
      const method = editTarget ? "PATCH" : "POST";
      const body   = editTarget
        ? { id: editTarget.id, kode, nama, kota, kecamatan }
        : { kode, nama, kota, kecamatan };

      const res = await fetch("/api/sj/tujuan", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Gagal menyimpan");
      }

      setModalOpen(false);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }, [kode, nama, kota, kecamatan, editTarget, refresh]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/sj/tujuan?id=${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal hapus");
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }, [deleteTarget, refresh]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#080e18] text-white">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title="Master Tujuan" />

        <main className="flex-1 overflow-y-auto px-6 py-5">

          {/* Header */}
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-white">Master Tujuan</h1>
              <p className="mt-0.5 text-xs text-white/40">
                Kelola daftar tujuan / cost center penerima Surat Jalan
              </p>
            </div>
            <button onClick={openCreate}
              className="flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold text-cyan-300 shadow-sm transition-all hover:bg-cyan-500/20 hover:text-cyan-200">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 1v10M1 6h10" /></svg>
              Tambah Tujuan
            </button>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] shadow-xl shadow-black/30">

            {/* Toolbar */}
            <div className="border-b border-white/[0.06] px-5 py-3 flex items-center justify-between gap-3">
              <span className="text-slate-600 text-[11px]">
                <span className="text-slate-400 font-mono">{filtered.length}</span> dari{" "}
                <span className="text-slate-600 font-mono">{tujuan.length}</span> tujuan
              </span>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"
                  width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari kode, nama, kota, kecamatan..."
                  suppressHydrationWarning
                  className="bg-white/[0.04] border border-white/[0.08] text-slate-300 text-[12px] placeholder:text-slate-600 rounded-xl pl-8 pr-3 py-1.5 w-56 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>

            {/* Header */}
            <div className="grid grid-cols-[110px_1fr_130px_130px_100px] gap-3 border-b border-white/[0.06] px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-white/25">
              <span>Kode</span>
              <span>Nama</span>
              <span>Kota</span>
              <span>Kecamatan</span>
              <span className="text-right">Aksi</span>
            </div>

            {loading ? (
              <div className="divide-y divide-white/5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-5 py-3"><div className="h-4 bg-white/5 rounded w-1/3 animate-pulse" /></div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm text-white/40">Belum ada tujuan</p>
                <p className="text-xs text-white/25 mt-1">Klik "Tambah Tujuan" untuk menambahkan</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {filtered.map(t => (
                  <div key={t.id} className="grid grid-cols-[110px_1fr_130px_130px_100px] gap-3 items-center px-5 py-3 hover:bg-white/[0.02]">
                    <span className="text-[12px] font-mono font-semibold text-cyan-400">{t.kode}</span>
                    <span className="text-[12px] text-white/70 truncate">{t.nama}</span>
                    <span className="text-[11px] text-white/50 truncate">{t.kota || "—"}</span>
                    <span className="text-[11px] text-white/50 truncate">{t.kecamatan || "—"}</span>
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(t)}
                        className="flex items-center justify-center w-7 h-7 rounded-lg text-blue-400/60 hover:text-blue-300 hover:bg-blue-500/10 transition-all">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                      </button>
                      <button onClick={() => setDeleteTarget(t)}
                        className="flex items-center justify-center w-7 h-7 rounded-lg text-rose-400/60 hover:text-rose-300 hover:bg-rose-500/10 transition-all">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </main>
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[#0d1117] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-white">
                {editTarget ? "Edit Tujuan" : "Tambah Tujuan"}
              </h3>
              <p className="text-[11px] text-white/40 mt-0.5">Master cost center penerima Surat Jalan</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-white/50 mb-1.5">Kode *</label>
                <input
                  type="text"
                  value={kode}
                  onChange={(e) => setKode(e.target.value)}
                  placeholder="contoh: TKBM"
                  suppressHydrationWarning
                  className="w-full bg-white/[0.04] border border-white/[0.08] text-white/80 text-[12px] uppercase placeholder:text-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-white/50 mb-1.5">Nama *</label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="contoh: Toko Kebumen"
                  suppressHydrationWarning
                  className="w-full bg-white/[0.04] border border-white/[0.08] text-white/80 text-[12px] placeholder:text-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-white/50 mb-1.5">Kota</label>
                  <input
                    type="text"
                    value={kota}
                    onChange={(e) => setKota(e.target.value)}
                    placeholder="contoh: KUDUS"
                    suppressHydrationWarning
                    className="w-full bg-white/[0.04] border border-white/[0.08] text-white/80 text-[12px] placeholder:text-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-white/50 mb-1.5">Kecamatan</label>
                  <input
                    type="text"
                    value={kecamatan}
                    onChange={(e) => setKecamatan(e.target.value)}
                    placeholder="contoh: BAE"
                    suppressHydrationWarning
                    className="w-full bg-white/[0.04] border border-white/[0.08] text-white/80 text-[12px] placeholder:text-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>
              <p className="text-[10px] text-white/30 -mt-1">
                Kota &amp; kecamatan opsional — dipakai untuk pengelompokan di halaman Pendingan Alokasi.
              </p>
              {error && <p className="text-xs text-rose-400">{error}</p>}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button onClick={() => setModalOpen(false)} disabled={saving}
                className="px-4 py-2 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/5">
                Batal
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/30 disabled:opacity-50">
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[#0d1117] border border-white/10 rounded-2xl w-full max-w-md p-6">
            <h3 className="text-sm font-semibold text-white mb-2">Hapus Tujuan?</h3>
            <p className="text-xs text-white/50 mb-5">
              Tujuan <span className="text-cyan-400 font-semibold">{deleteTarget.kode}</span> — {deleteTarget.nama} akan dihapus.
              Pastikan tidak ada Surat Jalan yang masih merujuk ke tujuan ini.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)} disabled={saving}
                className="px-4 py-2 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/5">
                Batal
              </button>
              <button onClick={handleDelete} disabled={saving}
                className="px-4 py-2 rounded-lg bg-rose-500/20 border border-rose-500/30 text-xs font-semibold text-rose-300 hover:bg-rose-500/30 disabled:opacity-50">
                {saving ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
