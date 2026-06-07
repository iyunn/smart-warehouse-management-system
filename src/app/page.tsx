"use client";

import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import DataStatusCards from "@/components/dashboard/DataStatusCards";
import CGASummaryCards from "@/components/dashboard/CGASummaryCards";
import {
  DATvsLPPPlaceholder,
  TrendClosingPlaceholder,
  ClosingVsUpdatePlaceholder,
  RekapPengirimanPlaceholder,
} from "@/components/dashboard/PlaceholderCards";
import { useDashboardStats } from "@/hooks/useDashboardStats";

export default function DashboardPage() {
  const { data, loading } = useDashboardStats();

  return (
    <div className="flex h-screen bg-[#080e18] overflow-hidden">
      <Sidebar />
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
                  Sistem berjalan normal.{" "}
                  {!loading && data && data.summary.totalUnknown > 0 && (
                    <>
                      Terdapat{" "}
                      <span className="text-amber-400 font-semibold">
                        {data.summary.totalUnknown.toLocaleString()} aset belum terklasifikasi
                      </span>{" "}
                      yang memerlukan perhatian.
                    </>
                  )}
                </p>
              </div>
              <Link href="/review"
                className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold px-4 py-1.5 rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20 whitespace-nowrap">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M4 6h16M4 10h16M4 14h10M4 18h6" />
                </svg>
                Klasifikasikan Sekarang
              </Link>
            </div>
          </div>

          {/* Baris 1: Status Data */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-2">Status Data</p>
            <DataStatusCards
              datUpdate={data?.dataStatus.datUpdate ?? null}
              datClosing={data?.dataStatus.datClosing ?? null}
              lppUpdate={data?.dataStatus.lppUpdate ?? null}
              lppClosing={data?.dataStatus.lppClosing ?? null}
              loading={loading}
            />
          </div>

          {/* Baris 2: DAT vs LPP Comparison (placeholder) */}
          <DATvsLPPPlaceholder />

          {/* Baris 3: Trend Closing (placeholder) */}
          <TrendClosingPlaceholder />

          {/* Baris 4: CGA Summary (LIVE) */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-2">Ringkasan Aset per Gudang</p>
            <CGASummaryCards breakdown={data?.breakdown ?? []} loading={loading} />
          </div>

          {/* Baris 5: Closing vs Update (placeholder) */}
          <ClosingVsUpdatePlaceholder />

          {/* Baris 6: Rekap Pengiriman (placeholder) */}
          <RekapPengirimanPlaceholder />

        </main>
      </div>
    </div>
  );
}
