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

    // Web Search / Browsing pattern
    if (line.match(/^[>\[]\s*(?:\u{1F310}\s*)?(?:Web Search|Search|Browsing|Ara|Web Research|Web)/iu)) {
      flushText();
      blocks.push({
        type: 'search',
        text: line.replace(/^[>\[]\s*/, '').replace(/[\]]$/, '').replace(/^[\u{1F310}\s]+/, ''),
      });
      continue;
    }

    // Tool call pattern: [Tool: ...] or > [Tool Execution: ...]
    if (line.match(/^[>\[]\s*(?:\u{26A1}\s*)?(?:\**Tool|\[Tool|\**Execution)/iu)) {
      flushText();
      blocks.push({
        type: 'tool',
        text: line.replace(/^[>\[]\s*/, '').replace(/[\]]$/, '').replace(/^[\u{26A1}\s]+/, ''),
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
    <div className="space-y-3 leading-relaxed text-[#e5e5e5] text-[13.5px]">
      {/* Sleek Minimalist Thought Process Accordion (Cursor / Claude / Antigravity Style) */}
      {thoughtContent && (
        <div className="mb-3.5 select-none font-sans">
          <button
            onClick={() => setIsThoughtOpen(!isThoughtOpen)}
            className="inline-flex items-center gap-2 py-1 px-2.5 -ml-1 rounded-lg text-[13px] font-medium text-[#93a0b3] hover:text-[#e2e8f0] hover:bg-white/[0.05] transition-all cursor-pointer group"
          >
            <Brain
              size={15}
              className={`text-[#8896aa] group-hover:text-sky-400 transition-colors ${
                isCurrentlyThinking ? 'animate-pulse text-sky-400' : ''
              }`}
            />
            <span className="tracking-tight text-[#94a3b8] group-hover:text-[#e2e8f0]">
              Thought Process
            </span>
            {isCurrentlyThinking && (
              <span className="flex items-center gap-1 text-[11px] text-sky-400/90 font-mono font-normal">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                <span>(Thinking...)</span>
              </span>
            )}
            <span className="text-[#64748b] group-hover:text-[#94a3b8] transition-transform">
              {isThoughtOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
          </button>

          {/* Smooth Collapsible Content with Soft Gray Text */}
          {isThoughtOpen && (
            <div className="mt-2 pl-3.5 ml-1 border-l-2 border-[#2b3240] text-[12.5px] leading-relaxed text-[#8f9cae] space-y-2 select-text font-sans animate-fadeIn">
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
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#11141c] border border-[#202736] text-[12px] text-[#93a0b3] font-mono my-2 select-none"
            >
              <Globe size={13} className="text-sky-400" />
              <span className="flex-1 truncate">{block.text}</span>
              <span className="text-[10px] text-sky-400 font-medium px-1.5 py-0.5 bg-sky-950/40 rounded border border-sky-800/40">
                Web Research
              </span>
            </div>
          );
        }

        if (block.type === 'tool') {
          return (
            <div
              key={idx}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141414] border border-[#242424] text-[12px] text-[#a0a0a0] font-mono my-2 select-none"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <Terminal size={13} className="text-emerald-400" />
              <span className="flex-1 truncate">{block.text}</span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium px-1.5 py-0.5 bg-emerald-950/40 rounded border border-emerald-800/40">
                <Check size={11} />
                <span>Done</span>
              </span>
            </div>
          );
        }

        if (block.type === 'error') {
          return (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-red-950/20 border border-red-800/40 text-red-200 text-[13px] my-3 space-y-1.5"
            >
              <div className="flex items-center gap-2 font-medium text-red-400">
                <AlertTriangle size={15} />
                <span>API & Runtime Diagnostic</span>
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

          return (
            <div
              key={idx}
              className="my-3.5 rounded-xl border border-[#242424] bg-[#0c0c0c] overflow-hidden shadow-lg group"
            >
              {/* Code Header Bar */}
              {(() => {
                const lang = (block.language || '').toLowerCase().trim();
                const codeSnippet = (block.code || '').trim();
                const isTerminalCmd =
                  ['bash', 'sh', 'shell', 'zsh', 'powershell', 'cmd', 'terminal'].includes(lang) ||
                  /^(npm|pnpm|yarn|npx|git|python|pip|pytest|cargo|docker|deno|bun|cat|ls|cd|echo|curl|wget)\b/i.test(codeSnippet);

                return (
                  <div className="h-8 px-3.5 bg-[#141414] border-b border-[#222222] flex items-center justify-between select-none">
                    <div className="flex items-center gap-2">
                      {isTerminalCmd ? (
                        <Terminal size={13} className="text-emerald-400" />
                      ) : (
                        <Code2 size={13} className="text-[#888888]" />
                      )}
                      <span className="text-[11px] font-mono uppercase tracking-wider text-[#999999]">
                        {block.language || (isTerminalCmd ? 'terminal' : 'code')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopy(block.code || '', codeId)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-[#888888] hover:text-[#e5e5e5] hover:bg-[#222222] transition-colors"
                        title="Copy code to clipboard"
                      >
                        {isCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                      </button>

                      {isTerminalCmd ? (
                        <button
                          onClick={() => handleRunTerminal(block.code || '', codeId)}
                          className="flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-medium bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition-colors"
                          title="Run this command directly in the integrated terminal"
                        >
                          {executedCmdId === codeId ? (
                            <CheckCircle2 size={12} className="text-emerald-400" />
                          ) : (
                            <Play size={11} fill="currentColor" />
                          )}
                          <span>{executedCmdId === codeId ? 'Running in Terminal...' : 'Run in Terminal'}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApply(block.code || '', codeId, block.language || 'typescript')}
                          className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-sky-400 hover:text-sky-300 hover:bg-[#1a2333] transition-colors border border-sky-900/40"
                          title="Apply code into active editor tab with Diff Review"
                        >
                          {isApplied ? (
                            <CheckCircle2 size={12} className="text-emerald-400" />
                          ) : (
                            <FileCode size={12} />
                          )}
                          <span>{isApplied ? 'Applied' : 'Apply to Editor'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Code Content */}
              <div className="p-3.5 overflow-x-auto font-mono text-[12.5px] leading-relaxed text-[#d4d4d4] bg-[#0a0a0a]">
                <pre className="m-0 p-0 font-mono select-text whitespace-pre">
                  <code>{block.code}</code>
                </pre>
              </div>
            </div>
          );
        }

        // Render plain Markdown paragraphs / headers
        return (
          <div key={idx} className="whitespace-pre-wrap leading-relaxed space-y-2 select-text">
            {block.text?.split('\n\n').map((paragraph, pIdx) => {
              if (paragraph.startsWith('## ')) {
                return (
                  <h2
                    key={pIdx}
                    className="text-[16px] font-semibold text-[#f0f0f0] tracking-tight mt-3 mb-1 border-b border-[#222222] pb-1 flex items-center gap-2"
                  >
                    {paragraph.replace(/^##\s*/, '')}
                  </h2>
                );
              }
              if (paragraph.startsWith('### ')) {
                return (
                  <h3
                    key={pIdx}
                    className="text-[14px] font-semibold text-[#e5e5e5] tracking-tight mt-2 mb-0.5"
                  >
                    {paragraph.replace(/^###\s*/, '')}
                  </h3>
                );
              }
              return (
                <p key={pIdx} className="leading-relaxed text-[#cccccc]">
                  {paragraph}
                </p>
              );
            })}
          </div>
        );
      })}

      {/* Streaming pulse cursor */}
      {isStreaming && (
        <span className="inline-block w-1.5 h-4 ml-1 bg-sky-400 animate-pulse align-middle" />
      )}
    </div>
  );
};
