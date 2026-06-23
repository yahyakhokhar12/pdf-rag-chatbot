'use client';

import { useAuthStore } from '@/store/auth-store';
import { formatBytes } from '@/lib/utils';
import { User, Mail, HardDrive, Key, Shield } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuthStore();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-slate-400 mt-1">Manage your account preferences and view usage.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-2">
          <button className="w-full text-left px-4 py-2.5 bg-primary/10 text-primary font-medium rounded-lg flex items-center gap-3 border border-primary/20">
            <User className="w-4 h-4" /> Profile
          </button>
          <button className="w-full text-left px-4 py-2.5 text-slate-400 hover:bg-slate-800/50 hover:text-white rounded-lg flex items-center gap-3 transition-colors">
            <Key className="w-4 h-4" /> Security
          </button>
          <button className="w-full text-left px-4 py-2.5 text-slate-400 hover:bg-slate-800/50 hover:text-white rounded-lg flex items-center gap-3 transition-colors">
            <HardDrive className="w-4 h-4" /> Storage & Limits
          </button>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="glass-card rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Profile Information</h2>
            
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <div>
                <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors border border-slate-700">
                  Change Avatar
                </button>
                <p className="text-xs text-slate-500 mt-2">JPG, GIF or PNG. Max size of 2MB.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                  <input type="text" defaultValue={user?.full_name} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
                  <input type="text" defaultValue={user?.username} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary/50" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="email" disabled defaultValue={user?.email} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-slate-400 cursor-not-allowed" />
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <button className="px-4 py-2 bg-primary hover:bg-primary-600 text-white rounded-lg font-medium transition-colors">
                  Save Changes
                </button>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Storage Usage</h2>
            
            <div className="mb-4">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-3xl font-bold text-white">{formatBytes(user?.storage_used || 0)}</p>
                  <p className="text-sm text-slate-400">used of {formatBytes(user?.storage_limit || 0)}</p>
                </div>
                <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-1 rounded-md">
                  {Math.round(((user?.storage_used || 0) / (user?.storage_limit || 1)) * 100)}% Used
                </span>
              </div>
              <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full" 
                  style={{ width: `${Math.min(100, ((user?.storage_used || 0) / (user?.storage_limit || 1)) * 100)}%` }}
                ></div>
              </div>
            </div>
            
            <p className="text-sm text-slate-400">
              Need more storage? <a href="#" className="text-primary hover:text-primary-400">Upgrade to Pro</a> for 50GB storage and unlimited messages.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
