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
- XLSX

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
