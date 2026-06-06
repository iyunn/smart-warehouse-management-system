import type { KeywordRule } from './reviewTypes'

export const NO_MERK_VALUE = 'Non-Merk'

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[-/.,]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/(\w)\s+(\d)/g, '$1$2')
    .trim()
}

export function classifyAsset(description: string, keywordRules: KeywordRule[] = []) {
  const normalized = normalizeText(description)

  let jenis = 'Unknown'
  let merk = 'Unknown'
  const kategori = 'Unknown'

  for (const rule of keywordRules) {
    const normalizedKeyword = normalizeText(rule.keyword)
    const toSearch = ` ${normalized} `
    const toFind = ` ${normalizedKeyword} `
    if (!toSearch.includes(toFind)) continue

    if (rule.rule_type === 'jenis' && jenis === 'Unknown') {
      jenis = rule.value
    } else if (rule.rule_type === 'merk' && merk === 'Unknown') {
      merk = rule.value
    } else if (rule.rule_type === 'no_merk' && merk === 'Unknown') {
      // Barang generic / tidak bermerek — dianggap sudah di-review
      merk = NO_MERK_VALUE
    }

    // Stop kalau jenis dan merk sudah terisi
    const merkResolved = merk !== 'Unknown'
    if (jenis !== 'Unknown' && merkResolved) break
  }

  // Confidence:
  // high   = jenis terisi + merk terisi (termasuk Non-Merk)
  // medium = jenis terisi, merk masih Unknown
  // low    = jenis masih Unknown
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
