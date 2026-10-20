import React from 'react';
import {
  Sparkles,
  Files,
  Search,
  GitBranch,
  Zap,
  Sliders,
  History,
  Settings,
} from 'lucide-react';
import { ElythraLogo } from './icons/ElythraLogo';
import { useElythraStore } from '../store/useElythraStore';

export const ActivityBar: React.FC = () => {
  const {
    sidebarTab,
    setSidebarTab,
    isSidebarOpen,
    toggleSidebar,
    setActiveModal,
    gitStatus,
    activeView,
    setActiveView,
  } = useElythraStore();

  const handleTabClick = (tabId: any) => {
    if (tabId === 'chat') {
      setActiveView('studio');
      setSidebarTab('chat');
      if (!isSidebarOpen) toggleSidebar();
      return;
    }

    if (sidebarTab === tabId && isSidebarOpen) {
      toggleSidebar();
    } else {
      setSidebarTab(tabId);
      if (!isSidebarOpen) toggleSidebar();
    }
  };

  const topItems = [
    { id: 'chat', label: 'AI Studio & Chat', icon: Sparkles },
    { id: 'explorer', label: 'Explorer', icon: Files },
    { id: 'search', label: 'Search in Files', icon: Search },
    {
      id: 'git',
      label: 'Source Control',
      icon: GitBranch,
      badge:
        gitStatus && !gitStatus.clean
          ? (gitStatus.modified.length + gitStatus.staged.length + gitStatus.untracked.length)
          : null,
    },
    { id: 'automations', label: 'Automations', icon: Zap },
    { id: 'customizations', label: 'Customizations & Rules', icon: Sliders },
  ];

  return (
    <div className="w-12 h-full bg-[#0a0a0a] border-r border-[#1a1a1a] flex flex-col justify-between items-center py-2 select-none z-30 flex-shrink-0">
      {/* Top Group */}
      <div className="w-full flex flex-col items-center gap-1.5">
        {/* Antigravity Logo mark */}
        <button
          onClick={() => {
            setActiveView('studio');
            setSidebarTab('chat');
          }}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[#181818] text-white transition-all mb-2"
          title="Elythra Studio Home"
        >
          <ElythraLogo size={20} />
        </button>

        {topItems.map((item) => {
          const isActive = sidebarTab === item.id && isSidebarOpen;
          const Icon = item.icon;

          return (
            <div key={item.id} className="relative w-full flex items-center justify-center group">
              {/* Left active indicator pill */}
              {isActive && (
                <div className="absolute left-0 top-1 bottom-1 w-[2.5px] bg-sky-400 rounded-r" />
              )}

              <button
                onClick={() => handleTabClick(item.id)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all relative ${
                  isActive
                    ? 'text-white bg-[#1a1a1a]'
                    : 'text-[#888888] hover:text-[#e5e5e5] hover:bg-[#161616]'
                }`}
                title={item.label}
              >
                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />

                {/* Git modified badge */}
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 px-1 min-w-[15px] h-[15px] bg-sky-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </button>

              {/* Tooltip on hover */}
              <div className="absolute left-12 px-2 py-1 bg-[#1a1a1a] border border-[#2a2a2a] text-[11px] text-[#e5e5e5] rounded shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Group: History and Settings */}
      <div className="w-full flex flex-col items-center gap-1.5">
        <div className="relative w-full flex items-center justify-center group">
          {sidebarTab === 'history' && isSidebarOpen && (
            <div className="absolute left-0 top-1 bottom-1 w-[2.5px] bg-sky-400 rounded-r" />
          )}
          <button
            onClick={() => handleTabClick('history')}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              sidebarTab === 'history' && isSidebarOpen
                ? 'text-white bg-[#1a1a1a]'
                : 'text-[#888888] hover:text-[#e5e5e5] hover:bg-[#161616]'
            }`}
            title="Conversation Archive"
          >
            <History size={18} />
          </button>
          <div className="absolute left-12 px-2 py-1 bg-[#1a1a1a] border border-[#2a2a2a] text-[11px] text-[#e5e5e5] rounded shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            History
          </div>
        </div>

        <div className="relative w-full flex items-center justify-center group">
          <button
            onClick={() => setActiveModal('settings')}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#888888] hover:text-[#e5e5e5] hover:bg-[#161616] transition-all"
            title="Settings (BYOK, Models & Editor)"
          >
            <Settings size={18} />
          </button>
          <div className="absolute left-12 px-2 py-1 bg-[#1a1a1a] border border-[#2a2a2a] text-[11px] text-[#e5e5e5] rounded shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            Settings
          </div>
        </div>
      </div>
    </div>
  );
};
