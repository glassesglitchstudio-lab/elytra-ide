import React from 'react';
import { GitBranch, AlertCircle, CheckCircle2, Bot } from 'lucide-react';
import { useElythraStore } from '../store/useElythraStore';

export const StatusBar: React.FC = () => {
  const { gitStatus, activeTabPath, openTabs, selectedModel, toggleTerminal } = useElythraStore();

  const activeTab = openTabs.find((t) => t.path === activeTabPath);

  return (
    <footer className="h-6 bg-[#0f0f0f] border-t border-[#1f1f1f] flex items-center justify-between px-3 text-[11px] text-[#8a8a8a] select-none z-30">
      {/* Sol Taraf: Git Branch ve Tanılama */}
      <div className="flex items-center gap-3">
        {gitStatus?.isRepo && (
          <button
            onClick={toggleTerminal}
            className="flex items-center gap-1.5 hover:text-[#e5e5e5] transition-colors"
          >
            <GitBranch size={12} />
            <span>{gitStatus.branch}</span>
            {gitStatus.modified.length > 0 && (
              <span className="text-[#e5c07b]">*{gitStatus.modified.length}</span>
            )}
          </button>
        )}

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[#98c379]">
            <CheckCircle2 size={11} />
            <span>0</span>
          </div>
          <div className="flex items-center gap-1 text-[#e5c07b]">
            <AlertCircle size={11} />
            <span>0</span>
          </div>
        </div>
      </div>

      {/* Sağ Taraf: Satır/Sütun, Dil, Kodlama ve Model */}
      <div className="flex items-center gap-3">
        {activeTab && (
          <>
            <span>Ln 1, Col 1</span>
            <span>Spaces: 2</span>
            <span>UTF-8</span>
            <span className="capitalize">{activeTab.language}</span>
          </>
        )}

        <div className="flex items-center gap-1 text-[#e5e5e5]">
          <Bot size={11} className="text-[#8a8a8a]" />
          <span>{selectedModel}</span>
        </div>
      </div>
    </footer>
  );
};
