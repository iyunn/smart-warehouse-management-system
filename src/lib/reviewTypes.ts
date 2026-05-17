// ─── assets_clean row ────────────────────────────────────────────────────────
export interface AssetClean {
  id: string;
  kode_asset: string;
  original_description: string;
  jenis: string;
  merk: string;
  kategori: string;
  confidence_score: number | null;
  toko?: string;
  status?: string;
}

// ─── keyword_rules row ────────────────────────────────────────────────────────
export interface KeywordRule {
  id?: string;
  keyword: string;
  rule_type: "jenis" | "merk";
  value: string;
  created_at?: string;
}

// ─── Derived summary counts ───────────────────────────────────────────────────
export interface ReviewSummary {
  total: number;
  unknownMerk: number;
  unknownJenis: number;
  completionPct: number; // 0–100, % of assets that are NOT unknown
}

// ─── Modal form state ────────────────────────────────────────────────────────
export interface RuleFormState {
  keyword: string;
  rule_type: "jenis" | "merk";
  value: string;
}

export const RULE_FORM_EMPTY: RuleFormState = {
  keyword: "",
  rule_type: "merk",
  value: "",
};

// ─── Filter / sort state ─────────────────────────────────────────────────────
export type FilterType = "all" | "unknown_jenis" | "unknown_merk" | "both";
export type SortField = "kode_asset" | "jenis" | "merk" | "confidence_score";
export type SortDir = "asc" | "desc";