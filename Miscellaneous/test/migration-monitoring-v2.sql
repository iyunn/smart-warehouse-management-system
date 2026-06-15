-- ════════════════════════════════════════════════════════════════════════
-- Monitoring v2 — Migration
-- Jalankan di Supabase SQL Editor
-- ════════════════════════════════════════════════════════════════════════

-- 1. Kolom baru di assets_raw (dari DAT TXT)
-- tanggal_dokumen disimpan sebagai TEXT (sudah dinormalisasi "DD-Mmm-YYYY"
-- oleh parser, atau raw value kalau gagal parse — Oracle export tidak konsisten).
ALTER TABLE assets_raw
ADD COLUMN IF NOT EXISTS invoice_number  TEXT,
ADD COLUMN IF NOT EXISTS tanggal_dokumen TEXT;

-- 2. Tabel catatan per aset — independen dari lifecycle DAT.
-- Hanya menyimpan baris untuk aset yang punya catatan (bukan semua aset),
-- jadi tabel tetap kecil. Auto-clear saat aset keluar CGA via upload DAT.
CREATE TABLE IF NOT EXISTS asset_notes (
  kode_asset TEXT PRIMARY KEY,
  catatan    TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
