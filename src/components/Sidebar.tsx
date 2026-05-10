"use client";

import { useState } from "react";

type NavItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
};

const icons = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  upload: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  monitor: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  classification: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16M4 10h16M4 14h10M4 18h6" />
    </svg>
  ),
  reports: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
};

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: icons.dashboard, href: "#" },
  { id: "upload", label: "Upload DAT", icon: icons.upload, href: "#" },
  { id: "monitoring", label: "Monitoring", icon: icons.monitor, href: "#" },
  { id: "classification", label: "Classification", icon: icons.classification, href: "#" },
  { id: "reports", label: "Reports", icon: icons.reports, href: "#" },
  { id: "settings", label: "Settings", icon: icons.settings, href: "#" },
];

export default function Sidebar() {
  const [active, setActive] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`
        relative flex flex-col h-screen bg-[#0d1117] border-r border-white/[0.06]
        transition-all duration-300 ease-in-out
        ${collapsed ? "w-[68px]" : "w-[230px]"}
      `}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/[0.06]">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          </svg>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-white text-[13px] font-semibold tracking-wide leading-none">SmartWMS</p>
            <p className="text-slate-500 text-[10px] mt-0.5 tracking-widest uppercase">Warehouse</p>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[72px] w-6 h-6 rounded-full bg-[#1a2030] border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/20 transition-all z-10"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          {collapsed
            ? <polyline points="9 18 15 12 9 6" />
            : <polyline points="15 18 9 12 15 6" />}
        </svg>
      </button>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-4 space-y-0.5 overflow-y-auto">
        {!collapsed && (
          <p className="text-[10px] text-slate-600 uppercase tracking-widest font-medium px-3 pb-2">Main Menu</p>
        )}
        {navItems.slice(0, 4).map((item) => (
          <NavLink key={item.id} item={item} active={active} collapsed={collapsed} onClick={() => setActive(item.id)} />
        ))}

        {!collapsed && (
          <p className="text-[10px] text-slate-600 uppercase tracking-widest font-medium px-3 pt-4 pb-2">System</p>
        )}
        {collapsed && <div className="h-2" />}
        {navItems.slice(4).map((item) => (
          <NavLink key={item.id} item={item} active={active} collapsed={collapsed} onClick={() => setActive(item.id)} />
        ))}
      </nav>

      {/* Footer */}
      <div className={`p-3 border-t border-white/[0.06] ${collapsed ? "flex justify-center" : ""}`}>
        {collapsed ? (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white text-xs font-bold">A</div>
        ) : (
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-purple-500/20">A</div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-[12px] font-medium truncate">Admin User</p>
              <p className="text-slate-500 text-[10px] truncate">admin@wms.id</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-600 flex-shrink-0">
              <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
            </svg>
          </div>
        )}
      </div>
    </aside>
  );
}

function NavLink({ item, active, collapsed, onClick }: { item: NavItem; active: string; collapsed: boolean; onClick: () => void }) {
  const isActive = active === item.id;
  return (
    <button
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 group relative
        ${isActive
          ? "bg-gradient-to-r from-cyan-500/15 to-blue-500/10 text-cyan-400 shadow-sm"
          : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.04]"
        }
        ${collapsed ? "justify-center" : ""}
      `}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-cyan-400 rounded-r-full" />
      )}
      <span className={`flex-shrink-0 transition-colors ${isActive ? "text-cyan-400" : "text-slate-600 group-hover:text-slate-300"}`}>
        {item.icon}
      </span>
      {!collapsed && <span className="truncate">{item.label}</span>}
      {!collapsed && isActive && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
      )}
    </button>
  );
}
