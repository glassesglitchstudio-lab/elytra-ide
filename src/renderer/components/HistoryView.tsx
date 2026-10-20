import React, { useState } from 'react';
import { History, Search, Trash2, MessageSquare, ArrowRight } from 'lucide-react';
import { useElythraStore } from '../store/useElythraStore';

export const HistoryView: React.FC = () => {
  const { conversations, selectConversation, deleteConversation, setSidebarTab } = useElythraStore();
  const [search, setSearch] = useState('');

  const filtered = conversations.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.messages.some((m) => m.content.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex-1 h-[calc(100vh-44px)] bg-[#111111] overflow-y-auto p-8 select-none">
      <div className="max-w-[800px] mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-[#e5e5e5] flex items-center gap-2">
            <History size={20} /> Conversation History
          </h2>
          <p className="text-[13px] text-[#8a8a8a] mt-1">
            Search, reopen, or manage your previous AI discussions and code generations.
          </p>
        </div>

        {/* Arama */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-3 text-[#8a8a8a]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search through conversations..."
            className="w-full bg-[#161616] border border-[#262626] rounded-btn pl-9 pr-4 py-2 text-[13px] text-[#e5e5e5] focus:outline-none"
          />
        </div>

        {/* Liste */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-[#8a8a8a] text-[13px]">
              No conversations found.
            </div>
          ) : (
            filtered.map((convo) => (
              <div
                key={convo.id}
                onClick={() => {
                  selectConversation(convo.id);
                  setSidebarTab('new-chat');
                }}
                className="p-4 bg-[#161616] border border-[#262626] hover:border-[#383838] rounded-btn cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#222222] flex items-center justify-center text-[#8a8a8a] flex-shrink-0 mt-0.5">
                    <MessageSquare size={15} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[14px] font-medium text-[#e5e5e5] truncate group-hover:text-white">
                      {convo.title}
                    </div>
                    <div className="text-[12px] text-[#8a8a8a] truncate mt-0.5">
                      {convo.messages[convo.messages.length - 1]?.content || 'Empty chat'}
                    </div>
                    <div className="text-[10px] text-[#555555] mt-1">
                      {new Date(convo.updatedAt).toLocaleDateString()} {new Date(convo.updatedAt).toLocaleTimeString()} • {convo.messages.length} messages
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(convo.id);
                    }}
                    className="p-1.5 text-[#8a8a8a] hover:text-red-400 rounded hover:bg-[#222222] opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Conversation"
                  >
                    <Trash2 size={15} />
                  </button>
                  <ArrowRight size={16} className="text-[#555555] group-hover:text-white transition-colors" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
