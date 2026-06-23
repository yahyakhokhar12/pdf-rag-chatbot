'use client';

import { Bell, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { usePathname } from 'next/navigation';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/documents': 'Documents',
  '/chat': 'Chat',
  '/admin': 'Admin',
  '/settings': 'Settings',
};

export function Header() {
  const { user } = useAuthStore();
  const pathname = usePathname();

  const title = Object.entries(PAGE_TITLES).find(([key]) =>
    key === '/' ? pathname === '/' : pathname.startsWith(key)
  )?.[1] || 'Dashboard';

  return (
    <header className="h-14 flex items-center justify-between px-5 sticky top-0 z-10 shrink-0"
      style={{
        background: 'rgba(7, 6, 17, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.04)'
      }}>
      
      <div className="flex items-center gap-3 md:hidden">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg logo-glow flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-sm">PDF AI</span>
        </div>
      </div>

      {/* Desktop page title */}
      <div className="hidden md:flex items-center gap-3">
        <span className="text-slate-600 text-sm">/</span>
        <h1 className="text-sm font-semibold text-white">{title}</h1>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Notification */}
        <button className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse-glow" />
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-3 pl-3 border-l border-white/[0.05]">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-white leading-tight">{user?.full_name}</p>
            <p className="text-[11px] text-slate-500">{user?.role === 'admin' ? 'Admin' : 'Pro Plan'}</p>
          </div>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-violet-500/20"
               style={{ background: 'linear-gradient(135deg, #8b5cf6, #4f46e5)' }}>
            {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}
