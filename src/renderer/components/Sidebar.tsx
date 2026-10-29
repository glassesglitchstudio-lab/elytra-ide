import React, { useState } from 'react';
import {
  Folder,
  FolderPlus,
  Plus,
  RefreshCw,
  Search,
  GitBranch,
  GitCommit,
  ArrowUp,
  ArrowDown,
  Check,
  FileCode,
  Trash2,
  X,
  Clock,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useElythraStore } from '../store/useElythraStore';
import { FileTree } from './FileTree';

export const Sidebar: React.FC = () => {
  const {
    sidebarTab,
    setSidebarTab,
    sidebarWidth,
    projects,
    openProject,
    activeProject,
    fileTree,
    refreshFileTree,
    openTabs,
    activeTabPath,
    openFileTab,
    closeFileTab,
    conversations,
    activeConversationId,
    selectConversation,
    deleteConversation,
    startNewConversation,
    gitStatus,
    refreshGitStatus,
    stageFile,
    unstageFile,
    commitGitChanges,
    pushGitChanges,
    pullGitChanges,
    searchQuery,
    searchResults,
    isSearching,
    performSearch,
    setSearchQuery,
    setActiveView,
  } = useElythraStore();

  const [commitMsg, setCommitMsg] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);
  const [gitOutput, setGitOutput] = useState<string | null>(null);
  const [searchWord, setSearchWord] = useState('');
  const [sessionFilter, setSessionFilter] = useState('');

  const handleAddNewProject = async () => {
    if (!window.elythraAPI) return;
    const folder = await window.elythraAPI.openDirectoryDialog();
    if (folder) {
      await openProject(folder);
    }
  };

  const handleCommit = async () => {
    if (!commitMsg.trim() || isCommitting) return;
    setIsCommitting(true);
    const ok = await commitGitChanges(commitMsg);
    setIsCommitting(false);
    if (ok) {
      setCommitMsg('');
    }
  };

  const handlePush = async () => {
    const res = await pushGitChanges();
    setGitOutput(res);
    setTimeout(() => setGitOutput(null), 3000);
  };

  const handlePull = async () => {
    const res = await pullGitChanges();
    setGitOutput(res);
    setTimeout(() => setGitOutput(null), 3000);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchWord);
  };

  return (
    <aside
      style={{ width: `${sidebarWidth}px` }}
      className="h-full bg-[#07090e] border-r border-[#181d2a] flex flex-col select-none relative z-20 flex-shrink-0"
    >
      {/* 1. EXPLORER TAB */}
      {sidebarTab === 'explorer' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="h-9 px-3.5 border-b border-[#181d2a] flex items-center justify-between bg-[#0a0d14]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7e8b9f]">
              Explorer
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={refreshFileTree}
                className="p-1 text-[#7e8b9f] hover:text-[#f1f5f9] rounded-lg hover:bg-[#141926] transition-colors"
                title="Refresh File Tree"
              >
                <RefreshCw size={13} />
              </button>
              <button
                onClick={handleAddNewProject}
                className="p-1 text-[#7e8b9f] hover:text-[#f1f5f9] rounded-lg hover:bg-[#141926] transition-colors"
                title="Open Folder..."
              >
                <FolderPlus size={13} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Open Editors Section */}
            {openTabs.length > 0 && (
              <div className="border-b border-[#181d2a] pb-1">
                <div className="px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#5a6578]">
                  Open Editors ({openTabs.length})
                </div>
                {openTabs.map((tab) => (
                  <div
                    key={tab.path}
                    onClick={() => {
                      openFileTab(tab.path);
                      setActiveView('editor');
                    }}
                    className={`flex items-center justify-between px-3.5 py-1.5 text-[12px] cursor-pointer group transition-colors ${
                      activeTabPath === tab.path
                        ? 'bg-[#121724] text-white font-medium border-l-2 border-sky-400'
                        : 'text-[#8b95a5] hover:text-[#f1f5f9] hover:bg-[#0e121c]'
                    }`}
                  >
                    <span className="truncate flex-1">{tab.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeFileTab(tab.path);
                      }}
                      className="p-0.5 opacity-0 group-hover:opacity-100 hover:text-white rounded"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Project Folder & Tree */}
            {activeProject ? (
              <div className="p-1.5">
                <div className="px-2 py-1.5 text-[11px] font-semibold text-[#cbd5e1] flex items-center gap-1.5">
                  <Folder size={14} className="text-sky-400" />
                  <span className="truncate">{activeProject.name}</span>
                </div>
                <FileTree items={fileTree} />
              </div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-[12px] text-[#64748b] mb-3">No folder opened</p>
                <button
                  onClick={handleAddNewProject}
                  className="px-3.5 py-1.5 bg-[#121624] hover:bg-[#1a2134] border border-[#232d42] text-[#e2e8f0] text-[12px] font-medium rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-sm"
                >
                  <FolderPlus size={13} className="text-sky-400" />
                  <span>Open Folder</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. CHAT / SESSIONS TAB */}
      {sidebarTab === 'chat' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="h-9 px-3.5 border-b border-[#181d2a] flex items-center justify-between bg-[#0a0d14]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7e8b9f]">
              Sessions & Threads
            </span>
            <button
              onClick={() => {
                startNewConversation();
                setActiveView('studio');
              }}
              className="p-1 text-[#7e8b9f] hover:text-white rounded-lg hover:bg-[#141926] transition-colors flex items-center gap-1 text-[11px]"
              title="New Session"
            >
              <Plus size={13} />
              <span>New</span>
            </button>
          </div>

          <div className="p-2 border-b border-[#181d2a]">
            <input
              type="text"
              value={sessionFilter}
              onChange={(e) => setSessionFilter(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-[#0e121c] border border-[#202738] rounded-xl px-3 py-1.5 text-[12px] text-[#e2e8f0] placeholder-[#5a6578] focus:outline-none focus:border-sky-500/50 transition-colors"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-[#64748b] text-[12px]">
                No sessions yet. Start a new prompt!
              </div>
            ) : (
              conversations
                .filter((c) => c.title.toLowerCase().includes(sessionFilter.toLowerCase()))
                .map((convo) => (
                  <div
                    key={convo.id}
                    onClick={() => {
                      selectConversation(convo.id);
                      setActiveView('studio');
                    }}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer group transition-all ${
                      activeConversationId === convo.id
                        ? 'bg-[#141a29] border border-sky-500/35 text-white shadow-sm'
                        : 'text-[#8b95a5] hover:text-[#f1f5f9] hover:bg-[#0e121c] border border-transparent'
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="text-[12.5px] truncate font-medium">
                        {convo.title || 'Untitled Session'}
                      </div>
                      <div className="text-[10px] text-[#64748b] font-mono mt-0.5">
                        {convo.messages.length} messages · {new Date(convo.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(convo.id);
                      }}
                      className="p-1 opacity-0 group-hover:opacity-100 hover:text-rose-400 rounded transition-opacity"
                      title="Delete Thread"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* 3. SEARCH TAB */}
      {sidebarTab === 'search' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="h-9 px-3.5 border-b border-[#181d2a] flex items-center justify-between bg-[#0a0d14]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7e8b9f]">
              Search in Workspace
            </span>
          </div>

          <form onSubmit={handleSearchSubmit} className="p-2 border-b border-[#181d2a] space-y-1.5">
            <div className="relative">
              <input
                type="text"
                value={searchWord}
                onChange={(e) => setSearchWord(e.target.value)}
                placeholder="Search..."
                className="w-full bg-[#0e121c] border border-[#202738] rounded-xl pl-3 pr-8 py-1.5 text-[12px] text-[#e2e8f0] placeholder-[#5a6578] focus:outline-none focus:border-sky-500/50 transition-colors"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 text-[#7e8b9f] hover:text-white"
              >
                <Search size={13} />
              </button>
            </div>
          </form>

          <div className="flex-1 overflow-y-auto p-2">
            {isSearching ? (
              <div className="p-6 text-center text-[#64748b] text-[12px]">Searching files...</div>
            ) : searchResults.length === 0 ? (
              <div className="p-6 text-center text-[#64748b] text-[12px]">
                {searchWord ? 'No results found.' : 'Type query and press Enter.'}
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="px-2 py-1 text-[10px] text-[#64748b] font-mono">
                  {searchResults.length} matches found
                </div>
                {searchResults.map((r, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      if (activeProject) {
                        openFileTab(`${activeProject.path}/${r.file}`);
                        setActiveView('editor');
                      }
                    }}
                    className="p-2.5 rounded-xl bg-[#0e121c] hover:bg-[#141a29] border border-[#1d2436] hover:border-sky-500/30 cursor-pointer group transition-all text-[12px]"
                  >
                    <div className="text-[11px] font-medium text-sky-400 truncate">
                      {r.file}:{r.line}
                    </div>
                    <div className="text-[11px] font-mono text-[#94a3b8] truncate mt-0.5">
                      {r.text}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. SOURCE CONTROL (GIT) TAB */}
      {sidebarTab === 'git' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="h-9 px-3.5 border-b border-[#181d2a] flex items-center justify-between bg-[#0a0d14]">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7e8b9f]">
                Source Control
              </span>
              {gitStatus?.branch && (
                <span className="text-[10px] font-mono text-sky-400 px-1.5 py-0.2 bg-[#0e121c] border border-[#202738] rounded-full">
                  {gitStatus.branch}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handlePull}
                className="p-1 text-[#7e8b9f] hover:text-white rounded-lg hover:bg-[#141926]"
                title="Git Pull"
              >
                <ArrowDown size={13} />
              </button>
              <button
                onClick={handlePush}
                className="p-1 text-[#7e8b9f] hover:text-white rounded-lg hover:bg-[#141926]"
                title="Git Push"
              >
                <ArrowUp size={13} />
              </button>
              <button
                onClick={refreshGitStatus}
                className="p-1 text-[#7e8b9f] hover:text-white rounded-lg hover:bg-[#141926]"
                title="Refresh Status"
              >
                <RefreshCw size={13} />
              </button>
            </div>
          </div>

          {gitOutput && (
            <div className="p-2.5 bg-[#0e121c] border-b border-[#181d2a] text-[11px] font-mono text-sky-400">
              {gitOutput}
            </div>
          )}

          {/* Commit Message Box */}
          <div className="p-3 border-b border-[#181d2a] space-y-2">
            <textarea
              value={commitMsg}
              onChange={(e) => setCommitMsg(e.target.value)}
              placeholder="Commit message (Ctrl+Enter to commit)..."
              rows={2}
              className="w-full bg-[#0e121c] border border-[#202738] rounded-xl p-2.5 text-[12px] text-[#e2e8f0] placeholder-[#5a6578] focus:outline-none focus:border-sky-500/50 resize-none transition-colors"
            />
            <button
              onClick={handleCommit}
              disabled={!commitMsg.trim() || isCommitting}
              className={`w-full py-2 rounded-xl text-[12px] font-medium transition-all flex items-center justify-center gap-1.5 ${
                commitMsg.trim() && !isCommitting
                  ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-md'
                  : 'bg-[#121622] text-[#556070] cursor-not-allowed border border-[#1b2232]'
              }`}
            >
              <GitCommit size={13} />
              <span>{isCommitting ? 'Committing...' : 'Commit Changes'}</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-3">
            {/* Staged Changes */}
            {gitStatus?.staged && gitStatus.staged.length > 0 && (
              <div>
                <div className="text-[10px] font-semibold text-[#7e8b9f] uppercase tracking-wider mb-1 px-1">
                  Staged Changes ({gitStatus.staged.length})
                </div>
                <div className="space-y-0.5">
                  {gitStatus.staged.map((file) => (
                    <div
                      key={file}
                      className="flex items-center justify-between px-2.5 py-1 text-[12px] rounded-lg hover:bg-[#121724] group"
                    >
                      <span className="truncate flex-1 text-[#cbd5e1]">{file}</span>
                      <button
                        onClick={() => unstageFile(file)}
                        className="text-[11px] text-[#7e8b9f] hover:text-white px-1"
                        title="Unstage"
                      >
                        -
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modified & Untracked Changes */}
            <div>
              <div className="text-[10px] font-semibold text-[#7e8b9f] uppercase tracking-wider mb-1 px-1">
                Changes ({(gitStatus?.modified.length || 0) + (gitStatus?.untracked.length || 0)})
              </div>

              {(!gitStatus || (gitStatus.modified.length === 0 && gitStatus.untracked.length === 0)) ? (
                <div className="p-4 text-center text-[12px] text-[#64748b]">
                  Working tree clean. No changes detected.
                </div>
              ) : (
                <div className="space-y-0.5">
                  {gitStatus.modified.map((file) => (
                    <div
                      key={file}
                      className="flex items-center justify-between px-2.5 py-1 text-[12px] rounded-lg hover:bg-[#121724] group"
                    >
                      <span className="truncate flex-1 text-[#cbd5e1]">{file}</span>
                      <button
                        onClick={() => stageFile(file)}
                        className="text-[12px] text-sky-400 hover:text-sky-300 font-bold px-1"
                        title="Stage File"
                      >
                        +
                      </button>
                    </div>
                  ))}
                  {gitStatus.untracked.map((file) => (
                    <div
                      key={file}
                      className="flex items-center justify-between px-2.5 py-1 text-[12px] rounded-lg hover:bg-[#121724] group"
                    >
                      <span className="truncate flex-1 text-emerald-400">{file}</span>
                      <button
                        onClick={() => stageFile(file)}
                        className="text-[12px] text-emerald-400 hover:text-emerald-300 font-bold px-1"
                        title="Stage File"
                      >
                        +
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. HISTORY ARCHIVE TAB */}
      {sidebarTab === 'history' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="h-9 px-3.5 border-b border-[#181d2a] flex items-center justify-between bg-[#0a0d14]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7e8b9f]">
              Conversation Archive
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-[#64748b] text-[12px]">No archives found.</div>
            ) : (
              conversations.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    selectConversation(c.id);
                    setActiveView('studio');
                  }}
                  className="p-3 rounded-xl bg-[#0e121c] hover:bg-[#141a29] border border-[#1d2436] hover:border-sky-500/30 cursor-pointer transition-all"
                >
                  <div className="text-[12.5px] font-medium text-[#f1f5f9] truncate">{c.title}</div>
                  <div className="text-[10px] text-[#64748b] font-mono mt-1 flex items-center justify-between">
                    <span>{c.messages.length} messages</span>
                    <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 6. AUTOMATIONS & CUSTOMIZATIONS */}
      {sidebarTab === 'automations' && (
        <div className="flex-1 p-4 text-[12px] text-[#8b95a5]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7e8b9f]">
            Automations & Watchers
          </span>
          <p className="mt-2 text-[11px] text-[#64748b] leading-relaxed">
            Automations execute commands on save, build, or timers. Configure rules in the main canvas.
          </p>
        </div>
      )}

      {sidebarTab === 'customizations' && (
        <div className="flex-1 p-4 text-[12px] text-[#8b95a5]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7e8b9f]">
            Customizations
          </span>
          <p className="mt-2 text-[11px] text-[#64748b] leading-relaxed">
            Define system personas, rules, and model parameters in the main workspace.
          </p>
        </div>
      )}

      {sidebarTab === 'plugins' && (
        <div className="flex-1 p-4 text-[12px] text-[#8b95a5]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-400">
            Plugins Marketplace
          </span>
          <p className="mt-2 text-[11px] text-[#64748b] leading-relaxed">
            Eklenti pazarından gerçek zamanlı Web Araştırması, Git Otomasyonu, UE5 C++ Asistanı ve Paket Güvenlik Denetçisi eklentilerini yönetin ve kullanın.
          </p>
        </div>
      )}
    </aside>
  );
};
