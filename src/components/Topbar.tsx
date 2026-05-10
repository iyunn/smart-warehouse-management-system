"use client";

import { useState } from "react";

export default function Topbar({ title }: { title: string }) {
  const [search, setSearch] = useState("");

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-white/[0.06] bg-[#0d1117]/80 backdrop-blur-md sticky top-0 z-20">
      {/* Title */}
      <div>
        <h1 className="text-white text-[16px] font-semibold tracking-tight leading-none">{title}</h1>
        <p className="text-slate-500 text-[11px] mt-0.5">
          {new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden sm:block">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search asset..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white/[0.04] border border-white/[0.08] text-slate-300 text-[13px] placeholder:text-slate-600 rounded-xl pl-9 pr-4 py-2 w-52 focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.06] transition-all"
          />
        </div>

        {/* Notif */}
        <button className="relative w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-500 hover:text-white hover:border-white/20 transition-all">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-cyan-400 rounded-full border-2 border-[#0d1117]" />
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-2 pl-1 cursor-pointer group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white text-[13px] font-bold shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-shadow">
            A
          </div>
          <div className="hidden md:block">
            <p className="text-white text-[12px] font-medium leading-none">Admin</p>
            <p className="text-slate-500 text-[10px] mt-0.5">Super Admin</p>
          </div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-600 hidden md:block">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
    </header>
  );
}
