import React from 'react';
import { GitBranch, AlertCircle, CheckCircle2, Bot } from 'lucide-react';
import { useElythraStore } from '../store/useElythraStore';

export const StatusBar: React.FC = () => {
  const { gitStatus, activeTabPath, openTabs, selectedModel, toggleTerminal } = useElythraStore();

  const activeTab = openTabs.find((t) => t.path === activeTabPath);

  return (
    <footer className="h-6 bg-[#0a0c10] border-t border-[#1a1f2c] flex items-center justify-between px-3 text-[11px] text-[#788296] select-none z-30">
      {/* Sol Taraf: Git Branch ve Tanılama */}
      <div className="flex items-center gap-3">
        {gitStatus?.isRepo && (
          <button
            onClick={toggleTerminal}
            className="flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <GitBranch size={12} className="text-sky-400" />
            <span className="font-mono text-[#a3adc2]">{gitStatus.branch}</span>
            {gitStatus.modified.length > 0 && (
              <span className="text-amber-400 font-mono">*{gitStatus.modified.length}</span>
            )}
          </button>
        )}

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 size={11} />
            <span className="font-mono">0</span>
          </div>
          <div className="flex items-center gap-1 text-amber-400">
            <AlertCircle size={11} />
            <span className="font-mono">0</span>
          </div>
        </div>
      </div>

      {/* Sağ Taraf: Satır/Sütun, Dil, Kodlama ve Model */}
      <div className="flex items-center gap-3">
        {activeTab && (
          <>
            <span className="font-mono text-[#8a94a8]">Ln 1, Col 1</span>
            <span className="font-mono text-[#8a94a8]">Spaces: 2</span>
            <span className="font-mono text-[#8a94a8]">UTF-8</span>
            <span className="capitalize text-[#8a94a8]">{activeTab.language}</span>
          </>
        )}

        <div className="flex items-center gap-1.5 text-[#cbd5e1] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <Bot size={11} className="text-sky-400" />
          <span className="truncate max-w-[150px]">{selectedModel}</span>
        </div>
      </div>
    </footer>
  );
};
