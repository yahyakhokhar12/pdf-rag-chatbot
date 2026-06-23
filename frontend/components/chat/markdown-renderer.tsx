import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/5"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose-ai text-slate-200 leading-relaxed text-[15px]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Fix for react-markdown v9: use className to detect code blocks
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const isBlock = !!match;
            const codeString = String(children).replace(/\n$/, '');

            if (isBlock) {
              return (
                <div className="rounded-xl overflow-hidden my-4 border border-white/[0.07]"
                     style={{ background: 'rgba(8, 7, 20, 0.9)' }}>
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]"
                       style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                      </div>
                      <span className="text-xs font-mono text-slate-500 ml-1">{language}</span>
                    </div>
                    <CopyButton text={codeString} />
                  </div>
                  <SyntaxHighlighter
                    style={vscDarkPlus as any}
                    language={language}
                    PreTag="div"
                    customStyle={{
                      margin: 0,
                      padding: '1rem 1.25rem',
                      background: 'transparent',
                      fontSize: '0.85rem',
                      lineHeight: '1.6',
                    }}
                  >
                    {codeString}
                  </SyntaxHighlighter>
                </div>
              );
            }
            return (
              <code className="px-1.5 py-0.5 rounded text-sm font-mono"
                    style={{ 
                      background: 'rgba(139, 92, 246, 0.12)', 
                      color: '#c4b5fd',
                      border: '1px solid rgba(139, 92, 246, 0.15)' 
                    }} {...props}>
                {children}
              </code>
            );
          },
          table({ children, ...props }) {
            return (
              <div className="overflow-x-auto my-4 rounded-xl border border-white/[0.07]">
                <table className="w-full text-left min-w-full m-0" {...props}>
                  {children}
                </table>
              </div>
            );
          },
          th({ children, ...props }) {
            return (
              <th className="px-4 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider border-b border-white/[0.07]"
                  style={{ background: 'rgba(255, 255, 255, 0.03)' }} {...props}>
                {children}
              </th>
            );
          },
          td({ children, ...props }) {
            return (
              <td className="px-4 py-3 text-sm text-slate-300 border-b border-white/[0.04]" {...props}>
                {children}
              </td>
            );
          },
          a({ children, href, ...props }) {
            return (
              <a href={href}
                 className="text-violet-400 hover:text-violet-300 underline decoration-violet-400/40 underline-offset-2 transition-colors"
                 target="_blank" rel="noopener noreferrer" {...props}>
                {children}
              </a>
            );
          },
          blockquote({ children, ...props }) {
            return (
              <blockquote className="border-l-2 border-violet-500/40 pl-4 my-3 text-slate-400 italic" {...props}>
                {children}
              </blockquote>
            );
          },
          h1({ children, ...props }) {
            return <h1 className="text-xl font-bold text-slate-100 mt-4 mb-2" {...props}>{children}</h1>;
          },
          h2({ children, ...props }) {
            return <h2 className="text-lg font-bold text-slate-100 mt-3 mb-2" {...props}>{children}</h2>;
          },
          h3({ children, ...props }) {
            return <h3 className="text-base font-semibold text-slate-200 mt-3 mb-1.5" {...props}>{children}</h3>;
          },
          ul({ children, ...props }) {
            return <ul className="list-disc list-outside ml-4 space-y-1 my-2" {...props}>{children}</ul>;
          },
          ol({ children, ...props }) {
            return <ol className="list-decimal list-outside ml-4 space-y-1 my-2" {...props}>{children}</ol>;
          },
          li({ children, ...props }) {
            return <li className="text-slate-300 leading-relaxed" {...props}>{children}</li>;
          },
          p({ children, ...props }) {
            return <p className="text-slate-300 leading-[1.75] my-1.5" {...props}>{children}</p>;
          },
          strong({ children, ...props }) {
            return <strong className="font-semibold text-slate-100" {...props}>{children}</strong>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
