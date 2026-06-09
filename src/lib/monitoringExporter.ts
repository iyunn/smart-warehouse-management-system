import * as XLSX from "xlsx";
import type { MonitoringAsset } from "@/hooks/useMonitoring";

interface MonitoringExportOptions {
  assets: MonitoringAsset[];
  searchField: string;
  tags: string[];
  costCenter: string;
  filename?: string;
}

function formatRupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

function slugify(s: string): string {
  return s.trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-_]/g, "");
}

export function buildMonitoringFilename(
  searchField: string,
  tags: string[],
  costCenter: string,
): string {
  const ccSlug = costCenter === "ALL" ? "Semua-CGA" : costCenter;

  if (tags.length > 0) {
    const tagSlug = tags.map(t => slugify(t)).join("-");
    const fieldMap: Record<string, string> = {
      all: "Semua", jenis: "Jenis", merk: "Merk",
      kode_asset: "Kode-Aset", toko: "Cost-Center",
      kategori_oracle: "Kategori",
    };
    const fieldLabel = fieldMap[searchField] ?? searchField;
    return `Monitoring-DAT-${ccSlug}-sort-by-${fieldLabel}-${tagSlug}`;
  }
  return `Monitoring-DAT-${ccSlug}`;
}

export function exportMonitoringToExcel(opts: MonitoringExportOptions): void {
  const { assets, searchField, tags, costCenter } = opts;

  if (assets.length === 0) {
    alert("Tidak ada data untuk diekspor.");
    return;
  }

  const timestamp = new Date().toISOString().slice(0, 10);
  const filename  = opts.filename ?? buildMonitoringFilename(searchField, tags, costCenter);

  // ── SHEET 1: Summary per Jenis × Cost Center ──────────────────────────
  // Group: jenis → toko → aggregate
  type SummaryKey = string; // `${jenis}__${toko}`
  const summaryMap = new Map<SummaryKey, {
    jenis: string; toko: string;
    total_item: number; total_qty: number;
    total_perolehan: number; total_tercatat: number;
  }>();

  for (const a of assets) {
    const key: SummaryKey = `${a.jenis}__${a.toko}`;
    const existing = summaryMap.get(key);
    if (existing) {
      existing.total_item++;
      existing.total_qty      += a.kuantitas;
      existing.total_perolehan += a.biaya_perolehan;
      existing.total_tercatat  += a.jumlah_tercatat;
    } else {
      summaryMap.set(key, {
        jenis: a.jenis, toko: a.toko.match(/CGA\d/i)?.[0]?.toUpperCase() ?? a.toko,
        total_item: 1,
        total_qty:       a.kuantitas,
        total_perolehan: a.biaya_perolehan,
        total_tercatat:  a.jumlah_tercatat,
      });
    }
  }

  // Sort: jenis asc → toko asc
  const summaryRows = Array.from(summaryMap.values())
    .sort((a, b) => a.jenis.localeCompare(b.jenis) || a.toko.localeCompare(b.toko));

  // Subtotal per jenis
  const jenisGroup = new Map<string, typeof summaryRows[0][]>();
  for (const row of summaryRows) {
    if (!jenisGroup.has(row.jenis)) jenisGroup.set(row.jenis, []);
    jenisGroup.get(row.jenis)!.push(row);
  }

  const sheet1Rows: any[] = [];
  let grandItem = 0, grandQty = 0, grandPerolehan = 0, grandTercatat = 0;

  for (const [jenis, rows] of jenisGroup) {
    for (const r of rows) {
      sheet1Rows.push({
        "Jenis":              r.jenis,
        "Cost Center":        r.toko,
        "Total Item":         r.total_item,
        "Total Qty":          r.total_qty,
        "Biaya Perolehan":    formatRupiah(r.total_perolehan),
        "Jumlah Tercatat":    formatRupiah(r.total_tercatat),
      });
    }
    // Subtotal per jenis
    const subItem      = rows.reduce((s, r) => s + r.total_item, 0);
    const subQty       = rows.reduce((s, r) => s + r.total_qty, 0);
    const subPerolehan = rows.reduce((s, r) => s + r.total_perolehan, 0);
    const subTercatat  = rows.reduce((s, r) => s + r.total_tercatat, 0);

    sheet1Rows.push({
      "Jenis":           `SUBTOTAL — ${jenis}`,
      "Cost Center":     "",
      "Total Item":      subItem,
      "Total Qty":       subQty,
      "Biaya Perolehan": formatRupiah(subPerolehan),
      "Jumlah Tercatat": formatRupiah(subTercatat),
    });

    grandItem      += subItem;
    grandQty       += subQty;
    grandPerolehan += subPerolehan;
    grandTercatat  += subTercatat;
  }

  // Grand total
  sheet1Rows.push({
    "Jenis":           "GRAND TOTAL",
    "Cost Center":     "",
    "Total Item":      grandItem,
    "Total Qty":       grandQty,
    "Biaya Perolehan": formatRupiah(grandPerolehan),
    "Jumlah Tercatat": formatRupiah(grandTercatat),
  });

  // ── SHEET 2: Detail per aset ──────────────────────────────────────────
  const sheet2Rows = assets
    .sort((a, b) => a.jenis.localeCompare(b.jenis) || a.toko.localeCompare(b.toko))
    .map((a, idx) => ({
      "No":               idx + 1,
      "Jenis":            a.jenis,
      "Merk":             a.merk,
      "Cost Center":      a.toko,
      "Kategori Oracle":  a.kategori_oracle,
      "Kode Aset":        a.kode_asset,
      "Deskripsi":        a.deskripsi,
      "Qty":              a.kuantitas,
      "Biaya Perolehan":  formatRupiah(a.biaya_perolehan),
      "Jumlah Tercatat":  formatRupiah(a.jumlah_tercatat),
    }));

  // ── Build workbook ────────────────────────────────────────────────────
  const wb = XLSX.utils.book_new();

  const ws1 = XLSX.utils.json_to_sheet(sheet1Rows);
  ws1["!cols"] = [
    { wch: 25 }, // Jenis
    { wch: 14 }, // Cost Center
    { wch: 12 }, // Total Item
    { wch: 12 }, // Total Qty
    { wch: 22 }, // Biaya Perolehan
    { wch: 22 }, // Jumlah Tercatat
  ];
  XLSX.utils.book_append_sheet(wb, ws1, "Summary");

  const ws2 = XLSX.utils.json_to_sheet(sheet2Rows);
  ws2["!cols"] = [
    { wch: 5 },  // No
    { wch: 22 }, // Jenis
    { wch: 15 }, // Merk
    { wch: 12 }, // Cost Center
    { wch: 20 }, // Kategori Oracle
    { wch: 20 }, // Kode Aset
    { wch: 40 }, // Deskripsi
    { wch: 6  }, // Qty
    { wch: 22 }, // Biaya Perolehan
    { wch: 22 }, // Jumlah Tercatat
  ];
  XLSX.utils.book_append_sheet(wb, ws2, "Detail DAT");

  XLSX.writeFile(wb, `${filename}-${timestamp}.xlsx`);
}
