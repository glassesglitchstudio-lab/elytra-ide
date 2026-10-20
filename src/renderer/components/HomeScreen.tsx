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
  Copy,
  Check,
  ChevronRight,
  Code2,
} from 'lucide-react';
import { ElythraLogo } from './icons/ElythraLogo';
import { useElythraStore } from '../store/useElythraStore';
import type { PermissionMode, ThinkingLevel } from '../../types/elythra';

const AVAILABLE_MODELS = [
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', tag: 'Fast & Deep' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', tag: 'Reasoning' },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', tag: 'Coding' },
  { id: 'deepseek-r1', name: 'DeepSeek R1', tag: 'Reasoning' },
  { id: 'qwen-2.5-coder', name: 'Qwen 2.5 Coder', tag: 'Open Weights' },
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', tag: 'Groq LPU' },
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
    gitStatus,
  } = useElythraStore();

  const [input, setInput] = useState('');
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showPermDropdown, setShowPermDropdown] = useState(false);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <main className="flex-1 h-[calc(100vh-44px)] bg-[#111111] overflow-y-auto flex flex-col items-center justify-between p-6 select-text">
      {/* Üst Alan veya Sohbet Akışı */}
      <div className="w-full max-w-[960px] flex-1 flex flex-col justify-center">
        {messages.length === 0 && !streamingContent ? (
          // Detaylı Karşılama ve Logo Bölümü
          <div className="flex flex-col items-center justify-center text-center py-8 select-none">
            {/* Resmi Elythra Logosu */}
            <div className="mb-4 relative group">
              <div className="w-20 h-20 rounded-2xl bg-[#0f0f0f] border border-[#262626] p-2 flex items-center justify-center shadow-xl">
                <ElythraLogo size={68} />
              </div>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-[#e5e5e5] mb-2 flex items-center gap-2">
              Elythra Code
            </h1>
            <p className="text-[14px] text-[#8a8a8a] max-w-[540px] leading-relaxed mb-6">
              Full-featured AI pair programmer & desktop code studio.
              Ask architectural questions, write tests, refactor, or edit across your codebase.
            </p>

            {/* Hızlı İşlem Hapları (Quick Action Chips) */}
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-[720px]">
              {QUICK_ACTIONS.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(action.prompt);
                    textareaRef.current?.focus();
                  }}
                  className="px-3 py-1.5 text-[12px] bg-[#161616] hover:bg-[#222222] border border-[#262626] hover:border-[#383838] rounded-btn text-[#8a8a8a] hover:text-[#e5e5e5] transition-all flex items-center gap-1.5"
                >
                  <Sparkles size={12} className="text-[#8a8a8a]" />
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Sohbet Akışı
          <div className="space-y-6 py-6 overflow-y-auto max-h-[calc(100vh-300px)] px-2">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 text-[14px] leading-relaxed ${
                  m.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {m.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-[#161616] border border-[#262626] flex items-center justify-center text-white flex-shrink-0 mt-0.5 overflow-hidden">
                    <ElythraLogo size={20} />
                  </div>
                )}
                <div
                  className={`max-w-[780px] p-4 rounded-btn ${
                    m.role === 'user'
                      ? 'bg-[#2a2a2a] text-[#e5e5e5]'
                      : 'bg-[#161616] border border-[#262626] text-[#e5e5e5]'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#222222] select-none text-[11px] text-[#8a8a8a]">
                    <span className="font-medium text-[#e5e5e5]">
                      {m.role === 'user' ? 'You' : `Elythra (${selectedModel})`}
                    </span>
                    {m.role === 'assistant' && (
                      <button
                        onClick={() => handleCopy(m.content, m.id)}
                        className="flex items-center gap-1 hover:text-white"
                      >
                        {copiedId === m.id ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedId === m.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    )}
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                </div>
                {m.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center text-[#8a8a8a] flex-shrink-0 mt-0.5">
                    <User size={16} />
                  </div>
                )}
              </div>
            ))}

            {/* Streaming Yanıt */}
            {streamingContent && (
              <div className="flex gap-3 text-[14px] leading-relaxed justify-start">
                <div className="w-8 h-8 rounded-full bg-[#161616] border border-[#262626] flex items-center justify-center text-white flex-shrink-0 mt-0.5 overflow-hidden">
                  <ElythraLogo size={20} />
                </div>
                <div className="max-w-[780px] p-4 rounded-btn bg-[#161616] border border-[#262626] text-[#e5e5e5]">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#222222] select-none text-[11px] text-[#8a8a8a]">
                    <span className="font-medium text-[#e5e5e5]">
                      Elythra ({selectedModel})
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {streamingContent}
                    <span className="inline-block w-1.5 h-4 ml-1 bg-[#8a8a8a] animate-pulse" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Alt Alan: Proje Seçici & Giriş Kutusu (Maksimum 960px) */}
      <div className="w-full max-w-[960px] pb-4 relative select-none">
        {/* 1. Üstte Küçük Soluk Açılır Menü: "No Project ⌄" */}
        <div className="mb-2 flex items-center justify-between">
          <div className="relative">
            <button
              onClick={() => setShowProjectDropdown(!showProjectDropdown)}
              className="flex items-center gap-1.5 text-[12px] font-medium text-[#8a8a8a] hover:text-[#e5e5e5] px-2.5 py-1 rounded-btn hover:bg-[#1a1a1a] transition-colors border border-transparent hover:border-[#262626]"
            >
              <FolderOpen size={13} className="text-[#8a8a8a]" />
              <span>{activeProject ? activeProject.name : 'No Project'}</span>
              <ChevronDown size={12} />
            </button>

            {showProjectDropdown && (
              <div className="absolute bottom-full left-0 mb-1 w-64 bg-[#161616] border border-[#262626] rounded-btn py-1 shadow-2xl z-50">
                <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#8a8a8a]">
                  Workspace
                </div>
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectProject(p.path)}
                    className="w-full text-left px-3 py-1.5 text-[12px] text-[#e5e5e5] hover:bg-[#2a2a2a] truncate transition-colors flex items-center gap-2"
                  >
                    <FileCode size={13} className="text-[#8a8a8a]" />
                    <span className="truncate">{p.name}</span>
                  </button>
                ))}
                <div className="my-1 border-t border-[#1f1f1f]" />
                <button
                  onClick={handleOpenFolderPicker}
                  className="w-full text-left px-3 py-1.5 text-[12px] text-white hover:bg-[#2a2a2a] transition-colors flex items-center gap-2"
                >
                  <Plus size={13} />
                  <span>Open Folder...</span>
                </button>
              </div>
            )}
          </div>

          {activeProject && (
            <span className="text-[11px] text-[#666666] truncate max-w-[320px]">
              {activeProject.path}
            </span>
          )}
        </div>

        {/* Popover Menüleri: @ mention ve / komutları */}
        {showSlashMenu && (
          <div className="absolute bottom-full left-0 mb-3 w-80 bg-[#161616] border border-[#262626] rounded-btn py-1 shadow-2xl z-50">
            <div className="px-3 py-1.5 text-[11px] font-semibold text-[#8a8a8a] uppercase tracking-wider">
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
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[#2a2a2a] transition-colors"
              >
                <item.icon size={14} className="text-[#8a8a8a]" />
                <div>
                  <div className="text-[13px] font-medium text-[#e5e5e5]">{item.cmd}</div>
                  <div className="text-[11px] text-[#8a8a8a]">{item.desc}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {showMentionMenu && (
          <div className="absolute bottom-full left-0 mb-3 w-80 bg-[#161616] border border-[#262626] rounded-btn py-1 shadow-2xl z-50">
            <div className="px-3 py-1.5 text-[11px] font-semibold text-[#8a8a8a] uppercase tracking-wider">
              Context Mentions
            </div>
            <button
              onClick={() => {
                setInput((prev) => prev + 'Codebase ');
                setShowMentionMenu(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[#2a2a2a] transition-colors"
            >
              <FileCode size={14} className="text-[#8a8a8a]" />
              <div>
                <div className="text-[13px] font-medium text-[#e5e5e5]">@Codebase</div>
                <div className="text-[11px] text-[#8a8a8a]">Include full workspace index</div>
              </div>
            </button>
            <button
              onClick={() => {
                setInput((prev) => prev + 'Git ');
                setShowMentionMenu(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[#2a2a2a] transition-colors"
            >
              <Terminal size={14} className="text-[#8a8a8a]" />
              <div>
                <div className="text-[13px] font-medium text-[#e5e5e5]">@Git</div>
                <div className="text-[11px] text-[#8a8a8a]">Include recent branch diffs and status</div>
              </div>
            </button>
          </div>
        )}

        {/* 2. Büyük Giriş Kutusu (14px yuvarlak, #161616, 1px kenarlık #262626) */}
        <div className="bg-[#161616] border border-[#262626] rounded-input p-3.5 shadow-xl focus-within:border-[#383838] transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={3}
            placeholder="Ask anything, @ to mention, / for actions"
            className="w-full bg-transparent text-[#e5e5e5] placeholder-[#8a8a8a] text-[14px] resize-none focus:outline-none leading-relaxed"
          />

          {/* Kutunun Alt Satırı */}
          <div className="flex items-center justify-between pt-2 border-t border-[#1f1f1f] mt-1 select-none">
            {/* Sol Alt: "+" Butonu ve Model Seçici */}
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  if (window.elythraAPI) {
                    const file = await window.elythraAPI.openFileDialog();
                    if (file) setInput((p) => p + ` @${file.split(/[\\/]/).pop()} `);
                  }
                }}
                className="w-7 h-7 flex items-center justify-center text-[#8a8a8a] hover:text-[#e5e5e5] hover:bg-[#2a2a2a] rounded-btn transition-colors"
                title="Attach file or context"
              >
                <Plus size={16} />
              </button>

              {/* Model Seçici: "Gemini 3.8 Flash High ⌄" */}
              <div className="relative">
                <button
                  onClick={() => setShowModelDropdown(!showModelDropdown)}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-medium text-[#e5e5e5] hover:bg-[#2a2a2a] rounded-btn transition-colors border border-[#262626]"
                >
                  <span>{selectedModel} {thinkingLevel}</span>
                  <ChevronDown size={12} className="text-[#8a8a8a]" />
                </button>

                {showModelDropdown && (
                  <div className="absolute bottom-full left-0 mb-1 w-68 bg-[#161616] border border-[#262626] rounded-btn py-1 shadow-2xl z-50">
                    <div className="px-3 py-1 text-[11px] font-semibold text-[#8a8a8a] uppercase tracking-wider">
                      Model Catalog (BYOK)
                    </div>
                    {AVAILABLE_MODELS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setSelectedModel(m.name)}
                        className={`w-full text-left px-3 py-1.5 text-[12px] flex items-center justify-between transition-colors ${
                          selectedModel === m.name
                            ? 'bg-[#2a2a2a] text-white font-medium'
                            : 'text-[#e5e5e5] hover:bg-[#222222]'
                        }`}
                      >
                        <span>{m.name}</span>
                        <span className="text-[10px] text-[#8a8a8a]">{m.tag}</span>
                      </button>
                    ))}

                    <div className="my-1 border-t border-[#1f1f1f]" />
                    <div className="px-3 py-1 text-[11px] font-semibold text-[#8a8a8a] uppercase tracking-wider">
                      Thinking Depth
                    </div>
                    <div className="flex gap-1 px-3 py-1.5">
                      {THINKING_LEVELS.map((lvl) => (
                        <button
                          key={lvl}
                          onClick={() => setThinkingLevel(lvl)}
                          className={`flex-1 py-1 text-[11px] rounded-btn transition-colors font-medium ${
                            thinkingLevel === lvl
                              ? 'bg-[#2a2a2a] text-white border border-[#383838]'
                              : 'text-[#8a8a8a] hover:bg-[#222222]'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sağ Alt: Kalkan İkonlu "Default ⌄" İzin Menüsü, Mikrofon ve Yuvarlak Gönder Butonu */}
            <div className="flex items-center gap-2">
              {/* İzin Menüsü */}
              <div className="relative">
                <button
                  onClick={() => setShowPermDropdown(!showPermDropdown)}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-medium text-[#8a8a8a] hover:text-[#e5e5e5] hover:bg-[#2a2a2a] rounded-btn transition-colors border border-[#262626]"
                >
                  <Shield size={13} className="text-[#8a8a8a]" />
                  <span>{permissionMode}</span>
                  <ChevronDown size={12} />
                </button>

                {showPermDropdown && (
                  <div className="absolute bottom-full right-0 mb-1 w-64 bg-[#161616] border border-[#262626] rounded-btn py-1 shadow-2xl z-50">
                    <div className="px-3 py-1 text-[11px] font-semibold text-[#8a8a8a] uppercase tracking-wider">
                      Permission Level
                    </div>
                    {PERMISSION_MODES.map((pm) => (
                      <button
                        key={pm.id}
                        onClick={() => {
                          setPermissionMode(pm.id);
                          setShowPermDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 transition-colors ${
                          permissionMode === pm.id
                            ? 'bg-[#2a2a2a] text-white'
                            : 'text-[#e5e5e5] hover:bg-[#222222]'
                        }`}
                      >
                        <div className="text-[12px] font-medium">{pm.label}</div>
                        <div className="text-[11px] text-[#8a8a8a]">{pm.desc}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Mikrofon İkonu */}
              <button
                onClick={toggleVoiceInput}
                className={`w-7 h-7 flex items-center justify-center rounded-btn transition-colors ${
                  isListening
                    ? 'text-red-400 bg-[#2a2a2a] animate-pulse'
                    : 'text-[#8a8a8a] hover:text-[#e5e5e5] hover:bg-[#2a2a2a]'
                }`}
                title="Voice input"
              >
                <Mic size={15} />
              </button>

              {/* Yuvarlak Gönder Butonu (İçinde Ok Olan) */}
              <button
                onClick={handleSend}
                disabled={!input.trim() || isGenerating}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  input.trim() && !isGenerating
                    ? 'bg-[#e5e5e5] text-[#111111] hover:bg-white cursor-pointer'
                    : 'bg-[#262626] text-[#8a8a8a] cursor-not-allowed opacity-60'
                }`}
                title="Send Message"
              >
                <ArrowUp size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
