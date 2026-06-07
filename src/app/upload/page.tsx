"use client";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import UploadSection from "@/components/UploadSection";

function PlaceholderUploadCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 opacity-60">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-[13px] font-semibold text-white/70">{title}</h3>
          <p className="text-[11px] text-white/40 mt-0.5">{description}</p>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-400/70 bg-amber-500/10 border border-amber-500/20 rounded-md px-2 py-1">
          Coming Soon
        </span>
      </div>
      <div className="border-2 border-dashed border-white/[0.08] rounded-2xl py-12 flex flex-col items-center justify-center">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20 mb-2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p className="text-[12px] text-white/30">Fitur belum tersedia</p>
      </div>
    </div>
  );
}

export default function UploadDataPage() {
  return (
    <div className="flex h-screen bg-[#080e18] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar title="Upload Data" />
        <main className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white">Upload Data</h1>
            <p className="mt-0.5 text-xs text-white/40">
              Import data DAT Oracle dan LPP Web Tracking untuk monitoring dan rekonsiliasi aset
            </p>
          </div>

          <div>
            <h2 className="text-[12px] font-semibold uppercase tracking-widest text-cyan-400/70 mb-3">
              DAT (Daftar Aktiva Tetap) — Oracle
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <UploadSection />
              <PlaceholderUploadCard
                title="Upload DAT Closing"
                description="Snapshot cut-off bulanan DAT Oracle"
              />
            </div>
          </div>

          <div>
            <h2 className="text-[12px] font-semibold uppercase tracking-widest text-violet-400/70 mb-3">
              LPP Web Tracking
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <PlaceholderUploadCard
                title="Upload LPP Update"
                description="Data pergerakan aset terbaru dari Web Tracking"
              />
              <PlaceholderUploadCard
                title="Upload LPP Closing"
                description="Snapshot cut-off bulanan LPP Web Tracking"
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
