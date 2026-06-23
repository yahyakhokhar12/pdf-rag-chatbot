import { apiClient } from './api-client';

export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
  storage_used: number;
  storage_limit: number;
}

export const authService = {
  async login(data: any) {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },

  async register(data: any) {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  async forgotPassword(email: string) {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  async getMe(): Promise<User> {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};
