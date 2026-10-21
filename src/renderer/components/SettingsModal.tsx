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
} from 'lucide-react';
import { useElythraStore } from '../store/useElythraStore';

export const SettingsModal: React.FC = () => {
  const { settings, updateSettings, setActiveModal } = useElythraStore();

  const [activeTab, setActiveTab] = useState<'keys' | 'models' | 'editor' | 'terminal' | 'rules'>('keys');
  const [formData, setFormData] = useState({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async () => {
    await updateSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setActiveModal(null);
    }, 800);
  };

  const keyList = [
    {
      id: 'openrouter',
      label: 'OpenRouter (Recommended — 300+ Models)',
      desc: 'Claude 3.5 Sonnet, DeepSeek V3/R1, Qwen 2.5 Coder, Llama 3.3 70B',
      placeholder: 'sk-or-v1-...',
      link: 'https://openrouter.ai/keys',
    },
    {
      id: 'opencodeZen',
      label: 'OpenCode Zen Gateway (Free & Fast LLM)',
      desc: 'Free models: nemotron-3-super-free, minimax-m2.5-free, big-pickle, qwen3.5-plus',
      placeholder: 'Bearer token or zen key (optional for free tier)',
      link: 'https://opencode.ai/zen',
    },
    {
      id: 'gemini',
      label: 'Google Gemini API',
      desc: 'Gemini 3.8 Flash, Gemini 2.5 Flash / Pro',
      placeholder: 'AIzaSy...',
      link: 'https://aistudio.google.com/app/apikey',
    },
    {
      id: 'anthropic',
      label: 'Anthropic Claude API',
      desc: 'Direct connection to Claude 3.5 Sonnet / Haiku / Opus',
      placeholder: 'sk-ant-...',
      link: 'https://console.anthropic.com/',
    },
    {
      id: 'openai',
      label: 'OpenAI API',
      desc: 'GPT-4o, o1, o3-mini',
      placeholder: 'sk-proj-...',
      link: 'https://platform.openai.com/api-keys',
    },
    {
      id: 'deepseek',
      label: 'DeepSeek Direct API',
      desc: 'DeepSeek Chat (V3) and DeepSeek Reasoner (R1)',
      placeholder: 'sk-...',
      link: 'https://platform.deepseek.com/',
    },
    {
      id: 'groq',
      label: 'Groq Cloud (LPU Ultra-Fast)',
      desc: 'Llama 3.3 70B at 300+ tok/s',
      placeholder: 'gsk_...',
      link: 'https://console.groq.com/keys',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 select-none">
      <div className="w-[740px] h-[580px] bg-[#161616] border border-[#262626] rounded-btn shadow-2xl flex flex-col overflow-hidden text-[#e5e5e5]">
        {/* Başlık */}
        <div className="h-12 px-4 border-b border-[#1f1f1f] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key size={16} className="text-[#e5e5e5]" />
            <span className="text-[14px] font-semibold tracking-wide">
              Settings & BYOK (Bring Your Own Key)
            </span>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1 text-[#8a8a8a] hover:text-[#e5e5e5] rounded hover:bg-[#2a2a2a]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Gövde */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sol Sekme Menüsü */}
          <div className="w-52 bg-[#111111] border-r border-[#1f1f1f] p-2 space-y-1">
            <button
              onClick={() => setActiveTab('keys')}
              className={`w-full flex items-center gap-2 px-3 py-2 text-[13px] rounded-btn transition-colors ${
                activeTab === 'keys' ? 'bg-[#2a2a2a] text-white font-medium' : 'text-[#8a8a8a] hover:bg-[#1a1a1a]'
              }`}
            >
              <Key size={15} /> BYOK API Keys
            </button>
            <button
              onClick={() => setActiveTab('models')}
              className={`w-full flex items-center gap-2 px-3 py-2 text-[13px] rounded-btn transition-colors ${
                activeTab === 'models' ? 'bg-[#2a2a2a] text-white font-medium' : 'text-[#8a8a8a] hover:bg-[#1a1a1a]'
              }`}
            >
              <Cpu size={15} /> Model Preferences
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              className={`w-full flex items-center gap-2 px-3 py-2 text-[13px] rounded-btn transition-colors ${
                activeTab === 'editor' ? 'bg-[#2a2a2a] text-white font-medium' : 'text-[#8a8a8a] hover:bg-[#1a1a1a]'
              }`}
            >
              <Sliders size={15} /> Editor
            </button>
            <button
              onClick={() => setActiveTab('terminal')}
              className={`w-full flex items-center gap-2 px-3 py-2 text-[13px] rounded-btn transition-colors ${
                activeTab === 'terminal' ? 'bg-[#2a2a2a] text-white font-medium' : 'text-[#8a8a8a] hover:bg-[#1a1a1a]'
              }`}
            >
              <Terminal size={15} /> Terminal
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`w-full flex items-center gap-2 px-3 py-2 text-[13px] rounded-btn transition-colors ${
                activeTab === 'rules' ? 'bg-[#2a2a2a] text-white font-medium' : 'text-[#8a8a8a] hover:bg-[#1a1a1a]'
              }`}
            >
              <Shield size={15} /> System Rules
            </button>
          </div>

          {/* Sağ İçerik Alanı */}
          <div className="flex-1 p-5 overflow-y-auto text-[13px] space-y-4">
            {activeTab === 'keys' && (
              <div className="space-y-4">
                <div className="p-3 bg-[#111111] border border-[#262626] rounded-btn text-[12px] text-[#8a8a8a] leading-relaxed">
                  <span className="text-[#e5e5e5] font-semibold">BYOK (Bring Your Own Key):</span> Add your keys below. You only pay standard API token prices directly to your provider. Keys are saved encrypted in your local machine.
                </div>

                {keyList.map((k) => {
                  const val = (formData.apiKeys as any)[k.id] || '';
                  return (
                    <div key={k.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[#e5e5e5] text-[12px] font-medium flex items-center gap-1.5">
                          <span>{k.label}</span>
                          {val ? (
                            <CheckCircle size={13} className="text-green-400" />
                          ) : (
                            <AlertCircle size={13} className="text-[#666666]" />
                          )}
                        </label>
                        <a
                          href={k.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-[#8a8a8a] hover:text-[#e5e5e5] flex items-center gap-1 underline"
                        >
                          Get key <ExternalLink size={10} />
                        </a>
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
                        placeholder={k.placeholder}
                        className="w-full bg-[#111111] border border-[#262626] rounded-btn px-3 py-1.5 text-[#e5e5e5] text-[12px] focus:outline-none focus:border-[#444444]"
                      />
                      <p className="text-[11px] text-[#666666]">{k.desc}</p>
                    </div>
                  );
                })}

                <div className="pt-2 border-t border-[#1f1f1f] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-[#e5e5e5] flex items-center gap-1.5">
                      <Cpu size={14} className="text-cyan-400" />
                      Local LLM & Custom Endpoints
                    </span>
                    <span className="text-[10px] text-[#8a8a8a]">OpenAI-Compatible & vLLM</span>
                  </div>

                  {/* Preset Quick-Fill Buttons */}
                  <div className="space-y-1.5 p-2.5 bg-[#101216] border border-[#232733] rounded-lg">
                    <label className="block text-[#a0aab8] text-[11px] font-medium">Hızlı Şablonlar (Tek Tıkla Doldur):</label>
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
                        className="px-2.5 py-1 bg-[#16202a] hover:bg-[#1f2e3d] border border-cyan-800/40 hover:border-cyan-500/60 rounded text-[11px] text-cyan-300 transition-all flex items-center gap-1 font-medium"
                      >
                        ⚡ OpenCode Zen (Free)
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
                        className="px-2.5 py-1 bg-[#1a1c22] hover:bg-[#262a34] border border-[#2f3545] hover:border-[#47516b] rounded text-[11px] text-[#d1d5db] transition-all flex items-center gap-1"
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
                        className="px-2.5 py-1 bg-[#1a1c22] hover:bg-[#262a34] border border-[#2f3545] hover:border-[#47516b] rounded text-[11px] text-[#d1d5db] transition-all flex items-center gap-1"
                      >
                        🦙 Ollama (Local :11434)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            apiKeys: {
                              ...formData.apiKeys,
                              customModel: 'gulmez-27b',
                            },
                          })
                        }
                        className="px-2.5 py-1 bg-[#201826] hover:bg-[#2c2035] border border-purple-800/40 hover:border-purple-500/60 rounded text-[11px] text-purple-300 transition-all flex items-center gap-1"
                      >
                        🧠 Kaggle 0.1-Pro (27B)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#8a8a8a] text-[11px] mb-1">Custom OpenAI-Compatible Endpoint URL</label>
                    <input
                      type="text"
                      value={formData.apiKeys.customEndpoint || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          apiKeys: { ...formData.apiKeys, customEndpoint: e.target.value },
                        })
                      }
                      placeholder="https://opencode.ai/zen/v1/chat/completions veya https://...trycloudflare.com/v1"
                      className="w-full bg-[#111111] border border-[#262626] rounded-btn px-3 py-1.5 text-[#e5e5e5] text-[12px] focus:outline-none focus:border-[#444444]"
                    />
                    <p className="text-[10px] text-[#666666] mt-0.5">
                      vLLM, LM Studio, Zen veya Kaggle tünelinizi bağlayın. Otomatik /chat/completions formatlar.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[#8a8a8a] text-[11px] mb-1">Custom Bearer Token / Key (Opsiyonel)</label>
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
                        className="w-full bg-[#111111] border border-[#262626] rounded-btn px-3 py-1.5 text-[#e5e5e5] text-[12px] focus:outline-none focus:border-[#444444]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#8a8a8a] text-[11px] mb-1">Target Model ID (Opsiyonel)</label>
                      <input
                        type="text"
                        value={formData.apiKeys.customModel || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            apiKeys: { ...formData.apiKeys, customModel: e.target.value },
                          })
                        }
                        placeholder="nemotron-3-super-free, gulmez-27b vb."
                        className="w-full bg-[#111111] border border-[#262626] rounded-btn px-3 py-1.5 text-[#e5e5e5] text-[12px] focus:outline-none focus:border-[#444444]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#8a8a8a] text-[11px] mb-1">Ollama Native URL (Local)</label>
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
                      className="w-full bg-[#111111] border border-[#262626] rounded-btn px-3 py-1.5 text-[#e5e5e5] text-[12px] focus:outline-none focus:border-[#444444]"
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
                  const hasCustom = !!keys.customEndpoint?.trim();
                  const hasDirectPro = !!(keys.anthropic?.trim() || keys.openai?.trim() || keys.deepseek?.trim() || keys.groq?.trim() || keys.gemini?.trim());
                  const hasAny = hasOpenRouter || hasZen || hasCustom || hasDirectPro || !!keys.ollamaUrl?.trim();

                  if (!hasAny) {
                    return (
                      <div className="p-4 bg-[#1b1712] border border-amber-500/20 rounded-btn text-center space-y-2">
                        <div className="text-[12px] font-medium text-amber-400">⚠️ Henüz Bir Sağlayıcı Bağlanmadı</div>
                        <p className="text-[11px] text-[#8a8a8a]">
                          Varsayılan model seçebilmek için lütfen sol menüdeki <b>API Keys</b> sekmesinden bir API anahtarı (OpenCode Zen, OpenRouter, Gemini vb.) veya özel endpoint bağlayın.
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
                      <label className="block text-[#8a8a8a] text-[12px] mb-1">Default Model</label>
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
                        {hasOpenRouter && (
                          <optgroup label="Ücretsiz Modeller (OpenRouter Free)">
                            <option value="Nemotron 3.5 Lightning">Nemotron 3.5 Lightning (Ultra Hızlı)</option>
                            <option value="Nemotron Reasoning 30B">Nemotron Reasoning 30B (Akıl Yürütme)</option>
                            <option value="Laguna 2.1 Coder">Laguna 2.1 Coder (Mimari & Fix)</option>
                            <option value="MiniMax 3.1 Flash">MiniMax 3.1 Flash (Hafif Asistan)</option>
                          </optgroup>
                        )}
                        {hasCustom && (
                          <optgroup label="Özel Stüdyo & Custom Endpoint">
                            <option value="0.1-Pro (27B Çift Beyin)">0.1-Pro (27B Çift Beyin)</option>
                            <option value="Custom Endpoint Model">Custom Endpoint Model</option>
                          </optgroup>
                        )}
                        {(hasOpenRouter || hasDirectPro) && (
                          <optgroup label="Pro Modeller (Kredili / Kendi Key'iniz)">
                            {(hasOpenRouter || keys.anthropic?.trim()) && <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet</option>}
                            {(hasOpenRouter || keys.deepseek?.trim()) && <option value="DeepSeek V3">DeepSeek V3</option>}
                            {(hasOpenRouter || keys.groq?.trim()) && <option value="Llama 3.3 70B">Llama 3.3 70B</option>}
                            {(hasOpenRouter || keys.openai?.trim()) && <option value="GPT-4o">GPT-4o</option>}
                            {(hasOpenRouter || keys.gemini?.trim()) && <option value="Gemini 2.5 Flash">Gemini 2.5 Flash</option>}
                          </optgroup>
                        )}
                      </select>
                    </div>
                  );
                })()}

                <div>
                  <label className="block text-[#8a8a8a] text-[12px] mb-1">Thinking Depth / Reasoning Budget</label>
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
                  <label className="block text-[#8a8a8a] text-[12px] mb-1">Font Size (px)</label>
                  <input
                    type="number"
                    value={formData.fontSize}
                    onChange={(e) => setFormData({ ...formData, fontSize: Number(e.target.value) })}
                    className="w-full bg-[#111111] border border-[#262626] rounded-btn px-3 py-2 text-[#e5e5e5] focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-[13px] text-[#e5e5e5]">Auto Save Changes</span>
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
                  <label className="block text-[#8a8a8a] text-[12px] mb-1">Default Shell</label>
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
                <label className="block text-[#8a8a8a] text-[12px]">System Instructions & Guidelines</label>
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
        <div className="h-12 px-4 border-t border-[#1f1f1f] bg-[#111111] flex items-center justify-between">
          <span className="text-[12px] text-green-400">
            {savedSuccess && 'Settings saved successfully!'}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveModal(null)}
              className="px-3 py-1.5 rounded-btn text-[12px] text-[#8a8a8a] hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 bg-[#e5e5e5] text-[#111111] hover:bg-white font-medium rounded-btn text-[12px] flex items-center gap-1.5 transition-colors"
            >
              <Save size={13} /> Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
