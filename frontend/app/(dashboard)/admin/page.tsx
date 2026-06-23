'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Users, Database, Activity, Search, Loader2 } from 'lucide-react';
import { adminService } from '@/services/admin-service';
import { useAuthStore } from '@/store/auth-store';
import { formatBytes } from '@/lib/utils';

export default function AdminPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  // Fix: use useEffect for redirect, not during render
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: () => adminService.getAnalytics(),
    enabled: user?.role === 'admin',
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'users', search],
    queryFn: () => adminService.getUsers(1, 20, search),
    enabled: user?.role === 'admin',
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => adminService.updateUser(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
  });

  if (!user) return null;
  if (user.role !== 'admin') return null;

  const statCards = [
    {
      title: 'Total Users',
      value: analytics?.users?.total || 0,
      icon: Users,
      gradient: 'from-blue-500 to-indigo-600',
      glow: 'rgba(99, 102, 241, 0.3)',
      bg: 'rgba(99, 102, 241, 0.08)',
      border: 'rgba(99, 102, 241, 0.15)',
    },
    {
      title: 'Total Documents',
      value: analytics?.documents?.total || 0,
      icon: Database,
      gradient: 'from-violet-500 to-purple-600',
      glow: 'rgba(139, 92, 246, 0.3)',
      bg: 'rgba(139, 92, 246, 0.08)',
      border: 'rgba(139, 92, 246, 0.15)',
    },
    {
      title: 'Storage Used',
      value: formatBytes(analytics?.storage?.total_used_bytes || 0),
      icon: Activity,
      gradient: 'from-emerald-500 to-teal-600',
      glow: 'rgba(16, 185, 129, 0.3)',
      bg: 'rgba(16, 185, 129, 0.08)',
      border: 'rgba(16, 185, 129, 0.15)',
    },
    {
      title: 'Vector Points',
      value: analytics?.vectors?.vectors_count?.toLocaleString() || 0,
      icon: Shield,
      gradient: 'from-amber-500 to-orange-600',
      glow: 'rgba(245, 158, 11, 0.3)',
      bg: 'rgba(245, 158, 11, 0.08)',
      border: 'rgba(245, 158, 11, 0.15)',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Admin Dashboard</h1>
        <p className="text-slate-500 mt-1 text-sm">System overview and user management.</p>
      </div>

      {/* Stat cards */}
      {analyticsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div key={i} className="stat-card relative rounded-2xl p-5 group cursor-default">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-2">{card.title}</p>
                    <p className="text-2xl font-bold text-white">{card.value}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                       style={{ background: card.bg, border: `1px solid ${card.border}` }}>
                    <Icon className="w-5 h-5" style={{ color: 'white', opacity: 0.9 }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Users table */}
      <div className="rounded-2xl overflow-hidden"
           style={{ background: 'rgba(12, 10, 28, 0.6)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
        <div className="p-4 flex items-center justify-between gap-4"
             style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 className="font-semibold text-slate-200 text-sm shrink-0">Users</h2>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-sm text-slate-300 placeholder-slate-600 pl-8 pr-3 py-2 rounded-xl focus:outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
            />
          </div>
        </div>

        {usersLoading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#8b5cf6' }} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left data-table">
              <thead>
                <tr className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <th className="p-4 pl-6">User</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {usersData?.users?.map((u: any) => (
                  <tr key={u.id} className="group transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                             style={{ background: 'linear-gradient(135deg, #8b5cf6, #4f46e5)' }}>
                          {u.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-200">{u.full_name}</p>
                          <p className="text-xs text-slate-600">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-500">{u.email}</td>
                    <td className="p-4">
                      <select
                        value={u.role}
                        onChange={(e) => updateUserMutation.mutate({ id: u.id, data: { role: e.target.value } })}
                        className="text-xs rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer transition-all"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.07)',
                          color: '#94a3b8',
                        }}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => updateUserMutation.mutate({ id: u.id, data: { is_active: !u.is_active } })}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                          u.is_active ? 'badge-ready' : 'badge-error'
                        }`}
                      >
                        {u.is_active ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
