import React, { useState, useEffect, useRef } from 'react';
import { Search, Terminal, Sliders, FolderOpen, Save, FileCode, Bot, X } from 'lucide-react';
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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24 z-50 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[600px] bg-[#161616] border border-[#262626] rounded-btn shadow-2xl overflow-hidden text-[#e5e5e5] flex flex-col"
      >
        <div className="flex items-center px-3 border-b border-[#1f1f1f]">
          <Search size={15} className="text-[#8a8a8a] mr-2" />
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
              activeModal === 'quick-open' ? 'Search files by name...' : 'Type a command or file name...'
            }
            className="flex-1 bg-transparent py-3 text-[13px] text-[#e5e5e5] placeholder-[#8a8a8a] focus:outline-none"
          />
          <button
            onClick={() => setActiveModal(null)}
            className="p-1 text-[#8a8a8a] hover:text-[#e5e5e5]"
          >
            <X size={15} />
          </button>
        </div>

        <div className="max-h-[320px] overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-[#8a8a8a] text-[12px]">
              No matching items found.
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
                  className={`flex items-center justify-between px-3.5 py-2 text-[12px] cursor-pointer transition-colors ${
                    isSelected ? 'bg-[#2a2a2a] text-white' : 'text-[#8a8a8a] hover:text-[#e5e5e5]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon size={14} className={isSelected ? 'text-white' : 'text-[#8a8a8a]'} />
                    <span className="truncate">{item.title}</span>
                  </div>
                  {item.shortcut && (
                    <span className="text-[10px] text-[#666666] font-mono ml-4 flex-shrink-0">
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
