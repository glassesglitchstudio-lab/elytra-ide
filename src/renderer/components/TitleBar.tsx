import React, { useState, useRef, useEffect } from 'react';
import { Minus, Square, X, ChevronDown } from 'lucide-react';
import { ElythraLogo } from './icons/ElythraLogo';
import { useElythraStore } from '../store/useElythraStore';

export const TitleBar: React.FC = () => {
  const {
    openProject,
    saveActiveTab,
    saveAllTabs,
    closeFileTab,
    activeTabPath,
    toggleSidebar,
    toggleTerminal,
    toggleAIPanel,
    setActiveModal,
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

  return (
    <header className="h-[44px] bg-[#0f0f0f] border-b border-[#1f1f1f] flex items-center justify-between px-3 select-none window-drag-region z-50">
      {/* Sol Alan: Elythra Logo, İsim ve Menüler */}
      <div className="flex items-center gap-3 window-no-drag">
        <div className="flex items-center gap-2">
          <ElythraLogo size={18} className="text-white" />
          <span className="font-semibold text-[13px] tracking-wide text-[#e5e5e5]">
            Elythra
          </span>
        </div>

        {/* Menü Öğeleri */}
        <nav ref={menuRef} className="flex items-center gap-0.5 ml-2">
          {menus.map((m) => (
            <div key={m.id} className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === m.id ? null : m.id)}
                onMouseEnter={() => activeMenu && setActiveMenu(m.id)}
                className={`px-2.5 py-1 text-[12px] rounded-btn transition-colors ${
                  activeMenu === m.id
                    ? 'bg-[#2a2a2a] text-[#e5e5e5]'
                    : 'text-[#8a8a8a] hover:text-[#e5e5e5] hover:bg-[#1f1f1f]'
                }`}
              >
                {m.label}
              </button>

              {activeMenu === m.id && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-[#161616] border border-[#262626] rounded-btn py-1 shadow-2xl z-50">
                  {m.items.map((item, idx) =>
                    item.type === 'divider' ? (
                      <div key={idx} className="my-1 border-t border-[#1f1f1f]" />
                    ) : (
                      <button
                        key={idx}
                        onClick={() => {
                          item.action?.();
                          setActiveMenu(null);
                        }}
                        className="w-full flex items-center justify-between px-3 py-1.5 text-[12px] text-[#e5e5e5] hover:bg-[#2a2a2a] transition-colors"
                      >
                        <span>{item.label}</span>
                        {item.shortcut && (
                          <span className="text-[10px] text-[#8a8a8a]">
                            {item.shortcut}
                          </span>
                        )}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Sağ Üst Köşe: Sadece Küçült, Büyüt, Kapat Butonları */}
      <div className="flex items-center gap-0.5 window-no-drag">
        <button
          onClick={handleMinimize}
          className="w-9 h-7 flex items-center justify-center text-[#8a8a8a] hover:text-[#e5e5e5] hover:bg-[#2a2a2a] rounded-btn transition-colors"
          title="Minimize"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={handleMaximize}
          className="w-9 h-7 flex items-center justify-center text-[#8a8a8a] hover:text-[#e5e5e5] hover:bg-[#2a2a2a] rounded-btn transition-colors"
          title="Maximize"
        >
          <Square size={12} />
        </button>
        <button
          onClick={handleClose}
          className="w-9 h-7 flex items-center justify-center text-[#8a8a8a] hover:text-white hover:bg-[#e81123] rounded-btn transition-colors"
          title="Close"
        >
          <X size={14} />
        </button>
      </div>
    </header>
  );
};
