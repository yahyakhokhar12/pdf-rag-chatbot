'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  MessageSquare, 
  Settings, 
  Users,
  LogOut,
  Sparkles
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/documents', label: 'Documents', icon: FileText },
    { href: '/chat', label: 'Chat', icon: MessageSquare },
  ];

  if (user?.role === 'admin') {
    navItems.push({ href: '/admin', label: 'Admin', icon: Users });
  }

  navItems.push({ href: '/settings', label: 'Settings', icon: Settings });

  return (
    <div className="w-64 sidebar-bg flex flex-col h-full hidden md:flex shrink-0">
      {/* Logo */}
      <div className="p-5 border-b border-white/[0.05]">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl logo-glow flex items-center justify-center shrink-0 overflow-hidden" 
               style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-white text-base tracking-tight block leading-tight">PDF AI</span>
            <span className="text-[10px] text-purple-400/70 font-medium tracking-widest uppercase">RAG Chatbot</span>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <div className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2">Navigation</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 sidebar-item ${
                isActive 
                  ? 'active text-white font-medium' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                isActive 
                  ? 'bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25' 
                  : 'bg-slate-800/60 group-hover:bg-slate-700/60'
              }`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              {item.label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              )}
            </Link>
          );
        })}
      </div>

      {/* User Info */}
      <div className="p-3 border-t border-white/[0.05]">
        <div className="flex items-center gap-3 p-2.5 rounded-xl glass-card-hover mb-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow"
               style={{ background: 'linear-gradient(135deg, #8b5cf6, #4f46e5)' }}>
            {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.full_name || 'User'}</p>
            <p className="text-xs text-slate-500 truncate">{user?.role === 'admin' ? 'Administrator' : 'Pro Plan'}</p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200 border border-transparent hover:border-red-500/10"
        >
          <div className="w-7 h-7 rounded-lg bg-slate-800/60 flex items-center justify-center">
            <LogOut className="w-3.5 h-3.5" />
          </div>
          Sign out
        </button>
      </div>
    </div>
  );
}
