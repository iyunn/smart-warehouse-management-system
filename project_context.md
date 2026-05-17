# PROJECT_CONTEXT.md

# Smart Asset Monitoring and Reconciliation System

## Project Identity

### Project Name
Smart Asset Monitoring and Reconciliation System

### Thesis Title
Implementasi Smart Asset Monitoring and Reconciliation System Berbasis Cloud Computing Menggunakan React dan Supabase dengan Metode Agile Development

### Project Type
Cloud-Based Enterprise Asset Monitoring & Reconciliation System

### Development Status
Active Development

---

# 1. Project Overview

## System Overview
Smart Asset Monitoring and Reconciliation System merupakan sistem monitoring, analisis, dan rekonsiliasi data aset perusahaan berbasis cloud computing.

Sistem dikembangkan untuk membantu proses:
- monitoring aset perusahaan
- validasi sinkronisasi data aset
- warehouse asset intelligence
- klasifikasi aset otomatis
- discrepancy detection
- analisis perpindahan aset
- monitoring mismatch asset
- monitoring operasional gudang

Sistem menggunakan pendekatan:
- ETL Pipeline
- Asset Classification Engine
- Warehouse Intelligence Dashboard
- Reconciliation Monitoring

---

## Main Purpose
Sistem dibuat untuk membantu menyelesaikan permasalahan ketidaksinkronan data antara:

- Oracle DAT
- Web Tracking Asset
- Kondisi fisik aset

Sistem ini bukan pengganti Oracle ERP maupun Web Tracking.

Sistem ini berfungsi sebagai:
- monitoring system
- reconciliation system
- warehouse intelligence system
- supporting operational dashboard

---

## Target Users

### Primary Users
- Admin Gudang
- Admin Web Tracking
- Supervisor Asset
- General Affairs Asset Division

### Secondary Users
- Auditor Internal
- Operational Monitoring Team
- Warehouse PIC

---

## Core Problem Solving

### Existing Problems

#### 1. Oracle dan Web Tracking tidak terintegrasi langsung
Akibat:
- double input
- human error
- keterlambatan sinkronisasi
- mismatch data asset

#### 2. Perpindahan fisik barang tidak selalu sinkron dengan administrasi
Akibat:
- DAT tidak sesuai fisik
- ownership asset tidak valid
- stock opname mismatch

#### 3. Monitoring masih berbasis Excel manual
Akibat:
- sulit monitoring realtime
- sulit validasi data
- sulit tracking histori
- sulit analisis stok

#### 4. Deskripsi asset legacy tidak konsisten
Contoh:
- Printer Epson T82
- Printer TM Epson T82
- Epson TM-T82
- Printer Thermal Epson TM-T82

Akibat:
- sulit filtering
- sulit reporting
- sulit grouping asset
- sulit analisis stok

---

# 2. Business Workflow Context

## Existing Enterprise Workflow

### Oracle DAT Workflow
Oracle digunakan sebagai sistem utama administrasi asset perusahaan.

Digunakan untuk:
- input asset
- mutasi asset
- pengelolaan DAT
- cost-center management
- depresiasi asset
- P3AT / pemusnahan asset
- kebutuhan finance

Oracle menjadi sumber utama administrasi dan financial asset.

---

### Web Tracking Workflow
Web Tracking digunakan untuk:
- tracking perpindahan asset
- pengelolaan Surat Jalan
- BTB (Bukti Terima Barang)
- tracking ownership asset
- tracking perpindahan antar cost-center

Jenis transaksi:
- Surat Jalan Mutasi
- Surat Jalan Service
- Surat Jalan Toko Tutup
- Surat Jalan Sewa
- dan transaksi lainnya

---

## Main Operational Problems

### Scenario 1
Asset sudah dimutasi di Web Tracking tetapi belum dimutasi di Oracle.

Akibat:
- ownership berbeda
- depresiasi salah
- finance mismatch

---

### Scenario 2
Asset sudah dimutasi di Oracle tetapi tidak dibuatkan Web Tracking.

Akibat:
- lokasi asset tidak valid
- ownership tracking mismatch
- stock opname selisih

---

### Scenario 3
Perpindahan fisik dilakukan menggunakan Surat Jalan manual.

Akibat:
- perpindahan tidak tercatat di sistem
- histori asset hilang
- audit discrepancy

---

## System Positioning

System ini bukan:
- ERP replacement
- warehouse ERP
- accounting system
- official mutation system

System ini adalah:
- monitoring dashboard
- reconciliation system
- warehouse intelligence system
- asset analysis system
- discrepancy monitoring system

---

# 3. Current Development State

## Features Completed

### Dashboard UI
Status: ✅ Completed

Features:
- enterprise dashboard layout
- sidebar navigation
- topbar
- summary cards
- dashboard analytics layout
- dark SaaS interface

---

### Excel Upload Pipeline
Status: ✅ Completed

Features:
- DAT Oracle upload
- XLSX parsing
- batch processing
- upload validation
- Supabase insert

---

### DAT Oracle Parsing
Status: ✅ Completed

Features:
- header normalization
- hidden sheet handling
- row transformation
- normalization process

---

### Classification Engine
Status: ✅ Completed

Features:
- keyword-based classification
- merk detection
- kategori detection
- confidence scoring
- normalization engine

---

### Review Assets Dashboard
Status: ✅ Completed

Features:
- unknown asset review
- filtering
- pagination
- search
- review workflow

---

### Keyword Rule System
Status: ✅ Completed

Features:
- add keyword rule
- Supabase integration
- adaptive classification preparation

---

## Features In Progress

### Real-time Dashboard Statistics
Status: 🚧 In Progress

Target:
- live Supabase statistics
- realtime summary cards
- realtime analytics

---

### Reclassification Engine
Status: 🚧 In Progress

Target:
- auto reclassify after keyword insertion
- refresh unknown asset queue
- update existing data

---

### DAT Classifier Improvement
Status: 🚧 In Progress

Target:
- legacy asset normalization
- serial number extraction
- smarter parsing rules
- asset standardization

---

## Planned Features

### DAT vs Web Tracking Reconciliation
Status: 📌 Planned

Features:
- mismatch detection
- discrepancy dashboard
- reconciliation monitoring

---

### Internal Surat Jalan System
Status: 📌 Planned

Features:
- manual SJ replacement
- serial number tracking
- temporary operational bridge
- warehouse movement log

---

### PDF Surat Jalan Parser
Status: 📌 Planned

Features:
- read SJ PDF
- extract DAT number
- extract owner
- movement detection
- movement logging

---

### Reporting System
Status: 📌 Planned

Features:
- export PDF
- export Excel
- reconciliation reports
- stock reports

---

### Authentication & Role Management
Status: 📌 Planned

Features:
- login
- role management
- protected routes

---

## Features Still Dummy / Mock

### Summary Cards
Current:
- static numbers
- dummy statistics

Target:
- realtime Supabase statistics

---

### Recent Activity
Current:
- placeholder table

Target:
- real upload history
- real activity log

---

### Asset Distribution Panel
Current:
- mock chart data

Target:
- live category distribution

---

# 4. Current Tech Stack

## Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4

---

## Backend
Current backend architecture:
- Next.js Route Handlers
- Serverless API approach

No dedicated backend server currently used.

---

## Database
- Supabase PostgreSQL

Database Architecture:
- cloud-hosted PostgreSQL
- raw vs clean architecture
- classification logs
- keyword learning system

---

## Deployment
- Vercel

---

## Cloud Architecture

| Component | Cloud Model |
|---|---|
| Vercel | PaaS |
| Supabase | BaaS / DBaaS |
| GitHub | SaaS |

---

## Libraries

### Main Libraries
- @supabase/supabase-js
- xlsx
- lucide-react

### Development Libraries
- tailwindcss
- typescript
- @types/react

---

## Development Tools
- GitHub
- VS Code
- Claude AI
- ChatGPT

---

# 5. Frontend Architecture

## Current Folder Structure

```text
src/
 ├── app/
 │    ├── dashboard/
 │    ├── review/
 │    └── api/
 │
 ├── components/
 │    ├── layout/
 │    ├── dashboard/
 │    └── review/
 │
 ├── hooks/
 │
 ├── lib/
 │
 └── types/
```

---

## Routing Flow

### Main Routes

| Route | Purpose |
|---|---|
| /dashboard | Main dashboard |
| /review | Review unclassified assets |
| /api/process | Upload processing API |

---

## Component Architecture

### Architecture Pattern
Current frontend menggunakan:
- modular component architecture
- reusable UI components
- feature grouping
- hooks-based logic separation

---

### Current Pattern

#### Components
Digunakan untuk:
- presentational UI
- layout
- reusable cards
- reusable table
- reusable badges

#### Hooks
Digunakan untuk:
- business logic
- state management
- data processing
- Supabase interaction

#### Lib
Digunakan untuk:
- utilities
- parser
- classifier
- Supabase client
- types

---

## State Management

### Current Approach
Using:
- useState
- useMemo
- useCallback
- custom hooks

---

### Important Note
Project intentionally DOES NOT use:
- Redux
- Zustand
- large global state

Reason:
- current project scale still manageable
- lightweight architecture preferred
- avoid unnecessary complexity

---

## Reusable Component Strategy

### Current UI Pattern
All UI should follow:
- reusable cards
- reusable badges
- reusable toolbar
- reusable table rows
- modular dashboard widgets

Avoid duplicated UI.

---

# 6. UI/UX Guidelines

## Design Language

Current UI style:
- enterprise dark dashboard
- modern SaaS dashboard
- warehouse intelligence dashboard
- analytics style interface

---

## Design Characteristics

### Visual Style
- dark background
- cyan/blue accents
- rounded cards
- glassmorphism feel
- compact spacing
- modern enterprise layout

---

## Layout Pattern

### Main Layout

Structure:
- collapsible sidebar
- sticky topbar
- responsive dashboard grid
- analytics card layout

---

## Responsive Strategy

Responsive behavior:
- desktop-first dashboard
- responsive grid
- adaptive cards
- compact mobile layout

---

## Typography

Current style:
- clean sans-serif
- modern dashboard typography
- compact enterprise spacing

---

## UI Consistency Rules

### REQUIRED
All future UI MUST:
- follow existing dark dashboard style
- maintain rounded card design
- maintain current spacing pattern
- maintain current accent color
- maintain current component style

---

## Animation Style

Current approach:
- lightweight transition
- subtle hover effect
- smooth card interaction

Avoid heavy animation.

---

# 7. Backend & Database Architecture

## Current Backend Architecture

Current architecture:

```text
Frontend Upload
↓
Next.js API Route
↓
XLSX Parsing
↓
Normalization
↓
Batch Processing
↓
Supabase Insert
↓
Classification Engine
↓
Dashboard Analytics
```

---

## Database Tables

### assets_raw
Stores raw uploaded DAT data.

Main fields:
- kode_asset
- deskripsi
- lokasi
- status
- toko
- kategori_oracle

Reference: database_structure.md

---

### assets_clean
Stores normalized & classified assets.

Main fields:
- jenis
- merk
- kategori
- normalized_description
- confidence

---

### classification_logs
Stores classification history.

Used for:
- audit
- debugging
- review
- reclassification tracking

---

### keyword_rules
Stores classification keyword rules.

Used for:
- adaptive learning
- keyword matching
- classification improvement

---

## Current Database Concept

### Raw vs Clean Architecture

#### assets_raw
Stores:
- original Oracle data
- untouched source data

#### assets_clean
Stores:
- normalized data
- classified data
- processed data

This architecture MUST be maintained.

---

## Current ETL Flow

```text
Excel Upload
↓
XLSX Parser
↓
Header Validation
↓
Normalization
↓
Batch Processing
↓
Supabase Insert
↓
Classification Engine
↓
Dashboard
```

---

## Current Classification Flow

```text
Original Description
↓
Keyword Matching
↓
Normalization
↓
Classification
↓
Confidence Score
↓
assets_clean
```

---

## Planned Reconciliation Flow

```text
Oracle DAT
+
Web Tracking
+
Internal SJ
↓
Reconciliation Engine
↓
Mismatch Detection
↓
Monitoring Dashboard
```

---

## Authentication Flow

### Current State
Authentication not implemented yet.

Current mode:
- internal prototype
- public development mode

---

## Planned Authentication

Planned:
- Supabase Auth
- role-based access
- protected routes

---

# 8. Classification Engine Architecture

## Classification System

Current system uses:
- keyword-based classification
- adaptive rule system
- normalization process

---

## Classification Goals

System should detect:
- jenis barang
- merk
- kategori
- serial number
- normalized description

---

## Main Purpose

Current classifier exists to:
- normalize legacy asset descriptions
- improve reporting quality
- improve filtering
- improve warehouse analytics

---

## Adaptive Keyword Learning

Current architecture supports:
- adding new keyword rules
- improving classification quality
- dynamic rule update

---

## Review Workflow

Workflow:

```text
Unknown Asset
↓
Review Dashboard
↓
Add Keyword Rule
↓
Save to Supabase
↓
Reclassification
```

---

# 9. Development Rules

## Coding Rules

### REQUIRED
- modular code
- reusable component
- clean separation of logic
- avoid duplicated logic
- maintain lightweight architecture

---

## Naming Convention

### Components
PascalCase

Example:
- SummaryCard.tsx
- ReviewTable.tsx

### Hooks
camelCase with use prefix

Example:
- useReviewAssets.ts
- useKeywordRule.ts

### Utilities
camelCase

Example:
- xlsxParser.ts
- classifier.ts

---

## Import Rules

Preferred:
- grouped imports
- clean ordering
- avoid circular dependency

---

## Dependency Rules

DO NOT add heavy dependency unless necessary.

Avoid:
- unnecessary state library
- unnecessary UI framework
- overengineering

---

## Architecture Rules

### MUST KEEP
- modular structure
- hooks separation
- reusable component pattern
- ETL architecture
- raw vs clean database architecture

---

# 10. Existing Constraints

## Thesis Scope Constraints

Project scope limited to:
- monitoring
- analysis
- reconciliation
- warehouse intelligence

Project DOES NOT include:
- ERP replacement
- financial accounting
- official asset mutation system
- Oracle replacement

---

## Technical Constraints

Current limitations:
- no realtime sync with Oracle
- no direct integration with Web Tracking
- upload-based reconciliation
- PDF parsing not implemented yet

---

## Operational Constraints

Current workflow still depends on:
- manual upload
- operational admin workflow
- Oracle export file
- Web Tracking export file

---

# 11. Future Development Direction

## Main Roadmap

### Phase 1
- stabilize upload pipeline
- improve classifier
- realtime dashboard

### Phase 2
- reconciliation engine
- DAT vs Web Tracking validation
- mismatch analytics

### Phase 3
- internal Surat Jalan system
- PDF parser
- movement timeline

### Phase 4
- analytics dashboard
- export reporting
- role management

---

## Future Planned Features

### Priority Features
- reconciliation engine
- PDF parsing
- internal SJ system
- stock analytics
- dashboard analytics
- reporting
- role management

---

# 12. AI Development Guidance

## Important Context

This project ALREADY has:
- existing architecture
- existing UI system
- existing Supabase integration
- existing ETL pipeline
- existing component structure

AI/developer MUST:
- continue existing direction
- preserve architecture consistency
- preserve UI consistency
- preserve database consistency

---

## DO NOT

- rewrite architecture
- create ERP system
- replace Supabase architecture
- replace ETL flow
- overengineer state management
- change current dashboard design direction

---

## REQUIRED APPROACH

- maintain modular structure
- maintain reusable component strategy
- maintain current UI style
- maintain current database architecture
- preserve lightweight architecture
- follow current feature modularization

---

## UI Guidance

Future UI MUST:
- follow enterprise dark dashboard style
- maintain cyan/blue accents
- maintain rounded cards
- maintain compact spacing
- maintain current dashboard hierarchy

---

## Backend Guidance

Future backend MUST:
- preserve Supabase integration
- preserve ETL architecture
- preserve raw vs clean approach
- preserve batch processing strategy

---

# 13. Known Issues & Technical Debt

## Current Issues

### Dashboard Statistics
Current:
- still dummy
- not realtime

---

### Activity Table
Current:
- placeholder only

---

### Classification Accuracy
Current limitations:
- keyword matching still limited
- legacy description still inconsistent

---

### Authentication
Current:
- not implemented yet

---

## Technical Debt

### Current Technical Debt
- no centralized logging
- limited analytics
- parser still evolving
- no realtime engine yet
- review workflow still basic

---

## Refactor Areas

Potential future refactor:
- parser modularization
- reconciliation service layer
- analytics optimization
- dashboard performance optimization

---

# 14. DO NOT CHANGE WITHOUT APPROVAL

## High Priority Protected Architecture

The following parts MUST NOT be changed without approval:

- Core database structure
- Raw vs clean architecture
- Authentication flow design
- Main routing architecture
- Existing Supabase integration
- Existing reusable component patterns
- Existing ETL upload pipeline
- Current dashboard layout structure
- Current feature modularization
- Current hooks-based logic separation

---

# Final Notes

This project is:
- enterprise-inspired
- thesis-oriented
- monitoring-focused
- reconciliation-focused
- warehouse intelligence focused

Main objective:
Build a scalable and maintainable cloud-based asset monitoring & reconciliation system while preserving lightweight modern architecture.

