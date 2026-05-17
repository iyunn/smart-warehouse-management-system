"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useKeywordRule } from "@/hooks/useKeywordRule";

interface AddRuleModalProps {
  assetId?: string;
  onClose: () => void;
  onSuccess?: (assetId?: string) => void;
}

const OVERLAY_ANIM = `
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(24px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0)   scale(1);    }
}
`;

function injectStyle(css: string, id: string) {
  if (typeof document === "undefined") return;
  if (document.getElementById(id)) return;
  const s = document.createElement("style");
  s.id = id;
  s.textContent = css;
  document.head.appendChild(s);
}

interface FieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

const Field = memo(({ label, required, children }: FieldProps) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold tracking-widest uppercase text-cyan-400/80">
      {label}
      {required && <span className="ml-1 text-cyan-400">*</span>}
    </label>
    {children}
  </div>
));
Field.displayName = "Field";

const inputCls =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none transition-all duration-150 focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 hover:border-white/20";

const selectCls =
  "w-full rounded-lg border border-white/10 bg-[#0f1724] px-3 py-2 text-sm text-white outline-none transition-all duration-150 focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 hover:border-white/20 appearance-none cursor-pointer";

export const AddRuleModal = memo(
  ({ assetId, onClose, onSuccess }: AddRuleModalProps) => {
    const {
            form,
            updateField,
            submit,
            submitStatus,
            submitError,
          } = useKeywordRule();

    const [errors, setErrors] = useState<Record<string, string>>({});
    const firstInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      injectStyle(OVERLAY_ANIM, "arm-anim");
      const t = setTimeout(() => firstInputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }, []);

    // Close on Escape
    useEffect(() => {
      const handler = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      document.addEventListener("keydown", handler);
      return () => document.removeEventListener("keydown", handler);
    }, [onClose]);

    const validate = useCallback(() => {
      const errs: Record<string, string> = {};
      if (!form.keyword.trim()) errs.keyword = "Keyword wajib diisi";
      if (!form.value.trim()) errs.value = "Value wajib diisi";
      return errs;
    }, [form]);

    const handleSave = useCallback(async () => {
    const errs = validate();

    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    const success = await submit();

    if (success) {
      onSuccess?.(assetId);
      onClose();
    } else {
      setErrors({
        submit: submitError || "Gagal menyimpan rule.",
      });
    }
  }, [validate, submit, onSuccess, assetId, onClose, submitError]);

    const handleBackdrop = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
      },
      [onClose]
    );

    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Tambah Keyword Rule"
        onClick={handleBackdrop}
        style={{ animation: "fadeIn 180ms ease both" }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

        {/* Panel */}
        <div
          style={{ animation: "slideUp 220ms cubic-bezier(0.16,1,0.3,1) both" }}
          className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0c1421]/95 shadow-2xl shadow-black/60 backdrop-blur-xl"
        >
          {/* Top accent bar */}
          <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-5 pb-4">
            <div>
              <h2 className="text-base font-semibold text-white">
                Tambah Keyword Rule
              </h2>
              <p className="mt-0.5 text-xs text-white/40">
                Rule akan diterapkan ke aset yang cocok secara otomatis
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Tutup modal"
              className="ml-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-white"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M1 1l12 12M13 1L1 13" />
              </svg>
            </button>
          </div>

          {/* Divider */}
          <div className="mx-6 h-px bg-white/5" />

          {/* Body */}
          <div className="flex flex-col gap-4 px-6 py-5">
            {/* Keyword */}
            <Field label="Keyword" required>
              <input
                ref={firstInputRef}
                type="text"
                value={form.keyword}
                onChange={(e) => updateField("keyword", e.target.value)}
                placeholder="e.g. laptop, printer laser, switch 24 port"
                className={inputCls}
              />
              {errors.keyword && (
                <p className="text-xs text-red-400">{errors.keyword}</p>
              )}
            </Field>
            
            <Field label="Tipe Rule" required>
                <div className="relative">
                  <select
                    value={form.rule_type}
                    onChange={(e) =>
                      updateField(
                        "rule_type",
                        e.target.value as "jenis" | "merk"
                      )
                    }
                    className={selectCls}
                  >
                    <option value="merk">Merk</option>
                    <option value="jenis">Jenis</option>
                  </select>

                  <ChevronIcon />
                </div>
              </Field>

              <Field
                label={
                  form.rule_type === "merk"
                    ? "Merk"
                    : "Jenis Barang"
                }
                required
              >
                <input
                  type="text"
                  value={form.value}
                  onChange={(e) =>
                    updateField("value", e.target.value)
                  }
                  placeholder={
                    form.rule_type === "merk"
                      ? "Contoh: DELL"
                      : "Contoh: Laptop"
                  }
                  className={inputCls}
                />

                {errors.value && (
                  <p className="text-xs text-red-400">
                    {errors.value}
                  </p>
                )}
              </Field>

            {/* Submit error */}
            {errors.submit && (
              <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                {errors.submit}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-white/5 px-6 py-4">
            <button
              onClick={onClose}
              disabled={submitStatus === "submitting"}
              className="rounded-lg px-4 py-2 text-sm text-white/50 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-40"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={submitStatus === "submitting"}
              className="flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-5 py-2 text-sm font-medium text-cyan-300 shadow-sm transition-all duration-150 hover:bg-cyan-500/20 hover:text-cyan-200 disabled:opacity-50"
            >
              {submitStatus === "submitting" ? (
                <>
                  <Spinner />
                  Menyimpan…
                </>
              ) : (
                <>
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 13 13"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 6.5l3.5 3.5 5.5-6" />
                  </svg>
                  Simpan Rule
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }
);
AddRuleModal.displayName = "AddRuleModal";

const ChevronIcon = () => (
  <svg
    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30"
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 4l4 4 4-4" />
  </svg>
);

const Spinner = () => (
  <svg
    className="animate-spin"
    width="13"
    height="13"
    viewBox="0 0 13 13"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M6.5 1.5A5 5 0 1 1 1.5 6.5" />
  </svg>
);
