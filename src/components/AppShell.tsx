"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Layers,
  CalendarRange,
  LayoutDashboard,
  Menu,
  X,
  PlusCircle,
  ChevronRight,
} from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
  activeTab?: "resources" | "reservations";
  actionButton?: React.ReactNode;
}

export default function AppShell({
  children,
  activeTab,
  actionButton,
}: AppShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentTab = activeTab || (pathname === "/reservations" ? "reservations" : "resources");

  const navigation = [
    {
      name: "Dashboard & Resources",
      href: "/",
      icon: LayoutDashboard,
      active: currentTab === "resources",
    },
    {
      name: "Reservations",
      href: "/reservations",
      icon: CalendarRange,
      active: currentTab === "reservations",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8faff] text-[#0b1528] flex flex-col lg:flex-row">
      {/* Rich Elegant Navy Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-30 bg-[#0a1120] border-r border-[#15233c] shadow-xl shadow-slate-950/15">
        {/* Brand Header */}
        <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-[#172540]">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/30 transition group-hover:bg-blue-500">
              <Layers className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-white leading-none">
                ResourceHub
              </span>
              <span className="text-[11px] font-medium text-slate-400 mt-1">
                Asset Reservation
              </span>
            </div>
          </Link>
        </div>

        {/* Sidebar Navigation */}
        <div className="flex flex-1 flex-col justify-between overflow-y-auto px-4 py-6">
          <div>
            <p className="px-3 text-[11px] font-semibold tracking-wider uppercase text-slate-400">
              Navigation
            </p>
            <nav className="mt-3 space-y-1.5">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                      item.active
                        ? "bg-blue-600 text-white font-semibold shadow-sm shadow-blue-600/30"
                        : "text-slate-300 hover:bg-[#131f37] hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`h-4.5 w-4.5 shrink-0 transition ${
                          item.active
                            ? "text-white"
                            : "text-slate-400 group-hover:text-slate-200"
                        }`}
                      />
                      <span>{item.name}</span>
                    </div>
                    {item.active && (
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </aside>

      {/* Main Content Layout */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-indigo-100/70 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8 shadow-2xs">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden -ml-1 rounded-xl p-2 text-slate-700 hover:bg-indigo-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>

            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/"
                className="font-medium text-slate-500 hover:text-blue-600 transition flex items-center gap-1.5"
              >
                <span>ResourceHub</span>
              </Link>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="font-semibold text-slate-900 capitalize truncate">
                {currentTab === "reservations" ? "Reservations" : "Dashboard"}
              </span>
            </nav>
          </div>

          {/* Top Bar Actions */}
          <div className="flex items-center gap-3">
            {actionButton ? (
              actionButton
            ) : currentTab === "resources" ? (
              <Link
                href="/reservations"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 sm:px-4 sm:text-sm"
              >
                <CalendarRange className="h-4 w-4" />
                <span className="hidden sm:inline">View Reservations</span>
                <span className="sm:hidden">Reservations</span>
              </Link>
            ) : (
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-200/80 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-indigo-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 sm:px-4 sm:text-sm"
              >
                <PlusCircle className="h-4 w-4 text-blue-600" />
                <span className="hidden sm:inline">Resource Catalog</span>
                <span className="sm:hidden">Catalog</span>
              </Link>
            )}
          </div>
        </header>

        {/* Mobile Slide-down Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-indigo-100 bg-[#0a1120] px-4 py-4 shadow-lg sm:px-6">
            <nav className="space-y-1.5">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-medium transition ${
                      item.active
                        ? "bg-blue-600 text-white font-semibold"
                        : "text-slate-300 hover:bg-[#131f37] hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`h-5 w-5 ${
                          item.active ? "text-white" : "text-slate-400"
                        }`}
                      />
                      <span>{item.name}</span>
                    </div>
                    {item.active && (
                      <span className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        {/* Page Content Body */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </main>

        {/* Clean Application Footer */}
        <footer className="border-t border-indigo-100/70 bg-white py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">ResourceHub</span>
              <span>— Modern Resource Reservation Platform</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <span>Next.js 16</span>
              <span>•</span>
              <span>PostgreSQL</span>
              <span>•</span>
              <span>Tailwind CSS</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}