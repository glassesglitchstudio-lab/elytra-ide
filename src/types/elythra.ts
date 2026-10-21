export type PermissionMode = 'Default' | 'Plan only' | 'Auto-approve';
export type ThinkingLevel = 'Low' | 'Medium' | 'High';

export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  extension?: string;
  children?: FileItem[];
}

export interface ProjectItem {
  id: string;
  name: string;
  path: string;
  lastOpened: number;
  conversationsCount: number;
}

export interface ToolCall {
  id: string;
  name: 'readFile' | 'writeFile' | 'listDirectory' | 'runCommand' | 'gitDiff' | 'gitCommit';
  args: Record<string, any>;
  result?: any;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'failed';
  diff?: {
    file: string;
    oldContent: string;
    newContent: string;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  thinkingContent?: string;
  timestamp: number;
  model?: string;
  toolCalls?: ToolCall[];
}

export interface Conversation {
  id: string;
  projectId?: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger: 'on-save' | 'on-build' | 'scheduled';
  scheduleTime?: string; // e.g. "14:00"
  command: string;
  enabled: boolean;
  lastRun?: number;
}

export interface ElythraSettings {
  apiKeys: {
    // 1. Ücretsiz / Free Tier
    gemini?: string;
    opencodeZen?: string;
    groq?: string;
    cerebras?: string;
    sambanova?: string;
    openrouter?: string;

    // 2. OAuth & Device Login
    githubCopilot?: string;

    // 3. Top-Tier BYOK
    anthropic?: string;
    openai?: string;
    deepseek?: string;
    mistral?: string;
    xai?: string;

    // 4. Ultra-Fast Cloud & Search
    together?: string;
    fireworks?: string;
    perplexity?: string;
    cohere?: string;

    // 5. Yerel & Özel
    ollamaUrl?: string;
    customEndpoint?: string;
    customKey?: string;
    customModel?: string;
  };
  defaultModel: string;
  thinkingLevel: ThinkingLevel;
  fontSize: number;
  fontFamily: string;
  autoSave: boolean;
  terminalShell: string;
  systemInstructions: string;
  installedPlugins?: Record<string, boolean>;
  pluginSettings?: Record<string, any>;
}

export interface GitStatus {
  isRepo: boolean;
  branch: string;
  clean: boolean;
  modified: string[];
  staged: string[];
  untracked: string[];
  ahead: number;
  behind: number;
}

export interface ElythraAPI {
  // Window
  windowMinimize: () => Promise<void>;
  windowMaximize: () => Promise<void>;
  windowClose: () => Promise<void>;
  windowIsMaximized: () => Promise<boolean>;

  // File System
  openDirectoryDialog: () => Promise<string | null>;
  openFileDialog: () => Promise<string | null>;
  readDirectory: (dirPath: string) => Promise<FileItem[]>;
  readFile: (filePath: string) => Promise<string>;
  writeFile: (filePath: string, content: string) => Promise<boolean>;
  createFile: (filePath: string) => Promise<boolean>;
  createDirectory: (dirPath: string) => Promise<boolean>;
  deletePath: (targetPath: string) => Promise<boolean>;
  renamePath: (oldPath: string, newPath: string) => Promise<boolean>;
  watchDirectory: (dirPath: string) => Promise<void>;
  onFileChanged: (callback: (data: { event: string; path: string }) => void) => () => void;

  // Terminal
  terminalCreate: (id: string, cwd?: string, shell?: string) => Promise<boolean>;
  terminalWrite: (id: string, data: string) => Promise<void>;
  terminalResize: (id: string, cols: number, rows: number) => Promise<void>;
  terminalKill: (id: string) => Promise<void>;
  onTerminalData: (id: string, callback: (data: string) => void) => () => void;

  // Git
  gitStatus: (cwd: string) => Promise<GitStatus>;
  gitDiff: (cwd: string, file?: string) => Promise<string>;
  gitStage: (cwd: string, file: string) => Promise<boolean>;
  gitUnstage: (cwd: string, file: string) => Promise<boolean>;
  gitCommit: (cwd: string, message: string) => Promise<boolean>;
  gitBranchList: (cwd: string) => Promise<string[]>;
  gitCheckout: (cwd: string, branch: string) => Promise<boolean>;
  gitPull: (cwd: string) => Promise<{ success: boolean; output: string }>;
  gitPush: (cwd: string) => Promise<{ success: boolean; output: string }>;

  // Search
  searchInFiles: (cwd: string, query: string, isRegex?: boolean) => Promise<Array<{ file: string; line: number; text: string }>>;

  // Settings & Storage
  getSettings: () => Promise<ElythraSettings>;
  saveSettings: (settings: Partial<ElythraSettings>) => Promise<boolean>;
  getProjects: () => Promise<ProjectItem[]>;
  saveProjects: (projects: ProjectItem[]) => Promise<boolean>;
  getConversations: () => Promise<Conversation[]>;
  saveConversations: (conversations: Conversation[]) => Promise<boolean>;
  getAutomations: () => Promise<AutomationRule[]>;
  saveAutomations: (automations: AutomationRule[]) => Promise<boolean>;

  // External Browser Link
  openExternal: (url: string) => Promise<boolean>;

  // OAuth & Device Auth
  copilotStartDeviceAuth: () => Promise<{
    verification_uri?: string;
    user_code?: string;
    device_code?: string;
    interval?: number;
    error?: string;
  }>;
  copilotPollToken: (device_code: string) => Promise<{
    access_token?: string;
    error?: string;
  }>;

  // Web Search Tool
  webSearch: (query: string) => Promise<Array<{ title: string; link: string; snippet: string; source: string }>>;

  // AI Stream
  sendAIChat: (params: {
    messages: ChatMessage[];
    model: string;
    thinkingLevel: ThinkingLevel;
    permissionMode: PermissionMode;
    projectPath?: string;
  }) => Promise<string>;
  onAIStreamChunk: (callback: (data: { chunk?: string; thinkingChunk?: string; toolCall?: ToolCall; done?: boolean; error?: string }) => void) => () => void;
}

declare global {
  interface Window {
    elythraAPI?: ElythraAPI;
  }
}
