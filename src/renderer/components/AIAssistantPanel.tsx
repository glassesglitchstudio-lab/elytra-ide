import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  ChevronDown,
  Plus,
  Shield,
  Mic,
  ArrowUp,
  Bot,
  User,
  Copy,
  Check,
  Code,
} from 'lucide-react';
import { useElythraStore } from '../store/useElythraStore';

export const AIAssistantPanel: React.FC = () => {
  const {
    isAIPanelOpen,
    toggleAIPanel,
    aiPanelWidth,
    conversations,
    activeConversationId,
    sendMessage,
    isGenerating,
    streamingContent,
    selectedModel,
    thinkingLevel,
    permissionMode,
    setPermissionMode,
  } = useElythraStore();

  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConvo = conversations.find((c) => c.id === activeConversationId);
  const messages = activeConvo?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  if (!isAIPanelOpen) return null;

  const handleSend = () => {
    if (!input.trim() || isGenerating) return;
    sendMessage(input);
    setInput('');
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <aside
      style={{ width: `${aiPanelWidth}px` }}
      className="h-full bg-[#0f0f0f] border-l border-[#1f1f1f] flex flex-col z-20 flex-shrink-0 select-text"
    >
      {/* Panel Başlığı */}
      <div className="h-9 px-3 border-b border-[#1f1f1f] flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <Bot size={15} className="text-[#e5e5e5]" />
          <span className="text-[12px] font-semibold tracking-wide text-[#e5e5e5]">
            Elythra Assistant
          </span>
          <span className="text-[10px] text-[#8a8a8a] px-1.5 py-0.5 bg-[#1f1f1f] rounded">
            {selectedModel}
          </span>
        </div>

        <button
          onClick={toggleAIPanel}
          className="p-1 text-[#8a8a8a] hover:text-[#e5e5e5] rounded hover:bg-[#1f1f1f]"
          title="Close AI Panel"
        >
          <X size={14} />
        </button>
      </div>

      {/* Mesaj Akışı */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {messages.length === 0 && !streamingContent ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-[#8a8a8a] select-none">
            <Bot size={24} className="mb-2 text-[#555555]" />
            <p className="text-[13px] font-medium text-[#e5e5e5]">Ready to help</p>
            <p className="text-[11px] text-[#777777] mt-1">
              Ask questions about your codebase, fix bugs, or request code generation.
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="text-[13px] leading-relaxed">
              <div className="flex items-center justify-between text-[11px] text-[#8a8a8a] mb-1 select-none">
                <span className="font-medium text-[#e5e5e5]">
                  {m.role === 'user' ? 'You' : 'Elythra'}
                </span>
                {m.role === 'assistant' && (
                  <button
                    onClick={() => handleCopy(m.content, m.id)}
                    className="p-0.5 hover:text-white"
                  >
                    {copiedId === m.id ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                )}
              </div>
              <div
                className={`p-2.5 rounded-btn whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-[#2a2a2a] text-[#e5e5e5]'
                    : 'bg-[#161616] border border-[#262626] text-[#e5e5e5]'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))
        )}

        {streamingContent && (
          <div className="text-[13px] leading-relaxed">
            <div className="text-[11px] text-[#8a8a8a] mb-1 font-medium select-none">
              Elythra
            </div>
            <div className="p-2.5 rounded-btn bg-[#161616] border border-[#262626] text-[#e5e5e5] whitespace-pre-wrap">
              {streamingContent}
              <span className="inline-block w-1.5 h-3.5 ml-1 bg-[#8a8a8a] animate-pulse" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Alt Giriş Kutusu (Aynı Tasarım) */}
      <div className="p-2.5 border-t border-[#1f1f1f] bg-[#0f0f0f] select-none">
        <div className="bg-[#161616] border border-[#262626] rounded-input p-2.5 shadow-md focus-within:border-[#383838]">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={2}
            placeholder="Ask anything..."
            className="w-full bg-transparent text-[#e5e5e5] placeholder-[#8a8a8a] text-[13px] resize-none focus:outline-none"
          />

          <div className="flex items-center justify-between pt-1.5 border-t border-[#1f1f1f] mt-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-[#8a8a8a] font-medium px-1.5 py-0.5 bg-[#222222] rounded">
                {selectedModel}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleSend}
                disabled={!input.trim() || isGenerating}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  input.trim() && !isGenerating
                    ? 'bg-[#e5e5e5] text-[#111111] hover:bg-white'
                    : 'bg-[#262626] text-[#8a8a8a] opacity-60'
                }`}
              >
                <ArrowUp size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
