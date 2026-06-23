'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { FileText, MessageSquare, HardDrive, Zap, ArrowRight, Clock, Sparkles, TrendingUp } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { formatBytes } from '@/lib/utils';
import { documentService } from '@/services/document-service';
import { useState } from 'react';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ documents: 0, storage: 0, loading: true });

  useEffect(() => {
    documentService.getDocuments(1, 1).then(res => {
      setStats({ documents: res.total, storage: user?.storage_used || 0, loading: false });
    }).catch(() => setStats(s => ({ ...s, loading: false })));
  }, [user]);

  const storagePercent = Math.min(100, Math.round((stats.storage / (user?.storage_limit || 1)) * 100));

  const cards = [
    {
      title: 'Total Documents',
      value: stats.documents,
      icon: FileText,
      gradient: 'from-blue-500 to-indigo-600',
      bg: 'rgba(99, 102, 241, 0.08)',
      border: 'rgba(99, 102, 241, 0.15)',
      change: '+2 this week',
    },
    {
      title: 'Storage Used',
      value: formatBytes(stats.storage),
      icon: HardDrive,
      gradient: 'from-violet-500 to-purple-600',
      bg: 'rgba(139, 92, 246, 0.08)',
      border: 'rgba(139, 92, 246, 0.15)',
      change: `${storagePercent}% capacity`,
    },
    {
      title: 'Active Chats',
      value: '3',
      icon: MessageSquare,
      gradient: 'from-emerald-500 to-teal-600',
      bg: 'rgba(16, 185, 129, 0.08)',
      border: 'rgba(16, 185, 129, 0.15)',
      change: '1 today',
    },
    {
      title: 'Tokens Saved',
      value: '124k',
      icon: Zap,
      gradient: 'from-amber-500 to-orange-600',
      bg: 'rgba(245, 158, 11, 0.08)',
      border: 'rgba(245, 158, 11, 0.15)',
      change: 'RAG efficiency',
    },
  ];

  const recentActivity = [
    { icon: MessageSquare, color: 'text-violet-400', bg: 'rgba(139,92,246,0.1)', title: 'New chat created', desc: 'Discussing Q3 Financial Report', time: '2h ago' },
    { icon: FileText, color: 'text-blue-400', bg: 'rgba(99,102,241,0.1)', title: 'Document uploaded', desc: 'Employee_Handbook_2024.pdf', time: '4h ago' },
    { icon: Sparkles, color: 'text-amber-400', bg: 'rgba(245,158,11,0.1)', title: 'AI query answered', desc: 'Contract comparison analysis', time: '6h ago' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Welcome header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-600 mb-1">Good morning 👋</p>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Welcome back, <span className="text-gradient">{user?.full_name?.split(' ')[0]}</span>
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Here's what's happening in your workspace.</p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-600 px-3 py-2 rounded-xl"
             style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          <span>All systems operational</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="stat-card relative rounded-2xl p-5 group"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                     style={{ background: card.bg, border: `1px solid ${card.border}` }}>
                  <Icon className="w-5 h-5 text-white opacity-90" />
                </div>
              </div>
              <p className="text-xs font-medium text-slate-500 mb-1">{card.title}</p>
              <p className="text-2xl font-bold text-white mb-1.5">
                {stats.loading && typeof card.value === 'number' ? (
                  <span className="shimmer inline-block w-12 h-7 rounded" />
                ) : card.value}
              </p>
              <p className="text-xs text-slate-600">{card.change}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Activity */}
        <div className="lg:col-span-2 rounded-2xl p-6"
             style={{ background: 'rgba(12, 10, 28, 0.6)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-slate-200">Recent Activity</h2>
            <button className="text-xs text-violet-400 hover:text-violet-300 transition-colors">View all</button>
          </div>
          <div className="space-y-1">
            {recentActivity.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i}
                     className="flex gap-3 items-start p-3 rounded-xl transition-all"
                     style={{ borderBottom: i < recentActivity.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                       style={{ background: item.bg }}>
                    <Icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200">{item.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{item.desc}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-600 shrink-0">
                    <Clock className="w-3 h-3" />
                    {item.time}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl p-6 flex flex-col"
             style={{ background: 'rgba(12, 10, 28, 0.6)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
          <h2 className="font-semibold text-slate-200 mb-1">Quick Actions</h2>
          <p className="text-xs text-slate-600 mb-5">Jump into a workflow</p>

          <div className="space-y-2.5 flex-1">
            <Link
              href="/documents"
              className="flex items-center justify-between p-4 rounded-xl transition-all group"
              style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)' }}
              onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; }}
              onMouseLeave={(e: any) => { e.currentTarget.style.background = 'rgba(99,102,241,0.06)'; }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                     style={{ background: 'rgba(99,102,241,0.15)' }}>
                  <FileText className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">Upload PDF</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              href="/chat"
              className="flex items-center justify-between p-4 rounded-xl transition-all group"
              style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)' }}
              onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(139,92,246,0.1)'; }}
              onMouseLeave={(e: any) => { e.currentTarget.style.background = 'rgba(139,92,246,0.06)'; }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                     style={{ background: 'rgba(139,92,246,0.15)' }}>
                  <MessageSquare className="w-4 h-4 text-violet-400" />
                </div>
                <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">New Chat</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>

          {/* Storage bar */}
          <div className="mt-5 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-500">Storage</span>
              <span className="text-xs font-semibold text-violet-400">{storagePercent}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${storagePercent}%`,
                  background: 'linear-gradient(90deg, #8b5cf6, #6366f1)'
                }}
              />
            </div>
            <p className="text-xs text-slate-600 mt-1.5">
              {formatBytes(stats.storage)} of {formatBytes(user?.storage_limit || 0)} used
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
