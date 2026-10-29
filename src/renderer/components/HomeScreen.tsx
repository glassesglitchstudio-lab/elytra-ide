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
  Cpu,
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
  // 0. Elytra Studio AGI Serisi (0.1-Pro OXYGEN, 0.5-Pro, 1.0-Pro CARBON)
  {
    id: 'elytra/0.1-pro-oxygen',
    name: 'Elytra 0.1-Pro OXYGEN',
    provider: 'Elytra Studio',
    tag: 'AGI Core (DPO-72B)',
    category: 'pro',
  },
  {
    id: 'elytra/0.5-pro-oxygen',
    name: 'Elytra 0.5-Pro OXYGEN',
    provider: 'Elytra Studio',
    tag: 'AGI Native',
    category: 'pro',
  },
  {
    id: 'elytra/1.0-pro-carbon',
    name: 'Elytra 1.0-Pro CARBON 💎',
    provider: 'Elytra Studio',
    tag: 'AGI Flagship',
    category: 'pro',
  },

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
    if (m.provider === 'Elytra Studio') return true;
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

  const elytraModels = AVAILABLE_MODELS.filter((m) => m.provider === 'Elytra Studio');
  const copilotModels = AVAILABLE_MODELS.filter((m) => m.category === 'copilot' && isModelSupported(m));
  const zenModels = AVAILABLE_MODELS.filter((m) => m.category === 'zen' && isModelSupported(m));
  const freeModels = AVAILABLE_MODELS.filter((m) => m.category === 'free' && isModelSupported(m));
  const coreModels = AVAILABLE_MODELS.filter((m) => m.category === 'core' && isModelSupported(m));
  const proModels = AVAILABLE_MODELS.filter((m) => m.category === 'pro' && m.provider !== 'Elytra Studio' && isModelSupported(m));
  const allAvailableModels = [...elytraModels, ...copilotModels, ...zenModels, ...freeModels, ...coreModels, ...proModels];

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
    if (allAvailableModels.length > 0) {
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
      textareaRef.current.style.height = `${Math.min(220, Math.max(58, textareaRef.current.scrollHeight))}px`;
    }

    // Trigger @ mention popover
    if (val.endsWith('@') || (val.includes('@') && !val.endsWith(' '))) {
      setShowMentionMenu(true);
      setShowSlashMenu(false);
    } else {
      setShowMentionMenu(false);
    }

    // Trigger / slash popover
    if (val === '/' || (val.startsWith('/') && !val.includes(' '))) {
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
    setShowMentionMenu(false);
    setShowSlashMenu(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = '58px';
    }
  };

  const handleSelectProject = (projectPath: string) => {
    openProject(projectPath);
    setShowProjectDropdown(false);
  };

  const handleOpenFolderPicker = async () => {
    setShowProjectDropdown(false);
    if (!window.elythraAPI) return;
    const folder = await window.elythraAPI.openDirectoryDialog();
    if (folder) {
      await openProject(folder);
    }
  };

  const toggleSpeechRecognition = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Ses tanıma bu tarayıcı / sistemde desteklenmiyor.');
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

  // Elytra Floating Review Bar (Accept & Decline)
  const renderDiffBar = () => {
    if (!activeDiff) return null;

    return (
      <div className="mb-3 px-4 py-3 rounded-2xl bg-[#0e121e]/95 border border-sky-500/40 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.7),0_0_20px_rgba(56,189,248,0.15)] flex items-center justify-between gap-3 animate-fadeIn select-none">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex-shrink-0 shadow-inner">
            <FileCode size={16} />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-sky-400 rounded-full border-2 border-[#0e121e] animate-pulse" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[12.5px] font-semibold text-white tracking-wide truncate">
                Elytra AI Değişiklik Uyguladı
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-sky-950/80 text-sky-300 border border-sky-700/50 truncate max-w-[200px] shadow-sm">
                {activeDiff.name}
              </span>
            </div>
            <span className="text-[11px] text-[#9ca3af] truncate mt-0.5">
              Değişiklikleri diske kaydetmek için Accept'e, vazgeçmek için Decline'a tıklayın.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setActiveView('editor')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11.5px] font-medium text-sky-300 hover:text-white hover:bg-sky-950/50 border border-sky-800/40 transition-colors shadow-sm"
            title="Editörde Aç ve İncele"
          >
            <Code2 size={13} />
            <span>Editörde Gör</span>
          </button>

          <button
            onClick={rejectDiff}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12px] font-medium text-rose-300 bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/50 transition-all shadow-sm active:scale-95"
            title="Değişiklikleri iptal et ve önceki haline döndür"
          >
            <Undo2 size={13} />
            <span>Decline (Geri Al)</span>
          </button>

          <button
            onClick={acceptDiff}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[12px] font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-md shadow-emerald-950/40 transition-all active:scale-95"
            title="Değişiklikleri onayla ve diske kaydet"
          >
            <Check size={13} strokeWidth={2.5} />
            <span>Accept (Kabul Et)</span>
          </button>
        </div>
      </div>
    );
  };

  // Elytra Unified Prompt Capsule
  const renderPromptCapsule = () => (
    <div className="w-full relative select-none">
      {/* Workspace Pill & Thread Selector */}
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="relative">
          <button
            onClick={() => setShowProjectDropdown(!showProjectDropdown)}
            className="flex items-center gap-1.5 text-[12px] font-medium text-[#8b95a5] hover:text-[#f1f5f9] px-2.5 py-1 rounded-xl hover:bg-[#141926] transition-colors border border-[#1e2536]"
          >
            <FolderOpen size={13} className="text-sky-400" />
            <span className="truncate max-w-[220px]">
              {activeProject ? activeProject.name : 'Çalışma Alanı Seç'}
            </span>
            <ChevronDown size={12} className="text-[#64748b]" />
          </button>

          {showProjectDropdown && (
            <div className="absolute bottom-full left-0 mb-1 w-64 glass-dropdown rounded-2xl py-1 z-50">
              <div className="px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#64748b]">
                Mevcut Projeler
              </div>
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectProject(p.path)}
                  className="w-full text-left px-3.5 py-1.5 text-[12px] text-[#cbd5e1] hover:bg-[#182032] truncate transition-colors flex items-center gap-2"
                >
                  <FileCode size={13} className="text-sky-400" />
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
              <div className="my-1 border-t border-[#1e2536]" />
              <button
                onClick={handleOpenFolderPicker}
                className="w-full text-left px-3.5 py-1.5 text-[12px] text-white hover:bg-[#182032] transition-colors flex items-center gap-2"
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
            className="text-[11px] text-[#8b95a5] hover:text-white px-2.5 py-1 rounded-xl hover:bg-[#141926] border border-[#1e2536] transition-colors flex items-center gap-1"
          >
            <Plus size={12} />
            <span>Yeni Oturum</span>
          </button>
        )}
      </div>

      {/* Slash Command Popover */}
      {showSlashMenu && (
        <div className="absolute bottom-full left-0 mb-2 w-84 glass-dropdown rounded-2xl py-1.5 z-50 animate-fadeIn">
          <div className="px-3.5 py-1.5 text-[10px] font-semibold text-[#64748b] uppercase tracking-wider">
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
              className="w-full text-left px-3.5 py-2 text-[12.5px] hover:bg-[#182032] transition-colors flex items-center gap-2.5 text-[#e2e8f0]"
            >
              <item.icon size={14} className="text-sky-400" />
              <span className="font-mono font-medium text-sky-400">{item.cmd}</span>
              <span className="text-[11px] text-[#8b95a5] truncate">{item.desc}</span>
            </button>
          ))}
        </div>
      )}

      {/* Real @ Mention File Popover */}
      {showMentionMenu && (
        <div className="absolute bottom-full left-0 mb-2 w-84 glass-dropdown rounded-2xl py-2 z-50 animate-fadeIn">
          <div className="px-3.5 py-1 text-[10px] font-semibold text-[#7e8b9f] uppercase tracking-wider flex items-center justify-between">
            <span>Bağlam Ekle (@ Dosya)</span>
            <span className="text-[9px] text-[#64748b]">Dosya içeriği modele aktarılır</span>
          </div>

          {mentionCandidates.length === 0 ? (
            <div className="px-3.5 py-3 text-center text-[12px] text-[#64748b]">
              Eşleşen dosya bulunamadı
            </div>
          ) : (
            mentionCandidates.map((f) => (
              <button
                key={f.path}
                onClick={() => handleSelectMention(f.name)}
                className="w-full text-left px-3.5 py-2 text-[12.5px] hover:bg-[#182032] transition-colors flex items-center justify-between text-[#e2e8f0]"
              >
                <div className="flex items-center gap-2 truncate">
                  {f.isWeb ? (
                    <Globe size={13} className="text-emerald-400" />
                  ) : (
                    <FileCode size={13} className={f.isTab ? 'text-sky-400' : 'text-[#7e8b9f]'} />
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

      {/* Elytra Prompt Capsule */}
      <div className="bg-[#0e121e]/95 backdrop-blur-2xl border border-[#202738] hover:border-[#2d374e] focus-within:border-sky-500/60 focus-within:ring-2 focus-within:ring-sky-500/15 focus-within:shadow-[0_0_35px_rgba(56,189,248,0.15)] rounded-2xl p-4 shadow-[0_16px_50px_rgba(0,0,0,0.7)] transition-all duration-200">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Elytra'ya herhangi bir şey sor, dosya bağlamı için @, komutlar için / yaz..."
          className="w-full min-h-[58px] max-h-[220px] bg-transparent text-[#f8fafc] placeholder-[#5a6578] text-[14px] resize-none focus:outline-none leading-relaxed select-text font-normal"
        />

        {/* Capsule Bottom Toolbar */}
        <div className="flex items-center justify-between pt-3 border-t border-[#181d2a] select-none">
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
                className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1 rounded-full border text-[#e2e8f0] hover:text-white bg-[#121624] hover:bg-[#1a2134] border-[#222c40] shadow-sm transition-all"
              >
                <Cpu size={11} className="text-sky-400" />
                <span className="truncate max-w-[150px] font-medium">
                  {selectedModel}
                </span>
                <ChevronDown size={11} className="text-[#7e8b9f]" />
              </button>

              {showModelDropdown && (
                <div className="absolute bottom-full left-0 mb-2 w-88 glass-dropdown rounded-2xl py-1 z-50 max-h-[440px] overflow-y-auto flex flex-col">
                  {/* Search Bar at Top of Dropdown */}
                  <div className="p-2 border-b border-[#181d2a] sticky top-0 bg-[#0b0e16] z-10">
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#121624] border border-[#202738] text-[12px] text-white">
                      <Search size={13} className="text-[#7e8b9f] flex-shrink-0" />
                      <input
                        type="text"
                        value={modelSearch}
                        onChange={(e) => setModelSearch(e.target.value)}
                        placeholder="Model veya sağlayıcı ara..."
                        className="bg-transparent text-white placeholder-[#5a6578] text-[11.5px] w-full focus:outline-none"
                        autoFocus
                      />
                      {modelSearch && (
                        <button
                          onClick={() => setModelSearch('')}
                          className="text-[#7e8b9f] hover:text-white text-[11px] px-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {/* Category 0: Elytra Studio AGI Serisi */}
                    {filterBySearch(elytraModels).length > 0 && (
                      <div>
                        <div className="px-3.5 py-1.5 text-[10px] font-semibold text-sky-400 uppercase tracking-wider flex items-center justify-between bg-[#0e1628]">
                          <span>💎 Elytra Studio AGI Serisi</span>
                          <span className="text-[9px] bg-sky-950/80 text-sky-300 border border-sky-800/40 px-1 rounded">Resmi AGI</span>
                        </div>
                        {filterBySearch(elytraModels).map((m) => (
                          <button
                            key={m.id}
                            onClick={() => {
                              setSelectedModel(m.name);
                              setShowModelDropdown(false);
                              setModelSearch('');
                            }}
                            className={`w-full text-left px-3.5 py-2 text-[12px] hover:bg-[#162038] transition-colors flex items-center justify-between ${
                              selectedModel === m.name ? 'bg-[#162038] text-white font-medium border-l-2 border-sky-400' : 'text-[#cbd5e1]'
                            }`}
                          >
                            <div className="flex flex-col min-w-0">
                              <span className="truncate">{m.name}</span>
                              <span className="text-[10px] text-[#7e8b9f]">{m.provider}</span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#101b30] text-sky-300 border border-sky-800/30">
                                {m.tag}
                              </span>
                              {selectedModel === m.name && <Check size={13} className="text-sky-400" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Category 1: GitHub Copilot OAuth */}
                    {filterBySearch(copilotModels).length > 0 && (
                      <div>
                        <div className="px-3.5 py-1.5 text-[10px] font-semibold text-purple-400 uppercase tracking-wider flex items-center justify-between bg-[#151024]">
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
                            className={`w-full text-left px-3.5 py-2 text-[12px] hover:bg-[#201636] transition-colors flex items-center justify-between ${
                              selectedModel === m.name ? 'bg-[#201636] text-white font-medium border-l-2 border-purple-400' : 'text-[#cbd5e1]'
                            }`}
                          >
                            <div className="flex flex-col min-w-0">
                              <span className="truncate">{m.name}</span>
                              <span className="text-[10px] text-[#7e8b9f]">{m.provider}</span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1c132e] text-purple-300 border border-purple-800/30">
                                {m.tag}
                              </span>
                              {selectedModel === m.name && <Check size={13} className="text-purple-400" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Category 2: OpenCode Zen Gateway */}
                    {filterBySearch(zenModels).length > 0 && (
                      <div>
                        <div className="px-3.5 py-1.5 text-[10px] font-semibold text-cyan-400 uppercase tracking-wider flex items-center justify-between bg-[#0e1920]">
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
                            className={`w-full text-left px-3.5 py-2 text-[12px] hover:bg-[#15232c] transition-colors flex items-center justify-between ${
                              selectedModel === m.name ? 'bg-[#15232c] text-white font-medium border-l-2 border-cyan-400' : 'text-[#cbd5e1]'
                            }`}
                          >
                            <div className="flex flex-col min-w-0">
                              <span className="truncate">{m.name}</span>
                              <span className="text-[10px] text-[#7e8b9f]">{m.provider}</span>
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

                    {/* Category 3: Free Tier */}
                    {filterBySearch(freeModels).length > 0 && (
                      <div>
                        <div className="px-3.5 py-1.5 text-[10px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center justify-between bg-[#0e1a14]">
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
                            className={`w-full text-left px-3.5 py-2 text-[12px] hover:bg-[#16271e] transition-colors flex items-center justify-between ${
                              selectedModel === m.name ? 'bg-[#16271e] text-white font-medium border-l-2 border-emerald-400' : 'text-[#cbd5e1]'
                            }`}
                          >
                            <div className="flex flex-col min-w-0">
                              <span className="truncate">{m.name}</span>
                              <span className="text-[10px] text-[#7e8b9f]">{m.provider}</span>
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

                    {/* Category 4: Pro / BYOK Models */}
                    {filterBySearch(proModels).length > 0 && (
                      <div>
                        <div className="px-3.5 py-1.5 text-[10px] font-semibold text-amber-400 uppercase tracking-wider flex items-center justify-between bg-[#19150e]">
                          <span>Pro & BYOK Modeller</span>
                          <span className="text-[9px] bg-amber-950/60 text-amber-300 border border-amber-800/40 px-1 rounded">Kendi Anahtarın</span>
                        </div>
                        {filterBySearch(proModels).map((m) => (
                          <button
                            key={m.id}
                            onClick={() => {
                              setSelectedModel(m.name);
                              setShowModelDropdown(false);
                              setModelSearch('');
                            }}
                            className={`w-full text-left px-3.5 py-2 text-[12px] hover:bg-[#261f14] transition-colors flex items-center justify-between ${
                              selectedModel === m.name ? 'bg-[#261f14] text-white font-medium border-l-2 border-amber-400' : 'text-[#cbd5e1]'
                            }`}
                          >
                            <div className="flex flex-col min-w-0">
                              <span className="truncate">{m.name}</span>
                              <span className="text-[10px] text-[#7e8b9f]">{m.provider}</span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#201a11] text-amber-300 border border-amber-800/30">
                                {m.tag}
                              </span>
                              {selectedModel === m.name && <Check size={13} className="text-amber-400" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
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
                className="flex items-center gap-1.5 text-[11px] font-medium text-[#cbd5e1] hover:text-white px-3 py-1 rounded-full bg-[#121624] hover:bg-[#1a2134] border border-[#222c40] transition-colors"
              >
                <Brain size={11} className="text-purple-400" />
                <span>Thinking: {thinkingLevel}</span>
                <ChevronDown size={11} className="text-[#7e8b9f]" />
              </button>

              {showThinkingDropdown && (
                <div className="absolute bottom-full left-0 mb-2 w-48 glass-dropdown rounded-2xl py-1 z-50 animate-fadeIn">
                  <div className="px-3.5 py-1 text-[10px] font-semibold text-[#7e8b9f] uppercase tracking-wider">
                    Düşünce Bütçesi
                  </div>
                  {THINKING_LEVELS.map((level) => (
                    <button
                      key={level}
                      onClick={() => {
                        setThinkingLevel(level);
                        setShowThinkingDropdown(false);
                      }}
                      className={`w-full text-left px-3.5 py-1.5 text-[12px] hover:bg-[#182032] transition-colors flex items-center justify-between ${
                        thinkingLevel === level ? 'text-purple-400 font-semibold' : 'text-[#cbd5e1]'
                      }`}
                    >
                      <span>{level}</span>
                      {thinkingLevel === level && <Check size={12} className="text-purple-400" />}
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
                className="flex items-center gap-1.5 text-[11px] font-medium text-[#cbd5e1] hover:text-white px-3 py-1 rounded-full bg-[#121624] hover:bg-[#1a2134] border border-[#222c40] transition-colors"
              >
                <Shield size={11} className="text-emerald-400" />
                <span>{permissionMode}</span>
                <ChevronDown size={11} className="text-[#7e8b9f]" />
              </button>

              {showPermDropdown && (
                <div className="absolute bottom-full left-0 mb-2 w-56 glass-dropdown rounded-2xl py-1 z-50 animate-fadeIn">
                  <div className="px-3.5 py-1 text-[10px] font-semibold text-[#7e8b9f] uppercase tracking-wider">
                    İzin Seviyesi
                  </div>
                  {PERMISSION_MODES.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => {
                        setPermissionMode(mode.id);
                        setShowPermDropdown(false);
                      }}
                      className={`w-full text-left px-3.5 py-1.5 text-[12px] hover:bg-[#182032] transition-colors flex flex-col ${
                        permissionMode === mode.id ? 'text-emerald-400 font-semibold' : 'text-[#cbd5e1]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{mode.label}</span>
                        {permissionMode === mode.id && <Check size={12} className="text-emerald-400" />}
                      </div>
                      <span className="text-[10px] text-[#7e8b9f] font-normal">{mode.desc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Action Icons & Send Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSpeechRecognition}
              className={`p-1.5 rounded-lg transition-colors ${
                isListening
                  ? 'text-rose-400 bg-rose-950/40 animate-pulse'
                  : 'text-[#7e8b9f] hover:text-white hover:bg-[#161d2c]'
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
                  ? 'bg-gradient-to-tr from-sky-400 via-sky-500 to-blue-600 text-white shadow-[0_0_14px_rgba(56,189,248,0.5)] hover:shadow-[0_0_20px_rgba(56,189,248,0.7)] hover:scale-105 active:scale-95'
                  : 'bg-[#141926] text-[#556070] cursor-not-allowed border border-[#1b2234]'
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
    <main className="flex-1 h-full bg-[#08090d] overflow-hidden flex flex-col items-center relative select-text">
      {/* Background Subtle Elytra Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-sky-500/5 blur-[120px] pointer-events-none" />

      {/* IF NO CONVERSATION ACTIVE: Centered Elytra Studio Home */}
      {!hasMessages ? (
        <div className="flex-1 w-full overflow-y-auto flex items-center justify-center p-4 md:p-6">
          <div className="w-full max-w-[780px] flex flex-col items-center justify-center select-none animate-fadeIn py-4">
            {/* Official Emblem */}
            <div className="mb-5 relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-sky-500/25 via-purple-500/20 to-emerald-500/20 rounded-3xl blur-2xl opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="relative w-20 h-20 rounded-2xl bg-[#0e121c] border border-[#202738] p-3.5 flex items-center justify-center shadow-2xl transition-all duration-300 group-hover:border-sky-500/50 group-hover:shadow-[0_0_30px_rgba(56,189,248,0.2)]">
                <ElythraLogo size={60} />
              </div>
            </div>

            {/* Heading */}
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent mb-2.5 text-center">
              Bugün ne inşa ediyoruz?
            </h1>

            <p className="text-[13.5px] text-[#94a3b8] max-w-[540px] leading-relaxed mb-6 text-center font-normal">
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
                  className="p-3.5 bg-gradient-to-br from-[#0e121c]/90 to-[#0a0d14]/90 hover:from-[#141a29] hover:to-[#0e121c] border border-[#1b2234] hover:border-sky-500/40 rounded-2xl text-left transition-all duration-200 flex items-start gap-3 group shadow-md hover:shadow-sky-950/20 hover:-translate-y-0.5"
                >
                  <div className="p-2.5 rounded-xl bg-[#121624] border border-[#222c40] group-hover:border-sky-500/40 group-hover:bg-[#161d30] transition-colors flex-shrink-0 mt-0.5">
                    <card.icon size={16} className={card.iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-[#f1f5f9] group-hover:text-white transition-colors">
                      {card.title}
                    </div>
                    <div className="text-[11.5px] text-[#7e8b9f] line-clamp-1 mt-0.5">
                      {card.desc}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Bottom Minimalist Status Line */}
            <div className="mt-8 text-[11px] font-mono text-[#5a6578] flex items-center gap-2">
              <span className="text-[#8b95a5]">Elytra Code</span>
              <span>·</span>
              <span>Multi-Model AI Engine</span>
              <span>·</span>
              <span>GC Shield Protected</span>
              <span>·</span>
              <span className="text-emerald-400 font-medium">Autonomous Studio</span>
            </div>
          </div>
        </div>
      ) : (
        /* IF CONVERSATION ACTIVE: Standard Stream with Pinned Bottom Capsule */
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
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#141a29] to-[#0e121c] border border-[#202738] flex items-center justify-center text-white flex-shrink-0 mt-0.5 overflow-hidden shadow-lg">
                    <ElythraLogo size={20} />
                  </div>
                )}

                <div
                  className={`max-w-[760px] rounded-2xl p-4 transition-all shadow-xl group ${
                    m.role === 'user'
                      ? 'bg-gradient-to-br from-[#162034] via-[#121929] to-[#0e1320] border border-sky-500/25 text-[#f8fafc] rounded-tr-sm shadow-sky-950/20'
                      : 'bg-[#0d1017] border border-[#1b2234] text-[#e2e8f0] rounded-tl-sm hover:border-[#252f46] shadow-black/40'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#181d2a] select-none text-[11px] text-[#64748b]">
                    <div className="flex items-center gap-2">
                      {m.role === 'user' ? (
                        <span className="font-semibold text-sky-300 flex items-center gap-1.5">
                          Siz
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#121624] border border-[#202738] text-sky-300 font-medium text-[11px] shadow-sm">
                          <Sparkles size={11} className="text-sky-400" />
                          <span className="truncate max-w-[200px]">{m.model || selectedModel}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-[#64748b] px-1.5 py-0.5 rounded bg-[#101420]/60">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(m.content);
                          setCopiedMsgId(m.id);
                          setTimeout(() => setCopiedMsgId(null), 2000);
                        }}
                        className="opacity-0 group-hover:opacity-100 hover:text-white transition-all p-1 rounded-md hover:bg-[#182032] text-[#64748b]"
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
                    <div className="whitespace-pre-wrap leading-relaxed text-[#f8fafc] text-[13.5px]">
                      {m.content}
                    </div>
                  )}
                </div>

                {m.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1a2336] to-[#121826] border border-sky-500/30 flex items-center justify-center text-sky-300 flex-shrink-0 mt-0.5 shadow-md">
                    <User size={15} />
                  </div>
                )}
              </div>
            ))}

            {/* Live Streaming Assistant Message */}
            {streamingContent && (
              <div className="flex gap-3 text-[13.5px] leading-relaxed justify-start animate-fadeIn">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#141a29] to-[#0e121c] border border-sky-500/30 flex items-center justify-center text-white flex-shrink-0 mt-0.5 overflow-hidden shadow-lg shadow-sky-500/10">
                  <ElythraLogo size={20} />
                </div>
                <div className="max-w-[760px] rounded-2xl p-4 bg-[#0d1017] border border-sky-500/30 text-[#e2e8f0] shadow-[0_0_25px_rgba(56,189,248,0.06)] rounded-tl-sm">
                  <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#181d2a] select-none text-[11px] text-[#64748b]">
                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#121624] border border-[#202738] text-sky-300 font-medium text-[11px]">
                      <Sparkles size={11} className="text-sky-400 animate-spin" style={{ animationDuration: '3s' }} />
                      <span className="truncate max-w-[200px]">{selectedModel}</span>
                    </div>
                    <span className="flex items-center gap-1.5 text-sky-400 font-mono text-[10.5px] px-2 py-0.5 rounded-full bg-sky-950/70 border border-sky-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                      Düşünüyor & Yazıyor...
                    </span>
                  </div>
                  <MarkdownRenderer content={streamingContent} isStreaming={true} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Fixed Prompt Capsule */}
          <div className="p-3 bg-[#08090d]/95 backdrop-blur-md border-t border-[#181d2a]">
            {renderDiffBar()}
            {renderPromptCapsule()}
          </div>
        </div>
      )}
    </main>
  );
};
