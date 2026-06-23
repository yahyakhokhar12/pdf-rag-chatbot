import { apiClient } from './api-client';

export interface Document {
  id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  page_count: number | null;
  chunk_count: number | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentListResponse {
  documents: Document[];
  total: number;
  page: number;
  page_size: number;
}

export const documentService = {
  async uploadDocument(file: File, onProgress?: (progress: number) => void) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data;
  },

  async getDocuments(page = 1, pageSize = 20, search = '', status = '') {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());
    if (search) params.append('search', search);
    if (status) params.append('status_filter', status);

    const response = await apiClient.get<DocumentListResponse>(`/documents?${params.toString()}`);
    return response.data;
  },

  async deleteDocument(id: string) {
    const response = await apiClient.delete(`/documents/${id}`);
    return response.data;
  },

  async renameDocument(id: string, filename: string) {
    const response = await apiClient.patch(`/documents/${id}`, { filename });
    return response.data;
  },

  getDownloadUrl(id: string) {
    return `${apiClient.defaults.baseURL}/documents/${id}/download`;
  }
};
