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
  FolderPlus,
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
  { id: 'elythra-01-pro', name: '0.1-Pro (27B)', provider: 'Kaggle GPU Live', tag: 'Core Model' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'Google', tag: 'Fast Reasoning' },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', tag: 'Coding SOTA' },
  { id: 'deepseek-r1', name: 'DeepSeek R1', provider: 'DeepSeek', tag: 'Deep Thinking' },
  { id: 'deepseek-chat', name: 'DeepSeek V3', provider: 'DeepSeek', tag: 'Fast Chat' },
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', provider: 'Groq', tag: 'Ultra-Fast' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', tag: 'Multimodal' },
];

const THINKING_LEVELS: ThinkingLevel[] = ['Low', 'Medium', 'High'];

const PERMISSION_MODES: { id: PermissionMode; label: string; desc: string }[] = [
  { id: 'Default', label: 'Default', desc: 'Ask confirmation before changes' },
  { id: 'Plan only', label: 'Plan only', desc: 'Output roadmap without modifying files' },
  { id: 'Auto-approve', label: 'Auto-approve', desc: 'Apply diffs and tool calls automatically' },
];

const SLASH_COMMANDS = [
  { cmd: '/explain', desc: 'Kod mimarisini ve çalışma prensiplerini açıkla', icon: Sparkles },
  { cmd: '/fix', desc: 'Çalışma zamanı ve linter hatalarını bulup onar', icon: Terminal },
  { cmd: '/test', desc: 'Kapsamlı birim test senaryoları yaz', icon: FileCode },
  { cmd: '/refactor', desc: 'Kodu temizle, modülerleştir ve optimize et', icon: Sparkles },
  { cmd: '/ue5', desc: 'Unreal Engine 5 C++ & Blueprint oyun mekaniği üret', icon: Code2 },
  { cmd: '/commit', desc: 'Standart git commit mesajı oluştur', icon: Terminal },
];

const QUICK_ACTION_CARDS = [
  {
    icon: FolderPlus,
    iconColor: 'text-sky-400',
    title: 'Yeni Proje Oluştur',
    desc: 'React, Vite, Node veya Python projesi başlat',
    prompt: '/create Yeni bir modern proje veya bileşen iskeleti oluşturmak istiyorum.',
  },
  {
    icon: Code2,
    iconColor: 'text-purple-400',
    title: 'Depo Mimarisi İncele',
    desc: 'Mevcut kod tabanını tara ve mimariyi özetle',
    prompt: '/explain Mevcut projenin mimarisini, veri akışını ve ana giriş noktalarını incele.',
  },
  {
    icon: Terminal,
    iconColor: 'text-emerald-400',
    title: 'Hata Ayıkla & Düzelt',
    desc: 'Çalışma zamanı hatalarını ve lint sorunlarını çöz',
    prompt: '/fix Dosyalardaki sözdizimi, tip ve çalışma zamanı hatalarını tara ve düzelt.',
  },
  {
    icon: Sparkles,
    iconColor: 'text-amber-400',
    title: 'UE 5 Oyun Modülü',
    desc: 'Unreal Engine 5 C++, Python veya Blueprint mantığı',
    prompt: 'Unreal Engine 5 (5.4/5.5) için modern C++ aktör ve gameplay bileşeni oluştur.',
  },
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
  const hasMessages = messages.length > 0 || !!streamingContent;

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
      alert('Sesli tanıma bu tarayıcıda desteklenmiyor.');
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

  // Reusable Unified Prompt Capsule (Antigravity Center & Bottom)
  const renderPromptCapsule = () => (
    <div className="w-full relative select-none">
      {/* Workspace Pill & Thread Selector */}
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="relative">
          <button
            onClick={() => setShowProjectDropdown(!showProjectDropdown)}
            className="flex items-center gap-1.5 text-[12px] font-medium text-[#888888] hover:text-[#e5e5e5] px-2.5 py-1 rounded-lg hover:bg-[#1a1c22] transition-colors border border-[#222530]"
          >
            <FolderOpen size={13} className="text-sky-400" />
            <span className="truncate max-w-[220px]">
              {activeProject ? activeProject.name : 'Çalışma Alanı Seç'}
            </span>
            <ChevronDown size={12} className="text-[#666666]" />
          </button>

          {showProjectDropdown && (
            <div className="absolute bottom-full left-0 mb-1 w-64 bg-[#14161b] border border-[#262a36] rounded-xl py-1 shadow-2xl z-50">
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#777777]">
                Mevcut Projeler
              </div>
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectProject(p.path)}
                  className="w-full text-left px-3 py-1.5 text-[12px] text-[#e5e5e5] hover:bg-[#222634] truncate transition-colors flex items-center gap-2"
                >
                  <FileCode size={13} className="text-sky-400" />
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
              <div className="my-1 border-t border-[#20232e]" />
              <button
                onClick={handleOpenFolderPicker}
                className="w-full text-left px-3 py-1.5 text-[12px] text-white hover:bg-[#222634] transition-colors flex items-center gap-2"
              >
                <Plus size={13} className="text-emerald-400" />
                <span>Klasör Aç...</span>
              </button>
            </div>
          )}
        </div>

        {hasMessages && (
          <button
            onClick={startNewConversation}
            className="text-[11px] text-[#888888] hover:text-white px-2.5 py-1 rounded-lg hover:bg-[#1a1c22] border border-[#222530] transition-colors flex items-center gap-1"
          >
            <Plus size={12} />
            <span>Yeni Oturum</span>
          </button>
        )}
      </div>

      {/* Slash Command Popover */}
      {showSlashMenu && (
        <div className="absolute bottom-full left-0 mb-2 w-80 bg-[#14161b] border border-[#2a2f3f] rounded-xl py-1 shadow-2xl z-50 animate-fadeIn">
          <div className="px-3 py-1.5 text-[10px] font-semibold text-[#777777] uppercase tracking-wider">
            Hızlı Komutlar
          </div>
          {SLASH_COMMANDS.map((item) => (
            <button
              key={item.cmd}
              onClick={() => {
                setInput(item.cmd + ' ');
                setShowSlashMenu(false);
                textareaRef.current?.focus();
              }}
              className="w-full text-left px-3 py-2 text-[12.5px] hover:bg-[#222634] transition-colors flex items-center gap-2.5 text-[#e5e5e5]"
            >
              <item.icon size={14} className="text-sky-400" />
              <span className="font-mono font-medium text-sky-400">{item.cmd}</span>
              <span className="text-[11px] text-[#888888] truncate">{item.desc}</span>
            </button>
          ))}
        </div>
      )}

      {/* Antigravity Prompt Capsule */}
      <div className="bg-[#13151b] border border-[#232733] hover:border-[#383f52] focus-within:border-sky-500/50 focus-within:ring-1 focus-within:ring-sky-500/20 rounded-2xl p-3 shadow-2xl transition-all">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Elythra'ya herhangi bir şey sor, dosya için @, komutlar için / yaz..."
          className="w-full min-h-[56px] max-h-[220px] bg-transparent text-[#f0f2f5] placeholder-[#6b7280] text-[14px] resize-none focus:outline-none leading-relaxed select-text font-normal"
        />

        {/* Capsule Bottom Toolbar */}
        <div className="flex items-center justify-between pt-2.5 border-t border-[#1d212b] select-none">
          {/* Left Options Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Model Picker Pill */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowModelDropdown(!showModelDropdown);
                  setShowThinkingDropdown(false);
                  setShowPermDropdown(false);
                }}
                className="flex items-center gap-1 text-[11px] font-medium text-[#d1d5db] hover:text-white px-2.5 py-1 rounded-full bg-[#1c202a] hover:bg-[#262c3a] border border-[#2a3040] transition-colors"
              >
                <Sparkles size={11} className="text-sky-400" />
                <span className="truncate max-w-[140px]">{selectedModel}</span>
                <ChevronDown size={11} className="text-[#888888]" />
              </button>

              {showModelDropdown && (
                <div className="absolute bottom-full left-0 mb-2 w-72 bg-[#14161b] border border-[#2a2f3f] rounded-xl py-1 shadow-2xl z-50">
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-[#777777] uppercase tracking-wider">
                    Model Seçin (BYOK)
                  </div>
                  {AVAILABLE_MODELS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setSelectedModel(m.name);
                        setShowModelDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-[12px] hover:bg-[#222634] transition-colors flex items-center justify-between ${
                        selectedModel === m.name ? 'bg-[#222634] text-white font-medium' : 'text-[#cccccc]'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span>{m.name}</span>
                        <span className="text-[10px] text-[#777777]">{m.provider}</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1c202a] text-[#888888]">
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
                className="flex items-center gap-1 text-[11px] font-medium text-[#9ca3af] hover:text-white px-2 py-1 rounded-full bg-[#181a22] hover:bg-[#222634] border border-[#262a38] transition-colors"
              >
                <Brain size={11} className="text-purple-400" />
                <span>Thinking: {thinkingLevel}</span>
                <ChevronDown size={11} className="text-[#777777]" />
              </button>

              {showThinkingDropdown && (
                <div className="absolute bottom-full left-0 mb-2 w-48 bg-[#14161b] border border-[#2a2f3f] rounded-xl py-1 shadow-2xl z-50">
                  <div className="px-3 py-1 text-[10px] font-semibold text-[#777777] uppercase tracking-wider">
                    Düşünme Bütçesi
                  </div>
                  {THINKING_LEVELS.map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => {
                        setThinkingLevel(lvl);
                        setShowThinkingDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-[12px] hover:bg-[#222634] transition-colors flex items-center justify-between ${
                        thinkingLevel === lvl ? 'bg-[#222634] text-white font-medium' : 'text-[#cccccc]'
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
                className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-[#9ca3af] hover:text-white px-2 py-1 rounded-full bg-[#181a22] hover:bg-[#222634] border border-[#262a38] transition-colors"
              >
                <Shield size={11} className="text-emerald-400" />
                <span>{permissionMode}</span>
                <ChevronDown size={11} className="text-[#777777]" />
              </button>

              {showPermDropdown && (
                <div className="absolute bottom-full left-0 mb-2 w-64 bg-[#14161b] border border-[#2a2f3f] rounded-xl py-1 shadow-2xl z-50">
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-[#777777] uppercase tracking-wider">
                    Çalıştırma İzin Modu
                  </div>
                  {PERMISSION_MODES.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => {
                        setPermissionMode(mode.id);
                        setShowPermDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-[12px] hover:bg-[#222634] transition-colors flex flex-col ${
                        permissionMode === mode.id ? 'bg-[#222634] text-white font-medium' : 'text-[#cccccc]'
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
              className="p-1.5 text-[#777777] hover:text-white hover:bg-[#222634] rounded-lg transition-colors"
              title="Bağlam Ekle (@)"
            >
              <span className="text-[13px] font-mono font-semibold">@</span>
            </button>

            <button
              onClick={() => setInput((p) => p + '/')}
              className="p-1.5 text-[#777777] hover:text-white hover:bg-[#222634] rounded-lg transition-colors"
              title="Hızlı Komutlar (/)"
            >
              <span className="text-[13px] font-mono font-semibold">/</span>
            </button>

            <button
              onClick={toggleVoiceInput}
              className={`p-1.5 rounded-lg transition-colors ${
                isListening
                  ? 'text-red-400 bg-red-950/40 animate-pulse'
                  : 'text-[#777777] hover:text-white hover:bg-[#222634]'
              }`}
              title="Sesle komut ver"
            >
              <Mic size={14} />
            </button>

            <button
              onClick={handleSend}
              disabled={!input.trim() || isGenerating}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                input.trim() && !isGenerating
                  ? 'bg-white text-black hover:bg-[#e0e0e0] shadow-md scale-100'
                  : 'bg-[#232733] text-[#555555] cursor-not-allowed'
              }`}
              title="Gönder (Enter)"
            >
              <ArrowUp size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <main className="flex-1 h-full bg-[#0c0e12] overflow-hidden flex flex-col items-center relative select-text">
      {/* Background Subtle Antigravity Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-sky-500/5 blur-[120px] pointer-events-none" />

      {/* IF NO CONVERSATION ACTIVE: Centered Antigravity Hero Studio */}
      {!hasMessages ? (
        <div className="flex-1 w-full overflow-y-auto flex items-center justify-center p-4 md:p-6">
          <div className="w-full max-w-[780px] flex flex-col items-center justify-center select-none animate-fadeIn py-4">
            {/* Official Emblem */}
            <div className="mb-4 relative group">
              <div className="w-18 h-18 rounded-2xl bg-[#14161c] border border-[#242834] p-3 flex items-center justify-center shadow-2xl transition-all duration-300 group-hover:border-sky-500/40">
                <ElythraLogo size={56} />
              </div>
            </div>

            {/* Heading */}
            <h1 className="text-3xl font-semibold tracking-tight text-[#f3f4f6] mb-2 text-center">
              Bugün ne inşa ediyoruz?
            </h1>

            <p className="text-[13.5px] text-[#8e96a4] max-w-[540px] leading-relaxed mb-6 text-center font-normal">
              Otonom yapay zeka kodlama stüdyosu. Mimariyi planlayın, tam teşekküllü kod yazın veya hata ayıklayın.
            </p>

            {/* Prompt Capsule in Center */}
            {renderPromptCapsule()}

            {/* 4 Quick Action Cards (2x2 Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-4">
              {QUICK_ACTION_CARDS.map((card, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(card.prompt);
                    textareaRef.current?.focus();
                  }}
                  className="p-3.5 bg-[#12141a] hover:bg-[#1a1d26] border border-[#202430] hover:border-[#333a4c] rounded-xl text-left transition-all flex items-start gap-3 group shadow-sm"
                >
                  <div className="p-2 rounded-lg bg-[#181b24] border border-[#262b3a] group-hover:border-sky-500/30 transition-colors flex-shrink-0 mt-0.5">
                    <card.icon size={16} className={card.iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-[#e5e7eb] group-hover:text-white transition-colors">
                      {card.title}
                    </div>
                    <div className="text-[11.5px] text-[#717888] line-clamp-1 mt-0.5">
                      {card.desc}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Bottom Minimalist Status Line */}
            <div className="mt-8 text-[11px] font-mono text-[#616878] flex items-center gap-2">
              <span>Elythra 0.1-Pro</span>
              <span>·</span>
              <span>Qwen 27B / 72B Core</span>
              <span>·</span>
              <span>BYOK Ready</span>
              <span>·</span>
              <span className="text-emerald-400/80">Autonomous Engine</span>
            </div>
          </div>
        </div>
      ) : (
        /* IF CONVERSATION ACTIVE: Standard Antigravity Stream with Pinned Bottom Capsule */
        <div className="w-full max-w-[840px] flex-1 flex flex-col h-full overflow-hidden">
          {/* Chat Message Stream */}
          <div className="flex-1 space-y-6 py-4 overflow-y-auto px-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 text-[13.5px] leading-relaxed ${
                  m.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {m.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-[#14161c] border border-[#242834] flex items-center justify-center text-white flex-shrink-0 mt-0.5 overflow-hidden shadow-md">
                    <ElythraLogo size={20} />
                  </div>
                )}

                <div
                  className={`max-w-[760px] rounded-2xl p-4 transition-all shadow-md ${
                    m.role === 'user'
                      ? 'bg-[#1a1d26] border border-[#2a2f3f] text-[#f3f4f6]'
                      : 'bg-[#12141a] border border-[#202430] text-[#e5e7eb]'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#1c202a] select-none text-[11px] text-[#717888]">
                    <span className="font-medium text-[#d1d5db] flex items-center gap-1.5">
                      {m.role === 'user' ? 'Siz' : `Elythra (${m.model || selectedModel})`}
                    </span>
                    <span className="font-mono text-[10px]">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {m.role === 'assistant' ? (
                    <MarkdownRenderer content={m.content} />
                  ) : (
                    <div className="whitespace-pre-wrap leading-relaxed text-[#f3f4f6]">
                      {m.content}
                    </div>
                  )}
                </div>

                {m.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-[#1a1d26] border border-[#2a2f3f] flex items-center justify-center text-[#aaaaaa] flex-shrink-0 mt-0.5 shadow-md">
                    <User size={15} />
                  </div>
                )}
              </div>
            ))}

            {/* Live Streaming Assistant Message */}
            {streamingContent && (
              <div className="flex gap-3 text-[13.5px] leading-relaxed justify-start animate-fadeIn">
                <div className="w-8 h-8 rounded-xl bg-[#14161c] border border-[#242834] flex items-center justify-center text-white flex-shrink-0 mt-0.5 overflow-hidden shadow-md">
                  <ElythraLogo size={20} />
                </div>
                <div className="max-w-[760px] rounded-2xl p-4 bg-[#12141a] border border-[#202430] text-[#e5e7eb] shadow-md">
                  <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#1c202a] select-none text-[11px] text-[#717888]">
                    <span className="font-medium text-[#d1d5db]">
                      Elythra ({selectedModel})
                    </span>
                    <span className="flex items-center gap-1 text-sky-400 font-mono text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                      Düşünüyor & Yazıyor
                    </span>
                  </div>
                  <MarkdownRenderer content={streamingContent} isStreaming={true} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Fixed Prompt Capsule */}
          <div className="p-3 bg-[#0c0e12]/95 backdrop-blur-md border-t border-[#1c202a]">
            {renderPromptCapsule()}
          </div>
        </div>
      )}
    </main>
  );
};
