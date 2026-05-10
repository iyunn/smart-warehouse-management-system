/**
 * xlsxParser.ts
 * Reads an Excel file using the XLSX library, validates required columns,
 * and maps raw rows to AssetRecord objects.
 *
 * Runs synchronously inside a try/catch so the caller can handle all errors
 * in one place. For very large files (>50 MB) callers should offload to a
 * Web Worker, but for typical DAT files this is fast enough on the main thread.
 */

import * as XLSX from "xlsx";
import {
  type AssetRecord,
  type ParseResult,
  type RawExcelRow,
  COLUMN_MAP,
  DEFAULT_STATUS,
  REQUIRED_COLUMNS,
} from "./types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Normalise a cell value to a trimmed string; return "" for null/undefined. */
function cellToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

/** Return true when every required column is present (case-sensitive). */
function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function validateColumns(headers: string[]): {
  valid: boolean;
  missing: string[];
} {
  const normalizedHeaders = headers.map(normalizeHeader);

  const missing = REQUIRED_COLUMNS.filter(
    (col) => !normalizedHeaders.includes(normalizeHeader(col))
  );

  return {
    valid: missing.length === 0,
    missing,
  };
}

/** Return true when the row has at least one non-empty required field. */
function isRowMeaningful(row: RawExcelRow): boolean {
  return REQUIRED_COLUMNS.some((col) => cellToString(row[col]) !== "");
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Parses an .xlsx / .xls File object and returns validated AssetRecords.
 *
 * Throws a descriptive Error on any fatal problem (wrong extension, empty
 * sheet, missing required columns). Non-fatal issues (empty rows) are counted
 * and returned in `warnings`.
 */
export async function parseExcelFile(file: File): Promise<ParseResult> {
  // 1. Extension guard
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext !== "xlsx" && ext !== "xls") {
    throw new Error(
      `Format file tidak didukung: ".${ext}". Harap upload file .xlsx atau .xls.`
    );
  }

  // 2. Read ArrayBuffer — use a Promise so we don't block the event loop
  const buffer = await file.arrayBuffer();

  // 3. Parse workbook
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, {
      type: "array",
      cellText: false,
      cellDates: true,
    });
  } catch {
    throw new Error(
      "File tidak dapat dibaca. Pastikan file tidak rusak atau terenkripsi."
    );
  }

  // 4. Use the first sheet
  const sheetName = workbook.SheetNames[0];
  console.log("SHEETS:", workbook.SheetNames);
  if (!sheetName) {
    throw new Error("Workbook tidak memiliki sheet. File mungkin kosong.");
  }
  const sheet = workbook.Sheets[sheetName];

  // 5. Convert to row-array JSON — header row becomes keys
  const rawRowsOriginal = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
  defval: "",
  raw: false
  });

  const rawRows: RawExcelRow[] = rawRowsOriginal.map((row) => {
    const normalizedRow: RawExcelRow = {};

    for (const [key, value] of Object.entries(row)) {
      normalizedRow[normalizeHeader(key)] = value;
    }

    return normalizedRow;
  });

  if (rawRows.length === 0) {
    throw new Error(
      `Sheet "${sheetName}" tidak memiliki data. Pastikan baris pertama adalah header.`
    );
  }

  // 6. Validate required columns exist
  const headers = Object.keys(rawRows[0]);
  console.log("RAW FIRST ROW:", rawRows[0]);
  console.log("HEADERS:", headers);
  console.log("ALL ROWS SAMPLE:", rawRows.slice(0, 3));
  const { valid, missing } = validateColumns(headers);
  if (!valid) {
    throw new Error(
      `Kolom wajib tidak ditemukan: ${missing.map((c) => `"${c}"`).join(", ")}. ` +
        `Periksa kembali format file DAT Anda.`
    );
  }

  // 7. Map rows → AssetRecord, skip empty rows
  const records: AssetRecord[] = [];
  let skippedRows = 0;
  const warnings: string[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];

    if (!isRowMeaningful(row)) {
      skippedRows++;
      continue;
    }

    const record: AssetRecord = {
      toko: "",
      kategori_oracle: "",
      kode_asset: "",
      deskripsi: "",
      status: DEFAULT_STATUS,
    };

    for (const [excelCol, apiField] of Object.entries(COLUMN_MAP)) {
      record[apiField] = cellToString(row[excelCol]);
    }

    // Warn if kode_asset is empty (it's our primary identifier)
    if (!record.kode_asset) {
      warnings.push(`Baris ${i + 2}: "No. Seri" kosong — baris tetap diproses.`);
    }

    records.push(record);
  }

  if (records.length === 0) {
    throw new Error(
      "Tidak ada baris data yang valid setelah parsing. Semua baris mungkin kosong."
    );
  }

  return { records, skippedRows, warnings };
}