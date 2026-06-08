"use client";

import { useState, useCallback, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import SearchableDropdown from "@/components/sj/SearchableDropdown";
import SJItemsTable from "@/components/sj/SJItemsTable";
import SJPreviewModal from "@/components/sj/SJPreviewModal";
import { useMasterJenis, useMasterMerk, useMasterTujuan } from "@/hooks/useSJMaster";
import { useSJDetail } from "@/hooks/useSJList";
import { createEmptyItem, type SJItem } from "@/lib/sjTypes";
import type { SJDataForPDF } from "@/components/sj/SuratJalanPDF";

function BuatSJPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = !!editId;

  const { jenis: jenisOptions } = useMasterJenis();
  const { merk: merkOptions }   = useMasterMerk();
  const { tujuan: tujuanList }  = useMasterTujuan();

  const { sj: existingSJ, loading: loadingExisting, error: loadError } = useSJDetail(editId);

  const today = new Date().toISOString().slice(0, 10);
  const [tanggal, setTanggal]   = useState(today);
  const [tujuanId, setTujuanId] = useState("");
  const [pembawa, setPembawa]   = useState("");
  const [items, setItems]       = useState<SJItem[]>([createEmptyItem(1)]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");
  const [hydrated, setHydrated]     = useState(false);

  // Preview modal state
  const [previewData, setPreviewData] = useState<SJDataForPDF | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>("");

  useEffect(() => {
    if (isEditMode && existingSJ && !hydrated) {
      setTanggal(existingSJ.tanggal);
      setTujuanId(existingSJ.tujuan_id);
      setPembawa(existingSJ.pembawa ?? "");

      const itemsData = (existingSJ.items ?? []).map((it: any, idx: number) => ({
        urutan:        idx + 1,
        jenis:         it.jenis ?? "",
        merk:          it.merk ?? "",
        serial_number: it.serial_number ?? "",
        qty:           it.qty ?? 1,
        satuan:        it.satuan ?? "Unit",
        is_baru:       !!it.is_baru,
        is_aktiva:     !!it.is_aktiva,
        keterangan:    it.keterangan ?? "",
      }));
      setItems(itemsData.length > 0 ? itemsData : [createEmptyItem(1)]);
      setHydrated(true);
    }
  }, [isEditMode, existingSJ, hydrated]);

  const tujuanOptions = useMemo(
    () => tujuanList.map(t => ({
      value: t.id,
      label: `${t.kode} — ${t.nama}`,
    })),
    [tujuanList]
  );

  const selectedTujuan = tujuanList.find(t => t.id === tujuanId);
  const penerimaDisplay = selectedTujuan ? `${selectedTujuan.kode} — ${selectedTujuan.nama}` : "";

  const handleSubmit = useCallback(async (status: "draft" | "submitted") => {
    setError("");

    if (!tujuanId) { setError("Tujuan wajib dipilih"); return; }
    if (!tanggal)  { setError("Tanggal wajib diisi"); return; }
    const validItems = items.filter(i => i.jenis.trim() !== "");
    if (validItems.length === 0) {
      setError("Minimal 1 baris barang dengan jenis terisi");
      return;
    }

    setSubmitting(true);
    try {
      const body: any = {
        tanggal,
        tujuan_id:   tujuanId,
        pembawa,
        penerima:    penerimaDisplay,
        approved_by: "SPV/Manager",
        items:       validItems,
        status,
      };

      if (isEditMode) body.id = editId;

      const res = await fetch("/api/sj", {
        method:  isEditMode ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Gagal menyimpan");
      }

      const data = await res.json();
      const finalNoSJ = isEditMode ? existingSJ?.no_sj : data.no_sj;

      // ── Build PDF data dan trigger preview modal ───────────────────────
      const pdfData: SJDataForPDF = {
        no_sj:       finalNoSJ,
        tanggal,
        tujuan_kode: selectedTujuan?.kode ?? "",
        tujuan_nama: selectedTujuan?.nama ?? "",
        pembawa,
        penerima:    penerimaDisplay,
        approved_by: "SPV/Manager",
        created_by:  "Admin GA",
        items: validItems.map((it, idx) => ({
          urutan:        idx + 1,
          jenis:         it.jenis,
          merk:          it.merk,
          serial_number: it.serial_number,
          qty:           it.qty,
          satuan:        it.satuan,
          is_baru:       it.is_baru,
          is_aktiva:     it.is_aktiva,
          keterangan:    it.keterangan,
        })),
      };

      setPreviewTitle(isEditMode ? "Surat Jalan Berhasil Diupdate" : "Surat Jalan Berhasil Dibuat");
      setPreviewData(pdfData);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSubmitting(false);
    }
  }, [tanggal, tujuanId, pembawa, penerimaDisplay, items, isEditMode, editId, existingSJ, selectedTujuan]);

  // Handler saat user tutup modal — redirect/reset
  const handleClosePreview = useCallback(() => {
    setPreviewData(null);
    if (isEditMode) {
      router.push("/sj/list");
    } else {
      setItems([createEmptyItem(1)]);
      setPembawa("");
    }
  }, [isEditMode, router]);

  if (isEditMode && loadingExisting) {
    return (
      <div className="flex h-screen overflow-hidden bg-[#080e18] text-white">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar title="Edit Surat Jalan" />
          <main className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-2 text-white/40">
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2A10 10 0 1 1 2 12" /></svg>
              <span className="text-sm">Memuat data Surat Jalan...</span>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (isEditMode && loadError) {
    return (
      <div className="flex h-screen overflow-hidden bg-[#080e18] text-white">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar title="Edit Surat Jalan" />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-rose-400 mb-2">SJ tidak ditemukan atau gagal dimuat</p>
              <button onClick={() => router.push("/sj/list")} className="text-xs text-cyan-400 hover:text-cyan-300">
                ← Kembali ke List
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#080e18] text-white">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title={isEditMode ? "Edit Surat Jalan" : "Buat Surat Jalan Manual"} />

        <main className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-white">
                {isEditMode ? "Edit Surat Jalan Manual" : "Buat Surat Jalan Manual"}
              </h1>
              <p className="mt-0.5 text-xs text-white/40">
                {isEditMode
                  ? `Edit ${existingSJ?.no_sj} — perubahan akan menggantikan data lama`
                  : "Buat surat jalan pengiriman barang dari gudang ke tujuan. No SJ akan di-generate otomatis."}
              </p>
            </div>
            {isEditMode && (
              <button onClick={() => router.push("/sj/list")}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/70 hover:bg-white/[0.08]">
                ← Batal
              </button>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] px-4 py-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rose-400 shrink-0">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-xs text-rose-300">{error}</p>
            </div>
          )}

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <h2 className="text-[12px] font-semibold uppercase tracking-widest text-cyan-400/70 mb-4">
              Informasi Surat Jalan
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

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

          <div className="flex items-center justify-end gap-2 sticky bottom-0 bg-[#080e18] py-3">
            {!isEditMode && (
              <button
                type="button"
                onClick={() => handleSubmit("draft")}
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.04] text-white/70 text-[12px] font-medium hover:bg-white/[0.08] hover:text-white transition-all disabled:opacity-50"
              >
                Simpan Draft
              </button>
            )}
            <button
              type="button"
              onClick={() => handleSubmit(isEditMode ? (existingSJ?.status ?? "submitted") : "submitted")}
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[12px] font-semibold shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <><svg className="animate-spin" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 1.5A4.5 4.5 0 1 1 1.5 6" /></svg>Menyimpan...</>
              ) : (
                isEditMode ? <>Update Surat Jalan</> : <>Submit Surat Jalan</>
              )}
            </button>
          </div>

        </main>
      </div>

      {/* Preview Modal */}
      {previewData && (
        <SJPreviewModal
          data={previewData}
          title={previewTitle}
          onClose={handleClosePreview}
        />
      )}
    </div>
  );
}

export default function BuatSJPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen bg-[#080e18] items-center justify-center">
        <span className="text-white/40 text-sm">Memuat...</span>
      </div>
    }>
      <BuatSJPageContent />
    </Suspense>
  );
}
