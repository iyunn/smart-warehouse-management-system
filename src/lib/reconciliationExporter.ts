import * as XLSX from "xlsx";
import type { ReconciliationItem } from "@/hooks/useReconciliation";

// Label per kondisi — konsisten dengan KONDISI_CONFIG di reconciliation page
const KONDISI_LABEL: Record<number, string> = {
  1: "Fisik di CGA",
  2: "Belum Mutasi Oracle",
  4: "Belum Mutasi WT",
  5: "Fisik Allocated",
  6: "Mismatch CGA",
};

export interface ReconciliationExportOptions {
  items: ReconciliationItem[];     // data setelah filter (sesuai tampilan layar)
  allItems: ReconciliationItem[];  // semua data tanpa filter (untuk sheet ringkasan)
  activeKondisi: number | "ALL";
  cga: string;
  filename?: string;
}

export function exportReconciliationToExcel(opts: ReconciliationExportOptions): void {
  const { items, allItems, activeKondisi, cga } = opts;

  if (allItems.length === 0) {
    alert("Tidak ada data reconciliation untuk diekspor.");
    return;
  }

  const timestamp = new Date().toISOString().slice(0, 10);
  const filterLabel = [
    activeKondisi !== "ALL" ? `Kondisi-${activeKondisi}` : null,
    cga !== "ALL" ? cga : null,
  ].filter(Boolean).join("-") || "Semua";
  const filename = opts.filename ?? `Reconciliation-DAT-vs-LPP-${filterLabel}-${timestamp}`;

  const wb = XLSX.utils.book_new();

  // ── SHEET 1: Ringkasan per Kondisi ────────────────────────────────────────
  // Hitung count dan persentase tiap kondisi dari SEMUA data (bukan filtered)
  const summaryData: any[][] = [
    ["Rekonsiliasi DAT vs LPP Web Tracking", "", "", ""],
    ["Tanggal Export:", timestamp, "", ""],
    ["Total Kode Aset Universe:", allItems.length, "", ""],
    [""],
    ["Kondisi", "Label", "Jumlah", "Persentase"],
  ];

  const kondisiList = [1, 2, 4, 5, 6] as const;
  for (const k of kondisiList) {
    const count = allItems.filter(it => it.kondisi === k).length;
    const pct   = allItems.length > 0 ? ((count / allItems.length) * 100).toFixed(1) + "%" : "0%";
    summaryData.push([`Kondisi ${k}`, KONDISI_LABEL[k], count, pct]);
  }

  summaryData.push([""]);
  summaryData.push(["Breakdown per CGA", "", "", ""]);
  summaryData.push(["CGA", "Total DAT", "Total LPP", "Selisih (K2+K4+K6)"]);
  for (const code of ["CGA1", "CGA2", "CGA3"]) {
    const cgaItems  = allItems.filter(it => it.toko === code || it.tokoLPP === code);
    const totalDAT  = allItems.filter(it => it.toko === code && (it.kondisi === 1 || it.kondisi === 2 || it.kondisi === 6)).length;
    const totalLPP  = allItems.filter(it => (it.toko === code || it.tokoLPP === code) && (it.kondisi === 1 || it.kondisi === 4)).length;
    const selisih   = cgaItems.filter(it => it.kondisi === 2 || it.kondisi === 4 || it.kondisi === 6).length;
    summaryData.push([code, totalDAT, totalLPP, selisih]);
  }

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary["!cols"] = [{ wch: 12 }, { wch: 24 }, { wch: 12 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan");

  // ── SHEET 2: Detail — data sesuai filter layar ──────────────────────────
  const headers = ["No", "Kode Aset", "Deskripsi", "CGA (DAT)", "CGA (LPP)", "Kondisi", "Status"];
  const detailRows: any[][] = items.map((it, idx) => [
    idx + 1,
    it.kode_asset,
    it.deskripsi || "—",
    it.toko !== "-" ? it.toko : "—",
    it.tokoLPP ?? "—",
    `Kondisi ${it.kondisi}`,
    KONDISI_LABEL[it.kondisi] ?? "—",
  ]);

  const filterInfo: any[][] = [
    ["Filter aktif:", activeKondisi === "ALL" ? "Semua Kondisi" : `Kondisi ${activeKondisi} — ${KONDISI_LABEL[activeKondisi as number]}`],
    ["Cost Center:", cga],
    ["Total baris:", items.length],
    [""],
  ];

  const wsDetail = XLSX.utils.aoa_to_sheet([...filterInfo, headers, ...detailRows]);
  wsDetail["!cols"] = [
    { wch: 5 }, { wch: 16 }, { wch: 40 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(wb, wsDetail, "Detail");

  // ── SHEET 3: Warning — hanya Kondisi 2, 4, 6 (butuh tindakan) ──────────
  const warningItems = allItems.filter(it => it.kondisi === 2 || it.kondisi === 4 || it.kondisi === 6);
  const warningHeaders = ["No", "Kode Aset", "Deskripsi", "CGA (DAT)", "CGA (LPP)", "Kondisi", "Aksi Diperlukan"];
  const AKSI: Record<number, string> = {
    2: "Segera mutasi Oracle",
    4: "Segera buat SJ WT",
    6: "Investigasi — CGA tidak sinkron antara DAT dan LPP",
  };

  const warningRows: any[][] = warningItems.map((it, idx) => [
    idx + 1,
    it.kode_asset,
    it.deskripsi || "—",
    it.toko !== "-" ? it.toko : "—",
    it.tokoLPP ?? "—",
    `Kondisi ${it.kondisi}`,
    AKSI[it.kondisi] ?? "—",
  ]);

  const wsWarning = XLSX.utils.aoa_to_sheet([
    ["Item yang membutuhkan tindakan (Kondisi 2, 4, 6):", "", "", "", "", "", ""],
    ["Total:", warningItems.length, "", "", "", "", ""],
    [""],
    warningHeaders,
    ...warningRows,
  ]);
  wsWarning["!cols"] = [
    { wch: 5 }, { wch: 16 }, { wch: 40 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 40 },
  ];
  XLSX.utils.book_append_sheet(wb, wsWarning, "Perlu Tindakan");

  XLSX.writeFile(wb, `${filename}.xlsx`);
}
