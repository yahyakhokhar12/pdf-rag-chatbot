'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Menu, X } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell flex h-screen bg-app overflow-hidden">
      <Sidebar className="hidden md:flex" />
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-10 h-full w-72 max-w-[82vw]">
            <Sidebar className="flex shadow-2xl shadow-black/40" onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <button
          aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed left-4 top-4 z-30 md:hidden grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-slate-950/80 text-slate-200 shadow-lg backdrop-blur"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <Header />
        <main className="app-main flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
