import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { Plus, X, Trash2, Sparkles } from 'lucide-react';
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
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 13,
        lineHeight: 1.2,
        theme: {
          background: '#0f0f0f',
          foreground: '#e5e5e5',
          cursor: '#ffffff',
          selectionBackground: '#2a2a2a',
          black: '#111111',
          red: '#e06c75',
          green: '#98c379',
          yellow: '#e5c07b',
          blue: '#61afef',
          magenta: '#c678dd',
          cyan: '#56b6c2',
          white: '#abb2bf',
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
      className="w-full bg-[#0f0f0f] border-t border-[#1f1f1f] flex flex-col z-10"
    >
      {/* Terminal Sekmeleri ve Başlığı */}
      <div className="h-8 px-3 bg-[#111111] border-b border-[#1f1f1f] flex items-center justify-between select-none">
        <div className="flex items-center gap-1">
          {terminals.map((t) => (
            <div
              key={t.id}
              onClick={() => setActiveTermId(t.id)}
              className={`flex items-center gap-2 px-2.5 py-1 text-[11px] rounded font-medium cursor-pointer ${
                activeTermId === t.id
                  ? 'bg-[#1f1f1f] text-[#e5e5e5]'
                  : 'text-[#8a8a8a] hover:text-[#e5e5e5]'
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
            className="p-1 text-[#8a8a8a] hover:text-[#e5e5e5] rounded hover:bg-[#1f1f1f]"
            title="New Terminal"
          >
            <Plus size={13} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Cursor-style Debug with AI Button */}
          <button
            onClick={handleDebugWithAI}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-md bg-gradient-to-r from-sky-500/15 to-indigo-500/15 hover:from-sky-500/25 hover:to-indigo-500/25 text-sky-300 border border-sky-500/30 transition-all shadow-sm"
            title="Terminaldeki son çıktıyı ve hataları Elytra AI ile anında incele ve çöz"
          >
            <Sparkles size={12} className="text-sky-400" />
            <span>Debug with Elytra AI</span>
          </button>

          <button
            onClick={() => {
              terminalBufferRef.current = '';
              xtermInstance.current?.clear();
            }}
            className="p-1 text-[#8a8a8a] hover:text-[#e5e5e5] rounded hover:bg-[#1f1f1f]"
            title="Clear Terminal"
          >
            <Trash2 size={13} />
          </button>
          <button
            onClick={toggleTerminal}
            className="p-1 text-[#8a8a8a] hover:text-[#e5e5e5] rounded hover:bg-[#1f1f1f]"
            title="Close Panel"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Terminal Konteynırı */}
      <div ref={terminalRef} className="flex-1 w-full h-full overflow-hidden p-1" />
    </div>
  );
};
