// ─── Raw Excel row ────────────────────────────────────────────────────────────
export type RawExcelRow = Record<string, unknown>;

// ─── Warehouse cost center info (untuk label saja, tidak untuk filter) ────────
// DB sudah CGA only → tidak perlu buildWarehouseFilter()
export const WAREHOUSE_COST_CENTERS = ['CGA1', 'CGA2', 'CGA3'] as const;
export type WarehouseCostCenter = typeof WAREHOUSE_COST_CENTERS[number];

export const WAREHOUSE_LABELS: Record<WarehouseCostCenter, string> = {
  CGA1: 'Cadangan General Affairs 1',
  CGA2: 'Cadangan General Affairs 2',
  CGA3: 'Cadangan General Affairs 3',
};

// ─── Asset record ─────────────────────────────────────────────────────────────
export interface AssetRecord {
  toko:             string;
  kategori_oracle:  string;
  kode_asset:       string;
  deskripsi:        string;
  status:           string;
  kuantitas:        number;
  biaya_perolehan:  number;
  jumlah_tercatat:  number;
  invoice_number:   string;
  tanggal_dokumen:  string;
}

// ─── Column mapping (legacy, untuk reference) ─────────────────────────────────
export const COLUMN_MAP: Record<string, keyof AssetRecord> = {
  toko:                "toko",
  kategori:            "kategori_oracle",
  "no. seri":          "kode_asset",
  keterangan:          "deskripsi",
  kuantitas:           "kuantitas",
  " biaya perolehan ": "biaya_perolehan",
  " jumlah tercatat ": "jumlah_tercatat",
};

export const REQUIRED_COLUMNS = ["toko", "kategori", "no. seri", "keterangan"] as string[];
export const DEFAULT_STATUS    = "CGA1";
export const BATCH_SIZE        = 500;

// ─── Processing types ─────────────────────────────────────────────────────────
export interface BatchResult {
  batchIndex:   number;
  totalBatches: number;
  rowsInBatch:  number;
  success:      boolean;
  error?:       string;
}

export interface ProcessSummary {
  totalRows:         number;
  validRows:         number;
  skippedRows:       number;
  totalBatches:      number;
  successfulBatches: number;
  failedBatches:     number;
  errors:            string[];
  durationMs:        number;
}

export interface ParseResult {
  records:     AssetRecord[];
  skippedRows: number;
  warnings:    string[];
}

// ─── Upload pipeline state ────────────────────────────────────────────────────
export type PipelinePhase =
  | "idle" | "dragging" | "selected"
  | "parsing" | "processing" | "success" | "error";

export interface PipelineState {
  phase:         PipelinePhase;
  file:          File | null;
  fileName:      string;
  fileSize:      string;
  parseProgress: number;
  batchProgress: number;
  currentBatch:  number;
  totalBatches:  number;
  summary:       ProcessSummary | null;
  errorMessage:  string;
  errorDetail:   string;
}
