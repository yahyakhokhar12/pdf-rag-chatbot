'use client';

import { Bell, Menu } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { usePathname } from 'next/navigation';
import { NuxeLogo } from '@/components/brand/nuxe-logo';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/documents': 'Files',
  '/chat': 'Chat',
  '/admin': 'Admin',
  '/settings': 'Settings',
};

type HeaderProps = {
  onMenuClick?: () => void;
};

export function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuthStore();
  const pathname = usePathname();

  const title = Object.entries(PAGE_TITLES).find(([key]) =>
    key === '/' ? pathname === '/' : pathname.startsWith(key)
  )?.[1] || 'Dashboard';

  return (
    <header className="h-14 flex items-center justify-between gap-3 px-3 sm:px-5 sticky top-0 z-10 shrink-0"
      style={{
        background: 'linear-gradient(90deg, rgba(3, 8, 10, 0.9), rgba(7, 6, 17, 0.86))',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.04)'
      }}>
      
      <div className="flex min-w-0 items-center gap-3 lg:hidden">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={onMenuClick}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-200 shadow-lg backdrop-blur transition-all hover:border-cyan-300/30 hover:text-cyan-100"
        >
          <Menu className="h-5 w-5" />
        </button>
        <NuxeLogo size="sm" />
      </div>

      {/* Desktop page title */}
      <div className="hidden lg:flex items-center gap-3">
        <span className="text-slate-600 text-sm">/</span>
        <h1 className="text-sm font-semibold text-white">{title}</h1>
      </div>

      {/* Right side actions */}
      <div className="flex min-w-0 items-center gap-2 ml-auto">
        {/* Notification */}
        <button className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-teal-300 rounded-full animate-pulse-glow" />
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-3 pl-3 border-l border-white/[0.05]">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-white leading-tight">{user?.full_name}</p>
            <p className="text-[11px] text-slate-500">{user?.role === 'admin' ? 'Admin' : 'Pro Plan'}</p>
          </div>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-slate-950 font-bold text-sm shadow-md ring-2 ring-teal-300/20"
               style={{ background: 'linear-gradient(135deg, #5eead4, #fbbf24)' }}>
            {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}
