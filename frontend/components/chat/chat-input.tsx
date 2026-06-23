import { useState, useRef, useCallback } from 'react';
import { Send, Paperclip, X, Check, UploadCloud, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { documentService } from '@/services/document-service';

interface ChatInputProps {
  onSendMessage: (message: string, documentIds?: string[]) => void;
  isTyping: boolean;
}

export function ChatInput({ onSendMessage, isTyping }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [selectedDocs, setSelectedDocs] = useState<{id: string, name: string}[]>([]);
  const [showDocSelector, setShowDocSelector] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadName, setUploadName] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['documents', 1, 100],
    queryFn: () => documentService.getDocuments(1, 100, '', 'ready'),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => documentService.uploadDocument(file, setUploadProgress),
    onSuccess: (uploaded: any) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      const uploadedDoc = uploaded?.document || uploaded;
      if (uploadedDoc?.id) {
        setSelectedDocs(prev => {
          if (prev.some(doc => doc.id === uploadedDoc.id)) return prev;
          return [...prev, { id: uploadedDoc.id, name: uploadedDoc.original_filename || uploadedDoc.filename || uploadName }];
        });
      }
      setTimeout(() => {
        setUploadProgress(0);
        setUploadName('');
      }, 1600);
    },
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

  const handleFile = (file: File) => {
    if (file.type !== 'application/pdf') {
      alert('Only PDF files are supported.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      alert('File size exceeds 50MB limit.');
      return;
    }
    setUploadName(file.name);
    setUploadProgress(0);
    uploadMutation.mutate(file);
  };

  const handleUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
    if (e.type === 'dragleave') setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, []);

  return (
    <div className="relative w-full max-w-4xl mx-auto px-2 sm:px-4 pb-3 sm:pb-5">
      {/* Selected Doc Tags */}
      {selectedDocs.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2.5">
          {selectedDocs.map(doc => (
            <span
              key={doc.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-cyan-200"
              style={{
                background: 'rgba(6, 182, 212, 0.1)',
                border: '1px solid rgba(6, 182, 212, 0.25)'
              }}
            >
              <Paperclip className="w-3 h-3" />
              <span className="truncate max-w-[130px]">{doc.name}</span>
              <button
                onClick={() => toggleDoc(doc)}
                className="ml-0.5 hover:text-white transition-colors rounded-full hover:bg-cyan-500/20 p-0.5"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Document Selector Popup */}
      {showDocSelector && (
        <div className="absolute bottom-full left-2 right-2 sm:left-4 sm:right-auto mb-3 sm:w-[min(26rem,calc(100vw-2rem))] rounded-xl shadow-2xl z-20 overflow-hidden animate-scale-in doc-picker-popover"
             style={{
               background: 'rgba(0, 0, 8, 0.58)',
               border: '1px solid rgba(255, 255, 255, 0.1)',
               backdropFilter: 'blur(26px) saturate(150%)',
             }}>
          <div className="px-4 py-3 border-b flex justify-between items-center"
               style={{ borderColor: 'rgba(255, 255, 255, 0.08)', background: 'rgba(255, 255, 255, 0.04)' }}>
            <span className="text-xs font-semibold text-slate-300 tracking-widest uppercase">Attach PDFs to chat</span>
            <button onClick={() => setShowDocSelector(false)} className="text-slate-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 border-b border-white/[0.06]">
            <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleUploadChange} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`chat-upload-drop w-full rounded-xl p-3 text-left transition-all ${isDragging ? 'dragging' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 upload-orb">
                  {uploadMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : uploadMutation.isError ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : uploadMutation.isSuccess && uploadName ? (
                    <Sparkles className="w-5 h-5" />
                  ) : (
                    <UploadCloud className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-100 truncate">
                    {uploadMutation.isPending ? `Uploading ${uploadName}` : uploadMutation.isSuccess && uploadName ? 'PDF uploaded and attached' : 'Upload PDF from chat'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Drag a PDF here or click to browse. Max 50MB.
                  </p>
                </div>
              </div>
              {(uploadMutation.isPending || uploadMutation.isSuccess) && uploadName && (
                <div className="mt-3 h-1.5 rounded-full overflow-hidden bg-white/[0.06]">
                  <div
                    className="h-full rounded-full transition-all duration-300 upload-progress"
                    style={{ width: `${uploadMutation.isSuccess ? 100 : uploadProgress}%` }}
                  />
                </div>
              )}
              {uploadMutation.isError && (
                <p className="text-xs text-red-300 mt-2">Upload failed. Please try again.</p>
              )}
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto p-2">
            <p className="px-2 pb-2 text-[10px] font-semibold tracking-widest uppercase text-slate-600">Ready documents</p>
            {!data?.documents?.length ? (
              <p className="text-center text-xs text-slate-500 py-6">No ready documents found. Upload one above.</p>
            ) : (
              data?.documents?.map(doc => {
                const isSelected = selectedDocs.some(d => d.id === doc.id);
                return (
                  <button
                    key={doc.id}
                    onClick={() => toggleDoc({ id: doc.id, name: doc.original_filename })}
                    className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all mb-0.5 ${
                      isSelected
                        ? 'text-cyan-200'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    style={{
                      background: isSelected ? 'rgba(6, 182, 212, 0.14)' : 'transparent',
                    }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                    onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <span className="truncate pr-3">{doc.original_filename}</span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
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
              ? 'text-cyan-300 bg-cyan-500/15'
              : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
          }`}
          title="Attach or upload PDF"
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
          className="flex-1 min-w-0 bg-transparent border-0 text-slate-200 placeholder-slate-600 resize-none py-3.5 px-1 focus:ring-0 focus:outline-none text-sm sm:text-[15px] leading-snug"
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

      <p className="px-2 text-center text-[10px] sm:text-[11px] text-slate-700 mt-2.5">
        AI can make mistakes. Verify important info from the original documents.
      </p>
    </div>
  );
}
