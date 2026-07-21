"use client";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import DashboardWarningCards from "@/components/dashboard/DashboardWarningCards";
import CGASummaryCards from "@/components/dashboard/CGASummaryCards";
import RekapPengirimanCards from "@/components/dashboard/RekapPengirimanCards";
import DATvsLPPCards from "@/components/dashboard/DATvsLPPCards";
import TrendCGACards from "@/components/dashboard/TrendCGACards";
import { useDashboardStats } from "@/hooks/useDashboardStats";

export default function DashboardPage() {
  const { data, loading } = useDashboardStats();

  return (
    <div className="flex h-screen bg-[#080e18] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar title="Dashboard" />

        <main className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Baris 1: Perlu Tindakan (1/3) + DAT vs LPP (2/3) — tinggi seragam */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
            <div className="lg:col-span-1 flex flex-col">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-2">Perlu Tindakan</p>
              <div className="flex-1">
                <DashboardWarningCards
                  warnings={(data as any)?.warnings ?? null}
                  loading={loading}
                />
              </div>
            </div>
            <div className="lg:col-span-2 flex flex-col">
              <div className="flex-1">
                <DATvsLPPCards />
              </div>
            </div>
          </div>

          {/* Baris 2: Trend CGA (2/3) + Ringkasan per Gudang (1/3) — tinggi seragam */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
            <div className="lg:col-span-2 flex flex-col">
              <TrendCGACards />
            </div>
            <div className="lg:col-span-1 flex flex-col">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-2">Ringkasan Aset per Gudang</p>
              <div className="flex-1">
                <CGASummaryCards breakdown={data?.breakdown ?? []} loading={loading} />
              </div>
            </div>
          </div>

          {/* Baris 3: Rekap Pengiriman (LIVE) */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-2">Rekap Pengiriman dari Gudang ke Toko</p>
            <RekapPengirimanCards
              data={(data as any)?.rekapPengiriman ?? null}
              loading={loading}
            />
          </div>

        </main>
      </div>
    </div>
  );
}
