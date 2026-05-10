"use client";

import { useState } from "react";

type Asset = {
  id: string;
  kodeAsset: string;
  deskripsi: string;
  jenis: string;
  lokasi: string;
  status: "Active" | "Inactive" | "Maintenance" | "Unclassified";
  updatedAt: string;
};

const DUMMY_DATA: Asset[] = [
  { id: "1", kodeAsset: "AST-2024-001", deskripsi: "HP LaserJet Pro MFP M428fdn", jenis: "Printer", lokasi: "Gudang A - Lantai 1", status: "Active", updatedAt: "10 Mei 2025" },
  { id: "2", kodeAsset: "AST-2024-002", deskripsi: 'Dell UltraSharp U2722D 27"', jenis: "Monitor", lokasi: "Ruang Server", status: "Active", updatedAt: "09 Mei 2025" },
  { id: "3", kodeAsset: "AST-2024-003", deskripsi: "Brother HL-L2350DW Printer", jenis: "Printer", lokasi: "Gudang B - Lantai 2", status: "Maintenance", updatedAt: "08 Mei 2025" },
  { id: "4", kodeAsset: "AST-2024-004", deskripsi: "Acer Nitro VG240Y Monitor", jenis: "Monitor", lokasi: "Ruang Admin", status: "Active", updatedAt: "08 Mei 2025" },
  { id: "5", kodeAsset: "AST-2024-005", deskripsi: "Epson EcoTank L3250 Printer", jenis: "Printer", lokasi: "Gudang C - Lantai 1", status: "Inactive", updatedAt: "07 Mei 2025" },
  { id: "6", kodeAsset: "AST-2024-006", deskripsi: "LG 24MK430H Monitor 23.8\"", jenis: "Monitor", lokasi: "Gudang A - Lantai 2", status: "Active", updatedAt: "07 Mei 2025" },
  { id: "7", kodeAsset: "AST-2024-007", deskripsi: "Unknown Device #XF-882", jenis: "-", lokasi: "Tidak Diketahui", status: "Unclassified", updatedAt: "06 Mei 2025" },
  { id: "8", kodeAsset: "AST-2024-008", deskripsi: "Canon PIXMA G2020 Printer", jenis: "Printer", lokasi: "Gudang B - Lantai 1", status: "Active", updatedAt: "05 Mei 2025" },
];

const statusStyle: Record<Asset["status"], { label: string; classes: string }> = {
  Active: { label: "Aktif", classes: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  Inactive: { label: "Nonaktif", classes: "text-slate-400 bg-slate-400/10 border-slate-400/20" },
  Maintenance: { label: "Maintenance", classes: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  Unclassified: { label: "Unclassified", classes: "text-rose-400 bg-rose-400/10 border-rose-400/20" },
};

const jenisIcon: Record<string, React.ReactNode> = {
  Printer: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  ),
  Monitor: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
};

export default function RecentActivityTable() {
  const [filter, setFilter] = useState<Asset["status"] | "All">("All");

  const filtered = filter === "All" ? DUMMY_DATA : DUMMY_DATA.filter(a => a.status === filter);

  return (
    <div className="bg-[#111827] border border-white/[0.06] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-white/[0.06]">
        <div>
          <h3 className="text-white text-[14px] font-semibold">Aktivitas Terkini</h3>
          <p className="text-slate-500 text-[11px] mt-0.5">{DUMMY_DATA.length} aset terdaftar</p>
        </div>
        {/* Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(["All", "Active", "Maintenance", "Inactive", "Unclassified"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[11px] px-3 py-1 rounded-lg font-medium transition-all ${
                filter === f
                  ? "bg-white/10 text-white border border-white/20"
                  : "text-slate-500 hover:text-slate-300 border border-transparent"
              }`}
            >
              {f === "All" ? "Semua" : f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-white/[0.04]">
              {["Kode Asset", "Deskripsi", "Jenis", "Lokasi", "Status", "Diperbarui"].map(h => (
                <th key={h} className="text-left text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-5 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((asset, i) => (
              <tr
                key={asset.id}
                className={`border-b border-white/[0.03] hover:bg-white/[0.025] transition-colors group ${
                  i === filtered.length - 1 ? "border-transparent" : ""
                }`}
              >
                <td className="px-5 py-3.5">
                  <span className="text-cyan-400 text-[12px] font-mono font-medium">{asset.kodeAsset}</span>
                </td>
                <td className="px-5 py-3.5">
                  <p className="text-slate-200 text-[12px] font-medium truncate max-w-[200px]">{asset.deskripsi}</p>
                </td>
                <td className="px-5 py-3.5">
                  {asset.jenis !== "-" ? (
                    <div className="flex items-center gap-1.5 text-slate-400 text-[12px]">
                      <span className="text-slate-600">{jenisIcon[asset.jenis]}</span>
                      {asset.jenis}
                    </div>
                  ) : (
                    <span className="text-slate-700 text-[12px]">—</span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-slate-500 text-[11px]">{asset.lokasi}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-lg border ${statusStyle[asset.status].classes}`}>
                    {statusStyle[asset.status].label}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-slate-600 text-[11px]">{asset.updatedAt}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.04]">
        <p className="text-slate-600 text-[11px]">Menampilkan {filtered.length} dari {DUMMY_DATA.length} aset</p>
        <button className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-cyan-400 transition-colors font-medium">
          Lihat Semua
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </div>
  );
}
