'use client';

import { useState, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UploadCloud, FileText, X, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { documentService } from '@/services/document-service';

export function UploadZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: (file: File) => documentService.uploadDocument(file, setProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setTimeout(() => { setFile(null); setProgress(0); }, 3000);
    },
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
    else if (e.type === 'dragleave') setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
  };

  const handleFile = (f: File) => {
    if (f.type !== 'application/pdf') {
      alert('Only PDF files are supported.');
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      alert('File size exceeds 50MB limit.');
      return;
    }
    setFile(f);
    setProgress(0);
    uploadMutation.mutate(f);
  };

  if (file) {
    const isError = uploadMutation.isError;
    const isSuccess = uploadMutation.isSuccess;
    const errorMessage = uploadMutation.error instanceof Error
      ? uploadMutation.error.message
      : 'Upload failed. Please try again.';

    return (
      <div
        className={`p-5 rounded-2xl flex items-center gap-4 transition-all ${
          isSuccess ? 'border border-emerald-500/20' : isError ? 'border border-red-500/15' : 'border border-violet-500/15'
        }`}
        style={{ background: isSuccess ? 'rgba(16,185,129,0.04)' : isError ? 'rgba(239,68,68,0.04)' : 'rgba(139,92,246,0.06)' }}
      >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
          isSuccess ? 'bg-emerald-500/10' : isError ? 'bg-red-500/10' : 'bg-violet-500/10'
        }`}>
          {isError ? <AlertCircle className="text-red-400 w-5 h-5" /> :
           isSuccess ? <CheckCircle2 className="text-emerald-400 w-5 h-5" /> :
           <FileText className="text-violet-400 w-5 h-5" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-1.5">
            <p className="text-sm font-medium text-white truncate pr-4">{file.name}</p>
            <span className="text-xs text-slate-500 shrink-0">{(file.size / (1024 * 1024)).toFixed(1)} MB</span>
          </div>
          {isError ? (
            <p className="text-xs text-red-400">{errorMessage}</p>
          ) : isSuccess ? (
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <p className="text-xs text-emerald-400">Processed and ready for chat!</p>
            </div>
          ) : (
            <>
              <div className="w-full rounded-full h-1.5 overflow-hidden mt-1" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #8b5cf6, #6366f1)' }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Uploading... {progress}%</p>
            </>
          )}
        </div>

        {isError && (
          <button
            onClick={() => setFile(null)}
            className="p-2 text-slate-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`upload-zone p-10 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${isDragging ? 'dragging' : ''}`}
    >
      <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={handleChange} />

      <div className={`relative mb-5 transition-all duration-300 ${isDragging ? 'scale-110' : ''}`}>
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${isDragging ? 'shadow-lg' : ''}`}
          style={{
            background: isDragging ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.04)',
            border: isDragging ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(255,255,255,0.06)',
            boxShadow: isDragging ? '0 0 30px rgba(139,92,246,0.2)' : 'none',
          }}
        >
          <UploadCloud className={`w-8 h-8 transition-colors ${isDragging ? 'text-violet-400' : 'text-slate-600'}`} />
        </div>
        {isDragging && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>
            <span className="text-white text-xs">+</span>
          </div>
        )}
      </div>

      <h3 className={`text-base font-semibold mb-1.5 transition-colors ${isDragging ? 'text-violet-300' : 'text-slate-300'}`}>
        {isDragging ? 'Release to upload' : 'Upload PDF document'}
      </h3>
      <p className="text-sm text-slate-600 max-w-xs">
        Drag and drop your file here, or <span className="text-violet-400 hover:text-violet-300">browse</span>. Max 50MB.
      </p>
      <div className="flex items-center gap-4 mt-5 text-xs text-slate-700">
        <span>PDF only</span>
        <span>·</span>
        <span>Up to 50MB</span>
        <span>·</span>
        <span>AI-powered extraction</span>
      </div>
    </div>
  );
}
