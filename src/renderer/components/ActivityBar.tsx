import React from 'react';
import {
  Sparkles,
  Files,
  Search,
  GitBranch,
  Zap,
  Sliders,
  Blocks,
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
    { id: 'plugins', label: 'Plugins & Marketplace', icon: Blocks },
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
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[#181d28] text-white transition-all mb-2 hover:shadow-[0_0_12px_rgba(56,189,248,0.2)]"
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
                <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-gradient-to-b from-sky-400 to-blue-500 rounded-r shadow-[0_0_8px_rgba(56,189,248,0.7)]" />
              )}

              <button
                onClick={() => handleTabClick(item.id)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all relative ${
                  isActive
                    ? 'text-white bg-[#191d28] border border-sky-500/25 shadow-md shadow-sky-950/20'
                    : 'text-[#888888] hover:text-[#f0f2f5] hover:bg-[#151822]'
                }`}
                title={item.label}
              >
                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} className={isActive ? 'text-sky-300' : ''} />

                {/* Git modified badge */}
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 px-1 min-w-[15px] h-[15px] bg-gradient-to-r from-sky-500 to-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </button>

              {/* Tooltip on hover */}
              <div className="absolute left-12 px-2.5 py-1 bg-[#12151d] border border-[#262c3e] text-[11px] text-[#e2e8f0] rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
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
            <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-gradient-to-b from-sky-400 to-blue-500 rounded-r shadow-[0_0_8px_rgba(56,189,248,0.7)]" />
          )}
          <button
            onClick={() => handleTabClick('history')}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              sidebarTab === 'history' && isSidebarOpen
                ? 'text-white bg-[#191d28] border border-sky-500/25 shadow-md shadow-sky-950/20'
                : 'text-[#888888] hover:text-[#f0f2f5] hover:bg-[#151822]'
            }`}
            title="Conversation Archive"
          >
            <History size={18} className={sidebarTab === 'history' && isSidebarOpen ? 'text-sky-300' : ''} />
          </button>
          <div className="absolute left-12 px-2.5 py-1 bg-[#12151d] border border-[#262c3e] text-[11px] text-[#e2e8f0] rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            History
          </div>
        </div>

        <div className="relative w-full flex items-center justify-center group">
          <button
            onClick={() => setActiveModal('settings')}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#888888] hover:text-[#f0f2f5] hover:bg-[#151822] transition-all"
            title="Settings (BYOK, Models & Editor)"
          >
            <Settings size={18} />
          </button>
          <div className="absolute left-12 px-2.5 py-1 bg-[#12151d] border border-[#262c3e] text-[11px] text-[#e2e8f0] rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            Settings
          </div>
        </div>
      </div>
    </div>
  );
};
