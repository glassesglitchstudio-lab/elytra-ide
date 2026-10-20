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

interface ElythraStore {
  // Navigation & Layout
  activeProject: ProjectItem | null;
  sidebarTab: 'new-chat' | 'history' | 'automations' | 'customizations';
  isSidebarOpen: boolean;
  sidebarWidth: number;
  isTerminalOpen: boolean;
  terminalHeight: number;
  isAIPanelOpen: boolean;
  aiPanelWidth: number;
  activeModal: 'settings' | 'command-palette' | 'quick-open' | null;

  // Conversations
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

  // Git & Terminal & Search
  gitStatus: GitStatus | null;
  searchQuery: string;
  searchResults: Array<{ file: string; line: number; text: string }>;
  automations: AutomationRule[];
  settings: ElythraSettings;

  // Actions
  init: () => Promise<void>;
  setSidebarTab: (tab: 'new-chat' | 'history' | 'automations' | 'customizations') => void;
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

  openProject: (projectPath: string) => Promise<void>;
  closeProject: () => void;
  refreshFileTree: () => Promise<void>;
  openFileTab: (filePath: string) => Promise<void>;
  closeFileTab: (filePath: string) => void;
  updateTabContent: (filePath: string, content: string) => void;
  saveActiveTab: () => Promise<void>;
  saveAllTabs: () => Promise<void>;

  refreshGitStatus: () => Promise<void>;
  startNewConversation: () => void;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  sendMessage: (text: string) => Promise<void>;

  updateSettings: (newSettings: Partial<ElythraSettings>) => Promise<void>;
  updateAutomations: (newRules: AutomationRule[]) => Promise<void>;
}

const defaultSettings: ElythraSettings = {
  apiKeys: {},
  defaultModel: 'Gemini 3.8 Flash',
  thinkingLevel: 'High',
  fontSize: 14,
  fontFamily: 'Inter',
  autoSave: true,
  terminalShell: 'powershell.exe',
  systemInstructions: 'You are Elythra Code, an expert pair programmer.',
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

export const useElythraStore = create<ElythraStore>((set, get) => ({
  activeProject: null,
  sidebarTab: 'new-chat',
  isSidebarOpen: true,
  sidebarWidth: 320,
  isTerminalOpen: false,
  terminalHeight: 240,
  isAIPanelOpen: true,
  aiPanelWidth: 380,
  activeModal: null,

  conversations: [],
  activeConversationId: null,
  permissionMode: 'Default',
  selectedModel: 'Gemini 3.8 Flash',
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
  automations: [
    {
      id: 'auto-test',
      name: 'Run tests on save',
      trigger: 'on-save',
      command: 'npm test',
      enabled: false,
    },
    {
      id: 'auto-lint',
      name: 'Lint code on save',
      trigger: 'on-save',
      command: 'npm run lint',
      enabled: false,
    },
  ],
  settings: defaultSettings,

  init: async () => {
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
        projects: projects || [],
        conversations: convos || [],
        automations: autos && autos.length > 0 ? autos : get().automations,
      });

      // Listen for AI stream chunks
      window.elythraAPI.onAIStreamChunk((data) => {
        if (data.chunk) {
          set((s) => ({ streamingContent: s.streamingContent + data.chunk }));
        }
        if (data.done) {
          const { activeConversationId, streamingContent, conversations } = get();
          if (activeConversationId && streamingContent) {
            const assistantMsg: ChatMessage = {
              id: String(Date.now()),
              role: 'assistant',
              content: streamingContent,
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
          set({ isGenerating: false });
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

  setSidebarTab: (tab) => {
    // If switching to new-chat while in IDE and clicking New Conversation,
    // as requested: "Projeden çıkmak için sol paneldeki 'New Conversation' veya proje seçimini kaldırma yeterlidir"
    if (tab === 'new-chat') {
      get().startNewConversation();
    }
    set({ sidebarTab: tab });
  },

  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  setSidebarWidth: (w) => set({ sidebarWidth: Math.max(220, Math.min(600, w)) }),
  toggleTerminal: () => set((s) => ({ isTerminalOpen: !s.isTerminalOpen })),
  setTerminalHeight: (h) => set({ terminalHeight: Math.max(120, Math.min(600, h)) }),
  toggleAIPanel: () => set((s) => ({ isAIPanelOpen: !s.isAIPanelOpen })),
  setAIPanelWidth: (w) => set({ aiPanelWidth: Math.max(280, Math.min(600, w)) }),
  setActiveModal: (m) => set({ activeModal: m }),

  setPermissionMode: (m) => set({ permissionMode: m }),
  setSelectedModel: (m) => set({ selectedModel: m }),
  setThinkingLevel: (lvl) => set({ thinkingLevel: lvl }),

  openProject: async (projectPath: string) => {
    if (!window.elythraAPI) return;
    const name = projectPath.split(/[\\/]/).filter(Boolean).pop() || 'project';
    const existing = get().projects.find((p) => p.path === projectPath);

    const projectItem: ProjectItem = existing
      ? { ...existing, lastOpened: Date.now() }
      : {
          id: String(Date.now()),
          name,
          path: projectPath,
          lastOpened: Date.now(),
          conversationsCount: 0,
        };

    const updatedProjects = [
      projectItem,
      ...get().projects.filter((p) => p.path !== projectPath),
    ];

    set({ activeProject: projectItem, projects: updatedProjects });
    window.elythraAPI.saveProjects(updatedProjects);

    await get().refreshFileTree();
    await get().refreshGitStatus();
    await window.elythraAPI.watchDirectory(projectPath);
  },

  closeProject: () => {
    set({
      activeProject: null,
      fileTree: [],
      openTabs: [],
      activeTabPath: null,
      gitStatus: null,
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
      set({ activeTabPath: filePath });
      return;
    }

    if (!window.elythraAPI) return;
    try {
      const content = await window.elythraAPI.readFile(filePath);
      const name = filePath.split(/[\\/]/).pop() || 'file';
      const ext = name.split('.').pop();
      const newTab: EditorTab = {
        path: filePath,
        name,
        content,
        isDirty: false,
        language: getLanguageFromExt(ext),
      };
      set({ openTabs: [...openTabs, newTab], activeTabPath: filePath });
    } catch (err) {
      console.error('Failed to open file tab:', err);
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
    const { activeTabPath, openTabs } = get();
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

  startNewConversation: () => {
    const { activeProject } = get();
    const newConvo: Conversation = {
      id: String(Date.now()),
      projectId: activeProject?.id,
      title: 'New Conversation',
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
            title: c.messages.length === 0 ? text.slice(0, 30) : c.title,
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
      await window.elythraAPI.sendAIChat({
        messages: msgs,
        model: selectedModel,
        thinkingLevel,
        permissionMode,
        projectPath: activeProject?.path,
      });
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
