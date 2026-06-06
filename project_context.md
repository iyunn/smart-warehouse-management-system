# PROJECT_CONTEXT.md

# Smart Asset Monitoring and Reconciliation System

## Project Identity

### Project Name
Smart Asset Monitoring and Reconciliation System

### Thesis Title
Implementasi Smart Asset Monitoring and Reconciliation System Berbasis Cloud Computing Menggunakan React dan Supabase dengan Metode Agile Development

### Project Type
Cloud-Based Enterprise Asset Monitoring & Reconciliation System

### Development Status
Active Development

---

# 1. Project Overview

## System Overview

Smart Asset Monitoring and Reconciliation System merupakan sistem monitoring, analisis, dan rekonsiliasi data aset perusahaan berbasis cloud computing.

Sistem dikembangkan untuk membantu proses:
- Monitoring aset gudang perusahaan (CGA1, CGA2, CGA3)
- Validasi sinkronisasi data aset antara Oracle DAT dan kondisi fisik
- Warehouse asset intelligence dan klasifikasi otomatis
- Discrepancy detection dan analisis perpindahan aset
- Rekap dan pelaporan aset per cost center

---

## Main Purpose

Sistem dibuat untuk membantu menyelesaikan permasalahan ketidaksinkronan data antara:
- Oracle DAT (sistem administrasi aset utama perusahaan)
- Web Tracking Asset (sistem tracking perpindahan aset)
- Kondisi fisik aset di gudang

Sistem ini bukan pengganti Oracle ERP maupun Web Tracking. Sistem ini berfungsi sebagai:
- Monitoring system
- Reconciliation system
- Warehouse intelligence system
- Supporting operational dashboard

---

## Warehouse Context

### Definisi Gudang (Cost Center yang Dimonitor)

| Kode | Nama Lengkap | Fungsi Operasional |
|------|-------------|-------------------|
| CGA1 | Cadangan General Affairs 1 | Barang baru dari supplier, belum didistribusikan |
| CGA2 | Cadangan General Affairs 2 | Barang bekas yang masih layak dan standar perusahaan |
| CGA3 | Cadangan General Affairs 3 | Barang calon pemusnahan (rusak/ex-peremajaan/tidak standar) |

### Alur Pergerakan Aset Antar Gudang
- Aset bisa berpindah: CGA1 → CGA2 (terlalu lama, jadi bekas)
- Aset bisa berpindah: CGA2 → CGA3 (biaya service > 50% harga perolehan)
- Setiap upload DAT terbaru otomatis update posisi aset via upsert

### Data Non-Gudang
- 47,314 aset toko dan departemen tersimpan sebagai background data
- Tidak ditampilkan di dashboard utama
- Digunakan untuk keperluan reconciliation (pelacakan posisi terakhir)

---

## Target Users

### Primary Users
- Admin Gudang
- Admin Web Tracking
- Supervisor Asset
- General Affairs Asset Division

### Secondary Users
- Auditor Internal
- Operational Monitoring Team
- Warehouse PIC

---

# 2. Current Development State (per 6 Juni 2026)

## Features Completed

### Dashboard UI
Status: ✅ Completed
- Enterprise dark dashboard layout
- Sidebar navigasi dengan active state berbasis URL (usePathname)
- Topbar dengan search dan user info
- Summary cards (masih sebagian dummy)
- Upload section
- Font konsisten: DM Sans + JetBrains Mono

---

### Excel Upload Pipeline → TXT Upload Pipeline
Status: ✅ Completed (Upgraded)

Perubahan major:
- **Migrasi dari Excel parser ke TXT parser** — file DAT Oracle asli berformat `.txt` tab-delimited
- **Bulk upsert** menggantikan sequential insert
- Performa: 51,459 baris dalam 85.6 detik (dari sebelumnya ~20 menit untuk 4,155 baris)
- **Upsert strategy**: `ON CONFLICT (kode_asset) DO UPDATE` — upload DAT terbaru otomatis update data
- Kolom finansial ditambahkan: `kuantitas`, `biaya_perolehan`, `jumlah_tercatat`

---

### Asset Classification Engine
Status: ✅ Completed

Kapabilitas:
- Keyword matching berbasis word boundary (bukan substring)
- Jenis detection, Merk detection, No-Merk classification
- Confidence scoring: high/medium/low
- Dynamic keyword rules dari database
- Rule type: `jenis`, `merk`, `no_merk`

Fix penting:
- Hapus regex agresif yang merusak keyword multi-kata
- Word boundary: ` keyword ` — "GEA" tidak false positive ke "OMEGA"

---

### Reclassification Engine
Status: ✅ Completed

Fitur:
- Normal mode: reclassify semua aset Unknown gudang
- Revert mode: targeted revert setelah rule dihapus
- Auto-trigger setelah Add Rule modal
- Success banner dengan jumlah aset terupdate
- Filter hanya menyentuh aset CGA1/CGA2/CGA3

---

### Classification Dashboard (Live)
Status: ✅ Completed

Fitur:
- Summary cards live dari Supabase: Total Unknown, Unknown Merk, Unknown Jenis, Completion %
- Completion % dihitung dari total aset gudang
- Tab: Review Aset + Keyword Rules
- Filter: Semua / Unknown Jenis / Unknown Merk / Keduanya
- Pagination dengan fetch semua data (bypass limit 1000)
- Warehouse filter: hanya CGA1/CGA2/CGA3

---

### Keyword Rule System
Status: ✅ Completed

Fitur:
- Add rule (modal) dengan tipe: Jenis, Merk, No-Merk
- Edit rule (modal) — update keyword/tipe/value
- Delete rule + auto revert aset terdampak
- Search di tabel keyword rules
- Badge tipe: violet (Merk) / blue (Jenis)
- Auto-reclassify setelah simpan rule baru

---

### PDF Report Export
Status: ✅ Completed

Fitur:
- Laporan Rekap DAT per Jenis Barang
- Filter cost center: ALL / CGA1 / CGA2 / CGA3
- Struktur: Cost Center → Kategori Oracle → Jenis Barang
- Kolom: Item, Qty, Biaya Perolehan, Jumlah Tercatat
- Subtotal per kategori, total per cost center
- Validasi: item count & qty match 100% dengan Excel Oracle

---

## Features In Progress

### Live Dashboard Statistics
Status: 🚧 In Progress

Summary cards masih sebagian dummy:
- Total Asset (dummy)
- Unclassified Asset (dummy)
- Distribusi Aset panel (dummy)
- Recent Activity Table (placeholder)

Target: fetch live dari Supabase dengan filter CGA

---

## Features Planned

### DAT vs Web Tracking Reconciliation
Status: 📌 Planned

Fitur:
- Mismatch detection antara Oracle DAT dan Web Tracking
- Discrepancy dashboard
- Reconciliation monitoring

---

### Warehouse Intelligence Dashboard
Status: 📌 Planned

Fitur:
- Asset analytics per CGA
- Distribution analytics
- Nilai aset per kategori
- Trend monitoring

---

### Reporting Module — Excel Export
Status: 📌 Planned

---

### Authentication & Role Management
Status: 📌 Planned

Rencana:
- Supabase Auth
- Role: Admin, Viewer
- Protected routes

---

# 3. Tech Stack

## Frontend
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- Font: DM Sans + JetBrains Mono (via next/font/google)

## Backend
- Next.js Route Handlers (serverless)
- No dedicated backend server

## Database
- Supabase PostgreSQL

### Tables
| Tabel | Fungsi |
|-------|--------|
| `assets_raw` | Data mentah DAT Oracle |
| `assets_clean` | Data hasil klasifikasi |
| `keyword_rules` | Rule klasifikasi adaptif |
| `classification_logs` | Audit trail klasifikasi |

### Indexes
- `idx_assets_raw_toko` — optimasi filter warehouse
- `idx_assets_clean_jenis` — optimasi filter unknown
- `idx_assets_clean_merk` — optimasi filter unknown

### Constraints
- `assets_raw_kode_asset_unique` — mencegah duplikat, enable upsert
- `assets_clean_raw_id_unique` — one-to-one dengan assets_raw

## Deployment
- Vercel (PaaS)
- GitHub (source control)
- Supabase (BaaS/DBaaS)

## Libraries
- `@react-pdf/renderer` — PDF generation
- `@supabase/supabase-js` — Supabase client
- `lucide-react` — icons

---

# 4. Architecture

## ETL Pipeline (Current)

```text
Oracle DAT Export (.txt)
↓
TXT Parser (tab-delimited)
↓
Header Validation
↓
Data Normalization
↓
Memory Classification (classifyAsset)
↓
Bulk Upsert assets_raw (ON CONFLICT kode_asset)
↓
Bulk Upsert assets_clean (ON CONFLICT raw_id)
↓
Dashboard Refresh
```

## Classification Flow

```text
Original Description (deskripsi)
↓
normalizeText() — lowercase, replace punctuation, trim
↓
Word boundary matching (` keyword `)
↓
Match keyword_rules (jenis / merk / no_merk)
↓
Confidence scoring (high/medium/low)
↓
assets_clean (jenis, merk, confidence)
```

## Warehouse Filter Strategy

```text
51,459 total aset di DB
↓
Filter: toko ILIKE 'CGA1%' OR 'CGA2%' OR 'CGA3%'
↓
4,145 aset gudang (yang dimonitor)
```

## Reclassification Flow

```text
Add / Edit / Delete Keyword Rule
↓
/api/reclassify POST
↓
Fetch keyword_rules aktif
↓
Fetch aset Unknown gudang (CGA only)
↓
classifyAsset() per aset
↓
Batch UPDATE assets_clean yang berubah
↓
Refresh dashboard
```

---

# 5. Database Architecture

## assets_raw

Menyimpan data mentah DAT Oracle.

Field utama:
- `id` (uuid, PK)
- `kode_asset` (text, UNIQUE) — No. Seri Oracle
- `deskripsi` (text) — Keterangan Oracle
- `toko` (text) — Cost center/lokasi
- `kategori_oracle` (text) — Kategori Oracle
- `status` (text)
- `kuantitas` (int4)
- `biaya_perolehan` (int8) — dalam satuan Rupiah
- `jumlah_tercatat` (int8) — dalam satuan Rupiah
- `uploaded_at` (timestamp)
- `source` (text)

---

## assets_clean

Menyimpan data hasil klasifikasi.

Field utama:
- `id` (uuid, PK)
- `raw_id` (uuid, FK → assets_raw, UNIQUE)
- `original_description` (text)
- `normalized_description` (text)
- `jenis` (text) — hasil classifier
- `merk` (text) — hasil classifier
- `kategori` (text)
- `confidence` (text) — low/medium/high
- `status` (text)
- `created_at` (timestamp)

---

## keyword_rules

Menyimpan rule klasifikasi adaptif.

Field utama:
- `id` (uuid, PK)
- `keyword` (text) — uppercase
- `rule_type` (text) — 'jenis' | 'merk' | 'no_merk'
- `value` (text) — nilai yang di-assign
- `created_at` (timestamptz)

---

# 6. Development Rules

## Architecture Rules (MUST NOT CHANGE)

- Raw vs Clean database architecture
- Supabase integration pattern
- ETL upload flow
- Modular component structure
- Reusable component strategy
- Dashboard design direction
- Hook-based logic separation
- Warehouse filter (CGA only untuk monitoring)

## Coding Standards

- Modular architecture
- Reusable components
- Hooks untuk business logic
- TypeScript strict typing
- Tailwind utility classes
- Clean separation of concerns
- PascalCase untuk components, camelCase untuk hooks/utils

## UI Standards

- Dark enterprise dashboard
- Background: `#080e18`
- Surface: `#111827`
- Accent: Cyan/Blue primary, Violet/Amber/Emerald/Rose secondary
- Font: DM Sans (body) + JetBrains Mono (code/numbers)
- Rounded cards: `rounded-2xl`
- Compact spacing: `p-5` max untuk cards

---

# 7. Thesis Positioning

## This Project IS:
- Warehouse Asset Monitoring System
- Adaptive Classification System
- Asset Reconciliation Platform
- Cloud-based DAT Processing System
- Warehouse Intelligence Dashboard

## This Project IS NOT:
- ERP Replacement
- Oracle Replacement
- Accounting System
- Official Asset Mutation System
- Full Web Tracking Integration

## Academic Scope
- ETL Pipeline implementation
- Rule-based intelligent classification
- Cloud architecture (Vercel + Supabase + GitHub)
- Agile development methodology
- Warehouse asset management digitalization

---

# 8. Known Issues & Technical Debt

## Current Issues

### Dashboard Statistics
- Summary cards masih sebagian dummy
- Target: live Supabase query dengan filter CGA

### Classification Accuracy
- Keyword matching masih rule-based (exact/semi-exact)
- Belum ada fuzzy matching atau synonym handling
- ~84% aset gudang masih Unknown (butuh lebih banyak keyword rules)

### Authentication
- Belum diimplementasikan
- Sistem masih prototype/internal mode

### Recent Activity Table
- Masih placeholder
- Belum ada activity logging system

## Accepted Technical Debt

### Static jenis/kategori Options
- Beberapa opsi di form masih hardcoded
- Diterima untuk menjaga simplicity dan development speed

### No Realtime Sync
- Tidak ada koneksi langsung ke Oracle
- Upload manual diperlukan setiap ada DAT terbaru
- Diterima karena scope skripsi = monitoring, bukan integrasi ERP
