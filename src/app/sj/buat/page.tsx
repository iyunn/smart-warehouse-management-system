"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import SearchableDropdown from "@/components/sj/SearchableDropdown";
import SJItemsTable from "@/components/sj/SJItemsTable";
import { useMasterJenis, useMasterMerk, useMasterTujuan } from "@/hooks/useSJMaster";
import { createEmptyItem, type SJItem } from "@/lib/sjTypes";

export default function BuatSJPage() {
  const router = useRouter();
  const { jenis: jenisOptions } = useMasterJenis();
  const { merk: merkOptions }   = useMasterMerk();
  const { tujuan: tujuanList }  = useMasterTujuan();

  // Header state
  const today = new Date().toISOString().slice(0, 10);
  const [tanggal, setTanggal]   = useState(today);
  const [tujuanId, setTujuanId] = useState("");
  const [pembawa, setPembawa]   = useState("");

  // Items state
  const [items, setItems] = useState<SJItem[]>([createEmptyItem(1)]);

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const tujuanOptions = useMemo(
    () => tujuanList.map(t => ({
      value:    t.id,
      label:    `${t.kode} — ${t.nama}`,
      sublabel: undefined,
    })),
    [tujuanList]
  );

  // Penerima otomatis = label tujuan
  const selectedTujuan = tujuanList.find(t => t.id === tujuanId);
  const penerimaDisplay = selectedTujuan ? `${selectedTujuan.kode} — ${selectedTujuan.nama}` : "";

  const handleSubmit = useCallback(async (status: "draft" | "submitted") => {
    setError("");
    setSuccessMsg("");

    if (!tujuanId) { setError("Tujuan wajib dipilih"); return; }
    if (!tanggal)  { setError("Tanggal wajib diisi"); return; }
    const validItems = items.filter(i => i.jenis.trim() !== "");
    if (validItems.length === 0) {
      setError("Minimal 1 baris barang dengan jenis terisi");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/sj", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tanggal,
          tujuan_id:   tujuanId,
          pembawa,
          penerima:    penerimaDisplay,    // sama dengan tujuan
          approved_by: "SPV/Manager",       // hardcoded
          items: validItems,
          status,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Gagal menyimpan");
      }

      const data = await res.json();
      setSuccessMsg(`Surat Jalan berhasil dibuat: ${data.no_sj}`);

      setTimeout(() => {
        if (status === "submitted") {
          router.push("/sj/list");
        } else {
          setItems([createEmptyItem(1)]);
          setPembawa("");
          setSuccessMsg("");
        }
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSubmitting(false);
    }
  }, [tanggal, tujuanId, pembawa, penerimaDisplay, items, router]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#080e18] text-white">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title="Buat Surat Jalan Manual" />

        <main className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white">Buat Surat Jalan Manual</h1>
            <p className="mt-0.5 text-xs text-white/40">
              Buat surat jalan pengiriman barang dari gudang ke tujuan. No SJ akan di-generate otomatis.
            </p>
          </div>

          {/* Banner */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] px-4 py-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rose-400 shrink-0">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-xs text-rose-300">{error}</p>
            </div>
          )}
          {successMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 shrink-0">
                <circle cx="8" cy="8" r="6.5" /><path d="M5 8l2 2 4-4" />
              </svg>
              <p className="text-xs text-emerald-300">{successMsg}</p>
            </div>
          )}

          {/* SJ Header Form */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <h2 className="text-[12px] font-semibold uppercase tracking-widest text-cyan-400/70 mb-4">
              Informasi Surat Jalan
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Tanggal */}
              <div>
                <label className="block text-[11px] font-medium text-white/50 mb-1.5">Tanggal Pengiriman *</label>
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  suppressHydrationWarning
                  className="w-full bg-white/[0.04] border border-white/[0.08] text-white/80 text-[12px] rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              {/* Tujuan */}
              <div>
                <label className="block text-[11px] font-medium text-white/50 mb-1.5">Tujuan *</label>
                <SearchableDropdown
                  options={tujuanOptions}
                  value={tujuanId}
                  onChange={setTujuanId}
                  placeholder="Pilih tujuan..."
                />
                {penerimaDisplay && (
                  <p className="text-[10px] text-white/30 mt-1.5">
                    Penerima otomatis: <span className="text-cyan-400">{penerimaDisplay}</span>
                  </p>
                )}
              </div>

              {/* Pembawa */}
              <div className="md:col-span-2">
                <label className="block text-[11px] font-medium text-white/50 mb-1.5">Pembawa</label>
                <input
                  type="text"
                  value={pembawa}
                  onChange={(e) => setPembawa(e.target.value)}
                  placeholder="Nama pembawa..."
                  suppressHydrationWarning
                  className="w-full bg-white/[0.04] border border-white/[0.08] text-white/80 text-[12px] placeholder:text-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <h2 className="text-[12px] font-semibold uppercase tracking-widest text-cyan-400/70 mb-3">
              Detail Barang
            </h2>
            <SJItemsTable
              items={items}
              jenisOptions={jenisOptions}
              merkOptions={merkOptions}
              onChange={setItems}
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 sticky bottom-0 bg-[#080e18] py-3">
            <button
              type="button"
              onClick={() => handleSubmit("draft")}
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.04] text-white/70 text-[12px] font-medium hover:bg-white/[0.08] hover:text-white transition-all disabled:opacity-50"
            >
              Simpan Draft
            </button>
            <button
              type="button"
              onClick={() => handleSubmit("submitted")}
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[12px] font-semibold shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <><svg className="animate-spin" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 1.5A4.5 4.5 0 1 1 1.5 6" /></svg>Menyimpan...</>
              ) : (
                <>Submit Surat Jalan</>
              )}
            </button>
          </div>

        </main>
      </div>
    </div>
  );
}
