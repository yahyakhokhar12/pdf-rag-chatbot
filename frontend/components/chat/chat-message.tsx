import { ThumbsUp, ThumbsDown, BookOpen, Sparkles, Copy, Check } from 'lucide-react';
import { Message, chatService } from '@/services/chat-service';
import { MarkdownRenderer } from './markdown-renderer';
import { useAuthStore } from '@/store/auth-store';
import { useState } from 'react';

interface ChatMessageProps {
  message: Message;
  onSourceClick: (source: any) => void;
  isStreaming?: boolean;
}

export function ChatMessage({ message, onSourceClick, isStreaming }: ChatMessageProps) {
  const { user } = useAuthStore();
  const isUser = message.role === 'user';
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(message.feedback || null);
  const [copied, setCopied] = useState(false);

  const handleFeedback = async (type: 'like' | 'dislike') => {
    if (!message.id || message.id.length < 10) return;
    try {
      const newFeedback = feedback === type ? null : type;
      setFeedback(newFeedback);
      await chatService.submitFeedback(message.id, type);
    } catch {
      // Ignore
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`group flex gap-4 px-4 md:px-8 py-6 w-full transition-colors ${
      isUser ? 'msg-user' : 'msg-ai'
    }`}>
      {/* Avatar */}
      <div className="shrink-0 mt-0.5">
        {isUser ? (
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md ring-2 ring-violet-500/20"
               style={{ background: 'linear-gradient(135deg, #8b5cf6, #4f46e5)' }}>
            {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        ) : (
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md"
               style={{ background: 'linear-gradient(135deg, #7c3aed, #4338ca)' }}>
            <Sparkles className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex items-center justify-between mb-2 gap-4">
          <span className="font-semibold text-sm text-slate-200 flex items-center gap-2">
            {isUser ? 'You' : (
              <>
                <span className="text-gradient">AI Assistant</span>
                {isStreaming && (
                  <span className="text-xs font-normal text-violet-400/70 animate-pulse">thinking...</span>
                )}
              </>
            )}
          </span>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
              title="Copy message"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {!isUser && !isStreaming && (
              <>
                <div className="w-px h-4 bg-slate-800 mx-0.5" />
                <button
                  onClick={() => handleFeedback('like')}
                  className={`p-1.5 rounded-lg transition-all ${
                    feedback === 'like'
                      ? 'text-violet-400 bg-violet-500/10'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                  }`}
                  title="Helpful"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleFeedback('dislike')}
                  className={`p-1.5 rounded-lg transition-all ${
                    feedback === 'dislike'
                      ? 'text-red-400 bg-red-500/10'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                  }`}
                  title="Not helpful"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Message body */}
        <div className={isStreaming ? 'opacity-90' : ''}>
          {isUser ? (
            <div className="text-slate-200 leading-relaxed whitespace-pre-wrap text-[15px]">
              {message.content}
            </div>
          ) : (
            <div className={isStreaming && !message.content ? 'flex items-center gap-1.5 py-1' : ''}>
              {isStreaming && !message.content ? (
                <>
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </>
              ) : (
                <div className={isStreaming ? 'streaming-cursor' : ''}>
                  <MarkdownRenderer content={message.content || ''} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sources */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-5 pt-4 border-t border-white/[0.05]">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              Sources
            </p>
            <div className="flex flex-wrap gap-2">
              {message.sources.map((source, i) => (
                <button
                  key={`${source.document_id}-${i}`}
                  onClick={() => onSourceClick(source)}
                  className="source-chip inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-slate-300 font-medium"
                >
                  <span className="w-4 h-4 rounded flex items-center justify-center font-mono text-[10px] font-bold text-violet-300"
                        style={{ background: 'rgba(139, 92, 246, 0.2)' }}>
                    {i + 1}
                  </span>
                  <span className="truncate max-w-[140px]">{source.document_name}</span>
                  {source.page && (
                    <span className="text-slate-500">p.{source.page}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
