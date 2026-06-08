# Smart Warehouse Management System
# Development Journal

---

# Minggu, 10 Mei 2026

## Aktivitas Hari Ini

Melanjutkan pengembangan **Smart Warehouse Management System** dengan fokus utama pada:

- Modern dashboard UI
- Implementasi Excel upload pipeline
- Parsing DAT Oracle
- Batch processing
- Integrasi Supabase
- Debugging ETL parser

Hari ini menjadi milestone penting karena sistem berhasil melakukan upload dan parsing file DAT Oracle asli hingga data berhasil masuk ke database Supabase.

> **Catatan retrospektif (7 Juni 2026):** Pipeline Excel sudah di-deprecate pada sesi 6 Juni 2026. Lihat entry tersebut.

---

## Tujuan Pengembangan Hari Ini

Membangun sistem upload DAT otomatis yang mampu:

- Membaca file Excel hasil export Oracle
- Melakukan parsing data aset
- Memproses data dalam batch
- Melakukan klasifikasi otomatis
- Menyimpan data ke database Supabase

### Tujuan Utama

Menggantikan proses manual menggunakan:

- Microsoft Excel
- Sorting manual
- VLOOKUP
- Klasifikasi manual

---

## Teknologi yang Digunakan

### Frontend
- Next.js 16
- TypeScript
- Tailwind CSS

### Backend / API
- Next.js Route Handler API

### Database
- Supabase PostgreSQL

### Library
- XLSX (deprecated per 6 Juni 2026)

### Tools
- GitHub
- Vercel
- VS Code

---

## Arsitektur yang Digunakan

### ETL Pipeline Architecture

```text
Excel Upload
    ↓
Excel Parsing
    ↓
Header Validation
    ↓
Data Normalization
    ↓
Batch Processing
    ↓
API Route
    ↓
Supabase Insert
    ↓
Classification Engine
    ↓
Dashboard Analytics
```

> **Catatan retrospektif (7 Juni 2026):** Pipeline diatas adalah versi awal. Sudah diganti dengan TXT bulk-upsert pipeline.

---

## Implementasi Sistem

### Batch Processing

Digunakan untuk:

- Menghindari browser freeze
- Menjaga stabilitas upload data besar

#### Konfigurasi
- 500 row per batch

---

### Raw & Clean Data Architecture

Menggunakan tabel:

- `assets_raw`
- `assets_clean`

#### Tujuan
- Memisahkan data mentah
- Memisahkan data hasil klasifikasi

---

### Keyword-Based Classification

Digunakan untuk:

- Identifikasi jenis barang
- Identifikasi merk
- Normalisasi deskripsi aset

---

## Fitur yang Sudah Berhasil

- Dashboard UI
- Sidebar & Topbar
- Upload DAT Excel
- XLSX Parser
- Batch Upload Processing
- Supabase Integration
- Asset Classification
- DAT Oracle Parsing

---

## Struktur Database Saat Ini

### assets_raw

Menyimpan data mentah hasil upload Oracle.

#### Field Utama
- `kode_asset`
- `toko`
- `kategori_oracle`
- `deskripsi`
- `status`

---

### assets_clean

Menyimpan data hasil klasifikasi.

#### Field Utama
- `jenis`
- `merk`
- `kategori`
- `confidence_score`

---

## Hasil Pengujian

- Upload DAT berhasil diproses
- Data berhasil masuk ke database Supabase
- Sistem berhasil membaca file DAT Oracle asli
- Classifier berhasil mengenali beberapa aset seperti:
  - Printer
  - Scanner
  - Komputer

---

## Catatan Pengembangan Selanjutnya

- Dynamic keyword classifier
- Dashboard analytics realtime
- Monitoring mismatch DAT & Web Tracking
- Reporting system
- AI classification enhancement

---

# Rabu, 13 Mei 2026

## Fitur yang Dikerjakan

- Implementasi halaman Review Assets (`/review`)
- Implementasi sistem keyword rule untuk klasifikasi aset
- Integrasi modal tambah rule dengan Supabase
- Implementasi hook `useKeywordRule`
- Sinkronisasi arsitektur form modal dengan centralized hook state
- Implementasi filter dan review workflow aset unknown
- Perbaikan parsing dan workflow review assets
- Integrasi tabel `keyword_rules`

## Teknologi / Library

- Next.js App Router
- React Hooks
- TypeScript
- Supabase
- Tailwind CSS

## Pendekatan / Metode

- Centralized form state management menggunakan custom hook
- Rule-based classification system
- Adaptive keyword learning
- Client-side review workflow
- Modular component architecture

## Progress

- Sistem review asset berhasil berjalan
- Rule berhasil tersimpan ke Supabase
- Dashboard review berhasil diintegrasikan dengan UI utama
- Persiapan integrasi dashboard utama dengan live Supabase statistics

---

# Minggu, 17 Mei 2026

## Pengembangan Classification System

- Merevisi arsitektur keyword classification menjadi database-driven
- Menghapus seluruh hardcoded keyword rule pada classifier
- Mengimplementasikan dynamic keyword matching menggunakan tabel `keyword_rules`
- Menjadikan `keyword_rules` sebagai single source of truth untuk klasifikasi aset
- Menambahkan dukungan rule terpisah berdasarkan `rule_type`: merk, jenis

## Pengembangan Review Workflow

- Merevisi Add Rule modal agar lebih sederhana dan modular
- Menghapus field kategori dan catatan dari rule system
- Mengimplementasikan form rule berbasis: keyword, rule_type, value

## Pengembangan Navigation & UI

- Menghubungkan halaman Dashboard dan Classification
- Menghapus menu sidebar "Review Assets"
- Menjadikan halaman Review sebagai referensi utama design system

## Arsitektur Sistem

- Mempertahankan arsitektur modular existing
- Memastikan classifier tetap sebagai pure utility function
- Implementasi fetch `keyword_rules` dilakukan di API layer untuk menghindari N+1 query

---

# Sabtu, 6 Juni 2026

## Ringkasan Sesi Pengembangan

Sesi pengembangan intensif dengan fokus pada:

1. Live dashboard Classification dari Supabase
2. Optimasi upload pipeline (bulk upsert)
3. Migrasi parser dari Excel ke TXT Oracle asli
4. Penambahan kolom finansial
5. Keyword rule management (edit, delete, revert)
6. No-merk classification support
7. Word boundary matching fix
8. Warehouse filter (CGA only)
9. PDF Report generation
10. Font consistency fix

---

## 1. Live Classification Dashboard

### Masalah Sebelumnya
- Summary cards masih dummy/hardcoded
- Data tidak terhubung ke Supabase

### Solusi
- Implementasi `useReviewAssets` hook dengan fetch langsung ke `assets_clean`
- Query menggunakan join `assets_raw!inner(toko)` untuk filter warehouse
- Fetch semua data dengan pagination loop (bypass Supabase 1000 row limit)
- Fix kolom `confidence` vs `confidence_score` mismatch antara DB dan TypeScript type

### Hasil
- Summary cards menampilkan data live: Total Unknown, Unknown Merk, Unknown Jenis, Completion %
- Completion % dihitung dari total aset gudang (bukan hanya unknown)

> **Catatan retrospektif (7 Juni 2026):** Join `assets_raw!inner(toko)` dihapus di sesi 7 Juni karena arsitektur CGA-only refactor.

---

## 2. Reclassification Engine

### Implementasi
- API route `/api/reclassify` dengan dua mode:
  - Normal mode: reclassify semua aset Unknown dengan keyword rules aktif
  - Revert mode: targeted revert setelah rule dihapus (`revert_merk` / `revert_jenis`)
- Tombol Reclassify di header Classification page
- Auto-trigger reclassify setelah Add Rule modal berhasil simpan
- Success banner menampilkan jumlah aset yang berhasil diklasifikasi ulang

---

## 3. Keyword Rule Management

### Fitur Baru
- Tab **Keyword Rules** di halaman Classification (dua tab: Review Aset & Keyword Rules)
- Edit rule via modal (inline update ke Supabase)
- Delete rule dengan confirm modal + **auto revert aset terdampak**
- Search/filter di tabel keyword rules
- Badge tipe rule: Merk (violet) / Jenis (blue)

### Targeted Revert Engine
- Saat rule dihapus, API reclassify dipanggil dengan parameter `revert_merk` atau `revert_jenis`
- Hanya aset yang nilainya cocok dengan rule yang dihapus yang di-revert
- Jauh lebih efisien dari full reclassify (misalnya hanya 50 aset terdampak vs 4000+)

---

## 4. No-Merk Classification Support

### Latar Belakang
- Beberapa aset memang tidak memiliki merk (barang generic/non-branded)
- Sebelumnya aset seperti ini akan selalu Unknown merk selamanya

### Implementasi
- Rule type baru: `no_merk`
- Classifier: kalau rule type `no_merk` match dan merk masih Unknown → set `merk = 'Non-Merk'`
- AddRuleModal: tambah opsi "No Merk" di dropdown, sembunyikan field value, tampilkan info hint amber
- UnknownBadge: badge slate dengan icon minus untuk Non-Merk (berbeda dari amber Unknown)
- Priority: rule `merk` spesifik selalu menang atas rule `no_merk` (guard `merk === 'Unknown'`)

---

## 5. Word Boundary Matching Fix

### Masalah
- Keyword pendek seperti "GEA" bisa false positive match ke kata "OMEGA", "EGAL", dll
- Keyword multi-kata seperti "AC SPLIT WALL" tidak match karena regex agresif mengubah "WALL 1" → "WALL1"

### Fix
- Hapus regex `replace(/(\w)\s+(\d)/g, '$1$2')` dari `normalizeText()`
- Implementasi word boundary matching: wrap description dan keyword dengan spasi
  ```ts
  const toSearch = ` ${normalized} `
  const toFind = ` ${normalizedKeyword} `
  ```
- "GEA" hanya match kalau ada sebagai kata utuh: " gea " ✅, "omega" ❌

---

## 6. Upload Pipeline Optimization

### Masalah Sebelumnya
- Sequential insert: 1 row per query → 8,310 queries untuk 4,155 baris → 20 menit

### Solusi: Bulk Upsert
- Semua data di-classify di memory terlebih dahulu
- Satu bulk upsert untuk `assets_raw`, satu bulk upsert untuk `assets_clean`
- Total: 2 queries vs 8,310 queries sebelumnya

### Hasil
- 51,459 baris (ALL DAT) selesai dalam **85.6 detik**
- 0 batch gagal, 0 baris dilewati

### Upsert Strategy
- Unique constraint di `kode_asset` pada `assets_raw`
- `ON CONFLICT (kode_asset) DO UPDATE` → upload DAT terbaru otomatis update data lama
- Tidak ada duplikat, database tidak bengkak

> **Catatan retrospektif (7 Juni 2026):** Performance numbers "51,459 baris (ALL DAT)" itu pengujian dengan dataset ALL DAT. Per 7 Juni 2026 sudah CGA-only, jadi dataset sekarang ~4,145 baris dan upload bahkan lebih cepat lagi.

---

## 7. Migrasi dari Excel Parser ke TXT Parser

### Latar Belakang
- File DAT Oracle asli berformat `.txt` (tab-delimited)
- Export ke Excel menyebabkan angka finansial tidak konsisten:
  - `944.000` (Rp 944 ribu) di TXT → Excel baca sebagai integer `944`
  - Sulit dibedakan antara nilai Rp 944 vs Rp 944.000

### Implementasi
- Buat `txtParser.ts` untuk parse file `.txt` Oracle langsung
- Tab-delimited, angka format Indonesia: `' 6.190.000 '` → `6190000`
- Hapus dependency XLSX untuk upload (lebih ringan)
- Update `UploadSection.tsx`: accept `.txt`, reject `.xlsx`
- Update `types.ts`: tambah kolom finansial `kuantitas`, `biaya_perolehan`, `jumlah_tercatat`

---

## 8. Penambahan Kolom Finansial

### Database Migration
```sql
ALTER TABLE assets_raw
ADD COLUMN IF NOT EXISTS kuantitas integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS biaya_perolehan bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS jumlah_tercatat bigint DEFAULT 0;
```

### Performance Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_assets_raw_toko ON assets_raw(toko);
CREATE INDEX IF NOT EXISTS idx_assets_clean_jenis ON assets_clean(jenis);
CREATE INDEX IF NOT EXISTS idx_assets_clean_merk ON assets_clean(merk);
```

---

## 9. Warehouse Filter (CGA Only)

### Latar Belakang
- DAT Oracle ALL berisi 51,459 baris (semua cost center: toko, departemen, gudang)
- Sistem ini fokus monitoring gudang: CGA1, CGA2, CGA3
- Non-gudang tetap tersimpan sebagai background data untuk reconciliation

### Definisi Gudang
| Kode | Nama | Fungsi |
|------|------|--------|
| CGA1 | Cadangan General Affairs 1 | Barang baru dari supplier |
| CGA2 | Cadangan General Affairs 2 | Barang bekas layak pakai |
| CGA3 | Cadangan General Affairs 3 | Barang calon pemusnahan |

### Implementasi
- Konstanta `WAREHOUSE_COST_CENTERS = ['CGA1', 'CGA2', 'CGA3']` di `types.ts`
- Fungsi `buildWarehouseFilter()` menghasilkan Supabase filter string
- Filter diterapkan di: `useReviewAssets`, `/api/reclassify`, `/api/reports/dat-summary`
- Performance: query hanya menyentuh 4,145 dari 51,459 total aset

> **Catatan retrospektif (7 Juni 2026):** Strategi ini berubah total. Per 7 Juni 2026 sistem **CGA-only sejak upload** — non-CGA tidak disimpan sama sekali. `buildWarehouseFilter()` dihapus. Lihat entry 7 Juni 2026 untuk detail.

---

## 10. PDF Report Generation

### Implementasi
- Library: `@react-pdf/renderer`
- API route: `GET /api/reports/dat-summary?cost_center=ALL|CGA1|CGA2|CGA3`
- Halaman Reports di sidebar

### Struktur Report
```
Per Cost Center (CGA1/CGA2/CGA3)
  └── Per Kategori Oracle
        └── Per Jenis Barang (dari assets_clean classifier)
              ├── Item (jumlah kode_asset unik)
              ├── Qty (sum kuantitas)
              ├── Perolehan (sum biaya_perolehan)
              └── Tercatat (sum jumlah_tercatat)
```

### Validasi
- Item count dan Qty 100% match dengan Excel manual Oracle
- CGA1: 2,234 item, 2,553 qty ✅
- CGA2: 1,126 item, 1,710 qty ✅
- CGA3: 785 item, 2,059 qty ✅

---

## 11. Sidebar Active State Fix

### Masalah
- Sidebar menggunakan `useState` untuk tracking active item
- Selalu default ke "dashboard" saat halaman di-load ulang

### Fix
- Ganti dengan `usePathname()` dari Next.js
- Fungsi `getActiveId(pathname)` mapping URL → nav item ID
- Active state selalu akurat berdasarkan URL

---

## 12. Font Consistency Fix

### Masalah
- `layout.tsx` menggunakan Geist font (Next.js default)
- `globals.css` mendefinisikan DM Sans
- Konflik menyebabkan font tidak konsisten antar halaman

### Fix
- Ganti Geist → DM Sans + JetBrains Mono di `layout.tsx`
- Gunakan CSS variable `--font-dm-sans` dari `next/font/google`
- Unifikasi `--color-bg` ke `#080e18` di semua halaman

---

## Status Akhir Sesi (6 Juni 2026)

### Fitur Selesai Hari Ini
- ✅ Live Classification Dashboard (Supabase)
- ✅ Reclassification Engine
- ✅ Targeted Revert Engine
- ✅ Keyword Rule Management (Edit + Delete)
- ✅ No-Merk Classification
- ✅ Word Boundary Matching Fix
- ✅ Bulk Upsert Upload Pipeline
- ✅ TXT Parser (Oracle native format)
- ✅ Kolom Finansial (biaya_perolehan, jumlah_tercatat)
- ✅ Warehouse Filter CGA1/CGA2/CGA3
- ✅ PDF Report Export
- ✅ Sidebar Active State Fix
- ✅ Font Consistency

### Next Priority
- Live Dashboard Statistics (summary cards dummy → Supabase)
- Warehouse Analytics (distribusi aset, nilai per kategori)
- Reconciliation Engine (DAT vs Web Tracking)
- Reporting Module Excel export
- Authentication & Role Management

---

# Minggu, 7 Juni 2026

## Ringkasan Sesi Pengembangan

Sesi paling produktif sejauh ini. Major refactor arsitektur + 3 fitur besar:

1. **Performance optimization** halaman Classification (eksplorasi server-side, finalisasi client-side)
2. **CGA-only architecture refactor** — DB tidak lagi simpan non-CGA
3. **TXT parser auto-detect delimiter** — support TAB dan PIPE
4. **Live Dashboard** dengan layout 6 baris (mix live + placeholder)
5. **Monitoring page** dengan 2 tab (DAT live, LPP placeholder)
6. **Upload Data restructure** — page tersendiri dengan 4 panel
7. **Classification bug fixes** — hide kolom Kategori, fix NaN, fix hydration
8. **TypeScript build fix** untuk Vercel
9. **Closing storage architecture** — keputusan desain (belum implementasi)
10. **Surat Jalan Manual Sesi 1** — schema + sidebar dropdown + Buat SJ + Master Tujuan

---

## 1. Performance Optimization Classification Page

### Masalah Awal
- Halaman Classification load 4.52 detik dengan transfer 268 KB
- Beban berat di koneksi internet kantor yang lambat

### Iterasi Solusi

**Iterasi 1: Server-side via API route**
- Bikin `/api/classification/route.ts` yang handle 5 query parallel di server
- Browser cukup 1 request → 1.47 detik / 7.3 KB
- Trade-off: setiap ganti halaman = network request

**Iterasi 2 (Final): Client-side pagination dengan CGA-only**
- Kombinasi dengan refactor CGA-only (data jauh lebih kecil)
- Fetch semua data sekali, manipulate di JS
- Filter/search/pagination instant tanpa network
- `/api/classification/route.ts` **dihapus** karena tidak diperlukan lagi

---

## 2. CGA-Only Architecture Refactor

### Keputusan Strategis
User memutuskan upload DAT CGA-only saja, bukan ALL DAT. Alasan:
- LPP Web Tracking memang hanya support CGA filter (tidak ada export ALL)
- Tidak ada manfaat menyimpan DAT non-CGA karena reconciliation engine fokus CGA
- DB jauh lebih ringan: 51,459 rows → 4,145 rows

### Perubahan Code
- Hapus `buildWarehouseFilter()` dan semua join `assets_raw!inner(toko)` dari query
- Hapus `/api/classification/route.ts`
- Update `useReviewAssets` ke pure client-side dengan fetch DISTINCT
- Update `/api/reclassify/route.ts` — tanpa warehouse filter
- Update `/api/reports/dat-summary/route.ts` — tanpa join warehouse

### File yang Dihapus
- `src/lib/xlsxParser.ts` (sudah deprecated sejak migrasi TXT)
- `src/app/api/classification/` (seluruh folder)
- `src/components/dashboard/DistribusiCostCenter.tsx` (replaced dengan PlaceholderCards)
- `src/components/dashboard/TopJenisChart.tsx` (replaced dengan PlaceholderCards)

---

## 3. TXT Parser Auto-Detect Delimiter

### Masalah
File DAT Oracle baru dari user pakai delimiter PIPE `|` sedangkan file sebelumnya TAB `\t`. Parser sebelumnya hanya support TAB.

### Solusi
Tambah fungsi `detectDelimiter()` di `txtParser.ts`:
- Hitung jumlah `|` vs `\t` di baris pertama header
- Pakai yang lebih banyak
- Sekarang support kedua format secara otomatis

---

## 4. Live Dashboard - 6 Baris Layout

User minta dashboard yang sesuai dengan core thesis (reconciliation). Layout final:

| Baris | Konten | Status |
|---|---|---|
| 1 | Status Data: DAT Update, DAT Closing, LPP Update, LPP Closing | DAT Update LIVE, lainnya placeholder |
| 2 | DAT vs LPP Comparison (3 cards: CGA1, CGA2, CGA3) | Placeholder |
| 3 | Trend Closing Bulanan (chart 12 bulan) | Placeholder |
| 4 | CGA Summary (3 cards: CGA1 hijau, CGA2 kuning, CGA3 merah) | LIVE |
| 5 | Closing vs Update Comparison (per CGA, naik/turun) | Placeholder |
| 6 | Rekap Pengiriman per Kategori | Placeholder |

### CGA Summary Cards (Baris 4)
Parameter per card: Total Barang, Total Qty, Biaya Perolehan, Jumlah Tercatat.

### Keputusan Teknis
- DAT Update terakhir → `MAX(uploaded_at)` dari `assets_raw` (kolom sudah ada index)
- Index baru: `CREATE INDEX idx_assets_raw_uploaded_at ON assets_raw(uploaded_at DESC)`
- LPP & Closing semuanya null → tampil "Belum ada data"
- Welcome banner dynamic (count unknown asset)
- UploadSection **dihapus dari Dashboard**, dipindah ke `/upload`

### File Baru
- `src/app/api/dashboard/stats/route.ts`
- `src/hooks/useDashboardStats.ts`
- `src/components/dashboard/DataStatusCards.tsx` (Baris 1)
- `src/components/dashboard/CGASummaryCards.tsx` (Baris 4)
- `src/components/dashboard/PlaceholderCards.tsx` (Baris 2, 3, 5, 6 — 4 components)

---

## 5. Monitoring Page - 2 Tab

### Konsep
Halaman monitoring untuk awareness reconciliation status. Dua tab terpisah seperti Classification.

**Tab DAT Monitoring:**
- List semua aset DAT yang belum punya SJ di Web Tracking
- Indikasi: aset sudah dikirim fisik tapi belum di-tracking di WT
- Live data dengan tag dummy "Pending" (LPP belum ada)

**Tab LPP Monitoring:**
- List aset LPP yang belum dimutasi secara Oracle DAT
- Empty state (data LPP belum ada)

### Kolom Tabel
Kategori | Jenis | Merk | Cost Center (badge warna) | Kode Aset | Deskripsi | Status

### Cost Center Badge
- CGA1 = hijau (emerald)
- CGA2 = kuning (amber)
- CGA3 = merah (rose)

### Filter & Search
- Filter Cost Center: ALL / CGA1 / CGA2 / CGA3
- Search by kode atau deskripsi
- Pagination client-side

### Summary Cards Per Tab
- **Tab DAT:** Total DAT Aset | Pending SJ WT | Sinkron
- **Tab LPP:** Total LPP | Belum Mutasi DAT | Sinkron (semua "—" karena belum ada data)

### File Baru
- `src/app/api/monitoring/route.ts`
- `src/hooks/useMonitoring.ts`
- `src/app/monitoring/page.tsx`

---

## 6. Upload Data Restructure

### Sebelumnya
Upload DAT di Dashboard (UploadSection component).

### Sekarang
Halaman terpisah `/upload` dengan **4 panel**:
- DAT Update (LIVE — fungsional, pakai UploadSection existing)
- DAT Closing (placeholder)
- LPP Update (placeholder)
- LPP Closing (placeholder)

### Sidebar Rename
"Upload DAT" → "Upload Data"

---

## 7. Classification Page Bug Fixes

- **Hilangkan kolom "Kategori"** dari tabel review (semua Unknown, tidak berguna)
- **Fix "Menampilkan 1–NaN"** karena field `totalCount` undefined → ubah pakai `filtered.length`
- **Hydration warning** dari input search yang di-inject `fdprocessedid` oleh browser extension → fix dengan `suppressHydrationWarning`
- **Toolbar count format:** `a / b aset` dimana a = hasil filter, b = total semua unknown

---

## 8. TypeScript Build Fix (Vercel)

Build error: `'no_merk' is not assignable to type '"jenis" | "merk"'`

### Fix
Di `KeywordRulesTab.tsx`:
- State type include `"no_merk"` di union: `"jenis" | "merk" | "no_merk"`
- `RuleTypeBadge` handle 3 case (jenis/merk/no_merk) dengan warna berbeda (Jenis biru, Merk violet, No Merk slate)

---

## 9. Closing Storage Architecture (KEPUTUSAN, BELUM IMPLEMENTASI)

Diskusi mendalam tentang bagaimana menyimpan data DAT/LPP Closing. **Keputusan strategis:** Tidak simpan row-level data closing, hanya aggregate metrics.

### Schema yang Direncanakan
```sql
CREATE TABLE closing_snapshots (
  id uuid PRIMARY KEY,
  data_type text,           -- 'DAT' | 'LPP'
  period text,              -- '2026-05' (YYYY-MM)
  uploaded_at timestamptz,
  total_items integer,
  total_qty integer,
  total_biaya_perolehan bigint,
  total_jumlah_tercatat bigint,
  breakdown_by_toko jsonb,
  breakdown_by_kategori jsonb,
  breakdown_by_jenis jsonb,
  kode_assets text[]        -- array untuk diff comparison
);
```

### Alasan
- Storage efisien (puluhan ribu rows × N bulan = bengkak kalau row-level)
- Comparison cukup butuh aggregate
- Closing memang sifatnya statis (cuma butuh angka final)

### Mekanisme Upload Closing (Direncanakan)
- User pilih period manual (12 bulan dropdown)
- Parser hitung aggregate in-memory
- Simpan ke `closing_snapshots`
- Data mentah di-discard (tidak masuk `assets_raw`)

### Format Period
- Closing: `2026-05` → display "Mei 2026"
- Update: tanggal upload → display "8 Juni 2026"

---

## 10. Surat Jalan Manual - Sesi 1

### Konteks Bisnis
SJ existing tidak punya autorecap, user harus rekap manual. Kita gantikan dengan sistem yang autorecap.

### Roadmap Multi-Sesi
- **Sesi 1 (selesai):** Schema + Sidebar dropdown + Buat SJ + Master Tujuan
- Sesi 2: List SJ + edit/delete/reschedule
- Sesi 3: Report dashboard + Excel export
- Sesi 4: Monitoring alokasi (checkbox mutasi Oracle)

### Database (3 Tabel Baru)

```sql
-- Master tujuan / cost center penerima
sj_tujuan (id, kode UNIQUE, nama, created_at)

-- Header SJ
surat_jalan (id, no_sj UNIQUE, tanggal, tujuan_id FK,
             pembawa, penerima, status, created_by, approved_by,
             created_at, updated_at)

-- Detail items
surat_jalan_items (id, sj_id FK ON DELETE CASCADE, urutan,
                   jenis, merk, serial_number, qty, satuan,
                   is_baru, is_aktiva, keterangan,
                   mutasi_oracle_status, mutasi_oracle_at, kode_asset)
```

Plus 7 indexes untuk query cepat. RLS allow-all (konsisten dengan pattern existing).

### Sidebar Dropdown
- Parent "Surat Jalan Manual" dengan icon document
- 4 sub-menu: Buat SJ | List SJ | Master Tujuan | Report
- Auto-expand kalau child aktif
- Collapsed mode: klik parent → ke child pertama

### Format No SJ
`SJ-Manual/CGA/YYYY/MM/XXXX`
- Sequence 4 digit, reset per bulan, global unique
- Generated server-side via helper `generateNoSJ()`

### Form Buat SJ — Keputusan UX Final
- Header: Tanggal, Tujuan (searchable dropdown dari `sj_tujuan`), Pembawa
- **Penerima OTOMATIS** = label tujuan (kode + nama), tidak ada input field
- **Approved By HARDCODED** = "SPV/Manager", tidak ada input field
- Items table dengan kolom: No(40) | Jenis(min160) | Merk(min160) | SN(140) | Qty(60) | Satuan(85) | Baru(50) | AT(50) | Keterangan(min150) | Aksi(70)
- Aksi per row: duplicate row (icon arrow down) + delete row (icon trash)
- 2 button submit: "Simpan Draft" (status draft) atau "Submit" (status submitted, redirect `/sj/list`)

### Source Data Dropdown Jenis & Merk
Keputusan setelah analisis trade-off (**tidak buat tabel master baru**):
- Query DISTINCT dari `assets_clean` WHERE jenis/merk != 'Unknown'
- Cache server-side 5 menit TTL (in-memory Node.js)
- Auto-invalidate akan ditambah saat reclassify selesai (Sesi berikutnya)
- Alasan: zero maintenance, always fresh, tidak ada duplikasi data

### Validasi Form
- **Wajib:** Tanggal + Tujuan + minimal 1 baris Jenis terisi
- **Optional:** Pembawa, SN, Merk, Keterangan

### SearchableDropdown Component
- Reusable component dengan search built-in
- Implementasi awal: dropdown clipped oleh `overflow:hidden` parent
- **Fix: pakai React Portal + `position: fixed`** → dropdown render di `document.body`, bebas dari clipping
- Auto-close on scroll/resize/outside-click
- Mode `allowCustom`: izinkan value yang tidak ada di options (untuk jenis/merk baru)

### SatuanSelect Custom
- Native `<select>` di-replace karena styling tidak konsisten dengan tema (font putih di background gelap, tampilan mentah)
- Custom dropdown dengan 5 options (Unit, Set, Pcs, Koli, Pack)
- Styling konsisten dengan SearchableDropdown

### Qty Input
- Awal: `<input type="number">` dengan spinner
- Final: `<input type="text" inputMode="numeric">` + sanitize digit only
- Plus CSS global untuk hilangkan spinner WebKit/Mozilla

### CRUD Master Tujuan
- Halaman `/sj/tujuan` dengan tabel + modals
- Create/Edit modal dengan validasi kode + nama
- Delete modal dengan konfirmasi
- Search by kode atau nama
- Kode auto-uppercase saat save

### Testing Tervalidasi
- Created: 1 master tujuan (XXXX - Toko XXXX)
- Created: 1 surat jalan (SJ-Manual/CGA/2026/06/0001) dengan 4 items
- Validasi: No SJ format benar, penerima otomatis terisi, approved_by hardcoded, items tersimpan dengan urutan benar, mutasi_oracle_status default false

### File Baru
**Backend:**
- `src/app/api/sj/route.ts` (POST create SJ)
- `src/app/api/sj/tujuan/route.ts` (CRUD)
- `src/app/api/sj/master/jenis/route.ts` (5-min cache)
- `src/app/api/sj/master/merk/route.ts` (5-min cache)

**Frontend:**
- `src/app/sj/buat/page.tsx`
- `src/app/sj/tujuan/page.tsx`
- `src/components/sj/SearchableDropdown.tsx`
- `src/components/sj/SJItemsTable.tsx`
- `src/hooks/useSJMaster.ts` (3 hooks)
- `src/lib/sjTypes.ts`

---

## Status Akhir Sesi (7 Juni 2026)

### Major Refactor
- ✅ CGA-only architecture (DB tidak simpan non-CGA)
- ✅ Hapus `buildWarehouseFilter()` dan semua join warehouse
- ✅ Client-side pagination untuk Classification

### Fitur Selesai Hari Ini
- ✅ Live Dashboard 6 baris (DAT Update + CGA Summary live, lainnya placeholder)
- ✅ Monitoring 2-tab page (DAT live, LPP placeholder)
- ✅ Upload Data page (4 panel, DAT Update fungsional)
- ✅ Sidebar dropdown support
- ✅ TXT Parser auto-detect delimiter (pipe/tab)
- ✅ Classification UX polish
- ✅ TypeScript build fix
- ✅ Surat Jalan Manual Sesi 1 (database + Buat SJ + Master Tujuan)

### Next Priority
- Sesi 2 SJ Manual: List SJ + edit/delete/reschedule
- Sesi 3 SJ Manual: Report dashboard + Excel export
- Sesi 4 SJ Manual: Monitoring alokasi (checkbox mutasi Oracle)
- Implementasi Closing snapshots architecture
- LPP Web Tracking integration
- Authentication & Role Management (Supabase Auth)
- DB optimization (materialized view, PostgreSQL function) — deferred sampai semua fitur selesai
