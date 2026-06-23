'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { formatBytes } from '@/lib/utils';
import { User, Mail, HardDrive, Key, ShieldCheck, CheckCircle2 } from 'lucide-react';

type Tab = 'profile' | 'security' | 'storage';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [saved, setSaved] = useState(false);

  const storagePercent = Math.round(((user?.storage_used || 0) / (user?.storage_limit || 1)) * 100);
  const tabs = [
    { id: 'profile' as Tab, label: 'Profile', icon: User },
    { id: 'security' as Tab, label: 'Security', icon: Key },
    { id: 'storage' as Tab, label: 'Storage', icon: HardDrive },
  ];

  const handleSave = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-300/80">Workspace</p>
          <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>
          <p className="mt-1 text-sm text-slate-500">Manage profile details, security status, and storage usage.</p>
        </div>
        {saved && (
          <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            Preferences saved
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[240px_1fr]">
        <div className="glass-card rounded-2xl p-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-all ${
                  selected ? 'bg-teal-400/10 text-teal-200 ring-1 ring-teal-300/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="glass-card rounded-2xl p-5 sm:p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-teal-400 to-amber-400 text-3xl font-bold text-slate-950 shadow-lg shadow-teal-500/20">
                  {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Profile information</h2>
                  <p className="mt-1 text-sm text-slate-500">Avatar upload is coming soon. Your account details are shown below.</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-slate-300">Full Name</span>
                  <input className="input-dark w-full rounded-xl px-4 py-3 text-sm" defaultValue={user?.full_name || ''} />
                </label>
                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-slate-300">Username</span>
                  <input className="input-dark w-full rounded-xl px-4 py-3 text-sm" defaultValue={user?.username || ''} />
                </label>
              </div>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-300">Email Address</span>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input className="input-dark w-full cursor-not-allowed rounded-xl py-3 pl-10 pr-4 text-sm text-slate-400" disabled defaultValue={user?.email || ''} />
                </div>
              </label>

              <div className="flex justify-end">
                <button onClick={handleSave} className="btn-primary rounded-xl px-5 py-3 text-sm">Save Changes</button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-white">Security</h2>
                <p className="mt-1 text-sm text-slate-500">Review account status and authentication protection.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <ShieldCheck className="mb-3 h-5 w-5 text-emerald-300" />
                  <p className="text-sm font-semibold text-white">Account Status</p>
                  <p className="mt-1 text-sm text-slate-500">{user?.is_active ? 'Active and ready to use.' : 'Disabled by an administrator.'}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <Key className="mb-3 h-5 w-5 text-amber-300" />
                  <p className="text-sm font-semibold text-white">Password</p>
                  <p className="mt-1 text-sm text-slate-500">Use the forgot password flow to rotate credentials.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'storage' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-white">Storage Usage</h2>
                <p className="mt-1 text-sm text-slate-500">Track uploaded PDFs and workspace capacity.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="mb-3 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-3xl font-bold text-white">{formatBytes(user?.storage_used || 0)}</p>
                    <p className="text-sm text-slate-500">used of {formatBytes(user?.storage_limit || 0)}</p>
                  </div>
                  <span className="rounded-lg border border-teal-300/20 bg-teal-300/10 px-2.5 py-1 text-sm font-semibold text-teal-200">
                    {storagePercent}% Used
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-400 to-amber-300 transition-all"
                    style={{ width: `${Math.min(100, storagePercent)}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
