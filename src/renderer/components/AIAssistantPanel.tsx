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
      className="h-full bg-[#0d0d0d] border-l border-[#1c1c1c] flex flex-col z-20 flex-shrink-0 select-text"
    >
      {/* Panel Header */}
      <div className="h-9 px-3 border-b border-[#1c1c1c] flex items-center justify-between select-none bg-[#0a0a0a]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded flex items-center justify-center">
            <ElythraLogo size={15} />
          </div>
          <span className="text-[12px] font-semibold tracking-wide text-[#e5e5e5]">
            Elythra Assistant
          </span>
          <span className="text-[10px] text-sky-400 font-mono px-1.5 py-0.2 bg-[#161616] border border-[#242424] rounded-full">
            {selectedModel}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={startNewConversation}
            className="p-1 text-[#888888] hover:text-[#e5e5e5] rounded hover:bg-[#1a1a1a] transition-colors"
            title="New Session"
          >
            <Plus size={13} />
          </button>
          <button
            onClick={toggleAIPanel}
            className="p-1 text-[#888888] hover:text-[#e5e5e5] rounded hover:bg-[#1a1a1a] transition-colors"
            title="Close Assistant Panel (Ctrl+L)"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {messages.length === 0 && !streamingContent ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-[#888888] select-none">
            <div className="w-12 h-12 rounded-2xl bg-[#141414] border border-[#242424] flex items-center justify-center mb-3">
              <ElythraLogo size={32} />
            </div>
            <p className="text-[13px] font-medium text-[#f0f0f0]">Agent Ready</p>
            <p className="text-[11.5px] text-[#777777] mt-1 max-w-[240px] leading-relaxed">
              Ask questions about your codebase, fix bugs, or request code modifications.
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="text-[13px] leading-relaxed">
              <div className="flex items-center justify-between text-[11px] text-[#777777] mb-1 select-none">
                <span className="font-medium text-[#cccccc] flex items-center gap-1.5">
                  {m.role === 'user' ? 'You' : `Elythra (${m.model || selectedModel})`}
                </span>
                <span className="font-mono text-[10px]">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div
                className={`p-3 rounded-xl ${
                  m.role === 'user'
                    ? 'bg-[#1e1e1e] border border-[#2c2c2c] text-[#f0f0f0]'
                    : 'bg-[#141414] border border-[#222222] text-[#e5e5e5]'
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
            <div className="text-[11px] text-[#777777] mb-1 font-medium select-none flex items-center gap-1 text-sky-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
              Elythra ({selectedModel})
            </div>
            <div className="p-3 rounded-xl bg-[#141414] border border-[#242424] text-[#e5e5e5]">
              <MarkdownRenderer content={streamingContent} isStreaming={true} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Capsule Input Area */}
      <div className="p-2.5 border-t border-[#1c1c1c] bg-[#0a0a0a] select-none">
        <div className="bg-[#141414] border border-[#242424] focus-within:border-[#383838] focus-within:ring-1 focus-within:ring-white/10 rounded-xl p-2.5 shadow-lg transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask anything or request edits..."
            className="w-full min-h-[44px] max-h-[160px] bg-transparent text-[#f0f0f0] placeholder-[#666666] text-[13px] resize-none focus:outline-none leading-relaxed select-text font-normal"
          />

          <div className="flex items-center justify-between pt-2 border-t border-[#1c1c1c] mt-1 select-none">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#888888] font-mono px-1.5 py-0.5 bg-[#1a1a1a] border border-[#242424] rounded-full">
                {thinkingLevel} Budget
              </span>
            </div>

            <button
              onClick={handleSend}
              disabled={!input.trim() || isGenerating}
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                input.trim() && !isGenerating
                  ? 'bg-white text-black hover:bg-[#e0e0e0] shadow-md'
                  : 'bg-[#222222] text-[#555555] cursor-not-allowed'
              }`}
              title="Submit (Enter)"
            >
              <ArrowUp size={12} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
