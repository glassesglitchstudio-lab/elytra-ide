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
  Key,
  AlertCircle,
  Settings,
  Undo2,
  Copy,
  Search,
  Globe,
} from 'lucide-react';
import { ElythraLogo } from './icons/ElythraLogo';
import { useElythraStore } from '../store/useElythraStore';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { PermissionMode, ThinkingLevel } from '../../types/elythra';

interface ModelItem {
  id: string;
  name: string;
  provider: string;
  tag: string;
  category: 'free' | 'core' | 'pro' | 'zen' | 'copilot';
}

const AVAILABLE_MODELS: ModelItem[] = [
  // 1. GitHub Copilot (OAuth & Device Auth)
  {
    id: 'copilot/claude-3.7-sonnet',
    name: 'Copilot Claude 3.7 Sonnet',
    provider: 'GitHub Copilot',
    tag: 'OAuth Pro',
    category: 'copilot',
  },
  {
    id: 'copilot/claude-3.5-sonnet',
    name: 'Copilot Claude 3.5 Sonnet',
    provider: 'GitHub Copilot',
    tag: 'OAuth Pro',
    category: 'copilot',
  },
  {
    id: 'copilot/gpt-4o',
    name: 'Copilot GPT-4o',
    provider: 'GitHub Copilot',
    tag: 'OAuth Pro',
    category: 'copilot',
  },
  {
    id: 'copilot/o1',
    name: 'Copilot o1 Reasoning',
    provider: 'GitHub Copilot',
    tag: 'OAuth Pro',
    category: 'copilot',
  },

  // 2. OpenCode Zen Modelleri (Free & Fast AI Gateway)
  {
    id: 'nemotron-3-super-free',
    name: 'Nemotron 3 Super Free (Zen)',
    provider: 'OpenCode Zen',
    tag: 'Zen Free',
    category: 'zen',
  },
  {
    id: 'minimax-m2.5-free',
    name: 'MiniMax M2.5 Free (Zen)',
    provider: 'OpenCode Zen',
    tag: 'Zen Chat',
    category: 'zen',
  },
  {
    id: 'big-pickle',
    name: 'Big Pickle (Zen)',
    provider: 'OpenCode Zen',
    tag: 'Zen Mantık',
    category: 'zen',
  },
  {
    id: 'qwen3.5-plus',
    name: 'Qwen 3.5 Plus (Zen)',
    provider: 'OpenCode Zen',
    tag: 'Zen Pro',
    category: 'zen',
  },

  // 3. Ücretsiz OpenRouter & Cloud Free Tier Modelleri
  {
    id: 'nvidia/nemotron-3.5-lightning:free',
    name: 'Nemotron 3.5 Lightning',
    provider: 'OpenRouter Free',
    tag: 'Ultra-Hızlı Kod',
    category: 'free',
  },
  {
    id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
    name: 'Nemotron Reasoning 30B',
    provider: 'OpenRouter Free',
    tag: 'Düşünce Zinciri',
    category: 'free',
  },
  {
    id: 'poolside/laguna-s-2.1:free',
    name: 'Laguna 2.1 Coder',
    provider: 'OpenRouter Free',
    tag: 'Mimari & Bugfix',
    category: 'free',
  },
  {
    id: 'minimax/minimax-m3.1-flash:free',
    name: 'MiniMax 3.1 Flash',
    provider: 'OpenRouter Free',
    tag: 'Hafif & Hızlı',
    category: 'free',
  },
  {
    id: 'cerebras/llama3.3-70b',
    name: 'Cerebras Llama 3.3 70B',
    provider: 'Cerebras Cloud',
    tag: '2000+ tok/s',
    category: 'free',
  },
  {
    id: 'sambanova/Qwen2.5-Coder-32B-Instruct',
    name: 'SambaNova Qwen 2.5 Coder',
    provider: 'SambaNova Cloud',
    tag: '100% Free',
    category: 'free',
  },

  // 4. Özel Endpoint / Yerel Model (vLLM / LM Studio / Ollama)
  {
    id: 'custom-endpoint-model',
    name: 'Custom Endpoint Model',
    provider: 'Custom Endpoint',
    tag: 'Custom / vLLM',
    category: 'core',
  },

  // 5. Pro / BYOK Modeller
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic / OR',
    tag: 'Pro Coding',
    category: 'pro',
  },
  {
    id: 'anthropic/claude-3-7-sonnet-20250219',
    name: 'Claude 3.7 Sonnet',
    provider: 'Anthropic',
    tag: 'Thinking/Reasoning',
    category: 'pro',
  },
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek V3',
    provider: 'DeepSeek / OR',
    tag: 'Pro Chat',
    category: 'pro',
  },
  {
    id: 'deepseek/deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'DeepSeek / OR',
    tag: 'Pro Reasoner',
    category: 'pro',
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B',
    provider: 'Groq / OR',
    tag: 'Pro Ultra',
    category: 'pro',
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI / OR',
    tag: 'Pro Multimodal',
    category: 'pro',
  },
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google AI Studio',
    tag: 'Pro Hızlı',
    category: 'pro',
  },
  {
    id: 'mistral/codestral-latest',
    name: 'Codestral',
    provider: 'Mistral AI',
    tag: 'Kod Uzmanı',
    category: 'pro',
  },
  {
    id: 'xai/grok-2-latest',
    name: 'Grok 2',
    provider: 'xAI',
    tag: 'Grok Vision',
    category: 'pro',
  },
  {
    id: 'together/Qwen/Qwen2.5-Coder-32B-Instruct',
    name: 'Together Qwen 2.5 Coder',
    provider: 'Together AI',
    tag: 'Cloud Coder',
    category: 'pro',
  },
  {
    id: 'perplexity/sonar-reasoning',
    name: 'Perplexity Sonar',
    provider: 'Perplexity AI',
    tag: 'Web Reasoner',
    category: 'pro',
  },
  {
    id: 'cohere/command-r-plus-08-2024',
    name: 'Cohere Command R+',
    provider: 'Cohere',
    tag: 'Enterprise RAG',
    category: 'pro',
  },
];

const THINKING_LEVELS: ThinkingLevel[] = ['Low', 'Medium', 'High'];

const PERMISSION_MODES: { id: PermissionMode; label: string; desc: string }[] = [
  { id: 'Default', label: 'Default', desc: 'Ask confirmation before changes' },
  { id: 'Plan only', label: 'Plan only', desc: 'Output roadmap without modifying files' },
  { id: 'Auto-approve', label: 'Auto-approve', desc: 'Apply diffs and tool calls automatically' },
];

const SLASH_COMMANDS = [
  { cmd: '/search', desc: 'Canlı Web & Teknik Dokümantasyon Araması Yap (HN, GitHub, Wikipedia)', icon: Globe },
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
    settings,
    setActiveModal,
    openTabs,
    fileTree,
    activeDiff,
    acceptDiff,
    rejectDiff,
    setActiveView,
  } = useElythraStore();

  const apiKeys = settings?.apiKeys || {};
  const hasCopilot = !!apiKeys.githubCopilot?.trim();
  const hasAnyProvider = hasCopilot || Object.entries(apiKeys).some(([k, val]) => {
    if (k === 'customModel') return false;
    return typeof val === 'string' && val.trim().length > 0;
  });

  const isModelSupported = (m: ModelItem) => {
    if (m.category === 'copilot' || m.provider === 'GitHub Copilot') {
      return !!apiKeys.githubCopilot?.trim();
    }
    if (m.category === 'zen' || m.provider === 'OpenCode Zen') {
      if (m.id.includes('free')) return true;
      return !!(apiKeys.opencodeZen?.trim() || (apiKeys.customEndpoint && apiKeys.customEndpoint.includes('opencode.ai')));
    }
    if (m.provider === 'Cerebras Cloud' || m.id.startsWith('cerebras/')) {
      return !!apiKeys.cerebras?.trim();
    }
    if (m.provider === 'SambaNova Cloud' || m.id.startsWith('sambanova/')) {
      return !!apiKeys.sambanova?.trim();
    }
    if (m.provider === 'OpenRouter Free') {
      return !!apiKeys.openrouter?.trim();
    }
    if (m.category === 'core' || m.provider === 'Custom Endpoint') {
      return !!apiKeys.customEndpoint?.trim();
    }
    if (m.category === 'pro') {
      if (apiKeys.openrouter?.trim()) return true;
      if (m.id.includes('claude') && apiKeys.anthropic?.trim()) return true;
      if (m.id.includes('deepseek') && apiKeys.deepseek?.trim()) return true;
      if (m.id.includes('llama') && (apiKeys.groq?.trim() || apiKeys.cerebras?.trim() || apiKeys.sambanova?.trim())) return true;
      if ((m.id.includes('gpt') || m.id.includes('o1') || m.id.includes('o3')) && apiKeys.openai?.trim()) return true;
      if (m.id.includes('gemini') && apiKeys.gemini?.trim()) return true;
      if (m.id.includes('mistral') || m.id.includes('codestral')) return !!apiKeys.mistral?.trim();
      if (m.id.includes('xai') || m.id.includes('grok')) return !!apiKeys.xai?.trim();
      if (m.id.includes('together')) return !!apiKeys.together?.trim();
      if (m.id.includes('perplexity') || m.id.includes('sonar')) return !!apiKeys.perplexity?.trim();
      if (m.id.includes('cohere')) return !!apiKeys.cohere?.trim();
      return false;
    }
    return false;
  };

  const copilotModels = AVAILABLE_MODELS.filter((m) => m.category === 'copilot' && isModelSupported(m));
  const zenModels = AVAILABLE_MODELS.filter((m) => m.category === 'zen' && isModelSupported(m));
  const freeModels = AVAILABLE_MODELS.filter((m) => m.category === 'free' && isModelSupported(m));
  const coreModels = AVAILABLE_MODELS.filter((m) => m.category === 'core' && isModelSupported(m));
  const proModels = AVAILABLE_MODELS.filter((m) => m.category === 'pro' && isModelSupported(m));
  const allAvailableModels = [...copilotModels, ...zenModels, ...freeModels, ...coreModels, ...proModels];

  const [modelSearch, setModelSearch] = useState('');
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const filterBySearch = (list: ModelItem[]) => {
    if (!modelSearch.trim()) return list;
    const q = modelSearch.toLowerCase();
    return list.filter((m) =>
      m.name.toLowerCase().includes(q) ||
      m.provider.toLowerCase().includes(q) ||
      m.tag.toLowerCase().includes(q)
    );
  };

  useEffect(() => {
    if (hasAnyProvider && allAvailableModels.length > 0) {
      const isValid = allAvailableModels.some((m) => m.name === selectedModel);
      if (!isValid) {
        setSelectedModel(allAvailableModels[0].name);
      }
    }
  }, [hasAnyProvider, allAvailableModels.length, selectedModel]);

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

  // Helper to extract project files for @mention
  const flattenFiles = (items: any[], list: { name: string; path: string }[] = [], depth = 0) => {
    if (depth > 4 || list.length > 50 || !Array.isArray(items)) return list;
    for (const item of items) {
      if (!item.isDirectory) {
        list.push({ name: item.name, path: item.path });
      } else if (item.children && !item.name.startsWith('.') && item.name !== 'node_modules' && item.name !== 'dist') {
        flattenFiles(item.children, list, depth + 1);
      }
    }
    return list;
  };

  const mentionQuery = (input.split('@').pop() || '').toLowerCase().trim();
  const flatProjectFiles = flattenFiles(fileTree || []);
  const isWebMatching = !mentionQuery || 'web'.includes(mentionQuery) || 'internet'.includes(mentionQuery);
  const mentionCandidates = [
    ...(isWebMatching ? [{ name: 'web', path: '@web', isWeb: true, isTab: false }] : []),
    ...(openTabs || []).map((t) => ({ name: t.name, path: t.path, isTab: true, isWeb: false })),
    ...flatProjectFiles.filter((f) => !(openTabs || []).some((t) => t.path === f.path)).map((f) => ({ ...f, isTab: false, isWeb: false })),
  ]
    .filter((f) => f.isWeb || !mentionQuery || f.name.toLowerCase().includes(mentionQuery) || f.path.toLowerCase().includes(mentionQuery))
    .slice(0, 8);

  const handleSelectMention = (fileName: string) => {
    const atIndex = input.lastIndexOf('@');
    if (atIndex !== -1) {
      const nextInput = input.slice(0, atIndex) + `@${fileName} `;
      setInput(nextInput);
    }
    setShowMentionMenu(false);
    textareaRef.current?.focus();
  };

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

  // Floating Review Bar (Cursor / Antigravity Style Accept & Decline)
  const renderDiffBar = () => {
    if (!activeDiff) return null;

    return (
      <div className="mb-3 px-3.5 py-2.5 rounded-xl bg-[#131620]/95 border border-sky-500/40 backdrop-blur-md shadow-2xl flex items-center justify-between gap-3 animate-fadeIn select-none">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 flex-shrink-0">
            <FileCode size={16} />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-sky-400 rounded-full border-2 border-[#131620] animate-pulse" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[12.5px] font-semibold text-white truncate">
                Elytra AI Değişiklik Uyguladı
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-sky-950/70 text-sky-300 border border-sky-800/40 truncate max-w-[200px]">
                {activeDiff.name}
              </span>
            </div>
            <span className="text-[11px] text-[#9ca3af] truncate">
              Değişiklikleri diske kaydetmek için Accept'e, vazgeçmek için Decline'a tıklayın.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setActiveView('editor')}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11.5px] text-sky-400 hover:text-sky-300 hover:bg-sky-950/40 border border-sky-900/40 transition-colors"
            title="Editörde Aç ve İncele"
          >
            <Code2 size={12} />
            <span>Editörde Gör</span>
          </button>

          <button
            onClick={rejectDiff}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-red-400 bg-red-950/40 hover:bg-red-950/70 border border-red-800/40 transition-colors shadow-sm"
            title="Değişiklikleri iptal et ve önceki haline döndür"
          >
            <Undo2 size={13} />
            <span>Decline (Geri Al)</span>
          </button>

          <button
            onClick={acceptDiff}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-medium text-white bg-emerald-600 hover:bg-emerald-500 shadow-md transition-colors"
            title="Değişiklikleri onayla ve diske kaydet"
          >
            <Check size={13} strokeWidth={2.5} />
            <span>Accept (Kabul Et)</span>
          </button>
        </div>
      </div>
    );
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

      {/* Real @ Mention File Popover (Cursor Style) */}
      {showMentionMenu && (
        <div className="absolute bottom-full left-0 mb-2 w-80 bg-[#14161b] border border-[#2a2f3f] rounded-xl py-1.5 shadow-2xl z-50 animate-fadeIn">
          <div className="px-3 py-1 text-[10px] font-semibold text-[#888888] uppercase tracking-wider flex items-center justify-between">
            <span>Bağlam Ekle (@ Dosya)</span>
            <span className="text-[9px] text-[#666666]">Dosya içeriği modele aktarılır</span>
          </div>

          {mentionCandidates.length === 0 ? (
            <div className="px-3 py-3 text-center text-[12px] text-[#777777]">
              Eşleşen dosya bulunamadı
            </div>
          ) : (
            mentionCandidates.map((f) => (
              <button
                key={f.path}
                onClick={() => handleSelectMention(f.name)}
                className="w-full text-left px-3 py-2 text-[12.5px] hover:bg-[#222634] transition-colors flex items-center justify-between text-[#e5e5e5]"
              >
                <div className="flex items-center gap-2 truncate">
                  {f.isWeb ? (
                    <Globe size={13} className="text-emerald-400" />
                  ) : (
                    <FileCode size={13} className={f.isTab ? 'text-sky-400' : 'text-[#888888]'} />
                  )}
                  <span className="font-medium truncate">{f.name}</span>
                </div>
                {f.isWeb && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                    Canlı Web
                  </span>
                )}
                {f.isTab && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-950/60 text-sky-400 border border-sky-800/40">
                    Açık Sekme
                  </span>
                )}
              </button>
            ))
          )}
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
                className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all ${
                  !hasAnyProvider
                    ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30'
                    : 'text-[#d1d5db] hover:text-white bg-[#1c202a] hover:bg-[#262c3a] border-[#2a3040]'
                }`}
              >
                {!hasAnyProvider ? (
                  <Key size={11} className="text-amber-400" />
                ) : (
                  <Sparkles size={11} className="text-sky-400" />
                )}
                <span className="truncate max-w-[140px]">
                  {!hasAnyProvider ? 'Sağlayıcı Yok' : selectedModel}
                </span>
                <ChevronDown size={11} className="text-[#888888]" />
              </button>

              {showModelDropdown && (
                <div className="absolute bottom-full left-0 mb-2 w-84 bg-[#12141a]/95 backdrop-blur-xl border border-[#2a2f3f] rounded-2xl py-1 shadow-2xl z-50 max-h-[420px] overflow-y-auto flex flex-col">
                  {!hasAnyProvider ? (
                    <div className="p-4 text-center space-y-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
                        <Key size={18} />
                      </div>
                      <div className="space-y-1">
                        <div className="text-[13px] font-semibold text-white">Kayıtlı Sağlayıcı Yok</div>
                        <p className="text-[11px] text-[#888888] leading-relaxed">
                          Model seçebilmek ve yanıt alabilmek için önce Ayarlar'dan en az bir API anahtarı (OpenCode Zen, Copilot, Gemini vb.) bağlamalısınız.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setShowModelDropdown(false);
                          setActiveModal('settings');
                        }}
                        className="w-full py-2 px-3 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-[12px] font-medium flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Settings size={13} />
                        <span>Sağlayıcı Bağla (Ayarlar)</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Search Bar at Top of Dropdown */}
                      <div className="p-2 border-b border-[#202534] sticky top-0 bg-[#12141a] z-10">
                        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#181b24] border border-[#262c3e] text-[12px] text-white">
                          <Search size={13} className="text-[#888888] flex-shrink-0" />
                          <input
                            type="text"
                            value={modelSearch}
                            onChange={(e) => setModelSearch(e.target.value)}
                            placeholder="Model veya sağlayıcı ara..."
                            className="bg-transparent text-white placeholder-[#666666] text-[11.5px] w-full focus:outline-none"
                            autoFocus
                          />
                          {modelSearch && (
                            <button
                              onClick={() => setModelSearch('')}
                              className="text-[#888888] hover:text-white text-[11px] px-1"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto">
                        {/* Category -1: GitHub Copilot OAuth */}
                        {filterBySearch(copilotModels).length > 0 && (
                          <div>
                            <div className="px-3 py-1.5 text-[10px] font-semibold text-purple-400 uppercase tracking-wider flex items-center justify-between bg-[#161026]">
                              <span>🔗 GitHub Copilot (OAuth)</span>
                              <span className="text-[9px] bg-purple-950/70 text-purple-300 border border-purple-800/40 px-1 rounded">Abonelik Aktif</span>
                            </div>
                            {filterBySearch(copilotModels).map((m) => (
                              <button
                                key={m.id}
                                onClick={() => {
                                  setSelectedModel(m.name);
                                  setShowModelDropdown(false);
                                  setModelSearch('');
                                }}
                                className={`w-full text-left px-3 py-2 text-[12px] hover:bg-[#221638] transition-colors flex items-center justify-between ${
                                  selectedModel === m.name ? 'bg-[#221638] text-white font-medium border-l-2 border-purple-400' : 'text-[#cccccc]'
                                }`}
                              >
                                <div className="flex flex-col min-w-0">
                                  <span className="truncate">{m.name}</span>
                                  <span className="text-[10px] text-[#777777]">{m.provider}</span>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1e1330] text-purple-300 border border-purple-800/30">
                                    {m.tag}
                                  </span>
                                  {selectedModel === m.name && <Check size={13} className="text-purple-400" />}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Category 0: OpenCode Zen Gateway */}
                        {filterBySearch(zenModels).length > 0 && (
                          <div>
                            <div className="px-3 py-1.5 text-[10px] font-semibold text-cyan-400 uppercase tracking-wider flex items-center justify-between bg-[#0e1920]">
                              <span>⚡ OpenCode Zen Modelleri</span>
                              <span className="text-[9px] bg-cyan-950/70 text-cyan-400 border border-cyan-800/40 px-1 rounded">Ücretsiz Gateway</span>
                            </div>
                            {filterBySearch(zenModels).map((m) => (
                              <button
                                key={m.id}
                                onClick={() => {
                                  setSelectedModel(m.name);
                                  setShowModelDropdown(false);
                                  setModelSearch('');
                                }}
                                className={`w-full text-left px-3 py-2 text-[12px] hover:bg-[#15232c] transition-colors flex items-center justify-between ${
                                  selectedModel === m.name ? 'bg-[#15232c] text-white font-medium border-l-2 border-cyan-400' : 'text-[#cccccc]'
                                }`}
                              >
                                <div className="flex flex-col min-w-0">
                                  <span className="truncate">{m.name}</span>
                                  <span className="text-[10px] text-[#777777]">{m.provider}</span>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#10242a] text-cyan-300 border border-cyan-800/30">
                                    {m.tag}
                                  </span>
                                  {selectedModel === m.name && <Check size={13} className="text-cyan-400" />}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Category 1: Free Tier */}
                        {filterBySearch(freeModels).length > 0 && (
                          <div>
                            <div className="px-3 py-1.5 text-[10px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center justify-between bg-[#0e1a14]">
                              <span>Ücretsiz Cloud & Inference</span>
                              <span className="text-[9px] bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 px-1 rounded">Yüksek Hız</span>
                            </div>
                            {filterBySearch(freeModels).map((m) => (
                              <button
                                key={m.id}
                                onClick={() => {
                                  setSelectedModel(m.name);
                                  setShowModelDropdown(false);
                                  setModelSearch('');
                                }}
                                className={`w-full text-left px-3 py-2 text-[12px] hover:bg-[#16271e] transition-colors flex items-center justify-between ${
                                  selectedModel === m.name ? 'bg-[#16271e] text-white font-medium border-l-2 border-emerald-400' : 'text-[#cccccc]'
                                }`}
                              >
                                <div className="flex flex-col min-w-0">
                                  <span className="truncate">{m.name}</span>
                                  <span className="text-[10px] text-[#777777]">{m.provider}</span>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#13231b] text-emerald-300 border border-emerald-800/30">
                                    {m.tag}
                                  </span>
                                  {selectedModel === m.name && <Check size={13} className="text-emerald-400" />}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Category 2: Core Model */}
                        {filterBySearch(coreModels).length > 0 && (
                          <div>
                            <div className="px-3 pt-2 pb-1 text-[10px] font-semibold text-purple-400 uppercase tracking-wider border-t border-[#202534] bg-[#12141a]">
                              Özel & Yerel Modeller (Custom Endpoint)
                            </div>
                            {filterBySearch(coreModels).map((m) => (
                              <button
                                key={m.id}
                                onClick={() => {
                                  setSelectedModel(m.name);
                                  setShowModelDropdown(false);
                                  setModelSearch('');
                                }}
                                className={`w-full text-left px-3 py-2 text-[12px] hover:bg-[#20172e] transition-colors flex items-center justify-between ${
                                  selectedModel === m.name ? 'bg-[#20172e] text-white font-medium border-l-2 border-purple-400' : 'text-[#cccccc]'
                                }`}
                              >
                                <div className="flex flex-col min-w-0">
                                  <span className="truncate">{m.name}</span>
                                  <span className="text-[10px] text-[#777777]">{m.provider}</span>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#251733] text-purple-300 border border-purple-800/30">
                                    {m.tag}
                                  </span>
                                  {selectedModel === m.name && <Check size={13} className="text-purple-400" />}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Category 3: Pro BYOK */}
                        {filterBySearch(proModels).length > 0 && (
                          <div>
                            <div className="px-3 pt-2 pb-1 text-[10px] font-semibold text-sky-400 uppercase tracking-wider border-t border-[#202534] bg-[#12141a]">
                              Pro Modeller (Kendi Key'iniz / OpenRouter)
                            </div>
                            {filterBySearch(proModels).map((m) => (
                              <button
                                key={m.id}
                                onClick={() => {
                                  setSelectedModel(m.name);
                                  setShowModelDropdown(false);
                                  setModelSearch('');
                                }}
                                className={`w-full text-left px-3 py-2 text-[12px] hover:bg-[#162232] transition-colors flex items-center justify-between ${
                                  selectedModel === m.name ? 'bg-[#162232] text-white font-medium border-l-2 border-sky-400' : 'text-[#cccccc]'
                                }`}
                              >
                                <div className="flex flex-col min-w-0">
                                  <span className="truncate">{m.name}</span>
                                  <span className="text-[10px] text-[#777777]">{m.provider}</span>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1c2230] text-[#9ca3af] border border-[#2c3548]">
                                    {m.tag}
                                  </span>
                                  {selectedModel === m.name && <Check size={13} className="text-sky-400" />}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {modelSearch &&
                          filterBySearch(allAvailableModels).length === 0 && (
                            <div className="p-4 text-center text-[12px] text-[#777777]">
                              "{modelSearch}" ile eşleşen bağlı model bulunamadı.
                            </div>
                          )}
                      </div>

                      <div className="p-2.5 border-t border-[#202534] bg-[#0d0f14] flex items-center justify-between text-[11px] text-[#777777] sticky bottom-0">
                        <span>{allAvailableModels.length} Model Kullanılabilir</span>
                        <button
                          onClick={() => {
                            setShowModelDropdown(false);
                            setActiveModal('settings');
                          }}
                          className="text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1"
                        >
                          <Settings size={11} />
                          <span>Ayarlar</span>
                        </button>
                      </div>
                    </>
                  )}
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
              <div className="absolute -inset-3 bg-gradient-to-r from-sky-500/20 via-purple-500/20 to-emerald-500/20 rounded-3xl blur-2xl opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="relative w-18 h-18 rounded-2xl bg-[#14161c] border border-[#242834] p-3 flex items-center justify-center shadow-2xl transition-all duration-300 group-hover:border-sky-500/40">
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

            {/* Prompt Capsule in Center with Diff Review Bar */}
            {renderDiffBar()}
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
              <span>Elythra Code</span>
              <span>·</span>
              <span>Multi-Model AI Engine</span>
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
                  className={`max-w-[760px] rounded-2xl p-4 transition-all shadow-md group ${
                    m.role === 'user'
                      ? 'bg-[#181b24] border border-[#262c3e] text-[#f3f4f6]'
                      : 'bg-[#111319] border border-[#1f232e] text-[#e5e7eb]'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#1c202a] select-none text-[11px] text-[#717888]">
                    <span className="font-medium text-[#d1d5db] flex items-center gap-1.5">
                      {m.role === 'user' ? 'Siz' : `Elythra (${m.model || selectedModel})`}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px]">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(m.content);
                          setCopiedMsgId(m.id);
                          setTimeout(() => setCopiedMsgId(null), 2000);
                        }}
                        className="opacity-0 group-hover:opacity-100 hover:text-white transition-opacity p-0.5 rounded text-[#717888]"
                        title="İçeriği Kopyala"
                      >
                        {copiedMsgId === m.id ? (
                          <Check size={11} className="text-emerald-400" />
                        ) : (
                          <Copy size={11} />
                        )}
                      </button>
                    </div>
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
            {renderDiffBar()}
            {renderPromptCapsule()}
          </div>
        </div>
      )}
    </main>
  );
};
