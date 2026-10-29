import React, { useRef, useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import {
  X,
  Circle,
  Sparkles,
  Check,
  Undo2,
  FileCode,
  CornerDownLeft,
  Loader2,
  Wand2,
  Code2,
  AlertCircle,
  Cpu,
} from 'lucide-react';
import { useElythraStore } from '../store/useElythraStore';

export const EditorArea: React.FC = () => {
  const {
    openTabs,
    activeTabPath,
    openFileTab,
    closeFileTab,
    updateTabContent,
    saveActiveTab,
    settings,
    activeDiff,
    acceptDiff,
    rejectDiff,
    applyCodeToFile,
    selectedModel,
    thinkingLevel,
    permissionMode,
    activeProject,
    sendMessage,
    setActiveView,
    setSidebarTab,
  } = useElythraStore();

  const editorRef = useRef<any>(null);
  const inlineInputRef = useRef<HTMLInputElement>(null);

  // Elytra Floating Inline AI States (Ctrl+K)
  const [isInlineOpen, setIsInlineOpen] = useState(false);
  const [inlinePrompt, setInlinePrompt] = useState('');
  const [selectedSnippet, setSelectedSnippet] = useState('');
  const [selectionRange, setSelectionRange] = useState<any>(null);
  const [isInlineGenerating, setIsInlineGenerating] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const activeTab = openTabs.find((t) => t.path === activeTabPath);

  useEffect(() => {
    if (isInlineOpen) {
      setTimeout(() => {
        inlineInputRef.current?.focus();
      }, 50);
    }
  }, [isInlineOpen]);

  const triggerInlineAI = () => {
    const ed = editorRef.current;
    if (!ed) return;
    const sel = ed.getSelection();
    const model = ed.getModel();
    let snippet = '';
    if (sel && model && !sel.isEmpty()) {
      snippet = model.getValueInRange(sel);
    }
    setSelectedSnippet(snippet);
    setSelectionRange(sel && !sel.isEmpty() ? sel : null);
    setInlineError(null);
    setIsInlineOpen(true);
  };

  const handleQuickAsk = (instruction: string, code: string) => {
    const prompt = `${instruction}\n\n\`\`\`${activeTab?.language || 'plaintext'}\n${code.slice(0, 4000)}\n\`\`\``;
    setActiveView('studio');
    setSidebarTab('chat');
    sendMessage(prompt);
  };

  const executeInlineAI = async (customPrompt?: string) => {
    const promptToRun = customPrompt || inlinePrompt;
    if (!promptToRun.trim() || isInlineGenerating || !activeTab) return;

    setIsInlineGenerating(true);
    setInlineError(null);

    try {
      const codeToProcess = selectedSnippet || activeTab.content;
      const systemPrompt = `You are Elytra Code's autonomous AI pair programming and code refactor engine.
Target File: ${activeTab.name}
Language: ${activeTab.language}

Original Code:
\`\`\`${activeTab.language}
${codeToProcess}
\`\`\`

Task / Instruction: ${promptToRun}

CRITICAL RULES:
1. Provide the complete updated/refactored code replacement.
2. Return ONLY code inside a single code block, or provide the direct code without pleasantries.
3. Keep formatting clean, modern, and production-ready.`;

      let generatedCode = '';
      if (window.elythraAPI) {
        const stream = window.elythraAPI.aiStreamChat({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: promptToRun },
          ],
          model: selectedModel,
          temperature: 0.2,
        });

        for await (const chunk of stream) {
          if (chunk.content) {
            generatedCode += chunk.content;
          }
        }
      }

      const codeMatch = generatedCode.match(/```(?:\w+)?\s*([\s\S]*?)```/);
      const cleanCode = codeMatch ? codeMatch[1].trim() : generatedCode.trim();

      if (!cleanCode) {
        throw new Error('Modelden geçerli kod yanıtı alınamadı.');
      }

      if (selectionRange && editorRef.current) {
        const ed = editorRef.current;
        ed.executeEdits('elytra-inline-ai', [
          {
            range: selectionRange,
            text: cleanCode,
            forceMoveMarkers: true,
          },
        ]);
        updateTabContent(activeTab.path, ed.getValue());
      } else {
        applyCodeToFile(cleanCode, activeTab.language);
      }

      setIsInlineOpen(false);
      setInlinePrompt('');
    } catch (err: any) {
      setInlineError(err.message || 'Kod üretimi sırasında hata oluştu.');
    } finally {
      setIsInlineGenerating(false);
    }
  };

  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Define Elytra Dark Modern luxury theme for Monaco
    monaco.editor.defineTheme('elythra-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '54627b', fontStyle: 'italic' },
        { token: 'keyword', foreground: '38bdf8', fontStyle: 'bold' },
        { token: 'string', foreground: '34d399' },
        { token: 'number', foreground: 'fbbf24' },
        { token: 'function', foreground: '818cf8' },
        { token: 'type', foreground: 'c084fc' },
        { token: 'variable', foreground: 'e2e8f0' },
      ],
      colors: {
        'editor.background': '#0a0c12',
        'editor.foreground': '#e2e8f0',
        'editor.lineHighlightBackground': '#121624',
        'editorCursor.foreground': '#38bdf8',
        'editorWhitespace.foreground': '#1f2638',
        'editorIndentGuide.background': '#151b2a',
        'editorIndentGuide.activeBackground': '#2d3748',
        'editorLineNumber.foreground': '#3b4559',
        'editorLineNumber.activeForeground': '#94a3b8',
        'editor.selectionBackground': '#1e293b80',
        'editor.inactiveSelectionBackground': '#1e293b40',
      },
    });

    monaco.editor.setTheme('elythra-dark');

    // Ctrl+S shortcut binding in Monaco
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      saveActiveTab();
    });

    // Elytra Ctrl+K Inline AI shortcut binding in Monaco
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
      triggerInlineAI();
    });

    // Monaco Context Menu Actions (Right-Click)
    editor.addAction({
      id: 'elytra-inline-edit',
      label: '✨ Elytra AI: Inline Düzenle (Ctrl+K)',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK],
      contextMenuGroupId: '1_modification',
      contextMenuOrder: 1,
      run: () => triggerInlineAI(),
    });

    editor.addAction({
      id: 'elytra-explain-code',
      label: '🔍 Elytra AI: Bu Kodu Açıkla',
      contextMenuGroupId: '1_modification',
      contextMenuOrder: 2,
      run: (ed: any) => {
        const sel = ed.getSelection();
        const code = sel && !sel.isEmpty() ? ed.getModel().getValueInRange(sel) : ed.getValue();
        handleQuickAsk('Bu kodun ne yaptığını, çalışma mantığını ve mimarisini açıkla:', code);
      },
    });

    editor.addAction({
      id: 'elytra-unit-tests',
      label: '🧪 Elytra AI: Birim Testleri (Unit Tests) Üret',
      contextMenuGroupId: '1_modification',
      contextMenuOrder: 3,
      run: (ed: any) => {
        const sel = ed.getSelection();
        const code = sel && !sel.isEmpty() ? ed.getModel().getValueInRange(sel) : ed.getValue();
        handleQuickAsk('Bu kod için kapsamlı birim testleri (unit tests) ve edge case senaryoları yaz:', code);
      },
    });

    editor.addAction({
      id: 'elytra-refactor',
      label: '⚡ Elytra AI: Kodu Optimize Et & Refactor Yap',
      contextMenuGroupId: '1_modification',
      contextMenuOrder: 4,
      run: (ed: any) => {
        const sel = ed.getSelection();
        const code = sel && !sel.isEmpty() ? ed.getModel().getValueInRange(sel) : ed.getValue();
        handleQuickAsk('Bu kodu temiz kod (clean code) prensiplerine göre optimize et ve refactor önerilerini sun:', code);
      },
    });
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#0a0c12] overflow-hidden relative">
      {/* Sekme Çubuğu */}
      <div className="h-9 bg-[#07080c] border-b border-[#181d2a] flex items-center overflow-x-auto select-none">
        {openTabs.map((tab) => {
          const isActive = tab.path === activeTabPath;

          return (
            <div
              key={tab.path}
              onClick={() => openFileTab(tab.path)}
              className={`h-full flex items-center gap-2 px-3.5 border-r border-[#181d2a] text-[12px] cursor-pointer transition-all max-w-[200px] ${
                isActive
                  ? 'bg-[#0a0c12] text-white font-medium border-t-2 border-t-sky-400 shadow-sm'
                  : 'bg-[#07080c] text-[#7e8b9f] hover:bg-[#0e121c] hover:text-[#f1f5f9]'
              }`}
            >
              <FileCode size={13} className={isActive ? 'text-sky-400' : 'text-[#5a6578]'} />
              <span className="truncate">{tab.name}</span>

              {tab.isDirty ? (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    closeFileTab(tab.path);
                  }}
                  className="w-3.5 h-3.5 flex items-center justify-center text-[#7e8b9f] hover:text-white"
                >
                  <Circle size={7} fill="currentColor" />
                </span>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeFileTab(tab.path);
                  }}
                  className="w-4 h-4 flex items-center justify-center text-[#7e8b9f] hover:text-white rounded hover:bg-[#182032] transition-colors"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Monaco Editör Alanı */}
      <div className="flex-1 w-full h-full relative">
        {/* Elytra Modern Floating Inline AI Prompt Widget (Ctrl+K) */}
        {isInlineOpen && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 w-[660px] max-w-[94%] bg-[#0e121e]/95 border border-sky-500/40 rounded-2xl shadow-[0_16px_50px_rgba(0,0,0,0.8),0_0_25px_rgba(56,189,248,0.15)] backdrop-blur-2xl p-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#1f2638] select-none">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Wand2 size={13} />
                </div>
                <span className="text-[12.5px] font-semibold text-white flex items-center gap-2">
                  <span>Elytra Inline Refactor</span>
                  <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-800/40">
                    Ctrl+K
                  </kbd>
                </span>
                <span className="text-[11px] text-[#7e8b9f]">
                  {selectedSnippet
                    ? `(${selectedSnippet.split('\n').length} satır seçili)`
                    : '(Tüm dosya / imleç konumu)'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10.5px] font-mono px-2 py-0.5 rounded-full bg-[#121624] text-sky-300 border border-sky-800/40 flex items-center gap-1">
                  <Cpu size={10} />
                  <span>{selectedModel}</span>
                </span>
                <button
                  onClick={() => setIsInlineOpen(false)}
                  className="w-5 h-5 rounded-md flex items-center justify-center text-[#7e8b9f] hover:text-white hover:bg-white/10 transition-colors"
                  title="Kapat (Esc)"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Input Bar */}
            <div className="flex items-center gap-2 bg-[#090b10] border border-[#202738] focus-within:border-sky-500/60 rounded-xl px-3.5 py-2.5 shadow-inner transition-colors">
              <input
                ref={inlineInputRef}
                type="text"
                value={inlinePrompt}
                onChange={(e) => setInlinePrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    executeInlineAI();
                  } else if (e.key === 'Escape') {
                    setIsInlineOpen(false);
                  }
                }}
                disabled={isInlineGenerating}
                placeholder="Kodu nasıl değiştirmek veya ne eklemek istiyorsunuz? (Enter: Çalıştır, Esc: Kapat)"
                className="flex-1 bg-transparent text-[13px] text-white placeholder-[#5a6578] focus:outline-none"
              />

              <button
                onClick={() => executeInlineAI()}
                disabled={!inlinePrompt.trim() || isInlineGenerating}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                  inlinePrompt.trim() && !isInlineGenerating
                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-md'
                    : 'bg-[#141926] text-[#556070] cursor-not-allowed border border-[#1b2234]'
                }`}
              >
                {isInlineGenerating ? (
                  <>
                    <Loader2 size={13} className="animate-spin text-sky-300" />
                    <span>Üretiyor...</span>
                  </>
                ) : (
                  <>
                    <span>Uygula</span>
                    <CornerDownLeft size={12} strokeWidth={2.5} />
                  </>
                )}
              </button>
            </div>

            {/* Quick Action Chips */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2.5 select-none">
              <button
                onClick={() => executeInlineAI('Hata yakalama (try/catch) ve loglama ekle')}
                disabled={isInlineGenerating}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-[#94a3b8] hover:text-white bg-[#121624] hover:bg-sky-950/60 border border-[#202738] hover:border-sky-500/40 transition-colors"
              >
                + Try-Catch Ekle
              </button>
              <button
                onClick={() => executeInlineAI('Bu kodu modern async/await ve Promise yapısına dönüştür')}
                disabled={isInlineGenerating}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-[#94a3b8] hover:text-white bg-[#121624] hover:bg-sky-950/60 border border-[#202738] hover:border-sky-500/40 transition-colors"
              >
                ⚡ Async/Await Yap
              </button>
              <button
                onClick={() => executeInlineAI('TypeScript tip güvenliği ve JSDoc dokümantasyonu ekle')}
                disabled={isInlineGenerating}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-[#94a3b8] hover:text-white bg-[#121624] hover:bg-sky-950/60 border border-[#202738] hover:border-sky-500/40 transition-colors"
              >
                🛡 Tip Güvenliği & JSDoc
              </button>
              <button
                onClick={() => executeInlineAI('Kodu temizle, okunabilirliği ve performansı optimize et')}
                disabled={isInlineGenerating}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-[#94a3b8] hover:text-white bg-[#121624] hover:bg-sky-950/60 border border-[#202738] hover:border-sky-500/40 transition-colors"
              >
                🚀 Performans Refactor
              </button>
            </div>

            {inlineError && (
              <div className="mt-2.5 text-[11.5px] text-rose-400 flex items-center gap-1.5 bg-rose-950/40 border border-rose-800/40 px-3 py-2 rounded-xl">
                <AlertCircle size={13} />
                <span>{inlineError}</span>
              </div>
            )}
          </div>
        )}

        {/* Elytra Floating Diff Review Banner */}
        {activeDiff && (
          <div className="absolute top-3 left-4 right-4 z-30 flex items-center justify-between px-4 py-2.5 rounded-2xl bg-[#0e121e]/95 border border-sky-500/40 backdrop-blur-xl shadow-[0_16px_50px_rgba(0,0,0,0.8),0_0_20px_rgba(56,189,248,0.15)] animate-slideDown">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Sparkles size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-[12.5px] font-semibold text-white flex items-center gap-2">
                  <span>Elytra AI Değişiklikleri Uyguladı</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-sky-950/80 text-sky-300 border border-sky-800/40">
                    {activeDiff.name}
                  </span>
                </span>
                <span className="text-[11px] text-[#94a3b8]">
                  Kod aktif editöre aktarıldı. Dosyayı kaydetmek için Kabul Et'e, vazgeçmek için Geri Al'a tıklayın.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={rejectDiff}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12px] font-medium text-rose-300 bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/50 transition-all shadow-sm active:scale-95"
                title="Değişiklikleri iptal et ve önceki haline döndür"
              >
                <Undo2 size={13} />
                <span>Decline (Geri Al)</span>
              </button>

              <button
                onClick={acceptDiff}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[12px] font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-md shadow-emerald-950/40 transition-all active:scale-95"
                title="Değişiklikleri onayla ve diske kaydet"
              >
                <Check size={13} strokeWidth={2.5} />
                <span>Accept (Kabul Et)</span>
              </button>
            </div>
          </div>
        )}

        {activeTab ? (
          <Editor
            height="100%"
            language={activeTab.language}
            value={activeTab.content}
            theme="elythra-dark"
            onChange={(val) => updateTabContent(activeTab.path, val || '')}
            onMount={handleEditorMount}
            options={{
              fontSize: settings.fontSize || 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontLigatures: true,
              minimap: { enabled: true, maxColumn: 80 },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
              lineNumbers: 'on',
              renderLineHighlight: 'all',
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              smoothScrolling: true,
              padding: { top: 10, bottom: 10 },
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#64748b] select-none">
            <div className="w-12 h-12 rounded-2xl bg-[#0e121c] border border-[#1f2638] flex items-center justify-center mb-3 text-sky-400">
              <Code2 size={24} />
            </div>
            <p className="text-[14px] font-medium text-[#cbd5e1]">No file open</p>
            <p className="text-[12px] text-[#64748b] mt-1">
              Select a file from the explorer or press <kbd className="px-1.5 py-0.5 bg-[#121624] border border-[#202738] rounded text-[11px] text-[#94a3b8]">Ctrl+P</kbd>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
