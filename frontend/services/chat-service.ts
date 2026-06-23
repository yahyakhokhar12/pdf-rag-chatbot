import { apiClient } from './api-client';

export interface Source {
  document_id: string;
  document_name: string;
  page: number | null;
  chunk_index: number;
  snippet: string;
  score: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  feedback?: 'like' | 'dislike' | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  is_pinned: boolean;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface ConversationListResponse {
  conversations: Conversation[];
  total: number;
}

export interface ConversationDetail {
  id: string;
  title: string;
  is_pinned: boolean;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

export const chatService = {
  async getConversations(page = 1, pageSize = 50, search = '') {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (search) params.append('search', search);
    const response = await apiClient.get<ConversationListResponse>(`/conversations?${params}`);
    return response.data;
  },

  async getConversation(id: string) {
    const response = await apiClient.get<ConversationDetail>(`/conversations/${id}`);
    return response.data;
  },

  async updateConversation(id: string, data: { title?: string; is_pinned?: boolean }) {
    const response = await apiClient.patch(`/conversations/${id}`, data);
    return response.data;
  },

  async deleteConversation(id: string) {
    const response = await apiClient.delete(`/conversations/${id}`);
    return response.data;
  },

  async submitFeedback(messageId: string, feedback: 'like' | 'dislike') {
    const response = await apiClient.post(`/chat/${messageId}/feedback`, { feedback });
    return response.data;
  },

  // SSE streaming chat
  createChatStream(message: string, conversationId?: string, documentIds?: string[]) {
    // We don't use standard axios for SSE as it doesn't handle streams well in browser
    // We'll use native fetch API for this in the component hook
  }
};
