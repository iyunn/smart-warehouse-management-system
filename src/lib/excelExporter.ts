import * as XLSX from "xlsx";
import type { SJReportItem } from "@/hooks/useSJReport";

interface ExportOptions {
  items: SJReportItem[];
  filename?: string;
  periodLabel?: string;
}

/**
 * Export items ke Excel single-sheet flat format.
 * 1 row = 1 item barang. Mudah di-pivot/sort/filter di Excel.
 */
export function exportSJReportToExcel({
  items,
  filename = "Laporan-Surat-Jalan",
  periodLabel = "",
}: ExportOptions): void {
  if (items.length === 0) {
    alert("Tidak ada data untuk diekspor");
    return;
  }

  // ── Format rows untuk Excel ───────────────────────────────────────────────
  const rows = items.map((it, idx) => ({
    "No":            idx + 1,
    "Tanggal":       formatDateForExcel(it.tanggal),
    "No. SJ":        it.no_sj,
    "Kode Tujuan":   it.tujuan_kode,
    "Nama Tujuan":   it.tujuan_nama,
    "Pembawa":       it.pembawa,
    "Penerima":      it.penerima,
    "Kode Aset":     it.kode_asset || "—",
    "Mutasi Oracle": it.mutasi_oracle ? "Ya" : "Tidak",
    "Mutasi WT":     it.mutasi_wt ? "Ya" : "Tidak",
    "Jenis":         it.jenis,
    "Merk":          it.merk,
    "Serial Number": it.serial_number,
    "Qty":           it.qty,
    "Satuan":        it.satuan,
    "Baru":          it.is_baru ? "Ya" : "Tidak",
    "AT (Aktiva)":   it.is_aktiva ? "Ya" : "Tidak",
    "Keterangan":    it.keterangan,
    "Status SJ":     formatStatus(it.status),
    "Disetujui":     it.approved_by,
  }));

  // ── Build worksheet ───────────────────────────────────────────────────────
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths agar readable
  const colWidths = [
    { wch: 5 },   // No
    { wch: 12 },  // Tanggal
    { wch: 28 },  // No. SJ
    { wch: 12 },  // Kode Tujuan
    { wch: 25 },  // Nama Tujuan
    { wch: 18 },  // Pembawa
    { wch: 28 },  // Penerima
    { wch: 20 },  // Kode Aset
    { wch: 12 },  // Mutasi Oracle
    { wch: 10 },  // Mutasi WT
    { wch: 20 },  // Jenis
    { wch: 15 },  // Merk
    { wch: 18 },  // Serial Number
    { wch: 6 },   // Qty
    { wch: 10 },  // Satuan
    { wch: 8 },   // Baru
    { wch: 10 },  // AT
    { wch: 30 },  // Keterangan
    { wch: 12 },  // Status
    { wch: 15 },  // Disetujui
  ];
  worksheet["!cols"] = colWidths;

  // ── Build workbook ────────────────────────────────────────────────────────
  const workbook = XLSX.utils.book_new();
  const sheetName = periodLabel
    ? `SJ-${truncateForSheetName(periodLabel)}`
    : "Laporan SJ";
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // ── Generate filename dengan timestamp ───────────────────────────────────
  const timestamp = new Date().toISOString().slice(0, 10);
  const cleanFilename = filename.replace(/[^a-zA-Z0-9-_]/g, "-");
  const finalFilename = `${cleanFilename}-${timestamp}.xlsx`;

  // ── Trigger download ──────────────────────────────────────────────────────
  XLSX.writeFile(workbook, finalFilename);
}

function formatDateForExcel(iso: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatStatus(s: string): string {
  const map: Record<string, string> = {
    draft: "Draft",
    submitted: "Submitted",
    completed: "Completed",
  };
  return map[s] ?? s;
}

function truncateForSheetName(s: string, maxLen = 25): string {
  // Excel sheet name max 31 chars dan no special chars : \ / ? * [ ]
  const cleaned = s.replace(/[:\\/?*\[\]]/g, "-");
  return cleaned.length > maxLen ? cleaned.slice(0, maxLen) : cleaned;
}
