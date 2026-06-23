import { X, ExternalLink, BookOpen, FileText } from 'lucide-react';
import { Source } from '@/services/chat-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface SourcesPanelProps {
  source: Source | null;
  onClose: () => void;
}

export function SourcesPanel({ source, onClose }: SourcesPanelProps) {
  if (!source) return null;

  return (
    <div className="w-80 flex flex-col h-full shrink-0 animate-slide-in-right"
         style={{
           background: 'rgba(6, 5, 16, 0.97)',
           borderLeft: '1px solid rgba(139, 92, 246, 0.12)',
           boxShadow: '-20px 0 60px rgba(0,0,0,0.4)',
         }}>
      {/* Header */}
      <div className="p-4 flex justify-between items-center shrink-0"
           style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <h2 className="font-semibold text-slate-200 flex items-center gap-2 text-sm">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center"
               style={{ background: 'rgba(139, 92, 246, 0.15)' }}>
            <BookOpen className="w-3.5 h-3.5 text-violet-400" />
          </div>
          Source Details
        </h2>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 overflow-y-auto space-y-5">
        {/* Document info card */}
        <div className="rounded-xl p-4"
             style={{ background: 'rgba(139, 92, 246, 0.06)', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                 style={{ background: 'rgba(139, 92, 246, 0.12)' }}>
              <FileText className="w-4 h-4 text-violet-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-1">Document</p>
              <p className="text-sm font-medium text-slate-200 break-words leading-snug">{source.document_name}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4 pt-4"
               style={{ borderTop: '1px solid rgba(139, 92, 246, 0.1)' }}>
            <div>
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-1">Page</p>
              <p className="text-sm font-mono font-medium text-slate-300">{source.page ?? 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-1">Relevance</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(source.score * 100).toFixed(0)}%`,
                      background: 'linear-gradient(90deg, #8b5cf6, #6366f1)'
                    }}
                  />
                </div>
                <span className="text-xs font-mono text-emerald-400 shrink-0">{(source.score * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Text snippet */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Text Snippet</h3>
            <span className="text-[10px] text-slate-600 px-2 py-0.5 rounded-md"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}>
              Chunk #{source.chunk_index}
            </span>
          </div>
          <div className="relative group rounded-xl p-4"
               style={{
                 background: 'rgba(8, 7, 20, 0.9)',
                 border: '1px solid rgba(255,255,255,0.06)',
               }}>
            <button
              className="absolute top-2.5 right-2.5 p-1.5 rounded-lg text-slate-600 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/5"
              onClick={() => navigator.clipboard.writeText(source.snippet)}
              title="Copy text"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            </button>
            <p className="text-sm text-slate-400 leading-relaxed font-serif italic">
              &ldquo;{source.snippet}&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <a
          href={`${API_BASE}/api/v1/documents/${source.document_id}/download`}
          target="_blank"
          rel="noreferrer"
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium text-violet-300 transition-all hover:text-violet-200"
          style={{
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(139, 92, 246, 0.15)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(139, 92, 246, 0.1)';
          }}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View Original PDF
        </a>
      </div>
    </div>
  );
}
