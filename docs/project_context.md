# PROJECT_CONTEXT.md

# Smart Asset Monitoring and Reconciliation System

> File ini berisi state sistem terkini. Untuk history kronologis sesi pengembangan, lihat `development-journal.md`.
> Terakhir diupdate: **19 Juni 2026** (Cross-CGA Mismatch Kondisi 6 + Import SJ Web Tracking dari PDF)

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

# 2. Current Development State ( per 18 Juni 2026 )

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
  - INSERT fresh dari file (batch 500 rows), client kirim `batchIndex`/`totalBatches`/
    `isLastBatch` di setiap request batch
  - DAT adalah full snapshot — aset tidak ada di file = sudah dimutasi keluar CGA
- Re-apply tag "Allocated" — hanya jalan di **batch terakhir** (`isLastBatch`), query
  ulang `assets_raw` lengkap dari DB (bukan data parsial per-batch). Query
  `.in()` di-chunk per 200 kode_asset (fix 18 Juni, lihat di bawah)
- Auto-clear `asset_notes` untuk kode_asset yang sudah keluar CGA — hanya jalan di
  **batch terakhir**, dibandingkan terhadap seluruh `assets_raw` dari DB via
  `fetchAllKodeAsset()` (helper dengan pagination loop, fix 18 Juni — lihat
  fix kritis 17 Juni & 18 Juni di Recent Changes Log)

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

### Surat Jalan Manual — Sesi 1-4 + Print/PDF + Arsip + Template Item
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

### ✅ Fix — PDF Surat Jalan, Label Signature (16 Juni 2026)
- Label "Dibawa"/"Diterima" dikonfirmasi sudah benar di kode (sempat dikira
  salah karena versi lama masih "Pembawa"/"Penerima" di beberapa env)
- Warna font label signature (Dibuat/Disetujui/Dibawa/Diterima) diubah dari
  abu-abu muted jadi hitam pekat (`#0a0a0a`) + bold — alasan: rawan tertimbun
  tinta stempel/bolpen di kertas fisik
- File: `SuratJalanPDF.tsx`

### ✅ Redesign — Excel Export Monitoring (Sheet Summary) (16 Juni 2026)
- Sheet "Summary" diubah total dari flat list (grouping jenis×toko) jadi
  **3 tabel side-by-side per CGA** (CGA1 kolom B-G, gap, CGA2 kolom I-N, gap,
  CGA3 kolom P-U), masing-masing di-group Kategori → Jenis dengan kolom
  Kategori/Jenis/Item/Qty/Perolehan/Tercatat, subtotal per kategori, dan
  Grand Total per CGA
- Sheet "Detail DAT" tidak disentuh sama sekali
- **Catatan teknis penting**: SheetJS community edition (`xlsx` npm package)
  TIDAK mendukung cell styling (fill warna, border warna, bold) saat menulis
  file — itu eksklusif SheetJS Pro. Keputusan: tetap pakai `xlsx` tanpa warna
  (struktur/grouping/merge cell tetap jalan, cuma visualnya polos)
- File: `monitoringExporter.ts`

### ✅ Redesign — Export PDF Rekap DAT (16 Juni 2026)
- Trigger dipindah dari halaman `/reports` (dihapus) ke tombol "Export PDF"
  baru di halaman Monitoring (sebelah kiri tombol "Export Excel")
- Menu "Reports" dihapus dari Sidebar
- **Page-break per CGA** — setiap CGA render di `<Page>` `@react-pdf/renderer`
  tersendiri (sebelumnya semua CGA digabung 1 halaman panjang); kalau konten
  CGA tidak penuh 1 halaman, sisanya kosong, CGA berikutnya mulai halaman baru
- **Styling warna per CGA** — header & total toko solid sesuai badge UI
  (CGA1=emerald, CGA2=amber, CGA3=rose), kategori header & subtotal pakai
  versi pudar (opacity diturunkan), row alternate sangat pudar
- API `dat-summary/route.ts` tidak diubah (sudah summary-only by design)
- File: `DATSummaryDocument.tsx`, `Sidebar.tsx`, `monitoring/page.tsx`

### ✅ Fix Kritis — Auto-clear asset_notes & Multi-batch Upload (17 Juni 2026)
- Root cause: `POST /api/process` dipanggil **per batch** (500 rows/batch) dari
  client, tapi step auto-clear `asset_notes` & re-apply tag "Allocated" jalan
  di **setiap batch** dengan `rawIdMap` yang cuma berisi kode_asset dari batch
  itu sendiri — bukan keseluruhan upload. Akibatnya hampir semua `asset_notes`
  salah dianggap "stale" dan terhapus total
- Fix: client (`batchProcessor.ts`) kirim `batchIndex`/`totalBatches`/
  `isLastBatch` per request; server (`route.ts`) skip kedua step kecuali
  `isLastBatch`, dan saat itu query ulang **seluruh** `assets_raw` dari DB
  (bukan `rawIdMap` parsial) — perbandingan "stale" jadi akurat
- Bonus: re-apply tag Allocated juga lebih efisien (1x di akhir dengan data
  lengkap, bukan 10x dengan data parsial yang sebagian besar sia-sia)

### ✅ Fix — PDF Surat Jalan Pagination (17 Juni 2026)
- Bug: react-pdf gagal page-break otomatis di tabel >15 item — seluruh
  tabel "all-or-nothing" pindah ke halaman 2, header tersisa sendirian di
  halaman 1
- Fix: manual pagination — items di-chunk maksimal 15/halaman, header surat
  lengkap (logo, No SJ, Tanggal, Kepada Yth, intro) dan header tabel diulang
  di setiap halaman, Total Item/Qty + signature hanya di halaman terakhir
- File: `SuratJalanPDF.tsx`

### ✅ Fitur Baru — Template Item SJ (17 Juni 2026)
- User bisa simpan kombinasi item yang sering berulang (mis. paket "SDN")
  dan menerapkannya saat Buat/Edit SJ — item template ditambahkan ke bawah
  item yang sudah diisi, urutan auto-renumber
- Schema: tabel baru `sj_item_templates` (single table + JSONB, bukan
  relasional — template selalu dipakai utuh, tanpa join)
- `serial_number` TIDAK disimpan di template (unik per unit fisik),
  dikosongkan saat diterapkan untuk diisi manual
- Template bersifat shared (semua user lihat & pakai sama)
- Halaman baru `/sj/templates` — buat (reuse `SJItemsTable`) + hapus
  template, menu baru di dropdown Sidebar "Surat Jalan Manual"
- Tombol "Pakai Template" (dropdown ungu) di form Buat/Edit SJ, posisi
  saat ini di header "Detail Barang" — **rencana pindah** ke sebelahan
  tombol "Tambah Baris" (belum dikerjakan, next session)

### ✅ Import SJ Web Tracking dari PDF (19 Juni 2026)
Status: ✅ Completed

User upload PDF SJ WT → SmartWMS otomatis buat SJ record + isi kode_asset
di Rekap Alokasi tanpa input manual. Menyelesaikan gap "WT tidak ada fitur autorecap".

**Tantangan teknis:** pdfjs-dist ekstrak teks per "text run" PDF (tiap kolom
tabel = item terpisah). Solusi: dual-mode parsing — `fullText` (join spasi)
untuk header regex, `lines` (join newline) untuk kode_asset detection. Tidak
andalkan header tabel, langsung cari kode_asset pertama sebagai anchor.

**Implementasi:**
- `pdfjs-dist@3.11.174` — Worker di-copy ke `public/pdf.worker.min.js`
- `src/lib/wtSJParser.ts` — parser PDF → `WTParsedSJ`
- `src/app/api/sj/import-wt/route.ts` — auto-create tujuan, generate No SJ
  SmartWMS, insert surat_jalan + items (`kode_asset` + `mutasi_wt_status=true`)
- `src/components/UploadWTSJSection.tsx` — drag PDF → preview modal → submit
  (dynamic import `ssr:false`, hindari konflik canvas module Turbopack)
- Section baru "Surat Jalan Web Tracking" di halaman Upload Data

**Pending minor:** card "Import SJ WT Bulk" dipindah ke bawah agar card utama
bisa full-width (keterangan tidak overflow).

---

## Features In Progress

tidak ada fitur yang sedang dikerjakan saat ini

---

## Features Planned

### 🎯 Next (Updated 19 Juni 2026)
- **Export Excel hasil Reconciliation** — satu-satunya yang masih kurang dari fitur reconciliation
- **Integrasi Mutasi WT otomatis** dari LPP — sengaja ditunda
- **UI minor: card Import SJ WT Bulk** dipindah ke bawah card Import SJ WT (keterangan overflow card)
- **UI minor: tombol "Pakai Template"** dipindah ke sebelahan "Tambah Baris"
- Kondisi 3 "Aset Intransit" — **target pengembangan jangka panjang (sebagai bahan penelitian lanjutan dan tidak akan dilakukan di penelitian ini)** (butuh file Report Intransit yang belum diperoleh, bukan prioritas saat ini)
- "Changed" filter di Classification — prioritas rendah
- Closing Snapshot Architecture — ditunda
- Authentication (Supabase Auth, role Admin/Viewer)
- Bab 3 & 4 laporan TA — semua fitur core sudah cukup matang untuk ditulis

### LPP Web Tracking Reconciliation (THESIS CORE TOPIC)
Status: ✅ Tahap 1-3 Implemented (18 Juni 2026) — kurang: Export Excel hasil reconciliation + Kondisi 3 "Aset Intransit" (target jangka panjang / sebagai bahan penelitian lanjutan dan tidak akan dilakukan di penelitian ini)

**Konteks LPP:**
- LPP = output dari program Web Tracking (.xls per cost center, file
  terpisah untuk CGA1/CGA2/CGA3). Kolom: Nomor, No Aktiva (= kode_asset),
  Deskripsi, Saldo Awal, Masuk, Keluar, Saldo_Akhir
- File `.xls` sebenarnya **HTML table** (bukan Excel biner) — diparse via
  `DOMParser`, bukan SheetJS
- LPP CGA = daftar kode_asset yang menurut Web Tracking masih berlokasi di CGA
- Perpindahan lokasi terjadi via Surat Jalan Web Tracking (per kode_asset),
  harus di-BTB (Bukti Terima Barang) oleh cost center tujuan. Sebelum BTB,
  status "intransit" di lokasi asal
- Ada output terpisah "Report Intransit" — daftar kode_asset yang sudah
  dibuatkan SJ WT tapi belum di-BTB tujuan (file belum diperoleh — kondisi
  3 masih belum bisa diimplementasi namun sekarang sebagai bahan penelitian lanjutan dan tidak akan dilakukan di penelitian ini)

**5 Kondisi (kondisi 3 "Aset Intransit" tidak diimplementasi dalam TA ini — saran penelitian lanjutan):**

| # | DAT (CGA?) | LPP (CGA?) | Status | Aksi |
|---|---|---|---|---|
| 1 | Ya | Ya | Fisik masih di CGA | Normal, tidak ada aksi |
| 2 | Ya | Tidak | Belum Mutasi Oracle | Admin gudang harus mutasi Oracle segera |
| 3 | — | — | Aset Intransit (cross-cut) | Sudah SJ WT, belum BTB tujuan — **tidak diimplementasi dalam TA ini, dijadikan saran penelitian lanjutan** |
| 4 | Tidak | Ya | Belum Mutasi WT | Admin gudang harus buat SJ WT segera |
| 5 | Tidak | Tidak | Fisik Allocated | Normal, konsisten sudah keluar CGA |

Kondisi 2 dan 4 adalah **warning aktif** yang harus ditangani admin gudang —
keduanya sama pentingnya (administrasi sehat = tidak ada selisih = kondisi 1/5).

**Universe untuk kondisi 5** dibatasi ke kode_asset yang PERNAH tercatat di
sistem (union `assets_raw` ∪ `lpp_raw` ∪ `surat_jalan_items.kode_asset`) —
bukan literal seluruh kode aset yang mungkin ada, supaya hasilnya bermakna
dan terbatas (finite).

**Implementasi (Tahap 1-3, selesai):**
- **Tahap 1 — Upload pipeline**: `lpp_raw` table, `lppParser.ts` (parse
  HTML-table-as-.xls client-side, auto-detect CGA dari nama file),
  `lppBatchProcessor.ts`, API `/api/lpp/clear` + `/api/lpp/process`,
  UI `UploadLPPSection.tsx` (drag 3 file sekaligus di halaman Upload Data)
- **Tahap 2 — LPP Monitoring tab**: tab "LPP Monitoring" di halaman
  Monitoring (sebelumnya empty state) sekarang fungsional — filter Cost
  Center, search kode_asset/deskripsi, 4 summary card, tabel berpaginasi.
  API `/api/lpp/monitoring`, hook `useLPPMonitoring`
- **Tahap 3 — Reconciliation engine**: API `/api/reconciliation` hitung 4
  kondisi (server-side, fetch `assets_raw`+`lpp_raw`+`surat_jalan_items`,
  set operations by kode_asset). Halaman baru `/reconciliation` — 4 summary
  card (clickable filter), filter Cost Center + search, tabel hasil dengan
  badge kondisi. Hook `useReconciliation`. Menu baru di Sidebar.

**Bug ditemukan & fixed (18 Juni 2026):** badge CGA di tabel reconciliation
tampil sebagai teks panjang ("CGA1 - Cadangan General Affairs 1") bukan
badge bersih "CGA1" — root cause: `assets_raw.toko` simpan label panjang,
beda dengan `lpp_raw.toko` yang sudah bersih (diekstrak dari filename).
Fix: helper `extractCGACode()` (regex `CGA\d`) diterapkan saat build
`datMap` di `reconciliation-route.ts`, sebelum dikirim ke client.

**Status repo:** sudah di-merge ke `main` (18 Juni 2026). Dikerjakan di
branch `feature/reconciliation` (dibuat di GitHub Codespace untuk
menghindari risiko kehilangan progress / merusak `main` kalau session
berakhir di tengah jalan), commit di-amend jadi message proper, di-merge
ke `main` dengan `--ff-only`, branch lokal & remote sudah dihapus.

**Known Limitations (ditemukan saat audit 18 Juni):**
- ~~**Tidak ada freshness indicator**~~ — **SELESAI (18 Juni)**: timestamp
  DAT & LPP terakhir diupload dipindah ke **Sidebar** (widget "DAT Update"/
  "LPP Update" di atas user profile, hanya saat sidebar tidak collapsed) via
  API ringan `/api/freshness`. `DataStatusCards` di Dashboard dihapus karena
  info ini sudah ada di Sidebar yang lebih persistent lintas halaman.
- ~~**Tidak ada deteksi cross-CGA mismatch**~~ — **SELESAI (19 Juni)**:
  Kondisi 6 "Mismatch CGA" ditambahkan ke engine reconciliation. Kalau
  kode_asset ada di DAT CGA1 tapi LPP mencatat CGA2, sekarang ter-flag
  sebagai Kondisi 6 (badge ungu, warning). Field `tokoLPP` ditambah ke
  `ReconciliationItem` untuk simpan CGA sisi LPP. Tabel tampilkan
  `[CGA1] → [CGA2]` (DAT → LPP). Summary card ke-5 di halaman Reconciliation.
- ~~**Tidak ada tracking durasi/aging**~~ — **SKIP (19 Juni, keputusan final)**:
  tidak relevan untuk konteks tim kecil yang upload ad-hoc, angka aging
  bisa misleading karena jadwal upload tidak konsisten. Bisa disebutkan
  sebagai "future enhancement" di laporan TA tanpa diimplementasi.
- **Drill-down dari tabel hasil — SEBAGIAN sudah ada (18 Juni)**: angka
  "Belum Mutasi Oracle"/"Belum Mutasi WT" di Dashboard Baris 2 sekarang
  clickable → navigasi ke `/reconciliation?kondisi=X&cga=Y` dengan filter
  otomatis ter-apply (lihat "Aktivasi Dashboard Baris 2" di bawah). **Yang
  masih kurang**: dari tabel `/reconciliation` itu sendiri, klik baris
  Kondisi 4 belum ada tombol langsung "Buat SJ WT" atau link ke baris
  terkait di Rekap Alokasi — drill-down baru sampai level filter, belum
  sampai level aksi

### ✅ Aktivasi Dashboard Baris 2 — DAT vs LPP per CGA (18 Juni 2026)
Baris 2 di Dashboard (sebelumnya placeholder "Coming Soon" 3 card per CGA)
sekarang live, reuse `useReconciliation` hook (tidak ada API/query baru):

- Komponen baru `DATvsLPPCards.tsx` — self-contained, fetch data sendiri
- Tiap card CGA tampilkan 4 angka: **Total DAT**, **Total LPP**, **Belum
  Mutasi Oracle** (Kondisi 2, amber), **Belum Mutasi WT** (Kondisi 4, rose)
- **Lesson learned penting**: awalnya didesain sebagai 1 angka "Selisih"
  (`Total DAT - Total LPP`), tapi ini SALAH SECARA KONSEPTUAL — user
  menyadari subtraksi sederhana bisa menyembunyikan masalah nyata. Contoh
  kasus asli: CGA1 Total DAT 2.675, Total LPP 2.690 → subtraksi = 15
  (kelihatan kecil), tapi breakdown asli: 178 aset "Belum Mutasi Oracle" +
  193 aset "Belum Mutasi WT" (dua masalah BEDA, bukan saling meniadakan)
  = **371 aset** yang sebenarnya butuh tindakan. Subtraksi naive bikin
  ~356 aset bermasalah jadi tidak kelihatan. **Keputusan final**: tampilkan
  Kondisi 2 dan Kondisi 4 sebagai 2 angka terpisah, JANGAN pernah
  digabung/dikurangi jadi 1 angka "selisih"
- **Deep-link Dashboard → Reconciliation**: angka "Belum Mutasi Oracle"/
  "Belum Mutasi WT" adalah `<Link>` ke `/reconciliation?kondisi=2&cga=CGA1`
  (atau `kondisi=4`). Halaman `/reconciliation` baca query param via
  `useSearchParams` (di `useEffect`, sekali saat mount) dan pre-apply
  filter kondisi+CGA. Karena `useSearchParams` butuh `Suspense` boundary,
  komponen di-rename jadi `ReconciliationPageContent` dibungkus
  `<Suspense>` di default export — pattern yang sama dengan `sj/buat/page.tsx`

**Yang belum dikerjakan:**
- **Integrasi Mutasi WT otomatis** — sengaja ditunda
- Kondisi 3 "Aset Intransit" — **tidak diimplementasi dalam TA ini**,
  dijadikan **saran penelitian lanjutan** (butuh file Report Intransit
  yang belum diperoleh + di luar boundary penelitian ini)
- **Export Excel hasil Reconciliation** — belum ada, ini yang paling
  actionable untuk dilengkapi (bisa reuse pattern export dari Monitoring)
- Drill-down dari tabel `/reconciliation` ke aksi langsung (Buat SJ WT, dst)
- Semua gap teknis dari audit 18 Juni sudah resolved/skipped (lihat Known Limitations)
  **prioritas sesi berikutnya** (konfirmasi user, 18 Juni)

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

### Reporting Module — Excel Export & PDF
Status: ✅ Sebagian besar selesai (SJ Rekap Alokasi, Monitoring 3-tabel per CGA, DAT Summary PDF)
- Monitoring Excel: 3 tabel side-by-side per CGA dengan grouping Kategori→Jenis
  (tanpa warna — limitasi SheetJS community edition)
- DAT Summary PDF: page-break + warna per CGA, trigger dari tombol di Monitoring
- Pending: Export Excel untuk hasil reconciliation (belum ada, prioritas berikutnya)
- Kondisi 3 "Aset Intransit" — **tidak diimplementasi dalam TA ini** (saran penelitian lanjutan)

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

## lpp_raw

Data LPP (Laporan Posisi Perlengkapan) dari Web Tracking — 1 baris per
kode_asset per CGA. Sumber: file `.xls` per cost center (CGA1/CGA2/CGA3),
sebenarnya HTML table dengan ekstensi `.xls` (bukan Excel biner), diparse
client-side via `DOMParser` (bukan SheetJS).

Field utama:
- `id` (uuid, PK)
- `kode_asset` (text) — sama format dengan `assets_raw.kode_asset`
- `toko` (text) — "CGA1"/"CGA2"/"CGA3", **sudah bersih** (diekstrak dari
  nama file saat upload, BEDA dengan `assets_raw.toko` yang masih label
  panjang "CGA1 - Cadangan General Affairs 1")
- `deskripsi` (text)
- `saldo_awal`, `masuk`, `keluar`, `saldo_akhir` (integer)
- `uploaded_at` (timestamptz)

Strategi upload: Full Replace (Delete-then-Insert) — 3 file (CGA1/2/3)
selalu diupload bersamaan dalam 1 dropzone, CGA auto-detect dari nama file
(regex `CGA[123]`, case-insensitive). Memakai pola `isLastBatch` yang sama
dengan fix DAT (lihat 17 Juni) untuk mencegah kelas bug yang sama.

Index: `kode_asset`, `toko` (untuk lookup cepat saat reconciliation).

RLS: policy "Allow all on lpp_raw" (PERMISSIVE, public, ALL, true/true).

---

## asset_notes

Catatan bebas per kode_asset (Monitoring v2). Independen dari lifecycle DAT —
hanya berisi baris untuk aset yang punya catatan.

Field utama:
- `kode_asset` (text, PK)
- `catatan` (text)
- `updated_at` (timestamptz)

Auto-clear: saat upload DAT (batch terakhir saja, lihat fix 17 Juni), baris
dihapus kalau `kode_asset` tidak ada di DAT baru (aset sudah keluar CGA →
siklus catatan dianggap selesai).

RLS: policy "Allow all on asset_notes" (PERMISSIVE, public, ALL, true/true) —
replikasi pola tabel lain.

---

## sj_item_templates

Template kombinasi item SJ yang sering berulang (mis. paket "SDN") — bisa
diterapkan saat Buat/Edit SJ agar item bertambah otomatis. Single table +
JSONB (bukan relasional) karena template selalu dipakai utuh, tanpa join.

Field utama:
- `id` (uuid, PK)
- `nama` (text, UNIQUE)
- `items` (jsonb) — array of `{ jenis, merk, qty, satuan, is_baru, is_aktiva, keterangan }`
  (TANPA `serial_number` — unik per unit fisik, diisi manual saat diterapkan)
- `created_at` (timestamptz)

RLS: policy "Allow all on sj_item_templates" (PERMISSIVE, public, ALL, true/true).

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
- **WAJIB pagination loop untuk query tabel besar** (per 18 Juni 2026) —
  Supabase PostgREST default limit 1000 baris/query, query tanpa `.range()`
  DIAM-DIAM truncate tanpa error. Berlaku untuk SEMUA tabel yang bisa >1000
  baris (`assets_raw`, `lpp_raw`, dst): pakai pola `FETCH_SIZE=1000` + loop
  `.range(from, from+FETCH_SIZE-1)` sampai batch result < FETCH_SIZE. Sudah
  diterapkan di `dat-summary`, `lpp/monitoring`, `reconciliation` — celah
  ditemukan & fixed di `api/process/route.ts` (auto-clear asset_notes +
  re-apply tag Allocated, root cause bug data loss 18 Juni)

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
│   ├── upload/page.tsx               Upload Data (4 panel, + UploadLPPSection)
│   ├── monitoring/page.tsx           Monitoring (2 tab — DAT + LPP, keduanya live)
│   ├── reconciliation/page.tsx       Reconciliation DAT vs LPP (4 kondisi, kondisi 3 pending)
│   ├── review/page.tsx               Classification
│   │
│   ├── sj/
│   │   ├── buat/page.tsx             Buat Surat Jalan (+ TemplatePicker)
│   │   ├── list/page.tsx             Daftar SJ (+ kolom Arsip)
│   │   ├── report/page.tsx           Rekap Alokasi (Sesi 3+4)
│   │   ├── tujuan/page.tsx           Master Tujuan CRUD
│   │   └── templates/page.tsx        Kelola Template Item (buat + hapus)
│   │
│   └── api/
│       ├── process/
│       │   ├── route.ts              Upload DAT pipeline (re-apply tag & auto-clear notes HANYA di batch terakhir)
│       │   └── clear/route.ts        DELETE assets_raw (dipanggil sekali sebelum batch)
│       ├── reclassify/route.ts       Reclassify engine
│       ├── reports/dat-summary/route.ts  Dipanggil dari tombol Export PDF di Monitoring
│       ├── dashboard/stats/route.ts  Dashboard live data (+ Rekap Pengiriman)
│       ├── monitoring/route.ts       Monitoring data DAT (GET + PATCH catatan)
│       ├── freshness/route.ts          GET timestamp upload terakhir DAT & LPP (2 query ringan, maybeSingle)
│       ├── reconciliation/route.ts   Engine 4 kondisi (set ops by kode_asset, extractCGACode untuk badge)
│       ├── lpp/
│       │   ├── clear/route.ts        DELETE semua lpp_raw (full replace)
│       │   ├── process/route.ts      Batch insert lpp_raw
│       │   └── monitoring/route.ts   GET semua lpp_raw (untuk LPP Monitoring tab)
│       └── sj/
│           ├── route.ts              GET/POST/PATCH/DELETE SJ (+ archive_only)
│           ├── report/route.ts       PATCH alokasi (kode_asset, mutasi_oracle, mutasi_wt)
│           ├── tujuan/route.ts       CRUD tujuan
│           ├── templates/route.ts    GET/POST/DELETE template item
│           ├── import-wt/route.ts    POST import SJ dari PDF WT (auto-create tujuan, mutasi_wt_status=true)
│           └── master/
│               ├── jenis/route.ts    DISTINCT 5-min cache
│               └── merk/route.ts     DISTINCT 5-min cache
│
├── components/
│   ├── Sidebar.tsx                   Dropdown support (menu Reports dihapus, +Template Item, +Reconciliation)
│   ├── Topbar.tsx
│   ├── SummaryCard.tsx
│   ├── UploadSection.tsx             Dipakai di /upload (DAT)
│   ├── UploadLPPSection.tsx          Dipakai di /upload (LPP, multi-file 3 CGA sekaligus)
│   ├── UploadWTSJSection.tsx         Dipakai di /upload (Import SJ WT dari PDF, dynamic ssr:false)
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
│   │   ├── DataStatusCards.tsx       Baris 1 — DIHAPUS dari Dashboard (18 Juni, info pindah ke widget Sidebar)
│   │   ├── CGASummaryCards.tsx       Baris 4 (live)
│   │   ├── DashboardWarningCards.tsx Warning cards (3, semua live)
│   │   ├── RekapPengirimanCards.tsx  Baris 6 (live, 3 card)
│   │   ├── DATvsLPPCards.tsx         Baris 2 (live sejak 18 Juni, reuse useReconciliation, deep-link ke /reconciliation)
│   │   └── PlaceholderCards.tsx      Baris 3, 5 (Baris 2 sudah pindah ke DATvsLPPCards.tsx)
│   │
│   ├── sj/
│   │   ├── SearchableDropdown.tsx    Portal-based
│   │   └── SJItemsTable.tsx          + SatuanSelect inline, dipakai juga di editor Template Item
│   │
│   └── reports/
│       ├── DATSummaryDocument.tsx    Page-break per CGA, styling warna per CGA
│       └── SuratJalanPDF.tsx         Manual pagination max 15 item/halaman
│
├── hooks/
│   ├── useReviewAssets.ts            Client-side pagination
│   ├── useKeywordRule.ts
│   ├── useReclassify.ts
│   ├── useDashboardStats.ts          + RekapPengiriman, MutasiProgress, TopJenis
│   ├── useMonitoring.ts              + invoice_number, tanggal_dokumen, catatan, useLPPMonitoring
│   ├── useReconciliation.ts          Fetch hasil reconciliation 4 kondisi
│   ├── useSJList.ts                  + is_archived
│   ├── useSJReport.ts                + mutasi_wt, is_mutated
│   └── useSJMaster.ts                4 hooks: jenis/merk/tujuan/templates
│
└── lib/
    ├── classifier.ts                 Word boundary matching
    ├── supabaseClient.ts
    ├── txtParser.ts                  Auto-detect PIPE/TAB + parseTanggalDokumen
    ├── batchProcessor.ts
    ├── lppParser.ts                  Parse HTML-table-as-.xls (DOMParser, bukan SheetJS), auto-detect CGA dari filename
    ├── lppBatchProcessor.ts          Mirror batchProcessor.ts, pola isLastBatch sama
    └── wtSJParser.ts                 Parse PDF SJ WT via pdfjs-dist v3 (dual-mode: fullText untuk header, lines untuk tabel)
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
- `src/app/reports/page.tsx` (16 Juni 2026 — trigger Export PDF dipindah ke
  tombol di halaman Monitoring, menu "Reports" dihapus dari Sidebar)

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
6. Upload LPP (3 file CGA1/2/3) → Reconciliation engine: 5 kondisi DAT vs LPP
   (Kondisi 3 Aset Intransit tidak diimplementasi — saran penelitian lanjutan)

---

# 9. Known Issues & Technical Debt

## Current Issues

### Dashboard Placeholders
- Baris 3 & 5 masih placeholder (menunggu Closing Snapshot Architecture)
- Baris 1 "Status Data" (`DataStatusCards`) **dihapus** (18 Juni) — info
  digantikan oleh widget freshness di Sidebar yang lebih persistent
- Baris 2 (DAT vs LPP per CGA) sudah LIVE sejak 18 Juni — `DATvsLPPCards.tsx`
- Baris 6 (Rekap Pengiriman) sudah LIVE

### Reconciliation Engine — Known Limitations
- ✅ Freshness indicator — SELESAI, di Sidebar (`/api/freshness`)
- ✅ Cross-CGA mismatch — SELESAI (19 Juni), Kondisi 6 di engine + halaman
- ~~Aging/durasi tracking~~ — **SKIP** (tidak relevan untuk konteks tim kecil
  + upload ad-hoc, bisa disebutkan sebagai future enhancement di laporan TA)
- ⏳ Drill-down dari tabel ke aksi langsung — belum dikerjakan

### Classification Accuracy

### Supabase Storage & Scaling Analysis (19 Juni 2026)
Total storage terpakai: **~4 MB dari 500 MB** (0.8%) — sangat aman.

Tabel berdasarkan pola pertumbuhan:
- **Full-replace (tidak bertumbuh):** `assets_raw`, `assets_clean`, `lpp_raw` — ukuran tetap ~4666/4666/4690 rows setiap upload
- **Akumulasi (bertumbuh):** `surat_jalan`, `surat_jalan_items`, `asset_notes`, `keyword_rules`

Proyeksi: ~117 KB/bulan dari tabel SJ (estimasi 50 SJ × 8 item). Butuh **ratusan tahun** untuk kena limit 500 MB dari data SJ saja.

**Risiko lebih nyata:** Supabase free plan **pause proyek setelah 7 hari tidak aktif** — ini yang perlu diwaspadai untuk demo TA, bukan storage.

**Untuk re-struktur DB di masa depan** (kalau data SJ sudah ribuan):
- Fokus ke tabel yang bertumbuh: `surat_jalan*` dan `asset_notes`
- Pertimbangkan archiving/soft-delete strategy (misal SJ > 1 tahun di-archive ke tabel terpisah)
- `keyword_rules` bisa dibersihkan kalau ada duplikat/stale rules
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

## 19 Juni 2026 (lanjutan — Import SJ WT + Supabase Storage Analysis)
- **Fitur Import SJ Web Tracking dari PDF** — user upload PDF SJ WT →
  SmartWMS otomatis buat SJ record + isi kode_asset di Rekap Alokasi.
  Parser dual-mode (fullText spasi untuk header, lines newline untuk tabel)
  karena pdfjs-dist v3 split teks per text run. Auto-create tujuan kalau
  belum ada. `mutasi_wt_status=true` otomatis. Preview modal sebelum submit.
  Pakai pdfjs-dist v3 (bukan v6 — v6 butuh ES2024 API yang belum tersedia
  di Codespace). Dynamic import `ssr:false` untuk hindari konflik Turbopack.
- **Supabase storage analysis** — total ~4MB dari 500MB (0.8%). Tabel yang
  bertumbuh: surat_jalan*, asset_notes, keyword_rules. Risiko lebih nyata:
  pause 7 hari tidak aktif (penting untuk demo TA). Lihat detail di Known
  Issues "Supabase Storage & Scaling Analysis"
- **`docs/chat-rule.md`** ditambahkan ke repo — panduan untuk AI/sesi baru,
  berisi workflow rules, cara baca repo via curl, Codespace workflow notes,
  Supabase row-limit reminder, dan session startup protocol

## 19 Juni 2026
- **Cross-CGA Mismatch — Kondisi 6**: engine reconciliation sekarang deteksi
  aset yang ada di BOTH DAT & LPP tapi CGA-nya berbeda. Kondisi 1 dipecah:
  CGA sama → tetap K1, CGA beda → K6 "Mismatch CGA" (warning, ungu).
  Field baru `tokoLPP` di item untuk simpan CGA sisi LPP. Tabel tampilkan
  `[CGA1] → [CGA2]` badge. 5 summary card (grid `md:grid-cols-5`).
- **Aging/durasi tracking — SKIP**: diputuskan tidak perlu diimplementasi.
  Tidak relevan untuk tim kecil + upload ad-hoc. Bisa jadi future enhancement
  di laporan TA. Gap teknis reconciliation yang tersisa hanya drill-down aksi.

## 18 Juni 2026 (lanjutan — freshness indicator + DataStatusCards)
- **Freshness indicator DAT & LPP dipindah ke Sidebar** — widget "DAT
  Update"/"LPP Update" di atas user profile (hanya saat sidebar tidak
  collapsed), persistent lintas semua halaman. API baru `/api/freshness`
  (2 query × 1 baris, `maybeSingle()` agar tidak throw kalau tabel kosong)
- **DataStatusCards dihapus dari Dashboard** — informasi yang sama sudah
  ada di Sidebar, jadi card Baris 1 "Status Data" redundant dan dihapus
- Proses: sempat diimplementasi sebagai `FreshnessBanner` di halaman
  Reconciliation (3 file), lalu diputuskan dipindah ke Sidebar (lebih
  persistent). File reconciliation di-revert ke versi sebelum FreshnessBanner

## 18 Juni 2026 (lanjutan — Dashboard Baris 2 + deep-link)
- **Aktivasi Dashboard Baris 2** (DAT vs LPP per CGA) — komponen baru
  `DATvsLPPCards.tsx`, reuse `useReconciliation` hook, tidak ada
  API/query baru. `PlaceholderCards.tsx` dibersihkan (export
  `DATvsLPPPlaceholder` dihapus, sudah tidak dipakai)
- **Lesson learned**: desain awal "Selisih" (`Total DAT - Total LPP`)
  salah secara konseptual — bisa menyembunyikan masalah nyata kalau
  Kondisi 2 dan Kondisi 4 sama besar (saling meniadakan secara aritmatika
  padahal itu 2 masalah berbeda, aset berbeda). User menemukan ini dari
  data asli (CGA1: subtraksi cuma "15", breakdown asli 178+193=371 aset
  bermasalah). Keputusan final: tampilkan Kondisi 2 & 4 sebagai 2 angka
  terpisah, tidak pernah digabung jadi 1 angka selisih
- **Deep-link Dashboard → Reconciliation**: angka "Belum Mutasi Oracle"/
  "Belum Mutasi WT" jadi `<Link>` ke `/reconciliation?kondisi=X&cga=Y`,
  halaman tujuan baca query param via `useSearchParams` dan pre-apply
  filter. Reconciliation page di-refactor pakai `Suspense` boundary
  (pattern sama dengan `sj/buat/page.tsx`)

## 18 Juni 2026 (lanjutan — bugfix setelah Reconciliation Tahap 1-3)
- **Fix kritis: auto-clear `asset_notes` & re-apply tag salah hapus data
  karena Supabase row-limit** — root cause: query `assets_raw.kode_asset`
  di `api/process/route.ts` tidak pakai pagination, Supabase PostgREST
  diam-diam truncate ke 1000 baris pertama (DAT 4666 baris → cuma 1000
  ke-fetch → 3666 kode_asset valid salah dianggap "tidak ada di DAT" →
  catatan di kode_asset yang jatuh di luar 1000 pertama ikut terhapus).
  User melaporkan 8 dari 10 catatan hilang setelah reupload DAT meski
  aset-nya masih ada di Monitoring
- Fix: helper `fetchAllKodeAsset()` (pagination loop, `FETCH_SIZE=1000`)
  dipakai di step auto-clear; step re-apply tag Allocated di-chunk per 200
  kode_asset untuk konsistensi. Diverifikasi dengan simulasi node (query
  lama: 1000/4666 baris, query baru: 4666/4666 dalam 5 iterasi)
- **Rule baru ditambahkan**: WAJIB pagination loop untuk semua query tabel
  besar (>1000 baris potensial) — lihat Coding Standards
- Data loss: 8 catatan yang sudah terhapus sebelum fix ini tidak bisa
  direcover otomatis

## 18 Juni 2026
- **LPP Web Tracking Reconciliation — Tahap 1-3 implemented** (THESIS CORE):
  - Tahap 1: schema `lpp_raw`, parser HTML-table-as-.xls (`lppParser.ts`,
    DOMParser bukan SheetJS, auto-detect CGA dari nama file), upload
    pipeline multi-file (`UploadLPPSection.tsx`, 3 file CGA1/2/3 sekaligus,
    full-replace dengan pola `isLastBatch`)
  - Tahap 2: tab "LPP Monitoring" jadi fungsional (sebelumnya empty state)
    — filter, search, 4 summary card, tabel berpaginasi
  - Tahap 3: reconciliation engine (4 kondisi DAT vs LPP by kode_asset,
    universe dibatasi ke union assets_raw∪lpp_raw∪surat_jalan_items),
    halaman baru `/reconciliation`, menu baru di Sidebar
  - Kondisi 3 "Aset Intransit" — **tidak diimplementasi dalam TA ini**, dijadikan saran penelitian lanjutan
  - Integrasi Mutasi WT otomatis sengaja ditunda (konfirmasi user)
- **Bug fix: badge CGA di tabel reconciliation** — `assets_raw.toko`
  simpan label panjang ("CGA1 - Cadangan General Affairs 1"), beda dengan
  `lpp_raw.toko` yang sudah bersih. Fix: `extractCGACode()` helper di
  `reconciliation-route.ts`
- **Git**: kerjaan di-commit ke branch `feature/reconciliation` (bukan
  langsung ke `main`) dengan message sementara, di-push ke remote. Perlu
  amend message + merge ke `main` setelah stabil

## 17 Juni 2026
- **Fix kritis: auto-clear `asset_notes` menghapus SEMUA catatan** — root
  cause: step auto-clear & re-apply tag Allocated jalan di setiap batch
  upload (bukan sekali di akhir), dibandingkan terhadap `rawIdMap` yang cuma
  berisi data batch itu sendiri. Fix: kirim `isLastBatch` dari client,
  server skip kedua step kecuali batch terakhir, query ulang data lengkap
  dari DB saat itu
- **Fix: PDF Surat Jalan rusak untuk item >15** — react-pdf gagal page-break
  otomatis di tabel besar, fix dengan manual pagination (chunk 15/halaman,
  header diulang, signature di halaman terakhir)
- **Fitur baru: Template Item SJ** — tabel `sj_item_templates` (JSONB),
  halaman `/sj/templates` (buat+hapus), tombol "Pakai Template" di
  Buat/Edit SJ (apply ke bawah item existing, auto-renumber)

## 16 Juni 2026
- **Fix: warna font signature SJ** (Dibuat/Disetujui/Dibawa/Diterima) jadi
  hitam pekat + bold (sebelumnya abu-abu, rawan tertimbun stempel/bolpen)
- **Redesign Excel Monitoring (sheet Summary)** — 3 tabel side-by-side per
  CGA, grouping Kategori→Jenis, subtotal+grand total (tanpa warna — limitasi
  SheetJS community edition)
- **Redesign Export PDF Rekap DAT** — trigger dipindah ke tombol di
  Monitoring (halaman `/reports` & menu Sidebar dihapus), page-break per
  CGA, styling warna per CGA (emerald/amber/rose sesuai badge UI)

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
