"use client";

/**
 * StagingTab.tsx
 * Tab "Staging" di halaman Monitoring.
 * Menampilkan DAT dari luar CGA yang masuk via Penerimaan Barang (SJ masuk),
 * menunggu DAT terbaru di-upload. User bisa menambahkan catatan di sini.
 *
 * - Item dengan kode_asset → normal (bisa disinkron nanti)
 * - Item tanpa kode_asset → "AT Lebih" (tidak beridentitas, tidak ikut sync)
 * - Tombol "Sinkronkan Sekarang" → migrasi catatan ke asset_notes untuk item
 *   yang kode_asset-nya sudah ada di DAT terbaru + toko CGA1/2/3
 */

import { memo, useState, useCallback, useRef, useEffect } from "react";
import { useStaging, type StagingItem } from "@/hooks/useStaging";

// ── Catatan cell — auto-save on blur ────────────────────────────────────────
const CatatanCell = memo(({ item, onSaved }: { item: StagingItem; onSaved: (id: string, catatan: string) => void }) => {
  const [val, setVal]     = useState(item.catatan ?? "");
  const [saving, setSaving] = useState(false);
  const lastSaved = useRef(item.catatan ?? "");

  useEffect(() => {
    setVal(item.catatan ?? "");
    lastSaved.current = item.catatan ?? "";
  }, [item.catatan]);

  const handleBlur = useCallback(async () => {
    const trimmed = val.trim();
    if (trimmed === lastSaved.current.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/staging", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, catatan: trimmed }),
      });
      const json = await res.json();
      if (json.success) {
        lastSaved.current = trimmed;
        onSaved(item.id, trimmed);  // update lokal, TIDAK re-fetch seluruh list
      }
    } catch { /* silent */ }
    finally { setSaving(false); }
  }, [val, item.id, onSaved]);

  return (
    <div className="relative">
      <input
        type="text"
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={handleBlur}
        placeholder="Tambah catatan..."
        suppressHydrationWarning
        className="w-full bg-white/[0.04] border border-white/[0.08] text-white/80 text-[12px] placeholder:text-slate-600 rounded-lg px-2 py-1.5 focus:outline-none focus:border-emerald-500/50 transition-all"
      />
      {saving && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-emerald-400/60">simpan...</span>
      )}
    </div>
  );
});
CatatanCell.displayName = "CatatanCell";

function StagingTab() {
  const { items, loading, refresh, updateItemLocal } = useStaging();
  const [syncing, setSyncing]   = useState(false);
  const [syncMsg, setSyncMsg]   = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editKodeId, setEditKodeId] = useState<string | null>(null);  // id item AT Lebih yang sedang diisi kode
  const [kodeInput, setKodeInput]   = useState("");
  const [savingKode, setSavingKode] = useState(false);

  const handleSaveKode = useCallback(async (id: string) => {
    const trimmed = kodeInput.trim();
    if (!trimmed) { setEditKodeId(null); return; }
    setSavingKode(true);
    try {
      const res = await fetch("/api/staging", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, kode_asset: trimmed }),
      });
      const json = await res.json();
      if (json.success) {
        updateItemLocal(id, { kode_asset: trimmed, is_at_lebih: false });
        setEditKodeId(null);
        setKodeInput("");
      }
    } catch { /* silent */ }
    finally { setSavingKode(false); }
  }, [kodeInput, updateItemLocal]);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    setSyncMsg("");
    try {
      const res = await fetch("/api/staging", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync" }),
      });
      const json = await res.json();
      if (json.success) {
        setSyncMsg(json.synced > 0
          ? `${json.synced} item disinkronkan ke Monitoring.`
          : "Tidak ada item yang cocok dengan DAT terbaru.");
        refresh();
      } else {
        setSyncMsg(json.error ?? "Gagal sinkronisasi.");
      }
    } catch {
      setSyncMsg("Terjadi kesalahan saat sinkronisasi.");
    } finally {
      setSyncing(false);
    }
  }, [refresh]);

  const handleDelete = useCallback(async (id: string) => {
    setDeletingId(id);
    try {
      await fetch("/api/staging", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      refresh();
    } catch { /* silent */ }
    finally { setDeletingId(null); }
  }, [refresh]);

  const totalItem   = items.length;
  const atLebihCount = items.filter(i => i.is_at_lebih).length;
  const normalCount  = totalItem - atLebihCount;

  const gridStyle = {
    gridTemplateColumns: "40px minmax(130px,1fr) minmax(120px,0.8fr) minmax(120px,0.8fr) minmax(140px,1fr) minmax(160px,1.3fr) 60px",
  };

  return (
    <>
      {/* Info panel + tombol sync */}
      <div className="mb-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] text-white/60 mb-1">
              DAT dari luar CGA yang fisiknya dikembalikan ke CGA (via Penerimaan Barang),
              menunggu DAT terbaru di-upload.
            </p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[11px] text-white/40">
                Total: <span className="text-white/70 font-semibold">{totalItem}</span>
              </span>
              <span className="text-[11px] text-emerald-400/70">
                Normal: <span className="font-semibold">{normalCount}</span>
              </span>
              <span className="text-[11px] text-amber-400/70">
                AT Lebih: <span className="font-semibold">{atLebihCount}</span>
              </span>
            </div>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing || totalItem === 0}
            className="flex items-center gap-2 shrink-0 px-4 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-[12px] font-medium hover:bg-emerald-500/20 transition-all disabled:opacity-40 disabled:pointer-events-none"
          >
            {syncing ? (
              <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.22-8.56"/>
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
            )}
            Sinkronkan Sekarang
          </button>
        </div>
        {syncMsg && (
          <p className="mt-3 text-[11px] text-cyan-300 bg-cyan-500/[0.06] border border-cyan-500/20 rounded-lg px-3 py-2">
            {syncMsg}
          </p>
        )}
      </div>

      {/* Tabel staging */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
        <div style={gridStyle} className="grid gap-2 border-b border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-white/40">
          <span className="text-center">No</span>
          <span>Kode Aset</span>
          <span>Jenis</span>
          <span>Merk</span>
          <span>Asal Toko</span>
          <span>Catatan</span>
          <span className="text-center">Aksi</span>
        </div>

        {loading ? (
          <div className="px-4 py-8 text-center text-[12px] text-white/30">Memuat...</div>
        ) : items.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-[12px] text-white/30">Belum ada item di staging area</p>
            <p className="text-[11px] text-white/20 mt-1">Item akan muncul otomatis saat ada Penerimaan Barang</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {items.map((item, idx) => (
              <div key={item.id} style={gridStyle} className="grid gap-2 px-4 py-2.5 items-center hover:bg-white/[0.02] transition-colors">
                <span className="text-[11px] font-mono text-white/40 text-center">{idx + 1}</span>

                {/* Kode Aset / AT Lebih */}
                {item.is_at_lebih ? (
                  editKodeId === item.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={kodeInput}
                        onChange={e => setKodeInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") handleSaveKode(item.id);
                          if (e.key === "Escape") { setEditKodeId(null); setKodeInput(""); }
                        }}
                        placeholder="Kode aset..."
                        autoFocus
                        disabled={savingKode}
                        className="w-full bg-white/[0.04] border border-amber-500/40 text-amber-200 text-[11px] placeholder:text-slate-600 rounded-md px-2 py-1 focus:outline-none focus:border-amber-500/70"
                      />
                      <button onClick={() => handleSaveKode(item.id)} disabled={savingKode}
                        title="Simpan" className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-emerald-400 hover:bg-emerald-500/10 transition-all">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      </button>
                      <button onClick={() => { setEditKodeId(null); setKodeInput(""); }}
                        title="Batal" className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-white/40 hover:bg-white/[0.06] transition-all">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex w-fit items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        AT Lebih
                      </span>
                      <button
                        onClick={() => { setEditKodeId(item.id); setKodeInput(""); }}
                        title="Isi kode aset"
                        className="shrink-0 w-5 h-5 flex items-center justify-center rounded-md text-amber-400/70 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/20 transition-all"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      </button>
                    </div>
                  )
                ) : (
                  <span className="text-[11px] font-mono text-emerald-300 truncate" title={item.kode_asset ?? ""}>
                    {item.kode_asset}
                  </span>
                )}

                <span className="text-[11px] text-white/70 truncate" title={item.jenis}>{item.jenis || "—"}</span>
                <span className="text-[11px] text-white/60 truncate" title={item.merk}>{item.merk || "—"}</span>
                <span className="text-[11px] text-white/50 truncate" title={item.asal_toko}>{item.asal_toko || "—"}</span>

                <CatatanCell item={item} onSaved={(id, catatan) => updateItemLocal(id, { catatan })} />

                <div className="flex items-center justify-center">
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    title="Hapus dari staging"
                    className="flex items-center justify-center w-7 h-7 rounded-md text-rose-400/60 hover:text-rose-300 hover:bg-rose-500/10 transition-all disabled:opacity-40"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default memo(StagingTab);
