import React, { useState, useRef, useEffect } from 'react';
import { Minus, Square, X, ChevronDown, Sparkles, GitBranch, Folder } from 'lucide-react';
import { ElythraLogo } from './icons/ElythraLogo';
import { useElythraStore } from '../store/useElythraStore';

export const TitleBar: React.FC = () => {
  const {
    openProject,
    saveActiveTab,
    saveAllTabs,
    closeFileTab,
    activeTabPath,
    openTabs,
    activeProject,
    toggleSidebar,
    toggleTerminal,
    toggleAIPanel,
    setActiveModal,
    activeView,
    setActiveView,
    selectedModel,
    gitStatus,
  } = useElythraStore();

  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMinimize = () => window.elythraAPI?.windowMinimize();
  const handleMaximize = () => window.elythraAPI?.windowMaximize();
  const handleClose = () => window.elythraAPI?.windowClose();

  const handleOpenFolder = async () => {
    setActiveMenu(null);
    if (!window.elythraAPI) return;
    const folder = await window.elythraAPI.openDirectoryDialog();
    if (folder) {
      await openProject(folder);
    }
  };

  const handleOpenFile = async () => {
    setActiveMenu(null);
    if (!window.elythraAPI) return;
    const file = await window.elythraAPI.openFileDialog();
    if (file) {
      useElythraStore.getState().openFileTab(file);
    }
  };

  const menus = [
    {
      id: 'file',
      label: 'File',
      items: [
        { label: 'New File', shortcut: 'Ctrl+N', action: handleOpenFile },
        { label: 'Open Folder...', shortcut: 'Ctrl+O', action: handleOpenFolder },
        { type: 'divider' },
        { label: 'Save', shortcut: 'Ctrl+S', action: () => saveActiveTab() },
        { label: 'Save All', shortcut: 'Ctrl+K S', action: () => saveAllTabs() },
        { type: 'divider' },
        {
          label: 'Close Tab',
          shortcut: 'Ctrl+W',
          action: () => activeTabPath && closeFileTab(activeTabPath),
        },
        { label: 'Exit', action: handleClose },
      ],
    },
    {
      id: 'edit',
      label: 'Edit',
      items: [
        { label: 'Undo', shortcut: 'Ctrl+Z' },
        { label: 'Redo', shortcut: 'Ctrl+Y' },
        { type: 'divider' },
        { label: 'Cut', shortcut: 'Ctrl+X' },
        { label: 'Copy', shortcut: 'Ctrl+C' },
        { label: 'Paste', shortcut: 'Ctrl+V' },
        { type: 'divider' },
        { label: 'Find in Files', shortcut: 'Ctrl+Shift+F', action: () => setActiveModal('command-palette') },
      ],
    },
    {
      id: 'view',
      label: 'View',
      items: [
        { label: 'Switch to AI Studio', action: () => setActiveView('studio') },
        { label: 'Switch to Code Editor', action: () => setActiveView('editor') },
        { type: 'divider' },
        { label: 'Toggle Activity & Sidebar', shortcut: 'Ctrl+B', action: toggleSidebar },
        { label: 'Toggle Terminal', shortcut: 'Ctrl+`', action: toggleTerminal },
        { label: 'Toggle AI Panel', shortcut: 'Ctrl+L', action: toggleAIPanel },
        { type: 'divider' },
        { label: 'Command Palette...', shortcut: 'Ctrl+Shift+P', action: () => setActiveModal('command-palette') },
      ],
    },
    {
      id: 'window',
      label: 'Window',
      items: [
        { label: 'Minimize', action: handleMinimize },
        { label: 'Maximize', action: handleMaximize },
        { label: 'Close', action: handleClose },
      ],
    },
  ];

  const activeTab = openTabs.find((t) => t.path === activeTabPath);

  return (
    <header className="h-[40px] bg-[#0a0a0a] border-b border-[#1a1a1a] flex items-center justify-between px-3 select-none window-drag-region z-50">
      {/* Left: Elythra Logo, Menus */}
      <div className="flex items-center gap-2.5 window-no-drag">
        <div className="flex items-center gap-2 pr-1">
          <ElythraLogo size={17} className="text-white" />
          <span className="font-semibold text-[12.5px] tracking-wide text-[#f0f0f0]">
            Elythra
          </span>
        </div>

        {/* Menu Bar */}
        <nav ref={menuRef} className="flex items-center gap-0.5">
          {menus.map((m) => (
            <div key={m.id} className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === m.id ? null : m.id)}
                onMouseEnter={() => activeMenu && setActiveMenu(m.id)}
                className={`px-2 py-0.8 text-[12px] rounded-md transition-colors ${
                  activeMenu === m.id
                    ? 'bg-[#222222] text-[#f0f0f0]'
                    : 'text-[#888888] hover:text-[#e5e5e5] hover:bg-[#161616]'
                }`}
              >
                {m.label}
              </button>

              {activeMenu === m.id && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-[#161616] border border-[#2a2a2a] rounded-xl py-1 shadow-2xl z-50 animate-fadeIn">
                  {m.items.map((item, idx) => {
                    if (item.type === 'divider') {
                      return <div key={idx} className="my-1 border-t border-[#222222]" />;
                    }
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setActiveMenu(null);
                          item.action?.();
                        }}
                        className="w-full text-left px-3 py-1.5 text-[12px] text-[#cccccc] hover:text-white hover:bg-[#222222] flex items-center justify-between transition-colors"
                      >
                        <span>{item.label}</span>
                        {item.shortcut && (
                          <span className="text-[10px] text-[#777777] font-mono">
                            {item.shortcut}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Center: Antigravity View Pill & Breadcrumbs */}
      <div className="flex items-center gap-3 window-no-drag">
        {/* Antigravity Dual-Surface Switcher */}
        <div className="flex items-center gap-0.5 bg-[#141414] border border-[#222222] rounded-full p-0.5 shadow-inner">
          <button
            onClick={() => setActiveView('studio')}
            className={`px-3 py-0.5 rounded-full text-[11px] font-medium transition-all ${
              activeView === 'studio'
                ? 'bg-[#262626] text-white shadow-sm'
                : 'text-[#888888] hover:text-[#e5e5e5]'
            }`}
          >
            💬 Studio
          </button>
          <button
            onClick={() => setActiveView('editor')}
            className={`px-3 py-0.5 rounded-full text-[11px] font-medium transition-all ${
              activeView === 'editor'
                ? 'bg-[#262626] text-white shadow-sm'
                : 'text-[#888888] hover:text-[#e5e5e5]'
            }`}
          >
            💻 Editor
          </button>
        </div>

        {/* Breadcrumb title */}
        <div className="hidden md:flex items-center gap-1.5 text-[11px] text-[#666666] font-mono">
          {activeProject ? (
            <>
              <span className="text-[#888888]">{activeProject.name}</span>
              {activeTab && (
                <>
                  <span>›</span>
                  <span className="text-[#cccccc]">{activeTab.name}</span>
                </>
              )}
            </>
          ) : (
            <span className="text-[#777777]">Standalone Studio</span>
          )}
        </div>
      </div>

      {/* Right: Model badge, Git branch, Window Controls */}
      <div className="flex items-center gap-2">
        <div className="hidden lg:flex items-center gap-1.5 window-no-drag">
          {gitStatus?.branch && (
            <span className="flex items-center gap-1 text-[11px] text-[#888888] px-2 py-0.5 bg-[#141414] border border-[#222222] rounded-full font-mono">
              <GitBranch size={11} className="text-sky-400" />
              <span>{gitStatus.branch}</span>
            </span>
          )}

          <button
            onClick={() => setActiveModal('settings')}
            className="flex items-center gap-1 text-[11px] text-[#aaaaaa] hover:text-white px-2 py-0.5 bg-[#141414] hover:bg-[#1e1e1e] border border-[#222222] rounded-full transition-colors"
            title="Configure Models & Keys"
          >
            <Sparkles size={11} className="text-sky-400" />
            <span className="truncate max-w-[120px]">{selectedModel}</span>
          </button>
        </div>

        {/* Window Controls */}
        <div className="flex items-center window-no-drag ml-1">
          <button
            onClick={handleMinimize}
            className="w-8 h-7 flex items-center justify-center text-[#888888] hover:text-white hover:bg-[#1a1a1a] rounded transition-colors"
            title="Minimize"
          >
            <Minus size={13} />
          </button>
          <button
            onClick={handleMaximize}
            className="w-8 h-7 flex items-center justify-center text-[#888888] hover:text-white hover:bg-[#1a1a1a] rounded transition-colors"
            title="Maximize"
          >
            <Square size={12} />
          </button>
          <button
            onClick={handleClose}
            className="w-8 h-7 flex items-center justify-center text-[#888888] hover:text-white hover:bg-red-950/80 rounded transition-colors"
            title="Close"
          >
            <X size={13} />
          </button>
        </div>
      </div>
    </header>
  );
};
