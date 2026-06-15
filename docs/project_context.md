# PROJECT_CONTEXT.md

# Smart Asset Monitoring and Reconciliation System

> File ini berisi state sistem terkini. Untuk history kronologis sesi pengembangan, lihat `development-journal.md`.
> Terakhir diupdate: **15 Juni 2026** (setelah SJ Sesi 4 complete + Rekap Pengiriman live + Monitoring v2 + Daftar SJ Arsip + LPP reconciliation design)

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
- Surat Jalan Manual dengan autorecap (menggantikan SJ manual existing tanpa rekap)

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
- Surat Jalan Manual generator dengan autorecap

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

### Strategi Penyimpanan Data (Per 7 Juni 2026)
**Hanya menyimpan data CGA1/CGA2/CGA3.** Sistem dirombak menjadi CGA-only architecture:
- Upload DAT hanya menerima file DAT gudang (sudah difilter dari source)
- Tidak ada lagi background data untuk non-CGA (toko/departemen)
- Alasan: LPP Web Tracking hanya support export CGA, jadi non-CGA tidak diperlukan untuk reconciliation
- DB jauh lebih ringan: ~4,145 aset (sebelumnya 51,459 dengan non-CGA)

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

# 2. Current Development State ( per 15 Juni 2026 )

## Features Completed

### Dashboard UI (6 Baris Layout)
Status: ✅ Completed (3 dari 6 baris live, sisanya placeholder menunggu LPP/Closing)

Layout final dashboard:

| Baris | Konten | Status |
|---|---|---|
| 1 | Status Data: DAT Update, DAT Closing, LPP Update, LPP Closing | DAT Update LIVE, lainnya placeholder |
| 2 | DAT vs LPP Comparison (per CGA1/2/3) | Placeholder — menunggu LPP reconciliation |
| 3 | Trend Closing Bulanan (chart 12 bulan) | Placeholder — menunggu Closing Snapshot |
| 4 | CGA Summary 3 cards: hijau/kuning/merah | LIVE |
| 5 | Closing vs Update (naik/turun per CGA) | Placeholder — menunggu Closing Snapshot |
| 6 | Rekap Pengiriman (3 card: Progres Mutasi Oracle, Top 5 Jenis Keluar bulan berjalan, Trend harian) | **LIVE** |

Plus:
- Dashboard warning cards (3 card: Belum Input Kode Aset, Belum Mutasi Oracle, Belum Mutasi Web Tracking) — semua LIVE, menggantikan welcome banner
- DAT Update terakhir dari `MAX(uploaded_at)` di `assets_raw`

### Halaman /upload — Upload Data
Status: ✅ Completed (DAT Update fungsional, lainnya placeholder)

4 panel upload:
- DAT Update (LIVE)
- DAT Closing (placeholder)
- LPP Update (placeholder)
- LPP Closing (placeholder)

### Halaman /monitoring — Monitoring v2
Status: ✅ Completed (DAT live dengan fitur lengkap, LPP empty state)

**Tab DAT Monitoring:**
- List semua aset DAT CGA
- Badge "Allocated" untuk aset yang sudah dialokasikan via SJ
- Kategori Oracle disingkat ke kode saja (e.g. "C - PERALATAN KOMPUTER" → "C")
- 3 kolom tambahan: Invoice Number, Tanggal Dokumen (format DD-Mmm-YYYY,
  parsed dari DAT dengan heuristic DD/MM), Catatan (editable inline)
- Catatan disimpan di tabel independen `asset_notes`, auto-clear saat
  kode_asset keluar CGA (re-evaluasi tiap upload DAT)
- Sortable header per kolom (klik: asc → desc → default), reset filter
  mengembalikan sort ke default (Kategori→Jenis→Merk→CGA→Kode)
- Filter multi-kolom AND: Jenis, Merk, Kode Aset, Kategori Oracle, Deskripsi,
  Invoice Number, Catatan

**Tab LPP Monitoring:**
- Empty state karena data LPP belum tersedia

Kolom: Kat. | Jenis | Merk | CGA | Kode Aset | Deskripsi | Qty | Perolehan | Tercatat | Invoice No. | Tgl Dokumen | Catatan

Filter: ALL/CGA1/CGA2/CGA3, multi-field tag filter (AND), pagination client-side.

### Upload Pipeline (TXT Parser + Full Replace Strategy)
Status: ✅ Completed

- TXT parser support delimiter PIPE `|` dan TAB `\t` (auto-detect)
- Smart number parsing: handle format titik-ribuan, koma-desimal, maupun titik-desimal Oracle
- Kolom finansial: `kuantitas`, `biaya_perolehan`, `jumlah_tercatat`
- Kolom tambahan (Monitoring v2): `invoice_number`, `tanggal_dokumen`
  (heuristic DD/MM, output "DD-Mmm-YYYY")
- **Strategi upload: Full Replace (Delete-then-Insert)**
  - `POST /api/process/clear` — DELETE semua `assets_raw` sekali sebelum batch pertama
    (`assets_clean` ikut terhapus via CASCADE)
  - INSERT fresh dari file (batch 500 rows)
  - DAT adalah full snapshot — aset tidak ada di file = sudah dimutasi keluar CGA
- Re-apply tag "Allocated" otomatis setelah upload (cross-check `surat_jalan_items.kode_asset`)
- Auto-clear `asset_notes` untuk kode_asset yang sudah keluar CGA

### Asset Classification Engine
Status: ✅ Completed

Kapabilitas:
- Keyword matching berbasis word boundary (bukan substring)
- Jenis detection, Merk detection, No-Merk classification
- Confidence scoring: high/medium/low
- Dynamic keyword rules dari database
- Rule type: `jenis`, `merk`, `no_merk`

### Reclassification Engine
Status: ✅ Completed

Fitur:
- Normal mode: reclassify semua aset Unknown
- Revert mode: targeted revert setelah rule dihapus
- Auto-trigger setelah Add Rule modal
- Success banner dengan jumlah aset terupdate

### Classification Dashboard (Live)
Status: ✅ Completed

Fitur:
- Summary cards live dari Supabase
- Tab: Review Aset + Keyword Rules
- Filter: Semua / Unknown Jenis / Unknown Merk / Keduanya
- Search debounced
- **Client-side pagination** (final decision)
- Hapus kolom "Kategori" karena semua Unknown
- Format toolbar count: `a / b aset`

### Keyword Rule System
Status: ✅ Completed

Fitur:
- Add rule (modal) dengan tipe: Jenis, Merk, No-Merk
- Edit rule (modal)
- Delete rule + auto revert aset terdampak
- Search di tabel keyword rules
- Badge tipe: violet (Merk) / blue (Jenis) / slate (No-Merk)

### PDF Report Export
Status: ✅ Completed

Fitur:
- Laporan Rekap DAT per Jenis Barang
- Filter cost center: ALL / CGA1 / CGA2 / CGA3
- Struktur: Cost Center → Kategori Oracle → Jenis Barang
- Kolom: Item, Qty, Biaya Perolehan, Jumlah Tercatat
- Validasi: item count & qty match 100% dengan Excel Oracle

### Surat Jalan Manual — Sesi 1-4 + Print/PDF + Arsip
Status: ✅ Completed (semua sesi + fitur pelengkap)

**Sesi 1:** Schema (3 tabel) + Buat SJ + Master Tujuan + Sidebar dropdown
**Sesi 2:** List SJ + Edit + Reschedule + Delete
**Sesi 3:** Report dashboard + Excel export (SheetJS, single-sheet flat)
**Print/PDF:** Modal preview dengan Download + Print, auto-trigger setelah submit/edit/reschedule

**Schema (3 tabel baru):**
- `sj_tujuan` (master tujuan/penerima)
- `surat_jalan` (header SJ)
- `surat_jalan_items` (detail items)

**Halaman /sj/buat — Buat Surat Jalan:**
- Header: Tanggal, Tujuan (searchable), Pembawa
- Penerima OTOMATIS = label tujuan
- Approved By HARDCODED = "SPV/Manager"
- Items table dengan: Jenis, Merk, SN, Qty, Satuan, Baru, AT, Keterangan
- Aksi per row: duplicate row + delete row
- 2 submit modes: Draft atau Submit

**Halaman /sj/tujuan — Master Tujuan:**
- CRUD lengkap dengan modals
- Search by kode/nama

**Format No SJ:** `SJ-Manual/CGA/YYYY/MM/XXXX` (4-digit sequence, reset per bulan)

**Source Jenis & Merk dropdown:** Query DISTINCT dari `assets_clean` dengan 5-min server-side cache (tidak buat tabel master).

**Sidebar:** Dropdown "Surat Jalan Manual" dengan 4 sub-menu (auto-expand kalau child aktif).

### ✅ SJ Sesi 4 — Alokasi Aset & Mutasi Oracle (10 Juni 2026)
- Input kode aset + checkbox mutasi Oracle per item di Rekap Alokasi
- Tag "Allocated" di assets_clean, badge di Monitoring, kolom di Excel export  
- Dashboard warning cards (ganti welcome banner)
- Lock alokasi: K1 lock by DAT (permanen), K2 lock manual (ada escape hatch)
- DAT sebagai sumber kebenaran — kode hilang dari DAT = mutasi confirmed = lock
- Fix stale closure mutasiRef di AllocationCell

### ✅ SJ Sesi 4 Complete (11 Juni 2026)
- Kolom Mutasi WT (independen, MutasiWTCell terpisah, hover-reveal "batalkan")
  — disabled untuk non-AT, persisted via allocOverride agar tidak hilang
  saat pindah pagination
- Fix PATCH overwrite bug (conditional update per field — kode_asset,
  mutasi_oracle_status, mutasi_wt_status tidak saling overwrite)
- Hover-reveal "batalkan" untuk lock manual Oracle & WT
- Rekap Pengiriman dashboard live (3 card — lihat Baris 6 di atas)
- Warning card "Belum Mutasi Web Tracking" live (violet, item AT dengan
  mutasi_wt_status=false)
- Re-apply tag Allocated otomatis saat upload DAT
- Validasi duplikat kode aset (border merah + pesan inline) + berbagai
  bugfix AllocationCell (stale closure, lock bypass reset, Rules of Hooks)
- Excel export Rekap Alokasi: tambah kolom Kode Aset, Mutasi Oracle, Mutasi WT
- Kolom "Baru" (is_baru) di Rekap Alokasi, tanggal 2 baris (tanggal + hari)

### ✅ Daftar SJ — Kolom Arsip (15 Juni 2026)
- Checkbox `is_archived` per dokumen SJ (bukan per-item) — menandai fisik
  kertas SJ sudah diarsipkan
- Save via PATCH mode `archive_only`, local override (archiveOverride)
  agar persist saat pindah pagination
- Tanggal SJ ditambah baris hari (sama pattern Rekap Alokasi)

### ✅ Monitoring v2 (15 Juni 2026)
- 3 kolom baru: Invoice Number, Tanggal Dokumen (parsed dari DAT, format
  DD-Mmm-YYYY dengan heuristic DD/MM untuk separator ambigu), Catatan
  (input bebas per kode_asset)
- Catatan disimpan di tabel independen `asset_notes` — bertahan selama
  kode_asset tidak pernah keluar CGA, auto-clear saat keluar
- Kategori Oracle disingkat (extract kode sebelum " - ")
- Sortable header per kolom (asc/desc/default), reset filter reset sort
- Filter tambahan: Invoice Number, Catatan
- Bulk import 560 catatan historis dari Excel ke `asset_notes`

---

## Features In Progress

tidak ada fitur yang sedang dikerjakan saat ini

---

## Features Planned

### 🎯 Next (Updated 15 Juni 2026)
- **LPP Web Tracking Reconciliation (THESIS CORE)** — lihat desain lengkap di bawah
- "Changed" filter di Classification (prev_jenis/prev_merk, ACC/Revert) — prioritas rendah, ditunda sampai core selesai
- Closing Snapshot Architecture — ditunda, fokus reconciliation dulu
- Authentication (Supabase Auth, role Admin/Viewer, protected routes)
- Bab 3 & 4 laporan TA — semua fitur core sudah cukup matang untuk ditulis

### LPP Web Tracking Reconciliation (THESIS CORE TOPIC)
Status: 📌 Design Complete — Implementasi belum dimulai

**Konteks LPP:**
- LPP = output dari program Web Tracking (.xls per cost center, file
  terpisah untuk CGA1/CGA2/CGA3). Kolom: Nomor, No Aktiva (= kode_asset),
  Deskripsi, Saldo Awal, Masuk, Keluar, Saldo_Akhir
- LPP CGA = daftar kode_asset yang menurut Web Tracking masih berlokasi di CGA
- Perpindahan lokasi terjadi via Surat Jalan Web Tracking (per kode_asset),
  harus di-BTB (Bukti Terima Barang) oleh cost center tujuan. Sebelum BTB,
  status "intransit" di lokasi asal
- Ada output terpisah "Report Intransit" — daftar kode_asset yang sudah
  dibuatkan SJ WT tapi belum di-BTB tujuan (file belum diperoleh)

**5 Kondisi Reconciliation (DAT vs LPP — 2x2 matrix + Intransit):**

| # | DAT (CGA?) | LPP (CGA?) | Status | Aksi |
|---|---|---|---|---|
| 1 | Ya | Ya | Fisik masih di CGA | Normal, tidak ada aksi |
| 2 | Ya | Tidak | Belum Mutasi Oracle | Admin gudang harus mutasi Oracle segera |
| 3 | — | — | Aset Intransit (cross-cut) | Sudah SJ WT, belum BTB tujuan — butuh file Intransit |
| 4 | Tidak | Ya | Belum Mutasi WT | Admin gudang harus buat SJ WT segera |
| 5 | Tidak | Tidak | Fisik Allocated | Normal, konsisten sudah keluar CGA |

Kondisi 2 dan 4 adalah **warning aktif** yang harus ditangani admin gudang —
keduanya sama pentingnya (administrasi sehat = tidak ada selisih = kondisi 1/5).

**Integrasi dengan Mutasi WT (sudah ada):**
Checkbox "Mutasi WT" manual yang sudah dibangun (Sesi 4) akan punya mekanisme
sama dengan Mutasi Oracle — bisa manual (user centang) ATAU otomatis (cross-check
kode_asset SJ Manual terhadap LPP: kalau tidak ada di LPP CGA = sudah keluar
secara WT = auto-true/lock).

**Yang perlu didesain:**
- Schema `lpp_raw` (per CGA, kemungkinan delete-then-insert seperti DAT) +
  `intransit_raw`
- Upload pipeline LPP (.xls parser, 3 file per upload — CGA1/2/3 terpisah)
- Reconciliation engine — cross join DAT vs LPP by kode_asset, kategorikan
  ke 5 kondisi
- UI Monitoring Tab LPP / halaman reconciliation tersendiri — summary
  (jumlah per kondisi) + detail table (mirip Monitoring DAT)
- Aktivasi Dashboard Baris 2 (DAT vs LPP per CGA)
- Konfirmasi format file Report Intransit (belum diperoleh)
- Konfirmasi: kondisi 2 (sudah SJ WT tapi belum BTB) — apakah actionable
  warning untuk admin gudang atau informational (BTB kewenangan toko tujuan)

### DAT/LPP Closing Architecture
Status: 📌 Planned (architecture sudah diputuskan, implementasi TBA)

Strategi: **Hanya simpan aggregate metrics + array kode_asset**, bukan row-level data.

```sql
closing_snapshots (
  data_type ('DAT'|'LPP'), period ('2026-05'),
  total_items, total_qty, total_biaya_perolehan, total_jumlah_tercatat,
  breakdown_by_toko jsonb, breakdown_by_kategori jsonb, breakdown_by_jenis jsonb,
  kode_assets text[]
)
```

Mekanisme upload: user pilih period manual (12 bulan), parser hitung aggregate, simpan ke `closing_snapshots`, data mentah di-discard.

### Reporting Module — Excel Export
Status: ✅ Sebagian besar selesai (SJ Rekap Alokasi, Monitoring, DAT Summary)
- Pending: export untuk hasil reconciliation LPP setelah diimplementasi

### Authentication & Role Management
Status: 📌 Planned

Rencana:
- Supabase Auth
- Role: Admin, Viewer
- Protected routes

### DB Optimization (Deferred)
Status: 📌 Deferred — sampai semua fitur selesai

- Materialized view `assets_gudang`
- PostgreSQL function untuk aggregate
- Batch UPDATE dengan CASE WHEN

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

### Tables — Asset
| Tabel | Fungsi |
|-------|--------|
| `assets_raw` | Data mentah DAT Oracle (CGA only) |
| `assets_clean` | Data hasil klasifikasi |
| `keyword_rules` | Rule klasifikasi adaptif |
| `classification_logs` | Audit trail klasifikasi |

### Tables — Surat Jalan
| Tabel | Fungsi |
|-------|--------|
| `sj_tujuan` | Master tujuan/cost center penerima SJ |
| `surat_jalan` | Header surat jalan |
| `surat_jalan_items` | Detail item per surat jalan |

### Indexes
- `idx_assets_raw_toko` — optimasi filter warehouse (legacy, masih dipertahankan)
- `idx_assets_raw_uploaded_at` (DESC) — untuk "DAT Update terakhir" di Dashboard
- `idx_assets_clean_jenis` — optimasi filter unknown
- `idx_assets_clean_merk` — optimasi filter unknown
- `idx_surat_jalan_tanggal`, `idx_surat_jalan_tujuan`, `idx_surat_jalan_status`
- `idx_sj_items_sj_id`, `idx_sj_items_serial`, `idx_sj_items_jenis`, `idx_sj_items_mutasi_status`

### Constraints
- `assets_raw_kode_asset_unique` — enable upsert
- `assets_clean_raw_id_unique` — one-to-one dengan `assets_raw`
- `sj_tujuan_kode_unique` — kode tujuan unik
- `surat_jalan_no_sj_unique` — No SJ unik global

### RLS
Allow-all untuk semua tabel (consistent pattern, tidak ada user auth).

## Deployment
- Vercel (PaaS) — auto-deploy from GitHub main
- GitHub (source control)
- Supabase (BaaS/DBaaS) — `gcknnlapkmsazfrzcxkw.supabase.co`

## Libraries
- `@react-pdf/renderer` — PDF generation
- `@supabase/supabase-js` — Supabase client
- `lucide-react` — icons
- `xlsx` (SheetJS) — Excel export (SJ Rekap Alokasi, Monitoring)
- `recharts` — chart (Rekap Pengiriman trend harian)

---

# 4. Architecture

## ETL Pipeline (Current — 7 Juni 2026)

```text
Oracle DAT Export (.txt, CGA only)
↓
TXT Parser (auto-detect: PIPE | atau TAB \t)
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

## CGA-Only Architecture (Per 7 Juni 2026)

```text
PREVIOUSLY:
51,459 total aset → filter CGA → 4,145 aset gudang

NOW:
Upload DAT CGA-only directly → 4,145 aset di DB
No join, no warehouse filter, simpler queries
```

## Reclassification Flow

```text
Add / Edit / Delete Keyword Rule
↓
/api/reclassify POST
↓
Fetch keyword_rules aktif
↓
Fetch aset Unknown (langsung, tanpa warehouse filter)
↓
classifyAsset() per aset
↓
Batch UPDATE assets_clean yang berubah
↓
Refresh dashboard
```

## Surat Jalan Manual Flow

```text
User input Form Buat SJ
↓
Validasi: Tanggal + Tujuan + min 1 baris Jenis
↓
POST /api/sj
↓
generateNoSJ() di server
   → Cari sequence terbesar bulan ini
   → Format: SJ-Manual/CGA/YYYY/MM/XXXX
↓
INSERT surat_jalan (header)
↓
INSERT surat_jalan_items (bulk)
↓
Redirect ke /sj/list (kalau submit)
   atau reset form (kalau draft)
```

---

# 5. Database Architecture

## assets_raw

Menyimpan data mentah DAT Oracle (CGA only).

Field utama:
- `id` (uuid, PK)
- `kode_asset` (text, UNIQUE) — No. Seri Oracle
- `deskripsi` (text) — Keterangan Oracle
- `toko` (text) — Cost center/lokasi (CGA1/CGA2/CGA3)
- `kategori_oracle` (text) — Kategori Oracle
- `status` (text)
- `kuantitas` (int4)
- `biaya_perolehan` (int8) — dalam satuan Rupiah
- `jumlah_tercatat` (int8) — dalam satuan Rupiah
- `invoice_number` (text) — dari kolom "Invoice Number" DAT
- `tanggal_dokumen` (text) — normalisasi "DD-Mmm-YYYY" dari kolom "Tanggal Dokumen" DAT
- `uploaded_at` (timestamp)
- `source` (text)

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
- `tag` (text, nullable) — 'Allocated' kalau sudah dialokasikan via SJ Manual
- `created_at` (timestamp)

## keyword_rules

Menyimpan rule klasifikasi adaptif.

Field utama:
- `id` (uuid, PK)
- `keyword` (text) — uppercase
- `rule_type` (text) — 'jenis' | 'merk' | 'no_merk'
- `value` (text) — nilai yang di-assign
- `created_at` (timestamptz)

## sj_tujuan

Master tujuan/cost center penerima SJ.

Field utama:
- `id` (uuid, PK)
- `kode` (text, UNIQUE) — kode penerima (4 char umumnya)
- `nama` (text)
- `created_at` (timestamptz)

## surat_jalan

Header surat jalan.

Field utama:
- `id` (uuid, PK)
- `no_sj` (text, UNIQUE) — format `SJ-Manual/CGA/YYYY/MM/XXXX`
- `tanggal` (date)
- `tujuan_id` (uuid, FK → sj_tujuan)
- `pembawa` (text)
- `penerima` (text) — auto = label tujuan
- `status` (text) — 'draft' | 'submitted' | 'completed'
- `is_archived` (bool) — fisik kertas SJ sudah diarsipkan
- `created_by` (text) — default 'Admin User'
- `approved_by` (text) — default 'SPV/Manager'
- `created_at`, `updated_at` (timestamptz)

## surat_jalan_items

Detail items per SJ.

Field utama:
- `id` (uuid, PK)
- `sj_id` (uuid, FK → surat_jalan, ON DELETE CASCADE)
- `urutan` (integer)
- `jenis` (text)
- `merk` (text)
- `serial_number` (text)
- `qty` (integer)
- `satuan` (text) — Unit/Set/Pcs/Koli/Pack
- `is_baru` (bool)
- `is_aktiva` (bool) — flag AT untuk barang aktiva
- `keterangan` (text)
- `mutasi_oracle_status` (bool) — checkbox di Sesi 4
- `mutasi_oracle_at` (timestamptz)
- `mutasi_wt_status` (bool) — checkbox Mutasi WT (Sesi 4 lanjutan)
- `mutasi_wt_at` (timestamptz)
- `kode_asset` (text) — optional, untuk linking ke assets_raw

---

## asset_notes

Catatan bebas per kode_asset (Monitoring v2). Independen dari lifecycle DAT —
hanya berisi baris untuk aset yang punya catatan.

Field utama:
- `kode_asset` (text, PK)
- `catatan` (text)
- `updated_at` (timestamptz)

Auto-clear: saat upload DAT, baris dihapus kalau `kode_asset` tidak ada di
DAT baru (aset sudah keluar CGA → siklus catatan dianggap selesai).

RLS: policy "Allow all on asset_notes" (PERMISSIVE, public, ALL, true/true) —
replikasi pola tabel lain.

---

# 6. Development Rules

## Architecture Rules (MUST NOT CHANGE)

- Raw vs Clean database architecture
- Supabase integration pattern
- ETL upload flow (TXT-based)
- Modular component structure
- Reusable component strategy
- Dashboard design direction (6 baris layout)
- Hook-based logic separation
- **CGA-only data architecture** (per 7 Juni 2026)
- **Client-side pagination** untuk Classification (per 7 Juni 2026)

## Architectural Principles

Setiap keputusan teknis harus tunduk pada prinsip ini:

1. **Optimal & Enteng** — sistem harus performant di koneksi internet rendah (kantor user)
2. **Scalable** — DB ringan, struktur fleksibel untuk fitur masa depan
3. **Functional** — fitur harus jalan benar dengan UX yang baik
4. **Tidak membebani database** — minimize join kompleks, pakai cache server-side bila perlu

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
- Surface: `#111827` / `bg-white/[0.02]`
- Accent: Cyan/Blue primary, Violet/Amber/Emerald/Rose secondary
- Font: DM Sans (body) + JetBrains Mono (code/numbers)
- Rounded cards: `rounded-2xl`
- Compact spacing: `p-5` max untuk cards
- Cost Center semantic colors: CGA1 emerald, CGA2 amber, CGA3 rose

---

# 7. File Structure

```
src/
├── app/
│   ├── page.tsx                      Dashboard (6 baris)
│   ├── layout.tsx
│   ├── globals.css                   + CSS untuk hide number input spinners
│   │
│   ├── upload/page.tsx               Upload Data (4 panel)
│   ├── monitoring/page.tsx           Monitoring (2 tab)
│   ├── review/page.tsx               Classification
│   ├── reports/page.tsx              DAT summary report
│   │
│   ├── sj/
│   │   ├── buat/page.tsx             Buat Surat Jalan
│   │   ├── list/page.tsx             Daftar SJ (+ kolom Arsip)
│   │   ├── report/page.tsx           Rekap Alokasi (Sesi 3+4)
│   │   └── tujuan/page.tsx           Master Tujuan CRUD
│   │
│   └── api/
│       ├── process/
│       │   ├── route.ts              Upload DAT pipeline (+ re-apply tag, auto-clear notes)
│       │   └── clear/route.ts        DELETE assets_raw (dipanggil sekali sebelum batch)
│       ├── reclassify/route.ts       Reclassify engine
│       ├── reports/dat-summary/route.ts
│       ├── dashboard/stats/route.ts  Dashboard live data (+ Rekap Pengiriman)
│       ├── monitoring/route.ts       Monitoring data (GET + PATCH catatan)
│       └── sj/
│           ├── route.ts              GET/POST/PATCH/DELETE SJ (+ archive_only)
│           ├── report/route.ts       PATCH alokasi (kode_asset, mutasi_oracle, mutasi_wt)
│           ├── tujuan/route.ts       CRUD tujuan
│           └── master/
│               ├── jenis/route.ts    DISTINCT 5-min cache
│               └── merk/route.ts     DISTINCT 5-min cache
│
├── components/
│   ├── Sidebar.tsx                   Dropdown support
│   ├── Topbar.tsx
│   ├── SummaryCard.tsx
│   ├── UploadSection.tsx             Dipakai di /upload
│   │
│   ├── review/
│   │   ├── ReviewSummaryCards.tsx
│   │   ├── ReviewTableToolbar.tsx
│   │   ├── ReviewTableRow.tsx
│   │   ├── AddRuleModal.tsx
│   │   ├── ConfidenceBadge.tsx
│   │   ├── UnknownBadge.tsx
│   │   └── KeywordRulesTab.tsx
│   │
│   ├── dashboard/
│   │   ├── DataStatusCards.tsx       Baris 1 (live)
│   │   ├── CGASummaryCards.tsx       Baris 4 (live)
│   │   ├── DashboardWarningCards.tsx Warning cards (3, semua live)
│   │   ├── RekapPengirimanCards.tsx  Baris 6 (live, 3 card)
│   │   └── PlaceholderCards.tsx      Baris 2, 3, 5
│   │
│   ├── sj/
│   │   ├── SearchableDropdown.tsx    Portal-based
│   │   └── SJItemsTable.tsx          + SatuanSelect inline
│   │
│   └── reports/
│       └── DATSummaryDocument.tsx
│
├── hooks/
│   ├── useReviewAssets.ts            Client-side pagination
│   ├── useKeywordRule.ts
│   ├── useReclassify.ts
│   ├── useDashboardStats.ts          + RekapPengiriman, MutasiProgress, TopJenis
│   ├── useMonitoring.ts              + invoice_number, tanggal_dokumen, catatan
│   ├── useSJList.ts                  + is_archived
│   ├── useSJReport.ts                + mutasi_wt, is_mutated
│   └── useSJMaster.ts                3 hooks: jenis/merk/tujuan
│
└── lib/
    ├── classifier.ts                 Word boundary matching
    ├── supabaseClient.ts
    ├── txtParser.ts                  Auto-detect PIPE/TAB + parseTanggalDokumen
    ├── batchProcessor.ts
    ├── types.ts                      AssetRecord + invoice_number, tanggal_dokumen
    ├── excelExporter.ts              SJ Rekap Alokasi export + kolom mutasi
    ├── monitoringExporter.ts         Monitoring export (2 sheet)
    ├── reviewTypes.ts
    └── sjTypes.ts                    + mutasi_wt_status, mutasi_wt_at
```

### File yang Sudah Dihapus
- `src/app/api/classification/route.ts` (digantikan client-side pagination)
- `src/components/dashboard/DistribusiCostCenter.tsx` (replaced dengan PlaceholderCards)
- `src/components/dashboard/TopJenisChart.tsx` (replaced dengan PlaceholderCards)

### Catatan
- `src/lib/xlsxParser.ts` masih ada di repo (legacy, tidak dipakai aktif)
  tapi tetap harus sinkron dengan `AssetRecord` type (lihat 15 Juni 2026)
  karena ikut di type-check saat build

---

# 8. Thesis Positioning

## This Project IS:
- Warehouse Asset Monitoring System
- Adaptive Classification System
- Asset Reconciliation Platform
- Cloud-based DAT Processing System
- Warehouse Intelligence Dashboard
- Surat Jalan Manual Generator dengan autorecap

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
- Surat Jalan workflow automation

## Demo Flow (Skripsi)
1. Upload DAT TXT → otomatis classified
2. Show Classification page → reclassify
3. Show Dashboard → live CGA summary + Rekap Pengiriman
4. Show Monitoring v2 → Invoice Number, Tanggal Dokumen, Catatan, sortable header
5. Buat SJ Manual → autorecap, alokasi kode aset, mutasi Oracle & WT
6. (Core/Future) Upload LPP → reconciliation engine: 5 kondisi DAT vs LPP,
   warning admin gudang untuk Belum Mutasi Oracle & Belum Mutasi WT

---

# 9. Known Issues & Technical Debt

## Current Issues

### Dashboard Placeholders
- Baris 2, 3, 5 masih placeholder (menunggu LPP reconciliation & Closing Snapshot)
- Baris 6 (Rekap Pengiriman) sudah LIVE
- LPP belum ada data sama sekali — ini fokus pengembangan berikutnya (thesis core)

### Classification Accuracy
- Keyword matching masih rule-based (exact/semi-exact)
- Belum ada fuzzy matching atau synonym handling
- Sebagian aset masih Unknown (butuh lebih banyak keyword rules dari user)

### Authentication
- Belum diimplementasikan
- Sistem masih prototype/internal mode

### Recent Activity Table
- Masih placeholder
- Belum ada activity logging system

### Hydration Warning
- Tanggal di Topbar di-render client-side via useEffect (fix 15 Juni 2026)
  untuk hindari mismatch SSR saat render lewat tengah malam
- Input fields kadang trigger hydration warning dari browser extensions
  (`fdprocessedid`) — di luar kontrol aplikasi, sudah diketahui aman diabaikan

## Accepted Technical Debt

### Static Jenis/Kategori di Form
- Beberapa opsi di form masih hardcoded (mis. SATUAN_OPTIONS)
- Diterima untuk simplicity dan development speed

### No Realtime Sync
- Tidak ada koneksi langsung ke Oracle
- Upload manual diperlukan setiap ada DAT terbaru
- Diterima karena scope skripsi = monitoring, bukan integrasi ERP

### DB Optimization Deferred
- Tidak ada materialized view atau PostgreSQL function
- Diterima karena dataset masih kecil (~4,145 aset)
- Akan dikerjakan setelah semua fitur selesai

### In-Memory Cache untuk Master Jenis/Merk
- Cache 5 menit di memory Node.js (bukan Redis)
- Cache hilang saat Vercel function cold start
- Diterima karena query DISTINCT cepat dan biaya re-fetch minimal

---

# 10. Recent Major Changes Log

## 15 Juni 2026
- **SJ Sesi 4 hotfixes** — lock guard izinkan reset bypass K1 (fix typo jadi
  lock permanen), validasi duplikat kode aset client-side, fix Rules of Hooks
- **Daftar SJ — kolom Arsip** — checkbox is_archived per dokumen, tanggal+hari
- **Monitoring v2** — kolom Invoice Number, Tanggal Dokumen (parser heuristic
  DD/MM), Catatan (tabel asset_notes independen + auto-clear), kategori
  disingkat, sortable header per kolom, filter tambahan
- **Fix RLS asset_notes** — policy "Allow all" direplikasi dari surat_jalan_items
- **Fix hydration mismatch Topbar** — tanggal di-render client-side via useEffect
- **Bulk import 560 catatan historis** dari Excel ke asset_notes
- **LPP Web Tracking reconciliation — design complete** (THESIS CORE):
  5 kondisi (Fisik di CGA, Belum Mutasi Oracle, Aset Intransit, Belum Mutasi WT,
  Fisik Allocated), siap masuk implementasi
- Dikerjakan di branch `fitur-percobaan`, merged ke `main`

## 11 Juni 2026
- **SJ Sesi 4 complete** — kolom Mutasi WT, hover-reveal batalkan, fix PATCH
  overwrite bug (conditional update)
- **Rekap Pengiriman dashboard live** — 3 card (Progres Mutasi Oracle, Top 5
  Jenis Keluar bulan berjalan via 2-step query, Trend harian recharts)
- **Warning card Belum Mutasi WT live**
- **Excel export** — tambah kolom Mutasi Oracle & Mutasi WT

## 10 Juni 2026
- **Bulk insert 928 master tujuan** via SQL dari Excel (list-tujuan.xlsx)
- **Rekap Alokasi sort** by No. SJ desc (terbaru di atas), item urutan asc
- **Upload DAT: Full Replace Strategy** — DELETE semua assets_raw dulu, INSERT fresh (batch 500). DAT adalah full snapshot, aset tidak ada di file = sudah dimutasi keluar CGA
- **`/api/process/route.ts`** diubah dari upsert ke delete-then-insert
- **cellToNumber fix** — smart dot detection untuk Oracle DAT mixed decimal format
- ~~BUG: hanya 27/4527 rows masuk DB setelah insert~~ — **RESOLVED**: root cause
  adalah DELETE berjalan di dalam setiap batch (bukan sekali di awal). Fix:
  `POST /api/process/clear` dipanggil sekali sebelum batch pertama,
  DELETE dihapus dari `/api/process/route.ts`
- **Planned:** fitur "Changed" di Classification (prev_jenis/prev_merk + ACC/Revert aksi)

## 9 Juni 2026 (Sore — Bug Fixes)
- **SearchableDropdown** — keyboard nav (↑↓Enter), Tab to next field, scroll fix, forwardRef
- **Cache invalidation** — edit/delete keyword rule sekarang invalidate semua cache (sama seperti add rule)
- **Fix no_merk revert** — DeleteConfirmModal kirim `revert_merk='Non-Merk'` bukan `revert_jenis`
- **Classifier 2-pass** — merk spesifik rules selalu diproses sebelum no_merk (Pass 1 skip no_merk, Pass 2 no_merk sebagai fallback)
- **cellToNumber fix** — smart dot detection untuk handle Oracle DAT format campuran (titik ribuan vs titik desimal)
- **Action required:** Upload ulang DAT TXT setelah deploy agar jumlah_tercatat ter-parse ulang dengan benar

## 9 Juni 2026
- **Keyword Rule Consistency** — AutocompleteInput + disable submit on casing mismatch, /api/keyword-rules/values endpoint, useKeywordRuleValues hook, SQL migration cleanup duplikat
- **SJ Rekap Alokasi filter refactor** — 3 dropdown → unified 7-field search, "Minggu Ini" label, dynamic Excel filename
- **Rename sidebar** — "List Surat Jalan" → "Daftar Surat Jalan", "Report" → "Rekap Alokasi"
- **Monitoring DAT overhaul** — multi-field AND tag filter, extractCGACode fix, kolom reorder + sort + Tercatat, horizontal scroll, Export Excel 2 sheet (Summary + Detail)
- **New files:** AutocompleteInput.tsx, useKeywordRuleValues.ts, TagInput.tsx, monitoringExporter.ts

## 8 Juni 2026 (Sore)
- **Surat Jalan Manual Sesi 3** — Report page + Excel export (SheetJS)
- **Print/PDF Feature** — SuratJalanPDF component, SJPreviewModal, auto-trigger setelah submit/edit/reschedule
- Logo Indomaret integration (cache module-level, fallback ke text)
- StyledSelect component for consistent dark theme dropdown
- Library `xlsx` added to dependencies

## 8 Juni 2026
- **Surat Jalan Manual Sesi 2** — Halaman List + Edit + Reschedule + Delete
- API `/api/sj` extensions: GET (list+detail), PATCH (reschedule_only + full edit), DELETE (CASCADE)
- Edit mode via `?edit={id}` di `/sj/buat` page (reuse form, replace items strategy)
- New hook `useSJList` + `useSJDetail`
- Bug fix: accentColor SummaryCard hanya support 4 warna (emerald → amber)

## 7 Juni 2026
- **CGA-only architecture refactor** — DB tidak lagi simpan non-CGA
- **Hapus `buildWarehouseFilter()`** dan semua join `assets_raw!inner(toko)`
- **Client-side pagination** untuk Classification (final decision)
- **Live Dashboard 6 baris** — DataStatusCards + CGASummaryCards live
- **Monitoring page 2 tab** — DAT live, LPP empty
- **Upload Data restructure** — page tersendiri dengan 4 panel
- **TXT Parser auto-detect** PIPE/TAB delimiter
- **Surat Jalan Manual Sesi 1** — schema + Buat SJ + Master Tujuan + sidebar dropdown
- **Hapus** `xlsxParser.ts`, `DistribusiCostCenter.tsx`, `TopJenisChart.tsx`, `/api/classification/`

## 6 Juni 2026
- Migrasi Excel → TXT parser
- Bulk upsert (51,459 baris dalam 85.6 detik)
- Keyword rule management (edit/delete/revert)
- No-merk classification
- Word boundary matching fix
- PDF Report generation
- Font consistency fix
- Warehouse filter CGA (later refactored to CGA-only)

## 17 Mei 2026
- Migrasi classifier ke database-driven
- Keyword rules sebagai single source of truth

## 13 Mei 2026
- Halaman Review Assets
- Sistem keyword rule

## 10 Mei 2026
- Initial upload pipeline
- Excel parser (later deprecated)
- Dashboard UI foundation
