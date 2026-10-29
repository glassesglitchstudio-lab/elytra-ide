import React, { useState, useEffect, useRef } from 'react';
import { Search, Terminal, Sliders, FolderOpen, Save, FileCode, Bot, X, Sparkles } from 'lucide-react';
import { useElythraStore } from '../store/useElythraStore';

export const CommandPalette: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    toggleTerminal,
    toggleAIPanel,
    toggleSidebar,
    saveAllTabs,
    openProject,
    openFileTab,
    fileTree,
  } = useElythraStore();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeModal === 'command-palette' || activeModal === 'quick-open') {
      inputRef.current?.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [activeModal]);

  if (activeModal !== 'command-palette' && activeModal !== 'quick-open') return null;

  const COMMANDS = [
    { id: 'term', title: 'View: Toggle Integrated Terminal', shortcut: 'Ctrl+`', icon: Terminal, action: toggleTerminal },
    { id: 'ai', title: 'View: Toggle AI Assistant Panel', shortcut: 'Ctrl+L', icon: Bot, action: toggleAIPanel },
    { id: 'sidebar', title: 'View: Toggle Primary Sidebar', shortcut: 'Ctrl+B', icon: Sliders, action: toggleSidebar },
    { id: 'saveall', title: 'File: Save All Open Files', shortcut: 'Ctrl+K S', icon: Save, action: saveAllTabs },
    {
      id: 'open',
      title: 'File: Open Workspace Folder...',
      shortcut: 'Ctrl+O',
      icon: FolderOpen,
      action: async () => {
        if (!window.elythraAPI) return;
        const f = await window.elythraAPI.openDirectoryDialog();
        if (f) openProject(f);
      },
    },
    { id: 'settings', title: 'Preferences: Open BYOK Settings', shortcut: 'Ctrl+,', icon: Sliders, action: () => setActiveModal('settings') },
  ];

  // Flatten files for quick open
  const flatFiles: Array<{ name: string; path: string }> = [];
  function gather(nodes: any[]) {
    for (const n of nodes) {
      if (!n.isDirectory) flatFiles.push({ name: n.name, path: n.path });
      if (n.children) gather(n.children);
    }
  }
  gather(fileTree);

  const fileItems = flatFiles.map((f) => ({
    id: f.path,
    title: f.name,
    shortcut: f.path,
    icon: FileCode,
    action: () => openFileTab(f.path),
  }));

  const pool = activeModal === 'quick-open' ? fileItems : [...COMMANDS, ...fileItems];

  const filtered = pool.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      (item.shortcut && item.shortcut.toLowerCase().includes(query.toLowerCase()))
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
        setActiveModal(null);
      }
    } else if (e.key === 'Escape') {
      setActiveModal(null);
    }
  };

  return (
    <div
      onClick={() => setActiveModal(null)}
      className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-start justify-center pt-24 z-50 select-none animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[620px] max-w-[94%] bg-[#0c0f18]/95 border border-[#232c40] rounded-2xl shadow-[0_24px_70px_rgba(0,0,0,0.85)] backdrop-blur-2xl overflow-hidden text-[#e2e8f0] flex flex-col"
      >
        <div className="flex items-center px-4 border-b border-[#181d2a] bg-[#090b10]">
          <Search size={15} className="text-sky-400 mr-2.5 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              activeModal === 'quick-open' ? 'Dosya adı ara...' : 'Komut veya dosya adı yaz...'
            }
            className="flex-1 bg-transparent py-3.5 text-[13.5px] text-[#f1f5f9] placeholder-[#5a6578] focus:outline-none"
          />
          <button
            onClick={() => setActiveModal(null)}
            className="p-1 text-[#7e8b9f] hover:text-white rounded-lg hover:bg-[#141926] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="max-h-[340px] overflow-y-auto p-1.5 space-y-0.5">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-[#64748b] text-[12px]">
              Eşleşen komut veya dosya bulunamadı.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.action();
                    setActiveModal(null);
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[12.5px] cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#141a29] text-white border border-sky-500/30 shadow-sm'
                      : 'text-[#8b95a5] hover:text-[#f1f5f9] hover:bg-[#0e121c] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon size={14} className={isSelected ? 'text-sky-400' : 'text-[#64748b]'} />
                    <span className="truncate">{item.title}</span>
                  </div>
                  {item.shortcut && (
                    <span className="text-[10.5px] text-[#64748b] font-mono ml-4 flex-shrink-0 px-1.5 py-0.5 rounded bg-[#101420] border border-[#1b2234]">
                      {item.shortcut}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
