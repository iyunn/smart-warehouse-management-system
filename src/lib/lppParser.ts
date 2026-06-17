/**
 * lppParser.ts
 * Parses LPP files exported from Web Tracking. These files have a .xls
 * extension but are actually plain HTML (a <table> fragment) — common for
 * legacy web-based reporting systems. We parse them via DOMParser, NOT via
 * a binary Excel library like SheetJS.
 *
 * Expected columns (fixed order, by index — header names are inconsistent
 * in spacing/underscore so we don't match by name):
 *   0: Nomor        (row number, ignored)
 *   1: No Aktiva    → kode_asset
 *   2: Deskripsi    → deskripsi
 *   3: Saldo Awal   → saldo_awal
 *   4: Masuk        → masuk
 *   5: Keluar       → keluar
 *   6: Saldo_Akhir  → saldo_akhir
 *
 * Each file represents ONE cost center (CGA1/CGA2/CGA3) — the CGA is
 * auto-detected from the filename (must contain "CGA1"/"CGA2"/"CGA3",
 * case-insensitive).
 */

export interface LPPRecord {
  kode_asset: string;
  toko: string;          // CGA1 / CGA2 / CGA3
  deskripsi: string;
  saldo_awal: number;
  masuk: number;
  keluar: number;
  saldo_akhir: number;
}

export interface LPPFileSummary {
  filename: string;
  cga: string;
  rowCount: number;
  skippedRows: number;
}

export interface LPPMultiParseResult {
  records: LPPRecord[];
  fileSummaries: LPPFileSummary[];
  warnings: string[];
}

const CGA_PATTERN = /CGA\s*([123])/i;

/** Detect CGA1/CGA2/CGA3 from filename. Returns null if not found. */
export function detectCGAFromFilename(filename: string): string | null {
  const match = filename.match(CGA_PATTERN);
  return match ? `CGA${match[1]}` : null;
}

function cellToNumber(value: string): number {
  const cleaned = value.trim().replace(/\./g, "").replace(/,/g, "");
  if (!cleaned || cleaned === "-") return 0;
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
}

/**
 * Parse a single LPP file (HTML-table-as-.xls) into LPPRecord[].
 * Throws if the CGA can't be detected from the filename, or if no valid
 * rows are found.
 */
export async function parseLPPFile(file: File): Promise<{
  records: LPPRecord[];
  cga: string;
  skippedRows: number;
}> {
  const cga = detectCGAFromFilename(file.name);
  if (!cga) {
    throw new Error(
      `Tidak bisa mendeteksi CGA dari nama file "${file.name}". ` +
      `Pastikan nama file mengandung "CGA1", "CGA2", atau "CGA3".`
    );
  }

  const text = await file.text();

  let doc: Document;
  try {
    const parser = new DOMParser();
    doc = parser.parseFromString(text, "text/html");
  } catch {
    throw new Error(`File "${file.name}" tidak dapat dibaca sebagai HTML/table.`);
  }

  const allRows = Array.from(doc.querySelectorAll("tr"));
  if (allRows.length === 0) {
    throw new Error(`File "${file.name}" tidak memiliki baris tabel sama sekali.`);
  }

  // Data rows have <td> cells; the header row only has <th>.
  const dataRows = allRows.filter((r) => r.querySelector("td"));
  if (dataRows.length === 0) {
    throw new Error(`File "${file.name}" tidak memiliki baris data (hanya header).`);
  }

  const records: LPPRecord[] = [];
  let skippedRows = 0;

  for (const row of dataRows) {
    const cells = Array.from(row.querySelectorAll("td")).map(
      (c) => (c.textContent ?? "").trim()
    );

    if (cells.length < 7) {
      skippedRows++;
      continue;
    }

    const kode_asset = cells[1];
    if (!kode_asset) {
      skippedRows++;
      continue;
    }

    records.push({
      kode_asset,
      toko: cga,
      deskripsi: cells[2] ?? "",
      saldo_awal: cellToNumber(cells[3]),
      masuk: cellToNumber(cells[4]),
      keluar: cellToNumber(cells[5]),
      saldo_akhir: cellToNumber(cells[6]),
    });
  }

  if (records.length === 0) {
    throw new Error(`Tidak ada baris data valid di file "${file.name}".`);
  }

  return { records, cga, skippedRows };
}

/**
 * Parse multiple LPP files (one per CGA) into a single combined record set.
 * Validates that each file maps to a distinct CGA (no duplicate CGA across
 * files — e.g. user accidentally drags 2 files for CGA1).
 */
export async function parseLPPFiles(files: File[]): Promise<LPPMultiParseResult> {
  if (files.length === 0) {
    throw new Error("Tidak ada file yang dipilih.");
  }

  const records: LPPRecord[] = [];
  const fileSummaries: LPPFileSummary[] = [];
  const warnings: string[] = [];
  const seenCGA = new Map<string, string>(); // cga -> filename (untuk deteksi duplikat)

  for (const file of files) {
    const result = await parseLPPFile(file);

    if (seenCGA.has(result.cga)) {
      throw new Error(
        `Duplikat CGA terdeteksi: "${file.name}" dan "${seenCGA.get(result.cga)}" ` +
        `keduanya terdeteksi sebagai ${result.cga}. Pastikan tiap file untuk CGA yang berbeda.`
      );
    }
    seenCGA.set(result.cga, file.name);

    records.push(...result.records);
    fileSummaries.push({
      filename: file.name,
      cga: result.cga,
      rowCount: result.records.length,
      skippedRows: result.skippedRows,
    });

    if (result.skippedRows > 0) {
      warnings.push(`${file.name}: ${result.skippedRows} baris dilewati (data tidak lengkap)`);
    }
  }

  return { records, fileSummaries, warnings };
}
