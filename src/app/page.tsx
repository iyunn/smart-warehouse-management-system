"use client";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import SummaryCard from "@/components/SummaryCard";
import UploadSection from "@/components/UploadSection";
import RecentActivityTable from "@/components/RecentActivityTable";

const SUMMARY_CARDS = [
  {
    title: "Total Asset",
    value: 3_842,
    subtitle: "Seluruh aset terdaftar",
    trend: { value: "12.4%", positive: true },
    accentColor: "cyan" as const,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      </svg>
    ),
  },
  {
    title: "Total Printer",
    value: 1_204,
    subtitle: "Unit aktif: 1,091",
    trend: { value: "3.2%", positive: true },
    accentColor: "blue" as const,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="6 9 6 2 18 2 18 9" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" />
      </svg>
    ),
  },
  {
    title: "Total Monitor",
    value: 987,
    subtitle: "Unit aktif: 954",
    trend: { value: "1.8%", positive: false },
    accentColor: "violet" as const,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    title: "Unclassified Asset",
    value: 142,
    subtitle: "Perlu ditindaklanjuti",
    trend: { value: "5.6%", positive: false },
    accentColor: "amber" as const,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
];

export default function DashboardPage() {
  return (
    <div className="flex h-screen bg-[#080e17] font-sans overflow-hidden">
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar title="Dashboard" />

        <main className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Welcome banner */}
          <div className="relative bg-gradient-to-br from-[#0d1f35] to-[#0d1117] border border-cyan-500/10 rounded-2xl px-5 py-4 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-cyan-500/[0.07] blur-3xl" />
              <div className="absolute top-4 right-32 w-20 h-20 rounded-full bg-blue-500/[0.07] blur-2xl" />
            </div>
            <div className="relative flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-white text-sm font-semibold">Selamat datang, Admin 👋</h2>
                <p className="text-slate-400 text-xs mt-1 max-w-md">
                  Sistem berjalan normal. Terdapat{" "}
                  <span className="text-amber-400 font-semibold">142 aset belum terklasifikasi</span>{" "}
                  yang memerlukan perhatian.
                </p>
              </div>
              <button className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold px-4 py-1.5 rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20 whitespace-nowrap">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M4 6h16M4 10h16M4 14h10M4 18h6" />
                </svg>
                Klasifikasikan Sekarang
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            {SUMMARY_CARDS.map(card => (
              <SummaryCard key={card.title} {...card} />
            ))}
          </div>

          {/* Upload + mini stats */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
            <div className="lg:col-span-3">
              <UploadSection />
            </div>

            {/* Mini stats panel */}
            <div className="lg:col-span-2 bg-[#111827] border border-white/[0.06] rounded-2xl p-4 space-y-3">
              <div>
                <h3 className="text-white text-xs font-semibold">Distribusi Aset</h3>
                <p className="text-slate-500 text-[10px] mt-0.5">Berdasarkan kategori</p>
              </div>

              <div className="space-y-2.5">
                {[
                  { label: "Printer", count: 1204, total: 3842, color: "bg-blue-500" },
                  { label: "Monitor", count: 987, total: 3842, color: "bg-violet-500" },
                  { label: "Komputer", count: 854, total: 3842, color: "bg-cyan-500" },
                  { label: "Jaringan", count: 655, total: 3842, color: "bg-emerald-500" },
                  { label: "Lainnya", count: 142, total: 3842, color: "bg-amber-500" },
                ].map(item => {
                  const pct = Math.round((item.count / item.total) * 100);
                  return (
                    <div key={item.label}>
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-slate-400 text-xs">{item.label}</span>
                        <span className="text-slate-500 text-[10px]">{item.count.toLocaleString()} <span className="text-slate-700">/ {pct}%</span></span>
                      </div>
                      <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-slate-600 text-[10px]">Total Aset</span>
                <span className="text-white text-xs font-bold">3,842</span>
              </div>
            </div>
          </div>

          {/* Table */}
          <RecentActivityTable />
        </main>
      </div>
    </div>
  );
}
