'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, authService } from '../services/auth-service';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;
  
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      isHydrated: false,
      error: null,

      login: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const { access_token, refresh_token } = await authService.login(data);
          localStorage.setItem('accessToken', access_token);
          localStorage.setItem('refreshToken', refresh_token);
          
          await get().fetchUser();
          set({ isLoading: false });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.detail || 'Login failed',
            isLoading: false 
          });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const { access_token, refresh_token } = await authService.register(data);
          localStorage.setItem('accessToken', access_token);
          localStorage.setItem('refreshToken', refresh_token);
          
          await get().fetchUser();
          set({ isLoading: false });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.detail || 'Registration failed',
            isLoading: false 
          });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, isAuthenticated: false, isLoading: false, error: null });
      },

      fetchUser: async () => {
        if (!localStorage.getItem('accessToken')) {
          set({ isAuthenticated: false, isLoading: false });
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const user = await authService.getMe();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          // fetchUser doesn't throw, just logs out on failure
          get().logout();
          set({ isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      // Only persist the user object, not loading/error states
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        state?.clearError();
        useAuthStore.setState({ isHydrated: true, isLoading: false });
      },
    }
  )
);
