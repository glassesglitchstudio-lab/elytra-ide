import React, { useState } from 'react';
import {
  Brain,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Code2,
  FileCode,
  Terminal,
  Play,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Globe,
} from 'lucide-react';
import { useElythraStore } from '../store/useElythraStore';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isStreaming }) => {
  const { applyCodeToFile, runInTerminal } = useElythraStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [appliedId, setAppliedId] = useState<string | null>(null);
  const [executedCmdId, setExecutedCmdId] = useState<string | null>(null);

  // Default to collapsed (Thought Process >) matching Cursor / Antigravity design
  const [isThoughtOpen, setIsThoughtOpen] = useState(false);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApply = (code: string, id: string, lang: string) => {
    applyCodeToFile(code, lang);
    setAppliedId(id);
    setTimeout(() => setAppliedId(null), 2500);
  };

  const handleRunTerminal = (cmd: string, id: string) => {
    runInTerminal(cmd);
    setExecutedCmdId(id);
    setTimeout(() => setExecutedCmdId(null), 2500);
  };

  // 1. Comprehensive Thought Process Extraction (<think>, <thought>, <reasoning>, markdown headers)
  let thoughts: string[] = [];
  let remainingContent = content;
  let isCurrentlyThinking = false;

  // Closed <think>...</think>, <thought>...</thought>, <reasoning>...</reasoning>
  const closedTagRegex = /<(?:think|thought|reasoning)>([\s\S]*?)<\/(?:think|thought|reasoning)>/gi;
  let match: RegExpExecArray | null;
  while ((match = closedTagRegex.exec(content)) !== null) {
    if (match[1].trim()) {
      thoughts.push(match[1].trim());
    }
  }
  remainingContent = remainingContent.replace(closedTagRegex, '').trim();

  // Active unclosed <think> tag at the end (live streaming)
  const openTagMatch = remainingContent.match(/<(?:think|thought|reasoning)>([\s\S]*)$/i);
  if (openTagMatch) {
    if (openTagMatch[1].trim()) {
      thoughts.push(openTagMatch[1].trim());
    }
    remainingContent = remainingContent.replace(/<(?:think|thought|reasoning)>[\s\S]*$/i, '').trim();
    isCurrentlyThinking = true;
  }

  // Markdown headers (### Thought Process / ### Düşünce Süreci / Thinking Process:)
  if (thoughts.length === 0) {
    const mdThoughtRegex = /###?\s*(?:🧠|\u{1F9E0}\s*)?(?:Thought Process|Thinking Process|Düşünce Süreci|Thinking)[^\n]*\n([\s\S]*?)(?=\n## |\n### |\n---|\n```|$)/iu;
    const mdMatch = remainingContent.match(mdThoughtRegex);
    if (mdMatch) {
      thoughts.push(mdMatch[1].trim());
      remainingContent = remainingContent.replace(mdMatch[0], '').trim();
    }
  }

  const thoughtContent = thoughts.length > 0 ? thoughts.join('\n\n') : null;

  // 2. Parse remaining content into blocks (code blocks, tool calls, search steps, markdown paragraphs)
  const blocks: Array<{
    type: 'code' | 'tool' | 'search' | 'text' | 'error';
    language?: string;
    code?: string;
    title?: string;
    text?: string;
    toolName?: string;
  }> = [];

  const lines = remainingContent.split('\n');
  let inCodeBlock = false;
  let currentLanguage = '';
  let currentCodeLines: string[] = [];
  let currentTextLines: string[] = [];

  const flushText = () => {
    if (currentTextLines.length > 0) {
      const textBlock = currentTextLines.join('\n').trim();
      if (textBlock) {
        if (
          textBlock.includes('API Error') ||
          textBlock.includes('Diagnostic') ||
          textBlock.includes('Hata:') ||
          textBlock.includes('Bağlantı Hatası:')
        ) {
          blocks.push({ type: 'error', text: textBlock.replace(/^[\u{26A0}\s]+/, '') });
        } else {
          blocks.push({ type: 'text', text: textBlock });
        }
      }
      currentTextLines = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Web Search / Research pattern: Tools: Araştırma Aracı ... or Tools: Web Search ... or [Web Araştırması: ...]
    if (
      line.match(/^(?:>|\[)?\s*(?:\u{1F310}\s*)?(?:Tools?\s*:\s*)?(?:Araştırma Aracı|Web Search|Search|Browsing|Web Research|Web Araştırması)\b/iu) ||
      line.match(/^(?:>|\[)?\s*(?:\u{1F310}\s*)?Tools?\s*:\s*.*(?:search|araştır|web|google)/iu)
    ) {
      flushText();
      const rawText = line
        .replace(/^Tools?\s*:\s*/i, '')
        .replace(/^[>\[]\s*/, '')
        .replace(/[\]]$/, '')
        .replace(/^[\u{1F310}\s]+/, '')
        .trim();

      let toolName = 'Araştırma Aracı (Web Search)';
      let text = rawText;
      const parts = rawText.split(/[-–—:]\s*(.+)/);
      if (parts.length > 1 && (rawText.toLowerCase().includes('araştırma') || rawText.toLowerCase().includes('search') || rawText.toLowerCase().includes('web'))) {
        toolName = parts[0].trim();
        text = parts[1].trim();
      }

      blocks.push({
        type: 'search',
        toolName,
        text,
      });
      continue;
    }

    // Generic Tool call pattern: Tools: <Tool Name> - <Payload> or [Tool: ...] or > [Tool Execution: ...]
    if (
      line.match(/^(?:>|\[)?\s*(?:\u{26A1}\s*)?Tools?\s*:\s*/iu) ||
      line.match(/^[>\[]\s*(?:\u{26A1}\s*)?(?:\**Tools?|\[Tools?|\**Execution)/iu)
    ) {
      flushText();
      const rawText = line
        .replace(/^[>\[]\s*/, '')
        .replace(/[\]]$/, '')
        .replace(/^[\u{26A1}\s]+/, '')
        .replace(/^Tools?\s*:\s*/i, '')
        .trim();

      let toolName = 'Araç Kullanımı';
      let text = rawText;
      const parts = rawText.split(/[-–—:]\s*(.+)/);
      if (parts.length > 1) {
        toolName = parts[0].trim();
        text = parts[1].trim();
      }

      blocks.push({
        type: 'tool',
        toolName,
        text,
      });
      continue;
    }

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        blocks.push({
          type: 'code',
          language: currentLanguage || 'code',
          code: currentCodeLines.join('\n'),
        });
        currentCodeLines = [];
        inCodeBlock = false;
        currentLanguage = '';
      } else {
        // Start of code block
        flushText();
        inCodeBlock = true;
        currentLanguage = line.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      currentCodeLines.push(line);
    } else {
      currentTextLines.push(line);
    }
  }

  // Flush any lingering blocks
  if (inCodeBlock && currentCodeLines.length > 0) {
    blocks.push({
      type: 'code',
      language: currentLanguage || 'code',
      code: currentCodeLines.join('\n'),
    });
  } else {
    flushText();
  }

  return (
    <div className="space-y-3 leading-relaxed text-[#e2e8f0] text-[13.5px]">
      {/* Sleek Thought Process Accordion (Cursor / Antigravity Style) */}
      {thoughtContent && (
        <div className="mb-3.5 select-none font-sans">
          <button
            onClick={() => setIsThoughtOpen(!isThoughtOpen)}
            className="inline-flex items-center gap-2 py-1.5 px-3 rounded-xl text-[12.5px] font-medium text-[#94a3b8] hover:text-white bg-[#12151d] hover:bg-[#181c26] border border-[#222736] hover:border-sky-500/30 shadow-sm transition-all cursor-pointer group"
          >
            <Brain
              size={14}
              className={`text-[#7f8da0] group-hover:text-purple-400 transition-colors ${
                isCurrentlyThinking ? 'animate-pulse text-purple-400' : ''
              }`}
            />
            <span className="tracking-tight text-[#94a3b8] group-hover:text-[#f1f5f9]">
              Düşünce Süreci (Reasoning)
            </span>
            {isCurrentlyThinking && (
              <span className="flex items-center gap-1.5 text-[10.5px] text-purple-400 font-mono font-medium bg-purple-950/50 px-2 py-0.5 rounded-full border border-purple-800/40">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                <span>Düşünüyor...</span>
              </span>
            )}
            <span className="text-[#64748b] group-hover:text-[#94a3b8] transition-transform ml-1">
              {isThoughtOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </span>
          </button>

          {/* Smooth Collapsible Content */}
          {isThoughtOpen && (
            <div className="mt-2.5 p-3.5 rounded-xl bg-[#0d0f15]/90 border border-[#202534] text-[12px] leading-relaxed text-[#94a3b8] space-y-2 select-text font-mono animate-fadeIn shadow-inner">
              {thoughtContent.split('\n\n').map((para, pIdx) => (
                <div key={pIdx} className="whitespace-pre-wrap">
                  {para}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Content Blocks */}
      {blocks.map((block, idx) => {
        if (block.type === 'search') {
          return (
            <div
              key={idx}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-[#0b1424] via-[#0f2038] to-[#0b1424] border border-sky-500/40 text-[12.5px] font-mono my-2.5 shadow-lg shadow-sky-950/20 select-none animate-fadeIn"
            >
              <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center flex-shrink-0 text-sky-400 shadow-inner">
                <Globe size={15} />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-wider text-sky-400 uppercase bg-sky-950/80 px-1.5 py-0.5 rounded border border-sky-800/50">
                    TOOLS:
                  </span>
                  <span className="text-[12px] font-semibold text-white tracking-wide truncate">
                    {block.toolName || 'Araştırma Aracı (Web Search)'}
                  </span>
                </div>
                {block.text && (
                  <span className="text-[11.5px] text-[#93c5fd] truncate mt-0.5 font-normal">
                    {block.text}
                  </span>
                )}
              </div>
              <span className="text-[10.5px] font-medium text-sky-300 px-2.5 py-0.5 rounded-full bg-sky-950/80 border border-sky-600/40 flex-shrink-0 shadow-sm">
                Aktif Kullanıldı
              </span>
            </div>
          );
        }

        if (block.type === 'tool') {
          return (
            <div
              key={idx}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-[#0b1c14] via-[#0e271c] to-[#0b1c14] border border-emerald-500/40 text-[12.5px] font-mono my-2.5 shadow-lg shadow-emerald-950/20 select-none animate-fadeIn"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0 text-emerald-400 shadow-inner">
                <Terminal size={15} />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/50">
                    TOOLS:
                  </span>
                  <span className="text-[12px] font-semibold text-white tracking-wide truncate">
                    {block.toolName || 'Araç Çağrısı'}
                  </span>
                </div>
                {block.text && (
                  <span className="text-[11.5px] text-[#a7f3d0] truncate mt-0.5 font-normal">
                    {block.text}
                  </span>
                )}
              </div>
              <span className="flex items-center gap-1 text-[10.5px] font-medium text-emerald-300 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-600/40 flex-shrink-0 shadow-sm">
                <Check size={11} className="text-emerald-400" />
                <span>Kullanıldı</span>
              </span>
            </div>
          );
        }

        if (block.type === 'error') {
          return (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-red-950/25 border border-red-800/50 text-red-200 text-[13px] my-3 space-y-1.5 shadow-md"
            >
              <div className="flex items-center gap-2 font-semibold text-red-400">
                <AlertTriangle size={15} />
                <span>API & Sistem Tanı Raporu</span>
              </div>
              <div className="whitespace-pre-wrap text-[12.5px] text-red-300/90 leading-relaxed font-sans">
                {block.text}
              </div>
            </div>
          );
        }

        if (block.type === 'code') {
          const codeId = `code-${idx}`;
          const isApplied = appliedId === codeId;
          const isCopied = copiedId === codeId;

          const lang = (block.language || '').toLowerCase().trim();
          const codeSnippet = (block.code || '').trim();
          const isTerminalCmd =
            ['bash', 'sh', 'shell', 'zsh', 'powershell', 'cmd', 'terminal'].includes(lang) ||
            /^(npm|pnpm|yarn|npx|git|python|pip|pytest|cargo|docker|deno|bun|cat|ls|cd|echo|curl|wget)\b/i.test(codeSnippet);

          return (
            <div
              key={idx}
              className="my-3.5 rounded-xl border border-[#242b3b] bg-[#090b10] overflow-hidden shadow-xl group transition-all hover:border-[#333d52]"
            >
              {/* Code Header Bar */}
              <div className="h-9 px-3.5 bg-[#121620] border-b border-[#202736] flex items-center justify-between select-none">
                <div className="flex items-center gap-2">
                  {isTerminalCmd ? (
                    <div className="w-5 h-5 rounded-md bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center">
                      <Terminal size={12} className="text-emerald-400" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-md bg-[#181d28] border border-[#2b3348] flex items-center justify-center">
                      <Code2 size={12} className="text-sky-400" />
                    </div>
                  )}
                  <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#94a3b8]">
                    {block.language || (isTerminalCmd ? 'terminal' : 'code')}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopy(block.code || '', codeId)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-[#94a3b8] hover:text-white hover:bg-white/[0.08] transition-all"
                    title="Kodu kopyala"
                  >
                    {isCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{isCopied ? 'Kopyalandı!' : 'Kopyala'}</span>
                  </button>

                  {isTerminalCmd ? (
                    <button
                      onClick={() => handleRunTerminal(block.code || '', codeId)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shadow-sm transition-all"
                      title="Komutu terminalde çalıştır"
                    >
                      {executedCmdId === codeId ? (
                        <CheckCircle2 size={12} className="text-emerald-400" />
                      ) : (
                        <Play size={11} fill="currentColor" />
                      )}
                      <span>{executedCmdId === codeId ? 'Çalıştırılıyor...' : 'Terminalde Çalıştır'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleApply(block.code || '', codeId, block.language || 'typescript')}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/40 shadow-sm transition-all"
                      title="Kodu aktif editöre aktar ve Diff incelemesi başlat"
                    >
                      {isApplied ? (
                        <CheckCircle2 size={12} className="text-emerald-400" />
                      ) : (
                        <FileCode size={12} />
                      )}
                      <span>{isApplied ? 'Aktarıldı' : 'Editöre Aktar'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Code Content */}
              <div className="p-3.5 overflow-x-auto font-mono text-[12.5px] leading-relaxed text-[#e2e8f0] bg-[#080a0e]">
                <pre className="m-0 p-0 font-mono select-text whitespace-pre">
                  <code>{block.code}</code>
                </pre>
              </div>
            </div>
          );
        }

        // Render plain Markdown paragraphs / headers / lists
        return (
          <div key={idx} className="whitespace-pre-wrap leading-relaxed space-y-2 select-text">
            {block.text?.split('\n\n').map((paragraph, pIdx) => {
              if (paragraph.startsWith('## ')) {
                return (
                  <h2
                    key={pIdx}
                    className="text-[15.5px] font-bold text-white tracking-tight mt-3 mb-1.5 border-b border-[#202636] pb-1.5 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-4 rounded-full bg-sky-400 inline-block mr-0.5" />
                    <span>{paragraph.replace(/^##\s*/, '')}</span>
                  </h2>
                );
              }
              if (paragraph.startsWith('### ')) {
                return (
                  <h3
                    key={pIdx}
                    className="text-[13.5px] font-semibold text-[#f1f5f9] tracking-tight mt-2.5 mb-1 flex items-center gap-1.5"
                  >
                    <span className="w-1 h-3 rounded-full bg-purple-400 inline-block mr-0.5" />
                    <span>{paragraph.replace(/^###\s*/, '')}</span>
                  </h3>
                );
              }
              return (
                <p key={pIdx} className="leading-relaxed text-[#cbd5e1]">
                  {paragraph}
                </p>
              );
            })}
          </div>
        );
      })}

      {/* Streaming pulse cursor */}
      {isStreaming && (
        <span className="inline-block w-2 h-4 ml-1 bg-sky-400 rounded-sm animate-pulse align-middle" />
      )}
    </div>
  );
};
