import React from 'react';
import { useElythraStore } from '../store/useElythraStore';
import { FileTree } from './FileTree';
import { EditorArea } from './EditorArea';
import { TerminalPanel } from './TerminalPanel';
import { AIAssistantPanel } from './AIAssistantPanel';
import { StatusBar } from './StatusBar';

export const IdeWorkspace: React.FC = () => {
  const { fileTree } = useElythraStore();

  return (
    <div className="flex-1 h-[calc(100vh-44px)] flex flex-col bg-[#111111] overflow-hidden">
      {/* Ana Çalışma Alanı (FileTree + Editör/Terminal + AI Panel) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Dosya Ağacı */}
        <FileTree items={fileTree} />

        {/* Editör ve Terminal */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <EditorArea />
          <TerminalPanel />
        </div>

        {/* Sağ Yapay Zeka Paneli */}
        <AIAssistantPanel />
      </div>

      {/* Alt Durum Çubuğu */}
      <StatusBar />
    </div>
  );
};
