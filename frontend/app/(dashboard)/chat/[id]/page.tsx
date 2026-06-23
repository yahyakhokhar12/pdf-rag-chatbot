'use client';

import { useState, useRef, useEffect, use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useChat } from '@/hooks/use-chat';
import { chatService, Source } from '@/services/chat-service';
import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { ChatInput } from '@/components/chat/chat-input';
import { ChatMessage } from '@/components/chat/chat-message';
import { SourcesPanel } from '@/components/chat/sources-panel';
import { useRouter } from 'next/navigation';

export default function ExistingChatPage({ params }: { params: Promise<{ id: string }> }) {
  const [activeSource, setActiveSource] = useState<Source | null>(null);
  const router = useRouter();
  const resolvedParams = use(params);
  const chatId = resolvedParams.id;

  const { messages, isTyping, currentConvId, sendMessage, setConversation, relatedQuestions } = useChat();

  const { data: convData, isLoading: convLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatService.getConversations(1, 50),
  });

  const { data: detailData, isLoading: detailLoading, isError } = useQuery({
    queryKey: ['conversation', chatId],
    queryFn: () => chatService.getConversation(chatId),
    retry: 1,
  });

  useEffect(() => {
    if (detailData && currentConvId !== chatId) {
      setConversation(detailData.id, detailData.messages);
    }
  }, [detailData, chatId, currentConvId, setConversation]);

  useEffect(() => {
    if (isError) router.push('/chat');
  }, [isError, router]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = (text: string, docIds?: string[]) => sendMessage(text, docIds);

  if (detailLoading) {
    return (
      <div className="absolute inset-0 flex" style={{ background: '#070611' }}>
        <ChatSidebar conversations={convData?.conversations || []} isLoading={convLoading} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: '#8b5cf6' }} />
            <p className="text-sm text-slate-600">Loading conversation...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex" style={{ background: '#070611' }}>
      <ChatSidebar conversations={convData?.conversations || []} isLoading={convLoading} />

      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Conversation title bar */}
        <div className="px-6 py-3.5 flex items-center shrink-0"
             style={{
               background: 'rgba(7, 6, 17, 0.85)',
               backdropFilter: 'blur(20px)',
               borderBottom: '1px solid rgba(255,255,255,0.04)',
             }}>
          <h2 className="font-medium text-slate-300 text-sm truncate">{detailData?.title || 'Conversation'}</h2>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto pb-36">
          <div className="max-w-4xl mx-auto divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {messages.map((msg, i) => (
              <ChatMessage
                key={msg.id || i}
                message={msg}
                onSourceClick={setActiveSource}
                isStreaming={isTyping && i === messages.length - 1 && msg.role === 'assistant'}
              />
            ))}

            {!isTyping && relatedQuestions.length > 0 && (
              <div className="py-6 px-4 md:px-8">
                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-3">
                  Related Questions
                </p>
                <div className="flex flex-wrap gap-2">
                  {relatedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(q)}
                      className="px-3 py-1.5 text-sm text-violet-300 rounded-xl text-left transition-all"
                      style={{
                        background: 'rgba(139, 92, 246, 0.06)',
                        border: '1px solid rgba(139, 92, 246, 0.15)',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(139, 92, 246, 0.1)';
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139, 92, 246, 0.3)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(139, 92, 246, 0.06)';
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139, 92, 246, 0.15)';
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Floating input */}
        <div className="absolute bottom-0 left-0 right-0"
             style={{ background: 'linear-gradient(to top, #070611 60%, transparent)' }}>
          <div className="pt-8">
            <ChatInput onSendMessage={handleSend} isTyping={isTyping} />
          </div>
        </div>
      </div>

      {activeSource && (
        <SourcesPanel source={activeSource} onClose={() => setActiveSource(null)} />
      )}
    </div>
  );
}
