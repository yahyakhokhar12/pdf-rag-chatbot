'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { X } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell flex h-[100dvh] bg-app overflow-hidden">
      <Sidebar className="hidden lg:flex" />
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-10 h-full w-[min(20rem,88vw)]">
            <button
              aria-label="Close navigation"
              className="absolute right-3 top-3 z-20 grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-black/30 text-slate-200 backdrop-blur transition-all hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
            <Sidebar className="flex shadow-2xl shadow-black/40" onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="app-main flex-1 overflow-y-auto p-3 sm:p-4 md:p-5 lg:p-8 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
