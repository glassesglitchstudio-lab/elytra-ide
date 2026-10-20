import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  Plus,
  Shield,
  Mic,
  ArrowUp,
  FileCode,
  Terminal,
  Sparkles,
  Bot,
  User,
  FolderOpen,
  Check,
  Code2,
  Sliders,
  Brain,
  Zap,
} from 'lucide-react';
import { ElythraLogo } from './icons/ElythraLogo';
import { useElythraStore } from '../store/useElythraStore';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { PermissionMode, ThinkingLevel } from '../../types/elythra';

const AVAILABLE_MODELS = [
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'Google', tag: 'Fast & Deep' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google', tag: 'Reasoning' },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', tag: 'Coding' },
  { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet', provider: 'Anthropic', tag: 'Hybrid Thinking' },
  { id: 'deepseek-r1', name: 'DeepSeek R1', provider: 'DeepSeek', tag: 'Reasoning' },
  { id: 'deepseek-chat', name: 'DeepSeek V3', provider: 'DeepSeek', tag: 'Fast Chat' },
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', provider: 'Groq', tag: 'Groq LPU' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', tag: 'Multimodal' },
  { id: 'elythra-builtin', name: 'Elythra Autonomous', provider: 'Built-in', tag: 'Zero-Key Engine' },
];

const THINKING_LEVELS: ThinkingLevel[] = ['Low', 'Medium', 'High'];

const PERMISSION_MODES: { id: PermissionMode; label: string; desc: string }[] = [
  { id: 'Default', label: 'Default', desc: 'Ask confirmation before changes' },
  { id: 'Plan only', label: 'Plan only', desc: 'Output roadmap without modifying files' },
  { id: 'Auto-approve', label: 'Auto-approve', desc: 'Apply diffs and tool calls automatically' },
];

const SLASH_COMMANDS = [
  { cmd: '/explain', desc: 'Explain code architecture and flow', icon: Sparkles },
  { cmd: '/fix', desc: 'Find and repair linter or runtime errors', icon: Terminal },
  { cmd: '/test', desc: 'Write comprehensive unit test cases', icon: FileCode },
  { cmd: '/refactor', desc: 'Clean, optimize and restructure code', icon: Sparkles },
  { cmd: '/commit', desc: 'Generate conventional git commit message', icon: Terminal },
  { cmd: '/docs', desc: 'Write docstrings and markdown documentation', icon: FileCode },
];

const QUICK_ACTIONS = [
  { label: 'Explain codebase architecture', prompt: '/explain Explain the overall architecture and main entry points of this project.' },
  { label: 'Scan and fix errors', prompt: '/fix Scan the open files and suggest fixes for any syntax or runtime bugs.' },
  { label: 'Generate unit tests', prompt: '/test Write comprehensive unit test coverage for the core functions.' },
  { label: 'Refactor for performance', prompt: '/refactor Analyze the code and suggest modular, performant refactoring.' },
];

export const HomeScreen: React.FC = () => {
  const {
    projects,
    activeProject,
    openProject,
    conversations,
    activeConversationId,
    sendMessage,
    isGenerating,
    streamingContent,
    selectedModel,
    setSelectedModel,
    thinkingLevel,
    setThinkingLevel,
    permissionMode,
    setPermissionMode,
    startNewConversation,
  } = useElythraStore();

  const [input, setInput] = useState('');
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showThinkingDropdown, setShowThinkingDropdown] = useState(false);
  const [showPermDropdown, setShowPermDropdown] = useState(false);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConvo = conversations.find((c) => c.id === activeConversationId);
  const messages = activeConvo?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);

    // Auto resize textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(220, Math.max(52, textareaRef.current.scrollHeight))}px`;
    }

    if (val.endsWith('@')) {
      setShowMentionMenu(true);
      setShowSlashMenu(false);
    } else if (!val.includes('@')) {
      setShowMentionMenu(false);
    }

    if (val.startsWith('/') && !val.includes(' ')) {
      setShowSlashMenu(true);
      setShowMentionMenu(false);
    } else {
      setShowSlashMenu(false);
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
    setShowSlashMenu(false);
    setShowMentionMenu(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = '52px';
    }
  };

  const handleSelectProject = async (pPath: string) => {
    setShowProjectDropdown(false);
    await openProject(pPath);
  };

  const handleOpenFolderPicker = async () => {
    setShowProjectDropdown(false);
    if (!window.elythraAPI) return;
    const folder = await window.elythraAPI.openDirectoryDialog();
    if (folder) {
      await openProject(folder);
    }
  };

  const toggleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this environment.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'tr-TR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? prev + ' ' + transcript : transcript));
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  return (
    <main className="flex-1 h-full bg-[#0e0e0e] overflow-y-auto flex flex-col items-center justify-between p-4 md:p-6 select-text relative">
      {/* Upper Area: Welcome Stage OR Chat Stream */}
      <div className="w-full max-w-[860px] flex-1 flex flex-col justify-center">
        {messages.length === 0 && !streamingContent ? (
          // Antigravity Hero Studio
          <div className="flex flex-col items-center justify-center text-center py-6 select-none animate-fadeIn">
            {/* Official Wings Logo Emblem */}
            <div className="mb-4 relative group">
              <div className="w-20 h-20 rounded-2xl bg-[#141414] border border-[#242424] p-2 flex items-center justify-center shadow-2xl transition-all duration-300 group-hover:border-sky-500/40">
                <ElythraLogo size={64} />
              </div>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-semibold tracking-tight text-[#f0f0f0]">
                Elythra Code
              </h1>
              <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#1c1c1c] text-[#888888] border border-[#2a2a2a]">
                Antigravity Core
              </span>
            </div>

            <p className="text-[14px] text-[#888888] max-w-[520px] leading-relaxed mb-6 font-normal">
              Next-generation autonomous AI pair programmer and desktop code studio.
              Ask architectural questions, write tests, refactor, or edit across your codebase.
            </p>

            {/* Quick Action Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-[700px]">
              {QUICK_ACTIONS.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(action.prompt);
                    textareaRef.current?.focus();
                  }}
                  className="px-3.5 py-1.5 text-[12.5px] bg-[#141414] hover:bg-[#1f1f1f] border border-[#242424] hover:border-[#383838] rounded-full text-[#999999] hover:text-[#f0f0f0] transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Sparkles size={12} className="text-sky-400" />
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Antigravity Chat Message Stream
          <div className="space-y-6 py-4 overflow-y-auto max-h-[calc(100vh-280px)] px-2">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3.5 text-[13.5px] leading-relaxed ${
                  m.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {m.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-[#141414] border border-[#262626] flex items-center justify-center text-white flex-shrink-0 mt-0.5 overflow-hidden shadow-md">
                    <ElythraLogo size={20} />
                  </div>
                )}

                <div
                  className={`max-w-[820px] rounded-2xl p-4 transition-all shadow-md ${
                    m.role === 'user'
                      ? 'bg-[#1e1e1e] border border-[#2c2c2c] text-[#f0f0f0]'
                      : 'bg-[#141414] border border-[#242424] text-[#e5e5e5]'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#222222] select-none text-[11px] text-[#777777]">
                    <span className="font-medium text-[#cccccc] flex items-center gap-1.5">
                      {m.role === 'user' ? 'You' : `Elythra (${m.model || selectedModel})`}
                    </span>
                    <span className="font-mono text-[10px]">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {m.role === 'assistant' ? (
                    <MarkdownRenderer content={m.content} />
                  ) : (
                    <div className="whitespace-pre-wrap leading-relaxed text-[#e5e5e5]">
                      {m.content}
                    </div>
                  )}
                </div>

                {m.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-[#1e1e1e] border border-[#2c2c2c] flex items-center justify-center text-[#aaaaaa] flex-shrink-0 mt-0.5 shadow-md">
                    <User size={15} />
                  </div>
                )}
              </div>
            ))}

            {/* Live Streaming Assistant Message */}
            {streamingContent && (
              <div className="flex gap-3.5 text-[13.5px] leading-relaxed justify-start animate-fadeIn">
                <div className="w-8 h-8 rounded-xl bg-[#141414] border border-[#262626] flex items-center justify-center text-white flex-shrink-0 mt-0.5 overflow-hidden shadow-md">
                  <ElythraLogo size={20} />
                </div>
                <div className="max-w-[820px] rounded-2xl p-4 bg-[#141414] border border-[#242424] text-[#e5e5e5] shadow-md">
                  <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#222222] select-none text-[11px] text-[#777777]">
                    <span className="font-medium text-[#cccccc]">
                      Elythra ({selectedModel})
                    </span>
                    <span className="flex items-center gap-1 text-sky-400 font-mono text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                      Thinking & Streaming
                    </span>
                  </div>
                  <MarkdownRenderer content={streamingContent} isStreaming={true} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Bottom Area: Antigravity Twin Prompt Capsule */}
      <div className="w-full max-w-[860px] pb-3 relative select-none">
        {/* Workspace Pill & Thread Selector */}
        <div className="mb-2 flex items-center justify-between px-1">
          <div className="relative">
            <button
              onClick={() => setShowProjectDropdown(!showProjectDropdown)}
              className="flex items-center gap-1.5 text-[12px] font-medium text-[#888888] hover:text-[#e5e5e5] px-2.5 py-1 rounded-lg hover:bg-[#181818] transition-colors border border-transparent hover:border-[#262626]"
            >
              <FolderOpen size={13} className="text-[#888888]" />
              <span className="truncate max-w-[200px]">{activeProject ? activeProject.name : 'No Folder Open'}</span>
              <ChevronDown size={12} />
            </button>

            {showProjectDropdown && (
              <div className="absolute bottom-full left-0 mb-1 w-64 bg-[#161616] border border-[#262626] rounded-xl py-1 shadow-2xl z-50">
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#777777]">
                  Workspaces
                </div>
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectProject(p.path)}
                    className="w-full text-left px-3 py-1.5 text-[12px] text-[#e5e5e5] hover:bg-[#242424] truncate transition-colors flex items-center gap-2"
                  >
                    <FileCode size={13} className="text-[#888888]" />
                    <span className="truncate">{p.name}</span>
                  </button>
                ))}
                <div className="my-1 border-t border-[#222222]" />
                <button
                  onClick={handleOpenFolderPicker}
                  className="w-full text-left px-3 py-1.5 text-[12px] text-white hover:bg-[#242424] transition-colors flex items-center gap-2"
                >
                  <Plus size={13} />
                  <span>Open Folder...</span>
                </button>
              </div>
            )}
          </div>

          {messages.length > 0 && (
            <button
              onClick={startNewConversation}
              className="text-[11px] text-[#888888] hover:text-white px-2 py-0.5 rounded hover:bg-[#1a1a1a] transition-colors flex items-center gap-1"
            >
              <Plus size={12} />
              <span>New Thread</span>
            </button>
          )}
        </div>

        {/* Slash Command Popover */}
        {showSlashMenu && (
          <div className="absolute bottom-full left-0 mb-2 w-80 bg-[#161616] border border-[#2a2a2a] rounded-xl py-1 shadow-2xl z-50 animate-fadeIn">
            <div className="px-3 py-1.5 text-[10px] font-semibold text-[#777777] uppercase tracking-wider">
              Actions
            </div>
            {SLASH_COMMANDS.map((item) => (
              <button
                key={item.cmd}
                onClick={() => {
                  setInput(item.cmd + ' ');
                  setShowSlashMenu(false);
                  textareaRef.current?.focus();
                }}
                className="w-full text-left px-3 py-2 text-[12.5px] hover:bg-[#242424] transition-colors flex items-center gap-2.5 text-[#e5e5e5]"
              >
                <item.icon size={14} className="text-[#888888]" />
                <span className="font-mono font-medium text-sky-400">{item.cmd}</span>
                <span className="text-[11px] text-[#888888] truncate">{item.desc}</span>
              </button>
            ))}
          </div>
        )}

        {/* Antigravity Prompt Capsule */}
        <div className="bg-[#141414] border border-[#242424] hover:border-[#383838] focus-within:border-[#4f4f4f] focus-within:ring-1 focus-within:ring-white/10 rounded-2xl p-3 shadow-2xl transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask Elythra anything, type @ for files, / for actions..."
            className="w-full min-h-[52px] max-h-[220px] bg-transparent text-[#f0f0f0] placeholder-[#666666] text-[13.5px] resize-none focus:outline-none leading-relaxed select-text font-normal"
          />

          {/* Capsule Bottom Toolbar */}
          <div className="flex items-center justify-between pt-2 border-t border-[#1e1e1e] select-none">
            {/* Left Options Pills */}
            <div className="flex items-center gap-1.5">
              {/* Model Picker Pill */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowModelDropdown(!showModelDropdown);
                    setShowThinkingDropdown(false);
                    setShowPermDropdown(false);
                  }}
                  className="flex items-center gap-1 text-[11px] font-medium text-[#cccccc] hover:text-white px-2.5 py-1 rounded-full bg-[#1c1c1c] hover:bg-[#262626] border border-[#2a2a2a] transition-colors"
                >
                  <Sparkles size={11} className="text-sky-400" />
                  <span className="truncate max-w-[140px]">{selectedModel}</span>
                  <ChevronDown size={11} className="text-[#888888]" />
                </button>

                {showModelDropdown && (
                  <div className="absolute bottom-full left-0 mb-2 w-72 bg-[#161616] border border-[#2a2a2a] rounded-xl py-1 shadow-2xl z-50">
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-[#777777] uppercase tracking-wider">
                      Select Model
                    </div>
                    {AVAILABLE_MODELS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setSelectedModel(m.name);
                          setShowModelDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-[12px] hover:bg-[#242424] transition-colors flex items-center justify-between ${
                          selectedModel === m.name ? 'bg-[#222222] text-white font-medium' : 'text-[#cccccc]'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span>{m.name}</span>
                          <span className="text-[10px] text-[#777777]">{m.provider}</span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1f1f1f] text-[#888888]">
                          {m.tag}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Thinking Budget Pill */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowThinkingDropdown(!showThinkingDropdown);
                    setShowModelDropdown(false);
                    setShowPermDropdown(false);
                  }}
                  className="flex items-center gap-1 text-[11px] font-medium text-[#aaaaaa] hover:text-white px-2 py-1 rounded-full bg-[#181818] hover:bg-[#222222] border border-[#242424] transition-colors"
                >
                  <Brain size={11} className="text-purple-400" />
                  <span>Thinking: {thinkingLevel}</span>
                  <ChevronDown size={11} className="text-[#777777]" />
                </button>

                {showThinkingDropdown && (
                  <div className="absolute bottom-full left-0 mb-2 w-44 bg-[#161616] border border-[#2a2a2a] rounded-xl py-1 shadow-2xl z-50">
                    <div className="px-3 py-1 text-[10px] font-semibold text-[#777777] uppercase tracking-wider">
                      Reasoning Budget
                    </div>
                    {THINKING_LEVELS.map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => {
                          setThinkingLevel(lvl);
                          setShowThinkingDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-[12px] hover:bg-[#242424] transition-colors flex items-center justify-between ${
                          thinkingLevel === lvl ? 'bg-[#222222] text-white font-medium' : 'text-[#cccccc]'
                        }`}
                      >
                        <span>{lvl}</span>
                        {thinkingLevel === lvl && <Check size={12} className="text-sky-400" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Permission Mode Pill */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowPermDropdown(!showPermDropdown);
                    setShowModelDropdown(false);
                    setShowThinkingDropdown(false);
                  }}
                  className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-[#aaaaaa] hover:text-white px-2 py-1 rounded-full bg-[#181818] hover:bg-[#222222] border border-[#242424] transition-colors"
                >
                  <Shield size={11} className="text-emerald-400" />
                  <span>{permissionMode}</span>
                  <ChevronDown size={11} className="text-[#777777]" />
                </button>

                {showPermDropdown && (
                  <div className="absolute bottom-full left-0 mb-2 w-64 bg-[#161616] border border-[#2a2a2a] rounded-xl py-1 shadow-2xl z-50">
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-[#777777] uppercase tracking-wider">
                      Execution Permissions
                    </div>
                    {PERMISSION_MODES.map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => {
                          setPermissionMode(mode.id);
                          setShowPermDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-[12px] hover:bg-[#242424] transition-colors flex flex-col ${
                          permissionMode === mode.id ? 'bg-[#222222] text-white font-medium' : 'text-[#cccccc]'
                        }`}
                      >
                        <span>{mode.label}</span>
                        <span className="text-[10px] text-[#777777]">{mode.desc}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Action Icons & Send Button */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setInput((p) => p + '@')}
                className="p-1.5 text-[#777777] hover:text-white hover:bg-[#222222] rounded-lg transition-colors"
                title="Mention Context (@)"
              >
                <span className="text-[13px] font-mono font-semibold">@</span>
              </button>

              <button
                onClick={() => setInput((p) => p + '/')}
                className="p-1.5 text-[#777777] hover:text-white hover:bg-[#222222] rounded-lg transition-colors"
                title="Actions (/)"
              >
                <span className="text-[13px] font-mono font-semibold">/</span>
              </button>

              <button
                onClick={toggleVoiceInput}
                className={`p-1.5 rounded-lg transition-colors ${
                  isListening
                    ? 'text-red-400 bg-red-950/40 animate-pulse'
                    : 'text-[#777777] hover:text-white hover:bg-[#222222]'
                }`}
                title="Dictate with voice"
              >
                <Mic size={14} />
              </button>

              <button
                onClick={handleSend}
                disabled={!input.trim() || isGenerating}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  input.trim() && !isGenerating
                    ? 'bg-white text-black hover:bg-[#e0e0e0] shadow-md scale-100'
                    : 'bg-[#222222] text-[#555555] cursor-not-allowed'
                }`}
                title="Submit (Enter)"
              >
                <ArrowUp size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
