'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { fetchUser, isAuthenticated, isLoading, isHydrated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isHydrated) return;
    fetchUser();
  }, [fetchUser, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    if (isLoading) return;

    const isAuthRoute = pathname.startsWith('/login') || 
                        pathname.startsWith('/register') || 
                        pathname.startsWith('/forgot-password');

    // Protect dashboard routes
    if (!isAuthenticated && !isAuthRoute && pathname !== '/') {
      router.push('/login');
    }

    // Redirect authenticated users away from auth pages
    if (isAuthenticated && isAuthRoute) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isHydrated, isLoading, pathname, router]);

  return <>{children}</>;
}
