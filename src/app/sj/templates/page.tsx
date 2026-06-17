"use client";

import { useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import SJItemsTable from "@/components/sj/SJItemsTable";
import { useMasterJenis, useMasterMerk, useSJTemplates } from "@/hooks/useSJMaster";
import {
  createEmptyItem,
  toTemplateItem,
  type SJItem,
  type SJItemTemplate,
} from "@/lib/sjTypes";

export default function TemplateItemPage() {
  const { jenis: jenisOptions } = useMasterJenis();
  const { merk: merkOptions }   = useMasterMerk();
  const { templates, loading, refresh } = useSJTemplates();

  // Form state
  const [nama, setNama]   = useState("");
  const [items, setItems] = useState<SJItem[]>([createEmptyItem(1)]);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setNama("");
    setItems([createEmptyItem(1)]);
    setError("");
  }, []);

  const handleSave = useCallback(async () => {
    setError("");

    const namaTrim = nama.trim();
    if (!namaTrim) { setError("Nama template wajib diisi"); return; }

    const validItems = items.filter(i => i.jenis.trim() !== "");
    if (validItems.length === 0) {
      setError("Minimal 1 baris item dengan jenis terisi");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/sj/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: namaTrim,
          items: validItems.map(toTemplateItem),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Gagal menyimpan template");
      }

      resetForm();
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }, [nama, items, resetForm, refresh]);

  const handleDelete = useCallback(async (tpl: SJItemTemplate) => {
    if (!confirm(`Hapus template "${tpl.nama}"? Tindakan ini tidak bisa dibatalkan.`)) return;

    setDeletingId(tpl.id);
    try {
      const res = await fetch(`/api/sj/templates?id=${tpl.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Gagal menghapus template");
      }
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus");
    } finally {
      setDeletingId(null);
    }
  }, [refresh]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#080e18] text-white">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title="Template Item" />

        <main className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white">Template Item Surat Jalan</h1>
            <p className="mt-0.5 text-xs text-white/40">
              Simpan kombinasi item yang sering berulang. Saat membuat Surat Jalan, pilih template
              untuk menambahkan semua item-nya sekaligus.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] px-4 py-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rose-400 shrink-0">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-xs text-rose-300">{error}</p>
            </div>
          )}

          {/* ── Form buat template baru ──────────────────────────────────── */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
            <h2 className="text-[12px] font-semibold uppercase tracking-widest text-cyan-400/70">
              Buat Template Baru
            </h2>

            <div>
              <label className="block text-[11px] font-medium text-white/50 mb-1.5">Nama Template *</label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Mis. SDN, CCTV Toko Baru, Paket Kopi..."
                suppressHydrationWarning
                className="w-full md:w-1/2 bg-white/[0.04] border border-white/[0.08] text-white/80 text-[12px] placeholder:text-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <div>
              <p className="text-[11px] font-medium text-white/50 mb-2">
                Item Template
                <span className="text-white/25"> — kolom Serial Number diabaikan, diisi manual saat buat SJ</span>
              </p>
              <SJItemsTable
                items={items}
                jenisOptions={jenisOptions}
                merkOptions={merkOptions}
                onChange={setItems}
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.04] text-white/70 text-[12px] font-medium hover:bg-white/[0.08] hover:text-white transition-all disabled:opacity-50"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[12px] font-semibold shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <><svg className="animate-spin" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 1.5A4.5 4.5 0 1 1 1.5 6" /></svg>Menyimpan...</>
                ) : (
                  <>Simpan Template</>
                )}
              </button>
            </div>
          </div>

          {/* ── Daftar template ──────────────────────────────────────────── */}
          <div>
            <h2 className="text-[12px] font-semibold uppercase tracking-widest text-cyan-400/70 mb-3">
              Template Tersimpan {templates.length > 0 && <span className="text-white/30">({templates.length})</span>}
            </h2>

            {loading ? (
              <div className="flex items-center gap-2 text-white/40 px-1 py-4">
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2A10 10 0 1 1 2 12" /></svg>
                <span className="text-xs">Memuat template...</span>
              </div>
            ) : templates.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.01] px-4 py-8 text-center">
                <p className="text-sm text-white/40">Belum ada template</p>
                <p className="text-xs text-white/25 mt-1">Buat template pertama di form atas</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {templates.map((tpl) => (
                  <div key={tpl.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="text-[13px] font-semibold text-white">{tpl.nama}</h3>
                        <p className="text-[10px] text-white/30 mt-0.5">{tpl.items.length} item</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDelete(tpl)}
                        disabled={deletingId === tpl.id}
                        title="Hapus template"
                        className="flex items-center justify-center w-7 h-7 rounded-lg text-rose-400/60 hover:text-rose-300 hover:bg-rose-500/10 transition-all disabled:opacity-50"
                      >
                        {deletingId === tpl.id ? (
                          <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2A10 10 0 1 1 2 12" /></svg>
                        ) : (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" />
                          </svg>
                        )}
                      </button>
                    </div>

                    <div className="space-y-1">
                      {tpl.items.map((it, i) => (
                        <div key={i} className="flex items-center gap-2 text-[11px] text-white/60">
                          <span className="font-mono text-white/30 w-4 shrink-0">{i + 1}.</span>
                          <span className="text-white/80">{it.jenis}</span>
                          {it.merk && <span className="text-white/40">· {it.merk}</span>}
                          <span className="text-white/30">· {it.qty} {it.satuan}</span>
                          <span className="flex gap-1 ml-auto shrink-0">
                            {it.is_baru && <span className="text-[8px] bg-emerald-500/15 text-emerald-300 px-1.5 py-0.5 rounded">BARU</span>}
                            {it.is_aktiva && <span className="text-[8px] bg-blue-500/15 text-blue-300 px-1.5 py-0.5 rounded">AT</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}
