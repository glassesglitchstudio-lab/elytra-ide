import { create } from 'zustand';
import type {
  ProjectItem,
  Conversation,
  ChatMessage,
  FileItem,
  PermissionMode,
  ThinkingLevel,
  ElythraSettings,
  GitStatus,
  AutomationRule,
} from '../../types/elythra';

export interface EditorTab {
  path: string;
  name: string;
  content: string;
  isDirty: boolean;
  language: string;
}

export type SidebarTabType =
  | 'chat'
  | 'explorer'
  | 'search'
  | 'git'
  | 'automations'
  | 'customizations'
  | 'history';

export type ActiveViewType = 'studio' | 'editor';

interface ElythraStore {
  // Navigation & Layout
  activeProject: ProjectItem | null;
  sidebarTab: SidebarTabType;
  activeView: ActiveViewType;
  isSidebarOpen: boolean;
  sidebarWidth: number;
  isTerminalOpen: boolean;
  terminalHeight: number;
  isAIPanelOpen: boolean;
  aiPanelWidth: number;
  activeModal: 'settings' | 'command-palette' | 'quick-open' | null;

  // Conversations & AI
  conversations: Conversation[];
  activeConversationId: string | null;
  permissionMode: PermissionMode;
  selectedModel: string;
  thinkingLevel: ThinkingLevel;
  isGenerating: boolean;
  streamingContent: string;

  // Projects & Files
  projects: ProjectItem[];
  fileTree: FileItem[];
  openTabs: EditorTab[];
  activeTabPath: string | null;

  // Git & Search & Automations
  gitStatus: GitStatus | null;
  searchQuery: string;
  searchResults: Array<{ file: string; line: number; text: string }>;
  isSearching: boolean;
  automations: AutomationRule[];
  settings: ElythraSettings;

  // Navigation & UI Actions
  init: () => Promise<void>;
  setSidebarTab: (tab: SidebarTabType) => void;
  setActiveView: (view: ActiveViewType) => void;
  toggleSidebar: () => void;
  setSidebarWidth: (w: number) => void;
  toggleTerminal: () => void;
  setTerminalHeight: (h: number) => void;
  toggleAIPanel: () => void;
  setAIPanelWidth: (w: number) => void;
  setActiveModal: (m: 'settings' | 'command-palette' | 'quick-open' | null) => void;

  setPermissionMode: (m: PermissionMode) => void;
  setSelectedModel: (m: string) => void;
  setThinkingLevel: (lvl: ThinkingLevel) => void;

  // Project & File Actions
  openProject: (projectPath: string) => Promise<void>;
  closeProject: () => void;
  refreshFileTree: () => Promise<void>;
  openFileTab: (filePath: string) => Promise<void>;
  closeFileTab: (filePath: string) => void;
  updateTabContent: (filePath: string, content: string) => void;
  saveActiveTab: () => Promise<void>;
  saveAllTabs: () => Promise<void>;
  applyCodeToFile: (code: string, lang?: string) => Promise<void>;
  runInTerminal: (cmd: string) => void;
  activeDiff: { path: string; name: string; original: string; modified: string } | null;
  acceptDiff: () => Promise<void>;
  rejectDiff: () => void;

  // Git Actions
  refreshGitStatus: () => Promise<void>;
  stageFile: (file: string) => Promise<void>;
  unstageFile: (file: string) => Promise<void>;
  commitGitChanges: (msg: string) => Promise<boolean>;
  pushGitChanges: () => Promise<string>;
  pullGitChanges: () => Promise<string>;

  // Search Actions
  setSearchQuery: (q: string) => void;
  performSearch: (query: string) => Promise<void>;

  // Chat Actions
  startNewConversation: () => void;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  sendMessage: (text: string) => Promise<void>;

  // Settings & Automations
  updateSettings: (newSettings: Partial<ElythraSettings>) => Promise<void>;
  updateAutomations: (newRules: AutomationRule[]) => Promise<void>;
}

const defaultSettings: ElythraSettings = {
  apiKeys: {},
  defaultModel: 'Nemotron 3.5 Lightning',
  thinkingLevel: 'High',
  fontSize: 14,
  fontFamily: 'Inter',
  autoSave: true,
  terminalShell: 'powershell.exe',
  systemInstructions: 'You are Elythra Code, an expert autonomous AI pair programmer and software engineer.',
};

function getLanguageFromExt(ext?: string): string {
  switch (ext?.toLowerCase()) {
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'py':
      return 'python';
    case 'json':
      return 'json';
    case 'html':
      return 'html';
    case 'css':
      return 'css';
    case 'md':
      return 'markdown';
    case 'rs':
      return 'rust';
    case 'go':
      return 'go';
    case 'c':
    case 'cpp':
    case 'h':
      return 'cpp';
    default:
      return 'plaintext';
  }
}

// In-browser mock fallback to ensure 100% functionality even when previewed without electron
function ensureApiPolyfill() {
  if (typeof window === 'undefined' || (window as any).elythraAPI) return;

  const mockStorage: Record<string, any> = {
    settings: defaultSettings,
    projects: [
      { id: 'proj-1', name: 'elytra-ide', path: 'c:/Users/ErCuM/CascadeProjects/elytra-ide', lastOpened: Date.now(), conversationsCount: 3 }
    ],
    conversations: [],
    automations: []
  };

  (window as any).elythraAPI = {
    windowMinimize: async () => {},
    windowMaximize: async () => {},
    windowClose: async () => {},
    windowIsMaximized: async () => false,
    openDirectoryDialog: async () => 'c:/Users/ErCuM/CascadeProjects/elytra-ide',
    openFileDialog: async () => 'c:/Users/ErCuM/CascadeProjects/elytra-ide/src/App.tsx',
    readDirectory: async () => [
      { name: 'src', path: 'c:/Users/ErCuM/CascadeProjects/elytra-ide/src', isDirectory: true },
      { name: 'package.json', path: 'c:/Users/ErCuM/CascadeProjects/elytra-ide/package.json', isDirectory: false, extension: 'json' },
      { name: 'README.md', path: 'c:/Users/ErCuM/CascadeProjects/elytra-ide/README.md', isDirectory: false, extension: 'md' },
    ],
    readFile: async () => '// Elythra Code Workspace\nconsole.log("Ready");',
    writeFile: async () => true,
    createFile: async () => true,
    createDirectory: async () => true,
    deletePath: async () => true,
    renamePath: async () => true,
    watchDirectory: async () => {},
    onFileChanged: () => () => {},
    terminalCreate: async () => true,
    terminalWrite: async () => {},
    terminalResize: async () => {},
    terminalKill: async () => {},
    onTerminalData: () => () => {},
    gitStatus: async () => ({ isRepo: true, branch: 'main', clean: true, modified: [], staged: [], untracked: [], ahead: 0, behind: 0 }),
    gitDiff: async () => '',
    gitStage: async () => true,
    gitUnstage: async () => true,
    gitCommit: async () => true,
    gitBranchList: async () => ['main'],
    gitCheckout: async () => true,
    gitPull: async () => ({ success: true, output: 'Already up to date.' }),
    gitPush: async () => ({ success: true, output: 'Everything up-to-date.' }),
    searchInFiles: async () => [],
    getSettings: async () => mockStorage.settings,
    saveSettings: async (s: any) => { mockStorage.settings = s; return true; },
    getProjects: async () => mockStorage.projects,
    saveProjects: async (p: any) => { mockStorage.projects = p; return true; },
    getConversations: async () => mockStorage.conversations,
    saveConversations: async (c: any) => { mockStorage.conversations = c; return true; },
    getAutomations: async () => mockStorage.automations,
    saveAutomations: async (a: any) => { mockStorage.automations = a; return true; },
    sendAIChat: async (params: any) => {
      setTimeout(() => {
        const text = `### Thought Process (High Reasoning Budget · 0.9s)\n- [Analiz]: Kullanıcı komutu incelendi: "${params.messages[params.messages.length - 1]?.content || ''}"\n- [Çalışma Alanı]: Çalışma alanı yapılandırması kontrol edildi.\n- [Çözüm]: Çözüm üretiliyor.\n\n> [Tool Execution: scan_workspace] -> Tamamlandı\n\n## Elythra Code Çözüm Önerisi\n\n\`\`\`typescript\n// Örnek Kod\nexport function runStudio() {\n  console.log("Elythra Studio Aktif");\n}\n\`\`\`\n`;
        (window as any)._streamCallback?.({ chunk: text });
        (window as any)._streamCallback?.({ done: true });
      }, 500);
    },
    onAIStreamChunk: (cb: any) => {
      (window as any)._streamCallback = cb;
      return () => { (window as any)._streamCallback = null; };
    }
  };
}

export const useElythraStore = create<ElythraStore>((set, get) => ({
  activeProject: null,
  sidebarTab: 'chat',
  activeView: 'studio',
  isSidebarOpen: true,
  sidebarWidth: 280,
  isTerminalOpen: false,
  terminalHeight: 220,
  isAIPanelOpen: true,
  aiPanelWidth: 380,
  activeModal: null,

  conversations: [],
  activeConversationId: null,
  permissionMode: 'Default',
  selectedModel: 'Nemotron 3.5 Lightning',
  thinkingLevel: 'High',
  isGenerating: false,
  streamingContent: '',

  projects: [],
  fileTree: [],
  openTabs: [],
  activeTabPath: null,

  gitStatus: null,
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  automations: [],
  settings: defaultSettings,

  init: async () => {
    ensureApiPolyfill();

    if (!window.elythraAPI) return;

    try {
      const [settings, projects, convos, autos] = await Promise.all([
        window.elythraAPI.getSettings(),
        window.elythraAPI.getProjects(),
        window.elythraAPI.getConversations(),
        window.elythraAPI.getAutomations(),
      ]);

      set({
        settings: settings || defaultSettings,
        selectedModel: settings?.defaultModel || 'Nemotron 3.5 Lightning',
        thinkingLevel: settings?.thinkingLevel || 'High',
        projects: projects || [],
        conversations: convos || [],
        automations: autos && autos.length > 0 ? autos : get().automations,
      });

      // Stream Listener with Instant Error Surfacing & Accumulator Buffer
      let streamBuffer = '';
      window.elythraAPI.onAIStreamChunk((data) => {
        if (data.chunk) {
          streamBuffer += data.chunk;
          set((s) => ({ streamingContent: s.streamingContent + data.chunk }));
        }
        if (data.done) {
          const { activeConversationId, conversations } = get();
          const finalContent = streamBuffer || get().streamingContent;
          streamBuffer = '';
          if (activeConversationId && finalContent) {
            const assistantMsg: ChatMessage = {
              id: String(Date.now()),
              role: 'assistant',
              content: finalContent,
              timestamp: Date.now(),
              model: get().selectedModel,
            };
            const updated = conversations.map((c) =>
              c.id === activeConversationId
                ? { ...c, messages: [...c.messages, assistantMsg], updatedAt: Date.now() }
                : c
            );
            set({ conversations: updated, isGenerating: false, streamingContent: '' });
            window.elythraAPI?.saveConversations(updated);
          } else {
            set({ isGenerating: false, streamingContent: '' });
          }
        }
        if (data.error) {
          streamBuffer = '';
          const { activeConversationId, conversations } = get();
          const errorMsg: ChatMessage = {
            id: String(Date.now()),
            role: 'assistant',
            content: `API / Baglanti Hatasi:\n${data.error}\n\nLutfen Ayarlar panelinden model seciminizi veya API anahtarinizi kontrol edin.`,
            timestamp: Date.now(),
            model: get().selectedModel,
          };
          if (activeConversationId) {
            const updated = conversations.map((c) =>
              c.id === activeConversationId
                ? { ...c, messages: [...c.messages, errorMsg], updatedAt: Date.now() }
                : c
            );
            set({ conversations: updated, isGenerating: false, streamingContent: '' });
            window.elythraAPI?.saveConversations(updated);
          } else {
            set({ isGenerating: false, streamingContent: '' });
          }
        }
      });

      // Listen for file change watcher
      window.elythraAPI.onFileChanged(() => {
        get().refreshFileTree();
        get().refreshGitStatus();
      });
    } catch (err) {
      console.error('Init error:', err);
    }
  },

  setSidebarTab: (tab) => set({ sidebarTab: tab }),
  setActiveView: (view) => set({ activeView: view }),
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  setSidebarWidth: (w) => set({ sidebarWidth: Math.max(220, Math.min(600, w)) }),
  toggleTerminal: () => set((s) => ({ isTerminalOpen: !s.isTerminalOpen })),
  setTerminalHeight: (h) => set({ terminalHeight: Math.max(120, Math.min(500, h)) }),
  toggleAIPanel: () => set((s) => ({ isAIPanelOpen: !s.isAIPanelOpen })),
  setAIPanelWidth: (w) => set({ aiPanelWidth: Math.max(280, Math.min(600, w)) }),
  setActiveModal: (m) => set({ activeModal: m }),

  setPermissionMode: (m) => set({ permissionMode: m }),
  setSelectedModel: (m) => set({ selectedModel: m }),
  setThinkingLevel: (lvl) => set({ thinkingLevel: lvl }),

  openProject: async (projectPath: string) => {
    if (!window.elythraAPI) return;

    const folderName = projectPath.split(/[/\\]/).filter(Boolean).pop() || projectPath;
    const existingProjects = get().projects;
    const existing = existingProjects.find((p) => p.path === projectPath);

    const project: ProjectItem = existing
      ? { ...existing, lastOpened: Date.now() }
      : {
          id: String(Date.now()),
          name: folderName,
          path: projectPath,
          lastOpened: Date.now(),
          conversationsCount: 0,
        };

    const updatedProjects = [
      project,
      ...existingProjects.filter((p) => p.path !== projectPath),
    ];

    set({
      activeProject: project,
      projects: updatedProjects,
      sidebarTab: 'explorer',
      activeView: 'editor',
    });

    window.elythraAPI.saveProjects(updatedProjects);
    await window.elythraAPI.watchDirectory(projectPath);
    await get().refreshFileTree();
    await get().refreshGitStatus();
  },

  closeProject: () => {
    set({
      activeProject: null,
      fileTree: [],
      openTabs: [],
      activeTabPath: null,
      gitStatus: null,
      activeView: 'studio',
      sidebarTab: 'chat',
    });
  },

  refreshFileTree: async () => {
    const { activeProject } = get();
    if (!activeProject || !window.elythraAPI) return;
    const tree = await window.elythraAPI.readDirectory(activeProject.path);
    set({ fileTree: tree });
  },

  openFileTab: async (filePath: string) => {
    const { openTabs } = get();
    const existing = openTabs.find((t) => t.path === filePath);

    if (existing) {
      set({ activeTabPath: filePath, activeView: 'editor' });
      return;
    }

    if (!window.elythraAPI) return;
    try {
      const content = await window.elythraAPI.readFile(filePath);
      const name = filePath.split(/[/\\]/).pop() || filePath;
      const ext = name.split('.').pop();
      const language = getLanguageFromExt(ext);

      const newTab: EditorTab = {
        path: filePath,
        name,
        content,
        isDirty: false,
        language,
      };

      set({
        openTabs: [...openTabs, newTab],
        activeTabPath: filePath,
        activeView: 'editor',
      });
    } catch (err) {
      console.error('Failed to open file:', err);
    }
  },

  closeFileTab: (filePath: string) => {
    const { openTabs, activeTabPath } = get();
    const filtered = openTabs.filter((t) => t.path !== filePath);
    let nextActive = activeTabPath;

    if (activeTabPath === filePath) {
      nextActive = filtered.length > 0 ? filtered[filtered.length - 1].path : null;
    }

    set({ openTabs: filtered, activeTabPath: nextActive });
  },

  updateTabContent: (filePath: string, content: string) => {
    const { openTabs, settings } = get();
    const updated = openTabs.map((t) =>
      t.path === filePath ? { ...t, content, isDirty: true } : t
    );
    set({ openTabs: updated });

    if (settings.autoSave && window.elythraAPI) {
      window.elythraAPI.writeFile(filePath, content).then((ok) => {
        if (ok) {
          set((s) => ({
            openTabs: s.openTabs.map((t) =>
              t.path === filePath ? { ...t, isDirty: false } : t
            ),
          }));
        }
      });
    }
  },

  saveActiveTab: async () => {
    const { openTabs, activeTabPath } = get();
    if (!activeTabPath || !window.elythraAPI) return;

    const tab = openTabs.find((t) => t.path === activeTabPath);
    if (!tab) return;

    const ok = await window.elythraAPI.writeFile(tab.path, tab.content);
    if (ok) {
      set((s) => ({
        openTabs: s.openTabs.map((t) =>
          t.path === activeTabPath ? { ...t, isDirty: false } : t
        ),
      }));
    }
  },

  saveAllTabs: async () => {
    const { openTabs } = get();
    if (!window.elythraAPI) return;

    for (const tab of openTabs) {
      if (tab.isDirty) {
        await window.elythraAPI.writeFile(tab.path, tab.content);
      }
    }
    set((s) => ({
      openTabs: s.openTabs.map((t) => ({ ...t, isDirty: false })),
    }));
  },

  runInTerminal: (cmd: string) => {
    const { isTerminalOpen } = get();
    if (!isTerminalOpen) {
      set({ isTerminalOpen: true });
    }
    const cleanCmd = cmd.trim();
    if (window.elythraAPI && cleanCmd) {
      window.elythraAPI.terminalWrite('term-1', cleanCmd + '\r\n');
    }
  },

  activeDiff: null,

  applyCodeToFile: async (code: string, lang = 'typescript') => {
    const { openTabs, activeTabPath, activeProject } = get();

    if (activeTabPath) {
      const currentTab = openTabs.find((t) => t.path === activeTabPath);
      const original = currentTab ? currentTab.content : '';

      set({
        activeDiff: {
          path: activeTabPath,
          name: currentTab?.name || 'file',
          original,
          modified: code,
        },
      });

      get().updateTabContent(activeTabPath, code);
      return;
    }

    // No tab open: create scratch tab without forcing view away from studio/chat
    const ext = lang === 'python' ? 'py' : lang === 'json' ? 'json' : lang === 'html' ? 'html' : 'tsx';
    const scratchName = `snippet-${Date.now().toString().slice(-4)}.${ext}`;
    const scratchPath = activeProject ? `${activeProject.path}/${scratchName}` : scratchName;

    const newTab: EditorTab = {
      path: scratchPath,
      name: scratchName,
      content: code,
      isDirty: true,
      language: lang,
    };

    set({
      openTabs: [...openTabs, newTab],
      activeTabPath: scratchPath,
      activeDiff: {
        path: scratchPath,
        name: scratchName,
        original: '',
        modified: code,
      },
    });
  },

  acceptDiff: async () => {
    const { activeDiff, openTabs } = get();
    if (!activeDiff) return;
    const tab = openTabs.find((t) => t.path === activeDiff.path);
    if (tab && window.elythraAPI) {
      await window.elythraAPI.writeFile(tab.path, tab.content);
      set((s) => ({
        openTabs: s.openTabs.map((t) => (t.path === activeDiff.path ? { ...t, isDirty: false } : t)),
      }));
    }
    set({ activeDiff: null });
  },

  rejectDiff: () => {
    const { activeDiff } = get();
    if (!activeDiff) return;
    if (activeDiff.original === '') {
      get().closeFileTab(activeDiff.path);
    } else {
      get().updateTabContent(activeDiff.path, activeDiff.original);
    }
    set({ activeDiff: null });
  },

  refreshGitStatus: async () => {
    const { activeProject } = get();
    if (!activeProject || !window.elythraAPI) return;
    try {
      const status = await window.elythraAPI.gitStatus(activeProject.path);
      set({ gitStatus: status });
    } catch {
      set({ gitStatus: null });
    }
  },

  stageFile: async (file: string) => {
    const { activeProject } = get();
    if (!activeProject || !window.elythraAPI) return;
    await window.elythraAPI.gitStage(activeProject.path, file);
    await get().refreshGitStatus();
  },

  unstageFile: async (file: string) => {
    const { activeProject } = get();
    if (!activeProject || !window.elythraAPI) return;
    await window.elythraAPI.gitUnstage(activeProject.path, file);
    await get().refreshGitStatus();
  },

  commitGitChanges: async (msg: string) => {
    const { activeProject } = get();
    if (!activeProject || !window.elythraAPI || !msg.trim()) return false;
    const ok = await window.elythraAPI.gitCommit(activeProject.path, msg);
    if (ok) await get().refreshGitStatus();
    return ok;
  },

  pushGitChanges: async () => {
    const { activeProject } = get();
    if (!activeProject || !window.elythraAPI) return 'No active repo';
    const res = await window.elythraAPI.gitPush(activeProject.path);
    await get().refreshGitStatus();
    return res.output;
  },

  pullGitChanges: async () => {
    const { activeProject } = get();
    if (!activeProject || !window.elythraAPI) return 'No active repo';
    const res = await window.elythraAPI.gitPull(activeProject.path);
    await get().refreshGitStatus();
    return res.output;
  },

  setSearchQuery: (q: string) => set({ searchQuery: q }),

  performSearch: async (query: string) => {
    const { activeProject } = get();
    if (!activeProject || !window.elythraAPI || !query.trim()) {
      set({ searchResults: [], isSearching: false });
      return;
    }
    set({ isSearching: true, searchQuery: query });
    try {
      const results = await window.elythraAPI.searchInFiles(activeProject.path, query);
      set({ searchResults: results, isSearching: false });
    } catch {
      set({ searchResults: [], isSearching: false });
    }
  },

  startNewConversation: () => {
    const { activeProject } = get();
    const newConvo: Conversation = {
      id: String(Date.now()),
      projectId: activeProject?.id,
      title: 'New Session',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };
    const updated = [newConvo, ...get().conversations];
    set({
      conversations: updated,
      activeConversationId: newConvo.id,
      streamingContent: '',
      isGenerating: false,
    });
    window.elythraAPI?.saveConversations(updated);
  },

  selectConversation: (id: string) => {
    set({ activeConversationId: id });
  },

  deleteConversation: (id: string) => {
    const { conversations, activeConversationId } = get();
    const updated = conversations.filter((c) => c.id !== id);
    const nextActive = activeConversationId === id ? (updated[0]?.id || null) : activeConversationId;
    set({ conversations: updated, activeConversationId: nextActive });
    window.elythraAPI?.saveConversations(updated);
  },

  sendMessage: async (text: string) => {
    if (!text.trim()) return;
    let { activeConversationId, conversations, activeProject, selectedModel, thinkingLevel, permissionMode } = get();

    if (!activeConversationId) {
      get().startNewConversation();
      activeConversationId = get().activeConversationId!;
      conversations = get().conversations;
    }

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const currentConvo = conversations.find((c) => c.id === activeConversationId);
    const msgs = currentConvo ? [...currentConvo.messages, userMsg] : [userMsg];

    const updatedConvos = conversations.map((c) =>
      c.id === activeConversationId
        ? {
            ...c,
            title: c.messages.length === 0 ? text.slice(0, 32) : c.title,
            messages: msgs,
            updatedAt: Date.now(),
          }
        : c
    );

    set({
      conversations: updatedConvos,
      isGenerating: true,
      streamingContent: '',
    });
    window.elythraAPI?.saveConversations(updatedConvos);

    if (window.elythraAPI) {
      try {
        // Real @ Mention Context Resolution (Reads actual files from disk / open tabs)
        let enrichedContent = text;
        const mentionMatches = Array.from(text.matchAll(/@([a-zA-Z0-9_\-\./\\]+)/g));
        const mentions = mentionMatches.map((m) => m[1]);

        if (mentions.length > 0) {
          const injectedFiles: string[] = [];
          const { openTabs } = get();
          for (const mName of mentions) {
            const matchingTab = openTabs.find((t) => t.name === mName || t.path.endsWith(mName));
            if (matchingTab) {
              injectedFiles.push(`\n\n--- Context File: ${matchingTab.name} ---\n\`\`\`${matchingTab.language}\n${matchingTab.content}\n\`\`\``);
              continue;
            }
            if (activeProject && window.elythraAPI) {
              try {
                const fullPath = mName.startsWith(activeProject.path) ? mName : `${activeProject.path}/${mName}`;
                const fileData = await window.elythraAPI.readFile(fullPath);
                if (fileData) {
                  injectedFiles.push(`\n\n--- Context File: ${mName} ---\n\`\`\`\n${fileData}\n\`\`\``);
                }
              } catch (_) {}
            }
          }
          if (injectedFiles.length > 0) {
            enrichedContent = `${text}\n\n[Referenced Project Context]${injectedFiles.join('\n')}`;
          }
        }

        const outgoingMsgs = msgs.map((m, idx) =>
          idx === msgs.length - 1 ? { ...m, content: enrichedContent } : m
        );

        const fullReply = await window.elythraAPI.sendAIChat({
          messages: outgoingMsgs,
          model: selectedModel,
          thinkingLevel,
          permissionMode,
          projectPath: activeProject?.path,
        });

        // Fail-safe: If the streaming callback did not commit the message for any reason, commit fullReply immediately!
        const state = get();
        const currentConvoAfter = state.conversations.find((c) => c.id === activeConversationId);
        const lastMsg = currentConvoAfter?.messages[currentConvoAfter.messages.length - 1];

        if (
          (!lastMsg || lastMsg.role !== 'assistant') &&
          fullReply &&
          typeof fullReply === 'string' &&
          !fullReply.startsWith('[Baglanti Hatasi]:') &&
          !fullReply.startsWith('[Sağlayıcı Yanıtı]:') &&
          !fullReply.startsWith('HTTP ')
        ) {
          const assistantMsg: ChatMessage = {
            id: String(Date.now()),
            role: 'assistant',
            content: fullReply,
            timestamp: Date.now(),
            model: state.selectedModel,
          };
          const updated = state.conversations.map((c) =>
            c.id === activeConversationId
              ? { ...c, messages: [...c.messages, assistantMsg], updatedAt: Date.now() }
              : c
          );
          set({ conversations: updated, isGenerating: false, streamingContent: '' });
          window.elythraAPI?.saveConversations(updated);
        } else {
          set({ isGenerating: false, streamingContent: '' });
        }
      } catch (err: any) {
        console.error('sendAIChat failure:', err);
        const fallbackMsg: ChatMessage = {
          id: String(Date.now()),
          role: 'assistant',
          content: `[Baglanti Hatasi]: ${err.message || 'Istemci yaniti olusturulamadi.'}`,
          timestamp: Date.now(),
          model: selectedModel,
        };
        const state = get();
        const updated = state.conversations.map((c) =>
          c.id === activeConversationId
            ? { ...c, messages: [...c.messages, fallbackMsg], updatedAt: Date.now() }
            : c
        );
        set({ conversations: updated, isGenerating: false, streamingContent: '' });
        window.elythraAPI?.saveConversations(updated);
      }
    }
  },

  updateSettings: async (newSettings) => {
    const updated = { ...get().settings, ...newSettings };
    set({ settings: updated });
    await window.elythraAPI?.saveSettings(updated);
  },

  updateAutomations: async (newRules) => {
    set({ automations: newRules });
    await window.elythraAPI?.saveAutomations(newRules);
  },
}));
