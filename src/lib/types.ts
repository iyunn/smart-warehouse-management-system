// ─── Raw Excel row (keyed by the actual column header strings) ─────────────────
export type RawExcelRow = Record<string, unknown>;

// ─── Mapped / validated asset record ──────────────────────────────────────────
export interface AssetRecord {
  toko: string;
  kategori_oracle: string;
  kode_asset: string;
  deskripsi: string;
  status: string; // defaults to "CGA1"
}

// ─── Column mapping: Excel header → AssetRecord key ───────────────────────────
export const COLUMN_MAP: Record<string, keyof AssetRecord> = {
  toko: "toko",
  kategori: "kategori_oracle",
  "no. seri": "kode_asset",
  keterangan: "deskripsi",
};

export const REQUIRED_COLUMNS = Object.keys(COLUMN_MAP) as string[];
export const DEFAULT_STATUS = "CGA1";
export const BATCH_SIZE = 500;

// ─── Batch processing result ───────────────────────────────────────────────────
export interface BatchResult {
  batchIndex: number;
  totalBatches: number;
  rowsInBatch: number;
  success: boolean;
  error?: string;
}

// ─── Overall processing summary ───────────────────────────────────────────────
export interface ProcessSummary {
  totalRows: number;
  validRows: number;
  skippedRows: number;
  totalBatches: number;
  successfulBatches: number;
  failedBatches: number;
  errors: string[];
  durationMs: number;
}

// ─── Parse result from XLSX parser ────────────────────────────────────────────
export interface ParseResult {
  records: AssetRecord[];
  skippedRows: number;
  warnings: string[];
}

// ─── Upload pipeline state (drives the UI) ────────────────────────────────────
export type PipelinePhase =
  | "idle"
  | "dragging"
  | "selected"
  | "parsing"
  | "processing"
  | "success"
  | "error";

export interface PipelineState {
  phase: PipelinePhase;
  file: File | null;
  fileName: string;
  fileSize: string;
  parseProgress: number;       // 0–100, used during XLSX parse
  batchProgress: number;       // 0–100, used during batch API calls
  currentBatch: number;
  totalBatches: number;
  summary: ProcessSummary | null;
  errorMessage: string;
  errorDetail: string;
}