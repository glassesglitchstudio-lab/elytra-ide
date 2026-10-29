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

  // Default to collapsed (Thought Process >) matching Elytra design
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
      const text = currentTextLines.join('\n').trim();
      if (text) {
        // Detect native search indicator
        if (text.startsWith('🔍 Web Arama:') || text.startsWith('🌐 Canlı Arama Sonuçları:')) {
          blocks.push({ type: 'search', text });
        } else if (text.startsWith('❌') || text.toLowerCase().includes('hata:')) {
          blocks.push({ type: 'error', text });
        } else {
          blocks.push({ type: 'text', text });
        }
      }
      currentTextLines = [];
    }
  };

  const flushCode = () => {
    if (inCodeBlock && currentCodeLines.length > 0) {
      blocks.push({
        type: 'code',
        language: currentLanguage || 'plaintext',
        code: currentCodeLines.join('\n'),
      });
      currentCodeLines = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        // Code block start
        flushText();
        inCodeBlock = true;
        currentLanguage = line.slice(3).trim();
        currentCodeLines = [];
      } else {
        // Code block end
        flushCode();
        inCodeBlock = false;
        currentLanguage = '';
      }
    } else if (inCodeBlock) {
      currentCodeLines.push(line);
    } else {
      currentTextLines.push(line);
    }
  }

  flushCode();
  flushText();

  // Helper to render bold, italic, inline code, and links in text
  const renderFormattedText = (rawText: string) => {
    // Process markdown headings
    if (rawText.startsWith('### ')) {
      return (
        <h3 className="text-[14px] font-semibold text-white tracking-tight mt-3 mb-1.5 flex items-center gap-1.5">
          <Sparkles size={13} className="text-sky-400" />
          <span>{rawText.slice(4)}</span>
        </h3>
      );
    }
    if (rawText.startsWith('## ')) {
      return (
        <h2 className="text-[15px] font-bold text-white tracking-tight mt-4 mb-2 pb-1 border-b border-[#1b2234]">
          {rawText.slice(3)}
        </h2>
      );
    }
    if (rawText.startsWith('# ')) {
      return (
        <h1 className="text-[17px] font-bold text-white tracking-tight mt-4 mb-2 pb-1.5 border-b border-[#20283c]">
          {rawText.slice(2)}
        </h1>
      );
    }

    // Split paragraphs
    const paragraphs = rawText.split('\n\n');

    return (
      <div className="space-y-2.5">
        {paragraphs.map((p, pIdx) => {
          // Bullet point lists
          if (p.startsWith('- ') || p.startsWith('* ')) {
            const items = p.split('\n').filter((l) => l.trim().length > 0);
            return (
              <ul key={pIdx} className="space-y-1.5 my-2 pl-4 list-disc list-outside text-[#cbd5e1]">
                {items.map((item, iIdx) => (
                  <li key={iIdx} className="leading-relaxed">
                    {parseInlineMarkup(item.replace(/^[-*]\s+/, ''))}
                  </li>
                ))}
              </ul>
            );
          }

          // Numbered lists
          if (/^\d+\.\s/.test(p)) {
            const items = p.split('\n').filter((l) => l.trim().length > 0);
            return (
              <ol key={pIdx} className="space-y-1.5 my-2 pl-4 list-decimal list-outside text-[#cbd5e1]">
                {items.map((item, iIdx) => (
                  <li key={iIdx} className="leading-relaxed">
                    {parseInlineMarkup(item.replace(/^\d+\.\s+/, ''))}
                  </li>
                ))}
              </ol>
            );
          }

          return (
            <p key={pIdx} className="leading-relaxed text-[#e2e8f0]">
              {parseInlineMarkup(p)}
            </p>
          );
        })}
      </div>
    );
  };

  const parseInlineMarkup = (text: string) => {
    // Split by inline code `...`
    const parts = text.split(/(`[^`]+`)/g);

    return parts.map((part, idx) => {
      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        return (
          <code
            key={idx}
            className="px-1.5 py-0.5 rounded-md bg-[#121624] border border-[#232d42] text-sky-300 font-mono text-[12px] select-text"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      // Strong / Bold **...**
      const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
      return boldParts.map((bPart, bIdx) => {
        if (bPart.startsWith('**') && bPart.endsWith('**') && bPart.length > 4) {
          return (
            <strong key={bIdx} className="font-semibold text-white">
              {bPart.slice(2, -2)}
            </strong>
          );
        }
        return bPart;
      });
    });
  };

  return (
    <div className="space-y-3 leading-relaxed text-[#e2e8f0] text-[13.5px]">
      {/* Sleek Thought Process Accordion (Elytra Design System) */}
      {thoughtContent && (
        <div className="mb-3.5 select-none font-sans">
          <button
            onClick={() => setIsThoughtOpen(!isThoughtOpen)}
            className="inline-flex items-center gap-2 py-1.5 px-3 rounded-xl text-[12.5px] font-medium text-[#94a3b8] hover:text-white bg-[#0e121c] hover:bg-[#141a29] border border-[#202738] hover:border-sky-500/30 shadow-sm transition-all cursor-pointer group"
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
            <div className="mt-2.5 p-3.5 rounded-2xl bg-[#0a0c14]/95 border border-[#1b2234] text-[12px] leading-relaxed text-[#94a3b8] space-y-2 select-text font-mono animate-fadeIn shadow-inner">
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
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-[#0e1424] border border-sky-500/35 text-[12.5px] font-mono my-2.5 shadow-lg select-none animate-fadeIn"
            >
              <div className="w-6 h-6 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 flex-shrink-0">
                <Globe size={13} />
              </div>
              <span className="text-sky-300 font-medium truncate flex-1">{block.text}</span>
            </div>
          );
        }

        if (block.type === 'error') {
          return (
            <div
              key={idx}
              className="flex items-center gap-2.5 p-3 rounded-2xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-[12.5px] my-2 animate-fadeIn"
            >
              <AlertTriangle size={15} className="text-rose-400 flex-shrink-0" />
              <span>{block.text}</span>
            </div>
          );
        }

        if (block.type === 'code') {
          const codeText = block.code || '';
          const lang = block.language || 'plaintext';
          const blockId = `code-${idx}-${lang}`;
          const isShell = ['bash', 'sh', 'shell', 'zsh', 'terminal', 'powershell', 'cmd'].includes(
            lang.toLowerCase()
          );

          return (
            <div
              key={idx}
              className="my-3 rounded-2xl overflow-hidden border border-[#1b2234] bg-[#080a0f] shadow-xl group"
            >
              {/* Code Header Bar */}
              <div className="h-8 px-3.5 bg-[#0e121c] border-b border-[#181d2a] flex items-center justify-between select-none text-[11px] text-[#7e8b9f]">
                <div className="flex items-center gap-2 font-mono">
                  {isShell ? (
                    <Terminal size={12} className="text-sky-400" />
                  ) : (
                    <Code2 size={12} className="text-emerald-400" />
                  )}
                  <span className="uppercase text-[#94a3b8] font-medium tracking-wide">
                    {lang || 'code'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Run in Terminal Button (for shell commands) */}
                  {isShell && (
                    <button
                      onClick={() => handleRunTerminal(codeText, blockId)}
                      className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10.5px] font-medium transition-colors ${
                        executedCmdId === blockId
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50'
                          : 'hover:bg-[#1a2134] text-[#cbd5e1] hover:text-white border border-[#232d42]'
                      }`}
                      title="Run in Integrated Terminal"
                    >
                      {executedCmdId === blockId ? (
                        <>
                          <Check size={11} strokeWidth={2.5} />
                          <span>Çalıştırıldı</span>
                        </>
                      ) : (
                        <>
                          <Play size={10} fill="currentColor" />
                          <span>Terminalde Çalıştır</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Apply to File Button (for source files) */}
                  {!isShell && (
                    <button
                      onClick={() => handleApply(codeText, blockId, lang)}
                      className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10.5px] font-medium transition-all ${
                        appliedId === blockId
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50'
                          : 'hover:bg-sky-950/60 text-sky-300 hover:text-white border border-sky-800/40'
                      }`}
                      title="Apply this code to active open editor"
                    >
                      {appliedId === blockId ? (
                        <>
                          <Check size={11} strokeWidth={2.5} />
                          <span>Uygulandı!</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={11} className="text-sky-400" />
                          <span>Dosyaya Uygula</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Copy Button */}
                  <button
                    onClick={() => handleCopy(codeText, blockId)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10.5px] text-[#7e8b9f] hover:text-white hover:bg-[#182032] transition-colors"
                    title="Kodu Kopyala"
                  >
                    {copiedId === blockId ? (
                      <>
                        <Check size={11} strokeWidth={2.5} className="text-emerald-400" />
                        <span className="text-emerald-400">Kopyalandı</span>
                      </>
                    ) : (
                      <>
                        <Copy size={11} />
                        <span>Kopyala</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Code Body */}
              <div className="p-3.5 overflow-x-auto text-[12.5px] font-mono leading-relaxed bg-[#07090e] text-[#f1f5f9] select-text">
                <pre>
                  <code>{codeText}</code>
                </pre>
              </div>
            </div>
          );
        }

        // Standard Text Block
        return <div key={idx}>{renderFormattedText(block.text || '')}</div>;
      })}

      {/* Streaming pulse cursor */}
      {isStreaming && (
        <span className="inline-block w-2 h-4 ml-1 bg-sky-400 rounded-sm animate-pulse align-middle" />
      )}
    </div>
  );
};
