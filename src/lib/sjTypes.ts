// ─── Surat Jalan Types ────────────────────────────────────────────────────

export interface SJTujuan {
  id: string;
  kode: string;
  nama: string;
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
  mutasi_oracle_status?: boolean;
  mutasi_oracle_at?: string;
  kode_asset?: string;
}

export interface SuratJalan {
  id?: string;
  no_sj: string;
  tanggal: string;        // ISO date YYYY-MM-DD
  tujuan_id: string;
  tujuan?: SJTujuan;
  pembawa: string;
  penerima: string;
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
