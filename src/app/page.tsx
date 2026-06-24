"use client";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import DashboardWarningCards from "@/components/dashboard/DashboardWarningCards";
import CGASummaryCards from "@/components/dashboard/CGASummaryCards";
import RekapPengirimanCards from "@/components/dashboard/RekapPengirimanCards";
import DATvsLPPCards from "@/components/dashboard/DATvsLPPCards";
import TrendCGACards from "@/components/dashboard/TrendCGACards";
import {
  ClosingVsUpdatePlaceholder,
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

          {/* Warning penting (pengganti welcome banner) */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-2">Perlu Tindakan</p>
            <DashboardWarningCards
              warnings={(data as any)?.warnings ?? null}
              loading={loading}
            />
          </div>

          {/* Baris 2: DAT vs LPP Comparison (LIVE) */}
          <DATvsLPPCards />

          {/* Baris 3: Trend Closing (LIVE) */}
          <TrendCGACards />

          {/* Baris 4: CGA Summary (LIVE) */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-2">Ringkasan Aset per Gudang</p>
            <CGASummaryCards breakdown={data?.breakdown ?? []} loading={loading} />
          </div>

          {/* Baris 5: Closing vs Update (placeholder) */}
          <ClosingVsUpdatePlaceholder />

          {/* Baris 6: Rekap Pengiriman (LIVE) */}
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
