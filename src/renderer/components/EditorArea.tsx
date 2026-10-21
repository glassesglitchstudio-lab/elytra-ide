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

  // Inline AI States (Cursor Ctrl+K)
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

User Instruction:
${promptToRun}

CRITICAL RULES:
1. Return ONLY the revised code replacement inside a single markdown code block (\`\`\`${activeTab.language} ... \`\`\`).
2. Do NOT add conversational pleasantries, introductory text, or concluding notes. Output purely the code block so it can be directly merged.`;

      let reply = '';
      if (window.elythraAPI) {
        reply = await window.elythraAPI.sendAIChat({
          messages: [{ role: 'user', content: systemPrompt }],
          model: selectedModel,
          thinkingLevel,
          permissionMode,
          projectPath: activeProject?.path,
        });
      }

      if (!reply) {
        throw new Error('Yapay zeka modelinden yanıt alınamadı. Lütfen API ayarlarınızı kontrol edin.');
      }

      // Extract code block
      const match = reply.match(/```(?:[a-zA-Z0-9_\-]+)?\s*([\s\S]*?)```/);
      const codeReplacement = match ? match[1].trim() : reply.trim();

      const ed = editorRef.current;
      if (ed && selectionRange) {
        const model = ed.getModel();
        const originalFull = model.getValue();
        ed.executeEdits('elytra-inline', [
          { range: selectionRange, text: codeReplacement, forceMoveMarkers: true },
        ]);
        const modifiedFull = model.getValue();

        useElythraStore.setState({
          activeDiff: {
            path: activeTab.path,
            name: activeTab.name,
            original: originalFull,
            modified: modifiedFull,
          },
        });
        updateTabContent(activeTab.path, modifiedFull);
      } else {
        // Entire file
        await applyCodeToFile(codeReplacement, activeTab.language);
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

    // Define Elythra Dark flat theme for Monaco
    monaco.editor.defineTheme('elythra-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6a737d', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'e5e5e5', fontStyle: 'bold' },
        { token: 'string', foreground: '9ecbff' },
        { token: 'number', foreground: '79b8ff' },
        { token: 'function', foreground: 'b392f0' },
      ],
      colors: {
        'editor.background': '#111111',
        'editor.foreground': '#e5e5e5',
        'editor.lineHighlightBackground': '#181818',
        'editorCursor.foreground': '#ffffff',
        'editorWhitespace.foreground': '#262626',
        'editorIndentGuide.background': '#1c1c1c',
        'editorIndentGuide.activeBackground': '#2e2e2e',
        'editorLineNumber.foreground': '#444444',
        'editorLineNumber.activeForeground': '#8a8a8a',
      },
    });

    monaco.editor.setTheme('elythra-dark');

    // Ctrl+S shortcut binding in Monaco
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      saveActiveTab();
    });

    // Cursor-style Ctrl+K Inline AI shortcut binding in Monaco
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
    <div className="flex-1 h-full flex flex-col bg-[#111111] overflow-hidden relative">
      {/* Sekme Çubuğu */}
      <div className="h-9 bg-[#0f0f0f] border-b border-[#1f1f1f] flex items-center overflow-x-auto select-none">
        {openTabs.map((tab) => {
          const isActive = tab.path === activeTabPath;

          return (
            <div
              key={tab.path}
              onClick={() => openFileTab(tab.path)}
              className={`h-full flex items-center gap-2 px-3 border-r border-[#1f1f1f] text-[12px] cursor-pointer transition-colors max-w-[180px] ${
                isActive
                  ? 'bg-[#111111] text-[#e5e5e5] font-medium border-t-2 border-t-[#e5e5e5]'
                  : 'bg-[#0f0f0f] text-[#8a8a8a] hover:bg-[#161616] hover:text-[#e5e5e5]'
              }`}
            >
              <span className="truncate">{tab.name}</span>

              {tab.isDirty ? (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    closeFileTab(tab.path);
                  }}
                  className="w-3 h-3 flex items-center justify-center text-[#8a8a8a] hover:text-white"
                >
                  <Circle size={7} fill="currentColor" />
                </span>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeFileTab(tab.path);
                  }}
                  className="w-4 h-4 flex items-center justify-center text-[#8a8a8a] hover:text-white rounded hover:bg-[#2a2a2a]"
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
        {/* Cursor-Style Floating Inline AI Prompt Widget (Ctrl+K) */}
        {isInlineOpen && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 w-[640px] max-w-[94%] bg-[#12151e]/95 border border-sky-500/40 rounded-2xl shadow-2xl backdrop-blur-xl p-3.5 animate-fadeIn">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-sky-500/20 select-none">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
                  <Wand2 size={13} />
                </div>
                <span className="text-[12.5px] font-semibold text-white flex items-center gap-2">
                  <span>Elytra Inline AI</span>
                  <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-800/40">
                    Ctrl+K
                  </kbd>
                </span>
                <span className="text-[11px] text-[#9ca3af]">
                  {selectedSnippet
                    ? `(${selectedSnippet.split('\n').length} satır seçili)`
                    : '(Tüm dosya / imleç konumu)'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10.5px] font-mono px-2 py-0.5 rounded-full bg-sky-950/60 text-sky-300 border border-sky-800/40">
                  {selectedModel}
                </span>
                <button
                  onClick={() => setIsInlineOpen(false)}
                  className="w-5 h-5 rounded-md flex items-center justify-center text-[#9ca3af] hover:text-white hover:bg-white/10 transition-colors"
                  title="Kapat (Esc)"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Input Bar */}
            <div className="flex items-center gap-2 bg-[#0c0e14] border border-[#232938] focus-within:border-sky-500/60 rounded-xl px-3 py-2 shadow-inner transition-colors">
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
                className="flex-1 bg-transparent text-[13px] text-white placeholder-[#6b7280] focus:outline-none"
              />

              <button
                onClick={() => executeInlineAI()}
                disabled={!inlinePrompt.trim() || isInlineGenerating}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                  inlinePrompt.trim() && !isInlineGenerating
                    ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-md'
                    : 'bg-[#1b202c] text-[#555d6e] cursor-not-allowed'
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

            {/* Quick Chips */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2 select-none">
              <button
                onClick={() => executeInlineAI('Hata yakalama (try/catch) ve loglama ekle')}
                disabled={isInlineGenerating}
                className="px-2 py-1 rounded-md text-[11px] text-[#9ca3af] hover:text-white bg-[#161a24] hover:bg-sky-950/60 border border-[#232938] hover:border-sky-500/40 transition-colors"
              >
                + Try-Catch Ekle
              </button>
              <button
                onClick={() => executeInlineAI('Bu kodu modern async/await ve Promise yapısına dönüştür')}
                disabled={isInlineGenerating}
                className="px-2 py-1 rounded-md text-[11px] text-[#9ca3af] hover:text-white bg-[#161a24] hover:bg-sky-950/60 border border-[#232938] hover:border-sky-500/40 transition-colors"
              >
                ⚡ Async/Await Yap
              </button>
              <button
                onClick={() => executeInlineAI('TypeScript tip güvenliği ve JSDoc dokümantasyonu ekle')}
                disabled={isInlineGenerating}
                className="px-2 py-1 rounded-md text-[11px] text-[#9ca3af] hover:text-white bg-[#161a24] hover:bg-sky-950/60 border border-[#232938] hover:border-sky-500/40 transition-colors"
              >
                🛡 Tip Güvenliği & JSDoc
              </button>
              <button
                onClick={() => executeInlineAI('Kodu temizle, okunabilirliği ve performansı optimize et')}
                disabled={isInlineGenerating}
                className="px-2 py-1 rounded-md text-[11px] text-[#9ca3af] hover:text-white bg-[#161a24] hover:bg-sky-950/60 border border-[#232938] hover:border-sky-500/40 transition-colors"
              >
                🚀 Performans Refactor
              </button>
            </div>

            {inlineError && (
              <div className="mt-2 text-[11.5px] text-red-400 flex items-center gap-1.5 bg-red-950/40 border border-red-800/40 px-2.5 py-1.5 rounded-lg">
                <AlertCircle size={13} />
                <span>{inlineError}</span>
              </div>
            )}
          </div>
        )}

        {/* Cursor-Style Floating Diff Review Banner */}
        {activeDiff && (
          <div className="absolute top-3 left-4 right-4 z-30 flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#131722]/95 border border-sky-500/40 backdrop-blur-md shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Sparkles size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-[12.5px] font-semibold text-white flex items-center gap-2">
                  <span>Elytra AI Değişiklikleri Uyguladı</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-sky-950/60 text-sky-300 border border-sky-800/40">
                    {activeDiff.name}
                  </span>
                </span>
                <span className="text-[11px] text-[#9ca3af]">
                  Kod aktif editöre aktarıldı. Dosyayı kaydetmek için Kabul Et'e, vazgeçmek için Geri Al'a tıklayın.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={rejectDiff}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-red-400 bg-red-950/40 hover:bg-red-950/70 border border-red-800/40 transition-colors shadow-sm"
                title="Değişiklikleri iptal et ve önceki haline döndür"
              >
                <Undo2 size={13} />
                <span>Decline (Geri Al)</span>
              </button>

              <button
                onClick={acceptDiff}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-medium text-white bg-emerald-600 hover:bg-emerald-500 shadow-md transition-colors"
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
              fontFamily: "'JetBrains Mono', monospace",
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
              padding: { top: 8, bottom: 8 },
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#8a8a8a] select-none">
            <p className="text-[14px]">No file open</p>
            <p className="text-[12px] text-[#555555] mt-1">
              Select a file from the explorer or press <kbd className="px-1 py-0.5 bg-[#1f1f1f] rounded text-[11px]">Ctrl+P</kbd>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
