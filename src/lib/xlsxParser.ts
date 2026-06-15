/**
 * xlsxParser.ts
 * Reads an Excel DAT Oracle file, validates required columns,
 * and maps raw rows to AssetRecord objects including financial columns.
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

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

/**
 * Parse angka dari format Indonesia (6.190.000) atau format biasa (6190000).
 * Return 0 kalau tidak bisa diparse.
 */
function cellToNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;

  if (typeof value === "number") {
    // Excel menyimpan nilai seperti 874.167 sebagai float
    // Kalau angkanya kecil (< 10.000) kemungkinan itu ribuan → kalikan 1000
    // Kalau sudah besar (>= 10.000) berarti sudah dalam satuan penuh
    if (value < 10000 && value !== Math.floor(value)) {
      return Math.round(value * 1000)
    }
    return Math.round(value)
  }

  const str = String(value).trim();
  if (!str || str === "-" || str === " - ") return 0;

  // Format Indonesia: titik sebagai pemisah ribuan (6.190.000)
  // Hapus titik, ganti koma desimal jadi titik
  const cleaned = str.replace(/\./g, "").replace(/,/g, ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num);
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, " ");
}

function validateColumns(headers: string[]): { valid: boolean; missing: string[] } {
  const normalizedHeaders = headers.map(normalizeHeader);
  const missing = REQUIRED_COLUMNS.filter(
    (col) => !normalizedHeaders.includes(normalizeHeader(col))
  );
  return { valid: missing.length === 0, missing };
}

function isRowMeaningful(row: RawExcelRow): boolean {
  return REQUIRED_COLUMNS.some((col) => cellToString(row[col]) !== "");
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function parseExcelFile(file: File): Promise<ParseResult> {
  // 1. Extension guard
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext !== "xlsx" && ext !== "xls") {
    throw new Error(
      `Format file tidak didukung: ".${ext}". Harap upload file .xlsx atau .xls.`
    );
  }

  // 2. Read ArrayBuffer
  const buffer = await file.arrayBuffer();

  // 3. Parse workbook
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "array", cellText: false, cellDates: true });
  } catch {
    throw new Error("File tidak dapat dibaca. Pastikan file tidak rusak atau terenkripsi.");
  }

  // 4. Use first sheet
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("Workbook tidak memiliki sheet. File mungkin kosong.");
  }
  const sheet = workbook.Sheets[sheetName];

  // 5. Convert to JSON — raw: false agar angka tetap sebagai string dulu
  //    untuk kita handle sendiri (format Indonesia pakai titik sebagai ribuan)
  const rawRowsOriginal = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: true, // raw: true agar dapat nilai number asli dari Excel
  });

  const rawRows: RawExcelRow[] = rawRowsOriginal.map((row) => {
    const normalizedRow: RawExcelRow = {};
    for (const [key, value] of Object.entries(row)) {
      normalizedRow[normalizeHeader(key)] = value;
    }
    return normalizedRow;
  });

  if (rawRows.length === 0) {
    throw new Error(`Sheet "${sheetName}" tidak memiliki data.`);
  }

  // 6. Validate required columns
  const headers = Object.keys(rawRows[0]);
  const { valid, missing } = validateColumns(headers);
  if (!valid) {
    throw new Error(
      `Kolom wajib tidak ditemukan: ${missing.map((c) => `"${c}"`).join(", ")}. ` +
      `Periksa kembali format file DAT Anda.`
    );
  }

  // 7. Map rows → AssetRecord
  const records: AssetRecord[] = [];
  let skippedRows = 0;
  const warnings: string[] = [];

  // Kolom finansial — nama di Excel bisa ada spasi di sekitarnya
  const FINANCIAL_FIELDS = new Set(["kuantitas", "biaya_perolehan", "jumlah_tercatat"]);

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
      kuantitas: 1,
      biaya_perolehan: 0,
      jumlah_tercatat: 0,
      invoice_number: "",
      tanggal_dokumen: "",
    };

    for (const [excelCol, apiField] of Object.entries(COLUMN_MAP)) {
      // Cari kolom dengan flexible matching (trim spasi)
      const matchedKey = Object.keys(row).find(
        (k) => normalizeHeader(k) === normalizeHeader(excelCol)
      );
      const rawValue = matchedKey ? row[matchedKey] : "";

      if (FINANCIAL_FIELDS.has(apiField as string)) {
        (record as any)[apiField] = cellToNumber(rawValue);
      } else {
        (record as any)[apiField] = cellToString(rawValue);
      }
    }

    // Default kuantitas ke 1 kalau 0 atau tidak ada
    if (!record.kuantitas || record.kuantitas === 0) record.kuantitas = 1;

    if (!record.kode_asset) {
      warnings.push(`Baris ${i + 2}: "No. Seri" kosong — baris tetap diproses.`);
    }

    records.push(record);
  }

  if (records.length === 0) {
    throw new Error("Tidak ada baris data yang valid setelah parsing.");
  }

  return { records, skippedRows, warnings };
}
