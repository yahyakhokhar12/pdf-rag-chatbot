import { apiClient } from './api-client';

export const adminService = {
  async getAnalytics() {
    const response = await apiClient.get('/admin/analytics');
    return response.data;
  },

  async getUsers(page = 1, pageSize = 20, search = '') {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (search) params.append('search', search);
    const response = await apiClient.get(`/admin/users?${params}`);
    return response.data;
  },

  async updateUser(id: string, data: { is_active?: boolean; role?: string }) {
    const response = await apiClient.patch(`/admin/users/${id}`, data);
    return response.data;
  }
};
