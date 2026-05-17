# Smart Warehouse Management System
# Project Architecture & Development Documentation

---

# 1. Current Development State

## Project Overview
Smart Warehouse Management System merupakan sistem manajemen dan monitoring aset berbasis web yang dibangun untuk membantu proses:
- ingest data DAT Oracle
- klasifikasi aset
- monitoring aset
- validasi data aset
- adaptive keyword classification
- warehouse intelligence

Sistem menggunakan pendekatan ETL pipeline dan classification engine untuk mengolah data DAT Oracle menjadi data warehouse yang lebih terstruktur dan mudah dianalisis.

---

# Feature Status

## Features Completed

### Dashboard UI
Status: ✅ Completed

Fitur:
- enterprise dark dashboard
- sidebar navigation
- topbar
- summary cards
- upload section
- recent activity table

---

### Excel Upload Pipeline
Status: ✅ Completed

Fitur:
- upload DAT Oracle (.xlsx)
- XLSX parsing
- batch processing
- Supabase insert
- ETL pipeline

---

### DAT Oracle Parsing
Status: ✅ Completed

Fitur:
- parsing file DAT Oracle
- header normalization
- hidden sheet handling
- row transformation
- normalization process

---

### Classification Engine
Status: ✅ Completed

Fitur:
- keyword-based classification
- merk detection
- kategori detection
- confidence scoring
- normalization engine

---

### Review Assets Dashboard
Status: ✅ Completed

Fitur:
- unknown asset review
- filtering
- search
- pagination
- summary cards
- review table

---

### Keyword Rule System
Status: ✅ Completed

Fitur:
- add keyword rule
- modal workflow
- Supabase integration
- adaptive classification preparation

---

## Features In Progress

### Real-time Dashboard Statistics
Status: 🚧 In Progress

Target:
- summary cards menggunakan live Supabase data
- realtime unknown asset count
- realtime classification statistics

---

### Reclassification Engine
Status: 🚧 In Progress

Target:
- otomatis reclassify setelah keyword baru ditambahkan
- update data existing
- refresh unknown asset queue

---

## Features Planned

### Authentication & Role Management
Status: 📌 Planned

Rencana:
- login system
- admin role
- user role
- protected routes

---

### Reporting System
Status: 📌 Planned

Rencana:
- export laporan
- analytics report
- PDF export
- Excel export

---

### DAT vs Web Tracking Validation
Status: 📌 Planned

Rencana:
- mismatch detection
- validation dashboard
- warehouse reconciliation

---

### Analytics Dashboard
Status: 📌 Planned

Rencana:
- realtime analytics
- asset distribution
- trend monitoring
- warehouse statistics

---

## Features Still Dummy / Placeholder

### Summary Cards
Saat ini masih menggunakan:
- hardcoded dummy numbers

Target:
- live Supabase statistics

---

### Recent Activity Table
Saat ini masih placeholder.

Belum menggunakan:
- real upload logs
- real activity history

---

### Distribusi Asset Panel
Masih menggunakan:
- static mock data

Target:
- dynamic category distribution

---

# 2. Current Architecture

## Frontend Architecture

### Stack
- Next.js App Router
- React
- TypeScript
- Tailwind CSS

---

### Frontend Pattern
Menggunakan:
- modular component architecture
- reusable UI components
- client-side rendering untuk dashboard interaktif
- hooks-based logic separation

---

## Backend Architecture

### Current Backend
Saat ini backend menggunakan:
- Next.js Route Handlers
- Supabase PostgreSQL

Belum menggunakan:
- dedicated backend server
- microservices

---

## Folder Architecture

```text
src/
 ├── app/
 │    ├── page.tsx
 │    ├── review/
 │    └── api/
 │
 ├── components/
 │    ├── review/
 │    ├── Sidebar.tsx
 │    ├── Topbar.tsx
 │    ├── SummaryCard.tsx
 │    └── UploadSection.tsx
 │
 ├── hooks/
 │    ├── useKeywordRule.ts
 │    └── useReviewAssets.ts
 │
 ├── lib/
 │    ├── classifier.ts
 │    ├── supabaseClient.ts
 │    ├── xlsxParser.ts
 │    └── reviewTypes.ts
 │
 └── types/
```

---

## Component Pattern

### Current Pattern
Menggunakan:
- reusable components
- presentational components
- hooks for business logic
- modular feature grouping

Contoh:
- review components dipisah dalam `/components/review`
- logic dipisah dalam `/hooks`
- utility dipisah dalam `/lib`

---

## State Management

### Current Approach
Menggunakan:
- React useState
- React useMemo
- React useCallback
- custom hooks

Belum menggunakan:
- Redux
- Zustand
- Context global besar

Pendekatan sekarang dipilih karena:
- project masih manageable
- lebih lightweight
- performa lebih ringan

---

## Authentication Flow

### Current State
Belum diimplementasikan.

Sistem saat ini masih:
- public/internal prototype mode

---

## Database Flow

```text
Excel Upload
↓
XLSX Parser
↓
Normalization
↓
assets_raw
↓
Classification Engine
↓
assets_clean
↓
Review Dashboard
↓
keyword_rules
```

---

## API Flow

```text
Frontend Upload
↓
Next.js API Route
↓
XLSX Parsing
↓
Batch Processing
↓
Supabase Insert
↓
Frontend Refresh
```

---

# 3. UI/UX Architecture

## Design System

### Current Design Language
Menggunakan:
- dark enterprise dashboard
- analytics dashboard style
- cyan / blue accent
- rounded-2xl cards
- soft border transparency
- compact spacing
- modern SaaS style

---

## Layout Pattern

### Current Layout
Menggunakan:
- fixed sidebar
- topbar header
- responsive content area
- card-based layout
- modular sections

---

## Reusable Components

### Existing Reusable Components
- Sidebar
- Topbar
- SummaryCard
- UploadSection
- ReviewTableRow
- ConfidenceBadge
- UnknownBadge
- ReviewSummaryCards

---

## Responsive Strategy

### Current Responsive Pattern
Menggunakan:
- Tailwind responsive grid
- mobile stacking
- desktop analytics layout
- adaptive spacing

---

## Dark / Light Mode

### Current State
Saat ini:
- dark mode only

Belum ada:
- light mode
- theme switching

Keputusan ini diambil untuk:
- menjaga konsistensi UI
- fokus development
- enterprise dashboard feel

---

# 4. Database Architecture

## Current Tables

### assets_raw

Tujuan:
- menyimpan data mentah hasil upload Oracle

Fungsi:
- raw ingestion
- audit source data
- backup upload data

Field utama:
- kode_asset
- toko
- kategori_oracle
- deskripsi
- status

---

### assets_clean

Tujuan:
- menyimpan data hasil normalisasi dan klasifikasi

Fungsi:
- analytics
- dashboard
- reporting
- review assets

Field utama:
- original_description
- normalized_description
- jenis
- merk
- kategori
- confidence_score

---

### keyword_rules

Tujuan:
- menyimpan rule klasifikasi

Fungsi:
- adaptive classification
- keyword mapping
- learning system

Field utama:
- keyword
- jenis
- merk
- kategori
- notes
- created_by

---

### classification_logs

Tujuan:
- logging proses klasifikasi

Fungsi:
- audit trail
- debugging
- monitoring classifier

---

## Current Relationship

```text
assets_raw
   ↓
classification engine
   ↓
assets_clean
   ↓
review workflow
   ↓
keyword_rules
```

---

## Main Data Flow

```text
Oracle DAT
↓
Excel Upload
↓
Raw Storage
↓
Normalization
↓
Classification
↓
Review Unknown
↓
Add Keyword Rule
↓
Adaptive Improvement
```

---

# 5. Development Rules

## Important Rules

### Do Not Change

Bagian yang tidak boleh diubah sembarangan:
- dashboard design language
- folder architecture
- ETL flow
- upload pipeline flow
- Supabase integration pattern
- component modular structure

---

## Coding Pattern Rules

### Required Pattern
- modular architecture
- reusable component
- hooks for business logic
- TypeScript typing
- Tailwind utility classes
- clean separation of concerns

---

## Naming Convention

### File Naming
Components:
```text
PascalCase.tsx
```

Hooks:
```text
camelCase.ts
```

Utility:
```text
camelCase.ts
```

---

### Variable Naming
Menggunakan:
- camelCase
- descriptive naming
- avoid abbreviated naming

---

## Required Stack

### Mandatory Stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase
- XLSX

---

## Dependency Rules

### Important Dependencies
Tidak disarankan mengganti:
- Tailwind CSS
- Supabase
- Next.js App Router
- XLSX

Karena:
- arsitektur sudah dibangun berdasarkan stack tersebut
- perubahan dependency besar akan mempengaruhi banyak struktur existing

---

# 6. Future Development Direction

## Main Direction

Project diarahkan menjadi:

```text
Smart Warehouse Asset Monitoring & Classification System
```

Fokus:
- warehouse intelligence
- adaptive classification
- asset analytics
- reconciliation monitoring

---

## Planned Direction

### Near-Term Direction
- realtime dashboard
- reclassification engine
- analytics statistics
- live Supabase integration

---

### Mid-Term Direction
- reporting system
- validation workflow
- reconciliation monitoring
- authentication system

---

### Long-Term Direction
- AI-assisted classification
- advanced analytics
- anomaly detection
- predictive warehouse monitoring

---

## Scope of Thesis Project

### Main Scope
Project skripsi difokuskan pada:
- ETL pipeline
- warehouse asset management
- adaptive classification
- dashboard monitoring
- cloud-based architecture

---

## Scope Limitations

### Out of Scope
- ERP replacement
- finance integration penuh
- procurement system
- accounting system
- advanced AI training
- machine learning model training

---

# 7. Known Technical Debt

## Current Known Issues

### Dashboard Statistics
Masih:
- static mock data

Belum:
- realtime Supabase statistics

---

### Recent Activity
Masih placeholder.

Belum:
- activity logging system

---

### Reclassification Engine
Belum otomatis.

Saat ini:
- keyword hanya tersimpan
- belum trigger reclassification

---

### Classification Quality
Saat ini:
- masih keyword exact/semi-exact matching

Belum:
- fuzzy matching
- synonym handling
- typo handling

---

### Authentication
Belum tersedia.

Sistem masih:
- prototype/internal mode

---

## Temporary Workarounds

### Hardcoded Options
Saat ini:
- jenis
- kategori

masih hardcoded.

Keputusan ini diambil untuk:
- menghindari overengineering
- menjaga development speed
- menjaga simplicity

---

### Static Analytics
Dashboard analytics sementara masih:
- dummy values
- mock distribution

Tujuan:
- mempercepat UI prototyping

---

## Future Refactor Candidates

### Candidate Refactors
- realtime analytics architecture
- centralized API layer
- caching strategy
- master data architecture
- automated reclassification engine
- dashboard state optimization

---

# Final Notes

Project ini telah berkembang dari:

```text
prototype upload dashboard
```

menjadi:

```text
cloud-based adaptive warehouse asset management system
```

Arsitektur saat ini sudah memiliki:
- modular structure
- ETL pipeline
- adaptive review workflow
- classification engine
- scalable dashboard foundation

Fokus utama development berikutnya adalah:
- stabilisasi workflow
- realtime analytics
- adaptive reclassification
- production readiness

---

