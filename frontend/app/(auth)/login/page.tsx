'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { NuxeLogo } from '@/components/brand/nuxe-logo';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, error, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      await login(data);
      router.replace('/dashboard');
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-stage min-h-screen overflow-hidden px-4 py-8">
      <div className="auth-mesh" />
      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden lg:block auth-copy">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-teal-200">
            <Sparkles className="h-3.5 w-3.5" />
            nuxeAI intelligence
          </div>
          <h1 className="mt-6 max-w-2xl text-5xl font-black leading-[1.02] tracking-tight text-white">
            Turn dense PDFs into clear answers with nuxeAI.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-400">
            Upload research, contracts, manuals, or reports and chat with them through a focused RAG workspace.
          </p>
          <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
            {['Cited answers', 'Private library', 'Fast retrieval'].map((item) => (
              <div key={item} className="auth-stat rounded-2xl px-4 py-3 text-sm font-medium text-slate-200">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="auth-card mx-auto w-full max-w-md animate-fade-in rounded-[28px] p-6 sm:p-8">
          <div className="mb-7 text-center">
            <NuxeLogo size="lg" showText={false} className="mb-4 justify-center" />
            <h2 className="text-2xl font-bold tracking-tight text-white">Welcome back</h2>
            <p className="mt-2 text-sm text-slate-500">Sign in and pick up where your documents left off.</p>
          </div>

          <div className="auth-switch mb-6">
            <span className="auth-switch-indicator left-1" />
            <Link href="/login" className="auth-switch-option text-slate-950">Login</Link>
            <Link href="/register" className="auth-switch-option text-slate-400 hover:text-white">Sign up</Link>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">
              <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-red-400/20 text-xs">!</span>
              <span className="flex-1">{error}</span>
              <button onClick={clearError} className="text-red-200/70 hover:text-red-100">x</button>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Email</span>
              <span className="relative block">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input {...register('email')} type="email" className="input-dark w-full rounded-2xl py-3.5 pl-10 pr-4 text-sm" placeholder="name@example.com" />
              </span>
              {errors.email && <span className="mt-1.5 block text-xs text-red-300">{errors.email.message}</span>}
            </label>

            <label className="block">
              <span className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Password</span>
                <Link href="/forgot-password" className="text-xs font-medium text-teal-300 hover:text-teal-200">Forgot?</Link>
              </span>
              <span className="relative block">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input {...register('password')} type={showPassword ? 'text' : 'password'} className="input-dark w-full rounded-2xl py-3.5 pl-10 pr-11 text-sm" placeholder="Password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
              {errors.password && <span className="mt-1.5 block text-xs text-red-300">{errors.password.message}</span>}
            </label>

            <button type="submit" disabled={isSubmitting} className="btn-primary group mt-2 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign in <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
