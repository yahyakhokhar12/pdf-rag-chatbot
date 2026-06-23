'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Sparkles, Eye, EyeOff, Lock, Mail, User, AtSign } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

const registerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_-]+$/, 'Only letters, numbers, _, - allowed'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string()
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const calculateStrength = (pass: string): number => {
  if (!pass) return 0;
  let score = 0;
  if (pass.length >= 8) score += 25;
  if (pass.match(/[a-z]/)) score += 25;
  if (pass.match(/[A-Z]/)) score += 25;
  if (pass.match(/[0-9]/) || pass.match(/[^a-zA-Z0-9]/)) score += 25;
  return score;
};

const getStrengthLabel = (score: number) => {
  if (score === 0) return { label: '', color: '' };
  if (score <= 25) return { label: 'Weak', color: '#ef4444' };
  if (score <= 50) return { label: 'Fair', color: '#f97316' };
  if (score <= 75) return { label: 'Good', color: '#eab308' };
  return { label: 'Strong', color: '#22c55e' };
};

export default function RegisterPage() {
  const { register: registerUser, isLoading, error, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const watchPassword = watch('password', '');
  const strength = calculateStrength(watchPassword);
  const { label: strengthLabel, color: strengthColor } = getStrengthLabel(strength);

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      await registerUser({
        email: data.email,
        username: data.username,
        password: data.password,
        full_name: data.full_name,
      });
    } catch {}
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4 py-10"
         style={{ background: '#07060f' }}>
      {/* Animated orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="glow-card rounded-3xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-xl"
                 style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 0 30px rgba(139,92,246,0.4)' }}>
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Create account</h1>
            <p className="text-slate-500 text-sm mt-2">Join PDF AI and start chatting with your documents</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-3.5 rounded-xl flex items-start gap-2.5 text-sm"
                 style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <span className="w-4 h-4 shrink-0 mt-0.5 text-red-400">⚠</span>
              <span className="flex-1 text-red-400">{error}</span>
              <button onClick={clearError} className="text-red-400/60 hover:text-red-400 transition-colors">✕</button>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  {...register('full_name')}
                  type="text"
                  className="w-full input-dark rounded-xl pl-10 pr-4 py-3 text-sm"
                  placeholder="John Doe"
                />
              </div>
              {errors.full_name && <p className="text-xs text-red-400 mt-1.5 ml-1">{errors.full_name.message}</p>}
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Username</label>
              <div className="relative">
                <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  {...register('username')}
                  type="text"
                  className="w-full input-dark rounded-xl pl-10 pr-4 py-3 text-sm"
                  placeholder="johndoe"
                />
              </div>
              {errors.username && <p className="text-xs text-red-400 mt-1.5 ml-1">{errors.username.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  {...register('email')}
                  type="email"
                  className="w-full input-dark rounded-xl pl-10 pr-4 py-3 text-sm"
                  placeholder="name@example.com"
                />
              </div>
              {errors.email && <p className="text-xs text-red-400 mt-1.5 ml-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="w-full input-dark rounded-xl pl-10 pr-10 py-3 text-sm"
                  placeholder="Min. 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Password strength */}
              {watchPassword && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex gap-1">
                    {[25, 50, 75, 100].map(threshold => (
                      <div key={threshold} className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: strength >= threshold ? '100%' : '0%',
                            background: strengthColor
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs ml-0.5" style={{ color: strengthColor }}>{strengthLabel}</p>
                </div>
              )}
              {errors.password && <p className="text-xs text-red-400 mt-1.5 ml-1">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  {...register('confirm_password')}
                  type={showConfirm ? 'text' : 'password'}
                  className="w-full input-dark rounded-xl pl-10 pr-10 py-3 text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirm_password && <p className="text-xs text-red-400 mt-1.5 ml-1">{errors.confirm_password.message}</p>}
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full rounded-xl py-3 text-sm flex items-center justify-center"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create account'}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
