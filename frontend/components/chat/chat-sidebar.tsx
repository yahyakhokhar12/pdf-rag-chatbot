import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, MoreVertical, Search, Edit2, Pin, Trash2, X, MessageSquarePlus } from 'lucide-react';
import { chatService, Conversation } from '@/services/chat-service';
import { formatDate } from '@/lib/utils';
import { useRouter, useParams } from 'next/navigation';

interface ChatSidebarProps {
  conversations: Conversation[];
  isLoading: boolean;
}

export function ChatSidebar({ conversations, isLoading }: ChatSidebarProps) {
  const [search, setSearch] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const currentId = params.id as string;
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => chatService.updateConversation(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => chatService.deleteConversation(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['conversations'] });
      const previous = queryClient.getQueryData<any>(['conversations']);
      queryClient.setQueryData<any>(['conversations'], (old: any) => {
        if (!old?.conversations) return old;
        return {
          ...old,
          conversations: old.conversations.filter((conversation: Conversation) => conversation.id !== id),
          total: Math.max(0, (old.total || 0) - 1),
        };
      });
      return { previous };
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      if (currentId === id) router.push('/chat');
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['conversations'], context.previous);
      }
      alert('Could not delete this chat. Please try again.');
    },
  });

  const filtered = conversations.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));
  const pinned = filtered.filter(c => c.is_pinned);
  const unpinned = filtered.filter(c => !c.is_pinned);

  return (
    <div className="chat-history-panel w-72 flex-col h-full hidden lg:flex shrink-0">
      {/* Header */}
      <div className="p-4 flex justify-between items-center shrink-0"
           style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div>
          <span className="font-semibold text-slate-100 text-sm">Chat History</span>
          <p className="text-[11px] text-slate-600 mt-0.5">{conversations.length} conversations</p>
        </div>
        <button
          onClick={() => router.push('/chat')}
          className="p-2 rounded-lg text-slate-400 hover:text-teal-200 hover:bg-teal-500/10 transition-all border border-transparent hover:border-teal-400/20"
          title="New Chat"
        >
          <MessageSquarePlus className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-3 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
          <input
            type="text"
            placeholder="Search history..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm text-slate-300 placeholder-slate-600 pl-8 pr-3 py-2 rounded-lg focus:outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = 'rgba(45, 212, 191, 0.32)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(45, 212, 191, 0.08)';
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-4">
        {isLoading ? (
          <div className="space-y-2 px-2 mt-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-14 rounded-xl animate-pulse"
                   style={{ background: 'rgba(255,255,255,0.03)' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-8 h-8 text-slate-700 mx-auto mb-2" />
            <p className="text-sm text-slate-600">{search ? 'No matches found' : 'No conversations yet'}</p>
            <p className="text-xs text-slate-700 mt-1">Start a new chat above</p>
          </div>
        ) : (
          <>
            {pinned.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2 mt-2">Pinned</p>
                <div className="space-y-0.5">
                  {pinned.map(c => (
                    <ConversationItem
                      key={c.id}
                      conversation={c}
                      isCurrent={currentId === c.id}
                      activeMenu={activeMenu}
                      setActiveMenu={setActiveMenu}
                      onUpdate={updateMutation.mutate}
                      onDelete={deleteMutation.mutate}
                      router={router}
                    />
                  ))}
                </div>
              </div>
            )}
            {unpinned.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2 mt-2">Recent</p>
                <div className="space-y-0.5">
                  {unpinned.map(c => (
                    <ConversationItem
                      key={c.id}
                      conversation={c}
                      isCurrent={currentId === c.id}
                      activeMenu={activeMenu}
                      setActiveMenu={setActiveMenu}
                      onUpdate={updateMutation.mutate}
                      onDelete={deleteMutation.mutate}
                      router={router}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ConversationItem({
  conversation: c,
  isCurrent,
  activeMenu,
  setActiveMenu,
  onUpdate,
  onDelete,
  router
}: {
  conversation: Conversation;
  isCurrent: boolean;
  activeMenu: string | null;
  setActiveMenu: (id: string | null) => void;
  onUpdate: (args: { id: string; data: any }) => void;
  onDelete: (id: string) => void;
  router: any;
}) {
  return (
    <div
      className={`chat-history-item group relative flex items-start gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
        isCurrent ? 'text-teal-200 is-current' : 'text-slate-400 hover:text-slate-200'
      }`}
      style={{
        background: isCurrent ? 'rgba(20, 184, 166, 0.1)' : 'transparent',
        border: isCurrent ? '1px solid rgba(45, 212, 191, 0.2)' : '1px solid transparent',
      }}
      onMouseEnter={e => { if (!isCurrent) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
      onMouseLeave={e => { if (!isCurrent) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
      onClick={() => { if (!isCurrent) router.push(`/chat/${c.id}`); }}
    >
      <MessageSquare className={`w-3.5 h-3.5 mt-1 shrink-0 ${isCurrent ? 'text-teal-300' : 'text-slate-600 group-hover:text-slate-400'}`} />
      <div className="flex-1 min-w-0 pr-5">
        <p className={`text-sm truncate ${isCurrent ? 'font-medium' : ''}`}>{c.title}</p>
        <p className="text-xs text-slate-600 mt-0.5">{formatDate(c.updated_at)} · {c.message_count} msgs</p>
      </div>

      {/* Context menu trigger */}
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === c.id ? null : c.id); }}
          className="p-1 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-colors"
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </button>

        {activeMenu === c.id && (
          <div
            className="absolute right-0 top-full mt-1 w-36 rounded-xl shadow-2xl z-20 py-1 overflow-hidden animate-scale-in"
            style={{ background: 'rgba(5, 16, 19, 0.98)', border: '1px solid rgba(45, 212, 191, 0.16)' }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => { onUpdate({ id: c.id, data: { is_pinned: !c.is_pinned } }); setActiveMenu(null); }}
              className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/5 flex items-center gap-2 transition-colors"
            >
              <Pin className="w-3 h-3 text-teal-300" /> {c.is_pinned ? 'Unpin' : 'Pin'}
            </button>
            <button
              onClick={() => {
                const newTitle = prompt('New title:', c.title);
                if (newTitle && newTitle !== c.title) onUpdate({ id: c.id, data: { title: newTitle } });
                setActiveMenu(null);
              }}
              className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/5 flex items-center gap-2 transition-colors"
            >
              <Edit2 className="w-3 h-3 text-blue-400" /> Rename
            </button>
            <div className="my-1 border-t border-white/[0.05]" />
            <button
              onClick={() => {
                if (confirm('Delete this conversation?')) onDelete(c.id);
                setActiveMenu(null);
              }}
              className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/5 flex items-center gap-2 transition-colors"
            >
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
