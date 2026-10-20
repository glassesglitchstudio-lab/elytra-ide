import React, { useRef } from 'react';
import Editor from '@monaco-editor/react';
import { X, Circle } from 'lucide-react';
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
  } = useElythraStore();

  const editorRef = useRef<any>(null);

  const activeTab = openTabs.find((t) => t.path === activeTabPath);

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
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#111111] overflow-hidden">
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
