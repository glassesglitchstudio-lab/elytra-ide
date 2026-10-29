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
    <div className="w-12 h-full bg-[#07080c] border-r border-[#161a26] flex flex-col justify-between items-center py-2.5 select-none z-30 flex-shrink-0">
      {/* Top Group */}
      <div className="w-full flex flex-col items-center gap-1">
        {/* Elytra Logo Button */}
        <button
          onClick={() => {
            setActiveView('studio');
            setSidebarTab('chat');
          }}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[#141926] text-white transition-all mb-2.5 hover:shadow-[0_0_16px_rgba(56,189,248,0.25)] group"
          title="Elytra Studio"
        >
          <ElythraLogo size={20} className="group-hover:scale-105 transition-transform" />
        </button>

        {topItems.map((item) => {
          const isActive = sidebarTab === item.id && isSidebarOpen;
          const Icon = item.icon;

          return (
            <div key={item.id} className="relative w-full flex items-center justify-center group">
              {/* Left active neon indicator */}
              {isActive && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-gradient-to-b from-sky-400 via-sky-500 to-blue-600 rounded-r shadow-[0_0_10px_rgba(56,189,248,0.8)]" />
              )}

              <button
                onClick={() => handleTabClick(item.id)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all relative ${
                  isActive
                    ? 'text-white bg-[#141928] border border-sky-500/30 shadow-md shadow-sky-950/30'
                    : 'text-[#7e8b9f] hover:text-[#f1f5f9] hover:bg-[#101420]'
                }`}
                title={item.label}
              >
                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} className={isActive ? 'text-sky-300' : ''} />

                {/* Git modified badge */}
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 px-1 min-w-[16px] h-[16px] bg-gradient-to-r from-sky-500 to-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </button>

              {/* Tooltip on hover */}
              <div className="absolute left-12 px-2.5 py-1 glass-dropdown text-[11px] font-medium text-[#e2e8f0] rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Group: History and Settings */}
      <div className="w-full flex flex-col items-center gap-1">
        <div className="relative w-full flex items-center justify-center group">
          {sidebarTab === 'history' && isSidebarOpen && (
            <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-gradient-to-b from-sky-400 via-sky-500 to-blue-600 rounded-r shadow-[0_0_10px_rgba(56,189,248,0.8)]" />
          )}
          <button
            onClick={() => handleTabClick('history')}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              sidebarTab === 'history' && isSidebarOpen
                ? 'text-white bg-[#141928] border border-sky-500/30 shadow-md shadow-sky-950/30'
                : 'text-[#7e8b9f] hover:text-[#f1f5f9] hover:bg-[#101420]'
            }`}
            title="Conversation Archive"
          >
            <History size={18} className={sidebarTab === 'history' && isSidebarOpen ? 'text-sky-300' : ''} />
          </button>
          <div className="absolute left-12 px-2.5 py-1 glass-dropdown text-[11px] font-medium text-[#e2e8f0] rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            History
          </div>
        </div>

        <div className="relative w-full flex items-center justify-center group">
          <button
            onClick={() => setActiveModal('settings')}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#7e8b9f] hover:text-[#f1f5f9] hover:bg-[#101420] transition-all"
            title="Settings (BYOK, Models & Editor)"
          >
            <Settings size={18} />
          </button>
          <div className="absolute left-12 px-2.5 py-1 glass-dropdown text-[11px] font-medium text-[#e2e8f0] rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            Settings
          </div>
        </div>
      </div>
    </div>
  );
};
