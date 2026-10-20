import React, { useEffect } from 'react';
import { TitleBar } from './components/TitleBar';
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
    sidebarTab,
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
    if (sidebarTab === 'history') {
      return <HistoryView />;
    }

    // Default: If project is open, show full IDE workspace; otherwise show Home Screen
    return activeProject ? <IdeWorkspace /> : <HomeScreen />;
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#111111] overflow-hidden select-none">
      {/* 1. Üst Menü Çubuğu (44px) */}
      <TitleBar />

      {/* 2. Ana Çalışma Alanı (Sol Panel + İçerik) */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        {renderMainContent()}
      </div>

      {/* 3. Modallar ve Açılır Pencereler */}
      {activeModal === 'settings' && <SettingsModal />}
      {(activeModal === 'command-palette' || activeModal === 'quick-open') && <CommandPalette />}
    </div>
  );
};
