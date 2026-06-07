/**
 * txtParser.ts
 * Parses Oracle DAT export file (.txt)
 * Support delimiter: TAB (\t) atau PIPE (|)
 * Auto-detect berdasarkan baris pertama file
 */

import {
  type AssetRecord,
  type ParseResult,
  DEFAULT_STATUS,
} from "./types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cellToString(value: string): string {
  return value.trim();
}

/**
 * Parse angka format Indonesia: ' 6.190.000 ' → 6190000
 * Titik = pemisah ribuan, koma = desimal (jarang di Oracle)
 */
function cellToNumber(value: string): number {
  const str = value.trim();
  if (!str || str === "-" || str === " - ") return 0;
  const cleaned = str.replace(/\./g, "").replace(/,/g, ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num);
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Auto-detect delimiter: pipe atau tab */
function detectDelimiter(firstLine: string): string {
  const pipeCount = (firstLine.match(/\|/g) ?? []).length;
  const tabCount  = (firstLine.match(/\t/g) ?? []).length;
  return pipeCount > tabCount ? "|" : "\t";
}

// ─── Column mapping ───────────────────────────────────────────────────────────

const TXT_COLUMN_MAP: Record<string, keyof AssetRecord> = {
  "toko":             "toko",
  "kategori":         "kategori_oracle",
  "no. seri":         "kode_asset",
  "keterangan":       "deskripsi",
  "status":           "status",
  "kuantitas":        "kuantitas",
  "biaya perolehan":  "biaya_perolehan",
  "jumlah tercatat":  "jumlah_tercatat",
}

const FINANCIAL_FIELDS = new Set<keyof AssetRecord>(["kuantitas", "biaya_perolehan", "jumlah_tercatat"])
const REQUIRED_HEADERS = ["toko", "kategori", "no. seri", "keterangan"]

// ─── Public API ───────────────────────────────────────────────────────────────

export async function parseTxtFile(file: File): Promise<ParseResult> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext !== "txt") {
    throw new Error(
      `Format file tidak didukung: ".${ext}". Harap upload file .txt hasil export Oracle DAT.`
    );
  }

  const text  = await file.text();
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");

  if (lines.length < 2) {
    throw new Error("File tidak memiliki data. Pastikan file DAT tidak kosong.");
  }

  // ── Auto-detect delimiter ─────────────────────────────────────────────────
  const delimiter = detectDelimiter(lines[0]);

  // ── Parse header ──────────────────────────────────────────────────────────
  const rawHeaders = lines[0].split(delimiter);
  const headers    = rawHeaders.map(normalizeHeader);

  // ── Validasi kolom wajib ──────────────────────────────────────────────────
  const missing = REQUIRED_HEADERS.filter((req) => !headers.includes(req));
  if (missing.length > 0) {
    throw new Error(
      `Kolom wajib tidak ditemukan: ${missing.map((c) => `"${c}"`).join(", ")}. ` +
      `Pastikan file adalah export DAT Oracle yang valid.`
    );
  }

  // ── Build column index map ────────────────────────────────────────────────
  const colIndex = new Map<string, number>();
  headers.forEach((h, i) => colIndex.set(h, i));

  // ── Parse data rows ───────────────────────────────────────────────────────
  const records: AssetRecord[] = [];
  let skippedRows = 0;
  const warnings: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(delimiter);

    if (cells.length < 5) {
      skippedRows++;
      continue;
    }

    const record: AssetRecord = {
      toko:            "",
      kategori_oracle: "",
      kode_asset:      "",
      deskripsi:       "",
      status:          DEFAULT_STATUS,
      kuantitas:       1,
      biaya_perolehan: 0,
      jumlah_tercatat: 0,
    };

    for (const [headerName, fieldName] of Object.entries(TXT_COLUMN_MAP)) {
      const idx = colIndex.get(headerName);
      if (idx === undefined) continue;

      const rawValue = cells[idx] ?? "";

      if (FINANCIAL_FIELDS.has(fieldName)) {
        (record as any)[fieldName] = cellToNumber(rawValue);
      } else {
        (record as any)[fieldName] = cellToString(rawValue);
      }
    }

    if (!record.kuantitas || record.kuantitas === 0) record.kuantitas = 1;

    if (!record.kode_asset && !record.deskripsi) {
      skippedRows++;
      continue;
    }

    if (!record.kode_asset) {
      warnings.push(`Baris ${i + 1}: "No. Seri" kosong — baris tetap diproses.`);
    }

    records.push(record);
  }

  if (records.length === 0) {
    throw new Error("Tidak ada baris data yang valid setelah parsing.");
  }

  return { records, skippedRows, warnings };
}
