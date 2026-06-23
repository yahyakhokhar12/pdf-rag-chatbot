'use client';

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { chatService, Message, Source } from '../services/chat-service';

interface ChatStreamEvent {
  type: 'token' | 'sources' | 'done' | 'error' | 'related_questions';
  content?: string | Source[] | string[];
  message_id?: string;
  conversation_id?: string;
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);
  const [relatedQuestions, setRelatedQuestions] = useState<string[]>([]);
  
  const queryClient = useQueryClient();

  const setConversation = (id: string, initialMessages: Message[]) => {
    setCurrentConvId(id);
    setMessages(initialMessages);
    setRelatedQuestions([]);
  };

  const sendMessage = useCallback(async (content: string, documentIds?: string[]) => {
    if (!content.trim() || isTyping) return;

    // Add optimistic user message
    const tempUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempUserMsg]);
    setIsTyping(true);
    setRelatedQuestions([]);

    // Temporary assistant message for streaming
    const tempAsstId = (Date.now() + 1).toString();
    setMessages(prev => [
      ...prev,
      { id: tempAsstId, role: 'assistant', content: '', created_at: new Date().toISOString() }
    ]);

    try {
      const token = localStorage.getItem('accessToken');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      const response = await fetch(`${API_URL}/api/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: content,
          conversation_id: currentConvId,
          document_ids: documentIds?.length ? documentIds : undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      if (!response.body) throw new Error('No readable stream');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let assistantSources: Source[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6)) as ChatStreamEvent;

              if (data.type === 'token' && typeof data.content === 'string') {
                assistantContent += data.content;
                setMessages(prev => prev.map(m => 
                  m.id === tempAsstId ? { ...m, content: assistantContent } : m
                ));
              } else if (data.type === 'sources' && Array.isArray(data.content)) {
                assistantSources = data.content as Source[];
                setMessages(prev => prev.map(m => 
                  m.id === tempAsstId ? { ...m, sources: assistantSources } : m
                ));
              } else if (data.type === 'related_questions' && Array.isArray(data.content)) {
                setRelatedQuestions(data.content as string[]);
              } else if (data.type === 'done') {
                if (data.message_id) {
                  setMessages(prev => prev.map(m => 
                    m.id === tempAsstId ? { ...m, id: data.message_id as string } : m
                  ));
                }
                if (data.conversation_id && !currentConvId) {
                  setCurrentConvId(data.conversation_id);
                  // Refetch sidebar list
                  queryClient.invalidateQueries({ queryKey: ['conversations'] });
                }
              } else if (data.type === 'error') {
                console.error('Chat error:', data.content);
                // Handle error state
              }
            } catch (e) {
              console.error('Error parsing SSE:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => prev.map(m => 
        m.id === tempAsstId ? { ...m, content: "Sorry, I encountered an error while processing your request." } : m
      ));
    } finally {
      setIsTyping(false);
    }
  }, [currentConvId, isTyping, queryClient]);

  const resetChat = () => {
    setCurrentConvId(null);
    setMessages([]);
    setRelatedQuestions([]);
  };

  return {
    messages,
    isTyping,
    currentConvId,
    relatedQuestions,
    setConversation,
    sendMessage,
    resetChat
  };
}
