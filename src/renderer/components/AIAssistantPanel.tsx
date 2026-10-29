import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  ChevronDown,
  Sparkles,
  ArrowUp,
  Brain,
  Shield,
  FolderOpen,
  Plus,
  FileCode,
  Check,
  Undo2,
  Cpu,
} from 'lucide-react';
import { ElythraLogo } from './icons/ElythraLogo';
import { useElythraStore } from '../store/useElythraStore';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { PermissionMode } from '../../types/elythra';

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
    startNewConversation,
    activeDiff,
    acceptDiff,
    rejectDiff,
  } = useElythraStore();

  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConvo = conversations.find((c) => c.id === activeConversationId);
  const messages = activeConvo?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  if (!isAIPanelOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(180, Math.max(48, textareaRef.current.scrollHeight))}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!input.trim() || isGenerating) return;
    sendMessage(input);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '48px';
    }
  };

  return (
    <aside
      style={{ width: `${aiPanelWidth}px` }}
      className="h-full bg-[#080a0f] border-l border-[#181d2a] flex flex-col z-20 flex-shrink-0 select-text"
    >
      {/* Panel Header */}
      <div className="h-9 px-3.5 border-b border-[#181d2a] flex items-center justify-between select-none bg-[#0a0d14]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded flex items-center justify-center text-sky-400">
            <ElythraLogo size={15} />
          </div>
          <span className="text-[12px] font-semibold tracking-wide text-white">
            Elytra Chat
          </span>
          <span className="text-[10px] text-sky-400 font-mono px-2 py-0.5 bg-[#121624] border border-[#202738] rounded-full flex items-center gap-1">
            <Cpu size={9} />
            <span className="truncate max-w-[120px]">{selectedModel}</span>
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={startNewConversation}
            className="p-1 text-[#7e8b9f] hover:text-[#f1f5f9] rounded-lg hover:bg-[#141926] transition-colors"
            title="New Session"
          >
            <Plus size={13} />
          </button>
          <button
            onClick={toggleAIPanel}
            className="p-1 text-[#7e8b9f] hover:text-[#f1f5f9] rounded-lg hover:bg-[#141926] transition-colors"
            title="Close Assistant Panel (Ctrl+L)"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {messages.length === 0 && !streamingContent ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#64748b] select-none">
            <div className="w-12 h-12 rounded-2xl bg-[#0e121c] border border-[#1f2638] flex items-center justify-center mb-3 shadow-inner">
              <ElythraLogo size={28} />
            </div>
            <p className="text-[13px] font-semibold text-[#cbd5e1]">Elytra AI Ready</p>
            <p className="text-[11.5px] text-[#64748b] mt-1.5 max-w-[240px] leading-relaxed">
              Ask questions about your codebase, fix bugs, or request code modifications.
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="text-[13px] leading-relaxed">
              <div className="flex items-center justify-between text-[11px] text-[#64748b] mb-1.5 select-none">
                <span className="font-medium text-[#94a3b8] flex items-center gap-1.5">
                  {m.role === 'user' ? 'You' : `Elytra (${m.model || selectedModel})`}
                </span>
                <span className="font-mono text-[10px]">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div
                className={`p-3.5 rounded-2xl ${
                  m.role === 'user'
                    ? 'bg-[#141926] border border-[#232c40] text-white shadow-sm'
                    : 'bg-[#0d1017] border border-[#1b2234] text-[#e2e8f0]'
                }`}
              >
                {m.role === 'assistant' ? (
                  <MarkdownRenderer content={m.content} />
                ) : (
                  <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                )}
              </div>
            </div>
          ))
        )}

        {streamingContent && (
          <div className="text-[13px] leading-relaxed animate-fadeIn">
            <div className="text-[11px] mb-1.5 font-medium select-none flex items-center gap-1.5 text-sky-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
              Elytra ({selectedModel})
            </div>
            <div className="p-3.5 rounded-2xl bg-[#0d1017] border border-[#1f2638] text-[#e2e8f0]">
              <MarkdownRenderer content={streamingContent} isStreaming={true} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Capsule Input Area with Diff Review Bar */}
      <div className="p-3 border-t border-[#181d2a] bg-[#07090e] select-none">
        {activeDiff && (
          <div className="mb-2.5 p-3 rounded-2xl bg-[#0e121e]/95 border border-sky-500/40 flex items-center justify-between gap-2 shadow-xl animate-fadeIn">
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 flex-shrink-0">
                <FileCode size={14} />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-sky-400 rounded-full border border-[#0e121e] animate-pulse" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11.5px] font-semibold text-white truncate">
                  {activeDiff.name}
                </span>
                <span className="text-[10px] text-[#94a3b8] truncate">
                  Değişiklik yapıldı
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={rejectDiff}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-rose-300 bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/40 transition-colors flex items-center gap-1"
                title="Decline"
              >
                <Undo2 size={11} />
                <span>Decline</span>
              </button>
              <button
                onClick={acceptDiff}
                className="px-3 py-1 rounded-lg text-[11px] font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-sm transition-colors flex items-center gap-1"
                title="Accept"
              >
                <Check size={11} strokeWidth={2.5} />
                <span>Accept</span>
              </button>
            </div>
          </div>
        )}

        <div className="bg-[#0e121c] border border-[#202738] focus-within:border-sky-500/60 focus-within:ring-2 focus-within:ring-sky-500/15 rounded-2xl p-3 shadow-lg transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask anything or request edits..."
            className="w-full min-h-[44px] max-h-[160px] bg-transparent text-[#f8fafc] placeholder-[#5a6578] text-[13px] resize-none focus:outline-none leading-relaxed select-text font-normal"
          />

          <div className="flex items-center justify-between pt-2 border-t border-[#181d2a] mt-1 select-none">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#7e8b9f] font-mono px-2 py-0.5 bg-[#121624] border border-[#202738] rounded-full">
                {thinkingLevel} Budget
              </span>
            </div>

            <button
              onClick={handleSend}
              disabled={!input.trim() || isGenerating}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                input.trim() && !isGenerating
                  ? 'bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-300 hover:to-blue-400 text-white shadow-md shadow-sky-950/40'
                  : 'bg-[#141926] text-[#556070] cursor-not-allowed border border-[#1b2234]'
              }`}
              title="Submit (Enter)"
            >
              <ArrowUp size={13} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
