'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Sparkles, Zap, LayoutTemplate, Shield, Bot } from 'lucide-react';
import { useChat } from '@/hooks/use-chat';
import { chatService, Source } from '@/services/chat-service';
import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { ChatInput } from '@/components/chat/chat-input';
import { ChatMessage } from '@/components/chat/chat-message';
import { SourcesPanel } from '@/components/chat/sources-panel';
import { useRouter } from 'next/navigation';

const SUGGESTIONS = [
  {
    icon: LayoutTemplate,
    color: 'text-blue-400',
    bg: 'rgba(59, 130, 246, 0.1)',
    border: 'rgba(59, 130, 246, 0.2)',
    title: 'Summarize Documents',
    desc: 'Get a quick overview of your recent uploads',
    prompt: 'Summarize the main points of my recent documents.'
  },
  {
    icon: Zap,
    color: 'text-amber-400',
    bg: 'rgba(245, 158, 11, 0.1)',
    border: 'rgba(245, 158, 11, 0.2)',
    title: 'Extract Data',
    desc: 'Find specific stats, numbers and figures',
    prompt: 'Find specific numbers or statistics in the financial reports.'
  },
  {
    icon: Shield,
    color: 'text-emerald-400',
    bg: 'rgba(16, 185, 129, 0.1)',
    border: 'rgba(16, 185, 129, 0.2)',
    title: 'Compare Info',
    desc: 'Cross-reference multiple documents at once',
    prompt: 'Compare the terms across different contracts.'
  },
];

export default function NewChatPage() {
  const [activeSource, setActiveSource] = useState<Source | null>(null);
  const router = useRouter();

  const { messages, isTyping, currentConvId, sendMessage, relatedQuestions } = useChat();

  const { data: convData, isLoading: convLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatService.getConversations(1, 50),
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (currentConvId) {
      router.replace(`/chat/${currentConvId}`);
    }
  }, [currentConvId, router]);

  const handleSend = (text: string, docIds?: string[]) => sendMessage(text, docIds);

  return (
    <div className="absolute inset-0 flex" style={{ background: '#070611' }}>
      <ChatSidebar conversations={convData?.conversations || []} isLoading={convLoading} />

      <div className="flex-1 flex flex-col min-w-0 relative">
        <div ref={scrollRef} className="flex-1 overflow-y-auto pb-36 pt-4">
          {messages.length === 0 ? (
            /* Empty state */
            <div className="max-w-2xl mx-auto px-4 mt-16 md:mt-24 animate-fade-in">
              <div className="text-center mb-10">
                {/* AI logo */}
                <div className="relative inline-block mb-6">
                  <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-2xl"
                       style={{
                         background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                         boxShadow: '0 0 40px rgba(139, 92, 246, 0.4), 0 0 80px rgba(139, 92, 246, 0.15)'
                       }}>
                    <Bot className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-400 rounded-full border-2 flex items-center justify-center"
                       style={{ borderColor: '#070611' }}>
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
                  How can I help you?
                </h1>
                <p className="text-slate-500 max-w-md mx-auto leading-relaxed text-base">
                  Ask me anything about your uploaded documents. I'll provide precise answers with source citations.
                </p>
              </div>

              {/* Suggestion cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {SUGGESTIONS.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => handleSend(s.prompt)}
                      className="p-4 rounded-2xl text-left transition-all duration-200 group animate-fade-in"
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        animationDelay: `${i * 0.1}s`,
                        animationFillMode: 'both',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                        (e.currentTarget as HTMLElement).style.borderColor = s.border;
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)';
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)';
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                      }}
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                           style={{ background: s.bg }}>
                        <Icon className={`w-4.5 h-4.5 ${s.color}`} style={{ width: '18px', height: '18px' }} />
                      </div>
                      <h3 className="font-semibold text-slate-200 mb-1 text-sm">{s.title}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
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
                        className="px-3 py-1.5 text-sm text-violet-300 rounded-xl text-left transition-all hover:text-violet-200"
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
          )}
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
