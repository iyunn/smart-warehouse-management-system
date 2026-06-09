-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Normalize keyword_rules — hapus duplikat case-insensitive
-- Jalankan SEKALI di Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── STEP 1: Cek duplikat dulu (read-only, aman) ───────────────────────────
-- Lihat rule mana yang punya kombinasi (keyword + rule_type + value) case-insensitive sama
SELECT
  LOWER(keyword) AS keyword_lower,
  rule_type,
  LOWER(value) AS value_lower,
  COUNT(*) AS jumlah_duplikat,
  ARRAY_AGG(id) AS ids,
  ARRAY_AGG(keyword) AS keyword_variants,
  ARRAY_AGG(value) AS value_variants
FROM keyword_rules
GROUP BY LOWER(keyword), rule_type, LOWER(value)
HAVING COUNT(*) > 1
ORDER BY jumlah_duplikat DESC;

-- ── STEP 2: Hapus duplikat — keep yang created_at paling awal ─────────────
-- Strategi: keep row tertua (paling awal dibuat) per kombinasi case-insensitive
-- ⚠ Backup dulu kalau ragu: SELECT * FROM keyword_rules; (download dari Supabase UI)
WITH duplikat AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(keyword), rule_type, LOWER(value)
      ORDER BY created_at ASC
    ) AS rank
  FROM keyword_rules
)
DELETE FROM keyword_rules
WHERE id IN (
  SELECT id FROM duplikat WHERE rank > 1
);

-- ── STEP 3: Verifikasi tidak ada duplikat tersisa ─────────────────────────
SELECT
  LOWER(keyword) AS keyword_lower,
  rule_type,
  LOWER(value) AS value_lower,
  COUNT(*) AS jumlah
FROM keyword_rules
GROUP BY LOWER(keyword), rule_type, LOWER(value)
HAVING COUNT(*) > 1;
-- Hasil harus KOSONG (0 rows). Kalau ada, ulangi STEP 2.

-- ── STEP 4 (Optional): Tambah constraint untuk anti-duplikat di DB level ──
-- ⚠ Hati-hati: ini constraint case-sensitive. Untuk case-insensitive lebih baik
-- pakai validation di application layer (sudah di-implement di API route).
-- Skip step ini kalau cukup pakai validation di app layer.

-- CREATE UNIQUE INDEX IF NOT EXISTS idx_keyword_rules_unique_case_insensitive
-- ON keyword_rules (LOWER(keyword), rule_type, LOWER(value));

-- ── STEP 5: Setelah cleanup, jalankan reclassify supaya assets ter-update ──
-- Bisa dilakukan via UI: buka /review → klik tombol "Reclassify"
