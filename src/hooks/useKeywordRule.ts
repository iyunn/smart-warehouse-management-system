"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { AssetClean, RuleFormState, RULE_FORM_EMPTY } from "../lib/reviewTypes";

// Re-export blank so callers don't need to import from reviewTypes
const BLANK: RuleFormState = {
  keyword: "",
  rule_type: "merk",
  value: "",
};

type SubmitStatus = "idle" | "submitting" | "success" | "error";

interface UseKeywordRuleReturn {
  open: boolean;
  targetAsset: AssetClean | null;
  form: RuleFormState;
  submitStatus: SubmitStatus;
  submitError: string;
  openModal: (asset: AssetClean) => void;
  closeModal: () => void;
  updateField: <K extends keyof RuleFormState>(key: K, value: RuleFormState[K]) => void;
  submit: () => Promise<boolean>;
}

export function useKeywordRule(): UseKeywordRuleReturn {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [targetAsset, setTargetAsset] = useState<AssetClean | null>(null);
  const [form, setForm] = useState<RuleFormState>(BLANK);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [submitError, setSubmitError] = useState("");

  const openModal = useCallback((asset: AssetClean) => {
    setTargetAsset(asset);
    // Auto-fill: derive keyword from first meaningful word of description
    const keyword =
      asset.original_description
        ?.split(/\s+/)
        .slice(0, 3)
        .join(" ")
        .toLowerCase() ?? "";

    setForm({
      keyword,
      rule_type: "merk",
      value:
        asset.merk !== "Unknown"
          ? asset.merk
          : "",
    });
    setSubmitStatus("idle");
    setSubmitError("");
    setOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setOpen(false);
    setTargetAsset(null);
    setForm(BLANK);
    setSubmitStatus("idle");
    setSubmitError("");
  }, []);

  const updateField = useCallback(
    <K extends keyof RuleFormState>(key: K, value: RuleFormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const submit = useCallback(async (): Promise<boolean> => {
    if (!form.keyword.trim()) {
      setSubmitError("Keyword tidak boleh kosong.");
      return false;
    }

    setSubmitStatus("submitting");
    setSubmitError("");

    try {
      const { error } = await supabase.from("keyword_rules").insert({
        keyword: form.keyword.trim().toUpperCase(),
        rule_type: form.rule_type,
        value: form.value.trim(),
      });

      if (error) throw new Error(error.message);
      setSubmitStatus("success");
      return true;
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      setSubmitStatus("error");
      return false;
    }
  }, [form]);

  return {
    open,
    targetAsset,
    form,
    submitStatus,
    submitError,
    openModal,
    closeModal,
    updateField,
    submit,
  };
}