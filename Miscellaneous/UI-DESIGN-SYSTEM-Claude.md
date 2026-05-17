# Catatan penting (high alert) sebelum kamu baca semua nya !!
1. ini adalah output dari claude yang membantu membuatkan ui programnya.
2. GPT membantu saya sebagai guidance dan claude membantu saya mengcoding untuk codingan berat.
3. mungkin sedikit berbeda dalam struktur folder maupun file yang ada disini dari versi GPT dan sudah disesuaikan di versi gpt nya.
4. Di file ini pahami saja arsitektur frontend / Style UI nya saja !! (High Alert).

# SmartWMS — UI / Frontend Structure & Design System

> Dokumentasi lengkap struktur komponen, warna, tipografi, spacing, dan pola desain yang digunakan dalam dashboard Smart Warehouse Management System.

---

## Daftar Isi

1. [Struktur Folder](#1-struktur-folder)
2. [Halaman (Pages)](#2-halaman-pages)
3. [Design Tokens](#3-design-tokens)
4. [Tipografi](#4-tipografi)
5. [Komponen Layout](#5-komponen-layout)
6. [Komponen Dashboard](#6-komponen-dashboard)
7. [Komponen Review](#7-komponen-review)
8. [Pola Warna Aksen](#8-pola-warna-aksen)
9. [Status Badge System](#9-status-badge-system)
10. [Animasi & Transisi](#10-animasi--transisi)
11. [Scrollbar Custom](#11-scrollbar-custom)
12. [Panduan Konsistensi](#12-panduan-konsistensi)

---

## 1. Struktur Folder

```
warehouse-dashboard/
├── app/
│   ├── layout.tsx                  # Root layout, import font global
│   ├── page.tsx                    # Redirect → /dashboard
│   ├── globals.css                 # CSS global, font import, scrollbar
│   ├── dashboard/
│   │   └── page.tsx                # Halaman utama dashboard
│   ├── review/
│   │   └── page.tsx                # Halaman review aset unclassified
│   └── api/
│       └── process/
│           └── route.ts            # API endpoint batch upload
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx             # Sidebar navigasi utama (collapsible)
│   │   └── Topbar.tsx              # Header atas (search, notif, avatar)
│   ├── dashboard/
│   │   ├── SummaryCard.tsx         # Kartu statistik KPI
│   │   ├── UploadSection.tsx       # Upload Excel dengan pipeline
│   │   └── RecentActivityTable.tsx # Tabel aktivitas aset terkini
│   └── review/
│       ├── ReviewSummaryCards.tsx  # Kartu KPI halaman review
│       ├── ReviewTableToolbar.tsx  # Filter chip + search bar tabel
│       ├── ReviewTableRow.tsx      # Baris tabel review (memoised)
│       ├── ConfidenceBadge.tsx     # Badge skor kepercayaan ML
│       └── UnknownBadge.tsx        # Badge highlight nilai "Unknown"
│
├── hooks/
│   ├── useReviewAssets.ts          # Fetch + filter + paginate dari Supabase
│   └── useKeywordRule.ts           # State modal + insert keyword_rules
│
└── lib/
    ├── supabase.ts                 # Supabase client singleton
    ├── types.ts                    # Type pipeline upload (AssetRecord, dll)
    ├── reviewTypes.ts              # Type halaman review
    ├── xlsxParser.ts               # Parser XLSX → AssetRecord[]
    └── batchProcessor.ts           # Kirim data ke API per 500 baris
```

---

## 2. Halaman (Pages)

### `/dashboard`
Halaman utama dashboard dengan layout:
```
┌─────────────────────────────────────────────────────┐
│ Sidebar (230px)  │  Topbar (full width, sticky)      │
│                  ├──────────────────────────────────│
│  • Dashboard  ◄  │  Welcome Banner                   │
│  • Upload DAT    │  ────────────────────────────────│
│  • Monitoring    │  SummaryCard × 4 (grid 2xl:4)    │
│  • Classification│  ────────────────────────────────│
│  • Reports       │  UploadSection │ Distribusi Aset  │
│  • Settings      │  ────────────────────────────────│
│                  │  RecentActivityTable              │
└─────────────────────────────────────────────────────┘
```

### `/review`
Halaman review aset belum terklasifikasi:
```
┌─────────────────────────────────────────────────────┐
│ Sidebar          │  Topbar                           │
│                  ├──────────────────────────────────│
│                  │  ReviewSummaryCards × 4           │
│                  │  ────────────────────────────────│
│                  │  ReviewTableToolbar (filter+cari) │
│                  │  ReviewTable (dengan ReviewTableRow)│
│                  │  ────────────────────────────────│
│                  │  Pagination                       │
│                  │  ════════════════════════════════│
│                  │  [Modal] AddRuleModal (overlay)   │
└─────────────────────────────────────────────────────┘
```

---

## 3. Design Tokens

### Warna Background

| Token | Nilai Hex | Penggunaan |
|-------|-----------|------------|
| `--color-bg` | `#080e17` | Background halaman utama (body) |
| `--color-surface` | `#111827` | Kartu, panel, modal |
| Sidebar | `#0d1117` | Background sidebar |
| Topbar | `#0d1117/80` | Background topbar (blur) |
| Collapse button | `#1a2030` | Tombol lipat sidebar |

### Warna Border

| Token | Nilai | Penggunaan |
|-------|-------|------------|
| `--color-border` | `rgba(255,255,255,0.06)` | Border kartu, divider |
| Border hover | `rgba(255,255,255,0.10)` | Border saat hover kartu |
| Border muted | `rgba(255,255,255,0.04–0.08)` | Border elemen sekunder |

### Warna Teks

| Kelas Tailwind | Perkiraan Warna | Penggunaan |
|----------------|-----------------|------------|
| `text-white` | `#ffffff` | Judul utama, nilai besar, label aktif |
| `text-slate-200` | `#e2e8f0` | Teks konten tabel |
| `text-slate-300` | `#cbd5e1` | Teks input, label sekunder |
| `text-slate-400` | `#94a3b8` | Label navigasi hover |
| `text-slate-500` | `#64748b` | Subtitle, metadata, placeholder |
| `text-slate-600` | `#475569` | Teks tersier, label tabel header |
| `text-slate-700` | `#334155` | Teks non-aktif, nilai kosong |

---

## 4. Tipografi

### Font Family

| Font | Sumber | Penggunaan |
|------|--------|------------|
| **DM Sans** | Google Fonts | Font utama seluruh UI (`font-sans`) |
| **JetBrains Mono** | Google Fonts | Kode aset, angka teknis, badge (`font-mono`) |

### Ukuran Teks (Font Size Scale)

| Ukuran | Tailwind | Penggunaan Umum |
|--------|----------|-----------------|
| `10px` | `text-[10px]` | Label uppercase, badge kecil, metadata |
| `11px` | `text-[11px]` | Subtitle kartu, teks tabel sekunder, badge |
| `12px` | `text-[12px]` | Teks tabel utama, label tombol |
| `13px` | `text-[13px]` | Label navigasi, nama file, deskripsi |
| `14px` | `text-[14px]` | Judul kartu, heading section |
| `16px` | `text-[16px]` | Judul halaman di Topbar |
| `24px` | `text-2xl` | Nilai angka di SummaryCard |

### Font Weight

| Weight | Penggunaan |
|--------|------------|
| `font-medium (500)` | Label navigasi, teks konten umum |
| `font-semibold (600)` | Judul kartu, tombol utama, heading |
| `font-bold (700)` | Nilai KPI besar di SummaryCard |

### Letter Spacing Khusus

```css
tracking-wide       /* Logo brand name */
tracking-widest     /* Label uppercase (nav group, header tabel) */
tracking-tight      /* Nilai angka besar */
```

---

## 5. Komponen Layout

### Sidebar (`components/layout/Sidebar.tsx`)

**Ukuran:**
- Expanded: `w-[230px]`
- Collapsed: `w-[68px]`
- Transisi: `transition-all duration-300 ease-in-out`

**Struktur:**
```
Sidebar
├── Logo area (border-b)
│   ├── Icon box: gradient cyan→blue, rounded-lg, shadow cyan/20
│   └── Brand text: "SmartWMS" + "WAREHOUSE"
├── Collapse toggle button (absolute, -right-3)
├── Nav area (flex-1, overflow-y-auto)
│   ├── Section label: "MAIN MENU"
│   ├── NavLink × 4 (Dashboard, Upload, Monitoring, Classification)
│   ├── Section label: "SYSTEM"
│   └── NavLink × 2 (Reports, Settings)
└── Footer (border-t)
    ├── Avatar: gradient violet→purple, rounded-lg
    ├── User name + email
    └── More icon (⋯)
```

**State Aktif NavLink:**
```
bg: gradient from-cyan-500/15 to-blue-500/10
teks: text-cyan-400
indikator: bar kiri 3px × 20px, bg-cyan-400, rounded-r-full
dot kanan: w-1.5 h-1.5, bg-cyan-400
```

**State Hover NavLink:**
```
bg: bg-white/[0.04]
teks: text-slate-200
icon: text-slate-300
```

---

### Topbar (`components/layout/Topbar.tsx`)

**Dimensi:** `h-16`, sticky top-0, z-20
**Background:** `bg-[#0d1117]/80 backdrop-blur-md`
**Border:** `border-b border-white/[0.06]`

**Elemen:**
- Kiri: Judul halaman (16px semibold) + tanggal (11px, slate-500)
- Kanan: Search input + Notif button + Avatar

**Search input:**
```
bg-white/[0.04]
border border-white/[0.08]
rounded-xl, pl-9 (icon kiri)
focus: border-cyan-500/50, bg-white/[0.06]
```

**Notif button:**
```
w-9 h-9, rounded-xl
bg-white/[0.04], border border-white/[0.08]
dot indikator: bg-cyan-400, border-[#0d1117]
```

---

## 6. Komponen Dashboard

### SummaryCard (`components/dashboard/SummaryCard.tsx`)

**Container:**
```
bg-[#111827]
border border-white/[0.06]
rounded-2xl p-5
hover: border-white/[0.10], shadow-xl
transition-all duration-300
overflow-hidden
```

**Varian Aksen (prop `accentColor`):**

| Varian | Icon BG | Icon Warna | Gradient Bar |
|--------|---------|------------|--------------|
| `cyan` | `bg-cyan-500/10 border-cyan-500/20` | `text-cyan-400` | `from-cyan-500 to-cyan-400` |
| `blue` | `bg-blue-500/10 border-blue-500/20` | `text-blue-400` | `from-blue-500 to-blue-400` |
| `violet` | `bg-violet-500/10 border-violet-500/20` | `text-violet-400` | `from-violet-500 to-violet-400` |
| `amber` | `bg-amber-500/10 border-amber-500/20` | `text-amber-400` | `from-amber-500 to-amber-400` |

**Efek Visual:**
- Background blob: `absolute -top-6 -right-6 w-24 h-24 rounded-full, opacity-[0.07] blur-2xl`
- Hover blob: `group-hover:opacity-[0.12]`
- Bottom bar sweep: `h-[2px] w-0 → group-hover:w-full`, `transition-all duration-500`

---

### UploadSection (`components/dashboard/UploadSection.tsx`)

**State Machine Pipeline:**
```
idle → dragging → selected → parsing → processing → success / error
```

**Styling per state:**

| State | Border | Background |
|-------|--------|------------|
| `idle` | `border-white/10` hover: `border-cyan-500/40` | hover: `bg-white/[0.015]` |
| `dragging` | `border-cyan-400/60` | `bg-cyan-500/[0.06]` |
| `selected` | `border-cyan-500/30` | `bg-cyan-500/[0.03]` |
| `parsing` | `border-blue-500/30` | `bg-blue-500/[0.03]` |
| `processing` | `border-blue-500/30` | `bg-blue-500/[0.03]` |
| `success` | `border-emerald-500/30` | `bg-emerald-500/[0.03]` |
| `error` | `border-rose-500/30` | `bg-rose-500/[0.03]` |

**Progress Bar:**
```
h-1.5, rounded-full
track: bg-white/[0.06]
fill: gradient sesuai fase (cyan→blue atau blue→violet)
transition-all duration-300
```

**Summary Grid (post-success):**
```
grid-cols-3, gap-2
tiap cell: bg-white/[0.03], border border-white/[0.06], rounded-xl
nilai: text-[15px] font-bold font-mono
label: text-[10px] uppercase tracking-wider text-slate-600
```

---

### RecentActivityTable (`components/dashboard/RecentActivityTable.tsx`)

**Container:** `bg-[#111827] border border-white/[0.06] rounded-2xl overflow-hidden`

**Tabel Header:**
```
text-[10px] font-semibold text-slate-600 uppercase tracking-widest
border-b border-white/[0.04]
padding: px-5 py-3
```

**Tabel Row:**
```
border-b border-white/[0.03]
hover: bg-white/[0.025]
transition-colors
```

**Filter chips:**
```
aktif: bg-white/10 text-white border border-white/20
non-aktif: text-slate-500 hover:text-slate-300 border-transparent
text-[11px] px-3 py-1 rounded-lg
```

---

## 7. Komponen Review

### ReviewSummaryCards (`components/review/ReviewSummaryCards.tsx`)

Menggunakan `SummaryCard` yang sama dengan Dashboard. Mapping aksen:

| Kartu | Aksen |
|-------|-------|
| Total Unknown | `amber` |
| Unknown Merk | `violet` |
| Unknown Jenis | `blue` |
| Completion % | `cyan` |

---

### ReviewTableToolbar (`components/review/ReviewTableToolbar.tsx`)

Filter chips kiri + search bar kanan, konsisten dengan RecentActivityTable.

```
Filter aktif:   bg-white/10 text-white border-white/20
Filter non-aktif: text-slate-500 border-transparent
Search input:   sama dengan Topbar search
```

---

### ConfidenceBadge (`components/review/ConfidenceBadge.tsx`)

Badge skor ML dengan warna dinamis:

| Skor | Warna |
|------|-------|
| ≥ 80% | `text-emerald-400 bg-emerald-400/10 border-emerald-400/20` |
| 50–79% | `text-amber-400 bg-amber-400/10 border-amber-400/20` |
| < 50% | `text-rose-400 bg-rose-400/10 border-rose-400/20` |
| `null` | `text-slate-700` — (dash) |

**Style badge:** `text-[10px] font-semibold font-mono px-2 py-0.5 rounded-lg border`

---

### UnknownBadge (`components/review/UnknownBadge.tsx`)

Menampilkan chip peringatan untuk nilai `"Unknown"`:

```
text-amber-400 bg-amber-400/10 border-amber-400/20
text-[10px] font-medium px-2 py-0.5 rounded-lg border
dengan icon ⚠ (circle-info) 9×9px
```

Jika nilai bukan Unknown: `text-slate-300 text-[12px]` (plain text).

---

## 8. Pola Warna Aksen

Seluruh UI menggunakan sistem 5 warna aksen yang konsisten:

### Cyan — Aksen Utama / Primary Action
```css
text-cyan-400      /* label, nilai aktif, link */
bg-cyan-500/10     /* icon background */
border-cyan-500/20 /* icon border */
border-cyan-500/40 /* hover state border */
shadow-cyan-500/20 /* glow shadow tombol utama */
from-cyan-500 to-blue-600  /* gradient tombol CTA */
```

### Blue — Proses / Secondary
```css
text-blue-400      /* status processing, badge */
bg-blue-500/10     /* icon bg */
from-blue-500 to-blue-400  /* gradient bar */
```

### Violet / Purple — User / Aksen Dekoratif
```css
text-violet-400
bg-violet-500 to-purple-700   /* avatar gradient */
shadow-purple-500/20          /* avatar glow */
```

### Amber — Warning / Unknown
```css
text-amber-400     /* badge unknown, peringatan */
bg-amber-400/10
border-amber-400/20
```

### Emerald — Sukses / Aktif
```css
text-emerald-400   /* status aktif, sukses upload */
bg-emerald-400/10
border-emerald-400/20
```

### Rose — Error / Gagal
```css
text-rose-400      /* error state, batch gagal */
bg-rose-400/10
border-rose-400/20
```

---

## 9. Status Badge System

Seluruh status ditampilkan sebagai chip kecil dengan pola yang seragam:

```
text-[10px] font-semibold px-2–2.5 py-0.5 rounded-lg border
```

| Status | Class |
|--------|-------|
| Aktif | `text-emerald-400 bg-emerald-400/10 border-emerald-400/20` |
| Nonaktif | `text-slate-400 bg-slate-400/10 border-slate-400/20` |
| Maintenance | `text-amber-400 bg-amber-400/10 border-amber-400/20` |
| Unclassified | `text-rose-400 bg-rose-400/10 border-rose-400/20` |
| DAT Import | `text-cyan-400 bg-cyan-500/10 border-cyan-500/20` |
| Selesai | `text-emerald-400 bg-emerald-500/10 border-emerald-500/20` |
| Parsial | `text-amber-400 bg-amber-500/10 border-amber-500/20` |

---

## 10. Animasi & Transisi

### Hover Transisi
```css
transition-all duration-150   /* NavLink (cepat) */
transition-all duration-300   /* Kartu, border, shadow */
transition-all duration-500   /* Bottom bar sweep di SummaryCard */
transition-colors             /* Baris tabel, tombol */
```

### Loading Spinner
```css
animate-spin
animationDuration: "1.2s"    /* parsing / processing */
```

### Dragging Pulse
```css
animate-pulse   /* icon drop zone saat file di-drag */
```

### Progress Bar
```css
transition-all duration-300   /* pengisian progres batch */
```

### Collapse Sidebar
```css
transition-all duration-300 ease-in-out   /* lebar 230px ↔ 68px */
```

---

## 11. Scrollbar Custom

Didefinisikan di `globals.css`, berlaku global:

```css
::-webkit-scrollbar        { width: 5px; height: 5px; }
::-webkit-scrollbar-track  { background: transparent; }
::-webkit-scrollbar-thumb  { background: rgba(255,255,255,0.08); border-radius: 100px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.14); }
```

---

## 12. Panduan Konsistensi

Aturan-aturan berikut wajib diikuti saat menambahkan komponen baru agar tetap selaras dengan sistem desain:

### Kartu / Panel
```
bg-[#111827]
border border-white/[0.06]
rounded-2xl
p-5
```

### Input / Form Field
```
bg-white/[0.04]
border border-white/[0.08]
rounded-xl
text-slate-300 placeholder:text-slate-600
focus:border-cyan-500/50 focus:bg-white/[0.06]
```

### Tombol Utama (CTA)
```
bg-gradient-to-r from-cyan-500 to-blue-600
text-white font-semibold rounded-xl
shadow-lg shadow-cyan-500/20
hover:from-cyan-400 hover:to-blue-500
hover:shadow-cyan-500/30
```

### Tombol Sekunder
```
bg-white/[0.05]
border border-white/10
text-slate-300 rounded-xl
hover:bg-white/[0.08] hover:text-white
```

### Heading Section
```
text-white text-[14px] font-semibold
subtitle: text-slate-500 text-[11px] mt-0.5
```

### Divider
```
border-b border-white/[0.06]
```

### Jangan Gunakan
- Background putih atau terang
- Shadow keras tanpa opacity
- Font size di bawah `10px` atau di atas `16px` (kecuali nilai KPI)
- Warna di luar palet 5 aksen yang ada
- Rounded kurang dari `rounded-lg` untuk elemen interaktif
- Spacing `p-6` atau lebih untuk kartu (gunakan `p-5` atau `p-4`)
