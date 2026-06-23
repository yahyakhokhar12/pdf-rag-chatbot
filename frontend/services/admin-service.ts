import { apiClient } from './api-client';

export interface AdminAnalytics {
  users?: { total: number; active: number };
  documents?: { total: number };
  conversations?: { total: number; total_messages: number };
  storage?: { total_used_bytes: number; total_used_mb: number };
  vectors?: { vectors_count?: number; points_count?: number };
}

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: string;
  is_active: boolean;
  storage_used: number;
  storage_limit: number;
}

export interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  page_size: number;
}

export const adminService = {
  async getAnalytics() {
    const response = await apiClient.get<AdminAnalytics>('/admin/analytics');
    return response.data;
  },

  async getUsers(page = 1, pageSize = 20, search = '') {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (search) params.append('search', search);
    const response = await apiClient.get<AdminUsersResponse>(`/admin/users?${params}`);
    return response.data;
  },

  async updateUser(id: string, data: { is_active?: boolean; role?: string }) {
    const response = await apiClient.patch<AdminUser>(`/admin/users/${id}`, data);
    return response.data;
  }
};
