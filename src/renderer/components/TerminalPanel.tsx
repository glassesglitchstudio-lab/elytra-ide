import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { Plus, X, Trash2, Sparkles, Terminal as TerminalIcon } from 'lucide-react';
import { useElythraStore } from '../store/useElythraStore';

export const TerminalPanel: React.FC = () => {
  const {
    isTerminalOpen,
    toggleTerminal,
    activeProject,
    terminalHeight,
    setActiveView,
    setSidebarTab,
    sendMessage,
  } = useElythraStore();
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermInstance = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const terminalBufferRef = useRef<string>('');

  const [terminals, setTerminals] = useState([{ id: 'term-1', name: 'PowerShell' }]);
  const [activeTermId, setActiveTermId] = useState('term-1');

  useEffect(() => {
    if (!isTerminalOpen || !terminalRef.current) return;

    if (!xtermInstance.current) {
      const term = new XTerm({
        cursorBlink: true,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: 13,
        lineHeight: 1.25,
        theme: {
          background: '#07090e',
          foreground: '#e2e8f0',
          cursor: '#38bdf8',
          selectionBackground: '#1e293b80',
          black: '#0a0d14',
          red: '#f87171',
          green: '#34d399',
          yellow: '#fbbf24',
          blue: '#60a5fa',
          magenta: '#c084fc',
          cyan: '#38bdf8',
          white: '#f1f5f9',
        },
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(terminalRef.current);
      fitAddon.fit();

      xtermInstance.current = term;
      fitAddonRef.current = fitAddon;

      // Start real process
      if (window.elythraAPI) {
        window.elythraAPI.terminalCreate(activeTermId, activeProject?.path);

        const unsubscribe = window.elythraAPI.onTerminalData(activeTermId, (data) => {
          term.write(data);
          // Rolling buffer of the latest 5000 characters for instant AI diagnosis
          terminalBufferRef.current = (terminalBufferRef.current + data).slice(-5000);
        });

        term.onData((data) => {
          window.elythraAPI?.terminalWrite(activeTermId, data);
        });

        return () => {
          unsubscribe();
        };
      }
    } else {
      setTimeout(() => fitAddonRef.current?.fit(), 100);
    }
  }, [isTerminalOpen, activeTermId]);

  const handleDebugWithAI = () => {
    const raw = terminalBufferRef.current;
    // Strip ANSI control characters
    const clean = raw.replace(/\u001b\[[0-9;]*[a-zA-Z]/g, '').replace(/[\r]/g, '').trim();
    const lastLines = clean
      ? clean.split('\n').slice(-30).join('\n')
      : 'Terminalde henüz bir çıktı veya hata kaydı bulunmuyor.';

    const debugPrompt = `Terminalimde aşağıdaki çıktı veya hata meydana geldi. Lütfen bu hatayı analiz et, kök nedenini açıkla ve sorunu çözecek kesin terminal komutlarını ve dosya düzeltmelerini sun:\n\n\`\`\`bash\n${lastLines}\n\`\`\``;

    setActiveView('studio');
    setSidebarTab('chat');
    sendMessage(debugPrompt);
  };

  if (!isTerminalOpen) return null;

  return (
    <div
      style={{ height: `${terminalHeight}px` }}
      className="w-full bg-[#07090e] border-t border-[#181d2a] flex flex-col z-10 select-none"
    >
      {/* Terminal Sekmeleri ve Başlığı */}
      <div className="h-8 px-3.5 bg-[#0a0d14] border-b border-[#181d2a] flex items-center justify-between select-none">
        <div className="flex items-center gap-1.5">
          <TerminalIcon size={13} className="text-sky-400 mr-1" />
          {terminals.map((t) => (
            <div
              key={t.id}
              onClick={() => setActiveTermId(t.id)}
              className={`flex items-center gap-2 px-2.5 py-0.5 text-[11px] rounded-lg font-medium cursor-pointer transition-all ${
                activeTermId === t.id
                  ? 'bg-[#141a29] text-white border border-sky-500/30'
                  : 'text-[#7e8b9f] hover:text-[#f1f5f9] hover:bg-[#101420]'
              }`}
            >
              <span>{t.name}</span>
            </div>
          ))}

          <button
            onClick={() => {
              const newId = `term-${terminals.length + 1}`;
              setTerminals([...terminals, { id: newId, name: `Terminal ${terminals.length + 1}` }]);
              setActiveTermId(newId);
            }}
            className="p-1 text-[#7e8b9f] hover:text-[#f1f5f9] rounded-lg hover:bg-[#141926] transition-colors"
            title="New Terminal"
          >
            <Plus size={13} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Elytra AI Integrated Diagnosis */}
          <button
            onClick={handleDebugWithAI}
            className="flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium rounded-lg bg-gradient-to-r from-sky-500/20 to-blue-600/20 hover:from-sky-500/30 hover:to-blue-600/30 text-sky-300 border border-sky-500/30 transition-all shadow-sm"
            title="Terminaldeki son çıktıyı ve hataları Elytra AI ile anında incele ve çöz"
          >
            <Sparkles size={11} className="text-sky-400" />
            <span>Debug with Elytra AI</span>
          </button>

          <button
            onClick={() => {
              terminalBufferRef.current = '';
              xtermInstance.current?.clear();
            }}
            className="p-1 text-[#7e8b9f] hover:text-[#f1f5f9] rounded-lg hover:bg-[#141926] transition-colors"
            title="Clear Terminal"
          >
            <Trash2 size={13} />
          </button>
          <button
            onClick={toggleTerminal}
            className="p-1 text-[#7e8b9f] hover:text-[#f1f5f9] rounded-lg hover:bg-[#141926] transition-colors"
            title="Close Panel"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Gerçek xterm Konteyneri */}
      <div ref={terminalRef} className="flex-1 w-full overflow-hidden select-text" />
    </div>
  );
};
