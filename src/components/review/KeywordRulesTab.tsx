"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { KeywordRule } from "@/lib/reviewTypes";

// ─── Edit Modal ───────────────────────────────────────────────────────────────

interface EditRuleModalProps {
  rule: KeywordRule;
  onClose: () => void;
  onSaved: () => void;
}

const inputCls =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none transition-all duration-150 focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 hover:border-white/20";
const selectCls =
  "w-full rounded-lg border border-white/10 bg-[#0f1724] px-3 py-2 text-sm text-white outline-none transition-all duration-150 focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 hover:border-white/20 appearance-none cursor-pointer";

const EditRuleModal = memo(({ rule, onClose, onSaved }: EditRuleModalProps) => {
  const [keyword, setKeyword] = useState(rule.keyword);
  const [ruleType, setRuleType] = useState<"jenis" | "merk">(rule.rule_type);
  const [value, setValue] = useState(rule.value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSave = useCallback(async () => {
    if (!keyword.trim()) { setError("Keyword wajib diisi"); return; }
    if (!value.trim()) { setError("Value wajib diisi"); return; }
    setSaving(true);
    setError("");
    const { error: sbError } = await supabase
      .from("keyword_rules")
      .update({ keyword: keyword.trim().toUpperCase(), rule_type: ruleType, value: value.trim() })
      .eq("id", rule.id!);
    setSaving(false);
    if (sbError) { setError(sbError.message); return; }
    onSaved();
    onClose();
  }, [keyword, ruleType, value, rule.id, onClose, onSaved]);

  const handleBackdrop = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  return (
    <div onClick={handleBackdrop} style={{ animation: "fadeIn 180ms ease both" }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{opacity:0;transform:translateY(24px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div style={{ animation: "slideUp 220ms cubic-bezier(0.16,1,0.3,1) both" }}
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0c1421]/95 shadow-2xl shadow-black/60 backdrop-blur-xl">
        <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
        <div className="flex items-start justify-between px-6 pt-5 pb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Edit Keyword Rule</h2>
            <p className="mt-0.5 text-xs text-white/40">Perubahan akan diterapkan saat Reclassify dijalankan</p>
          </div>
          <button onClick={onClose} className="ml-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-white">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 1l12 12M13 1L1 13" /></svg>
          </button>
        </div>
        <div className="mx-6 h-px bg-white/5" />
        <div className="flex flex-col gap-4 px-6 py-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-widest uppercase text-cyan-400/80">Keyword <span className="text-cyan-400">*</span></label>
            <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} className={inputCls} placeholder="e.g. DAIKIN, AC SPLIT WALL" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-widest uppercase text-cyan-400/80">Tipe Rule <span className="text-cyan-400">*</span></label>
            <div className="relative">
              <select value={ruleType} onChange={(e) => setRuleType(e.target.value as "jenis" | "merk")} className={selectCls}>
                <option value="merk">Merk</option>
                <option value="jenis">Jenis</option>
              </select>
              <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4l4 4 4-4" /></svg>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-widest uppercase text-cyan-400/80">
              {ruleType === "merk" ? "Merk" : "Jenis Barang"} <span className="text-cyan-400">*</span>
            </label>
            <input type="text" value={value} onChange={(e) => setValue(e.target.value)} className={inputCls}
              placeholder={ruleType === "merk" ? "Contoh: DAIKIN" : "Contoh: AC Split"} />
          </div>
          {error && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-white/5 px-6 py-4">
          <button onClick={onClose} disabled={saving} className="rounded-lg px-4 py-2 text-sm text-white/50 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-40">Batal</button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-5 py-2 text-sm font-medium text-cyan-300 shadow-sm transition-all hover:bg-cyan-500/20 hover:text-cyan-200 disabled:opacity-50">
            {saving ? (<><svg className="animate-spin" width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6.5 1.5A5 5 0 1 1 1.5 6.5" /></svg>Menyimpan…</>) : (<><svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6.5l3.5 3.5 5.5-6" /></svg>Simpan</>)}
          </button>
        </div>
      </div>
    </div>
  );
});
EditRuleModal.displayName = "EditRuleModal";

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

interface DeleteConfirmProps {
  rule: KeywordRule;
  onClose: () => void;
  onDeleted: (rule: KeywordRule) => void;
}

const DeleteConfirmModal = memo(({ rule, onClose, onDeleted }: DeleteConfirmProps) => {
  const [deleting, setDeleting] = useState(false);
  const [status, setStatus] = useState<"confirm" | "reverting">("confirm");

  const handleDelete = useCallback(async () => {
    setDeleting(true);

    // 1. Hapus rule dari DB
    const { error } = await supabase.from("keyword_rules").delete().eq("id", rule.id!);
    if (error) { setDeleting(false); return; }

    // 2. Trigger targeted revert via API
    setStatus("reverting");
    try {
      const body: Record<string, string> = {};
      if (rule.rule_type === "merk") body.revert_merk = rule.value;
      else body.revert_jenis = rule.value;

      await fetch("/api/reclassify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (_) {
      // revert gagal tidak bloking — data bisa difix manual
    }

    setDeleting(false);
    onDeleted(rule);
    onClose();
  }, [rule, onClose, onDeleted]);

  const handleBackdrop = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !deleting) onClose();
  }, [onClose, deleting]);

  return (
    <div onClick={handleBackdrop} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#0c1421]/95 shadow-2xl backdrop-blur-xl p-6">
        <div className="flex flex-col items-center text-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${
            status === "reverting"
              ? "border-violet-500/20 bg-violet-500/10"
              : "border-rose-500/20 bg-rose-500/10"
          }`}>
            {status === "reverting" ? (
              <svg className="animate-spin text-violet-400" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M10 2a8 8 0 1 0 8 8" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-400">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            )}
          </div>
          <div>
            {status === "reverting" ? (
              <>
                <h3 className="text-base font-semibold text-white">Reverting aset terdampak…</h3>
                <p className="mt-1 text-xs text-white/40">Aset yang terklasifikasi oleh rule ini sedang dikembalikan ke Unknown</p>
              </>
            ) : (
              <>
                <h3 className="text-base font-semibold text-white">Hapus Rule?</h3>
                <p className="mt-1 text-xs text-white/40">
                  Rule <span className="font-mono text-white/70">{rule.keyword}</span> akan dihapus dan aset yang terklasifikasi oleh rule ini akan di-revert ke Unknown secara otomatis.
                </p>
              </>
            )}
          </div>
        </div>
        {status === "confirm" && (
          <div className="flex gap-2 mt-5">
            <button onClick={onClose} disabled={deleting}
              className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-white/50 hover:bg-white/5 hover:text-white transition-colors disabled:opacity-40">
              Batal
            </button>
            <button onClick={handleDelete} disabled={deleting}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 py-2 text-sm font-medium text-rose-300 hover:bg-rose-500/20 transition-all disabled:opacity-50">
              {deleting ? "Menghapus…" : "Hapus & Revert"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
DeleteConfirmModal.displayName = "DeleteConfirmModal";

// ─── Rule Type Badge ──────────────────────────────────────────────────────────

const RuleTypeBadge = memo(({ type }: { type: string }) => (
  <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${
    type === "merk"
      ? "text-violet-400 bg-violet-400/10 border-violet-400/20"
      : "text-blue-400 bg-blue-400/10 border-blue-400/20"
  }`}>
    {type === "merk" ? "Merk" : "Jenis"}
  </span>
));
RuleTypeBadge.displayName = "RuleTypeBadge";

// ─── Main Component ───────────────────────────────────────────────────────────

interface KeywordRulesTabProps {
  onRulesChanged?: () => void;
}

export default function KeywordRulesTab({ onRulesChanged }: KeywordRulesTabProps) {
  const [rules, setRules] = useState<KeywordRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editTarget, setEditTarget] = useState<KeywordRule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<KeywordRule | null>(null);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("keyword_rules")
      .select("id, keyword, rule_type, value, created_at")
      .order("created_at", { ascending: false });
    setRules((data as KeywordRule[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const handleSaved = useCallback(() => {
    fetchRules();
    onRulesChanged?.();
  }, [fetchRules, onRulesChanged]);

  const handleDeleted = useCallback((_rule: KeywordRule) => {
    fetchRules();
    onRulesChanged?.();
  }, [fetchRules, onRulesChanged]);

  const filtered = rules.filter((r) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return r.keyword.toLowerCase().includes(q) || r.value.toLowerCase().includes(q);
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] shadow-xl shadow-black/30">

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-3">
        <span className="text-[11px] text-white/40">
          <span className="text-white/70 font-mono">{filtered.length}</span> rule
        </span>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari keyword, value..."
            className="bg-white/[0.04] border border-white/[0.08] text-slate-300 text-[12px] placeholder:text-slate-600 rounded-xl pl-8 pr-3 py-1.5 w-52 focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.06] transition-all" />
        </div>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[1fr_80px_1fr_80px] gap-4 border-b border-white/[0.06] px-5 py-3">
        {["Keyword", "Tipe", "Value", ""].map((h, i) => (
          <span key={i} className="text-[10px] font-semibold uppercase tracking-widest text-white/25">{h}</span>
        ))}
      </div>

      {/* Rows */}
      {loading ? (
        <div className="divide-y divide-white/5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5">
              <div className="h-3 rounded bg-white/5" style={{ width: `${20 + (i % 3) * 15}%` }} />
              <div className="h-5 w-12 rounded bg-white/5" />
              <div className="h-3 rounded bg-white/5" style={{ width: `${15 + (i % 2) * 10}%` }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm font-medium text-white/40">
            {search ? "Tidak ada rule yang cocok" : "Belum ada keyword rule"}
          </p>
          <p className="mt-1 text-xs text-white/20">
            {search ? "Coba kata kunci lain" : "Tambah rule dari tab Review Aset"}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.04]">
          {filtered.map((rule) => (
            <div key={rule.id}
              className="grid grid-cols-[1fr_80px_1fr_80px] gap-4 items-center px-5 py-3.5 hover:bg-white/[0.02] transition-colors group">
              <span className="font-mono text-[12px] text-cyan-400/80 truncate">{rule.keyword}</span>
              <div><RuleTypeBadge type={rule.rule_type} /></div>
              <span className="text-slate-300 text-[12px] truncate">{rule.value}</span>
              <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setEditTarget(rule)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-slate-500 hover:text-cyan-400 hover:border-cyan-500/40 hover:bg-cyan-500/[0.05] transition-all"
                  title="Edit rule">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button onClick={() => setDeleteTarget(rule)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-slate-500 hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/[0.05] transition-all"
                  title="Hapus rule">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editTarget && <EditRuleModal rule={editTarget} onClose={() => setEditTarget(null)} onSaved={handleSaved} />}
      {deleteTarget && <DeleteConfirmModal rule={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={handleDeleted} />}
    </div>
  );
}
