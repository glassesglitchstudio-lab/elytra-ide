import React from 'react';
import { EditorArea } from './EditorArea';
import { TerminalPanel } from './TerminalPanel';
import { AIAssistantPanel } from './AIAssistantPanel';
import { StatusBar } from './StatusBar';

export const IdeWorkspace: React.FC = () => {
  return (
    <div className="flex-1 h-full flex flex-col bg-[#0f0f0f] overflow-hidden">
      {/* Central Area: Editor + Terminal + Right AI Assistant */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Editor & Terminal Panel */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a]">
          <EditorArea />
          <TerminalPanel />
        </div>

        {/* Right Collapsible AI Assistant Panel */}
        <AIAssistantPanel />
      </div>

      {/* Bottom Status Bar */}
      <StatusBar />
    </div>
  );
};
