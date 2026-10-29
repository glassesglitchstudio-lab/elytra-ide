import React, { useState, useRef, useEffect } from 'react';
import { Minus, Square, X, ChevronDown, Sparkles, GitBranch, Folder, Code2, Cpu } from 'lucide-react';
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
        { label: 'Toggle Sidebar', shortcut: 'Ctrl+B', action: toggleSidebar },
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
    <header className="h-[40px] bg-[#07080c] border-b border-[#181d2a] flex items-center justify-between px-3.5 select-none window-drag-region z-50">
      {/* Left: Elytra Logo, Menus */}
      <div className="flex items-center gap-3 window-no-drag">
        <div className="flex items-center gap-2 pr-1.5 cursor-pointer" onClick={() => setActiveView('studio')}>
          <div className="w-5 h-5 rounded-md flex items-center justify-center text-sky-400">
            <ElythraLogo size={17} />
          </div>
          <span className="font-semibold text-[13px] tracking-tight bg-gradient-to-r from-white via-[#e2e8f0] to-[#94a3b8] bg-clip-text text-transparent">
            Elytra Code
          </span>
        </div>

        {/* Menu Bar */}
        <nav ref={menuRef} className="flex items-center gap-0.5">
          {menus.map((m) => (
            <div key={m.id} className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === m.id ? null : m.id)}
                onMouseEnter={() => activeMenu && setActiveMenu(m.id)}
                className={`px-2 py-1 text-[12px] font-medium rounded-md transition-colors ${
                  activeMenu === m.id
                    ? 'bg-[#182032] text-white shadow-sm'
                    : 'text-[#8b95a5] hover:text-[#f1f5f9] hover:bg-[#121622]'
                }`}
              >
                {m.label}
              </button>

              {activeMenu === m.id && (
                <div className="absolute top-full left-0 mt-1 w-56 glass-dropdown rounded-xl py-1 z-50 animate-fadeIn">
                  {m.items.map((item, idx) => {
                    if (item.type === 'divider') {
                      return <div key={idx} className="my-1 border-t border-[#1f2638]" />;
                    }
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setActiveMenu(null);
                          item.action?.();
                        }}
                        className="w-full text-left px-3 py-1.5 text-[12px] text-[#cbd5e1] hover:text-white hover:bg-[#182032] flex items-center justify-between transition-colors"
                      >
                        <span>{item.label}</span>
                        {item.shortcut && (
                          <span className="text-[10px] text-[#64748b] font-mono">
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

      {/* Center: Dual-Surface Switcher & Breadcrumbs */}
      <div className="flex items-center gap-3 window-no-drag">
        {/* Dual-Surface Switcher Capsule */}
        <div className="flex items-center gap-0.5 bg-[#0e121c] border border-[#222a3d] rounded-full p-0.5 shadow-inner">
          <button
            onClick={() => setActiveView('studio')}
            className={`flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-medium transition-all ${
              activeView === 'studio'
                ? 'bg-gradient-to-r from-[#1e263d] to-[#161c2e] text-white shadow-md border border-sky-500/40'
                : 'text-[#8b95a5] hover:text-[#e2e8f0]'
            }`}
          >
            <Sparkles size={11} className={activeView === 'studio' ? 'text-sky-400' : 'text-[#64748b]'} />
            <span>Studio</span>
          </button>
          <button
            onClick={() => setActiveView('editor')}
            className={`flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-medium transition-all ${
              activeView === 'editor'
                ? 'bg-gradient-to-r from-[#152a22] to-[#101f19] text-white shadow-md border border-emerald-500/40'
                : 'text-[#8b95a5] hover:text-[#e2e8f0]'
            }`}
          >
            <Code2 size={11} className={activeView === 'editor' ? 'text-emerald-400' : 'text-[#64748b]'} />
            <span>Editor</span>
          </button>
        </div>

        {/* Breadcrumb title */}
        <div className="hidden md:flex items-center gap-1.5 text-[11px] text-[#64748b] font-mono">
          {activeProject ? (
            <>
              <span className="text-[#94a3b8]">{activeProject.name}</span>
              {activeTab && (
                <>
                  <span className="text-[#475569]">›</span>
                  <span className="text-[#e2e8f0] font-medium">{activeTab.name}</span>
                </>
              )}
            </>
          ) : (
            <span className="text-[#64748b]">Elytra Studio</span>
          )}
        </div>
      </div>

      {/* Right: Model badge, Git branch, Window Controls */}
      <div className="flex items-center gap-2">
        <div className="hidden lg:flex items-center gap-1.5 window-no-drag">
          {gitStatus?.branch && (
            <span className="flex items-center gap-1 text-[11px] text-[#94a3b8] px-2 py-0.5 bg-[#0e121c] border border-[#202738] rounded-full font-mono">
              <GitBranch size={11} className="text-sky-400" />
              <span>{gitStatus.branch}</span>
            </span>
          )}

          <button
            onClick={() => setActiveModal('settings')}
            className="flex items-center gap-1.5 text-[11px] text-[#cbd5e1] hover:text-white px-2.5 py-0.5 bg-[#121624] hover:bg-[#1a2134] border border-[#252f46] hover:border-sky-500/50 rounded-full transition-all shadow-sm"
            title="Configure Models & Keys"
          >
            <Cpu size={11} className="text-sky-400" />
            <span className="truncate max-w-[140px] font-medium">{selectedModel}</span>
          </button>
        </div>

        {/* Window Controls */}
        <div className="flex items-center window-no-drag ml-1 gap-0.5">
          <button
            onClick={handleMinimize}
            className="w-8 h-7 flex items-center justify-center text-[#8b95a5] hover:text-white hover:bg-[#151a26] rounded transition-colors"
            title="Minimize"
          >
            <Minus size={13} />
          </button>
          <button
            onClick={handleMaximize}
            className="w-8 h-7 flex items-center justify-center text-[#8b95a5] hover:text-white hover:bg-[#151a26] rounded transition-colors"
            title="Maximize"
          >
            <Square size={12} />
          </button>
          <button
            onClick={handleClose}
            className="w-8 h-7 flex items-center justify-center text-[#8b95a5] hover:text-white hover:bg-rose-950/80 rounded transition-colors"
            title="Close"
          >
            <X size={13} />
          </button>
        </div>
      </div>
    </header>
  );
};
