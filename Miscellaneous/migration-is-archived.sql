-- ════════════════════════════════════════════════════════════════════════
-- Daftar SJ — Migration: kolom Arsip
-- Jalankan di Supabase SQL Editor
-- ════════════════════════════════════════════════════════════════════════

-- Menandai apakah fisik kertas Surat Jalan sudah diarsipkan.
-- Per-dokumen SJ (bukan per-item), karena arsip kertas adalah satu dokumen.
ALTER TABLE surat_jalan
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
