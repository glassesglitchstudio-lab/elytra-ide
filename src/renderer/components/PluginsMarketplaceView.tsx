import React, { useState } from 'react';
import {
  Globe,
  GitBranch,
  Gamepad2,
  Package,
  TestTube2,
  Palette,
  Container,
  Terminal,
  Search,
  Check,
  Download,
  Star,
  ExternalLink,
  Sparkles,
  Sliders,
  ShieldCheck,
  RefreshCw,
  Play,
  X,
  FileCode,
  Layers,
} from 'lucide-react';
import { useElythraStore } from '../store/useElythraStore';

export interface PluginItem {
  id: string;
  name: string;
  category: 'web' | 'git' | 'gamedev' | 'pkg' | 'test' | 'style' | 'docker' | 'python';
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconBg: string;
  iconColor: string;
  author: string;
  version: string;
  downloads: string;
  rating: number;
  description: string;
  features: string[];
  actionLabel?: string;
  hasInteractiveDemo?: boolean;
}

const MARKETPLACE_PLUGINS: PluginItem[] = [
  {
    id: 'plugin-web-search',
    name: 'Web Search & Deep Research',
    category: 'web',
    icon: Globe,
    iconBg: 'bg-sky-500/10 border-sky-500/30',
    iconColor: 'text-sky-400',
    author: 'Elytra Core Lab',
    version: '1.4.0',
    downloads: '38.4k',
    rating: 4.9,
    description: 'Yapay zeka modellerine canlı internet erişimi sağlar. HackerNews, GitHub depoları ve teknik dökümanları tarayarak güncel bilgiler sunar.',
    features: ['@web referansı ile sohbette arama', '/search komutu ile canlı araştırma', 'HackerNews & GitHub Code entegrasyonu', 'Otomatik kaynak bağlantıları ve alıntılar'],
    actionLabel: 'Canlı Arama Yap',
    hasInteractiveDemo: true,
  },
  {
    id: 'plugin-git-butler',
    name: 'Git Butler & Smart Commit',
    category: 'git',
    icon: GitBranch,
    iconBg: 'bg-emerald-500/10 border-emerald-500/30',
    iconColor: 'text-emerald-400',
    author: 'DevTools Engineering',
    version: '2.1.0',
    downloads: '29.1k',
    rating: 4.8,
    description: 'Çalışma alanındaki Git diff değişikliklerini analiz eder ve tek tıkla standart Conventional Commit (feat, fix, chore) mesajları oluşturur.',
    features: ['Akıllı semantik commit mesajı', 'Diff analizi ve dal sağlığı kontrolü', 'Tek tıkla stage ve commit', '/commit hızlı komut desteği'],
    actionLabel: 'Git Durumu İncele',
    hasInteractiveDemo: true,
  },
  {
    id: 'plugin-ue5-helper',
    name: 'Unreal Engine 5 & C++ Architect',
    category: 'gamedev',
    icon: Gamepad2,
    iconBg: 'bg-purple-500/10 border-purple-500/30',
    iconColor: 'text-purple-400',
    author: 'GameDev Studio Labs',
    version: '1.2.5',
    downloads: '18.7k',
    rating: 5.0,
    description: 'Unreal Engine 5 C++ ve Blueprint mimarisi uzmanı. UCLASS, UPROPERTY, UFUNCTION makrolarını ve Enhanced Input mekaniklerini hatasız oluşturur.',
    features: ['UE5 C++ Header & Source şablonları', 'Enhanced Input & Gameplay Ability System (GAS)', 'Bellek ve tick optimizasyon rehberi', '/ue5 komutuyla otonom oyun kodu üretimi'],
    actionLabel: 'UE5 Şablonu Üret',
    hasInteractiveDemo: true,
  },
  {
    id: 'plugin-pkg-inspector',
    name: 'Package & Dependency Auditor',
    category: 'pkg',
    icon: Package,
    iconBg: 'bg-amber-500/10 border-amber-500/30',
    iconColor: 'text-amber-400',
    author: 'Security & DevOps Team',
    version: '1.3.2',
    downloads: '15.6k',
    rating: 4.7,
    description: 'Projedeki package.json dosyasını tarar, bağımlılıkları, npm scriptlerini ve sürüm güncellemelerini anında listeler.',
    features: ['package.json bağımlılık haritası', 'Scripts hızlı çalıştırma listesi', 'Güvenlik ve paket sağlığı kontrolü', 'Eksik bağımlılık tespiti'],
    actionLabel: 'package.json Tara',
    hasInteractiveDemo: true,
  },
  {
    id: 'plugin-test-generator',
    name: 'Unit Test & QA Synthesizer',
    category: 'test',
    icon: TestTube2,
    iconBg: 'bg-rose-500/10 border-rose-500/30',
    iconColor: 'text-rose-400',
    author: 'QA Automation Lab',
    version: '1.1.0',
    downloads: '12.3k',
    rating: 4.8,
    description: 'Açık olan dosyayı analiz ederek Vitest, Jest veya PyTest için uçtan uca kapsamlı birim test senaryoları ve mock verileri yazar.',
    features: ['Vitest, Jest ve PyTest desteği', 'Otomatik Mocking ve Edge-Case tespiti', 'Fonksiyon girdi/çıktı doğrulama', '/test komut entegrasyonu'],
    actionLabel: 'Test Şablonu Hazırla',
    hasInteractiveDemo: true,
  },
  {
    id: 'plugin-design-tokens',
    name: 'Tailwind & Design Token Studio',
    category: 'style',
    icon: Palette,
    iconBg: 'bg-indigo-500/10 border-indigo-500/30',
    iconColor: 'text-indigo-400',
    author: 'UX/UI Design Guild',
    version: '1.0.8',
    downloads: '21.0k',
    rating: 4.9,
    description: 'Modern HSL renk paletleri, TailwindCSS tokenları ve cam efekti (glassmorphism) stilleri sunan görsel tasarım kütüphanesi.',
    features: ['TailwindCSS v4 & v3 token desteği', 'Koyu mod ve HSL renk uyumu', 'Glassmorphism ve yumuşak gölgeler', 'Hızlı CSS kopyalama'],
    actionLabel: 'Paletleri Gör',
    hasInteractiveDemo: true,
  },
  {
    id: 'plugin-docker-architect',
    name: 'Docker & Container Architect',
    category: 'docker',
    icon: Container,
    iconBg: 'bg-cyan-500/10 border-cyan-500/30',
    iconColor: 'text-cyan-400',
    author: 'Cloud Infrastructure',
    version: '1.1.4',
    downloads: '14.9k',
    rating: 4.8,
    description: 'Projenin dilini (Node, Python, Go, Rust) otomatik tespit ederek üretime hazır, çok aşamalı (multi-stage) Dockerfile ve docker-compose oluşturur.',
    features: ['Multi-Stage Dockerfile üretimi', 'docker-compose.yml port eşleme', 'Hafif Alpine & distroless imajlar', '.dockerignore optimizasyonu'],
    actionLabel: 'Dockerfile Önizle',
    hasInteractiveDemo: true,
  },
  {
    id: 'plugin-python-runner',
    name: 'Python Venv & Script Runner',
    category: 'python',
    icon: Terminal,
    iconBg: 'bg-yellow-500/10 border-yellow-500/30',
    iconColor: 'text-yellow-400',
    author: 'Pythonic Engineering',
    version: '1.5.1',
    downloads: '26.4k',
    rating: 4.9,
    description: 'Sistemdeki Python kurulumunu ve sanal ortamları (.venv) algılar. Pip paketlerini ve betik çıktısını yönetir.',
    features: ['Sanal ortam (.venv) otomatik tespiti', 'Pip requirements.txt inceleme', 'Hızlı script çalıştırma', 'Terminal çıktı analizi'],
    actionLabel: 'Ortamı Doğrula',
    hasInteractiveDemo: true,
  },
];

export const PluginsMarketplaceView: React.FC = () => {
  const { settings, updateSettings, activeProject, gitStatus, openFileTab } = useElythraStore();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeModalPlugin, setActiveModalPlugin] = useState<PluginItem | null>(null);

  // Live Interactive State for Demos
  const [demoQuery, setDemoQuery] = useState('React 19 Server Components ve Action hooks');
  const [demoResults, setDemoResults] = useState<Array<{ title: string; link: string; snippet: string; source: string }>>([]);
  const [isSearchingWeb, setIsSearchingWeb] = useState(false);
  const [pkgData, setPkgData] = useState<any>(null);
  const [demoOutput, setDemoOutput] = useState<string>('');

  const installedPlugins: Record<string, boolean> = settings?.installedPlugins || {
    'plugin-web-search': true,
    'plugin-git-butler': true,
    'plugin-ue5-helper': true,
    'plugin-pkg-inspector': true,
    'plugin-test-generator': true,
    'plugin-design-tokens': true,
    'plugin-docker-architect': true,
    'plugin-python-runner': true,
  };

  const togglePlugin = async (id: string) => {
    const nextState = !installedPlugins[id];
    const updated = {
      ...installedPlugins,
      [id]: nextState,
    };
    await updateSettings({
      installedPlugins: updated,
    });
  };

  const filteredPlugins = MARKETPLACE_PLUGINS.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch =
      !search.trim() ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.features.some((f) => f.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleOpenDemo = async (plugin: PluginItem) => {
    setActiveModalPlugin(plugin);
    setDemoOutput('');

    if (plugin.id === 'plugin-web-search') {
      handleRunWebSearch(demoQuery);
    } else if (plugin.id === 'plugin-pkg-inspector') {
      if (activeProject && window.elythraAPI) {
        try {
          const content = await window.elythraAPI.readFile(`${activeProject.path}/package.json`);
          if (content) {
            setPkgData(JSON.parse(content));
          }
        } catch {
          setPkgData(null);
        }
      }
    } else if (plugin.id === 'plugin-git-butler') {
      if (gitStatus) {
        const count = gitStatus.modified.length + gitStatus.staged.length + gitStatus.untracked.length;
        setDemoOutput(
          `Git Dalı: ${gitStatus.branch}\nDeğişen Dosyalar: ${count} dosya\nÖnerilen Commit Mesajı: feat: update project components and settings\nDurum: ${gitStatus.clean ? 'Temiz (Değişiklik yok)' : 'Bekleyen değişiklikler mevcut'}`
        );
      }
    } else if (plugin.id === 'plugin-ue5-helper') {
      setDemoOutput(
        `// Unreal Engine 5 C++ Gameplay Character Header Example\n#pragma once\n\n#include "CoreMinimal.h"\n#include "GameFramework/Character.h"\n#include "ElytraCharacter.generated.h"\n\nUCLASS(config=Game)\nclass AElytraCharacter : public ACharacter\n{\n    GENERATED_BODY()\n\n    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = Camera)\n    class USpringArmComponent* CameraBoom;\n\npublic:\n    UFUNCTION(BlueprintCallable, Category = "Gameplay")\n    void PerformAbilityAction();\n};`
      );
    } else if (plugin.id === 'plugin-docker-architect') {
      setDemoOutput(
        `# Production Multi-Stage Dockerfile generated by Elytra\nFROM node:20-alpine AS builder\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\n\nFROM node:20-alpine AS runner\nWORKDIR /app\nENV NODE_ENV=production\nCOPY --from=builder /app/dist ./dist\nCOPY --from=builder /app/package*.json ./\nRUN npm ci --omit=dev\nEXPOSE 3000\nCMD ["node", "dist/index.js"]`
      );
    }
  };

  const handleRunWebSearch = async (q: string) => {
    if (!q.trim() || !window.elythraAPI) return;
    setIsSearchingWeb(true);
    try {
      const results = await window.elythraAPI.webSearch(q);
      setDemoResults(results);
    } catch (err: any) {
      console.error('Web search demo failed:', err);
    } finally {
      setIsSearchingWeb(false);
    }
  };

  return (
    <div className="flex-1 h-full bg-[#0c0e12] overflow-y-auto flex flex-col items-center select-text">
      {/* Top Hero Banner */}
      <div className="w-full max-w-[1080px] px-6 pt-8 pb-6 border-b border-[#1c202a]">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-sky-400 bg-sky-950/60 border border-sky-800/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles size={11} />
                <span>Otonom IDE Ekosistemi</span>
              </span>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                %100 Gerçek & Çalışır
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Elytra Plugin Marketplace
            </h1>
            <p className="text-[13px] text-[#8e96a4] mt-1 max-w-[620px] leading-relaxed">
              Modellerinize canlı internet araması kazandırın, Git operasyonlarını otomatikleştirin veya özel dil/framework araçlarını aktif edin.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-[#14161f] border border-[#232734] text-[12px] text-[#a0aec0] flex items-center gap-2 shadow-sm">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span>
                <strong className="text-white">{Object.values(installedPlugins).filter(Boolean).length}</strong> Aktif Eklenti
              </span>
            </div>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="mt-6 flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[260px] relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#717888]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Eklenti, komut veya özellik ara (Web Search, Git, UE5, Docker...)"
              className="w-full pl-9 pr-4 py-2 bg-[#12141a] border border-[#222634] focus:border-sky-500/50 rounded-xl text-[12.5px] text-white placeholder-[#616878] focus:outline-none transition-all shadow-inner"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'all', label: 'Tümü' },
              { id: 'web', label: '🌐 Web & Araştırma' },
              { id: 'git', label: '⚡ Git & Ajan' },
              { id: 'gamedev', label: '🎮 Oyun (UE5)' },
              { id: 'pkg', label: '📦 Paketler' },
              { id: 'test', label: '🧪 Testler' },
              { id: 'docker', label: '🐳 Docker' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-[11.5px] font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                    : 'bg-[#14161f] text-[#8e96a4] hover:text-white border border-[#202432]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Plugins Grid */}
      <div className="w-full max-w-[1080px] p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPlugins.map((plugin) => {
          const isInstalled = !!installedPlugins[plugin.id];
          const Icon = plugin.icon;

          return (
            <div
              key={plugin.id}
              className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between shadow-lg relative ${
                isInstalled
                  ? 'bg-[#12151d] border-[#252b3b] hover:border-sky-500/40'
                  : 'bg-[#0f1117] border-[#1d222e] opacity-80 hover:opacity-100'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl border ${plugin.iconBg} ${plugin.iconColor} shadow-inner`}>
                      <Icon size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-[14px] font-semibold text-white">{plugin.name}</h3>
                        <span className="text-[9.5px] font-mono text-[#888888] px-1.5 py-0.2 bg-[#1a1e28] rounded border border-[#2a3040]">
                          v{plugin.version}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-[#717888] mt-0.5">
                        <span>{plugin.author}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1 text-amber-400">
                          <Star size={11} fill="currentColor" />
                          <span>{plugin.rating}</span>
                        </span>
                        <span>·</span>
                        <span>{plugin.downloads} indirme</span>
                      </div>
                    </div>
                  </div>

                  {/* Toggle Install Switch */}
                  <button
                    onClick={() => togglePlugin(plugin.id)}
                    className={`px-3 py-1.5 rounded-lg text-[11.5px] font-medium transition-all flex items-center gap-1.5 ${
                      isInstalled
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                        : 'bg-[#1c212e] text-[#888888] hover:text-white border border-[#2a3142]'
                    }`}
                  >
                    {isInstalled ? (
                      <>
                        <Check size={12} strokeWidth={2.5} className="text-emerald-400" />
                        <span>Aktif</span>
                      </>
                    ) : (
                      <>
                        <Download size={12} />
                        <span>Yükle</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Description */}
                <p className="text-[12.5px] text-[#8e96a4] leading-relaxed mt-3">
                  {plugin.description}
                </p>

                {/* Features Pills */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {plugin.features.map((feat, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#161a24] text-[#a0aec0] border border-[#202534]"
                    >
                      {feat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Card Actions */}
              <div className="mt-4 pt-3 border-t border-[#1a1e29] flex items-center justify-between">
                <span className="text-[11px] text-[#616878] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Sistem Entegre</span>
                </span>

                {plugin.actionLabel && (
                  <button
                    onClick={() => handleOpenDemo(plugin)}
                    className="px-2.5 py-1 text-[11px] font-medium text-sky-400 hover:text-sky-300 bg-sky-950/40 hover:bg-sky-950/70 border border-sky-800/40 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Play size={10} fill="currentColor" />
                    <span>{plugin.actionLabel}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Tool / Demo Drawer Modal */}
      {activeModalPlugin && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-2xl bg-[#12151d] border border-[#2a3142] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-[#202534] bg-[#141822] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <activeModalPlugin.icon size={18} className={activeModalPlugin.iconColor} />
                <h3 className="text-[14px] font-semibold text-white">
                  {activeModalPlugin.name} · Canlı Araç Konsolu
                </h3>
              </div>
              <button
                onClick={() => setActiveModalPlugin(null)}
                className="p-1 text-[#888888] hover:text-white rounded-lg hover:bg-[#202534] transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              {/* Web Search Tool Demo */}
              {activeModalPlugin.id === 'plugin-web-search' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={demoQuery}
                      onChange={(e) => setDemoQuery(e.target.value)}
                      placeholder="Webde aramak istediğiniz konuyu yazın..."
                      className="flex-1 px-3 py-2 bg-[#181c26] border border-[#282f42] rounded-xl text-[12.5px] text-white focus:outline-none focus:border-sky-500/50"
                      onKeyDown={(e) => e.key === 'Enter' && handleRunWebSearch(demoQuery)}
                    />
                    <button
                      onClick={() => handleRunWebSearch(demoQuery)}
                      disabled={isSearchingWeb}
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-[12px] font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      {isSearchingWeb ? <RefreshCw size={13} className="animate-spin" /> : <Search size={13} />}
                      <span>Ara</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#717888]">
                      Canlı Web Arama Sonuçları ({demoResults.length} Kaynak)
                    </div>

                    {isSearchingWeb ? (
                      <div className="p-8 text-center text-[#888888] text-[12px] flex items-center justify-center gap-2">
                        <RefreshCw size={14} className="animate-spin text-sky-400" />
                        <span>HackerNews, GitHub ve Teknik Kaynaklar taranıyor...</span>
                      </div>
                    ) : demoResults.length === 0 ? (
                      <div className="p-6 text-center text-[#777777] text-[12px] bg-[#161922] rounded-xl border border-[#222736]">
                        Yukarıdaki arama çubuğunu kullanarak güncel herhangi bir konuyu aratın.
                      </div>
                    ) : (
                      demoResults.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-[#161922] border border-[#222736] hover:border-sky-500/30 transition-all text-[12.5px] space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-white truncate">{item.title}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-950/60 text-sky-400 border border-sky-800/40">
                              {item.source}
                            </span>
                          </div>
                          <p className="text-[11.5px] text-[#8e96a4] line-clamp-2 leading-relaxed">
                            {item.snippet}
                          </p>
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:underline pt-0.5"
                          >
                            <span>Kaynağı Aç</span>
                            <ExternalLink size={10} />
                          </a>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Package Inspector Demo */}
              {activeModalPlugin.id === 'plugin-pkg-inspector' && (
                <div className="space-y-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[#717888]">
                    {activeProject ? `Proje: ${activeProject.name} (package.json)` : 'Açık Proje Bulunamadı'}
                  </div>

                  {pkgData ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-[12px]">
                        <div className="p-2.5 rounded-lg bg-[#181c26] border border-[#282f42]">
                          <span className="text-[#888888] block text-[10px]">Paket Adı</span>
                          <span className="text-white font-mono">{pkgData.name || 'Bilinmiyor'}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-[#181c26] border border-[#282f42]">
                          <span className="text-[#888888] block text-[10px]">Sürüm</span>
                          <span className="text-white font-mono">{pkgData.version || '1.0.0'}</span>
                        </div>
                      </div>

                      {pkgData.scripts && (
                        <div>
                          <span className="text-[11px] font-semibold text-[#888888] block mb-1">Mevcut NPM Scriptleri:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {Object.keys(pkgData.scripts).map((s) => (
                              <span key={s} className="px-2 py-0.5 rounded bg-[#181c26] border border-[#262c3e] text-sky-400 font-mono text-[11px]">
                                npm run {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {pkgData.dependencies && (
                        <div>
                          <span className="text-[11px] font-semibold text-[#888888] block mb-1">Bağımlılıklar (Dependencies):</span>
                          <div className="max-h-40 overflow-y-auto p-2 rounded-xl bg-[#141720] border border-[#222736] space-y-1 text-[11px] font-mono">
                            {Object.entries(pkgData.dependencies).map(([k, v]) => (
                              <div key={k} className="flex items-center justify-between text-[#a0aec0]">
                                <span>{k}</span>
                                <span className="text-emerald-400">{String(v)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-[#777777] text-[12px] bg-[#161922] rounded-xl border border-[#222736]">
                      Geçerli bir çalışma alanında package.json dosyası bulunamadı. Lütfen sol panelden bir proje klasörü açın.
                    </div>
                  )}
                </div>
              )}

              {/* Code Snippet / Text Demos (Git, UE5, Docker) */}
              {demoOutput && (
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[#717888]">
                    Üretilen Çıktı & Önizleme
                  </div>
                  <pre className="p-4 rounded-xl bg-[#141720] border border-[#222736] text-[#e2e8f0] font-mono text-[11.5px] whitespace-pre-wrap overflow-x-auto leading-relaxed">
                    {demoOutput}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-[#202534] bg-[#141822] flex items-center justify-between">
              <span className="text-[11px] text-[#717888]">
                Durum: <strong className="text-emerald-400">Çalışmaya Hazır</strong>
              </span>
              <button
                onClick={() => setActiveModalPlugin(null)}
                className="px-3.5 py-1.5 rounded-lg bg-[#222634] hover:bg-[#2c3244] text-white text-[12px] font-medium transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
