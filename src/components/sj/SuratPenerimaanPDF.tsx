"use client";

/**
 * SuratPenerimaanPDF.tsx
 * PDF dokumen "SURAT PENERIMAAN BARANG" untuk SJ jenis 'masuk'.
 * Dicetak saat CGA/GA menerima barang kembali dari toko.
 *
 * Reuse SJDataForPDF dari SuratJalanPDF.tsx dengan re-interpretasi:
 *   tujuan_kode/nama = asal toko (bukan tujuan pengiriman)
 *   pembawa          = pengirim dari toko (bukan pembawa barang keluar)
 *   penerima         = penerima di CGA ("Admin GA")
 */

import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import type { SJDataForPDF, SJItemForPDF } from "./SuratJalanPDF";

export type { SJDataForPDF };

function formatTanggalLong(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric", month: "long", year: "numeric",
    });
  } catch { return iso; }
}

const ITEMS_PER_PAGE = 15;
function chunkItems<T>(items: T[], size: number): T[][] {
  if (items.length === 0) return [[]];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

const COLORS = {
  primary:  "#10B981",  // emerald-500 (beda dari SJ keluar yang cyan)
  dark:     "#0F172A",
  text:     "#1E293B",
  muted:    "#64748B",
  light:    "#F1F5F9",
  lightBg:  "#F0FDF4",  // emerald-50
  border:   "#E2E8F0",
  accent:   "#ECFDF5",  // emerald-50 untuk header tabel
  white:    "#FFFFFF",
};

const styles = StyleSheet.create({
  page: { flexDirection: "column", backgroundColor: COLORS.white, padding: 36, fontSize: 9, color: COLORS.text, fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  headerLeft: { flex: 1 },
  companyName: { fontSize: 13, fontFamily: "Helvetica-Bold", color: COLORS.dark, letterSpacing: 0.5 },
  companyDiv:  { fontSize: 9, color: COLORS.muted, marginTop: 2 },
  docTitle:    { fontSize: 18, fontFamily: "Helvetica-Bold", color: COLORS.primary, letterSpacing: 1, textAlign: "right" },
  docSubtitle: { fontSize: 8, color: COLORS.muted, textAlign: "right", marginTop: 2 },
  noDoc:       { fontSize: 10, fontFamily: "Helvetica-Bold", color: COLORS.dark, textAlign: "right", marginTop: 4 },
  infoSection: { flexDirection: "row", gap: 12, marginBottom: 16 },
  infoBox:     { flex: 1, backgroundColor: COLORS.lightBg, borderRadius: 4, padding: 10, borderWidth: 1, borderColor: COLORS.border },
  infoLabel:   { fontSize: 7, color: COLORS.muted, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  infoValue:   { fontSize: 9, color: COLORS.text },
  tableHeader: { flexDirection: "row", backgroundColor: COLORS.accent, borderTopLeftRadius: 4, borderTopRightRadius: 4, paddingVertical: 6, paddingHorizontal: 8, borderWidth: 1, borderColor: COLORS.border },
  tableHeaderText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: COLORS.primary },
  tableRow:    { flexDirection: "row", paddingVertical: 5, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: COLORS.light, borderLeftWidth: 1, borderRightWidth: 1, borderColor: COLORS.border },
  tableRowAlt: { backgroundColor: COLORS.lightBg },
  colNo:       { width: 24 },
  colJenis:    { flex: 1.2 },
  colMerk:     { flex: 1 },
  colSN:       { flex: 1.5 },
  colQty:      { width: 30, textAlign: "center" },
  colSatuan:   { width: 32, textAlign: "center" },
  colKet:      { flex: 2 },
  colKode:     { flex: 1.3 },
  cell:        { fontSize: 8, color: COLORS.text },
  cellMuted:   { fontSize: 8, color: COLORS.muted },
  footer:      { marginTop: 24, flexDirection: "row", justifyContent: "space-between" },
  signBox:     { width: 140, alignItems: "center" },
  signLabel:   { fontSize: 8, color: COLORS.muted, textAlign: "center" },
  signName:    { marginTop: 40, borderTopWidth: 1, borderTopColor: COLORS.dark, paddingTop: 4, width: 120, textAlign: "center", fontSize: 8, fontFamily: "Helvetica-Bold", color: COLORS.dark },
  pageNum:     { position: "absolute", bottom: 20, right: 36, fontSize: 8, color: COLORS.muted },
  receivedBox: { marginTop: 16, padding: 10, borderWidth: 1, borderColor: COLORS.primary, borderRadius: 4, backgroundColor: COLORS.accent },
  receivedText:{ fontSize: 8, color: COLORS.primary, fontFamily: "Helvetica-Bold" },
});

interface PageContentProps {
  data: SJDataForPDF;
  pageItems: SJItemForPDF[];
  pageNum: number;
  totalPages: number;
  isLastPage: boolean;
}

function SPBPage({ data, pageItems, pageNum, totalPages, isLastPage }: PageContentProps) {
  return (
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.companyName}>PT. Indomarco Prismatama</Text>
          <Text style={styles.companyDiv}>General Affairs — G801 DC Semarang</Text>
        </View>
        <View>
          <Text style={styles.docTitle}>SURAT PENERIMAAN BARANG</Text>
          <Text style={styles.docSubtitle}>Bukti penerimaan barang kembali ke CGA/GA</Text>
          <Text style={styles.noDoc}>{data.no_sj}</Text>
        </View>
      </View>

      {/* Info boxes */}
      <View style={styles.infoSection}>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Tanggal Penerimaan</Text>
          <Text style={styles.infoValue}>{formatTanggalLong(data.tanggal)}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Asal Toko</Text>
          <Text style={styles.infoValue}>{data.tujuan_kode} — {data.tujuan_nama}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Pengirim (dari Toko)</Text>
          <Text style={styles.infoValue}>{data.pembawa || "—"}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Diterima Oleh</Text>
          <Text style={styles.infoValue}>{data.penerima || "Admin GA"}</Text>
        </View>
      </View>

      {/* Tabel */}
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, styles.colNo]}>No</Text>
        <Text style={[styles.tableHeaderText, styles.colKode]}>Kode Aset</Text>
        <Text style={[styles.tableHeaderText, styles.colJenis]}>Jenis</Text>
        <Text style={[styles.tableHeaderText, styles.colMerk]}>Merk</Text>
        <Text style={[styles.tableHeaderText, styles.colSN]}>Serial Number</Text>
        <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
        <Text style={[styles.tableHeaderText, styles.colSatuan]}>Sat.</Text>
        <Text style={[styles.tableHeaderText, styles.colKet]}>Keterangan</Text>
      </View>

      {pageItems.map((item, idx) => (
        <View key={idx} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}>
          <Text style={[styles.cell, styles.colNo]}>{item.urutan}</Text>
          <Text style={[item.kode_asset ? styles.cell : styles.cellMuted, styles.colKode]}>
            {item.kode_asset || "—"}
          </Text>
          <Text style={[styles.cell, styles.colJenis]}>{item.jenis}</Text>
          <Text style={[styles.cell, styles.colMerk]}>{item.merk || "—"}</Text>
          <Text style={[styles.cell, styles.colSN]}>{item.serial_number || "—"}</Text>
          <Text style={[styles.cell, styles.colQty]}>{item.qty}</Text>
          <Text style={[styles.cell, styles.colSatuan]}>{item.satuan}</Text>
          <Text style={[styles.cell, styles.colKet]}>{item.keterangan || "—"}</Text>
        </View>
      ))}

      {/* Footer — hanya di halaman terakhir */}
      {isLastPage && (
        <>
          <View style={styles.receivedBox}>
            <Text style={styles.receivedText}>✓ Barang di atas telah diterima oleh pihak kami.</Text>
          </View>
          <View style={styles.footer}>
            <View style={styles.signBox}>
              <Text style={styles.signLabel}>Pengirim (Toko)</Text>
              <Text style={styles.signName}>{data.pembawa || "( ................ )"}</Text>
            </View>
            <View style={styles.signBox}>
              <Text style={styles.signLabel}>Penerima (Admin GA)</Text>
              <Text style={styles.signName}>{data.penerima || "Admin GA"}</Text>
            </View>
            <View style={styles.signBox}>
              <Text style={styles.signLabel}>Mengetahui</Text>
              <Text style={styles.signName}>{data.approved_by || "SPV/Manager"}</Text>
            </View>
          </View>
        </>
      )}

      <Text style={styles.pageNum}>Hal. {pageNum} / {totalPages}</Text>
    </Page>
  );
}

export function SuratPenerimaanPDF({ data }: { data: SJDataForPDF }) {
  const chunks = chunkItems(data.items, ITEMS_PER_PAGE);
  return (
    <Document title={`Surat Penerimaan Barang - ${data.no_sj}`} author="SmartWMS - PT. Indomarco Prismatama">
      {chunks.map((chunk, idx) => (
        <SPBPage
          key={idx}
          data={data}
          pageItems={chunk}
          pageNum={idx + 1}
          totalPages={chunks.length}
          isLastPage={idx === chunks.length - 1}
        />
      ))}
    </Document>
  );
}
