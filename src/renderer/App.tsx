import React, { useEffect } from 'react';
import { TitleBar } from './components/TitleBar';
import { ActivityBar } from './components/ActivityBar';
import { Sidebar } from './components/Sidebar';
import { HomeScreen } from './components/HomeScreen';
import { IdeWorkspace } from './components/IdeWorkspace';
import { AutomationsView } from './components/AutomationsView';
import { CustomizationsView } from './components/CustomizationsView';
import { HistoryView } from './components/HistoryView';
import { SettingsModal } from './components/SettingsModal';
import { CommandPalette } from './components/CommandPalette';
import { useElythraStore } from './store/useElythraStore';

export const App: React.FC = () => {
  const {
    init,
    activeProject,
    openTabs,
    sidebarTab,
    activeView,
    isSidebarOpen,
    activeModal,
    setActiveModal,
    toggleSidebar,
    toggleTerminal,
    toggleAIPanel,
    saveActiveTab,
  } = useElythraStore();

  useEffect(() => {
    init();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+B: Toggle Sidebar
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
      // Ctrl+`: Toggle Terminal
      else if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        toggleTerminal();
      }
      // Ctrl+L: Toggle AI Panel
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        toggleAIPanel();
      }
      // Ctrl+S: Save File
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveActiveTab();
      }
      // Ctrl+Shift+P: Command Palette
      else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setActiveModal('command-palette');
      }
      // Ctrl+P: Quick Open
      else if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setActiveModal('quick-open');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderMainContent = () => {
    if (sidebarTab === 'automations') {
      return <AutomationsView />;
    }
    if (sidebarTab === 'customizations') {
      return <CustomizationsView />;
    }

    if (activeView === 'editor') {
      return <IdeWorkspace />;
    }

    if (activeView === 'studio') {
      return <HomeScreen />;
    }

    // Default fallback: if files are open, show editor; else show studio
    return openTabs.length > 0 || activeProject ? <IdeWorkspace /> : <HomeScreen />;
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0a0a] overflow-hidden select-none">
      {/* 1. Antigravity Top Title Bar (40px) */}
      <TitleBar />

      {/* 2. Main Workbench Surface */}
      <div className="flex-1 flex overflow-hidden">
        {/* Antigravity Left Activity Bar (48px) */}
        <ActivityBar />

        {/* Primary Collapsible Sidebar (280px) */}
        {isSidebarOpen && <Sidebar />}

        {/* Central Stage: Antigravity Studio OR Monaco IDE Workspace */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0e0e0e]">
          {renderMainContent()}
        </div>
      </div>

      {/* 3. Global Modals */}
      {activeModal === 'settings' && <SettingsModal />}
      {(activeModal === 'command-palette' || activeModal === 'quick-open') && <CommandPalette />}
    </div>
  );
};
