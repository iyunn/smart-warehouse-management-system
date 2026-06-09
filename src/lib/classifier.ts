import type { KeywordRule } from './reviewTypes'

export const NO_MERK_VALUE = 'Non-Merk'

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[-/.,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function classifyAsset(description: string, keywordRules: KeywordRule[] = []) {
  const normalized = normalizeText(description)

  let jenis = 'Unknown'
  let merk  = 'Unknown'
  const kategori = 'Unknown'

  // ── Pass 1: jenis + merk spesifik dulu (skip no_merk) ──────────────────
  // Priority: rule merk spesifik selalu menang atas no_merk
  for (const rule of keywordRules) {
    if (rule.rule_type === 'no_merk') continue

    const normalizedKeyword = normalizeText(rule.keyword)
    const toSearch = ` ${normalized} `
    const toFind   = ` ${normalizedKeyword} `
    if (!toSearch.includes(toFind)) continue

    if (rule.rule_type === 'jenis' && jenis === 'Unknown') {
      jenis = rule.value
    } else if (rule.rule_type === 'merk' && merk === 'Unknown') {
      merk = rule.value
    }

    if (jenis !== 'Unknown' && merk !== 'Unknown') break
  }

  // ── Pass 2: no_merk sebagai fallback — hanya kalau merk masih Unknown ──
  // Contoh: "DVR" → no_merk. "DVR 16 CH Dahua" → merk Dahua menang di Pass 1,
  // Pass 2 tidak dieksekusi karena merk sudah resolved.
  if (merk === 'Unknown') {
    for (const rule of keywordRules) {
      if (rule.rule_type !== 'no_merk') continue

      const normalizedKeyword = normalizeText(rule.keyword)
      const toSearch = ` ${normalized} `
      const toFind   = ` ${normalizedKeyword} `
      if (toSearch.includes(toFind)) {
        merk = NO_MERK_VALUE
        break
      }
    }
  }

  let confidence: 'high' | 'medium' | 'low' = 'low'
  if (jenis !== 'Unknown' && merk !== 'Unknown') {
    confidence = 'high'
  } else if (jenis !== 'Unknown') {
    confidence = 'medium'
  }

  return {
    original_description: description,
    normalized_description: normalized,
    jenis,
    merk,
    kategori,
    kategori_nama: 'Unknown',
    confidence,
  }
}
