'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowRight, AtSign, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck, User, type LucideIcon } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { NuxeLogo } from '@/components/brand/nuxe-logo';

const registerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_-]+$/, 'Only letters, numbers, _, - allowed'),
  email: z.string().email('Please enter a valid email'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one digit'),
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
  if (/[a-z]/.test(pass)) score += 25;
  if (/[A-Z]/.test(pass)) score += 25;
  if (/[0-9]/.test(pass) || /[^a-zA-Z0-9]/.test(pass)) score += 25;
  return score;
};

export default function RegisterPage() {
  const { register: registerUser, isLoading, error, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const strength = calculateStrength(watch('password', ''));

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
    <main className="auth-stage min-h-screen overflow-hidden px-4 py-8">
      <div className="auth-mesh" />
      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="hidden lg:block auth-copy order-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            Private workspace
          </div>
          <h1 className="mt-6 max-w-2xl text-5xl font-black leading-[1.02] tracking-tight text-white">
            Create your nuxeAI document brain.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-400">
            Register once, upload documents, and let the assistant keep citations, chat history, and retrieval in one calm workspace.
          </p>
        </div>

        <div className="auth-card mx-auto w-full max-w-md animate-fade-in rounded-[28px] p-6 sm:p-8">
          <div className="mb-6 text-center">
            <NuxeLogo size="lg" showText={false} className="mb-4 justify-center" />
            <h2 className="text-2xl font-bold tracking-tight text-white">Create account</h2>
            <p className="mt-2 text-sm text-slate-500">Start chatting with your PDFs in under a minute.</p>
          </div>

          <div className="auth-switch mb-6">
            <span className="auth-switch-indicator right-1" />
            <Link href="/login" className="auth-switch-option text-slate-400 hover:text-white">Login</Link>
            <Link href="/register" className="auth-switch-option text-slate-950">Sign up</Link>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">
              <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-red-400/20 text-xs">!</span>
              <span className="flex-1">{error}</span>
              <button onClick={clearError} className="text-red-200/70 hover:text-red-100">x</button>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            <div className="grid gap-3.5 sm:grid-cols-2">
              <AuthInput icon={User} label="Full name" error={errors.full_name?.message}>
                <input {...register('full_name')} className="input-dark w-full rounded-2xl py-3 pl-10 pr-4 text-sm" placeholder="John Doe" />
              </AuthInput>
              <AuthInput icon={AtSign} label="Username" error={errors.username?.message}>
                <input {...register('username')} className="input-dark w-full rounded-2xl py-3 pl-10 pr-4 text-sm" placeholder="johndoe" />
              </AuthInput>
            </div>

            <AuthInput icon={Mail} label="Email" error={errors.email?.message}>
              <input {...register('email')} type="email" className="input-dark w-full rounded-2xl py-3 pl-10 pr-4 text-sm" placeholder="name@example.com" />
            </AuthInput>

            <AuthInput icon={Lock} label="Password" error={errors.password?.message}>
              <input {...register('password')} type={showPassword ? 'text' : 'password'} className="input-dark w-full rounded-2xl py-3 pl-10 pr-11 text-sm" placeholder="Min. 8 characters" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </AuthInput>

            <div className="grid grid-cols-4 gap-1.5">
              {[25, 50, 75, 100].map((level) => (
                <span key={level} className={`h-1.5 rounded-full transition-all ${strength >= level ? 'bg-teal-300' : 'bg-white/10'}`} />
              ))}
            </div>

            <AuthInput icon={Lock} label="Confirm password" error={errors.confirm_password?.message}>
              <input {...register('confirm_password')} type={showConfirm ? 'text' : 'password'} className="input-dark w-full rounded-2xl py-3 pl-10 pr-11 text-sm" placeholder="Confirm password" />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200">
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </AuthInput>

            <button type="submit" disabled={isLoading} className="btn-primary group mt-2 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create account <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

function AuthInput({
  icon: Icon,
  label,
  error,
  children,
}: {
  icon: LucideIcon;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{label}</span>
      <span className="relative block">
        <Icon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        {children}
      </span>
      {error && <span className="mt-1.5 block text-xs text-red-300">{error}</span>}
    </label>
  );
}
