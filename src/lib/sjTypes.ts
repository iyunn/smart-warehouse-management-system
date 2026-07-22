// ─── Surat Jalan Types ────────────────────────────────────────────────────

export interface SJTujuan {
  id: string;
  kode: string;
  nama: string;
  kota?: string | null;
  kecamatan?: string | null;
  created_at?: string;
}

// Item pendingan alokasi (satu baris = satu jenis barang untuk satu tujuan)
export interface PendinganItem {
  id: string;
  tujuan_id: string;
  jenis: string;
  qty: number;
  keterangan?: string;
  created_at?: string;
}

export interface SJItem {
  id?: string;
  urutan: number;
  jenis: string;
  merk: string;
  serial_number: string;
  qty: number;
  satuan: SatuanType;
  is_baru: boolean;
  is_aktiva: boolean;
  keterangan: string;
  // ── Sesi 4: Alokasi & Mutasi Oracle ──────────────────────────────────────
  // kode_asset: kode aset yang diinput user di Rekap Alokasi (opsional).
  // mutasi_oracle_status: apakah item ini sudah dimutasi di Oracle.
  //   Auto-true saat kode_asset diisi, bisa di-uncheck manual.
  //   Di-disable di UI kalau is_aktiva = false (barang non-AT).
  mutasi_oracle_status?: boolean;
  mutasi_oracle_at?: string;
  kode_asset?: string;
  mutasi_wt_status?: boolean;
  mutasi_wt_at?: string;
}

export type JenisSJ = 'keluar' | 'masuk';

export interface SuratJalan {
  id?: string;
  no_sj: string;
  tanggal: string;        // ISO date YYYY-MM-DD
  tujuan_id: string;
  tujuan?: SJTujuan;
  pembawa: string;
  penerima: string;
  jenis: JenisSJ;         // 'keluar' (SJ Manual) | 'masuk' (Surat Penerimaan Barang)
  status: 'draft' | 'submitted' | 'completed';
  created_by?: string;
  approved_by?: string;
  items: SJItem[];
  created_at?: string;
  updated_at?: string;
}

export type SatuanType = 'Unit' | 'Set' | 'Pcs' | 'Koli' | 'Pack';
export const SATUAN_OPTIONS: SatuanType[] = ['Unit', 'Set', 'Pcs', 'Koli', 'Pack'];

// Empty row factory
export function createEmptyItem(urutan: number): SJItem {
  return {
    urutan,
    jenis:           '',
    merk:            '',
    serial_number:   '',
    qty:             1,
    satuan:          'Unit',
    is_baru:         false,
    is_aktiva:       false,
    keterangan:      '',
  };
}

// ─── Item Template ────────────────────────────────────────────────────────
// Template item = kombinasi barang yang sering berulang, bisa dipanggil saat
// membuat SJ agar item tertambah otomatis. serial_number TIDAK ikut disimpan
// (unik per unit fisik, diisi manual saat SJ dibuat).
export interface SJTemplateItem {
  jenis:      string;
  merk:       string;
  qty:        number;
  satuan:     SatuanType;
  is_baru:    boolean;
  is_aktiva:  boolean;
  keterangan: string;
}

export interface SJItemTemplate {
  id:          string;
  nama:        string;
  items:       SJTemplateItem[];
  created_at?: string;
}

// Konversi SJItem (form) → SJTemplateItem (untuk disimpan, buang serial_number/urutan)
export function toTemplateItem(item: SJItem): SJTemplateItem {
  return {
    jenis:      item.jenis,
    merk:       item.merk,
    qty:        item.qty,
    satuan:     item.satuan,
    is_baru:    item.is_baru,
    is_aktiva:  item.is_aktiva,
    keterangan: item.keterangan,
  };
}

// Konversi SJTemplateItem → SJItem (saat template diterapkan ke form),
// serial_number dikosongkan untuk diisi manual, urutan diisi caller.
export function fromTemplateItem(ti: SJTemplateItem, urutan: number): SJItem {
  return {
    urutan,
    jenis:         ti.jenis,
    merk:          ti.merk,
    serial_number: '',
    qty:           ti.qty,
    satuan:        ti.satuan,
    is_baru:       ti.is_baru,
    is_aktiva:     ti.is_aktiva,
    keterangan:    ti.keterangan,
  };
}
