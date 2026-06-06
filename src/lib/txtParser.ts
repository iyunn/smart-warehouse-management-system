/**
 * txtParser.ts
 * Parses Oracle DAT export file (.txt) — tab-delimited format.
 * Lebih akurat dari Excel parser karena tidak ada konversi format angka.
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
 * Parse angka format Indonesia dari string DAT Oracle.
 * Format: ' 6.190.000 ' atau ' 5.693.333 ' atau ' - '
 * Titik = pemisah ribuan, bukan desimal.
 */
function cellToNumber(value: string): number {
  const str = value.trim();
  if (!str || str === "-" || str === " - ") return 0;
  // Hapus titik ribuan, parse sebagai integer
  const cleaned = str.replace(/\./g, "").replace(/,/g, ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num);
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, " ");
}

// ─── Column mapping: header di TXT → AssetRecord key ─────────────────────────

const TXT_COLUMN_MAP: Record<string, keyof AssetRecord> = {
  "toko":                  "toko",
  "kategori":              "kategori_oracle",
  "no. seri":              "kode_asset",
  "keterangan":            "deskripsi",
  "status":                "status",
  "kuantitas":             "kuantitas",
  "biaya perolehan":       "biaya_perolehan",
  "jumlah tercatat":       "jumlah_tercatat",
}

const FINANCIAL_FIELDS = new Set<keyof AssetRecord>(["kuantitas", "biaya_perolehan", "jumlah_tercatat"])
const REQUIRED_HEADERS = ["toko", "kategori", "no. seri", "keterangan"]

// ─── Public API ───────────────────────────────────────────────────────────────

export async function parseTxtFile(file: File): Promise<ParseResult> {
  // 1. Extension guard
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext !== "txt") {
    throw new Error(
      `Format file tidak didukung: ".${ext}". Harap upload file .txt hasil export Oracle DAT.`
    );
  }

  // 2. Read file as text
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");

  if (lines.length < 2) {
    throw new Error("File tidak memiliki data. Pastikan file DAT tidak kosong.");
  }

  // 3. Parse header baris pertama
  const rawHeaders = lines[0].split("\t");
  const headers = rawHeaders.map(normalizeHeader);

  // 4. Validasi kolom wajib
  const missing = REQUIRED_HEADERS.filter((req) => !headers.includes(req));
  if (missing.length > 0) {
    throw new Error(
      `Kolom wajib tidak ditemukan: ${missing.map((c) => `"${c}"`).join(", ")}. ` +
      `Pastikan file adalah export DAT Oracle yang valid.`
    );
  }

  // 5. Build index map: header name → column index
  const colIndex = new Map<string, number>();
  headers.forEach((h, i) => colIndex.set(h, i));

  // 6. Parse data rows
  const records: AssetRecord[] = [];
  let skippedRows = 0;
  const warnings: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split("\t");

    // Skip baris kosong atau tidak punya cukup kolom
    if (cells.length < 5) {
      skippedRows++;
      continue;
    }

    const record: AssetRecord = {
      toko:             "",
      kategori_oracle:  "",
      kode_asset:       "",
      deskripsi:        "",
      status:           DEFAULT_STATUS,
      kuantitas:        1,
      biaya_perolehan:  0,
      jumlah_tercatat:  0,
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

    // Default kuantitas ke 1 kalau 0
    if (!record.kuantitas || record.kuantitas === 0) record.kuantitas = 1;

    // Skip baris yang tidak punya kode_asset dan deskripsi
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
