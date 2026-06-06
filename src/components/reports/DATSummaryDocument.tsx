import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRupiah(value: number): string {
  if (value === 0) return '-'
  return new Intl.NumberFormat('id-ID').format(value)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    paddingTop: 30,
    paddingBottom: 40,
    paddingHorizontal: 30,
    backgroundColor: '#ffffff',
  },

  // Header
  header: {
    marginBottom: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: '#1e40af',
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerLeft: {},
  headerTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#1e40af',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 8,
    color: '#64748b',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  headerDate: {
    fontSize: 7,
    color: '#94a3b8',
  },

  // Cost center section
  sectionHeader: {
    backgroundColor: '#1e3a5f',
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginBottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  sectionSubtitle: {
    fontSize: 7,
    color: '#93c5fd',
  },

  // Kategori header
  kategoriHeader: {
    backgroundColor: '#dbeafe',
    paddingVertical: 3,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  kategoriTitle: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#1e40af',
    flex: 1,
  },

  // Table
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 0.5,
    borderBottomColor: '#cbd5e1',
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.3,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 2.5,
    paddingHorizontal: 8,
  },
  tableRowAlt: {
    backgroundColor: '#f8fafc',
  },

  // Columns
  colJenis: { flex: 3 },
  colItem: { width: 36, textAlign: 'right' },
  colQty: { width: 36, textAlign: 'right' },
  colPerolehan: { width: 80, textAlign: 'right' },
  colTercatat: { width: 80, textAlign: 'right' },

  headerText: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: '#475569',
    textTransform: 'uppercase',
  },
  cellText: {
    fontSize: 7,
    color: '#334155',
  },
  cellTextMono: {
    fontSize: 7,
    color: '#1e293b',
    fontFamily: 'Helvetica',
  },

  // Subtotal kategori
  subtotalRow: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderTopWidth: 0.5,
    borderTopColor: '#93c5fd',
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  subtotalText: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#1e40af',
  },

  // Total toko
  totalRow: {
    flexDirection: 'row',
    backgroundColor: '#1e3a5f',
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  totalText: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: '#e2e8f0',
    paddingTop: 5,
  },
  footerText: {
    fontSize: 6,
    color: '#94a3b8',
  },
  pageNumber: {
    fontSize: 6,
    color: '#94a3b8',
  },
})

// ─── Types ────────────────────────────────────────────────────────────────────

interface JenisData {
  jenis: string
  item: number
  qty: number
  perolehan: number
  tercatat: number
}

interface KategoriData {
  kategori: string
  items: JenisData[]
  totalItem: number
  totalQty: number
  totalPerolehan: number
  totalTercatat: number
}

interface TokoData {
  toko: string
  tokoCode: string
  kategoris: KategoriData[]
  totalItem: number
  totalQty: number
  totalPerolehan: number
  totalTercatat: number
}

interface DATSummaryProps {
  data: TokoData[]
  generatedAt: string
}

// ─── Components ───────────────────────────────────────────────────────────────

const TableHeader = () => (
  <View style={styles.tableHeader}>
    <Text style={[styles.headerText, styles.colJenis]}>Jenis Barang</Text>
    <Text style={[styles.headerText, styles.colItem]}>Item</Text>
    <Text style={[styles.headerText, styles.colQty]}>Qty</Text>
    <Text style={[styles.headerText, styles.colPerolehan]}>Perolehan (Rp)</Text>
    <Text style={[styles.headerText, styles.colTercatat]}>Tercatat (Rp)</Text>
  </View>
)

const KategoriSection = ({ kategori, idx }: { kategori: KategoriData; idx: number }) => (
  <View>
    {/* Kategori header */}
    <View style={styles.kategoriHeader}>
      <Text style={styles.kategoriTitle}>{kategori.kategori}</Text>
    </View>

    <TableHeader />

    {/* Rows */}
    {kategori.items.map((item, i) => (
      <View
        key={item.jenis}
        style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
      >
        <Text style={[styles.cellText, styles.colJenis]}>{item.jenis}</Text>
        <Text style={[styles.cellTextMono, styles.colItem]}>{item.item}</Text>
        <Text style={[styles.cellTextMono, styles.colQty]}>{item.qty}</Text>
        <Text style={[styles.cellTextMono, styles.colPerolehan]}>
          {formatRupiah(item.perolehan)}
        </Text>
        <Text style={[styles.cellTextMono, styles.colTercatat]}>
          {formatRupiah(item.tercatat)}
        </Text>
      </View>
    ))}

    {/* Subtotal kategori */}
    <View style={styles.subtotalRow}>
      <Text style={[styles.subtotalText, styles.colJenis]}>
        Subtotal {kategori.kategori}
      </Text>
      <Text style={[styles.subtotalText, styles.colItem]}>{kategori.totalItem}</Text>
      <Text style={[styles.subtotalText, styles.colQty]}>{kategori.totalQty}</Text>
      <Text style={[styles.subtotalText, styles.colPerolehan]}>
        {formatRupiah(kategori.totalPerolehan)}
      </Text>
      <Text style={[styles.subtotalText, styles.colTercatat]}>
        {formatRupiah(kategori.totalTercatat)}
      </Text>
    </View>
  </View>
)

// ─── Main Document ────────────────────────────────────────────────────────────

export function DATSummaryDocument({ data, generatedAt }: DATSummaryProps) {
  return (
    <Document
      title="Laporan Rekap DAT - Smart Warehouse"
      author="SmartWMS"
      subject="Daftar Aktiva Tetap Summary"
    >
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header} fixed>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Laporan Rekap DAT</Text>
            <Text style={styles.headerSubtitle}>
              Smart Asset Monitoring & Reconciliation System
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerDate}>
              Digenerate: {formatDate(generatedAt)}
            </Text>
          </View>
        </View>

        {/* Content per cost center */}
        {data.map((toko) => (
          <View key={toko.toko}>
            {/* Cost center header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{toko.toko}</Text>
              <Text style={styles.sectionSubtitle}>
                {toko.totalItem} item · Qty {toko.totalQty}
              </Text>
            </View>

            {/* Kategori sections */}
            {toko.kategoris.map((kat, idx) => (
              <KategoriSection key={kat.kategori} kategori={kat} idx={idx} />
            ))}

            {/* Total toko */}
            <View style={styles.totalRow}>
              <Text style={[styles.totalText, styles.colJenis]}>
                TOTAL {toko.tokoCode}
              </Text>
              <Text style={[styles.totalText, styles.colItem]}>{toko.totalItem}</Text>
              <Text style={[styles.totalText, styles.colQty]}>{toko.totalQty}</Text>
              <Text style={[styles.totalText, styles.colPerolehan]}>
                {formatRupiah(toko.totalPerolehan)}
              </Text>
              <Text style={[styles.totalText, styles.colTercatat]}>
                {formatRupiah(toko.totalTercatat)}
              </Text>
            </View>
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            SmartWMS — Laporan Rekap DAT
          </Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) =>
              `Halaman ${pageNumber} dari ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  )
}
