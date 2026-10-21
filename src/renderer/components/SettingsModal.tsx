import React, { useState } from 'react';
import {
  X,
  Key,
  Cpu,
  Sliders,
  Terminal,
  Shield,
  Save,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Search,
  Check,
  Copy,
  RefreshCw,
  Loader2,
  Lock,
  Globe,
  Zap,
} from 'lucide-react';
import { useElythraStore } from '../store/useElythraStore';

interface ProviderItem {
  id: string;
  category: 'free' | 'oauth' | 'byok' | 'cloud';
  label: string;
  desc: string;
  placeholder: string;
  link: string;
  badge: string;
  badgeColor: string;
  isOAuth?: boolean;
}

export const SettingsModal: React.FC = () => {
  const { settings, updateSettings, setActiveModal, setSelectedModel } = useElythraStore();

  const [activeTab, setActiveTab] = useState<'keys' | 'models' | 'editor' | 'terminal' | 'rules'>('keys');
  const [formData, setFormData] = useState({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'all' | 'free' | 'oauth' | 'byok' | 'cloud'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // GitHub Copilot Device Code OAuth state
  const [copilotAuth, setCopilotAuth] = useState<{
    status: 'idle' | 'starting' | 'waiting' | 'success' | 'error';
    userCode?: string;
    verificationUri?: string;
    error?: string;
  }>({ status: 'idle' });

  const [copilotTesting, setCopilotTesting] = useState(false);
  const [copilotTestResult, setCopilotTestResult] = useState<{
    valid: boolean;
    user?: string;
    error?: string;
  } | null>(null);

  const handleTestCopilot = async (tokenOverride?: string) => {
    const token = (tokenOverride !== undefined ? tokenOverride : formData.apiKeys.githubCopilot || '').trim();
    if (!token) {
      setCopilotTestResult({ valid: false, error: 'Test edilecek token girilmedi.' });
      return;
    }
    setCopilotTesting(true);
    setCopilotTestResult(null);
    try {
      const res = await window.elythraAPI?.copilotTestToken(token);
      setCopilotTestResult(res || { valid: false, error: 'Yanıt alınamadı' });
    } catch (err: any) {
      setCopilotTestResult({ valid: false, error: err.message || 'Bağlantı hatası' });
    } finally {
      setCopilotTesting(false);
    }
  };

  const handleSaveManualCopilotToken = async (manualToken: string) => {
    const trimmed = manualToken.trim();
    const updated = {
      ...formData,
      apiKeys: { ...formData.apiKeys, githubCopilot: trimmed },
    };
    setFormData(updated);
    await updateSettings(updated);
    if (trimmed) {
      setSelectedModel('Copilot Claude 3.5 Sonnet');
      handleTestCopilot(trimmed);
    } else {
      setCopilotTestResult(null);
    }
  };

  const handleSave = async () => {
    await updateSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setActiveModal(null);
    }, 800);
  };

  const handleOpenLink = (url: string) => {
    if (window.elythraAPI?.openExternal) {
      window.elythraAPI.openExternal(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Complete Provider Catalog
  const keyList: ProviderItem[] = [
    // 1. Ücretsiz & Yüksek Hızlı Free Tier
    {
      id: 'gemini',
      category: 'free',
      label: 'Google Gemini API (Günde 1.500 İstek Ücretsiz)',
      desc: 'Gemini 2.5 Flash, Gemini 2.0 Flash, Gemini 1.5 Pro',
      placeholder: 'AIzaSy...',
      link: 'https://aistudio.google.com/app/apikey',
      badge: 'Free Tier',
      badgeColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40',
    },
    {
      id: 'opencodeZen',
      category: 'free',
      label: 'OpenCode Zen Gateway (Ücretsiz Hızlı LLM)',
      desc: 'Nemotron 3 Super Free, MiniMax M2.5 Free, Big Pickle, Qwen 3.5 Plus',
      placeholder: 'Bearer token veya zen key (ücretsiz modellerde opsiyonel)',
      link: 'https://opencode.ai/zen',
      badge: 'Free Gateway',
      badgeColor: 'text-cyan-400 bg-cyan-950/60 border-cyan-800/40',
    },
    {
      id: 'groq',
      category: 'free',
      label: 'Groq Cloud LPU (Günde 14.400 İstek Ücretsiz)',
      desc: 'Llama 3.3 70B & Qwen 2.5 Coder (300+ tok/s ultra hızlı)',
      placeholder: 'gsk_...',
      link: 'https://console.groq.com/keys',
      badge: 'Free LPU',
      badgeColor: 'text-amber-400 bg-amber-950/60 border-amber-800/40',
    },
    {
      id: 'cerebras',
      category: 'free',
      label: 'Cerebras Cloud (2000+ tok/s Bedava LPU)',
      desc: 'Dünyanın en hızlı yapay zeka çipinde Llama 3.3 70B',
      placeholder: 'csk-...',
      link: 'https://cloud.cerebras.ai/',
      badge: 'Ultra Fast',
      badgeColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40',
    },
    {
      id: 'sambanova',
      category: 'free',
      label: 'SambaNova Cloud (%100 Ücretsiz Geliştirici Kotası)',
      desc: 'Llama 3.3 70B ve Qwen 2.5 Coder 32B tam hız',
      placeholder: 'Key veya token...',
      link: 'https://cloud.sambanova.ai/',
      badge: 'Free Tier',
      badgeColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40',
    },
    {
      id: 'openrouter',
      category: 'free',
      label: 'OpenRouter Universal (300+ Model Ağ Geçidi)',
      desc: 'Claude 3.5 Sonnet, DeepSeek R1, Qwen Coder ve ücretsiz modeller',
      placeholder: 'sk-or-v1-...',
      link: 'https://openrouter.ai/keys',
      badge: '300+ Model',
      badgeColor: 'text-sky-400 bg-sky-950/60 border-sky-800/40',
    },

    // 2. OAuth & Copilot
    {
      id: 'githubCopilot',
      category: 'oauth',
      label: 'GitHub Copilot (OAuth & Device Code Auth)',
      desc: 'Claude 3.5 Sonnet, GPT-4o, o1 modellerine GitHub Copilot hesabınızla bağlanın',
      placeholder: 'GitHub Copilot Access Token (gho_... / ghp_...) veya yukarıdaki butonla oturum açın',
      link: 'https://github.com/settings/tokens',
      badge: 'OAuth Device Auth',
      badgeColor: 'text-purple-400 bg-purple-950/60 border-purple-800/40',
      isOAuth: true,
    },

    // 3. Top-Tier BYOK
    {
      id: 'anthropic',
      category: 'byok',
      label: 'Anthropic Claude API (Doğrudan Resmi Erişim)',
      desc: 'Claude 3.5 Sonnet, Claude 3.7 Sonnet / Thinking, Haiku, Opus',
      placeholder: 'sk-ant-...',
      link: 'https://console.anthropic.com/',
      badge: 'Direct Claude',
      badgeColor: 'text-amber-300 bg-amber-950/60 border-amber-800/40',
    },
    {
      id: 'openai',
      category: 'byok',
      label: 'OpenAI API (GPT-4o, o1, o3-mini)',
      desc: 'Doğrudan OpenAI API anahtarınız ile resmi bağlantı',
      placeholder: 'sk-proj-...',
      link: 'https://platform.openai.com/api-keys',
      badge: 'Official',
      badgeColor: 'text-green-400 bg-green-950/60 border-green-800/40',
    },
    {
      id: 'deepseek',
      category: 'byok',
      label: 'DeepSeek Direct API (V3 & R1 Reasoner)',
      desc: 'DeepSeek Chat (V3) ve DeepSeek Reasoner (R1 Düşünce Zinciri)',
      placeholder: 'sk-...',
      link: 'https://platform.deepseek.com/',
      badge: 'Direct R1',
      badgeColor: 'text-blue-400 bg-blue-950/60 border-blue-800/40',
    },
    {
      id: 'mistral',
      category: 'byok',
      label: 'Mistral AI (Codestral & Mistral Large)',
      desc: 'Kodlama için özel optimize edilmiş Codestral ve Mistral Large 2',
      placeholder: 'Key...',
      link: 'https://console.mistral.ai/',
      badge: 'Codestral',
      badgeColor: 'text-orange-400 bg-orange-950/60 border-orange-800/40',
    },
    {
      id: 'xai',
      category: 'byok',
      label: 'xAI Grok Direct API',
      desc: 'Grok 2 ve Grok Vision modelleri',
      placeholder: 'xai-...',
      link: 'https://console.x.ai/',
      badge: 'Grok 2',
      badgeColor: 'text-stone-300 bg-stone-900 border-stone-700',
    },

    // 4. Cloud & Search
    {
      id: 'together',
      category: 'cloud',
      label: 'Together AI (100+ Açık Kaynak Model)',
      desc: 'Qwen 2.5 Coder 32B, Llama 3.3, DeepSeek',
      placeholder: 'Key...',
      link: 'https://api.together.ai/',
      badge: 'Open Source',
      badgeColor: 'text-indigo-400 bg-indigo-950/60 border-indigo-800/40',
    },
    {
      id: 'fireworks',
      category: 'cloud',
      label: 'Fireworks AI (Yüksek Hızlı Dağıtım)',
      desc: 'DeepSeek V3/R1 ve Qwen modelleri için optimize inference',
      placeholder: 'fw_...',
      link: 'https://fireworks.ai/',
      badge: 'Fast Cloud',
      badgeColor: 'text-red-400 bg-red-950/60 border-red-800/40',
    },
    {
      id: 'perplexity',
      category: 'cloud',
      label: 'Perplexity AI (Sonar Reasoner & Web Search)',
      desc: 'Canlı web araması destekli Sonar Reasoning modelleri',
      placeholder: 'pplx-...',
      link: 'https://www.perplexity.ai/settings/api',
      badge: 'Web Reasoner',
      badgeColor: 'text-teal-400 bg-teal-950/60 border-teal-800/40',
    },
    {
      id: 'cohere',
      category: 'cloud',
      label: 'Cohere API (Command R+ Enterprise)',
      desc: 'Command R+ 128k bağlam ve gelişmiş RAG mimarisi',
      placeholder: 'Key...',
      link: 'https://cohere.com/',
      badge: 'Command R+',
      badgeColor: 'text-yellow-400 bg-yellow-950/60 border-yellow-800/40',
    },
  ];

  // Copilot Device Code OAuth Handler
  const handleStartCopilotAuth = async () => {
    setCopilotAuth({ status: 'starting' });
    try {
      const res = await window.elythraAPI?.copilotStartDeviceAuth();
      if (!res || res.error || !res.device_code) {
        setCopilotAuth({ status: 'error', error: res?.error || 'Cihaz kodu başlatılamadı' });
        return;
      }
      setCopilotAuth({
        status: 'waiting',
        userCode: res.user_code,
        verificationUri: res.verification_uri || 'https://github.com/login/device',
      });

      if (res.user_code) {
        navigator.clipboard?.writeText(res.user_code);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 3000);
      }

      if (res.verification_uri) {
        handleOpenLink(res.verification_uri);
      }

      const pollInterval = (res.interval || 5) * 1000;
      const deviceCode = res.device_code;
      const maxAttempts = 50;
      let attempts = 0;

      const pollTimer = setInterval(async () => {
        attempts++;
        if (attempts > maxAttempts) {
          clearInterval(pollTimer);
          setCopilotAuth({ status: 'error', error: 'Oturum açma zaman aşımına uğradı' });
          return;
        }

        const pollRes = await window.elythraAPI?.copilotPollToken(deviceCode);
        if (pollRes?.access_token) {
          clearInterval(pollTimer);
          const newToken = pollRes.access_token.trim();
          const updated = {
            ...formData,
            apiKeys: { ...formData.apiKeys, githubCopilot: newToken },
          };
          setFormData(updated);
          await updateSettings(updated);
          setSelectedModel('Copilot Claude 3.5 Sonnet');
          setCopilotAuth({ status: 'success' });
          handleTestCopilot(newToken);
          setTimeout(() => setCopilotAuth({ status: 'idle' }), 6000);
        } else if (pollRes?.error && pollRes.error !== 'authorization_pending' && pollRes.error !== 'slow_down') {
          clearInterval(pollTimer);
          setCopilotAuth({ status: 'error', error: pollRes.error });
        }
      }, pollInterval);
    } catch (err: any) {
      setCopilotAuth({ status: 'error', error: err.message || 'Hata oluştu' });
    }
  };

  const filteredKeys = keyList.filter((k) => {
    const matchesCategory = filterCategory === 'all' || k.category === filterCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      k.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const connectedCount = Object.entries(formData.apiKeys || {}).filter(([k, v]) => {
    if (k === 'customModel') return false;
    return typeof v === 'string' && v.trim().length > 0;
  }).length;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 select-none">
      <div className="w-[820px] h-[640px] bg-[#14161a] border border-[#272b36] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#e5e7eb]">
        {/* Modal Başlığı */}
        <div className="h-14 px-5 border-b border-[#222530] flex items-center justify-between bg-[#111317]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Key size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold text-white tracking-wide">
                  Model Sağlayıcıları & BYOK Ayarları
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                  {connectedCount} Sağlayıcı Aktif
                </span>
              </div>
              <span className="text-[11px] text-[#717888]">
                OAuth oturum açma, doğrudan API anahtarları veya yerel modeller bağlayın
              </span>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 text-[#888888] hover:text-white rounded-lg hover:bg-[#1f232e] transition-colors"
          >
            <X size={17} />
          </button>
        </div>

        {/* Gövde */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sol Sekme Menüsü */}
          <div className="w-52 bg-[#0e1014] border-r border-[#222530] p-3 space-y-1.5">
            <button
              onClick={() => setActiveTab('keys')}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-[12.5px] rounded-xl transition-all ${
                activeTab === 'keys'
                  ? 'bg-[#1e222d] text-white font-medium border border-[#2d3444] shadow-sm'
                  : 'text-[#888888] hover:text-white hover:bg-[#151820]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Key size={14} className={activeTab === 'keys' ? 'text-sky-400' : ''} />
                <span>API Keys & Auth</span>
              </div>
              {connectedCount > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-900/60 text-emerald-300">
                  {connectedCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('models')}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-[12.5px] rounded-xl transition-all ${
                activeTab === 'models'
                  ? 'bg-[#1e222d] text-white font-medium border border-[#2d3444] shadow-sm'
                  : 'text-[#888888] hover:text-white hover:bg-[#151820]'
              }`}
            >
              <Cpu size={14} className={activeTab === 'models' ? 'text-sky-400' : ''} />
              <span>Model Tercihleri</span>
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-[12.5px] rounded-xl transition-all ${
                activeTab === 'editor'
                  ? 'bg-[#1e222d] text-white font-medium border border-[#2d3444] shadow-sm'
                  : 'text-[#888888] hover:text-white hover:bg-[#151820]'
              }`}
            >
              <Sliders size={14} className={activeTab === 'editor' ? 'text-sky-400' : ''} />
              <span>Editör Ayarları</span>
            </button>
            <button
              onClick={() => setActiveTab('terminal')}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-[12.5px] rounded-xl transition-all ${
                activeTab === 'terminal'
                  ? 'bg-[#1e222d] text-white font-medium border border-[#2d3444] shadow-sm'
                  : 'text-[#888888] hover:text-white hover:bg-[#151820]'
              }`}
            >
              <Terminal size={14} className={activeTab === 'terminal' ? 'text-sky-400' : ''} />
              <span>Terminal Kabuğu</span>
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-[12.5px] rounded-xl transition-all ${
                activeTab === 'rules'
                  ? 'bg-[#1e222d] text-white font-medium border border-[#2d3444] shadow-sm'
                  : 'text-[#888888] hover:text-white hover:bg-[#151820]'
              }`}
            >
              <Shield size={14} className={activeTab === 'rules' ? 'text-sky-400' : ''} />
              <span>Sistem Kuralları</span>
            </button>
          </div>

          {/* Sağ İçerik Alanı */}
          <div className="flex-1 p-5 overflow-y-auto text-[13px] space-y-4">
            {activeTab === 'keys' && (
              <div className="space-y-4">
                {/* Arama ve Filtre Çubuğu */}
                <div className="space-y-2.5">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#717888]" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Sağlayıcı veya model ara (örn: Gemini, Copilot, Cerebras, Codestral, Groq)..."
                      className="w-full bg-[#101216] border border-[#232733] focus:border-sky-500/50 rounded-xl pl-9 pr-3 py-2 text-[12px] text-white placeholder-[#616878] focus:outline-none transition-colors"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#717888] hover:text-white text-[11px]"
                      >
                        Temizle
                      </button>
                    )}
                  </div>

                  {/* Kategori Filtre Hapları */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { id: 'all', label: 'Tümü' },
                      { id: 'free', label: '★ Ücretsiz (Free Tier)' },
                      { id: 'oauth', label: '🔗 OAuth (Copilot)' },
                      { id: 'byok', label: 'Popüler BYOK' },
                      { id: 'cloud', label: 'Cloud & Inference' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFilterCategory(cat.id as any)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                          filterCategory === cat.id
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                            : 'bg-[#101216] text-[#717888] hover:text-[#e5e7eb] border border-[#222530]'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* GitHub Copilot Özel OAuth Kartı */}
                {(filterCategory === 'all' || filterCategory === 'oauth') && (
                  <div className="p-3.5 bg-gradient-to-br from-[#171322] to-[#11131a] border border-purple-900/40 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[12.5px] font-semibold text-white">
                          GitHub Copilot (OAuth Oturum Açma)
                        </span>
                        <span className="text-[9.5px] font-mono px-2 py-0.5 rounded-full bg-purple-950/70 text-purple-300 border border-purple-800/40">
                          Tek Tıkla Cihaz Doğrulama
                        </span>
                      </div>
                      {formData.apiKeys.githubCopilot ? (
                        <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium bg-emerald-950/50 border border-emerald-800/30 px-2 py-0.5 rounded-md">
                          <CheckCircle size={12} />
                          <span>Bağlandı</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-[#717888]">Oturum Açılmadı</span>
                      )}
                    </div>

                    <p className="text-[11.5px] text-[#9ca3af] leading-relaxed">
                      GitHub Copilot aboneliğiniz üzerinden Claude 3.5 Sonnet, GPT-4o ve o1 modellerine resmi erişim sağlayın.
                    </p>

                    {/* OAuth Butonu & Canlı Akış */}
                    {copilotAuth.status === 'idle' && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleStartCopilotAuth}
                          className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[12px] font-medium flex items-center gap-1.5 transition-colors shadow-md"
                        >
                          <Globe size={13} />
                          <span>{formData.apiKeys.githubCopilot ? 'Hesabı Yeniden Yetkilendir' : 'GitHub ile Oturum Aç (Cihaz Kodu)'}</span>
                        </button>
                        {formData.apiKeys.githubCopilot && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleTestCopilot()}
                              disabled={copilotTesting}
                              className="px-3 py-2 bg-purple-900/40 hover:bg-purple-900/70 text-purple-200 border border-purple-700/50 rounded-lg text-[11.5px] transition-colors flex items-center gap-1.5"
                            >
                              {copilotTesting ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                              <span>{copilotTesting ? 'Test Ediliyor...' : 'Bağlantıyı Test Et'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                const updated = {
                                  ...formData,
                                  apiKeys: { ...formData.apiKeys, githubCopilot: '' },
                                };
                                setFormData(updated);
                                await updateSettings(updated);
                                setCopilotTestResult(null);
                              }}
                              className="px-3 py-2 bg-red-950/40 hover:bg-red-950/70 text-red-400 border border-red-900/40 rounded-lg text-[11.5px] transition-colors"
                            >
                              Bağlantıyı Kes
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {copilotAuth.status === 'starting' && (
                      <div className="flex items-center gap-2 text-[12px] text-purple-300 bg-purple-950/40 border border-purple-800/40 p-2.5 rounded-lg">
                        <Loader2 size={14} className="animate-spin text-purple-400" />
                        <span>GitHub Cihaz Kodu Alınıyor...</span>
                      </div>
                    )}

                    {copilotAuth.status === 'waiting' && (
                      <div className="p-3 bg-purple-950/50 border border-purple-700/50 rounded-lg space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11.5px] font-medium text-purple-200">
                            1. Tarayıcınız açıldı, kodu GitHub sayfasına yapıştırın:
                          </span>
                          <span className="text-[10px] text-purple-400 animate-pulse">Onay Bekleniyor...</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="px-3.5 py-1.5 bg-[#0e0f14] border border-purple-500/50 rounded text-[16px] font-mono tracking-widest text-white font-bold">
                            {copilotAuth.userCode}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (copilotAuth.userCode) {
                                navigator.clipboard?.writeText(copilotAuth.userCode);
                                setCopiedCode(true);
                                setTimeout(() => setCopiedCode(false), 2000);
                              }
                            }}
                            className="px-2.5 py-1.5 bg-purple-900/40 hover:bg-purple-900/70 text-purple-200 rounded text-[11.5px] flex items-center gap-1 transition-colors border border-purple-700/40"
                          >
                            {copiedCode ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                            <span>{copiedCode ? 'Kopyalandı!' : 'Kopyala'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenLink(copilotAuth.verificationUri || 'https://github.com/login/device')}
                            className="px-2.5 py-1.5 bg-purple-900/40 hover:bg-purple-900/70 text-purple-200 rounded text-[11.5px] flex items-center gap-1 transition-colors border border-purple-700/40"
                          >
                            <ExternalLink size={12} />
                            <span>Sayfayı Aç</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {copilotAuth.status === 'success' && (
                      <div className="p-2.5 bg-emerald-950/60 border border-emerald-700/60 rounded-lg flex items-center gap-2 text-[12px] text-emerald-300 font-medium">
                        <CheckCircle size={14} className="text-emerald-400" />
                        <span>GitHub Copilot başarıyla yetkilendirildi ve kaydedildi!</span>
                      </div>
                    )}

                    {copilotAuth.status === 'error' && (
                      <div className="p-2.5 bg-red-950/60 border border-red-700/60 rounded-lg flex items-center justify-between text-[12px] text-red-300">
                        <span>Hata: {copilotAuth.error}</span>
                        <button
                          type="button"
                          onClick={() => setCopilotAuth({ status: 'idle' })}
                          className="text-[11px] underline text-red-400 hover:text-red-200"
                        >
                          Tekrar Dene
                        </button>
                      </div>
                    )}

                    {copilotTestResult && (
                      <div
                        className={`p-2.5 rounded-lg flex items-center justify-between text-[12px] ${
                          copilotTestResult.valid
                            ? 'bg-emerald-950/60 border border-emerald-700/60 text-emerald-300'
                            : 'bg-red-950/60 border border-red-700/60 text-red-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {copilotTestResult.valid ? (
                            <CheckCircle size={14} className="text-emerald-400" />
                          ) : (
                            <AlertCircle size={14} className="text-red-400" />
                          )}
                          <span>
                            {copilotTestResult.valid
                              ? `Doğrulama Başarılı: ${copilotTestResult.user || 'Hesap aktif'} (Copilot modelleri kullanılabilir)`
                              : `Hata: ${copilotTestResult.error}`}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCopilotTestResult(null)}
                          className="text-[10px] text-[#888888] hover:text-white ml-2"
                        >
                          Kapat
                        </button>
                      </div>
                    )}

                    {/* Manuel Token Girişi */}
                    <div className="pt-2 border-t border-purple-900/30 space-y-2">
                      <label className="block text-[10.5px] text-[#717888]">
                        Veya GitHub Token'ı doğrudan yapıştırın (gho_... / ghp_... / Copilot token):
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="password"
                          value={formData.apiKeys.githubCopilot || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              apiKeys: { ...formData.apiKeys, githubCopilot: e.target.value },
                            })
                          }
                          onBlur={() => {
                            if (formData.apiKeys.githubCopilot !== settings.apiKeys?.githubCopilot) {
                              handleSaveManualCopilotToken(formData.apiKeys.githubCopilot || '');
                            }
                          }}
                          placeholder="gho_... veya Copilot OAuth token"
                          className="flex-1 bg-[#0d0f14] border border-[#232733] rounded-lg px-3 py-1.5 text-white text-[12px] focus:outline-none focus:border-purple-500/50"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveManualCopilotToken(formData.apiKeys.githubCopilot || '')}
                          className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded-lg text-[11.5px] font-medium transition-colors"
                        >
                          Kaydet & Doğrula
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sağlayıcı Listesi */}
                <div className="space-y-3">
                  {filteredKeys.map((k) => {
                    const val = (formData.apiKeys as any)[k.id] || '';
                    if (k.id === 'githubCopilot') return null; // Zaten yukarıdaki özel kartta gösteriliyor
                    return (
                      <div
                        key={k.id}
                        className="p-3 bg-[#111317] border border-[#202430] hover:border-[#2f3546] rounded-xl space-y-1.5 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <label className="text-white text-[12.5px] font-medium flex items-center gap-1.5">
                              <span>{k.label}</span>
                              {val ? (
                                <CheckCircle size={13} className="text-emerald-400" />
                              ) : (
                                <AlertCircle size={13} className="text-[#555e70]" />
                              )}
                            </label>
                            <span className={`text-[9.5px] font-mono px-1.5 py-0.2 rounded border ${k.badgeColor}`}>
                              {k.badge}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenLink(k.link)}
                            className="text-[11px] text-[#888888] hover:text-white flex items-center gap-1 underline transition-colors"
                          >
                            <span>Anahtar Al</span>
                            <ExternalLink size={10} />
                          </button>
                        </div>

                        <input
                          type="password"
                          value={val}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              apiKeys: { ...formData.apiKeys, [k.id]: e.target.value },
                            })
                          }
                          onBlur={() => {
                            updateSettings(formData);
                          }}
                          placeholder={k.placeholder}
                          className="w-full bg-[#0b0c10] border border-[#222634] rounded-lg px-3 py-1.5 text-white text-[12px] focus:outline-none focus:border-sky-500/50 transition-colors"
                        />
                        <p className="text-[11px] text-[#6b7280]">{k.desc}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Local LLM & Custom Endpoint Bölümü */}
                <div className="pt-3 border-t border-[#222530] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12.5px] font-semibold text-white flex items-center gap-1.5">
                      <Cpu size={14} className="text-cyan-400" />
                      Yerel Modeller & Özel vLLM Endpoint
                    </span>
                    <span className="text-[10px] text-[#717888]">OpenAI Uyumlu & vLLM</span>
                  </div>

                  {/* Hızlı Şablonlar */}
                  <div className="space-y-1.5 p-3 bg-[#101216] border border-[#232733] rounded-xl">
                    <label className="block text-[#a0aab8] text-[11px] font-medium">Hızlı Şablonlar (Tek Tıkla Kur):</label>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            apiKeys: {
                              ...formData.apiKeys,
                              customEndpoint: 'https://opencode.ai/zen/v1/chat/completions',
                              customModel: 'nemotron-3-super-free',
                            },
                          })
                        }
                        className="px-2.5 py-1 bg-[#16202a] hover:bg-[#1f2e3d] border border-cyan-800/40 hover:border-cyan-500/60 rounded-lg text-[11px] text-cyan-300 transition-all flex items-center gap-1 font-medium"
                      >
                        ⚡ OpenCode Zen Free
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            apiKeys: {
                              ...formData.apiKeys,
                              customEndpoint: 'http://localhost:1234/v1/chat/completions',
                              customModel: 'default',
                            },
                          })
                        }
                        className="px-2.5 py-1 bg-[#1a1c22] hover:bg-[#262a34] border border-[#2f3545] hover:border-[#47516b] rounded-lg text-[11px] text-[#d1d5db] transition-all flex items-center gap-1"
                      >
                        💻 LM Studio (Local :1234)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            apiKeys: {
                              ...formData.apiKeys,
                              ollamaUrl: 'http://localhost:11434',
                              customEndpoint: 'http://localhost:11434/v1/chat/completions',
                              customModel: 'qwen2.5-coder:7b',
                            },
                          })
                        }
                        className="px-2.5 py-1 bg-[#1a1c22] hover:bg-[#262a34] border border-[#2f3545] hover:border-[#47516b] rounded-lg text-[11px] text-[#d1d5db] transition-all flex items-center gap-1"
                      >
                        🦙 Ollama (Local :11434)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#888888] text-[11px] mb-1">Özel Endpoint URL'i (OpenAI / vLLM / Zen)</label>
                    <input
                      type="text"
                      value={formData.apiKeys.customEndpoint || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          apiKeys: { ...formData.apiKeys, customEndpoint: e.target.value },
                        })
                      }
                      placeholder="https://opencode.ai/zen/v1/chat/completions veya http://localhost:1234/v1"
                      className="w-full bg-[#0e1014] border border-[#222530] rounded-lg px-3 py-1.5 text-white text-[12px] focus:outline-none focus:border-sky-500/50"
                    />
                    <p className="text-[10px] text-[#616878] mt-0.5">
                      vLLM, LM Studio, Zen veya yerel API sunucunuzu bağlayın. Sistem /chat/completions uzantısını otomatik tamamlar.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[#888888] text-[11px] mb-1">Özel Bearer Token / Key (Opsiyonel)</label>
                      <input
                        type="password"
                        value={formData.apiKeys.customKey || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            apiKeys: { ...formData.apiKeys, customKey: e.target.value },
                          })
                        }
                        placeholder="Bearer token veya key"
                        className="w-full bg-[#0e1014] border border-[#222530] rounded-lg px-3 py-1.5 text-white text-[12px] focus:outline-none focus:border-sky-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-[#888888] text-[11px] mb-1">Hedef Model ID'si (Opsiyonel)</label>
                      <input
                        type="text"
                        value={formData.apiKeys.customModel || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            apiKeys: { ...formData.apiKeys, customModel: e.target.value },
                          })
                        }
                        placeholder="nemotron-3-super-free, qwen2.5-coder:7b vb."
                        className="w-full bg-[#0e1014] border border-[#222530] rounded-lg px-3 py-1.5 text-white text-[12px] focus:outline-none focus:border-sky-500/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#888888] text-[11px] mb-1">Ollama Native URL (Local)</label>
                    <input
                      type="text"
                      value={formData.apiKeys.ollamaUrl || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          apiKeys: { ...formData.apiKeys, ollamaUrl: e.target.value },
                        })
                      }
                      placeholder="http://localhost:11434"
                      className="w-full bg-[#0e1014] border border-[#222530] rounded-lg px-3 py-1.5 text-white text-[12px] focus:outline-none focus:border-sky-500/50"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'models' && (
              <div className="space-y-4">
                {(() => {
                  const keys = formData.apiKeys || {};
                  const hasOpenRouter = !!keys.openrouter?.trim();
                  const hasZen = !!(keys.opencodeZen?.trim() || keys.customEndpoint?.includes('opencode.ai'));
                  const hasCopilot = !!keys.githubCopilot?.trim();
                  const hasCustom = !!keys.customEndpoint?.trim();
                  const hasDirectPro = !!(
                    keys.anthropic?.trim() ||
                    keys.openai?.trim() ||
                    keys.deepseek?.trim() ||
                    keys.groq?.trim() ||
                    keys.gemini?.trim() ||
                    keys.cerebras?.trim() ||
                    keys.sambanova?.trim() ||
                    keys.mistral?.trim() ||
                    keys.xai?.trim() ||
                    keys.together?.trim() ||
                    keys.fireworks?.trim() ||
                    keys.perplexity?.trim() ||
                    keys.cohere?.trim()
                  );
                  const hasAny = hasOpenRouter || hasZen || hasCopilot || hasCustom || hasDirectPro || !!keys.ollamaUrl?.trim();

                  if (!hasAny) {
                    return (
                      <div className="p-4 bg-[#1b1712] border border-amber-500/20 rounded-btn text-center space-y-2">
                        <div className="text-[12px] font-medium text-amber-400">⚠️ Henüz Bir Sağlayıcı Bağlanmadı</div>
                        <p className="text-[11px] text-[#8a8a8a]">
                          Varsayılan model seçebilmek için lütfen sol menüdeki <b>API Keys</b> sekmesinden bir API anahtarı (OpenCode Zen, Google Gemini, GitHub Copilot vb.) veya özel endpoint bağlayın.
                        </p>
                        <button
                          type="button"
                          onClick={() => setActiveTab('keys')}
                          className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded text-[11px] font-medium transition-colors"
                        >
                          API Keys Sekmesine Git
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div>
                      <label className="block text-[#8a8a8a] text-[12px] mb-1">Varsayılan Model</label>
                      <select
                        value={formData.defaultModel}
                        onChange={(e) => setFormData({ ...formData, defaultModel: e.target.value })}
                        className="w-full bg-[#111111] border border-[#262626] rounded-btn px-3 py-2 text-[#e5e5e5] focus:outline-none text-[13px]"
                      >
                        {hasZen && (
                          <optgroup label="⚡ OpenCode Zen Modelleri (Free Gateway)">
                            <option value="Nemotron 3 Super Free (Zen)">Nemotron 3 Super Free (Zen)</option>
                            <option value="MiniMax M2.5 Free (Zen)">MiniMax M2.5 Free (Zen)</option>
                            <option value="Big Pickle (Zen)">Big Pickle (Zen)</option>
                            <option value="Qwen 3.5 Plus (Zen)">Qwen 3.5 Plus (Zen)</option>
                          </optgroup>
                        )}
                        {hasCopilot && (
                          <optgroup label="🔗 GitHub Copilot Modelleri">
                            <option value="Copilot Claude 3.5 Sonnet">Copilot Claude 3.5 Sonnet</option>
                            <option value="Copilot GPT-4o">Copilot GPT-4o</option>
                          </optgroup>
                        )}
                        {hasOpenRouter && (
                          <optgroup label="Ücretsiz Modeller (OpenRouter Free)">
                            <option value="Nemotron 3.5 Lightning">Nemotron 3.5 Lightning (Ultra Hızlı)</option>
                            <option value="Nemotron Reasoning 30B">Nemotron Reasoning 30B (Akıl Yürütme)</option>
                            <option value="Laguna 2.1 Coder">Laguna 2.1 Coder (Mimari & Fix)</option>
                            <option value="MiniMax 3.1 Flash">MiniMax 3.1 Flash (Hafif Asistan)</option>
                          </optgroup>
                        )}
                        {hasCustom && (
                          <optgroup label="Özel & Yerel Endpoint Modeli">
                            <option value="Custom Endpoint Model">Custom Endpoint Model</option>
                          </optgroup>
                        )}
                        {(hasOpenRouter || hasDirectPro) && (
                          <optgroup label="Pro Modeller (Kredili / Kendi Key'iniz)">
                            {(hasOpenRouter || keys.anthropic?.trim()) && <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet</option>}
                            {keys.anthropic?.trim() && <option value="Claude 3.7 Sonnet">Claude 3.7 Sonnet (Reasoning)</option>}
                            {(hasOpenRouter || keys.deepseek?.trim()) && <option value="DeepSeek V3">DeepSeek V3</option>}
                            {(hasOpenRouter || keys.deepseek?.trim()) && <option value="DeepSeek R1">DeepSeek R1 (Reasoner)</option>}
                            {(hasOpenRouter || keys.groq?.trim()) && <option value="Llama 3.3 70B">Llama 3.3 70B</option>}
                            {(hasOpenRouter || keys.openai?.trim()) && <option value="GPT-4o">GPT-4o</option>}
                            {keys.openai?.trim() && <option value="o1">OpenAI o1</option>}
                            {keys.openai?.trim() && <option value="o3-mini">OpenAI o3-mini</option>}
                            {(hasOpenRouter || keys.gemini?.trim()) && <option value="Gemini 2.5 Flash">Gemini 2.5 Flash</option>}
                            {keys.cerebras?.trim() && <option value="Cerebras Llama 3.3 70B">Cerebras Llama 3.3 70B (2000+ tok/s)</option>}
                            {keys.sambanova?.trim() && <option value="SambaNova Qwen 2.5 Coder">SambaNova Qwen 2.5 Coder</option>}
                            {keys.mistral?.trim() && <option value="Codestral">Mistral Codestral</option>}
                            {keys.xai?.trim() && <option value="Grok 2">xAI Grok 2</option>}
                            {keys.together?.trim() && <option value="Together Qwen 2.5 Coder">Together Qwen 2.5 Coder</option>}
                            {keys.fireworks?.trim() && <option value="Fireworks DeepSeek V3">Fireworks DeepSeek V3</option>}
                            {keys.perplexity?.trim() && <option value="Perplexity Sonar">Perplexity Sonar Reasoner</option>}
                            {keys.cohere?.trim() && <option value="Cohere Command R+">Cohere Command R+</option>}
                          </optgroup>
                        )}
                      </select>
                    </div>
                  );
                })()}

                <div>
                  <label className="block text-[#8a8a8a] text-[12px] mb-1">Düşünce Derinliği (Reasoning Budget)</label>
                  <div className="flex gap-2">
                    {(['Low', 'Medium', 'High'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setFormData({ ...formData, thinkingLevel: lvl })}
                        className={`flex-1 py-1.5 rounded-btn border text-[12px] font-medium transition-colors ${
                          formData.thinkingLevel === lvl
                            ? 'bg-[#2a2a2a] border-[#383838] text-white'
                            : 'border-[#262626] text-[#8a8a8a] hover:bg-[#1f1f1f]'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'editor' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[#8a8a8a] text-[12px] mb-1">Yazı Boyutu (px)</label>
                  <input
                    type="number"
                    value={formData.fontSize}
                    onChange={(e) => setFormData({ ...formData, fontSize: Number(e.target.value) })}
                    className="w-full bg-[#111111] border border-[#262626] rounded-btn px-3 py-2 text-[#e5e5e5] focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-[13px] text-[#e5e5e5]">Değişiklikleri Otomatik Kaydet</span>
                  <input
                    type="checkbox"
                    checked={formData.autoSave}
                    onChange={(e) => setFormData({ ...formData, autoSave: e.target.checked })}
                    className="w-4 h-4 rounded accent-[#e5e5e5]"
                  />
                </div>
              </div>
            )}

            {activeTab === 'terminal' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[#8a8a8a] text-[12px] mb-1">Varsayılan Kabuk (Shell)</label>
                  <select
                    value={formData.terminalShell}
                    onChange={(e) => setFormData({ ...formData, terminalShell: e.target.value })}
                    className="w-full bg-[#111111] border border-[#262626] rounded-btn px-3 py-2 text-[#e5e5e5] focus:outline-none"
                  >
                    <option value="powershell.exe">PowerShell (Windows)</option>
                    <option value="cmd.exe">Command Prompt (cmd)</option>
                    <option value="bash">Bash / Git Bash</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'rules' && (
              <div className="space-y-3">
                <label className="block text-[#8a8a8a] text-[12px]">Sistem Kuralları & Yönergeler</label>
                <textarea
                  rows={6}
                  value={formData.systemInstructions}
                  onChange={(e) => setFormData({ ...formData, systemInstructions: e.target.value })}
                  className="w-full bg-[#111111] border border-[#262626] rounded-btn p-3 text-[#e5e5e5] text-[12px] focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Alt Butonlar */}
        <div className="h-14 px-5 border-t border-[#222530] bg-[#111317] flex items-center justify-between">
          <span className="text-[12px] text-emerald-400 font-medium">
            {savedSuccess && '✓ Ayarlar başarıyla kaydedildi!'}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveModal(null)}
              className="px-3.5 py-1.5 rounded-xl text-[12.5px] text-[#888888] hover:text-white hover:bg-[#1a1d26] transition-colors"
            >
              Vazgeç
            </button>
            <button
              onClick={handleSave}
              className="px-4.5 py-1.5 bg-white text-[#111317] hover:bg-[#e5e7eb] font-semibold rounded-xl text-[12.5px] flex items-center gap-1.5 transition-colors shadow-md"
            >
              <Save size={14} /> Ayarları Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
