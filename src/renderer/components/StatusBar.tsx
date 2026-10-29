import React from 'react';
import { GitBranch, AlertCircle, CheckCircle2, Shield, Cpu } from 'lucide-react';
import { useElythraStore } from '../store/useElythraStore';

export const StatusBar: React.FC = () => {
  const { gitStatus, activeTabPath, openTabs, selectedModel, toggleTerminal } = useElythraStore();

  const activeTab = openTabs.find((t) => t.path === activeTabPath);

  return (
    <footer className="h-6 bg-[#06070a] border-t border-[#161a26] flex items-center justify-between px-3 text-[11px] text-[#717d91] select-none z-30">
      {/* Sol Taraf: Git Branch ve Tanılama */}
      <div className="flex items-center gap-3">
        {gitStatus?.isRepo && (
          <button
            onClick={toggleTerminal}
            className="flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <GitBranch size={12} className="text-sky-400" />
            <span className="font-mono text-[#94a3b8]">{gitStatus.branch}</span>
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

      {/* Sağ Taraf: Satır/Sütun, Dil, GC Shield ve Model */}
      <div className="flex items-center gap-3">
        {activeTab && (
          <>
            <span className="font-mono text-[#7e8b9f]">Ln 1, Col 1</span>
            <span className="font-mono text-[#7e8b9f]">Spaces: 2</span>
            <span className="font-mono text-[#7e8b9f]">UTF-8</span>
            <span className="capitalize text-[#7e8b9f]">{activeTab.language}</span>
          </>
        )}

        <div className="flex items-center gap-1 text-emerald-400 font-mono px-2 py-0.2 rounded-full bg-[#0e121c] border border-[#1b2234]">
          <Shield size={10} className="text-emerald-400" />
          <span className="text-[10px]">Shield: Active</span>
        </div>

        <div className="flex items-center gap-1.5 text-[#cbd5e1] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <Cpu size={11} className="text-sky-400" />
          <span className="truncate max-w-[150px]">{selectedModel}</span>
        </div>
      </div>
    </footer>
  );
};
