# SmartWMS — Chat Rules
> Berlaku untuk semua sesi pengembangan SmartWMS antara Fillian & Claude.
> Terakhir diupdate: 18 Juni 2026
>
> **Untuk AI baru / sesi baru**: baca file ini + `docs/project_context.md` dari repo
> sebelum mulai apapun. Dua file itu cukup untuk orient penuh tanpa perlu tanya-tanya ke user.

---

## 1. Session Startup Protocol

Di awal setiap sesi baru, **wajib baca `docs/project_context.md` via curl terlebih dahulu**
sebelum mengerjakan apapun:

```bash
curl https://raw.githubusercontent.com/iyunn/smart-warehouse-management-system/main/docs/project_context.md
```

File ini berisi current state sistem lengkap: fitur yang sudah ada, schema DB,
file structure, known issues, dan next priorities. Ini cara paling efisien untuk
orient tanpa harus nanya ke user atau baca banyak file.

---

## 2. Output & Git Workflow

- Claude **hanya generate file** untuk di-download/apply manual via VS Code atau Codespace.
- **Fillian yang menjalankan semua git command** (`git add`, `commit`, `push`) — Claude cukup berikan commit message.
- Format commit message: **1 baris judul + bullets ringkas** (tidak perlu verbose).
- Output file selalu disajikan dalam tabel:

  | File Generated | Lokasi di Repo | Status |
  |---|---|---|
  | `NamaFile.tsx` | `src/path/ke/file.tsx` | new / replace |

---

## 3. Pola Kerja: Present → Test → Lanjut

Claude **tidak boleh langsung lanjut ke langkah berikutnya** tanpa konfirmasi dari Fillian.
Polanya selalu:

1. Claude generate & present file
2. Fillian apply ke repo, test di browser/lokal
3. Fillian laporan hasilnya ("udah jalan bro" / "ada bug X")
4. Baru Claude lanjut ke langkah berikutnya

Kalau Fillian bilang **"sudah aku apply dan commit"** sebelum lanjut edit file yang sama,
Claude **wajib re-fetch** file tersebut dari raw GitHub (konten bisa berbeda dari yang
dibaca di awal sesi).

---

## 4. Membaca Repo GitHub

Repo SmartWMS: **`github.com/iyunn/smart-warehouse-management-system`** (PUBLIC)

Claude membaca file langsung dari GitHub — **Fillian tidak perlu upload file manual**.

### Prioritas metode (dari paling hemat token ke paling boros):

| # | Metode | Kapan dipakai |
|---|---|---|
| 1 | `curl https://raw.githubusercontent.com/iyunn/smart-warehouse-management-system/main/{path}` | Baca 1 file spesifik **(default, paling sering)** |
| 2 | `curl https://api.github.com/repos/iyunn/smart-warehouse-management-system/contents/{path}` | List nama file dalam 1 folder, tanpa download content |
| 3 | `git clone --depth 1 ...` | **Last resort** — hanya kalau butuh banyak file sekaligus |

### Aturan wajib:
- **Hanya baca file yang relevan** dengan task saat ini — jangan spekulatif baca seluruh repo.
- **Re-fetch sebelum edit** jika Fillian sudah commit perubahan sejak file terakhir dibaca.
- **Dalam satu sesi**, kalau file sudah dibaca dan Fillian belum commit perubahan, tidak perlu re-fetch — gunakan yang sudah ada di context.
- Claude tetap **read-only** — semua write/push tetap dilakukan Fillian manual.

---

## 5. Gaya Penjelasan (Wajib Dipertahankan)

Claude **selalu menjelaskan apa yang sedang dikerjakan** — jangan langsung kasih kode tanpa konteks. Yang wajib ada:

- **Root cause analysis** saat debug — jelaskan KENAPA bug terjadi, bukan langsung fix
- **Alasan keputusan teknis** — kenapa pilih pendekatan ini vs alternatif lain
- **Trade-off** kalau ada beberapa opsi desain
- **Verifikasi logic** via `node -e` atau simulasi sebelum present ke Fillian
- **Syntax check** via `npx esbuild` sebelum file di-present

Ini tidak dianggap verbose — ini bagian dari cara kerja yang sudah terbukti efektif
dan Fillian nyaman dengan style ini.

---

## 6. Arsitektur & Teknologi

- **Stack**: Next.js, React, TypeScript, Tailwind CSS v4, Supabase PostgreSQL, Vercel
- **Repo lokal Fillian**: `E:/Kuliah/Tugas-Akhir/smart-warehouse-management-system`
- **Scope data**: CGA-only (Cadangan General Affairs 1/2/3)
- **Prinsip arsitektur** (tidak boleh dilanggar):
  - Lightweight & performant — koneksi kantor Fillian rendah
  - DB ringan — minimize join kompleks, tidak pakai relasi berlebihan
  - Client-side filtering & pagination (bukan server-side) untuk tabel besar
  - Scalable — struktur fleksibel untuk fitur masa depan
  - Gunakan JSONB untuk data yang selalu dipakai utuh (tidak pernah di-query per-field)

---

## 7. Model AI

Sebelum mengerjakan task kompleks (multi-file, desain skema baru, integrasi lintas
komponen), Claude **wajib merekomendasikan Opus atau Sonnet** dan menunggu konfirmasi
Fillian sebelum mulai. Jangan langsung eksekusi tanpa konfirmasi model.

---

## 8. Dokumentasi

Dua file dokumentasi wajib dijaga akurat setiap sesi:

### `docs/project_context.md`
- **Current-state snapshot** — menggambarkan kondisi sistem SEKARANG
- Setiap update harus cek dampak ke **SEMUA section** (bukan cuma append):
  - Features Completed / Planned
  - Database Architecture
  - File Structure
  - Known Issues & Technical Debt
  - Libraries
- Harus tetap akurat & tidak kontradiktif kalau dibaca tanpa context chat apapun
- Claude berikan ringkasan perubahan yang dibuat setiap kali update

### `docs/development-journal.md`
- **Append-only chronological history** — jangan edit entry lama
- Setiap sesi tambahkan entry baru di akhir file

---

## 9. Aturan Kode

- **Wajib pagination loop** untuk semua query Supabase ke tabel yang bisa >1000 baris
  (`assets_raw`, `lpp_raw`, dll) — Supabase PostgREST diam-diam truncate ke 1000 baris
  tanpa error. Pakai `.range(from, from+FETCH_SIZE-1)` dengan `FETCH_SIZE=1000`.
- Syntax check wajib via `npx esbuild` sebelum file di-present ke Fillian.
- Logic verification via `node -e` untuk kalkulasi/algoritma penting.
- Hindari pattern deprecated; prioritaskan readability, maintainability, performance.

---

## 10. Komunikasi

- **Bahasa**: Indonesia casual ("bro")
- **Gaya**: langsung to the point, tidak verbose — tapi tetap jelaskan reasoning
- Kalau ada ambiguitas scope sebelum task besar → tanya dulu, jangan asumsi sendiri
- Kalau ada multiple pilihan desain → jelaskan trade-off, beri rekomendasi, tunggu konfirmasi
- **Jangan tanya lebih dari 1 pertanyaan sekaligus** — kalau perlu clarifikasi, tanya yang paling krusial dulu

---

## 11. Supabase Row-Limit — Catatan Penting

Supabase PostgREST default **limit 1000 baris per query**. Query tanpa `.range()` akan:
- Diam-diam truncate ke 1000 baris pertama
- **Tidak error** — jadi bug ini tidak kelihatan sampai data melebihi 1000 baris
- Pernah menyebabkan data loss (catatan `asset_notes` salah terhapus, 18 Juni 2026)

**Selalu pakai pagination loop** untuk tabel besar:
```typescript
let allData = [];
let from = 0;
const FETCH_SIZE = 1000;
while (true) {
  const { data } = await supabase
    .from('table')
    .select('...')
    .range(from, from + FETCH_SIZE - 1);
  allData = [...allData, ...(data ?? [])];
  if ((data ?? []).length < FETCH_SIZE) break;
  from += FETCH_SIZE;
}
```

---

## 12. Checklist Sebelum Present File ke Fillian

- [ ] Syntax check via `npx esbuild` — tidak boleh ada error
- [ ] Logic kritis diverifikasi via `node -e` simulasi
- [ ] File yang diedit sudah di-fetch ulang (re-fetch) dari repo jika Fillian sudah commit
- [ ] Tabel output (File Generated / Lokasi / Status) sudah ada
- [ ] Commit message sudah disiapkan
- [ ] Tidak ada dead code / import yang tidak terpakai
