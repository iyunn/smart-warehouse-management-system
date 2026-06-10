# PROJECT_CONTEXT.md

# Smart Asset Monitoring and Reconciliation System

> File ini berisi state sistem terkini. Untuk history kronologis sesi pengembangan, lihat `development-journal.md`.
> Terakhir diupdate: **7 Juni 2026** (setelah CGA-only refactor + Dashboard + Monitoring + SJ Manual Sesi 1)

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

# 2. Current Development State (per 7 Juni 2026)

## Features Completed

### Dashboard UI (6 Baris Layout)
Status: ✅ Completed (sebagian live, sebagian placeholder)

Layout final dashboard:

| Baris | Konten | Status |
|---|---|---|
| 1 | Status Data: DAT Update, DAT Closing, LPP Update, LPP Closing | DAT Update LIVE, lainnya placeholder |
| 2 | DAT vs LPP Comparison (per CGA1/2/3) | Placeholder |
| 3 | Trend Closing Bulanan (chart 12 bulan) | Placeholder |
| 4 | CGA Summary 3 cards: hijau/kuning/merah | LIVE |
| 5 | Closing vs Update (naik/turun per CGA) | Placeholder |
| 6 | Rekap Pengiriman per Kategori | Placeholder |

Plus:
- Welcome banner dynamic (count unknown aset)
- CTA "Klasifikasikan Sekarang" link ke /review
- DAT Update terakhir dari `MAX(uploaded_at)` di `assets_raw`

### Halaman /upload — Upload Data
Status: ✅ Completed (DAT Update fungsional, lainnya placeholder)

4 panel upload:
- DAT Update (LIVE)
- DAT Closing (placeholder)
- LPP Update (placeholder)
- LPP Closing (placeholder)

### Halaman /monitoring — Monitoring 2 Tab
Status: ✅ Completed (DAT live, LPP empty state)

**Tab DAT Monitoring:**
- List semua aset DAT yang belum punya SJ di Web Tracking
- Tag dummy "Pending" untuk semua (LPP belum ada)

**Tab LPP Monitoring:**
- Empty state karena data LPP belum tersedia

Kolom: Kategori | Jenis | Merk | Cost Center (badge warna) | Kode Aset | Deskripsi | Status

Filter: ALL/CGA1/CGA2/CGA3, search by kode/deskripsi, pagination client-side.

### Upload Pipeline (TXT Parser + Full Replace Strategy)
Status: ✅ Completed — ⚠ Bug Aktif (lihat Known Issues)

- TXT parser support delimiter PIPE `|` dan TAB `\t` (auto-detect)
- Smart number parsing: handle format titik-ribuan, koma-desimal, maupun titik-desimal Oracle
- Kolom finansial: `kuantitas`, `biaya_perolehan`, `jumlah_tercatat`
- **Strategi upload: Full Replace (Delete-then-Insert)**
  - DELETE semua `assets_raw` sebelum insert (`assets_clean` ikut terhapus via CASCADE)
  - INSERT fresh dari file (batch 500 rows)
  - DAT adalah full snapshot — aset tidak ada di file = sudah dimutasi keluar CGA
  - Menggantikan strategi upsert lama yang tidak bisa deteksi aset yang hilang
- ⚠ Bug aktif: hanya 27/4527 rows masuk DB setelah insert (lihat Known Issues)

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

### Surat Jalan Manual — Sesi 1 + 2 + 3 + Print/PDF
Status: ✅ Completed (3 dari 4 sesi + Print feature)

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

### ✅ Surat Jalan Sesi 4 — Alokasi Aset & Mutasi Oracle (10 Juni 2026)
- Input kode aset + checkbox mutasi Oracle per item di Rekap Alokasi (onBlur save,
  local override state, disabled untuk non-AT)
- Tag "Allocated" di assets_clean — partial index, 2-step write via assets_raw lookup,
  auto-cleanup kalau kode diubah/dikosongkan
- Badge "Allocated" di Monitoring DAT + kolom "Status Alokasi" di Excel export
- Dashboard warning cards (ganti welcome banner): Belum Input Kode Aset, Belum Mutasi
  Oracle, Belum Mutasi WT (placeholder LPP/WT)
- SQL migration: kolom tag + partial index di assets_clean

---

## Features In Progress

### Surat Jalan Manual — Sesi 4
Status: 🚧 Planned (Next sesi)

Monitoring alokasi:
- List barang yang sudah dialokasikan via SJ
- Checkbox "sudah mutasi Oracle" per item
- Deteksi fisik dikirim tapi belum dimutasi Oracle

---

## Features Planned

### 🎯 Next (Updated 10 Juni 2026)
- Closing snapshot architecture (upload closing DAT/LPP + dashboard baris 3 & 5)
- LPP Web Tracking integration (upload LPP, reconciliation DAT vs LPP, aktifkan
  dashboard baris 2 & monitoring tab LPP, aktifkan warning card Belum Mutasi WT)
- Authentication (Supabase Auth, role Admin/Viewer, protected routes)
- Hapus status "draft" dari SJ (dipertimbangkan — simplifikasi flow)
- Filter "Allocated only" di Monitoring (nice to have)

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

### DAT vs Web Tracking Reconciliation
Status: 📌 Planned

Fitur:
- Mismatch detection antara Oracle DAT dan Web Tracking
- Activate Dashboard Baris 2 (DAT vs LPP)
- Activate Monitoring Tab LPP
- Discrepancy dashboard

### LPP Web Tracking Integration
Status: 📌 Planned

Fitur:
- Upload LPP Update + Closing
- Reconciliation engine (DAT vs LPP)
- Mutasi Oracle auto-detect via cross-reference SJ Manual vs LPP

### Reporting Module — Excel Export
Status: 📌 Planned

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
- ~~`xlsx`~~ — **deprecated** sejak 6 Juni 2026 (migrasi ke TXT parser native)

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
- `kode_asset` (text) — optional, untuk linking ke assets_raw

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
│   │   └── tujuan/page.tsx           Master Tujuan CRUD
│   │
│   └── api/
│       ├── process/route.ts          Upload DAT pipeline
│       ├── reclassify/route.ts       Reclassify engine
│       ├── reports/dat-summary/route.ts
│       ├── dashboard/stats/route.ts  Dashboard live data
│       ├── monitoring/route.ts       Monitoring data
│       └── sj/
│           ├── route.ts              POST create SJ
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
│   │   └── PlaceholderCards.tsx      Baris 2, 3, 5, 6
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
│   ├── useDashboardStats.ts
│   ├── useMonitoring.ts
│   └── useSJMaster.ts                3 hooks: jenis/merk/tujuan
│
└── lib/
    ├── classifier.ts                 Word boundary matching
    ├── supabaseClient.ts
    ├── txtParser.ts                  Auto-detect PIPE/TAB
    ├── batchProcessor.ts
    ├── types.ts                      Tanpa buildWarehouseFilter
    ├── reviewTypes.ts
    └── sjTypes.ts                    + createEmptyItem helper
```

### File yang Sudah Dihapus
- `src/lib/xlsxParser.ts` (deprecated sejak migrasi TXT)
- `src/app/api/classification/route.ts` (digantikan client-side pagination)
- `src/components/dashboard/DistribusiCostCenter.tsx` (replaced dengan PlaceholderCards)
- `src/components/dashboard/TopJenisChart.tsx` (replaced dengan PlaceholderCards)

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
3. Show Dashboard → live CGA summary
4. Show Monitoring → tag pending (placeholder reconciliation)
5. Buat SJ Manual → autorecap (bandingkan dengan workflow manual existing tanpa rekap)
6. (Future) Upload LPP → reconciliation engine kick in

---

# 9. Known Issues & Technical Debt

## Current Issues

### ⚠ Upload DAT Delete-then-Insert Bug (AKTIF - PRIORITAS)
- Setelah diubah ke full replace strategy, INSERT hanya masuk 27 dari 4527 rows
- DELETE sudah benar (verified: `COUNT(*) = 0` setelah delete)
- Suspect: data yang dikirim dari client ke `/api/process` hanya 27 rows
- File yang perlu dicek: `UploadSection.tsx`, `batchProcessor.ts`

### Dashboard Placeholders
- Baris 2, 3, 5, 6 masih placeholder (menunggu data LPP & Closing)
- LPP belum ada data sama sekali

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
- Input fields kadang trigger hydration warning dari browser extensions
- Sudah di-suppress dengan `suppressHydrationWarning`

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

## 10 Juni 2026
- **Bulk insert 928 master tujuan** via SQL dari Excel (list-tujuan.xlsx)
- **Rekap Alokasi sort** by No. SJ desc (terbaru di atas), item urutan asc
- **Upload DAT: Full Replace Strategy** — DELETE semua assets_raw dulu, INSERT fresh (batch 500). DAT adalah full snapshot, aset tidak ada di file = sudah dimutasi keluar CGA
- **`/api/process/route.ts`** diubah dari upsert ke delete-then-insert
- **cellToNumber fix** — smart dot detection untuk Oracle DAT mixed decimal format
- **BUG AKTIF:** hanya 27/4527 rows masuk DB setelah insert — suspect di UploadSection.tsx / batchProcessor.ts
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
