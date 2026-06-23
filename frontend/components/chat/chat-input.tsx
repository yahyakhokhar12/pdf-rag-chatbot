import { useState, useRef } from 'react';
import { Send, Paperclip, X, Check, ChevronUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { documentService } from '@/services/document-service';

interface ChatInputProps {
  onSendMessage: (message: string, documentIds?: string[]) => void;
  isTyping: boolean;
}

export function ChatInput({ onSendMessage, isTyping }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [selectedDocs, setSelectedDocs] = useState<{id: string, name: string}[]>([]);
  const [showDocSelector, setShowDocSelector] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data } = useQuery({
    queryKey: ['documents', 1, 100],
    queryFn: () => documentService.getDocuments(1, 100, '', 'ready'),
  });

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!message.trim() || isTyping) return;
    onSendMessage(message, selectedDocs.length > 0 ? selectedDocs.map(d => d.id) : undefined);
    setMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '52px';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '52px';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  const toggleDoc = (doc: {id: string, name: string}) => {
    if (selectedDocs.find(d => d.id === doc.id)) {
      setSelectedDocs(prev => prev.filter(d => d.id !== doc.id));
    } else {
      setSelectedDocs(prev => [...prev, doc]);
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto px-4 pb-5">
      {/* Selected Doc Tags */}
      {selectedDocs.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2.5">
          {selectedDocs.map(doc => (
            <span
              key={doc.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-violet-300"
              style={{
                background: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.25)'
              }}
            >
              <Paperclip className="w-3 h-3" />
              <span className="truncate max-w-[130px]">{doc.name}</span>
              <button
                onClick={() => toggleDoc(doc)}
                className="ml-0.5 hover:text-white transition-colors rounded-full hover:bg-violet-500/20 p-0.5"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Document Selector Popup */}
      {showDocSelector && (
        <div className="absolute bottom-full left-4 mb-3 w-72 rounded-xl shadow-2xl z-20 overflow-hidden animate-scale-in"
             style={{
               background: 'rgba(10, 8, 28, 0.95)',
               border: '1px solid rgba(139, 92, 246, 0.2)',
               backdropFilter: 'blur(20px)',
             }}>
          <div className="px-4 py-3 border-b flex justify-between items-center"
               style={{ borderColor: 'rgba(139, 92, 246, 0.1)', background: 'rgba(139, 92, 246, 0.05)' }}>
            <span className="text-xs font-semibold text-slate-300 tracking-widest uppercase">Filter by Document</span>
            <button onClick={() => setShowDocSelector(false)} className="text-slate-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto p-2">
            {!data?.documents?.length ? (
              <p className="text-center text-xs text-slate-500 py-6">No ready documents found.</p>
            ) : (
              data?.documents?.map(doc => {
                const isSelected = selectedDocs.some(d => d.id === doc.id);
                return (
                  <button
                    key={doc.id}
                    onClick={() => toggleDoc({ id: doc.id, name: doc.original_filename })}
                    className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all mb-0.5 ${
                      isSelected
                        ? 'text-violet-300'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    style={{
                      background: isSelected ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                    }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                    onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <span className="truncate pr-3">{doc.original_filename}</span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Main Input Form */}
      <form
        onSubmit={handleSubmit}
        className="chat-input-container rounded-2xl p-1.5 flex items-end gap-1"
      >
        {/* Attach button */}
        <button
          type="button"
          onClick={() => setShowDocSelector(!showDocSelector)}
          className={`p-2.5 rounded-xl transition-all shrink-0 ${
            selectedDocs.length > 0 || showDocSelector
              ? 'text-violet-400 bg-violet-500/15'
              : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
          }`}
          title="Filter by document"
        >
          {selectedDocs.length > 0 ? (
            <span className="flex items-center gap-1">
              <Paperclip className="w-4 h-4" />
              <span className="text-xs font-bold">{selectedDocs.length}</span>
            </span>
          ) : (
            <Paperclip className="w-4 h-4" />
          )}
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Ask anything about your documents..."
          rows={1}
          className="flex-1 bg-transparent border-0 text-slate-200 placeholder-slate-600 resize-none py-3.5 px-1 focus:ring-0 focus:outline-none text-[15px] leading-snug"
          style={{ height: '52px', maxHeight: '180px' }}
        />

        {/* Send button */}
        <button
          type="submit"
          disabled={!message.trim() || isTyping}
          className="btn-send p-2.5 m-0.5 rounded-xl flex items-center justify-center shrink-0"
          title="Send (Enter)"
        >
          {isTyping ? (
            <div className="flex items-center gap-0.5">
              <div className="typing-dot w-1.5 h-1.5" />
              <div className="typing-dot w-1.5 h-1.5" />
              <div className="typing-dot w-1.5 h-1.5" />
            </div>
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>

      <p className="text-center text-[11px] text-slate-700 mt-2.5">
        AI can make mistakes. Verify important info from the original documents.
      </p>
    </div>
  );
}
