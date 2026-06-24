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

---

# Senin, 8 Juni 2026 (Sesi Sore)

## Ringkasan Sesi Pengembangan

Lanjutan sesi Senin pagi. Fokus pada **Surat Jalan Manual Sesi 3** (Report + Excel Export) dan **Fitur Print/PDF SJ** (kritikal karena tanpa print, sistem SJ Manual tidak fungsional end-to-end untuk operasional).

---

## 1. Surat Jalan Manual - Sesi 3 (Report + Excel Export)

### Halaman `/sj/report`

**Filter Panel (4 baris):**
1. Period preset chips: Semua / Hari Ini / Kemarin / 7 Hari / Bulan Ini / Custom
2. Custom date range (muncul saat preset = Custom): Dari - Sampai
3. Multi filter: Tujuan (searchable) | Jenis (searchable) | Status (styled select)
4. Search: Field selector (Semua / No SJ / SN / Pembawa) + input + Reset Filter button

**Hasil info bar:**
> Menampilkan 156 item dari 32 Surat Jalan ke 15 tujuan — Total Qty: 200
> Periode: 1-8 Juni 2026

**Tabel flat (1 row = 1 item barang):**
Tanggal | No SJ | Tujuan | Pembawa | Jenis | Merk | SN | Qty | Satuan | Keterangan | Status

**Layout final tabel** (setelah tweak):
- SN dipersempit 120px → 80px (cuma 6 digit pertama yang relevan)
- Keterangan diperluas 180px → 220px
- min-w table 1280px → 1380px (fix Status column overflow)
- Horizontal scroll otomatis kalau layar sempit

### Excel Export

**Library:** `xlsx` (SheetJS) — ~200KB, paling ringan dan zero server load (generate client-side).

**Format output (single sheet flat, 17 kolom):**
No | Tanggal | No. SJ | Kode Tujuan | Nama Tujuan | Pembawa | Penerima | Jenis | Merk | Serial Number | Qty | Satuan | Baru | AT | Keterangan | Status | Disetujui

**Behavior:**
- Tombol "Export Excel" auto-pakai filter yang sedang aktif
- Filename otomatis: `Laporan-Surat-Jalan-YYYY-MM-DD.xlsx`
- Disabled saat hasil filter kosong
- Column widths auto-set agar readable

### StyledSelect Component

Native `<select>` di Status SJ dan Search Field tidak konsisten dengan tema (font putih di bg gelap, tampilan mentah). Dibuat `StyledSelect` component custom — pattern yang sama dengan `SatuanSelect` di SJItemsTable. Sekarang semua dropdown konsisten.

### Reset Filter Button

Diganti dari text link plain ke button styled amber/jingga (mirip Export Excel button tapi warna amber) + icon refresh. Disabled state (opacity 40%) saat tidak ada filter aktif.

### File Baru
- `src/app/api/sj/report/route.ts` — GET endpoint untuk flat items
- `src/hooks/useSJReport.ts` — fetch wrapper
- `src/lib/excelExporter.ts` — utility export pakai SheetJS
- `src/app/sj/report/page.tsx` — halaman report
- Library `xlsx` ditambahkan ke dependencies

---

## 2. Fitur Print / PDF Surat Jalan

### Konteks
Tanpa print, sistem SJ Manual tidak fungsional secara operasional — user tidak bisa cetak fisik untuk minta TTD. Fitur ini dijadikan prerequisite sebelum Sesi 4.

### PDF Layout — Modern tapi Formal

**Header:** Logo Indomaret + "PT. Indomarco Prismatama / General Affairs Division" + judul "SURAT JALAN" (fresh dengan accent cyan, 2pt border bottom)

**Meta box:** No SJ + Tanggal Pengiriman dalam container slate background

**Tujuan section:** Border-left 3px cyan thick (modern accent style)

**Items table:**
- Header dengan accent biru muda
- Alternating row colors (zebra striping)
- Tag badges inline: hijau "BARU" + biru "AT"
- Kolom: No | Jenis | Merk | Serial No | Qty | Satuan | Tag | Keterangan
- SN pakai font monospace (Courier)

**Total row:** Total Item + Total Qty di bagian bawah tabel

**4 kolom TTD:**
- Dibuat: hardcoded "Admin GA"
- Disetujui: hardcoded "SPV/Manager"
- Pembawa: dari input form
- Penerima: dari label tujuan (auto)

**Footer:**
- Branding "SmartWMS"
- Page number "Halaman X / N" (auto pagination kalau items banyak melebihi 1 halaman A4)

### Library
- `@react-pdf/renderer` — sudah ada di project (sebelumnya dipakai untuk DAT Summary report)
- Tidak perlu library tambahan, sesuai prinsip "tidak menambah dependency tidak perlu"

### Logo Strategy

**Path:** `public/logo-idm.png` (BUKAN `src/assets/` karena Next.js tidak serve dari src ke browser)

**Loading:**
- Logo di-fetch sebagai blob → convert ke base64
- Di-cache di module-level variable (load sekali per session, bukan per generate)
- Fallback ke text "INDOMARET" dengan background cyan kalau file gagal load
- Console.warn kalau gagal (untuk debugging) tapi tidak block proses

**Concern legal:** Logo Indomaret adalah trademark. Untuk demo skripsi (educational) aman. Kalau di-deploy publik atau komersial, perlu ganti.

### Modal Preview (SJPreviewModal)

Modal dengan iframe yang menampilkan PDF preview real-time:
- Generate PDF blob → create object URL → tampilkan di iframe
- 2 button utama: Download PDF (cyan) + Print (emerald)
- Print button buka PDF di tab baru → user tinggal Ctrl+P
- Download button save dengan filename auto: `SJ-Manual-CGA-2026-06-0001.pdf` (slash di-replace dash)
- Loading state dengan spinner saat generate
- Error state dengan retry hint
- Object URL otomatis di-revoke saat modal ditutup (no memory leak)

### Auto-Trigger Modal

Modal preview muncul otomatis di 4 skenario:
1. **Submit Buat SJ baru** → preview → tutup → form reset
2. **Update Edit SJ** → preview → tutup → redirect ke `/sj/list`
3. **Reschedule berhasil** → preview → tutup → refresh list
4. **Klik icon printer hijau** di `/sj/list` row → instant preview anytime

Modal preview SELALU muncul setelah ada perubahan data SJ — user pasti dapat kesempatan print setelah create/edit/reschedule.

### Helper Functions (sjPdfHelpers.ts)

3 utility functions:
- `generateSJPdfBlob(data)` — return Blob untuk preview iframe
- `downloadSJPdf(data)` — trigger browser download
- `openSJPdfForPrint(data)` — buka di tab baru

Semua share logo loader yang sama (cache module-level).

### PreviewWrapper Component

Di list page, ada wrapper component yang handle fetch detail SJ via `useSJDetail`. Saat user klik printer icon, wrapper fetch full data (header + items) lalu pass ke `SJPreviewModal`. Pakai loading state minimalist sambil tunggu fetch.

### File Baru / Diubah
- **NEW** `src/components/sj/SuratJalanPDF.tsx` — PDF document template
- **NEW** `src/lib/sjPdfHelpers.ts` — utility functions
- **NEW** `src/components/sj/SJPreviewModal.tsx` — modal dengan iframe preview
- **UPDATED** `src/app/sj/buat/page.tsx` — replace success state dengan modal trigger
- **UPDATED** `src/app/sj/list/page.tsx` — add print button + auto-preview after reschedule

### Performance Considerations

Sesuai prinsip optimal/enteng:
- Logo cache di memory (1x load per session)
- PDF generate client-side (zero server/DB load)
- Iframe blob URL di-revoke saat tutup modal
- `@react-pdf/renderer` sudah ada di bundle, tidak nambah berat

---

## Status Akhir Sesi (8 Juni 2026, Sore)

### Fitur Selesai
- ✅ Surat Jalan Manual Sesi 3 (Report + Excel Export)
- ✅ Print/PDF feature dengan preview modal
- ✅ Logo Indomaret integration dengan cache strategy

### Next Priority
- Sesi 4 SJ Manual: Monitoring alokasi (checkbox mutasi Oracle)
- Implementasi Closing snapshots architecture
- LPP Web Tracking integration
- Authentication & Role Management

---

# Selasa, 9 Juni 2026

## Ringkasan Sesi Pengembangan

Sesi ini fokus pada 4 hal: Keyword Rule Consistency, SJ Rekap Alokasi refactor, rename sidebar, dan Monitoring DAT overhaul.

---

## 1. Keyword Rule Consistency

### Masalah
Data `keyword_rules` inconsistent — ada value yang sama tapi berbeda casing (misal "CPU" dan "Cpu" dianggap 2 jenis berbeda). Ini menyebabkan Report DAT menampilkan data terfragmentasi padahal merujuk ke jenis yang sama.

### Solusi
Pendekatan UI-level: autocomplete suggestion + disable submit saat terdeteksi casing mismatch. Lebih ringan dari server-side duplicate check (tidak ada network round-trip tambahan).

### Autocomplete Suggestion (AddRuleModal + EditRuleModal)
- Field "Value" (Jenis/Merk) sekarang pakai `AutocompleteInput` component
- Suggestion di-fetch dari `/api/keyword-rules/values?type=jenis|merk`
- Matching case-insensitive saat mengetik — user langsung lihat value yang sudah ada
- Source: `keyword_rules` saja (bukan `assets_clean`) sesuai prinsip "dasar dari keyword rule itu sendiri"

### Disable Submit Saat Mismatch
- Kalau user ketik value yang case-insensitive match dengan existing tapi casing beda (mis. ada "CPU", user ketik "cpu"):
  - Warning hint amber muncul: *Sudah ada value "CPU" — klik untuk pakai casing yang sudah ada*
  - Tombol Simpan **otomatis disabled** (opacity 40%, cursor not-allowed, tooltip on hover)
  - Klik suggestion → value auto-replace ke casing existing → tombol aktif lagi
- Tidak ada server-side check saat submit → hemat 1 Supabase query per save

### Mismatch Detection via Callback
`AutocompleteInput` expose `onMismatchChange` callback:
```ts
onMismatchChange?: (mismatch: { hasMismatch: boolean; existingValue: string | null }) => void
```
Parent (`AddRuleModal` / `EditRuleModal`) track state `valueMismatch` → disable button.

### SQL Migration (One-time)
SQL script `migration-keyword-rules-cleanup.sql` untuk cleanup data existing:
- STEP 1: SELECT duplikat (read-only, aman)
- STEP 2: DELETE duplikat, keep yang `created_at` paling awal
- STEP 3: Verifikasi 0 rows duplikat tersisa
- Setelah cleanup: jalankan Reclassify di `/review`

### File Baru / Diubah
- **NEW** `src/components/review/AutocompleteInput.tsx`
- **NEW** `src/hooks/useKeywordRuleValues.ts`
- **NEW** `src/app/api/keyword-rules/values/route.ts`
- **UPDATED** `src/components/review/AddRuleModal.tsx`
- **UPDATED** `src/components/review/KeywordRulesTab.tsx`
- **UPDATED** `src/hooks/useKeywordRule.ts` (simplified, hapus server-side duplicate check)

---

## 2. SJ Rekap Alokasi — Filter Refactor

### Sebelumnya
Halaman `/sj/report` punya 3 dropdown terpisah: Tujuan (searchable), Jenis Barang (searchable), Status SJ. Terlalu banyak komponen di filter panel, tidak efisien.

### Sesudahnya
Semua filter kolom digabung ke 1 **dropdown CARI** dengan 7 pilihan:
1. Semua Field
2. Tujuan (cari kode/nama)
3. Jenis Barang
4. Status SJ (ketik: Draft / Submitted / Completed)
5. No. SJ
6. Serial Number
7. Pembawa
8. Keterangan ← tambahan baru

Placeholder input dinamis sesuai field yang dipilih (mis. pilih Status → placeholder "Draft / Submitted / Completed").

### Rename Periode
"7 Hari" → **"Minggu Ini"** (lebih natural). Update di label chip + slug untuk filename Excel.

### Dynamic Excel Filename
Nama file Excel sekarang mencerminkan filter aktif:

| Filter Aktif | Nama File |
|---|---|
| Tanpa filter | `Report-Alokasi-Semua-Periode-YYYY-MM-DD.xlsx` |
| Minggu Ini | `Report-Alokasi-Minggu-Ini-YYYY-MM-DD.xlsx` |
| Minggu Ini + Jenis=CPU | `Report-Alokasi-Minggu-Ini-sort-by-Jenis-CPU-YYYY-MM-DD.xlsx` |
| Custom + SN=50185 | `Report-Alokasi-2026-06-01-sd-2026-06-08-sort-by-SN-50185-YYYY-MM-DD.xlsx` |

### File Diubah
- **UPDATED** `src/app/sj/report/page.tsx` — filter refactor + dynamic filename

---

## 3. Rename Sidebar & Headings

Perubahan naming di dropdown "Surat Jalan Manual":
- **"List Surat Jalan"** → **"Daftar Surat Jalan"** (+ heading halaman `/sj/list`)
- **"Report"** → **"Rekap Alokasi"** (+ heading halaman `/sj/report`)

---

## 4. Monitoring DAT — Major Overhaul

### Filter System Baru: Multi-Field Tag Filter

Sebelumnya monitoring hanya punya filter CGA chip + 1 search box sederhana.

Sekarang pakai **multi-field tag filter** dengan AND logic antar tag:
1. Pilih field dari dropdown (Jenis/Merk/Kode Aset/Kategori Oracle/Deskripsi)
2. Ketik value → tekan Enter → jadi tag berwarna
3. Ganti field → ketik lagi → tag baru ditambahkan
4. Logic: AND antar semua tag (Jenis:CPU **AND** Merk:Zyrex)

**Warna tag per field:**
- Jenis → cyan
- Merk → violet
- Kode Aset → blue
- Kategori Oracle → amber
- Deskripsi → slate

**Cost Center chips** tetap single-select (ALL/CGA1/CGA2/CGA3), AND dengan tag filter.

### Fix Cost Center Badge di Tabel

**Masalah:** Data `toko` di DB berisi nama panjang "CGA1 – CADANGAN GENERAL AFFAIRS 1", bukan kode singkat "CGA1". Badge tampil panjang dan merusak layout.

**Fix:** Fungsi `extractCGACode()` dengan regex `/CGA\d/i` — parse nama panjang → kode singkat. Dipakai di CGABadge, filter chip comparison, dan Excel exporter.

```ts
function extractCGACode(toko: string): string {
  const match = toko.match(/CGA\d/i);
  return match ? match[0].toUpperCase() : toko;
}
```

**CGABadge** sekarang tampil kode singkat dengan warna signature:
- CGA1 → emerald
- CGA2 → amber
- CGA3 → rose

### Kolom Tabel Reorder

**Sebelum:** Jenis | Merk | Cost Center | Kategori Oracle | Kode Aset | Qty | Deskripsi | Perolehan

**Sesudah:** Kategori Oracle | Jenis | Merk | Cost Center | Kode Aset | Deskripsi | Qty | Perolehan | **Tercatat** ← tambahan

Data auto-sorted by 5 kolom pertama: Kategori Oracle → Jenis → Merk → Cost Center → Kode Aset.

### Horizontal Scroll
Tabel dibungkus `overflow-x-auto` + `min-w-[1380px]` untuk accommodate 9 kolom.

### Export Excel 2 Sheet

**Sheet 1 — Summary:**
Group per Jenis × Cost Center dengan subtotal per Jenis + Grand Total.
Kolom: Jenis | Cost Center | Total Item | Total Qty | Biaya Perolehan | Jumlah Tercatat

**Sheet 2 — Detail DAT:**
1 row = 1 aset, sorted Jenis → Cost Center.
Kolom: No | Jenis | Merk | Cost Center | Kategori Oracle | Kode Aset | Deskripsi | Qty | Biaya Perolehan | Jumlah Tercatat

**Nama file dinamis:**
- `Monitoring-DAT-Semua-CGA-sort-by-Jenis-CPU-Super-Blender-2026-06-09.xlsx`

### File Baru / Diubah
- **NEW** `src/components/monitoring/TagInput.tsx`
- **NEW** `src/lib/monitoringExporter.ts`
- **UPDATED** `src/app/monitoring/page.tsx`
- **UPDATED** `src/app/api/monitoring/route.ts`
- **UPDATED** `src/hooks/useMonitoring.ts`

---

## Status Akhir Sesi (9 Juni 2026)

### Selesai Hari Ini
- ✅ Keyword Rule Consistency (autocomplete + disable submit on mismatch)
- ✅ SQL migration cleanup duplikat existing
- ✅ SJ Rekap Alokasi filter refactor (7-field unified search)
- ✅ Dynamic Excel filename
- ✅ Rename sidebar: Daftar SJ + Rekap Alokasi
- ✅ Monitoring DAT overhaul (multi-field tag filter + Excel export 2 sheet)
- ✅ extractCGACode fix untuk data DB nama panjang
- ✅ Kolom tabel reorder + sort + Tercatat column

### Next Priority
- Sesi 4 SJ Manual: Monitoring alokasi (checkbox mutasi Oracle)
- Closing snapshots architecture (DAT/LPP Closing upload)
- LPP Web Tracking integration
- Authentication & Role Management

---

# Selasa, 9 Juni 2026 (Sesi Sore — Bug Fixes)

## Ringkasan

Sesi fokus pada berbagai bug fix yang ditemukan saat testing operasional.

---

## 1. SearchableDropdown — Keyboard Navigation & Tab Support

### Masalah
- Arrow Up/Down tidak berfungsi di dropdown Jenis/Merk pada form Buat SJ
- Tidak bisa scroll dropdown list (dropdown hilang saat scroll)
- Setelah pilih item, Tab tidak pindah ke kolom berikutnya

### Root Cause
- Tidak ada handler ArrowUp/ArrowDown di search input
- Event listener `scroll` dengan `capture: true` intercept semua scroll event termasuk scroll di dalam dropdown list sendiri
- Setelah pilih item, fokus kembali ke `document.body` bukan ke trigger button

### Fix
- Tambah keyboard navigation: ArrowUp/Down navigasi highlight, Enter/Tab pilih item
- Mouse hover sync dengan highlight state
- `onMouseDown preventDefault` fix click-before-blur bug
- Auto-focus search input saat dropdown buka
- Auto-scroll highlighted item ke viewport
- Tab: pilih item ter-highlight → fokus ke trigger → Tab natural browser ke elemen berikutnya
- Scroll close guard: cek apakah scroll terjadi di dalam `dropdownRef` sebelum close
- `forwardRef` support untuk external focus control
- Hapus `memo()` wrapper dari `forwardRef` (React 19 compatibility)

### File Diubah
- **UPDATED** `src/components/sj/SearchableDropdown.tsx`

---

## 2. Cache Invalidation Setelah Edit/Delete Keyword Rule

### Masalah
Setelah edit atau delete keyword rule, dropdown Jenis/Merk di form Buat SJ dan suggestion di AddRuleModal masih menampilkan data lama — harus tunggu 5 menit TTL atau refresh manual.

### Root Cause
`KeywordRulesTab.tsx` tidak memanggil invalidate cache setelah `UPDATE` (edit) atau `DELETE` rule. Hanya `useKeywordRule` (add rule) yang sudah invalidate cache.

### Fix
Tambah fungsi `invalidateAllCaches()` di `KeywordRulesTab.tsx` yang dipanggil setelah:
- Edit rule berhasil (setelah `onSaved()`)
- Delete rule berhasil (setelah revert + `onDeleted()`)

```ts
function invalidateAllCaches() {
  fetch("/api/keyword-rules/values", { method: "DELETE" }).catch(() => {});
  fetch("/api/sj/master/jenis",      { method: "DELETE" }).catch(() => {});
  fetch("/api/sj/master/merk",       { method: "DELETE" }).catch(() => {});
}
```

Sekarang semua aksi rule (add/edit/delete) → cache langsung bersih → UI langsung fresh.

### File Diubah
- **UPDATED** `src/components/review/KeywordRulesTab.tsx`

---

## 3. Fix Revert no_merk Rule Saat Delete

### Masalah
Saat rule `no_merk` dihapus via UI, aset yang ter-klasifikasi "Non-Merk" tidak otomatis revert ke Unknown.

### Root Cause
`DeleteConfirmModal` di `KeywordRulesTab` salah kirim body ke `/api/reclassify`:
```ts
// SALAH — no_merk masuk ke else branch
if (rule.rule_type === "merk") body.revert_merk = rule.value;
else body.revert_jenis = rule.value;  // kirim revert_jenis = "Non-Merk" — tidak ada aset dengan jenis "Non-Merk"
```

### Fix
```ts
if (rule.rule_type === "merk")          body.revert_merk  = rule.value;
else if (rule.rule_type === "no_merk")  body.revert_merk  = "Non-Merk";
else                                    body.revert_jenis = rule.value;
```

---

## 4. Classifier 2-Pass Logic

### Masalah
Aset dengan deskripsi mengandung keyword `no_merk` sekaligus keyword `merk` spesifik (mis. "DVR 16 CH Dahua") bisa ter-klasifikasi sebagai Non-Merk kalau rule `no_merk` "DVR" diproses sebelum rule `merk` "DAHUA" di loop.

### Fix
Ganti 1 loop menjadi 2 pass:

**Pass 1:** Loop semua rules, skip `no_merk`, proses jenis + merk spesifik dulu.

**Pass 2:** Hanya dijalankan kalau merk **masih Unknown** setelah Pass 1 — baru cek `no_merk` rules sebagai fallback.

Dengan ini, merk spesifik **selalu menang** atas `no_merk` regardless urutan rules di DB.

### File Diubah
- **UPDATED** `src/lib/classifier.ts`

---

## 5. Fix cellToNumber — Oracle DAT Desimal Format

### Masalah
Nilai `jumlah_tercatat` di DB jauh lebih besar dari yang seharusnya. Contoh: `10164583.33` di file TXT tersimpan sebagai `1016458333` di DB (100x lebih besar).

### Root Cause
Fungsi `cellToNumber` di `txtParser.ts` menggunakan:
```ts
const cleaned = str.replace(/\./g, "").replace(/,/g, ".");
```
Ini hapus **semua titik** tanpa melihat konteks. Padahal Oracle export kadang menggunakan titik sebagai desimal (`10164583.33`) bukan sebagai ribuan — sehingga titik desimal ikut terhapus.

### Fix: Smart dot detection
```ts
if (str.includes(",")) {
  // Format Indonesia: titik=ribuan, koma=desimal
  cleaned = str.replace(/\./g, "").replace(",", ".");
} else {
  const dotParts = str.split(".");
  if (dotParts.length > 2) {
    // Lebih dari 1 titik → semua titik adalah ribuan
    cleaned = str.replace(/\./g, "");
  } else if (dotParts.length === 2 && dotParts[1].length <= 2) {
    // Tepat 1 titik + ≤2 digit → titik adalah desimal
    cleaned = str;
  } else {
    // Tepat 1 titik + 3 digit → titik adalah ribuan
    cleaned = str.replace(/\./g, "");
  }
}
```

Format yang di-handle:
| Input | Output | Konteks |
|---|---|---|
| `2.383.000` | `2383000` | Titik ribuan |
| `10.164.583,33` | `10164583` | Format Indonesia |
| `10164583.33` | `10164583` | Titik desimal |
| `2383000` | `2383000` | Plain integer |

### Tindakan Lanjutan
Setelah deploy fix ini, **upload ulang file DAT** agar data di DB ter-parse ulang dengan benar.

### File Diubah
- **UPDATED** `src/lib/txtParser.ts`

---

## Status Akhir Sesi (9 Juni 2026, Sore)

### Selesai
- ✅ SearchableDropdown keyboard navigation + Tab support + scroll fix
- ✅ Cache invalidation setelah edit/delete keyword rule
- ✅ Fix revert no_merk rule saat delete
- ✅ Classifier 2-pass logic (merk spesifik > no_merk)
- ✅ cellToNumber fix untuk Oracle DAT desimal format

### Action Required
- ⚠ Upload ulang file DAT TXT setelah deploy — data `jumlah_tercatat` di DB perlu di-refresh dengan parser baru

---

# Selasa, 9 Juni 2026 (Sesi Malam)

## Ringkasan Sesi

Sesi fokus pada: bulk insert master tujuan, keputusan arsitektur upload DAT, implementasi delete-then-insert pipeline, perencanaan fitur "Changed" di Classification, dan berbagai bug fix minor.

---

## 1. Bulk Insert 928 Master Tujuan

928 data tujuan di-import dari file Excel (`list-tujuan.xlsx`) via SQL INSERT yang di-generate otomatis dari Python script. Query pakai `ON CONFLICT (kode) DO UPDATE SET nama = EXCLUDED.nama` supaya aman kalau ada kode yang sudah exist (tidak error duplikat).

---

## 2. Rekap Alokasi — Sort by No. SJ Desc

Tabel di halaman `/sj/report` (Rekap Alokasi) sekarang di-sort by **No. SJ descending** (terbaru di atas), lalu urutan item dalam SJ yang sama ascending.

Sort by No. SJ string sudah otomatis sort by tanggal juga karena format `SJ-Manual/CGA/YYYY/MM/XXXX` embed tahun dan bulan di dalam string.

**File Diubah:**
- **UPDATED** `src/app/sj/report/page.tsx`

---

## 3. Keputusan Arsitektur Upload DAT — Full Replace Strategy

### Konteks
Diskusi tentang bagaimana sistem menyikapi 3 skenario saat upload DAT terbaru:
1. Nomor DAT yang masih ada → overwrite dengan data terbaru
2. Nomor DAT yang sudah dimutasi Oracle (hilang dari file) → harus hilang dari DB
3. Nomor DAT baru (mutasi masuk ke CGA) → harus masuk DB

### Keputusan: Delete-then-Insert (Full Replace)

Alasan:
- DAT Oracle adalah **full snapshot** — isinya seluruh DAT di CGA pada hari request
- Aset yang tidak ada di file terbaru = sudah dimutasi keluar CGA
- Upsert lama tidak bisa deteksi aset yang hilang → DB lama-lama nyampah dengan aset stale
- Full replace = DB selalu cermin kondisi gudang hari ini, tidak lebih tidak kurang

History aset yang keluar CGA **tidak disimpan di DB** — akan ditangani nanti via fitur Rekap Alokasi (target fitur masa depan).

### Implementasi
Upload DAT baru
→ DELETE semua assets_raw (assets_clean ikut terhapus via CASCADE)
→ INSERT fresh dari file (batch 500 rows)
→ Classifier jalan otomatis

Keyword rules **tidak tersentuh** — di tabel terpisah, tidak ikut cascade.

**File Diubah:**
- **UPDATED** `src/app/api/process/route.ts` — dari upsert ke delete-then-insert

### Bug Aktif
Setelah implementasi, INSERT hanya masuk **27 dari 4527 rows**. DELETE sudah benar (verified: `COUNT(*) = 0` setelah delete). Berarti masalah di sisi **client** — data yang dikirim dari frontend ke `/api/process` kemungkinan hanya 27 rows bukan 4527. File yang perlu dicek: `UploadSection.tsx` dan `batchProcessor.ts`. Belum resolved saat akhir sesi.

---

## 4. Perencanaan Fitur "Changed" di Classification

### Konsep
Filter baru di halaman Classification (sejajar dengan Semua/Unknown Jenis/Unknown Merk) untuk menampilkan aset yang **Jenis atau Merk berubah** setelah upload DAT terbaru. Filter "Keduanya" akan dihapus karena tidak berguna.

### Keputusan Desain
- Trigger: **hanya** perubahan saat upload DAT baru (bukan karena edit keyword rule)
- Aksi per aset: **ACC** (accept perubahan baru) atau **Revert** (kembalikan ke nilai lama)
- Storage: tambah kolom `prev_jenis` + `prev_merk` di `assets_clean`

### Constraint dengan Delete-then-Insert
Delete-then-insert menghapus `assets_clean` via CASCADE sebelum insert baru → nilai lama hilang sebelum bisa dibandingkan. Solusi: **backup nilai lama ke Map di memory** sebelum DELETE, compare setelah classify ulang.

### Status: BELUM DIKERJAKAN
Dikerjakan setelah delete-then-insert pipeline bug selesai di-fix.

---

## 5. Fix Minor Lainnya

### cellToNumber & Upload Ulang DAT
Setelah fix `cellToNumber` (sesi 9 Juni sore), user perlu upload ulang DAT TXT agar data `jumlah_tercatat` yang salah di DB ter-overwrite dengan nilai yang benar.

### SearchableDropdown — Tab ke Kolom Berikutnya
Setelah pilih item di dropdown (Enter atau klik), Tab key sekarang bisa pindah fokus ke kolom berikutnya di form Buat SJ. Flow: Jenis → Tab → Merk → Tab → SN → Tab → Qty → dst.

---

## Rabu, 10 Juni 2026 (Status Akhir Sesi)

### Selesai
- ✅ Bulk insert 928 master tujuan dari Excel
- ✅ Rekap Alokasi sort by No. SJ desc
- ✅ Keputusan arsitektur: full replace strategy untuk upload DAT
- ✅ Delete-then-insert implemented di `/api/process/route.ts`

### Bug Aktif
- ⚠ **Delete-then-insert: hanya 27/4527 rows masuk DB** — DELETE benar, INSERT bermasalah. Suspect di `UploadSection.tsx` / `batchProcessor.ts`. Belum resolved.

### Next Priority
1. **Fix bug delete-then-insert** (27 rows issue) — PRIORITAS
2. Fitur "Changed" di Classification (prev_jenis/prev_merk + ACC/Revert)
3. Sesi 4 SJ Manual: Monitoring alokasi (checkbox mutasi Oracle)
4. Closing snapshots architecture
5. LPP Web Tracking integration
6. Authentication & Role Management

# Kamis, 11 Juni 2026 (SJ Sesi 4: Alokasi Aset & Mutasi Oracle)

### 1. Latar Belakang & Kebutuhan

Setelah fitur Surat Jalan Manual (Sesi 1–3) selesai, sistem bisa mencatat pengiriman
aset keluar CGA secara digital. Namun tidak ada mekanisme untuk memverifikasi apakah
aset yang sudah dikirim fisik juga sudah diproses mutasi di sistem Oracle ERP perusahaan.
Gap ini menyebabkan potensi discrepancy antara data fisik (sudah dikirim) dan data
Oracle (belum dimutasi), yang berdampak pada akurasi laporan aset CGA.

Kebutuhan bisnis yang melatarbelakangi:
- User perlu tahu barang mana yang sudah dikirim tapi belum dimutasi Oracle
- Aset yang sudah dialokasikan keluar perlu ditandai di database DAT agar monitoring
  akurat (tidak dihitung sebagai aset aktif CGA)
- Dashboard perlu menampilkan warning actionable, bukan sekadar info statis

### 2. Pendekatan Teknis

**A. Penyimpanan tag "Allocated"**
Dipilih kolom `tag TEXT DEFAULT NULL` di `assets_clean` (Opsi persist di DB) dibanding
virtual/computed via JOIN. Alasan: tag harus tetap ada walau data SJ diedit atau dihapus
di masa depan, dan query monitoring tidak perlu JOIN tambahan ke `surat_jalan_items`
setiap fetch — cukup baca kolom `tag` yang sudah ada.

Trade-off: ada risiko orphan tag kalau aset di-upload ulang (DAT full replace akan
hapus assets_clean via CASCADE, otomatis reset tag). Ini diterima karena upload DAT
memang berarti data fresh — alokasi perlu diinput ulang.

**B. Save alokasi onBlur, bukan auto-save per keystroke**
Mengurangi jumlah PATCH request secara signifikan. User mengetik kode aset → blur
(pindah kolom/klik lain) → baru tersimpan. Typo bisa dikoreksi dengan reinput langsung
di kolom yang sama.

**C. Local override state (allocOverride)**
Setelah PATCH berhasil, state lokal diupdate via `allocOverride` Map tanpa refetch
seluruh data dari server. Penting untuk performa di koneksi rendah — data rekap alokasi
bisa ribuan row, refetch setiap save sangat tidak efisien.

**D. Warning count via `count: exact, head: true`**
Supabase mendukung query yang hanya mengembalikan COUNT tanpa transfer row data.
Dipakai untuk 2 warning count di dashboard stats API — jauh lebih ringan dibanding
fetch rows lalu hitung di server/client.

**E. Partial index di assets_clean**
```sql
CREATE INDEX IF NOT EXISTS idx_assets_clean_tag
ON assets_clean (tag) WHERE tag IS NOT NULL;
```
Mayoritas row `tag`-nya NULL (belum dialokasikan). Full index akan menyimpan ~4500
entry NULL yang tidak berguna. Partial index hanya mengindex baris ber-tag, hemat
storage dan lebih cepat untuk filter `WHERE tag = 'Allocated'`.

### 3. Implementasi

**Flow data alokasi (end-to-end):**
```
User input kode aset di Rekap Alokasi (onBlur)
→ AllocationCell.persist() → PATCH /api/sj/report
→ route: fetch kode lama dari DB
→ UPDATE surat_jalan_items SET kode_asset, mutasi_oracle_status, mutasi_oracle_at
→ SELECT assets_raw WHERE kode_asset = newKode (lookup raw_id)
→ UPDATE assets_clean SET tag = 'Allocated' WHERE raw_id = rawId
→ Kalau kode berubah: cek apakah kode lama masih dipakai SJ lain
  → Kalau tidak dipakai: UPDATE assets_clean SET tag = NULL (bersihkan)
→ Response: { success: true, tagged: boolean }
→ Client: setAllocOverride(itemId, next) — update lokal tanpa refetch
```

**File yang dibuat/diubah:**
| File | Jenis | Keterangan |
|------|-------|------------|
| `src/app/api/sj/report/route.ts` | Ubah | Tambah PATCH handler |
| `src/app/api/monitoring/route.ts` | Ubah | Tambah field `tag` di SELECT |
| `src/app/api/dashboard/stats/route.ts` | Ubah | Tambah warning counts |
| `src/app/sj/report/page.tsx` | Ubah | AllocationCell + 2 kolom baru |
| `src/app/monitoring/page.tsx` | Ubah | Badge "Allocated" |
| `src/app/page.tsx` | Ubah | Ganti welcome banner → DashboardWarningCards |
| `src/components/dashboard/DashboardWarningCards.tsx` | Baru | 3 warning card |
| `src/hooks/useSJReport.ts` | Ubah | Tambah `kode_asset` di SJReportItem |
| `src/hooks/useMonitoring.ts` | Ubah | Tambah `tag` di MonitoringAsset |
| `src/lib/monitoringExporter.ts` | Ubah | Kolom "Status Alokasi" di Excel |
| `src/lib/sjTypes.ts` | Ubah | Rapikan komentar field alokasi |

**SQL migration:**
```sql
ALTER TABLE assets_clean ADD COLUMN IF NOT EXISTS tag TEXT DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_assets_clean_tag ON assets_clean (tag) WHERE tag IS NOT NULL;
```

### 4. Hasil dan Validasi

- Input kode aset di Rekap Alokasi → badge "Allocated" muncul di Monitoring DAT
  (dikonfirmasi langsung saat testing sesi ini)
- Tag tersimpan di DB (`assets_clean.tag = 'Allocated'`) — bukan state lokal
- Warning card di dashboard menampilkan count real-time dari DB
- Export Excel Monitoring: kolom "Status Alokasi" muncul di sheet "Detail DAT"
- Checkbox dan input disabled untuk barang non-AT (is_aktiva = false)
- `npx tsc --noEmit` bersih tanpa error setelah fix import path

### 5. Trade-off dan Keterbatasan

| Aspek | Kelebihan | Keterbatasan |
|-------|-----------|--------------|
| Tag persist di DB | Tidak perlu JOIN saat query monitoring | Reset saat DAT di-upload ulang (by design) |
| Save onBlur | Hemat request, UX natural | Tidak ada indikator "unsaved changes" eksplisit |
| Local override | Tidak perlu refetch ribuan row | State hilang kalau user refresh halaman |
| Warning count head:true | Sangat ringan, tidak transfer data | Tidak bisa tahu detail row mana yang bermasalah dari dashboard |
| 2-step tag query | Bersih, tidak ada subquery kompleks | 2 round-trip ke DB per save (masih ringan untuk skala ini) |

## Sesi — 10 Juni 2026 (SJ Sesi 4 Lanjutan: Lock Alokasi + Fix Stale Closure)

### Fitur: Lock Alokasi saat Mutasi Confirmed

**Latar belakang:** Setelah kode aset diinput di Rekap Alokasi, perlu ada mekanisme
yang mencegah data diubah kalau mutasi sudah benar-benar terjadi — agar konsistensi
data terjaga.

**Dua kondisi lock:**
- K1 (Lock by DAT): kode aset diinput tapi hilang dari assets_raw setelah upload DAT
  baru → lock permanen, tidak bisa dibatalkan. DAT adalah sumber kebenaran.
- K2 (Lock manual): checkbox mutasi dicentang tanpa kode aset (skenario user konfirmasi
  tanpa tahu kode) → lock tapi ada tombol "batalkan" untuk koreksi false positive.

**Tampilan locked:** teks statis + badge "✓ Dimutasi" (bukan input disabled).
Lebih ringan dan intent lebih tegas sesuai prinsip optimal.

**Guard berlapis:** UI render teks statis (tidak ada input), server tolak PATCH 409
untuk lock by DAT (cegah bypass request langsung).

### Bug Fix: Stale Closure di handleKodeBlur

**Root cause:** `handleKodeBlur` capture `mutasi` dari closure lama. User ketik kode
(mutasi auto-true) → hapus kode → blur → closure baca mutasi=true → persist
`{kode:"", mutasi:true}` → K2 lock aktif tidak sengaja.

**Fix:** Tambah `mutasiRef` yang selalu sync dengan nilai mutasi terkini. Semua handler
baca dari ref, bukan closure. Kode dikosongkan → mutasi selalu reset false.

### File yang Diubah
| File | Perubahan |
|------|-----------|
| `src/app/api/sj/report/route.ts` | Tambah is_mutated di GET, lock guard di PATCH |
| `src/app/sj/report/page.tsx` | Render kondisional locked/unlocked, fix stale closure |
| `src/hooks/useSJReport.ts` | Tambah field is_mutated di type |

## Sesi — 11 Juni 2026 (SJ Sesi 4 Lanjutan: Mutasi WT + Berbagai Fix)

### Fitur & Fix

**1. Kolom Mutasi WT di Rekap Alokasi**
Checkbox independen per item untuk konfirmasi mutasi Web Tracking. Tidak ada relasi
dengan kode_asset atau mutasi Oracle. Behavior: belum dicentang → checkbox normal;
sudah dicentang → badge ungu "✓ WT" + tombol "batalkan" yang hanya muncul saat hover
(hover-reveal pattern). Dipisah sebagai komponen `MutasiWTCell` terpisah dari
`AllocationCell` agar tidak ada coupling antar kolom.

SQL migration:
```sql
ALTER TABLE surat_jalan_items
ADD COLUMN IF NOT EXISTS mutasi_wt_status BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS mutasi_wt_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
```

**2. Fix PATCH overwrite bug**
PATCH handler sebelumnya selalu update semua field (`kode_asset`, `mutasi_oracle_status`,
`mutasi_wt_status`) sekaligus. Akibatnya saat `MutasiWTCell` centang WT tanpa kirim
`kode_asset`, field `kode_asset` ter-overwrite jadi NULL. Fix: conditional update —
hanya update field yang ada di request body.

**3. Hover-reveal "batalkan" di Oracle & WT**
Tombol "batalkan" untuk lock manual Oracle dan WT sebelumnya selalu tampil (jelek secara
UX). Diganti dengan hover-reveal pattern: `opacity-0 group-hover:opacity-100` —
tombol hanya muncul saat user hover di cell. Clean, tidak berantakan.

**4. Rekap Pengiriman Dashboard (dari sesi sebelumnya)**
3 card baru di dashboard menggantikan placeholder:
- Card 1: Progres Mutasi Oracle (progress bar + 3 angka + terlama belum mutasi)
- Card 2: Top 5 Jenis Barang Keluar bulan berjalan (2-step query karena PostgREST
  join filter tidak reliable)
- Card 3: Trend harian item keluar bulan berjalan (bar chart recharts)

**5. Berbagai bugfix Rekap Alokasi**
- Fix stale closure `mutasiRef` di `handleKodeBlur`
- Fix lock bypass reset: izinkan reset `{kode:"", mutasi:false}` bypass K1 lock
- Fix Rules of Hooks: `useMemo` tidak boleh di dalam `.map()`
- Validasi duplikat kode aset client-side (border merah + pesan "kode sudah dipakai")
- Kolom "Baru" (is_baru) ditambah antara SN dan Qty
- Tanggal 2 baris: tanggal + nama hari (derive client-side)

### File yang Diubah
| File | Perubahan |
|------|-----------|
| `src/app/api/sj/report/route.ts` | Fix PATCH conditional update, tambah mutasi_wt |
| `src/app/sj/report/page.tsx` | MutasiWTCell, hover-reveal, kolom Baru, tanggal+hari, duplikat validation |
| `src/hooks/useSJReport.ts` | Tambah `mutasi_wt`, `is_mutated` di type |
| `src/lib/sjTypes.ts` | Tambah `mutasi_wt_status`, `mutasi_wt_at` |
| `src/app/api/dashboard/stats/route.ts` | 3 query rekap pengiriman |
| `src/hooks/useDashboardStats.ts` | Type RekapPengiriman + turunannya |
| `src/components/dashboard/RekapPengirimanCards.tsx` | Baru — 3 card rekap pengiriman |
| `src/app/page.tsx` | Ganti RekapPengirimanPlaceholder → live |
| `src/app/api/process/route.ts` | Re-apply tag Allocated setelah upload DAT |
| `src/lib/excelExporter.ts` | Tambah kolom Kode Aset di export SJ |
| `src/lib/monitoringExporter.ts` | Tambah kolom Status Alokasi di export Monitoring |

# Senin, 15 Juni 2026 (Monitoring v2 + Daftar SJ Arsip)

### Fitur

**1. Daftar SJ — Kolom Arsip**
Checkbox `is_archived` per dokumen SJ (bukan per-item) untuk menandai fisik
kertas sudah diarsipkan. Independen, save via PATCH mode `archive_only`.
Tanggal SJ ditambah baris hari (sama pattern Rekap Alokasi).
Local override (`archiveOverride`) agar state tidak hilang saat pindah pagination.

**2. Monitoring v2 — 3 kolom baru + sortable header**
- **Invoice Number** & **Tanggal Dokumen** — parsed dari DAT TXT (kolom
  "Invoice Number" dan "Tanggal Dokumen"). Tanggal dinormalisasi ke format
  "DD-Mmm-YYYY" dengan heuristic DD vs MM (kalau salah satu bagian >12,
  itu pasti hari; kalau ambigu, default DD/MM standar Indonesia).
- **Catatan** — input bebas per kode_asset, disimpan di tabel baru
  `asset_notes (kode_asset PK, catatan, updated_at)`. Independen dari
  lifecycle DAT — auto-clear hanya saat kode_asset keluar dari CGA (re-evaluasi
  setiap upload DAT, dibandingkan dengan rawIdMap).
- **Kategori Oracle disingkat** — "C - PERALATAN KOMPUTER" → "C" (extract
  sebelum " - " pertama), hemat ruang horizontal untuk 3 kolom baru.
- **Sortable header** — klik kolom: asc → desc → kembali ke default
  (multi-sort Kategori→Jenis→Merk→CGA→Kode). Reset filter juga reset sort.
- **Filter tambahan** — Invoice Number dan Catatan ditambahkan ke filter
  multi-kolom (AND logic), filter Catatan pakai `catatanOverride` sebagai
  source of truth.

### Fix
- RLS policy `asset_notes` belum ada (tabel baru) — replikasi pola
  "Allow all on <table>" (PERMISSIVE, public, ALL, true/true) dari
  `surat_jalan_items`.
- `AssetRecord` type (di `types.ts` dan `xlsxParser.ts`) belum punya
  `invoice_number`/`tanggal_dokumen` — menyebabkan build Vercel gagal
  type-check di 2 file berbeda (`txtParser.ts`, `xlsxParser.ts`).

### Data
- Bulk import 560 baris catatan historis dari Excel ke `asset_notes`
  (filter otomatis: hanya kode_asset yang masih aktif di `assets_raw`).

### File yang Diubah
| File | Perubahan |
|------|-----------|
| `src/app/sj/list/page.tsx` | Kolom Arsip (ArchiveCell) + tanggal+hari |
| `src/app/api/sj/route.ts` | GET tambah is_archived, PATCH mode archive_only |
| `src/hooks/useSJList.ts` | Tambah is_archived di SJListItem |
| `src/lib/txtParser.ts` | parseTanggalDokumen heuristic, mapping invoice_number/tanggal_dokumen |
| `src/lib/types.ts` | AssetRecord +invoice_number +tanggal_dokumen |
| `src/lib/xlsxParser.ts` | Default invoice_number/tanggal_dokumen (legacy parser) |
| `src/app/api/process/route.ts` | Insert field baru + auto-clear asset_notes |
| `src/app/api/monitoring/route.ts` | SELECT field baru, fetch+merge asset_notes, PATCH catatan |
| `src/hooks/useMonitoring.ts` | MonitoringAsset +invoice_number +tanggal_dokumen +catatan |
| `src/app/monitoring/page.tsx` | 3 kolom baru, kategori singkat, sortable header, filter baru |

### Branch
Dikerjakan di branch `fitur-percobaan`, sudah di-merge ke `main`.

# Selasa, 16 Juni 2026 — Fix PDF Signature, Redesign Excel Monitoring & PDF Rekap DAT

### Fix
- **Label & warna signature SJ** — label "Dibawa"/"Diterima" dikonfirmasi
  sudah benar di kode (sempat dikira salah karena versi lama). Warna font
  label signature (Dibuat/Disetujui/Dibawa/Diterima) diubah dari abu-abu
  muted jadi hitam pekat (`#0a0a0a`) + bold — alasan: rawan tertimbun tinta
  stempel/bolpen di kertas fisik. File: `SuratJalanPDF.tsx`.

### Redesign — Excel Export Monitoring (Sheet "Summary")
Diubah total dari flat list (grouping jenis × toko) jadi **3 tabel
side-by-side per CGA** (CGA1 kolom B-G, gap, CGA2 kolom I-N, gap, CGA3
kolom P-U). Masing-masing di-group Kategori Oracle → Jenis dengan kolom
Kategori/Jenis/Item/Qty/Perolehan/Tercatat, ada subtotal per kategori dan
Grand Total per CGA. Kategori tampil lengkap ("C - Peralatan Komputer")
hanya di baris pertama grup. Sheet "Detail DAT" tidak disentuh sama sekali.

Catatan teknis penting: SheetJS community edition (`xlsx` npm package)
TIDAK mendukung cell styling (fill warna, border warna, bold) saat menulis
file — itu eksklusif SheetJS Pro. Keputusan diambil: tetap pakai `xlsx`
tanpa warna (struktur/grouping/merge cell tetap jalan, visual polos).
Sempat ada bug subtotal/grand total label tampil sebagai cell kosong —
root cause: kode baca `row.jenis` (kosong) padahal label disimpan di
`row.kategori`, fixed.

File: `monitoringExporter.ts`.

### Redesign — Export PDF Rekap DAT
- Trigger dipindah dari halaman `/reports` (dihapus) ke tombol baru
  "Export PDF" di halaman Monitoring (sebelah kiri tombol "Export Excel")
- Menu "Reports" dihapus dari Sidebar
- **Page-break per CGA** — setiap CGA render di `<Page>` `@react-pdf/renderer`
  tersendiri (sebelumnya semua CGA digabung jadi 1 halaman panjang)
- **Styling warna per CGA** — header & total toko solid sesuai badge UI
  (CGA1=emerald, CGA2=amber, CGA3=rose), kategori header & subtotal pakai
  versi pudar, row alternate sangat pudar
- API `dat-summary/route.ts` tidak diubah (sudah summary-only by design)

File: `DATSummaryDocument.tsx`, `Sidebar.tsx`, `monitoring/page.tsx`.
Branch: dikerjakan & di-commit mandiri oleh user.

---

# Rabu, 17 Juni 2026 — Fix Kritis asset_notes, Fix Pagination PDF SJ, Fitur Template Item

### Fix Kritis — Auto-clear `asset_notes` menghapus SEMUA catatan
**Laporan bug:** setelah reupload DAT terbaru, seluruh catatan di tabel
Monitoring hilang dan `asset_notes` di DB jadi kosong total.

**Root cause:** `UploadSection.tsx` mengirim `POST /api/process` **per
batch** (500 rows/batch via `batchProcessor.ts`, konfirmasi: 10 batch untuk
4563 row dari Network tab). Step auto-clear `asset_notes` & re-apply tag
"Allocated" di `api/process/route.ts` berjalan **di setiap batch**,
membandingkan terhadap `rawIdMap` yang cuma berisi kode_asset dari batch
itu sendiri (~456 row), bukan keseluruhan upload. Batch pertama datang →
hampir semua `asset_notes` salah dianggap "stale" (aset sudah keluar CGA)
→ terhapus. Berulang tiap batch sampai semua catatan habis.

**Fix:**
- `batchProcessor.ts` — kirim `batchIndex`, `totalBatches`, `isLastBatch`
  di payload setiap request batch
- `api/process/route.ts` — step re-apply tag Allocated & auto-clear
  `asset_notes` **hanya jalan saat `isLastBatch === true`**, dan di titik
  itu query ulang **seluruh** `assets_raw.kode_asset` dari DB (bukan
  `rawIdMap` parsial) — perbandingan "stale" jadi akurat karena semua
  batch sebelumnya sudah commit ke DB
- Bonus: re-apply tag Allocated jadi lebih efisien (1x di akhir dengan
  data lengkap, bukan 10x dengan data parsial yang sebagian besar sia-sia)

**Verifikasi:** user re-import 560 catatan historis (SQL `import-catatan.sql`
lama), lalu reupload DAT — catatan tetap ada, fix dikonfirmasi berhasil.

**Data loss:** semua `asset_notes` (560 bulk import + catatan manual)
terhapus akibat bug ini sebelum fix diterapkan. Bulk import sudah direstore
manual oleh user; catatan manual yang ditambah setelah bulk import dan
sebelum bug terjadi tidak bisa direstore.

### Fix — PDF Surat Jalan Pagination
**Laporan bug:** SJ dengan 23 item, hasil PDF rusak — header & info
pengiriman muncul sendirian di halaman 1, seluruh tabel (23 baris) pindah
ke halaman 2.

**Root cause:** react-pdf gagal melakukan page-break otomatis di tengah
tabel besar — alih-alih memecah tabel di titik yang tepat, seluruh block
tabel "all-or-nothing" dipindah ke halaman berikutnya kalau tidak cukup
ruang di halaman saat ini.

**Fix:** manual pagination — items di-chunk maksimal **15 item per
halaman** (`ITEMS_PER_PAGE = 15`). Tiap chunk di-render sebagai `<Page>`
tersendiri dengan header surat lengkap (logo, No SJ, Tanggal, Kepada Yth,
intro text) dan header tabel diulang di setiap halaman. Total Item/Qty dan
signature (Dibuat/Disetujui/Dibawa/Diterima) hanya dirender di **halaman
terakhir**. Kalau total item ≤15, tetap 1 halaman seperti sebelumnya.

File: `SuratJalanPDF.tsx`.

### Fitur Baru — Template Item Surat Jalan
User bisa menyimpan kombinasi item yang sering berulang (contoh: template
"SDN" isi CPU Zyrex + Printer Thermal Epson + Gun Scanner Honeywell) dan
menerapkannya saat membuat/edit SJ. Item template ditambahkan ke bawah
item yang sudah diisi user (baris kosong di-skip), urutan auto-renumber.

**Skema DB:** single table + JSONB (bukan relasional) — `sj_item_templates
(id, nama UNIQUE, items jsonb, created_at)`. Alasan: template selalu
dipakai utuh, tidak pernah query item individual, jadi 1 baris = 1 query
tanpa join, sesuai prinsip arsitektur (DB ringan, minimize join).
`serial_number` TIDAK disimpan di template (unik per unit fisik),
dikosongkan saat template diterapkan untuk diisi manual. Template bersifat
**shared** — semua user lihat & pakai sama, sesuai konfirmasi user.

**Implementasi:**
- `sjTypes.ts` — tipe `SJTemplateItem`, `SJItemTemplate`, helper
  `toTemplateItem`/`fromTemplateItem`
- `api/sj/templates/route.ts` — GET (list)/POST (create)/DELETE (by id)
- `useSJMaster.ts` — hook baru `useSJTemplates` (pola sama `useMasterTujuan`)
- `sj/templates/page.tsx` — halaman baru kelola template: buat (reuse
  `SJItemsTable` untuk editor item, SN diabaikan saat simpan) + hapus,
  daftar template tampil sebagai cards dengan preview item
- `Sidebar.tsx` — menu baru "Template Item" di dropdown "Surat Jalan Manual"
- `sj/buat/page.tsx` — komponen `TemplatePicker` (dropdown ungu) di header
  "Detail Barang", handler `handleApplyTemplate` (filter baris kosong →
  append item template → renumber urutan)

**Pending (next session):** posisi tombol "Pakai Template" dipindah ke
sebelahan tombol "Tambah Baris" (saat ini di header section, bukan di
footer tabel bersama "Tambah Baris").

### Lain-lain
- Fix environment: error `Cannot find native binding` (`@tailwindcss/oxide`)
  di Codespace baru — resolved via `rm -rf node_modules package-lock.json
  && npm install`. Bug npm dependency, tidak terkait kode SmartWMS.

# Kamis, 18 Juni 2026 — LPP Web Tracking Reconciliation (Tahap 1-3) — THESIS CORE

Mulai implementasi fitur inti skripsi: bandingkan data DAT Oracle dengan
LPP Web Tracking untuk mendeteksi selisih administrasi mutasi aset antar
cost center (CGA1/CGA2/CGA3).

### Konfirmasi scope sebelum eksekusi
- Upload 3 file LPP (.xls per CGA) sekaligus dalam 1 dropzone, CGA
  auto-detect dari nama file (bukan 3 dropzone terpisah)
- Kondisi 3 "Aset Intransit" ditunda — belum ada file "Report Intransit",
  fokus dulu ke kondisi 1, 2, 4, 5 yang bisa dihitung dari DAT+LPP saja
- Strategi upload LPP: full replace (delete-then-insert), sama seperti DAT
- Hasil reconciliation ditampilkan di 2 tempat: tab "LPP Monitoring" (raw
  data) dan halaman baru `/reconciliation` (hasil 4 kondisi)
- Integrasi auto-lock Mutasi WT dari LPP — **ditunda**, dikerjakan di sesi
  terpisah nanti setelah reconciliation core stabil

### Analisis file sample LPP
User upload `LPP_CGA1.xls` — ternyata file ini **HTML table** dengan
ekstensi `.xls` (bukan Excel biner), pola umum sistem reporting web lama.
Strategi parsing jadi lebih simpel dari DAT: cukup `DOMParser`, tidak perlu
SheetJS. Validasi terhadap file asli (via jsdom): 2690/2690 baris terparse
sempurna, 0 skip, tidak ada duplikat `No Aktiva`, kolom `Saldo Awal` selalu
0 dan `Keluar` selalu 0 (representasi snapshot aset yang ADA saat ini di
CGA tersebut — cukup cek presence by kode_asset untuk reconciliation).

### Tahap 1 — Schema, Parser, Upload Pipeline
- `lpp_raw` table: `kode_asset`, `toko` (CGA1/2/3, bersih), `deskripsi`,
  `saldo_awal`/`masuk`/`keluar`/`saldo_akhir`, `uploaded_at` + index
- `lppParser.ts` — parse HTML-table-as-.xls, `detectCGAFromFilename()`
  (regex `CGA[123]` case-insensitive), validasi duplikat CGA antar file
- `lppBatchProcessor.ts` — mirror `batchProcessor.ts` (DAT), termasuk
  pola `batchIndex`/`totalBatches`/`isLastBatch` (pelajaran dari fix
  kritis asset_notes 17 Juni — mencegah kelas bug yang sama)
- API `/api/lpp/clear` (DELETE semua) + `/api/lpp/process` (batch insert)
- UI `UploadLPPSection.tsx` — drag 3 file sekaligus, preview badge CGA per
  file sebelum proses, progress bar, di halaman Upload Data (ganti card
  "Upload LPP Update" yang sebelumnya "Coming Soon")

User test: 3 file (CGA1/2/3) berhasil diupload, **4690 records** masuk
ke `lpp_raw` di Supabase.

### Tahap 2 — LPP Monitoring Tab
- API `GET /api/lpp/monitoring` — fetch semua `lpp_raw` (pagination loop,
  sama pola dengan `dat-summary`)
- Hook `useLPPMonitoring` (di `useMonitoring.ts`)
- Tab "LPP Monitoring" di halaman Monitoring (sebelumnya empty state)
  sekarang fungsional: filter Cost Center (ALL/CGA1/CGA2/CGA3), search
  kode_asset/deskripsi, tabel (No, Kode Aset, Deskripsi, CGA badge, Saldo
  Awal, Masuk, Saldo Akhir), pagination — state terpisah dari tab DAT

User feedback: awalnya minta 4 summary card juga (Total Kode Aset, Total
Saldo Awal, Total Masuk, Total Saldo Akhir) mengikuti pattern tab DAT —
ditambahkan, mengikuti filter yang aktif.

### Tahap 3 — Reconciliation Engine
**Logic 4 kondisi** (kondisi 3 "Aset Intransit" belum aktif):

| # | DAT | LPP | Status | Aksi |
|---|---|---|---|---|
| 1 | Ya | Ya | Fisik di CGA | Normal |
| 2 | Ya | Tidak | Belum Mutasi Oracle | Warning — mutasi Oracle |
| 4 | Tidak | Ya | Belum Mutasi WT | Warning — buat SJ WT |
| 5 | Tidak | Tidak | Fisik Allocated | Normal, sudah keluar CGA |

Universe pembanding untuk kondisi 5 dibatasi ke kode_asset yang PERNAH
tercatat di sistem (union `assets_raw` ∪ `lpp_raw` ∪
`surat_jalan_items.kode_asset`) — bukan literal seluruh kode aset yang
mungkin ada (tidak terbatas kalau diambil mentah). Logic diverifikasi
dengan dummy data sebelum implementasi (4 skenario kode_asset, hasil
sesuai matrix).

- API `GET /api/reconciliation` — fetch `assets_raw` + `lpp_raw` +
  `surat_jalan_items` secara paralel, build Map per sumber, hitung
  kondisi per kode_asset di universe, return summary count + items array
- Hook `useReconciliation`
- Halaman baru `/reconciliation` — 4 summary card (klik untuk filter),
  filter Cost Center + search, tabel hasil dengan badge kondisi
- Menu baru "Reconciliation" di Sidebar (antara Monitoring dan
  Classification)

### Bug ditemukan & fixed — Badge CGA tampil teks panjang
**Laporan bug** (dari screenshot): kolom "CGA" di tabel reconciliation
menampilkan teks panjang "CGA1 – Cadangan General Affairs 1" yang wrap
jadi 3 baris, bukan badge bersih "CGA1".

**Root cause:** `assets_raw.toko` (DAT) menyimpan label lengkap dari
Oracle, BUKAN kode singkat — beda dengan `lpp_raw.toko` yang sudah bersih
("CGA1"/"CGA2"/"CGA3", diekstrak dari nama file saat upload). Pattern ini
sebenarnya sudah pernah ditangani di tempat lain (`monitoringExporter.ts`
punya helper `extractCGACode()`), tapi belum diterapkan di
`reconciliation-route.ts` — toko DAT mentah langsung di-assign ke field
`toko` untuk kondisi 1 & 2, lolos ke `CGA_BADGE` lookup di client (yang
cuma punya key "CGA1"/"CGA2"/"CGA3"), tidak match, fallback nampilin
string mentah.

**Fix:** tambah helper `extractCGACode()` (regex `CGA\d`) di
`reconciliation-route.ts`, diterapkan saat build `datMap` — semua
downstream (kondisi 1 & 2) otomatis pakai kode singkat, konsisten dengan
LPP.

### Git workflow — branch terpisah
User mengerjakan ini di GitHub Codespace, khawatir kehilangan progress
kalau session berakhir sebelum sempat commit. Solusi: buat branch baru
`feature/reconciliation`, commit dengan message sementara ("commit
sementara : proses reconciliation belum selesai..."), push ke remote.
**Belum di-merge ke `main`.**

**Rencana lanjutan** (dikonfirmasi dengan user):
1. Apply fix badge CGA di branch `feature/reconciliation`
2. Amend commit message jadi proper (pakai `git commit --amend`)
3. Force-push dengan `--force-with-lease` (lebih aman dari `--force` polos)
4. Test ulang halaman `/reconciliation`
5. Merge ke `main` (`--ff-only` karena cuma 1 commit di branch)
6. Hapus branch `feature/reconciliation` setelah merge sukses

### Pending untuk sesi berikutnya
- Eksekusi langkah git di atas (amend, force-push, merge ke main)
- Integrasi Mutasi WT otomatis dari LPP (auto-lock checkbox di Rekap Alokasi)
- Kondisi 3 "Aset Intransit" — tunggu file Report Intransit
- Aktivasi Dashboard Baris 2 (DAT vs LPP per CGA), bisa reuse summary count
- Konfirmasi: kondisi 2 (SJ WT dibuat tapi belum BTB) — actionable warning
  atau informational saja (BTB kewenangan toko tujuan)
- Export Excel/PDF untuk hasil reconciliation (belum ada)

## 18 Juni 2026 (lanjutan) — Fix Kritis: Pagination Row-Limit di Auto-clear asset_notes

### Laporan bug
User update beberapa catatan di tabel Monitoring (10 catatan di 10
kode_asset berbeda, hasil pencarian "DVR"), refresh — masih ada (jadi
sudah masuk DB). Reupload DAT — setelah itu cuma 2 dari 10 catatan yang
selamat. Dikonfirmasi kode_asset terkait masih muncul normal di Monitoring
DAT (jadi bukan auto-clear yang benar/legit — asetnya tidak keluar CGA).

### Investigasi
File DAT yang diupload: 4666 baris, 10 batch. Fix kritis 17 Juni (skip
auto-clear kecuali `isLastBatch`, query ulang `assets_raw` saat batch
terakhir) sudah benar diterapkan — dikonfirmasi masih ada di kode saat
file diupload untuk dicek. Jadi ini BUKAN regresi dari fix 17 Juni,
melainkan bug baru yang sebelumnya tidak ketauan.

### Root cause
Step 7 (auto-clear `asset_notes`) di `api/process/route.ts`:
```js
const { data: allRawKodes } = await supabase
  .from('assets_raw')
  .select('kode_asset')
```
Query ini **tidak pakai `.range()` / pagination**. Supabase PostgREST
punya limit default **1000 baris per query** — query tanpa pagination
diam-diam truncate ke 1000 baris pertama TANPA error. Dengan DAT 4666
baris, query ini cuma dapat ~1000 kode_asset (urutan dari Postgres, bukan
urutan tertentu yang predictable), bukan semua 4666. Akibatnya 3666
kode_asset valid lainnya salah dianggap "tidak ada di DAT" — kalau ada
catatan di kode_asset yang kebetulan jatuh di luar 1000 yang ke-fetch,
catatan itu ikut dihapus sebagai "stale".

Simulasi node mengkonfirmasi: query lama dapat 1000/4666 baris (3666
hilang dari pembanding), query dengan pagination loop dapat semua
4666/4666 dalam 5 iterasi (`FETCH_SIZE=1000`).

Step 6 (re-apply tag "Allocated") punya celah serupa secara prinsip —
`.in('kode_asset', allocatedKodes)` bisa kena limit yang sama kalau hasil
match-nya >1000 baris (belum terjadi karena jumlah aset teralokasi masih
di bawah situ, tapi berpotensi seiring data bertambah).

### Fix
- Tambah helper `fetchAllKodeAsset()` — pagination loop (`.range()`,
  `FETCH_SIZE=1000`, sama pola dengan `dat-summary` & `lpp/monitoring`
  yang sudah benar dari awal) — dipakai di step auto-clear `asset_notes`
- Step re-apply tag Allocated: query `.in()` di-chunk per 200 kode_asset
  (bukan 1 query besar) — hasil match per chunk otomatis jauh di bawah
  limit 1000, jadi tidak ada kemungkinan ke-truncate sama sekali
- Update komentar kode supaya jelas KENAPA pagination wajib di sini

File: `api/process/route.ts`.

### Rule baru ditambahkan ke project_context.md
**WAJIB pagination loop untuk query tabel apapun yang potensial >1000
baris.** Ini bukan cuma soal `assets_raw` — berlaku untuk tabel besar
manapun di masa depan. Ditambahkan ke Coding Standards sebagai reminder
permanen, supaya kelas bug ini tidak terulang lagi di kode baru.

### Data loss
8 dari 10 catatan yang hilang sudah terhapus dari DB sebelum fix
diterapkan — tidak ada cara recover otomatis. User perlu input ulang
manual kalau masih ingat isinya.

### Verifikasi
User konfirmasi fix bekerja — test dengan catatan tersebar di halaman
awal/tengah/akhir Monitoring (PAGE_SIZE=30, ±156 halaman untuk 4666 aset),
reupload DAT, semua catatan utuh.

## 18 Juni 2026 (lanjutan) — Aktivasi Dashboard Baris 2 + Deep-link Reconciliation

### Konteks
User menunjukkan screenshot Dashboard, Baris 2 (Rekonsiliasi DAT vs LPP)
masih placeholder "Coming Soon". Karena reconciliation engine sudah ada
(Tahap 3, lihat entry sebelumnya), tinggal diaktivasi pakai data yang sama.

### Penemuan tooling penting: akses repo langsung via git clone
Sebelum mulai, user tanya cara biar Claude bisa baca struktur repo
terupdate tanpa upload manual tiap kali. Dicoba `git clone` ke repo user
(`github.com/iyunn/smart-warehouse-management-system`) — **berhasil**,
karena repo ternyata **public** (dikonfirmasi via GitHub API:
`private: false`). User skeptis ("gimana aku tau kamu clone repo ku?"),
dibuktikan dengan menampilkan `git remote -v` + `git log` — commit
message-nya match persis dengan kerjaan yang sudah didiskusikan
sepanjang sesi (fix pagination, LPP reconciliation, dst), jadi praktis
mustahil itu repo yang salah.

**Implikasi workflow ke depan**: Claude bisa `git clone` repo langsung
(read-only) untuk baca file terbaru tanpa minta upload manual. User tetap
yang jalankan `git add/commit/push` manual (rule lama tidak berubah).
Disimpan ke memory permanen biar sesi berikutnya tidak perlu re-discover.

**Catatan keamanan**: user diberi tahu repo-nya public — kalau ada secret/
API key yang ke-commit, perlu dicek & di-rotate.

### Implementasi Dashboard Baris 2
- Baca `src/app/page.tsx`, `src/hooks/useReconciliation.ts`,
  `src/components/dashboard/CGASummaryCards.tsx` langsung dari clone
  (tidak ada upload manual sama sekali untuk tahap ini)
- Komponen baru `DATvsLPPCards.tsx` — self-contained, panggil
  `useReconciliation()` sendiri (reuse, tidak ada API baru). Breakdown per
  CGA dihitung client-side dari `items`: filter `toko === code`, lalu
  hitung Total DAT (kondisi 1+2), Total LPP (kondisi 1+4)
- `page.tsx` — ganti `<DATvsLPPPlaceholder />` jadi `<DATvsLPPCards />`
- `PlaceholderCards.tsx` — hapus export `DATvsLPPPlaceholder` (dead code)

### Bug konseptual ditemukan oleh user — desain ulang "Selisih"
Versi pertama nampilin 1 angka "Selisih" = `Total DAT - Total LPP`.
User tanya: "2.675 - 2.690 = 15, kok beda sama yang ditampilkan (371)?"

**Root cause bukan bug kode, tapi salah desain konseptual.** Breakdown
sebenarnya:
- Total DAT = Kondisi 1 + Kondisi 2
- Total LPP = Kondisi 1 + Kondisi 4
- "Selisih" yang ditampilkan = Kondisi 2 + Kondisi 4 (gabungan dua
  masalah berbeda), BUKAN `Total DAT - Total LPP` (yang secara matematis
  = Kondisi 2 - Kondisi 4, bisa saling meniadakan kalau kedua angka besar
  dan berdekatan)

Contoh kasus asli (CGA1): Kondisi 2 ≈ 178 (Belum Mutasi Oracle), Kondisi 4
≈ 193 (Belum Mutasi WT). Subtraksi: 178-193 = -15 (kelihatan kecil/tidak
masalah). Penjumlahan (yang benar): 178+193 = 371 aset yang SEBENARNYA
butuh tindakan. Subtraksi naive menyembunyikan ~356 aset bermasalah karena
dua masalah berbeda itu kebetulan saling mendekati secara jumlah.

**Fix**: card di-redesign — tampilkan **4 angka terpisah** (Total DAT,
Total LPP, Belum Mutasi Oracle, Belum Mutasi WT), tidak pernah digabung
jadi 1 angka "selisih" lagi. Ini prinsip desain yang harus diingat untuk
fitur reconciliation manapun ke depan: kondisi yang berlawanan arah JANGAN
dikurangi, harus ditampilkan terpisah atau dijumlah (kalau memang representasi
"total butuh tindakan" yang diinginkan).

### Fitur tambahan — Deep-link Dashboard → Reconciliation
User minta: angka selisih (sekarang 2 angka: Belum Mutasi Oracle/WT) bisa
diklik, langsung ke data detailnya.

**Implementasi:**
- `DATvsLPPCards.tsx` — angka jadi `<Link href="/reconciliation?kondisi=2&cga=CGA1">` (atau `kondisi=4` untuk WT)
- `reconciliation/page.tsx` — tambah `useSearchParams`, baca `kondisi` &
  `cga` dari URL di `useEffect` (sekali saat mount), pre-apply ke state
  filter (`activeKondisi`, `cga`) yang sudah ada
- Karena `useSearchParams` butuh `Suspense` boundary di Next.js App
  Router, komponen utama di-rename `ReconciliationPageContent`, dibungkus
  `<Suspense>` di default export `ReconciliationPage` — pattern yang sama
  dipakai di `sj/buat/page.tsx` (sudah established sebelumnya)

User tanya apakah ini konflik dengan mekanisme existing — dikonfirmasi
tidak, karena pattern Suspense+useSearchParams sudah established
sebelumnya, dan filter state tetap `useState` biasa (cuma diinisialisasi
dari URL sekali di awal, behavior manual filter tidak berubah).

### Update dokumentasi & memory
- `project_context.md`: Dashboard Baris 2 dipindah dari "Known Issues
  placeholder" ke "Completed", lesson learned soal Selisih didokumentasikan
  lengkap (penting supaya tidak terulang di fitur reconciliation lain),
  drill-down limitation diupdate (partial resolved — Dashboard→Reconciliation
  ada, Reconciliation→aksi belum)
- Memory permanen: tambah catatan repo public + cara akses via git clone

### Pending untuk sesi berikutnya (prioritas dikonfirmasi user)
1. **3 gap teknis Reconciliation** (freshness indicator, cross-CGA
   mismatch, aging/durasi tracking) — explicit confirmed sebagai next
2. Integrasi Mutasi WT otomatis (ditunda sejak awal)
3. Kondisi 3 Aset Intransit (butuh file)
4. Drill-down dari tabel Reconciliation ke aksi langsung (Buat SJ WT)

## 18 Juni 2026 (lanjutan) — Freshness Indicator DAT & LPP pindah ke Sidebar

### Konteks
User meminta freshness indicator (kapan DAT & LPP terakhir diupload) dipindah
ke Sidebar supaya terlihat di semua halaman tanpa harus buka halaman Reconciliation.
Sekaligus menghapus DataStatusCards dari Dashboard karena info sudah ada di Sidebar.

### Proses
Sempat diimplementasi sebagai FreshnessBanner di halaman Reconciliation (3 file:
`reconciliation-route.ts` + `useReconciliation.ts` + `reconciliation-page.tsx`)
dalam sesi sebelumnya. User sudah apply ke lokal tapi belum push ke remote.
Keputusan: pindah ke Sidebar supaya lebih persistent. 3 file reconciliation
di-revert ke versi sebelum FreshnessBanner, digantikan pendekatan Sidebar.

### Implementasi
- API baru `/api/freshness` — 2 query ringan (MAX uploaded_at dari `assets_raw`
  dan `lpp_raw`), pakai `.maybeSingle()` bukan `.single()` agar tidak throw
  error kalau tabel kosong (pelajaran dari bug `.single()` sebelumnya)
- `Sidebar.tsx` — hook `useFreshness()` inline, fetch `/api/freshness` sekali
  saat mount. Widget "DAT Update" + "LPP Update" di atas user profile block,
  hanya muncul saat sidebar tidak collapsed. Format: `18 Jun 2026 10:30`
- `src/app/page.tsx` (Dashboard) — hapus import `DataStatusCards` dan blok
  JSX "Baris 1: Status Data" — info sudah ada di Sidebar, jadi redundant

### Catatan teknis
- File reconciliation (route, hook, page) di-revert ke versi remote yang bersih
  (tanpa FreshnessBanner) karena user sudah apply lokal tapi belum push
- `.maybeSingle()` vs `.single()` — penting: `.single()` throw error kalau
  0 baris, `.maybeSingle()` return null dengan aman. Gunakan `.maybeSingle()`
  untuk query yang mungkin return 0 baris (tabel baru/kosong)


# 19 Juni 2026 — Cross-CGA Mismatch (Kondisi 6) + Skip Aging Tracking

### Fitur: Cross-CGA Mismatch Detection (Kondisi 6)

Engine reconciliation sebelumnya hanya cek presence (ada/tidak ada
by kode_asset), tidak cek konsistensi CGA. Aset yang ada di DAT CGA1
tapi di LPP tercatat CGA2 dianggap Kondisi 1 "normal" — padahal itu
selisih administrasi yang perlu investigasi.

**Fix:** Kondisi 1 dipecah jadi 2 kasus:
- CGA sama di DAT dan LPP → tetap Kondisi 1 (normal)
- CGA BEDA → Kondisi 6 "Mismatch CGA" (warning, badge ungu)

**Perubahan teknis:**
- `reconciliation-route.ts` — cek `dat.toko === lpp.toko` saat keduanya ada.
  Field baru `tokoLPP: string | null` di ReconItem, hanya diisi untuk K6.
  Summary tambah `kondisi6: 0`
- `useReconciliation.ts` — update `ReconciliationItem` (tambah `tokoLPP?`,
  `kondisi: 1|2|4|5|6`) dan `ReconciliationSummary` (tambah `kondisi6`)
- `reconciliation-page.tsx` — tambah Kondisi 6 ke KONDISI_CONFIG (label
  "Mismatch CGA", warna ungu), grid summary card jadi `md:grid-cols-5`,
  kolom CGA di tabel untuk K6 tampilkan `[CGA1] → [CGA2]` (DAT → LPP
  via dua badge warna masing-masing + arrow), URL param deep-link support
  `kondisi=6`

Logic diverifikasi via node simulasi — A2 dengan DAT:CGA1/LPP:CGA2
terdeteksi K6 dengan `tokoLPP:"CGA2"`, semua kondisi lain tidak terpengaruh.

### Keputusan: Skip Aging/Durasi Tracking

Gap teknis terakhir (aging = catat sejak kapan aset stuck di K2/K4)
diputuskan **tidak perlu diimplementasi** setelah diskusi:
- Tim pengguna kecil (1-2 admin GA) yang tau konteks sendiri
- Upload DAT & LPP tidak terjadwal rutin (ad-hoc), jadi angka aging
  misleading dan tidak actionable
- Yang penting untuk admin GA: ada/tidaknya selisih, bukan berapa hari
- Untuk laporan TA: bisa disebutkan sebagai "future enhancement" tanpa
  diimplementasi — tidak mempengaruhi kelengkapan core feature

### Known Limitations Reconciliation — Status Final
- ✅ Freshness indicator → di Sidebar
- ✅ Cross-CGA mismatch → Kondisi 6
- ~~Aging/durasi tracking~~ → SKIP (keputusan final)
- ⏳ Drill-down tabel → aksi langsung (belum dikerjakan)

### Catatan Workflow
Ditemukan bahwa Codespace URL 404 sering terjadi karena port forwarding
timeout (bukan error kode). Solusi: klik kanan port 3000 di tab "Ports"
VS Code → "Open in Browser". Memory dan `chat-rule.md` diupdate untuk
catat bahwa Fillian SELALU bekerja di Codespace (bukan mesin lokal),
sehingga perubahan yang di-apply di Codespace tidak terlihat Claude
sampai di-push ke remote.

# 19 Juni 2026 (lanjutan) — Import SJ WT dari PDF + Storage Analysis + chat-rule.md

### Fitur: Import Surat Jalan Web Tracking dari PDF

User meminta fitur agar PDF SJ WT bisa di-upload → SmartWMS otomatis buat
SJ record + isi kode_asset di Rekap Alokasi (WT tidak punya fitur autorecap).

**Tantangan parsing PDF:**
pdfjs-dist mengekstrak teks per "text run" PDF. Setiap kolom tabel dan label
field menjadi item terpisah. "1 Baik" tersplit jadi "1" dan "Baik". Header
tabel tersplit per kolom (bukan 1 baris utuh). Debugging dilakukan dengan
console.log raw text di browser untuk lihat struktur asli.

**Solusi parser (dual-mode):**
- `fullText` (join spasi) untuk header regex — Tujuan, Tanggal, Pembawa, No SJ
- `lines` (join newline) untuk deteksi kode_asset — TIDAK pakai header tabel,
  langsung cari kode_asset pertama (`/^[A-Z]\d{2}\.\d+$/`) sebagai anchor
- Kondisi: cari baris `/^\d{1,2}$/` (angka saja), bukan "1 Baik" satu baris

**pdfjs-dist version saga:**
- v6 (latest): gagal dengan `Promise.withResolvers` dan `Promise.try` (ES2024,
  belum ada di Codespace Node.js)
- v3.11.174: error `canvas` module karena Next.js SSR coba bundle Node.js code
- Fix canvas: `dynamic({ ssr: false })` di upload page — cukup, tidak perlu
  webpack externals (yang malah konflik dengan Turbopack Next.js 16)
- Worker: copy ke `public/pdf.worker.min.js` (CDN tidak reliable di Codespace)

**Files:**
- `src/lib/wtSJParser.ts` — parser dengan dual-mode
- `src/app/api/sj/import-wt/route.ts` — lookup/auto-create tujuan, generate
  No SJ SmartWMS, insert surat_jalan + items (kode_asset + mutasi_wt_status=true)
- `src/components/UploadWTSJSection.tsx` — drag PDF → preview modal → submit
- `src/app/upload/page.tsx` — section baru "Surat Jalan Web Tracking"
- `public/pdf.worker.min.js` — worker file pdfjs-dist

**Pending:** card "Import SJ WT Bulk" (Coming Soon) perlu dipindah ke bawah
supaya card Import SJ WT bisa full-width (keterangan overflow card saat ini).

### Supabase Storage Analysis

Dilakukan karena user khawatir soal limit 500MB Supabase free plan.
Total saat ini: ~4MB (0.8%). Tabel full-replace tidak bertumbuh. Tabel
akumulasi (sj*, asset_notes, keyword_rules) tumbuh ~117KB/bulan.
Risiko nyata: pause proyek setelah 7 hari tidak aktif — lebih kritis untuk
demo TA daripada storage limit. Future re-struktur: fokus ke surat_jalan*
kalau data sudah ribuan (archiving/soft-delete strategy).
Disimpan ke memory Claude dan didokumentasikan di Known Issues.

### docs/chat-rule.md

File baru ditambahkan ke repo: panduan cara kerja antara Fillian & Claude/AI
lain, berisi: session startup protocol (baca project_context.md dulu), cara
baca repo via curl (hemat token vs git clone), Codespace workflow notes (bukan
mesin lokal, port timeout bukan code error), Supabase row-limit reminder, dan
checklist sebelum present file ke user.

# 20 Juni 2026 — Export Excel Reconciliation + Fitur Barang Masuk/Penerimaan Barang

### Export Excel Hasil Reconciliation

Melengkapi fitur reconciliation yang sudah ada — satu-satunya yang kurang
adalah output file untuk dibawa ke luar sistem (laporan ke atasan, dll).

**Implementasi:**
- `src/lib/reconciliationExporter.ts` (new) — 3 sheet:
  - Ringkasan: count + persentase per kondisi, breakdown Total DAT/LPP/Selisih
    per CGA dari SEMUA data (tidak dipengaruhi filter aktif di layar)
  - Detail: item sesuai filter aktif di layar (kondisi + CGA yang dipilih),
    termasuk info filter di header sheet
  - Perlu Tindakan: khusus Kondisi 2/4/6 dari seluruh data + kolom "Aksi
    Diperlukan" yang eksplisit per kondisi
- `src/app/reconciliation/page.tsx` — tambah tombol "Export Excel" (emerald)
  di kanan atas, `handleExport` useCallback diletakkan SETELAH `filtered` dan
  `paginated` declaration (bug awal: diletakkan sebelum — `filtered used before
  declaration` error TypeScript)

---

### Fitur Barang Masuk / Penerimaan Barang

Mekanisme baru untuk mencatat barang yang kembali dari toko ke CGA (return/
tarikan). Menghasilkan dokumen "Surat Penerimaan Barang".

**Keputusan desain:**
- Extend `surat_jalan` (bukan tabel baru) karena ditampilkan dalam 1 tabel
  rekap alokasi yang sama
- Kolom `jenis` ('keluar'|'masuk', DEFAULT 'keluar') — backward compatible
  100%, semua SJ existing otomatis jadi 'keluar' tanpa update data
- Barang gaib (tidak diketahui kode_asset): kode_asset dikosongkan, keterangan
  diisi manual — tidak butuh flag khusus
- Nomor dokumen: tetap format `SJ-Manual/CGA/...` (beda di jenis field)

**Tahap 1 — Fondasi:**
- SQL migration: `ALTER TABLE surat_jalan ADD COLUMN jenis TEXT NOT NULL
  DEFAULT 'keluar' CHECK (jenis IN ('keluar', 'masuk'))`
- `sjTypes.ts`: tambah `JenisSJ` type + field `jenis` ke `SuratJalan`,
  tambah `kode_asset?` ke `SJItemForPDF` (dibutuhkan `SuratPenerimaanPDF`)
- `useSJList.ts`: tambah `jenis` ke `SJListItem`
- `api/sj/route.ts`: handle `jenis` di POST/PATCH/GET (select `jenis` di list)

**Tahap 2 — Form Penerimaan:**
- `src/app/sj/masuk/page.tsx`: form mirip `/sj/buat` tapi semantik berbeda —
  "Asal Toko" (bukan Tujuan), "Pengirim" (bukan Pembawa), penerima auto
  "Admin GA", tidak ada mode Draft, POST dengan `jenis: 'masuk'`. Aksen
  warna emerald (beda dari SJ keluar yang cyan)
- `Sidebar.tsx`: tambah menu "Penerimaan Barang" di group "Surat Jalan Manual"

**Tahap 3 — PDF + UI:**
- `SuratPenerimaanPDF.tsx`: PDF portrait (bukan landscape seperti SJ keluar),
  aksen emerald, kolom Kode Aset di tabel, tanda tangan pengirim = nama yang
  diinput (bukan placeholder)
- `sjPdfHelpers.ts`: semua fungsi (generate/download/print) terima parameter
  `jenis` opsional, auto-pilih PDF yang tepat. Backward compatible — default
  'keluar'
- `SJPreviewModal.tsx`: prop `jenis` opsional (default 'keluar'), diteruskan
  ke helpers
- `sj/list/page.tsx`: badge `↑ Keluar` (cyan) / `↓ Masuk` (emerald) di
  kolom baru, header "Tujuan / Asal"
- `hooks/useSJReport.ts`: tambah `jenis_sj: 'keluar'|'masuk'`
- `api/sj/report/route.ts`: select `jenis` dari surat_jalan, return sebagai
  `jenis_sj`
- `sj/report/page.tsx` (Rekap Alokasi): no_sj emerald kalau masuk, cyan
  kalau keluar
- `excelExporter.ts`: kolom baru "Masuk/Keluar" setelah No. SJ di export Excel

**Revisi setelah test:**
1. PDF portrait (bukan landscape)
2. Nama pengirim di tanda tangan = `data.pembawa` (nama yang diinput)
3. Teks: "Barang di atas telah diterima oleh pihak kami" (bukan "kondisi baik
   oleh pihak CGA/GA")
4. Warna no_sj hijau di Rekap Alokasi untuk jenis masuk
5. Kolom Masuk/Keluar di Excel export Rekap Alokasi

**Bug fix selama development:**
- `SuratPenerimaanPDF.tsx`: error `Property 'kode_asset' does not exist on
  type 'SJItemForPDF'` — fix dengan menambah `kode_asset?: string` ke
  `SJItemForPDF` di `SuratJalanPDF.tsx` (proper typed, bukan cast `as any`)
