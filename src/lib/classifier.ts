export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[-/.,]/g, ' ')       // hapus simbol
    .replace(/\s+/g, ' ')          // rapikan spasi
    .replace(/(\w)\s+(\d)/g, '$1$2') // lx 310 → lx310
    .trim()
}

export function classifyAsset(description: string) {
  const normalized = normalizeText(description)

  // keyword jenis
  const jenisMap: Record<string, string[]> = {
    Komputer: ['cpu', 'pc'],
    "Mesin Penghitung Uang": ['mesin hitung', 'hitung'],
    Monitor: ['monitor'],
    Printer: ['printer'],
    Scanner: ['scanner'],
    Furniture: ['meja', 'kursi']
  }

  // keyword merk
  const merkMap: Record<string, string[]> = {
    Epson: ['epson'],
    HP: ['hp'],
    Dell: ['dell'],
    Lenovo: ['lenovo'],
    Canon: ['canon']
  }

  let jenis = 'Unknown'
  let merk = 'Unknown'

  // detect jenis
  for (const [key, keywords] of Object.entries(jenisMap)) {
    if (keywords.some(k => normalized.includes(k))) {
      jenis = key
      break
    }
  }

  // detect merk
  for (const [key, keywords] of Object.entries(merkMap)) {
    if (keywords.some(k => normalized.includes(k))) {
      merk = key
      break
    }
  }

  // kategori
  const kategoriMap: Record<string, string[]> = {
  C: ['cpu', 'pc', 'komputer', 'monitor', 'printer', 'scanner', 'gun scanner'],
  E: ['hitung'],
  I: ['kiosk', 'kios'],
  P: ['cctv', 'camera', 'DVR'],
  Q: ['alarm'],
  R: ['ht', 'radio'],
  S: ['ac', 'pendingin', 'cooler'],
  T: ['rak', 'etalase'],
  W: ['hand pallet', 'forklift']
  }

  let kategori = 'Unknown'

  for (const [key, keywords] of Object.entries(kategoriMap)) {
    if (keywords.some(k => normalized.includes(k))) {
      kategori = key
      break
    }
  }

  //Kategori Name
  const kategoriNamaMap: Record<string, string> = {
  C: 'Peralatan Komputer',
  E: 'Peralatan Kantor',
  I: 'Kios',
  P: 'CCTV',
  Q: 'Alarm',
  R: 'Radio Wireless',
  S: 'Pendingin',
  T: 'Peralatan Toko',
  W: 'Peralatan Gudang'
  }

  // confidence
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
    kategori_nama: kategoriNamaMap[kategori] || 'Unknown',
    confidence
  }
}