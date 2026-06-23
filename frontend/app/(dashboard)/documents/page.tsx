'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, FileText, Download, Trash2, Loader2, Plus } from 'lucide-react';
import { UploadZone } from '@/components/documents/upload-zone';
import { documentService, Document } from '@/services/document-service';
import { formatBytes, formatDate } from '@/lib/utils';

export default function DocumentsPage() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['documents', 1, 50, search],
    queryFn: () => documentService.getDocuments(1, 50, search),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentService.deleteDocument(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  });

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Files</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage your uploaded PDFs and knowledge base.</p>
        </div>
      </div>

      {/* Upload zone */}
      <div className="mb-6">
        <UploadZone />
      </div>

      {/* Documents table */}
      <div className="rounded-2xl overflow-hidden"
           style={{
             background: 'rgba(12, 10, 28, 0.6)',
             border: '1px solid rgba(255,255,255,0.06)',
             backdropFilter: 'blur(20px)',
           }}>
        {/* Table header */}
        <div className="p-4 flex items-center justify-between"
             style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
            <input
              type="text"
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-sm text-slate-300 placeholder-slate-600 pl-8 pr-3 py-2 rounded-xl focus:outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
            />
          </div>
          <span className="text-xs font-medium text-slate-600 ml-4 px-2.5 py-1 rounded-full whitespace-nowrap"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}>
            {data?.total || 0} files
          </span>
        </div>

        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-600">
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: '#8b5cf6' }} />
            <p className="text-sm">Loading documents...</p>
          </div>
        ) : !data?.documents?.length ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                 style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <FileText className="w-7 h-7 text-slate-600" />
            </div>
            <h3 className="text-base font-semibold text-slate-300 mb-2">No documents yet</h3>
            <p className="text-sm text-slate-600 max-w-xs">
              Upload your first PDF above to start extracting knowledge and chatting with your documents.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left data-table">
              <thead>
                <tr className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <th className="p-4 pl-6">Document</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Size</th>
                  <th className="p-4">Uploaded</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.documents.map((doc: Document) => (
                  <tr key={doc.id} className="group transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                             style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99,102,241,0.15)' }}>
                          <FileText className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-200">{doc.original_filename}</p>
                          <p className="text-xs text-slate-600 mt-0.5">
                            {doc.page_count ? `${doc.page_count} pages` : ''}
                            {doc.page_count && doc.chunk_count ? ' · ' : ''}
                            {doc.chunk_count ? `${doc.chunk_count} chunks` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {doc.status === 'ready' && (
                        <span className="badge-ready inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium">
                          ✓ Ready
                        </span>
                      )}
                      {doc.status === 'processing' && (
                        <span className="badge-processing inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium">
                          <Loader2 className="w-3 h-3 animate-spin" /> Processing
                        </span>
                      )}
                      {doc.status === 'error' && (
                        <span className="badge-error inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium"
                              title={doc.error_message || ''}>
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-slate-500">{formatBytes(doc.file_size)}</td>
                    <td className="p-4 text-sm text-slate-500">{formatDate(doc.created_at)}</td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a
                          href={documentService.getDownloadUrl(doc.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 text-slate-500 hover:text-slate-200 rounded-lg hover:bg-white/5 transition-all"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          className="p-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/5 transition-all"
                          title="Delete"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this document?')) {
                              deleteMutation.mutate(doc.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
