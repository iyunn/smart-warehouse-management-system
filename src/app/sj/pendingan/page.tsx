"use client";

import { useState, useMemo, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import SearchableDropdown from "@/components/sj/SearchableDropdown";
import PendinganItemsTable, { createEmptyPendinganItem, URGENSI_OPTIONS, type PendinganDraftItem, type UrgensiLevel } from "@/components/sj/PendinganItemsTable";
import { useMasterJenis, useMasterMerk, useMasterTujuan } from "@/hooks/useSJMaster";
import { usePendingan, type PendinganItemFull } from "@/hooks/usePendingan";
import type { SJTujuan } from "@/lib/sjTypes";

interface TujuanWithCount extends SJTujuan {
  pendingCount: number;
}

export default function PendinganAlokasiPage() {
  const { jenis: jenisOptions } = useMasterJenis();
  const { merk: merkOptions } = useMasterMerk();
  const { tujuan: allTujuan, loading: loadingTujuan } = useMasterTujuan();
  const { items, loading: loadingItems, addItems, clearItems } = usePendingan();

  const [kotaFilter, setKotaFilter] = useState("all");
  const [urgensiFilter, setUrgensiFilter] = useState("all");
  const [selectedTujuanId, setSelectedTujuanId] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  // Modal input pendingan (form ala SJ)
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTujuanId, setModalTujuanId] = useState("");
  const [draftItems, setDraftItems] = useState<PendinganDraftItem[]>([createEmptyPendinganItem(1)]);

  // Item yang lolos filter urgensi (dipakai untuk hitung & tampilkan tujuan)
  const itemsByUrgensi = useMemo(
    () => urgensiFilter === "all"
      ? items
      : items.filter(it => (it.urgensi ?? "sedang") === urgensiFilter),
    [items, urgensiFilter]
  );

  const pendingCountByTujuan = useMemo(() => {
    const map = new Map<string, number>();
    for (const it of itemsByUrgensi) map.set(it.tujuan_id, (map.get(it.tujuan_id) ?? 0) + 1);
    return map;
  }, [itemsByUrgensi]);

  // Urgensi tertinggi per tujuan (untuk badge di list kiri)
  const topUrgensiByTujuan = useMemo(() => {
    const rank: Record<string, number> = { tinggi: 3, sedang: 2, rendah: 1 };
    const map = new Map<string, UrgensiLevel>();
    for (const it of itemsByUrgensi) {
      const u = (it.urgensi ?? "sedang") as UrgensiLevel;
      const cur = map.get(it.tujuan_id);
      if (!cur || rank[u] > rank[cur]) map.set(it.tujuan_id, u);
    }
    return map;
  }, [itemsByUrgensi]);

  const urgensiFilterOptions = useMemo(() => ([
    { value: "all", label: "Semua Urgensi" },
    ...URGENSI_OPTIONS.map(o => ({ value: o.value, label: o.label })),
  ]), []);

  const kotaOptions = useMemo(() => {
    const set = new Set<string>();
    for (const t of allTujuan) if (t.kota?.trim()) set.add(t.kota.trim());
    const sorted = Array.from(set).sort((a, b) => a.localeCompare(b));
    return [{ value: "all", label: "Semua Kota" }, ...sorted.map(k => ({ value: k, label: k }))];
  }, [allTujuan]);

  const groupedTujuan = useMemo(() => {
    const withPending: TujuanWithCount[] = allTujuan
      .filter(t => pendingCountByTujuan.has(t.id))
      .filter(t => kotaFilter === "all" || (t.kota?.trim() ?? "") === kotaFilter)
      .map(t => ({ ...t, pendingCount: pendingCountByTujuan.get(t.id) ?? 0 }));

    const byKota = new Map<string, Map<string, TujuanWithCount[]>>();
    for (const t of withPending) {
      const kota = t.kota?.trim() || "Tanpa Kota";
      const kec = t.kecamatan?.trim() || "Tanpa Kecamatan";
      if (!byKota.has(kota)) byKota.set(kota, new Map());
      const kecMap = byKota.get(kota)!;
      if (!kecMap.has(kec)) kecMap.set(kec, []);
      kecMap.get(kec)!.push(t);
    }

    return Array.from(byKota.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([kota, kecMap]) => ({
        kota,
        kecamatans: Array.from(kecMap.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([kec, tjs]) => ({ kecamatan: kec, tujuans: tjs.sort((a, b) => a.kode.localeCompare(b.kode)) })),
      }));
  }, [allTujuan, pendingCountByTujuan, kotaFilter]);

  const selectedItems = useMemo(
    () => itemsByUrgensi.filter(it => it.tujuan_id === selectedTujuanId),
    [itemsByUrgensi, selectedTujuanId]
  );
  const selectedTujuan = useMemo(
    () => allTujuan.find(t => t.id === selectedTujuanId) ?? null,
    [allTujuan, selectedTujuanId]
  );

  const toggleItem = useCallback((id: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const allItemsChecked = useMemo(() => {
    if (selectedItems.length === 0) return false;
    return selectedItems.every(it => checkedItems.has(it.id));
  }, [selectedItems, checkedItems]);

  const handleClearChecked = useCallback(async () => {
    const toClear = selectedItems.filter(it => checkedItems.has(it.id)).map(it => it.id);
    if (toClear.length === 0) return;
    setBusy(true);
    try {
      await clearItems(toClear);
      setCheckedItems(prev => {
        const next = new Set(prev);
        toClear.forEach(id => next.delete(id));
        return next;
      });
    } catch (e) { alert(e instanceof Error ? e.message : "Gagal clear"); }
    finally { setBusy(false); }
  }, [selectedItems, checkedItems, clearItems]);

  const handleClearTujuan = useCallback(async (tujuanId: string) => {
    // Hard-delete langsung tanpa konfirmasi (sesuai permintaan).
    const toClear = items.filter(it => it.tujuan_id === tujuanId).map(it => it.id);
    if (toClear.length === 0) return;
    setBusy(true);
    try {
      await clearItems(toClear);
      if (selectedTujuanId === tujuanId) setSelectedTujuanId(null);
    } catch (e) { alert(e instanceof Error ? e.message : "Gagal clear"); }
    finally { setBusy(false); }
  }, [items, clearItems, selectedTujuanId]);

  const openModal = useCallback(() => {
    setModalTujuanId(selectedTujuanId ?? "");
    setDraftItems([createEmptyPendinganItem(1)]);
    setModalOpen(true);
  }, [selectedTujuanId]);

  const handleSaveModal = useCallback(async () => {
    if (!modalTujuanId) { alert("Pilih tujuan dulu"); return; }
    const valid = draftItems
      .filter(it => it.jenis.trim())
      .map(it => ({
        jenis: it.jenis.trim(),
        merk: it.merk.trim(),
        qty: Math.max(1, it.qty || 1),
        keterangan: it.keterangan.trim(),
        urgensi: it.urgensi,
      }));
    if (valid.length === 0) { alert("Minimal satu item dengan jenis terisi"); return; }
    setBusy(true);
    try {
      await addItems(modalTujuanId, valid);
      setModalOpen(false);
      setSelectedTujuanId(modalTujuanId);
      setCheckedItems(new Set());
    } catch (e) { alert(e instanceof Error ? e.message : "Gagal simpan"); }
    finally { setBusy(false); }
  }, [modalTujuanId, draftItems, addItems]);

  const tujuanDropdownOptions = useMemo(
    () => allTujuan
      .slice()
      .sort((a, b) => a.kode.localeCompare(b.kode))
      .map(t => ({
        value: t.id,
        label: `${t.kode} — ${t.nama}`,
        sublabel: [t.kota, t.kecamatan].filter(Boolean).join(" · ") || undefined,
      })),
    [allTujuan]
  );

  return (
    <div className="flex h-screen overflow-hidden pend-scope pend-bg" style={{ color: "var(--pend-text)" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title="Pendingan Alokasi" />

        <main className="flex-1 overflow-hidden px-6 py-5">
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5 h-full">

            {/* ══ KIRI ══════════════════════════════════════════════════════ */}
            <div className="pend-glass rounded-2xl flex flex-col overflow-hidden">
              <div className="p-4 border-b border-[color:var(--pend-border)] space-y-3">
                <button
                  onClick={openModal}
                  className="w-full py-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-[color:var(--pend-accent)] text-[12px] font-semibold hover:bg-cyan-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Pendingan Baru
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[color:var(--pend-text-dim)] mb-2">Kota</p>
                    <SearchableDropdown options={kotaOptions} value={kotaFilter} onChange={setKotaFilter} placeholder="Kota..." />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[color:var(--pend-text-dim)] mb-2">Urgensi</p>
                    <SearchableDropdown options={urgensiFilterOptions} value={urgensiFilter} onChange={setUrgensiFilter} placeholder="Urgensi..." />
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {loadingTujuan || loadingItems ? (
                  <p className="text-[12px] text-[color:var(--pend-text-dim)] text-center py-8">Memuat...</p>
                ) : groupedTujuan.length === 0 ? (
                  <p className="text-[12px] text-[color:var(--pend-text-dim)] text-center py-8">Belum ada pendingan.</p>
                ) : (
                  groupedTujuan.map(({ kota, kecamatans }) => (
                    <div key={kota}>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--pend-accent)] px-2 mb-1.5">{kota}</p>
                      {kecamatans.map(({ kecamatan, tujuans }) => (
                        <div key={kecamatan} className="mb-2">
                          <p className="text-[10px] font-medium text-[color:var(--pend-text-dim)] px-2 mb-1">{kecamatan}</p>
                          <div className="space-y-1">
                            {tujuans.map(t => (
                              <TujuanRow
                                key={t.id} tujuan={t}
                                topUrgensi={topUrgensiByTujuan.get(t.id)}
                                selected={selectedTujuanId === t.id}
                                onSelect={() => { setSelectedTujuanId(t.id); setCheckedItems(new Set()); }}
                                onClear={() => handleClearTujuan(t.id)}
                                busy={busy}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ══ KANAN ═════════════════════════════════════════════════════ */}
            <div className="pend-glass rounded-2xl flex flex-col overflow-hidden">
              {!selectedTujuan ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-[13px] text-[color:var(--pend-text-dim)]">Pilih tujuan di kiri, atau klik &quot;Pendingan Baru&quot;.</p>
                </div>
              ) : (
                <>
                  <div className="p-4 border-b border-[color:var(--pend-border)] flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-mono font-bold text-[color:var(--pend-accent)]">{selectedTujuan.kode}</span>
                        <span className="text-[13px] truncate" style={{ color: "var(--pend-text)" }}>{selectedTujuan.nama}</span>
                      </div>
                      <p className="text-[10px] text-[color:var(--pend-text-dim)] mt-0.5">
                        {[selectedTujuan.kota, selectedTujuan.kecamatan].filter(Boolean).join(" · ") || "Tanpa wilayah"}
                        {" · "}{selectedItems.length} item pending
                      </p>
                    </div>
                    {allItemsChecked && selectedItems.length > 0 && (
                      <span className="text-[10px] bg-emerald-500/15 border border-emerald-500/30 rounded-lg px-2 py-1 shrink-0 pend-emerald-text">Semua tercentang</span>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto p-3">
                    {selectedItems.length === 0 ? (
                      <p className="text-[12px] text-[color:var(--pend-text-dim)] text-center py-8">Belum ada item.</p>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="grid grid-cols-[auto_1.3fr_1fr_50px_70px_1fr] gap-2 px-2 pb-1 text-[9px] font-semibold uppercase tracking-widest text-[color:var(--pend-text-dim)]">
                          <span className="w-5" /><span>Jenis</span><span>Merk</span><span className="text-center">Qty</span><span>Urgensi</span><span>Keterangan</span>
                        </div>
                        {selectedItems.map(it => (
                          <ItemRow key={it.id} item={it} checked={checkedItems.has(it.id)} onToggle={() => toggleItem(it.id)} />
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedItems.some(it => checkedItems.has(it.id)) && (
                    <div className="px-4 py-2 border-t border-[color:var(--pend-border)]">
                      <button onClick={handleClearChecked} disabled={busy}
                        className="w-full py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-[12px] font-semibold hover:bg-emerald-500/25 transition-all disabled:opacity-50 pend-emerald-text">
                        Clear {selectedItems.filter(it => checkedItems.has(it.id)).length} item tercentang (sudah kirim)
                      </button>
                    </div>
                  )}

                  <div className="p-4 border-t border-[color:var(--pend-border)]">
                    <button onClick={openModal}
                      className="w-full py-2 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-[color:var(--pend-accent)] text-[12px] font-semibold hover:bg-cyan-500/25 transition-all">
                      + Tambah Item ke Tujuan Ini
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>
        </main>
      </div>

      {/* ══ MODAL INPUT (form ala SJ) ═══════════════════════════════════════ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => setModalOpen(false)}>
          <div className="pend-glass rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-[color:var(--pend-border)] flex items-center justify-between">
              <h3 className="text-[15px] font-semibold" style={{ color: "var(--pend-text)" }}>Input Pendingan Alokasi</h3>
              <button onClick={() => setModalOpen(false)} className="text-[color:var(--pend-text-dim)] hover:opacity-70">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-[color:var(--pend-text-dim)] mb-1.5">Tujuan *</label>
                <SearchableDropdown options={tujuanDropdownOptions} value={modalTujuanId} onChange={setModalTujuanId} placeholder="Pilih tujuan..." />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[color:var(--pend-text-dim)] mb-1.5">Detail Barang</label>
                <PendinganItemsTable items={draftItems} jenisOptions={jenisOptions} merkOptions={merkOptions} onChange={setDraftItems} />
              </div>
            </div>

            <div className="p-4 border-t border-[color:var(--pend-border)] flex items-center justify-end gap-2">
              <button onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[color:var(--pend-border)] text-[12px] text-[color:var(--pend-text-dim)] hover:opacity-70 transition-all">
                Batal
              </button>
              <button onClick={handleSaveModal} disabled={busy}
                className="px-5 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/50 text-[color:var(--pend-accent)] text-[12px] font-semibold hover:bg-cyan-500/30 transition-all disabled:opacity-50">
                Simpan Pendingan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ THEME: token warna + glass (dark & light) ═══════════════════════ */}
      <style jsx global>{`
        /* ┌──────────────────────────────────────────────────────────────┐
           │  KONTROL GLASS THEME — edit angka di sini saja                 │
           │  blur   : makin besar makin buram (px)                         │
           │  opacity: 0 = full transparan, 1 = solid (0.0 – 1.0)           │
           └──────────────────────────────────────────────────────────────┘ */
        .pend-scope {
          /* — DARK — */
          --glass-blur-dark: 16px;        /* tingkat blur panel (dark) */
          --glass-opacity-dark: 0.03;     /* opacity panel (dark) */
          --glass-modal-opacity-dark: 0.06; /* opacity modal (dark) */

          /* — LIGHT — */
          --glass-blur-light: 20px;       /* tingkat blur panel (light) */
          --glass-opacity-light: 0.45;    /* opacity panel (light) */
          --glass-saturate-light: 160%;   /* saturasi warna di belakang (light) */
        }

        /* ─── Token warna (jangan diubah untuk atur blur/opacity) ─── */
        .pend-scope {
          --pend-text: rgba(255,255,255,0.88);
          --pend-text-dim: rgba(255,255,255,0.40);
          --pend-accent: #38bdf8;
          --pend-border: rgba(255,255,255,0.10);
          --pend-row: rgba(255,255,255,0.02);
          --pend-input: rgba(255,255,255,0.05);
        }
        .pend-bg {
          background:
            radial-gradient(circle at 15% 15%, rgba(56,189,248,0.10), transparent 40%),
            radial-gradient(circle at 85% 85%, rgba(139,92,246,0.08), transparent 40%),
            #080e18;
        }
        .pend-glass {
          background: rgba(255,255,255,var(--glass-opacity-dark));
          backdrop-filter: blur(var(--glass-blur-dark));
          -webkit-backdrop-filter: blur(var(--glass-blur-dark));
          border: 1px solid rgba(255,255,255,0.08);
        }
        .pend-emerald-text { color: #6ee7b7; }
        /* Badge urgensi — dark */
        .pend-urg-tinggi { background: rgba(244,63,94,0.18); color: #fda4af; }
        .pend-urg-sedang { background: rgba(245,158,11,0.18); color: #fcd34d; }
        .pend-urg-rendah { background: rgba(148,163,184,0.18); color: #cbd5e1; }

        /* Light — glass ala iOS + warna kontras yang terbaca */
        .light .pend-scope {
          --pend-text: #1e293b;
          --pend-text-dim: #64748b;
          --pend-accent: #0369a1;
          --pend-border: rgba(15,23,42,0.12);
          --pend-row: rgba(255,255,255,0.5);
          --pend-input: rgba(255,255,255,0.7);
        }
        .light .pend-bg {
          background:
            radial-gradient(circle at 15% 15%, rgba(56,189,248,0.18), transparent 42%),
            radial-gradient(circle at 85% 85%, rgba(139,92,246,0.14), transparent 42%),
            linear-gradient(135deg, #eef2f7 0%, #e6ebf2 100%);
        }
        .light .pend-glass {
          background: rgba(255,255,255,var(--glass-opacity-light));
          backdrop-filter: blur(var(--glass-blur-light)) saturate(var(--glass-saturate-light));
          -webkit-backdrop-filter: blur(var(--glass-blur-light)) saturate(var(--glass-saturate-light));
          border: 1px solid rgba(255,255,255,0.7);
          box-shadow: 0 8px 32px rgba(15,23,42,0.08);
        }
        .light .pend-emerald-text { color: #047857; }
        /* Badge urgensi — light (warna gelap agar kontras di bg terang) */
        .light .pend-urg-tinggi { background: rgba(244,63,94,0.15); color: #9f1239; }
        .light .pend-urg-sedang { background: rgba(245,158,11,0.18); color: #92400e; }
        .light .pend-urg-rendah { background: rgba(100,116,139,0.15); color: #475569; }
      `}</style>
    </div>
  );
}

// ─── Tujuan row ─────────────────────────────────────────────────────────────
function TujuanRow({ tujuan, topUrgensi, selected, onSelect, onClear, busy }: {
  tujuan: TujuanWithCount; topUrgensi?: UrgensiLevel; selected: boolean; onSelect: () => void; onClear: () => void; busy: boolean;
}) {
  const urgDot: Record<string, string> = {
    tinggi: "bg-rose-500",
    sedang: "bg-amber-500",
    rendah: "bg-slate-400",
  };
  return (
    <div
      className={`flex items-center gap-2 px-2 py-2 rounded-xl transition-all cursor-pointer border ${
        selected ? "bg-cyan-500/15 border-cyan-500/40" : "border-transparent"
      }`}
      style={!selected ? { background: "var(--pend-row)" } : undefined}
      onClick={onSelect}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClear(); }} disabled={busy}
        title="Clear semua item tujuan ini (sudah kirim)"
        className="w-4 h-4 rounded border border-[color:var(--pend-text-dim)] hover:border-emerald-500 hover:bg-emerald-500/20 transition-all shrink-0 disabled:opacity-40"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {topUrgensi && (
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${urgDot[topUrgensi]}`} title={`Urgensi tertinggi: ${topUrgensi}`} />
          )}
          <span className="text-[11px] font-mono font-semibold text-[color:var(--pend-accent)]">{tujuan.kode}</span>
          <span className="text-[11px] truncate" style={{ color: "var(--pend-text)" }}>{tujuan.nama}</span>
        </div>
      </div>
      <span className="text-[10px] font-mono text-[color:var(--pend-text-dim)] rounded-md px-1.5 py-0.5 shrink-0" style={{ background: "var(--pend-input)" }}>
        {tujuan.pendingCount}
      </span>
    </div>
  );
}

// ─── Item row ───────────────────────────────────────────────────────────────
const URGENSI_STYLE: Record<string, string> = {
  tinggi: "pend-urg-tinggi",
  sedang: "pend-urg-sedang",
  rendah: "pend-urg-rendah",
};

function ItemRow({ item, checked, onToggle }: {
  item: PendinganItemFull; checked: boolean; onToggle: () => void;
}) {
  const urg = (item.urgensi ?? "sedang") as string;
  return (
    <div className={`grid grid-cols-[auto_1.3fr_1fr_50px_70px_1fr] gap-2 items-center px-2 py-2 rounded-lg transition-all ${checked ? "opacity-60" : ""}`}
      style={{ background: checked ? "rgba(16,185,129,0.10)" : "var(--pend-row)" }}>
      <button onClick={onToggle}
        className={`w-5 h-5 rounded border flex items-center justify-center transition-all shrink-0 ${
          checked ? "bg-emerald-500 border-emerald-500" : "border-[color:var(--pend-text-dim)] hover:border-emerald-500"
        }`}>
        {checked && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>
      <span className={`text-[12px] truncate ${checked ? "line-through" : ""}`} style={{ color: "var(--pend-text)" }}>{item.jenis}</span>
      <span className="text-[11px] truncate text-[color:var(--pend-text-dim)]">{item.merk || "—"}</span>
      <span className="text-[12px] font-mono text-center" style={{ color: "var(--pend-text)" }}>{item.qty}</span>
      <span className={`text-[9px] font-semibold uppercase tracking-wide rounded-md px-1.5 py-0.5 text-center ${URGENSI_STYLE[urg]}`}>
        {urg}
      </span>
      <span className="text-[11px] text-[color:var(--pend-text-dim)] truncate">{item.keterangan || "—"}</span>
    </div>
  );
}
