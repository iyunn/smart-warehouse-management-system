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
 * Parse angka dari Oracle DAT export.
 * Format yang mungkin muncul:
 * - "2.383.000"       → 2383000     (titik = ribuan, integer)
 * - "10.164.583,33"   → 10164583    (titik = ribuan, koma = desimal)
 * - "10164583.33"     → 10164583    (titik = desimal, tidak ada ribuan)
 * - "2383000"         → 2383000     (plain integer)
 * - " - "             → 0
 */
function cellToNumber(value: string): number {
  const str = value.trim();
  if (!str || str === "-" || str === " - ") return 0;

  let cleaned: string;

  if (str.includes(",")) {
    // Format Indonesia: titik=ribuan, koma=desimal (e.g. "10.164.583,33")
    cleaned = str.replace(/\./g, "").replace(",", ".");
  } else {
    const dotParts = str.split(".");
    if (dotParts.length === 1) {
      // Tidak ada titik → plain integer
      cleaned = str;
    } else if (dotParts.length > 2) {
      // Lebih dari 1 titik → semua titik adalah ribuan (e.g. "2.383.000")
      cleaned = str.replace(/\./g, "");
    } else {
      // Tepat 1 titik: cek panjang bagian setelah titik
      const decimalPart = dotParts[dotParts.length - 1];
      if (decimalPart.length <= 2) {
        // e.g. "10164583.33" → titik adalah desimal, biarkan
        cleaned = str;
      } else {
        // e.g. "2.550" → titik adalah ribuan, hapus
        cleaned = str.replace(/\./g, "");
      }
    }
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num);
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, " ");
}

// ─── Tanggal Dokumen parser ────────────────────────────────────────────────
// Oracle export tidak konsisten: separator bisa "/" atau "-", urutan bisa
// DD/MM atau MM/DD tergantung setting komputer user saat input.
//
// Heuristic:
//   - Pisahkan dengan / atau -
//   - Cari bagian 4-digit = tahun (posisi awal ISO atau akhir)
//   - Dari 2 bagian sisanya: kalau salah satu > 12 → itu pasti HARI (DD)
//   - Kalau dua-duanya <= 12 → ambigu → default DD/MM (standar Indonesia)
//   - Output: "DD-Mmm-YYYY" (e.g. "25-Mar-2026")
//   - Kalau gagal total → kembalikan raw value apa adanya (jangan buang data)
const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

function parseTanggalDokumen(raw: string): string {
  const str = (raw ?? "").trim();
  if (!str || str === "-" || str === " - ") return "";

  // Split dengan / atau -
  const parts = str.split(/[/\-]/).map((p) => p.trim()).filter(Boolean);
  if (parts.length !== 3) return str; // format tak dikenal → raw

  const nums = parts.map((p) => parseInt(p, 10));
  if (nums.some((n) => isNaN(n))) return str; // ada non-angka → raw

  let year: number, a: number, b: number;

  // Deteksi posisi tahun (4 digit)
  if (parts[0].length === 4) {
    // ISO: YYYY-MM-DD
    year = nums[0];
    a = nums[1]; // bulan
    b = nums[2]; // hari
    // ISO selalu MM-DD, jadi langsung
    return formatTanggal(b, a, year, str);
  } else if (parts[2].length === 4) {
    // DD/MM/YYYY atau MM/DD/YYYY
    year = nums[2];
    a = nums[0];
    b = nums[1];
  } else {
    // Tahun 2 digit atau format aneh → coba asumsi posisi terakhir = tahun
    year = nums[2] < 100 ? 2000 + nums[2] : nums[2];
    a = nums[0];
    b = nums[1];
  }

  // Heuristic DD vs MM untuk bagian a & b
  let day: number, month: number;
  if (a > 12 && b <= 12) {
    day = a; month = b;          // a pasti hari
  } else if (b > 12 && a <= 12) {
    day = b; month = a;          // b pasti hari
  } else {
    // Ambigu (dua-duanya <=12) → default DD/MM (standar Indonesia)
    day = a; month = b;
  }

  return formatTanggal(day, month, year, str);
}

function formatTanggal(day: number, month: number, year: number, raw: string): string {
  if (month < 1 || month > 12 || day < 1 || day > 31) return raw; // invalid → raw
  const dd = String(day).padStart(2, "0");
  const mmm = MONTH_ABBR[month - 1];
  return `${dd}-${mmm}-${year}`;
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
  "sub coce":         "sub_coce",
  "kategori":         "kategori_oracle",
  "no. seri":         "kode_asset",
  "keterangan":       "deskripsi",
  "status":           "status",
  "kuantitas":        "kuantitas",
  "biaya perolehan":  "biaya_perolehan",
  "jumlah tercatat":  "jumlah_tercatat",
  "invoice number":   "invoice_number",
  "tanggal dokumen":  "tanggal_dokumen",
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
      invoice_number:  "",
      tanggal_dokumen: "",
      sub_coce:        "0",
      is_prodsus:      false,
    };

    for (const [headerName, fieldName] of Object.entries(TXT_COLUMN_MAP)) {
      const idx = colIndex.get(headerName);
      if (idx === undefined) continue;

      const rawValue = cells[idx] ?? "";

      if (FINANCIAL_FIELDS.has(fieldName)) {
        (record as any)[fieldName] = cellToNumber(rawValue);
      } else if (fieldName === "tanggal_dokumen") {
        (record as any)[fieldName] = parseTanggalDokumen(rawValue);
      } else {
        (record as any)[fieldName] = cellToString(rawValue);
      }
    }

    if (!record.kuantitas || record.kuantitas === 0) record.kuantitas = 1;

    // Derive is_prodsus. Non-prodsus kalau sub_coce kosong ATAU semua nol
    // (Oracle pakai "0", "00000000", dst untuk non-prodsus). Selain itu = prodsus
    // (mis. FRDCHICKEN, SAYB, PCAFE, YCGOLD).
    const scRaw = (record.sub_coce ?? "").trim();
    const isZero = scRaw === "" || /^0+$/.test(scRaw);
    record.sub_coce   = scRaw || "0";
    record.is_prodsus = !isZero;

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
