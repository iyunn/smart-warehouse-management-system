import type { KeywordRule } from './reviewTypes'

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
    if (!normalized.includes(normalizedKeyword)) continue

    if (rule.rule_type === 'jenis' && jenis === 'Unknown') {
      jenis = rule.value
    } else if (rule.rule_type === 'merk' && merk === 'Unknown') {
      merk = rule.value
    }

    if (jenis !== 'Unknown' && merk !== 'Unknown') break
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
    confidence
  }
}