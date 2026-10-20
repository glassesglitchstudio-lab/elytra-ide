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

                <div className="pt-2 border-t border-[#1f1f1f] space-y-2">
                  <span className="text-[12px] font-medium text-[#e5e5e5]">Local LLM / Custom Endpoint</span>
                  <div>
                    <label className="block text-[#8a8a8a] text-[11px] mb-1">Ollama URL (Local)</label>
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
                      className="w-full bg-[#111111] border border-[#262626] rounded-btn px-3 py-1.5 text-[#e5e5e5] text-[12px] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[#8a8a8a] text-[11px] mb-1">Custom OpenAI-Compatible Endpoint</label>
                    <input
                      type="text"
                      value={formData.apiKeys.customEndpoint || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          apiKeys: { ...formData.apiKeys, customEndpoint: e.target.value },
                        })
                      }
                      placeholder="https://api.your-vllm-host.com/v1/chat/completions"
                      className="w-full bg-[#111111] border border-[#262626] rounded-btn px-3 py-1.5 text-[#e5e5e5] text-[12px] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'models' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[#8a8a8a] text-[12px] mb-1">Default Model</label>
                  <select
                    value={formData.defaultModel}
                    onChange={(e) => setFormData({ ...formData, defaultModel: e.target.value })}
                    className="w-full bg-[#111111] border border-[#262626] rounded-btn px-3 py-2 text-[#e5e5e5] focus:outline-none"
                  >
                    <option value="gemini-3.8-flash">Gemini 3.8 Flash (High)</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                    <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                    <option value="deepseek-r1">DeepSeek R1 (Reasoning)</option>
                    <option value="qwen-2.5-coder">Qwen 2.5 Coder 32B</option>
                    <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Groq)</option>
                  </select>
                </div>

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
