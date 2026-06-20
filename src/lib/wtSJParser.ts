/**
 * wtSJParser.ts
 * Parser untuk PDF Surat Jalan Web Tracking (WT) dari PT. Indomarco Prismatama.
 *
 * Format PDF WT selalu konsisten:
 *   Header: Nomor SJ, Tujuan, Jenis SJ, Tanggal Cetak, Pembuat, Pembawa
 *   Tabel:  No SN (= kode_asset) | Nama Barang | Kondisi | Owner | Keterangan
 *
 * Parsing dilakukan client-side via pdfjs-dist (text extraction).
 * Library: pdfjs-dist (install: npm install pdfjs-dist)
 */

// Tipe hasil parse
export interface WTParsedItem {
  kode_asset: string;      // dari kolom "No SN" (misal C06.051450)
  nama_barang: string;     // dari kolom "Nama Barang" (full text)
  keterangan: string;      // dari kolom "Keterangan"
  kondisi_raw: string;     // dari kolom "Kondisi" (misal "1 Baik") — informatif
}

export interface WTParsedSJ {
  no_sj_wt: string;        // nomor SJ asli dari WT (untuk disimpan di keterangan)
  tujuan_kode: string;     // misal "TUT7"
  tujuan_nama: string;     // misal "POINT REST AREA KM 379 A"
  tanggal: string;         // ISO date YYYY-MM-DD (dari Tgl.Cetak)
  pembawa: string;         // nama pembawa barang
  items: WTParsedItem[];
}

/** Konversi "03-Mar-2026" → "2026-03-03" */
function parseTanggalWT(raw: string): string {
  const MONTHS: Record<string, string> = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04", Mei: "05", May: "05",
    Jun: "06", Jul: "07", Agu: "08", Aug: "08", Sep: "09",
    Okt: "10", Oct: "10", Nov: "11", Des: "12", Dec: "12",
  };
  // format: DD-Mmm-YYYY
  const m = raw.match(/(\d{2})-([A-Za-z]{3})-(\d{4})/);
  if (!m) return new Date().toISOString().slice(0, 10);
  const [, dd, mon, yyyy] = m;
  return `${yyyy}-${MONTHS[mon] ?? "01"}-${dd}`;
}

/** Kode aset WT: huruf kapital + 2 digit + titik + 6 digit (misal C06.051450) */
const KODE_ASSET_REGEX = /^[A-Z]\d{2}\.\d+$/;

/**
 * Parse teks mentah PDF (dari pdfjs-dist) menjadi struktur WTParsedSJ.
 * 
 * pdfjs-dist mengekstrak teks sebagai item-item terpisah per text run PDF.
 * Field header seperti "Tujuan : TUT7 - ..." bisa tersplit jadi beberapa item.
 * Solusi: gunakan DUA versi teks:
 *   - fullText (join spasi): untuk regex header yang bisa span multiple items
 *   - lineText (join newline): untuk deteksi baris tabel kode_asset
 */
/**
 * Parse teks mentah PDF (dari pdfjs-dist) menjadi struktur WTParsedSJ.
 *
 * Catatan penting: pdfjs-dist mengekstrak teks per "text run" PDF — setiap
 * kolom tabel dan label field bisa menjadi item terpisah di baris berbeda.
 * Struktur nyata dari SJ WT:
 *   "Tujuan\n: TUT7 - POINT REST AREA KM 379 A\n: Mutasi Aktiva Alat"
 *   "No\nSN\nKONDISI\nNAMA BARANG\nKETERANGAN\nOWNER" ← header tersplit
 *   "C06.051450\nCPU WS BASIC ZYREX\nTAC WIN 10\n1\nBaik\nSN 2Z0516...\nCGA1"
 */
export function parseWTSJText(rawText: string): WTParsedSJ {
  const fullText = rawText.replace(/\n+/g, " ").replace(/\s+/g, " ");
  const lines = rawText.split("\n").map(l => l.trim()).filter(l => l.length > 0);

  // ── Header fields (search di fullText - join spasi) ───────────────────────

  const noSJMatch = fullText.match(/Nomor SJ\s*:\s*\*?\s*([A-Z0-9\-\/]+)/i);
  const noSJWT = noSJMatch?.[1]?.trim() ?? "";

  // Tujuan: stop nama sebelum " : " berikutnya (": Mutasi Aktiva Alat")
  const tujuanMatch = fullText.match(/Tujuan\s*:\s*([A-Z][A-Z0-9]*)\s*-\s*(.+?)(?=\s*:\s*[A-Z]|\s*\*\*|\s*Jenis SJ|\s*WTK)/i);
  const tujuanKode = tujuanMatch?.[1]?.trim() ?? "";
  const tujuanNama = tujuanMatch?.[2]?.trim() ?? "";

  const tglMatch = fullText.match(/Tgl\.Cetak:?\s*(\d{2}-[A-Za-z]{3}-\d{4})/);
  const tanggal = tglMatch?.[1] ? parseTanggalWT(tglMatch[1]) : new Date().toISOString().slice(0, 10);

  const pembawaMatch = fullText.match(/Pembawa Barang\s*:\s*\d+\s*-\s*([A-Z][A-Z\s]+?)(?=\s+WTK|\s+No\s+SN|\s+SN\s|\s*$)/i);
  const pembawa = pembawaMatch?.[1]?.trim() ?? "";

  // ── Table items ───────────────────────────────────────────────────────────
  // Tidak andalkan header tabel (tersplit per kolom oleh pdfjs-dist).
  // Langsung cari kode_asset pertama sebagai anchor awal data tabel.

  const firstItemIdx = lines.findIndex(l => KODE_ASSET_REGEX.test(l));
  const items: WTParsedItem[] = [];

  if (firstItemIdx !== -1) {
    const FOOTER = ["Disetujui", "Dibuat", "Manager", "Admin", "No.SJ", "Pilih"];
    const tableLines = lines.slice(firstItemIdx).filter(l =>
      !FOOTER.some(m => l.startsWith(m)) && l !== "*" && l !== "**"
    );

    const groups: string[][] = [];
    for (const line of tableLines) {
      if (KODE_ASSET_REGEX.test(line)) {
        groups.push([line]);
      } else if (groups.length > 0) {
        groups[groups.length - 1].push(line);
      }
    }

    for (const group of groups) {
      const [kode_asset, ...rest] = group;

      // Kondisi = single digit saja (pdfjs pisah "1" dan "Baik" jadi 2 baris)
      const kondisiNumIdx = rest.findIndex(l => /^\d{1,2}$/.test(l));
      const ownerIdx      = rest.findIndex(l => /^CGA\d/.test(l));

      const namaEnd    = kondisiNumIdx !== -1 ? kondisiNumIdx : (ownerIdx !== -1 ? ownerIdx : rest.length);
      const namaBarang = rest.slice(0, namaEnd).join(" ").trim();

      const kondisiNum = kondisiNumIdx !== -1 ? rest[kondisiNumIdx] : "";
      const kondisiTxt = (kondisiNumIdx !== -1 && kondisiNumIdx + 1 < rest.length &&
        !/^CGA\d/.test(rest[kondisiNumIdx + 1]) && !/^\d/.test(rest[kondisiNumIdx + 1]))
        ? rest[kondisiNumIdx + 1] : "";
      const kondisiRaw = [kondisiNum, kondisiTxt].filter(Boolean).join(" ");

      const ketStart   = kondisiNumIdx !== -1 ? kondisiNumIdx + (kondisiTxt ? 2 : 1) : namaEnd;
      const ketEnd     = ownerIdx !== -1 ? ownerIdx : rest.length;
      const keterangan = rest.slice(ketStart, ketEnd).join(" ").trim();

      if (kode_asset) {
        items.push({ kode_asset, nama_barang: namaBarang, keterangan, kondisi_raw: kondisiRaw });
      }
    }
  }

  if (!tujuanKode) throw new Error("Tidak bisa membaca field Tujuan dari PDF. Pastikan PDF adalah SJ WT yang valid.");
  if (items.length === 0) throw new Error("Tidak ada item ditemukan di tabel PDF.");

  return { no_sj_wt: noSJWT, tujuan_kode: tujuanKode, tujuan_nama: tujuanNama, tanggal, pembawa, items };
}
