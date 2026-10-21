import { contextBridge, ipcRenderer } from 'electron';
import type { ElythraAPI } from '../types/elythra';

const elythraAPI: ElythraAPI = {
  // Window
  windowMinimize: () => ipcRenderer.invoke('window:minimize'),
  windowMaximize: () => ipcRenderer.invoke('window:maximize'),
  windowClose: () => ipcRenderer.invoke('window:close'),
  windowIsMaximized: () => ipcRenderer.invoke('window:isMaximized'),

  // File System
  openDirectoryDialog: () => ipcRenderer.invoke('fs:openDirectoryDialog'),
  openFileDialog: () => ipcRenderer.invoke('fs:openFileDialog'),
  readDirectory: (dirPath: string) => ipcRenderer.invoke('fs:readDirectory', dirPath),
  readFile: (filePath: string) => ipcRenderer.invoke('fs:readFile', filePath),
  writeFile: (filePath: string, content: string) => ipcRenderer.invoke('fs:writeFile', filePath, content),
  createFile: (filePath: string) => ipcRenderer.invoke('fs:createFile', filePath),
  createDirectory: (dirPath: string) => ipcRenderer.invoke('fs:createDirectory', dirPath),
  deletePath: (targetPath: string) => ipcRenderer.invoke('fs:deletePath', targetPath),
  renamePath: (oldPath: string, newPath: string) => ipcRenderer.invoke('fs:renamePath', oldPath, newPath),
  watchDirectory: (dirPath: string) => ipcRenderer.invoke('fs:watchDirectory', dirPath),
  onFileChanged: (callback) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('fs:fileChanged', handler);
    return () => ipcRenderer.removeListener('fs:fileChanged', handler);
  },

  // Terminal
  terminalCreate: (id: string, cwd?: string, shell?: string) => ipcRenderer.invoke('terminal:create', id, cwd, shell),
  terminalWrite: (id: string, data: string) => ipcRenderer.invoke('terminal:write', id, data),
  terminalResize: (_id: string, _cols: number, _rows: number) => Promise.resolve(),
  terminalKill: (id: string) => ipcRenderer.invoke('terminal:kill', id),
  onTerminalData: (id: string, callback: (data: string) => void) => {
    const channel = `terminal:data:${id}`;
    const handler = (_: any, data: string) => callback(data);
    ipcRenderer.on(channel, handler);
    return () => ipcRenderer.removeListener(channel, handler);
  },

  // Git
  gitStatus: (cwd: string) => ipcRenderer.invoke('git:status', cwd),
  gitDiff: (cwd: string, file?: string) => ipcRenderer.invoke('git:diff', cwd, file),
  gitStage: (cwd: string, file: string) => ipcRenderer.invoke('git:stage', cwd, file),
  gitUnstage: (cwd: string, file: string) => ipcRenderer.invoke('git:unstage', cwd, file),
  gitCommit: (cwd: string, message: string) => ipcRenderer.invoke('git:commit', cwd, message),
  gitBranchList: (cwd: string) => ipcRenderer.invoke('git:branchList', cwd),
  gitCheckout: (cwd: string, branch: string) => ipcRenderer.invoke('git:checkout', cwd, branch),
  gitPull: (cwd: string) => ipcRenderer.invoke('git:pull', cwd),
  gitPush: (cwd: string) => ipcRenderer.invoke('git:push', cwd),

  // Search
  searchInFiles: (cwd: string, query: string, isRegex = false) => ipcRenderer.invoke('search:inFiles', cwd, query, isRegex),

  // Storage
  getSettings: () => ipcRenderer.invoke('storage:getSettings'),
  saveSettings: (settings) => ipcRenderer.invoke('storage:saveSettings', settings),
  getProjects: () => ipcRenderer.invoke('storage:getProjects'),
  saveProjects: (projects) => ipcRenderer.invoke('storage:saveProjects', projects),
  getConversations: () => ipcRenderer.invoke('storage:getConversations'),
  saveConversations: (conversations) => ipcRenderer.invoke('storage:saveConversations', conversations),
  getAutomations: () => ipcRenderer.invoke('storage:getAutomations'),
  saveAutomations: (automations) => ipcRenderer.invoke('storage:saveAutomations', automations),

  // External Browser Link
  openExternal: (url: string) => ipcRenderer.invoke('app:openExternal', url),

  // OAuth & Device Auth
  copilotStartDeviceAuth: () => ipcRenderer.invoke('auth:copilotStartDevice'),
  copilotPollToken: (device_code: string) => ipcRenderer.invoke('auth:copilotPollToken', device_code),

  // AI
  sendAIChat: (params) => ipcRenderer.invoke('ai:sendChat', params),
  onAIStreamChunk: (callback) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('ai:streamChunk', handler);
    return () => ipcRenderer.removeListener('ai:streamChunk', handler);
  },
};

contextBridge.exposeInMainWorld('elythraAPI', elythraAPI);
