-- ════════════════════════════════════════════════════════════════════════
-- Fix: RLS policy untuk asset_notes
-- Error: "new row violates row-level security policy for table asset_notes"
-- ════════════════════════════════════════════════════════════════════════
--
-- Tabel baru asset_notes punya RLS enabled (default Supabase) tapi belum
-- ada policy yang mengizinkan akses dari anon key. Tabel lain (assets_raw,
-- surat_jalan_items, dst) sudah punya policy permisif serupa — samakan.

-- Cek dulu apakah RLS enabled di asset_notes (opsional, untuk verifikasi)
-- SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'asset_notes';

-- Opsi A — Disable RLS (paling simpel, konsisten kalau tabel lain juga begini)
ALTER TABLE asset_notes DISABLE ROW LEVEL SECURITY;

-- ════════════════════════════════════════════════════════════════════════
-- Opsi B — Kalau mau tetap RLS enabled, pakai policy permisif sebagai gantinya:
-- (Comment Opsi A di atas, uncomment ini kalau pilih Opsi B)
-- ════════════════════════════════════════════════════════════════════════
-- ALTER TABLE asset_notes ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "Allow all access to asset_notes"
-- ON asset_notes
-- FOR ALL
-- USING (true)
-- WITH CHECK (true);
