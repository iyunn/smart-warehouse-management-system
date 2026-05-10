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