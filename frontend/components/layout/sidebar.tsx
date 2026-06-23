'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { 
  LayoutDashboard, 
  FileText, 
  MessageSquare, 
  Settings, 
  Users,
  LogOut,
  MessageSquarePlus
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { NuxeLogo } from '@/components/brand/nuxe-logo';
import { chatService } from '@/services/chat-service';
import { formatDate } from '@/lib/utils';

type SidebarProps = {
  onNavigate?: () => void;
  className?: string;
};

export function Sidebar({ onNavigate, className = '' }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const isChatRoute = pathname.startsWith('/chat');
  const currentChatId = pathname.startsWith('/chat/') ? pathname.split('/')[2] : null;

  const { data: conversationData } = useQuery({
    queryKey: ['conversations', 'sidebar'],
    queryFn: () => chatService.getConversations(1, 6),
    enabled: Boolean(user),
  });

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/documents', label: 'Files', icon: FileText },
    { href: '/chat', label: 'Chat', icon: MessageSquare },
  ];

  if (user?.role === 'admin') {
    navItems.push({ href: '/admin', label: 'Admin', icon: Users });
  }

  return (
    <div className={`w-full lg:w-72 sidebar-bg flex flex-col h-full shrink-0 ${className}`}>
      {/* Logo */}
      <div className="p-4 sm:p-5 border-b border-white/[0.05]">
        <Link href="/" className="flex items-center gap-3 group">
          <NuxeLogo />
        </Link>
      </div>

      {/* Nav */}
      <div className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto overscroll-contain">
        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2">Navigation</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          
          return (
            <div key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                className={`relative flex items-center gap-3 px-3 py-3 lg:py-2.5 rounded-xl text-sm transition-all duration-200 sidebar-item ${
                  isActive
                    ? 'active text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-gradient-to-br from-teal-300 to-amber-300 text-slate-950 shadow-lg shadow-teal-400/25'
                    : 'bg-slate-800/60 group-hover:bg-slate-700/60'
                }`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                {item.label}
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-300 animate-pulse" />
                )}
              </Link>

              {item.href === '/chat' && isChatRoute && (
                <div className="sidebar-chat-history ml-4 sm:ml-5 mt-2 mb-3 border-l border-white/[0.07] pl-3">
                  <div className="mb-2 flex items-center justify-between gap-2 pr-1">
                    <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-600">History</span>
                    <button
                      type="button"
                      onClick={() => {
                        onNavigate?.();
                        router.push('/chat');
                      }}
                      className="rounded-lg p-1 text-slate-500 transition-all hover:bg-white/5 hover:text-cyan-200"
                      title="New chat"
                    >
                      <MessageSquarePlus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    {conversationData?.conversations?.length ? (
                      conversationData.conversations.map((conversation) => {
                        const isCurrent = currentChatId === conversation.id;
                        return (
                          <Link
                            key={conversation.id}
                            href={`/chat/${conversation.id}`}
                            onClick={onNavigate}
                            className={`sidebar-chat-link block rounded-xl px-3 py-2 transition-all ${
                              isCurrent ? 'is-current text-cyan-100' : 'text-slate-500 hover:text-slate-200'
                            }`}
                          >
                            <span className="block truncate text-xs font-medium">{conversation.title}</span>
                            <span className="mt-0.5 block truncate text-[10px] text-slate-600">
                              {formatDate(conversation.updated_at)} · {conversation.message_count} msgs
                            </span>
                          </Link>
                        );
                      })
                    ) : (
                      <p className="px-3 py-2 text-xs text-slate-600">No chats yet</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* User Info */}
      <div className="p-3 border-t border-white/[0.05]">
        <Link
          href="/settings"
          onClick={onNavigate}
          className={`relative mb-2 flex items-center gap-3 px-3 py-3 lg:py-2.5 rounded-xl text-sm transition-all duration-200 sidebar-item ${
            pathname.startsWith('/settings')
              ? 'active text-white font-medium'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
            pathname.startsWith('/settings')
              ? 'bg-gradient-to-br from-teal-300 to-amber-300 text-slate-950 shadow-lg shadow-teal-400/25'
              : 'bg-slate-800/60'
          }`}>
            <Settings className="w-3.5 h-3.5" />
          </div>
          Settings
          {pathname.startsWith('/settings') && (
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-300 animate-pulse" />
          )}
        </Link>

        <div className="flex items-center gap-3 p-2.5 rounded-xl glass-card-hover mb-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-slate-950 text-xs font-bold shrink-0 shadow"
               style={{ background: 'linear-gradient(135deg, #5eead4, #fbbf24)' }}>
            {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.full_name || 'User'}</p>
            <p className="text-xs text-slate-500 truncate">{user?.role === 'admin' ? 'Administrator' : 'Pro Plan'}</p>
          </div>
        </div>
        <button 
          onClick={() => {
            logout();
            onNavigate?.();
            router.push('/login');
          }}
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
