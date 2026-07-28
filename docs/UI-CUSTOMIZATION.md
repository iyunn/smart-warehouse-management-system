# Panduan Kustomisasi UI — SmartWMS

Semua pengaturan tampilan ada di **satu tempat**:
`src/app/globals.css` → cari blok **`██ PANEL KUSTOMISASI UI ██`** (di bagian bawah file).

Ubah nilainya, simpan, refresh browser. Tidak perlu menyentuh file lain.

> Nilai bawaan sekarang sama persis dengan tampilan yang sedang berjalan.
> Jadi selama belum diubah, tidak ada yang berubah.

---

## Mau ubah apa?

### Warna tulisan terlalu redup / terlalu terang
| Bagian | Variabel (dark) | Variabel (light) |
|---|---|---|
| Judul & teks paling terang | `--ui-dark-text` | `--ui-light-text` |
| Teks isi | `--ui-dark-text-body` | `--ui-light-text-body` |
| Teks samar | `--ui-dark-text-muted` | `--ui-light-text-muted` |
| Label paling samar | `--ui-dark-text-dim` | `--ui-light-text-dim` |

Contoh — teks samar di mode gelap terlalu redup, mau dipertegas:
```css
--ui-dark-text-dim: #94a3b8;   /* dari #64748b jadi lebih terang */
```

### Warna latar belakang
| Bagian | Variabel (dark) | Variabel (light) |
|---|---|---|
| Latar halaman | `--ui-dark-bg` | `--ui-light-bg` |
| Kartu / sidebar / topbar | `--ui-dark-surface` | `--ui-light-surface` |
| Panel dalam | `--ui-dark-panel` | `--ui-light-panel` |
| Kotak isian (input) | `--ui-dark-input` | `--ui-light-input` |
| Garis tepi | `--ui-dark-border` | `--ui-light-border` |

### Warna aksen (biru, hijau, kuning, merah)
```css
--ui-dark-accent:  #38bdf8;   /* biru — tombol, highlight, angka penting */
--ui-dark-success: #34d399;   /* hijau — berhasil, CGA1 */
--ui-dark-warning: #fbbf24;   /* kuning — peringatan, CGA2 */
--ui-dark-danger:  #fb7185;   /* merah — bahaya, CGA3 */
```
Ganti `--ui-dark-accent` saja sudah mengubah nuansa seluruh aplikasi.

### Warna aksen di MODE TERANG (kontras)

Ini bagian yang paling sering perlu disetel. Aplikasi memakai warna terang khas
mode gelap (`text-cyan-400`, `text-rose-400`, `text-amber-300`, dst). Kalau dipakai
apa adanya di latar terang, hasilnya pudar dan bikin mata lelah.

Variabel di **bagian 6** panel mengatur versi gelap tiap warna khusus mode terang:

```css
--ui-light-cyan:    #0369a1;   /* biru      */
--ui-light-emerald: #047857;   /* hijau     */
--ui-light-amber:   #92400e;   /* kuning    */
--ui-light-rose:    #be123c;   /* merah     */
--ui-light-violet:  #6d28d9;   /* ungu      */
--ui-light-blue:    #1d4ed8;   /* biru tua  */
```

**Makin kecil angka hex, makin gelap, makin tegas.** Kalau masih terasa kurang
kontras, turunkan ke alternatif yang tertulis di komentar sebelahnya. Kalau
terlalu pekat, naikkan.

Patokan keterbacaan (rasio kontras WCAG, minimal 4.5 untuk teks biasa) —
nilai bawaan sekarang berada di kisaran 5.0–7.1, jadi sudah aman.
Sebagai perbandingan, warna lama berada di 1.4–2.7 (jauh di bawah standar).

Kalau ingin **lebih tegas lagi**, pakai set ini:
```css
--ui-light-cyan:    #075985;
--ui-light-emerald: #065f46;
--ui-light-amber:   #78350f;
--ui-light-rose:    #9f1239;
--ui-light-violet:  #5b21b6;
--ui-light-blue:    #1e40af;
```

### Ukuran huruf
Kalau tulisan terasa kekecilan, naikkan semuanya sekitar 1–2px:
```css
--ui-fs-12: 13px;   /* teks tabel & form   */
--ui-fs-13: 14px;   /* nama item           */
--ui-fs-16: 18px;   /* judul halaman       */
```
Panduan tiap tingkatan:
- `--ui-fs-9` / `--ui-fs-10` → label mini & badge
- `--ui-fs-11` → keterangan, sub-teks
- `--ui-fs-12` → **paling banyak dipakai** (isi tabel, form)
- `--ui-fs-13` → nama item, teks agak besar
- `--ui-fs-14` / `--ui-fs-15` → sub-judul & judul modal
- `--ui-fs-16` → judul halaman di Topbar

### Jenis huruf (font style)
```css
--ui-font-sans: var(--font-dm-sans), 'DM Sans', sans-serif;
--ui-font-mono: var(--font-jetbrains-mono), 'JetBrains Mono', monospace;
```
Untuk font yang sudah ada di sistem, cukup tulis di depan:
```css
--ui-font-sans: 'Segoe UI', var(--font-dm-sans), sans-serif;
```

Untuk font Google baru (misal Poppins), tambahkan di `src/app/layout.tsx`:
```ts
import { Poppins } from "next/font/google";
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300","400","500","600","700"],
});
```
lalu tambahkan `${poppins.variable}` di `className` tag `<html>`, dan di globals.css:
```css
--ui-font-sans: var(--font-poppins), sans-serif;
```

### Ketebalan huruf tebal
```css
--ui-weight-bold: 700;   /* 600 = lebih tipis, 800 = lebih tebal */
```

### Sudut melengkung
```css
--ui-radius-sm: 6px;    /* tombol kecil, badge  */
--ui-radius-md: 8px;    /* input, dropdown      */
--ui-radius-lg: 12px;   /* tombol, baris item   */
--ui-radius-xl: 16px;   /* kartu / panel besar  */
```
Semua jadi `0px` → tampilan kotak tegas. Dinaikkan → tampilan makin bulat.

---

## Resep cepat

**Tampilan lebih lega untuk layar besar**
```css
--ui-fs-11: 12px;
--ui-fs-12: 13px;
--ui-fs-13: 14px;
```

**Nuansa hijau (ganti dari biru)**
```css
--ui-dark-accent:  #34d399;
--ui-light-accent: #059669;
```

**Kontras lebih tinggi di mode gelap**
```css
--ui-dark-text-body:  #f8fafc;
--ui-dark-text-muted: #cbd5e1;
--ui-dark-text-dim:   #94a3b8;
--ui-dark-border:     rgba(255, 255, 255, 0.14);
```

**Tampilan tegas tanpa lengkungan**
```css
--ui-radius-sm: 2px;
--ui-radius-md: 2px;
--ui-radius-lg: 4px;
--ui-radius-xl: 4px;
```

---

## Yang perlu diperhatikan

1. **Jangan ubah bagian di bawah tulisan "JANGAN DIUBAH"** — itu yang menyalurkan
   nilai ke seluruh halaman. Kalau rusak, tampilan bisa kacau.
2. **Halaman Pendingan Alokasi punya pengaturan sendiri** (efek kaca/glass) di
   `src/app/sj/pendingan/page.tsx`, di blok `KONTROL GLASS THEME`. Blur & opacity
   diatur di sana.
3. **Live Stock memakai ukuran yang menyesuaikan layar TV** (`vmin`/`clamp`) supaya
   terbaca dari jauh — ukurannya tidak ikut `--ui-fs-*`. Diatur di
   `src/app/stock/live/page.tsx`.
4. Kalau perubahan tidak muncul: refresh keras (Ctrl+Shift+R). Kalau masih,
   hentikan `npm run dev` lalu jalankan ulang.
5. **Tidak ada logika program yang tersentuh** — panel ini murni tampilan.

---

## Kalau ingin kembali ke awal

Nilai bawaan:
```css
--ui-fs-9: 9px;  --ui-fs-10: 10px; --ui-fs-11: 11px; --ui-fs-12: 12px;
--ui-fs-13: 13px; --ui-fs-14: 14px; --ui-fs-15: 15px; --ui-fs-16: 16px;
--ui-radius-sm: 6px; --ui-radius-md: 8px; --ui-radius-lg: 12px; --ui-radius-xl: 16px;
--ui-weight-bold: 700;

--ui-dark-bg: #080e18;        --ui-dark-surface: #0d1524;
--ui-dark-panel: rgba(255,255,255,0.03);  --ui-dark-input: rgba(255,255,255,0.06);
--ui-dark-border: rgba(255,255,255,0.08);
--ui-dark-text: #ffffff;      --ui-dark-text-body: #e2e8f0;
--ui-dark-text-muted: #94a3b8; --ui-dark-text-dim: #64748b;
--ui-dark-accent: #38bdf8;    --ui-dark-success: #34d399;
--ui-dark-warning: #fbbf24;   --ui-dark-danger: #fb7185;

--ui-light-bg: #f1f5f9;       --ui-light-surface: #ffffff;
--ui-light-panel: rgba(15,23,42,0.02);   --ui-light-input: rgba(15,23,42,0.05);
--ui-light-border: rgba(15,23,42,0.10);
--ui-light-text: #0f172a;     --ui-light-text-body: #1e293b;
--ui-light-text-muted: #475569; --ui-light-text-dim: #94a3b8;
--ui-light-accent: #0284c7;   --ui-light-success: #059669;
--ui-light-warning: #d97706;  --ui-light-danger: #e11d48;
```

---

# Memakai Class Tailwind Asli (cara yang benar)

Setup proyek ini **Tailwind v4 hasil npm install** (bukan Play CDN), jadi fitur
`@theme` bisa dipakai penuh. Blok `@theme` di `globals.css` sudah menyiapkan
class semantik yang siap dipakai di komponen.

## Class yang tersedia

| Kegunaan | Class | Menggantikan yang lama |
|---|---|---|
| Latar halaman | `bg-canvas` | `bg-[#080e18]` |
| Latar kartu / sidebar | `bg-surface` | `bg-[#0d1117]`, `bg-[#111827]` |
| Latar panel dalam | `bg-panel` | `bg-white/[0.02]`, `bg-white/[0.03]` |
| Latar kotak isian | `bg-field` | `bg-white/[0.04]`, `bg-white/[0.05]` |
| Garis tepi | `border-line` | `border-white/[0.06]`, `border-white/[0.08]` |
| Teks judul | `text-heading` | `text-white` |
| Teks isi | `text-body` | `text-white/80`, `text-slate-300` |
| Teks samar | `text-muted` | `text-white/50`, `text-slate-400` |
| Teks paling samar | `text-dim` | `text-white/30`, `text-slate-600` |
| Warna utama | `text-accent` `bg-accent` `border-accent` | `text-cyan-400` |
| Hijau | `text-success` | `text-emerald-400` |
| Kuning | `text-warning` | `text-amber-400` |
| Merah | `text-danger` | `text-rose-400` |

Ukuran huruf: `text-mini` (9px) · `text-tiny` (10px) · `text-small` (11px) ·
`text-base2` (12px) · `text-lead` (13px) · `text-title` (15px) · `text-display` (16px)

## Contoh migrasi

**Sebelum:**
```jsx
<div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
  <p className="text-[10px] uppercase text-white/40">Total Barang</p>
  <p className="text-[20px] font-bold text-white">3.482</p>
  <p className="text-[11px] text-cyan-400">Rp 14.40 M</p>
</div>
```

**Sesudah:**
```jsx
<div className="rounded-2xl border border-line bg-panel p-4">
  <p className="text-tiny uppercase text-dim">Total Barang</p>
  <p className="text-[20px] font-bold text-heading">3.482</p>
  <p className="text-small text-accent">Rp 14.40 M</p>
</div>
```

Lebih pendek, terbaca maksudnya, dan **otomatis benar di mode gelap maupun terang**
tanpa perlu menulis varian apa pun.

## Cara migrasi yang aman

Jangan mengganti semuanya sekaligus. Kerjakan **satu halaman per sesi**, mulai dari
yang paling jarang dipakai supaya kalau ada yang meleset dampaknya kecil:

1. Buka satu file komponen
2. Ganti class lama → class baru sesuai tabel di atas
3. Cek halamannya di mode gelap DAN terang
4. Kalau aman, lanjut ke file berikutnya

Urutan yang disarankan (dari paling aman):
`Template Item` → `Master Tujuan` → `Manajemen User` → `Pendingan` → `Upload` →
`Rekap Alokasi` → `Daftar SJ` → `Buat SJ` → `Monitoring` → `Dashboard`

**Live Stock dikerjakan paling akhir atau tidak sama sekali** — halaman itu punya
ukuran khusus untuk TV (`vmin`/`clamp`) yang sudah disetel dan mudah rusak.

## Kenapa lapisan kompatibilitas tetap ada

Selama masih ada class lama yang belum dipindahkan, lapisan kompatibilitas di
bagian bawah `globals.css` yang membuatnya tetap ikut tema. Keduanya bisa hidup
berdampingan — file yang sudah dimigrasi memakai class baru, yang belum tetap jalan.

Kalau nanti semua halaman sudah dipindahkan, lapisan itu boleh dihapus dan
`globals.css` jadi jauh lebih pendek.

## Yang perlu diwaspadai

- Class baru **tidak pakai `!important`**, jadi kalau di elemen yang sama masih ada
  class lama, yang lama bisa menang. Ganti sekalian dalam satu elemen.
- Setelah mengubah `globals.css`, kadang perlu hentikan `npm run dev` lalu jalankan
  ulang supaya Tailwind membaca token baru.
- Jangan mengganti nama class di `@theme` kalau sudah dipakai di banyak komponen.

---

# Cara Menimpa Warna Sendiri (penting!)

## Aturan 1 — jangan menumpuk dua class warna

CSS memilih pemenang berdasarkan urutan di file CSS hasil build, **bukan** urutan
penulisan di `className`. Jadi ini tidak bekerja seperti dugaan:

```jsx
❌ <h1 className="text-heading text-gray-100">   // text-heading menang
❌ <p className="text-dim text-lime-500">        // text-dim menang
```

Pilih **satu** saja:

```jsx
✅ <h1 className="text-heading">        // ikut tema (disarankan)
✅ <h1 className="text-gray-100">       // warna tetap, tidak ikut tema
```

## Aturan 2 — beda warna per tema pakai varian

```jsx
✅ <h1 className="text-gray-900 dark:text-cyan-400">
```
Terbaca: abu gelap saat mode terang, cyan saat mode gelap.

Varian `dark:` dan `light:` sudah dihubungkan ke tombol toggle aplikasi lewat
`@custom-variant` di baris awal `globals.css`. Tanpa itu, `dark:` akan mengikuti
setelan sistem operasi dan tidak ikut tombol toggle.

## Aturan 3 — hati-hati dengan class lama di halaman yang BELUM dimigrasi

Lapisan kompatibilitas memakai `!important` untuk class lama berikut:
`text-white`, `text-white/*`, `text-slate-300/400/500/600`, `text-gray-300/400/500`,
`text-cyan-*`, `text-emerald-*`, `text-amber-*`, `text-rose-*`, `text-violet-*`,
`text-blue-*`, `bg-white/*`, `border-white/*`, `bg-[#hex]`.

Kalau kamu memakai salah satunya untuk warna khusus, hasilnya akan ditimpa.
Gunakan warna di luar daftar itu (mis. `text-gray-100`, `text-lime-500`,
`text-teal-600`) atau pakai class semantik.

Di halaman yang **sudah** dimigrasi, masalah ini tidak ada.

## Ringkasan cepat

| Mau apa | Tulis begini |
|---|---|
| Ikut tema otomatis | `text-heading` / `text-body` / `text-muted` / `text-dim` |
| Warna tetap di kedua tema | `text-gray-100` (satu class saja) |
| Beda per tema | `text-gray-900 dark:text-cyan-400` |
| Ubah warna tema global | Edit panel di `globals.css` |
