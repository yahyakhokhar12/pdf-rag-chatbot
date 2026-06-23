'use client';

import { useState, useRef, useEffect, use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useChat } from '@/hooks/use-chat';
import { chatService, Source } from '@/services/chat-service';
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
      <div className="absolute inset-0 flex chat-stage">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-cyan-300" />
            <p className="text-sm text-slate-600">Loading conversation...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex chat-stage">
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Conversation title bar */}
        <div className="px-6 py-3.5 flex items-center shrink-0"
             style={{
               background: 'rgba(0, 0, 8, 0.34)',
               backdropFilter: 'blur(24px) saturate(150%)',
               borderBottom: '1px solid rgba(255,255,255,0.08)',
             }}>
          <h2 className="font-medium text-slate-300 text-sm truncate">{detailData?.title || 'Conversation'}</h2>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto pb-44 sm:pb-40">
          <div className="max-w-4xl mx-auto divide-y px-1 sm:px-0" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
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
                      className="related-question px-3 py-1.5 text-sm rounded-xl text-left transition-all"
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
             style={{ background: 'linear-gradient(to top, rgba(0, 0, 8, 0.76) 58%, transparent)' }}>
          <div className="pt-6 sm:pt-8">
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
