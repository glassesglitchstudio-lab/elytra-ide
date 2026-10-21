import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import chokidar from 'chokidar';
import type { ElythraSettings, ProjectItem, Conversation, AutomationRule, GitStatus } from '../types/elythra';

let mainWindow: BrowserWindow | null = null;
let fileWatcher: chokidar.FSWatcher | null = null;
const activeTerminals: Map<string, ChildProcess> = new Map();

const USER_DATA = app.getPath('userData');
const SETTINGS_FILE = path.join(USER_DATA, 'elythra-settings.json');
const PROJECTS_FILE = path.join(USER_DATA, 'elythra-projects.json');
const CONVERSATIONS_FILE = path.join(USER_DATA, 'elythra-conversations.json');
const AUTOMATIONS_FILE = path.join(USER_DATA, 'elythra-automations.json');

// Default Settings
const defaultSettings: ElythraSettings = {
  apiKeys: {},
  defaultModel: 'Nemotron 3.5 Lightning',
  thinkingLevel: 'High',
  fontSize: 14,
  fontFamily: 'Inter',
  autoSave: true,
  terminalShell: process.platform === 'win32' ? 'powershell.exe' : 'bash',
  systemInstructions: 'You are Elythra Code, an expert software engineer and autonomous AI pair programmer.',
  installedPlugins: {
    'plugin-web-search': true,
    'plugin-git-butler': true,
    'plugin-ue5-helper': true,
    'plugin-pkg-inspector': true,
    'plugin-test-generator': true,
    'plugin-design-tokens': true,
    'plugin-docker-architect': true,
    'plugin-python-runner': true,
  },
};

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data) as T;
    }
  } catch (err) {
    console.error(`Failed to read ${filePath}:`, err);
  }
  return fallback;
}

function writeJsonFile<T>(filePath: string, data: T): boolean {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Failed to write ${filePath}:`, err);
    return false;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'Elythra Code',
    width: 1440,
    height: 900,
    minWidth: 980,
    minHeight: 640,
    frame: false,
    backgroundColor: '#111111',
    show: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.webContents.on('did-fail-load', (_, errorCode, errorDescription) => {
    console.error('Renderer failed to load:', errorCode, errorDescription);
  });

  mainWindow.webContents.on('console-message', (_, level, message, line, sourceId) => {
    console.log(`[Renderer ${level}] ${message} (${sourceId}:${line})`);
  });

  // Load renderer
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    const prodPath = path.join(app.getAppPath(), 'dist/index.html');
    const fallbackPath = path.join(__dirname, '../dist/index.html');
    if (fs.existsSync(prodPath)) {
      mainWindow.loadFile(prodPath);
    } else if (fs.existsSync(fallbackPath)) {
      mainWindow.loadFile(fallbackPath);
    } else {
      mainWindow.loadURL('http://localhost:5173');
    }
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (fileWatcher) {
      fileWatcher.close();
    }
    activeTerminals.forEach((proc) => proc.kill());
    activeTerminals.clear();
  });
}

app.whenReady().then(() => {
  setupIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function setupIpcHandlers() {
  // Window Controls
  ipcMain.handle('window:minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.handle('window:close', () => {
    mainWindow?.close();
  });

  ipcMain.handle('window:isMaximized', () => {
    return mainWindow?.isMaximized() || false;
  });

  // File Dialogs
  ipcMain.handle('fs:openDirectoryDialog', async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  });

  ipcMain.handle('fs:openFileDialog', async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  });

  // File System Operations
  ipcMain.handle('fs:readDirectory', async (_, dirPath: string) => {
    try {
      const items = await fs.promises.readdir(dirPath, { withFileTypes: true });
      const result = [];
      for (const item of items) {
        if (item.name === 'node_modules' || item.name === '.git' || item.name === 'dist') continue;
        const fullPath = path.join(dirPath, item.name);
        const isDir = item.isDirectory();
        result.push({
          name: item.name,
          path: fullPath,
          isDirectory: isDir,
          extension: isDir ? undefined : path.extname(item.name).slice(1),
        });
      }
      result.sort((a, b) => {
        if (a.isDirectory === b.isDirectory) {
          return a.name.localeCompare(b.name);
        }
        return a.isDirectory ? -1 : 1;
      });
      return result;
    } catch (err: any) {
      console.error('Error in fs:readDirectory:', err);
      return [];
    }
  });

  ipcMain.handle('fs:readFile', async (_, filePath: string) => {
    try {
      return await fs.promises.readFile(filePath, 'utf-8');
    } catch (err: any) {
      console.error('Error in fs:readFile:', err);
      throw err;
    }
  });

  ipcMain.handle('fs:writeFile', async (_, filePath: string, content: string) => {
    try {
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
      await fs.promises.writeFile(filePath, content, 'utf-8');
      return true;
    } catch (err: any) {
      console.error('Error in fs:writeFile:', err);
      return false;
    }
  });

  ipcMain.handle('fs:createFile', async (_, filePath: string) => {
    try {
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
      await fs.promises.writeFile(filePath, '', 'utf-8');
      return true;
    } catch (err) {
      return false;
    }
  });

  ipcMain.handle('fs:createDirectory', async (_, dirPath: string) => {
    try {
      await fs.promises.mkdir(dirPath, { recursive: true });
      return true;
    } catch (err) {
      return false;
    }
  });

  ipcMain.handle('fs:deletePath', async (_, targetPath: string) => {
    try {
      const stat = await fs.promises.stat(targetPath);
      if (stat.isDirectory()) {
        await fs.promises.rm(targetPath, { recursive: true, force: true });
      } else {
        await fs.promises.unlink(targetPath);
      }
      return true;
    } catch (err) {
      return false;
    }
  });

  ipcMain.handle('fs:renamePath', async (_, oldPath: string, newPath: string) => {
    try {
      await fs.promises.rename(oldPath, newPath);
      return true;
    } catch (err) {
      return false;
    }
  });

  ipcMain.handle('fs:watchDirectory', async (_, dirPath: string) => {
    if (fileWatcher) {
      fileWatcher.close();
    }
    fileWatcher = chokidar.watch(dirPath, {
      ignored: [/(^|[\/\\])\../, '**/node_modules/**'],
      persistent: true,
      ignoreInitial: true,
    });
    fileWatcher.on('all', (event, targetPath) => {
      mainWindow?.webContents.send('fs:fileChanged', { event, path: targetPath });
    });
  });

  // Terminal Handlers
  ipcMain.handle('terminal:create', async (_, id: string, cwd?: string, shellName?: string) => {
    const shell = shellName || (process.platform === 'win32' ? 'powershell.exe' : 'bash');
    const workingDir = cwd && fs.existsSync(cwd) ? cwd : process.cwd();

    try {
      const child = spawn(shell, [], {
        cwd: workingDir,
        env: process.env,
        shell: true,
      });

      activeTerminals.set(id, child);

      child.stdout?.on('data', (data) => {
        mainWindow?.webContents.send(`terminal:data:${id}`, data.toString('utf-8'));
      });

      child.stderr?.on('data', (data) => {
        mainWindow?.webContents.send(`terminal:data:${id}`, data.toString('utf-8'));
      });

      child.on('close', () => {
        activeTerminals.delete(id);
      });

      return true;
    } catch (err) {
      console.error('Error starting terminal:', err);
      return false;
    }
  });

  ipcMain.handle('terminal:write', async (_, id: string, data: string) => {
    const term = activeTerminals.get(id);
    if (term && term.stdin && !term.stdin.destroyed) {
      term.stdin.write(data);
    }
  });

  ipcMain.handle('terminal:kill', async (_, id: string) => {
    const term = activeTerminals.get(id);
    if (term) {
      term.kill();
      activeTerminals.delete(id);
    }
  });

  // Git Handlers
  ipcMain.handle('git:status', async (_, cwd: string): Promise<GitStatus> => {
    return new Promise((resolve) => {
      const emptyStatus: GitStatus = {
        isRepo: false,
        branch: 'main',
        clean: true,
        modified: [],
        staged: [],
        untracked: [],
        ahead: 0,
        behind: 0,
      };

      if (!fs.existsSync(path.join(cwd, '.git'))) {
        return resolve(emptyStatus);
      }

      const child = spawn('git', ['status', '--porcelain=v1', '-b'], { cwd, shell: true });
      let output = '';

      child.stdout.on('data', (d) => (output += d.toString()));
      child.on('close', (code) => {
        if (code !== 0) return resolve(emptyStatus);

        const lines = output.split('\n').filter(Boolean);
        const status: GitStatus = {
          isRepo: true,
          branch: 'main',
          clean: true,
          modified: [],
          staged: [],
          untracked: [],
          ahead: 0,
          behind: 0,
        };

        if (lines.length > 0 && lines[0].startsWith('## ')) {
          const branchLine = lines[0].slice(3);
          const branchMatch = branchLine.match(/^([^\s.]+)/);
          if (branchMatch) status.branch = branchMatch[1];
        }

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          const x = line[0];
          const y = line[1];
          const file = line.slice(3).trim();

          if (x === '?' && y === '?') {
            status.untracked.push(file);
          } else {
            if (x !== ' ' && x !== '?') status.staged.push(file);
            if (y !== ' ' && y !== '?') status.modified.push(file);
          }
        }

        status.clean = status.modified.length === 0 && status.staged.length === 0 && status.untracked.length === 0;
        resolve(status);
      });
    });
  });

  ipcMain.handle('git:diff', async (_, cwd: string, file?: string) => {
    return new Promise((resolve) => {
      const args = file ? ['diff', file] : ['diff'];
      const child = spawn('git', args, { cwd, shell: true });
      let diffOutput = '';
      child.stdout.on('data', (d) => (diffOutput += d.toString()));
      child.on('close', () => resolve(diffOutput));
    });
  });

  ipcMain.handle('git:stage', async (_, cwd: string, file: string) => {
    return new Promise((resolve) => {
      const child = spawn('git', ['add', file], { cwd, shell: true });
      child.on('close', (code) => resolve(code === 0));
    });
  });

  ipcMain.handle('git:unstage', async (_, cwd: string, file: string) => {
    return new Promise((resolve) => {
      const child = spawn('git', ['restore', '--staged', file], { cwd, shell: true });
      child.on('close', (code) => resolve(code === 0));
    });
  });

  ipcMain.handle('git:commit', async (_, cwd: string, message: string) => {
    return new Promise((resolve) => {
      const child = spawn('git', ['commit', '-m', message], { cwd, shell: true });
      child.on('close', (code) => resolve(code === 0));
    });
  });

  ipcMain.handle('git:branchList', async (_, cwd: string) => {
    return new Promise((resolve) => {
      const child = spawn('git', ['branch', '--list'], { cwd, shell: true });
      let out = '';
      child.stdout.on('data', (d) => (out += d.toString()));
      child.on('close', () => {
        const branches = out
          .split('\n')
          .map((b) => b.replace('*', '').trim())
          .filter(Boolean);
        resolve(branches);
      });
    });
  });

  ipcMain.handle('git:checkout', async (_, cwd: string, branch: string) => {
    return new Promise((resolve) => {
      const child = spawn('git', ['checkout', branch], { cwd, shell: true });
      child.on('close', (code) => resolve(code === 0));
    });
  });

  ipcMain.handle('git:pull', async (_, cwd: string) => {
    return new Promise((resolve) => {
      const child = spawn('git', ['pull'], { cwd, shell: true });
      let out = '';
      child.stdout.on('data', (d) => (out += d.toString()));
      child.stderr.on('data', (d) => (out += d.toString()));
      child.on('close', (code) => resolve({ success: code === 0, output: out }));
    });
  });

  ipcMain.handle('git:push', async (_, cwd: string) => {
    return new Promise((resolve) => {
      const child = spawn('git', ['push'], { cwd, shell: true });
      let out = '';
      child.stdout.on('data', (d) => (out += d.toString()));
      child.stderr.on('data', (d) => (out += d.toString()));
      child.on('close', (code) => resolve({ success: code === 0, output: out }));
    });
  });

  // Search In Files
  ipcMain.handle('search:inFiles', async (_, cwd: string, query: string, isRegex = false) => {
    const results: Array<{ file: string; line: number; text: string }> = [];
    if (!query || !fs.existsSync(cwd)) return results;

    const regex = isRegex ? new RegExp(query, 'g') : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');

    async function walk(dir: string) {
      if (results.length > 200) return;
      try {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            await walk(fullPath);
          } else if (entry.isFile()) {
            try {
              const content = await fs.promises.readFile(fullPath, 'utf-8');
              const lines = content.split('\n');
              for (let i = 0; i < lines.length; i++) {
                if (regex.test(lines[i])) {
                  results.push({
                    file: path.relative(cwd, fullPath),
                    line: i + 1,
                    text: lines[i].trim().slice(0, 150),
                  });
                  if (results.length > 200) break;
                }
              }
            } catch {
              // Ignore binary files or unreadable files
            }
          }
        }
      } catch (err) {
        // Ignore read errors
      }
    }

    await walk(cwd);
    return results;
  });

  // Settings & Storage Persistence
  ipcMain.handle('storage:getSettings', () => readJsonFile(SETTINGS_FILE, defaultSettings));
  ipcMain.handle('storage:saveSettings', (_, s: Partial<ElythraSettings>) => {
    const current = readJsonFile(SETTINGS_FILE, defaultSettings);
    const updated = { ...current, ...s };
    return writeJsonFile(SETTINGS_FILE, updated);
  });

  ipcMain.handle('storage:getProjects', () => readJsonFile<ProjectItem[]>(PROJECTS_FILE, []));
  ipcMain.handle('storage:saveProjects', (_, projects: ProjectItem[]) => writeJsonFile(PROJECTS_FILE, projects));

  ipcMain.handle('storage:getConversations', () => readJsonFile<Conversation[]>(CONVERSATIONS_FILE, []));
  ipcMain.handle('storage:saveConversations', (_, convos: Conversation[]) => writeJsonFile(CONVERSATIONS_FILE, convos));

  ipcMain.handle('storage:getAutomations', () => readJsonFile<AutomationRule[]>(AUTOMATIONS_FILE, []));
  ipcMain.handle('storage:saveAutomations', (_, autos: AutomationRule[]) => writeJsonFile(AUTOMATIONS_FILE, autos));

  // External Browser Link
  ipcMain.handle('app:openExternal', async (_, url: string) => {
    try {
      await shell.openExternal(url);
      return true;
    } catch {
      return false;
    }
  });

  // Live Multi-Source Web Search Engine (HackerNews, GitHub Repos, Tech Encyclopedia)
  async function multiSourceWebSearch(query: string): Promise<Array<{ title: string; link: string; snippet: string; source: string }>> {
    const cleanQuery = query.replace(/^(\/search|@web)\s*/i, '').trim();
    if (!cleanQuery) return [];
    const results: Array<{ title: string; link: string; snippet: string; source: string }> = [];

    // 1. Hacker News Developer Web & Articles
    try {
      const hnRes = await fetch(`https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(cleanQuery)}&hitsPerPage=3`);
      if (hnRes.ok) {
        const hnData: any = await hnRes.json();
        for (const hit of hnData.hits || []) {
          if (hit.title && (hit.url || hit.story_url)) {
            results.push({
              title: hit.title,
              link: hit.url || hit.story_url,
              snippet: hit.comment_text ? hit.comment_text.replace(/<[^>]+>/g, '').slice(0, 160) : `Tech discussion & source with ${hit.points || 0} upvotes.`,
              source: 'Tech Web',
            });
          }
        }
      }
    } catch {}

    // 2. GitHub Code & Open Source Repositories
    try {
      const ghRes = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(cleanQuery)}&per_page=3`, {
        headers: { 'User-Agent': 'ElytraCode/1.0' },
      });
      if (ghRes.ok) {
        const ghData: any = await ghRes.json();
        for (const item of ghData.items || []) {
          results.push({
            title: `${item.full_name}: ${item.description || 'GitHub Project'}`,
            link: item.html_url,
            snippet: `⭐ ${item.stargazers_count} stars | Language: ${item.language || 'Code'} | Updated: ${item.updated_at?.slice(0, 10)}`,
            source: 'GitHub Code',
          });
        }
      }
    } catch {}

    // 3. Technical Wikipedia Encyclopedia
    try {
      const wikiRes = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(cleanQuery)}&limit=2&namespace=0&format=json`);
      if (wikiRes.ok) {
        const wikiData: any = await wikiRes.json();
        const titles = wikiData[1] || [];
        const descs = wikiData[2] || [];
        const links = wikiData[3] || [];
        for (let i = 0; i < titles.length; i++) {
          if (titles[i] && links[i]) {
            results.push({
              title: titles[i],
              link: links[i],
              snippet: descs[i] || 'Technical documentation reference.',
              source: 'Documentation',
            });
          }
        }
      }
    } catch {}

    return results;
  }

  ipcMain.handle('tools:webSearch', async (_, query: string) => {
    return await multiSourceWebSearch(query);
  });

  // GitHub Copilot Official Device Code OAuth Flow
  // Standard public Client ID utilized by official VS Code Copilot extension
  const COPILOT_CLIENT_ID = 'Iv1.b507a08c87ecfe98';

  ipcMain.handle('auth:copilotStartDevice', async () => {
    try {
      const res = await fetch('https://github.com/login/device/code', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'GitHubCopilotChat/0.22.4',
        },
        body: JSON.stringify({
          client_id: COPILOT_CLIENT_ID,
          scope: 'read:user',
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        return { error: `Device auth request failed (${res.status}): ${errText}` };
      }
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { error: err.message || 'Device auth start failed' };
    }
  });

  ipcMain.handle('auth:copilotPollToken', async (_, device_code: string) => {
    try {
      const res = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'GitHubCopilotChat/0.22.4',
        },
        body: JSON.stringify({
          client_id: COPILOT_CLIENT_ID,
          device_code,
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        }),
      });
      if (!res.ok) {
        return { error: `Poll failed: ${res.statusText}` };
      }
      const data: any = await res.json();
      // If access_token was obtained, automatically persist to settings.json immediately!
      if (data.access_token) {
        try {
          const currentSettings = readJsonFile(SETTINGS_FILE, defaultSettings);
          currentSettings.apiKeys = currentSettings.apiKeys || {};
          currentSettings.apiKeys.githubCopilot = data.access_token.trim();
          writeJsonFile(SETTINGS_FILE, currentSettings);
          console.log('[Auth] GitHub Copilot access token auto-saved to settings.json');
        } catch (saveErr) {
          console.error('[Auth] Failed to auto-save copilot token:', saveErr);
        }
      }
      return data;
    } catch (err: any) {
      return { error: err.message || 'Poll token failed' };
    }
  });

  // GitHub Copilot Session Token Cache & Auto-Exchanger
  let copilotSessionTokenCache: { token: string; expires_at: number; host: string } | null = null;

  async function getCopilotSessionToken(githubToken: string): Promise<{ token: string; host?: string; error?: string }> {
    const raw = (githubToken || '').trim();
    if (!raw) return { token: '', error: 'GitHub Copilot token bulunamadı.' };

    const now = Math.floor(Date.now() / 1000);
    if (copilotSessionTokenCache && copilotSessionTokenCache.expires_at > now + 60) {
      return { token: copilotSessionTokenCache.token, host: copilotSessionTokenCache.host };
    }

    // If user already pasted a raw Copilot session token (contains tid= or ;exp=)
    if (raw.startsWith('tid=') || raw.includes(';exp=')) {
      return { token: raw, host: 'https://api.githubcopilot.com' };
    }

    // Exchange ghu_ / gho_ token via GitHub Copilot internal endpoint
    // 1. Try 'token <raw>'
    try {
      let res = await fetch('https://api.github.com/copilot_internal/v2/token', {
        method: 'GET',
        headers: {
          Authorization: `token ${raw}`,
          Accept: 'application/json',
          'Editor-Version': 'vscode/1.95.3',
          'Editor-Plugin-Version': 'copilot-chat/0.22.4',
          'User-Agent': 'GitHubCopilotChat/0.22.4',
        },
      });

      // 2. If 401, try 'Bearer <raw>'
      if (res.status === 401) {
        res = await fetch('https://api.github.com/copilot_internal/v2/token', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${raw}`,
            Accept: 'application/json',
            'Editor-Version': 'vscode/1.95.3',
            'Editor-Plugin-Version': 'copilot-chat/0.22.4',
            'User-Agent': 'GitHubCopilotChat/0.22.4',
          },
        });
      }

      if (res.ok) {
        const data: any = await res.json();
        if (data.token) {
          const host = data.endpoints?.api || 'https://api.githubcopilot.com';
          copilotSessionTokenCache = {
            token: data.token,
            expires_at: data.expires_at || (now + 1800),
            host,
          };
          return { token: data.token, host };
        }
      } else {
        const errText = await res.text();
        console.error('Copilot internal token exchange failed:', res.status, errText);
        if (res.status === 403 || res.status === 404) {
          return {
            token: '',
            error: `GitHub hesabınızda aktif bir GitHub Copilot aboneliği bulunamadı (${res.status}). Lütfen github.com üzerinde Copilot planınızın aktif olduğundan emin olun.`,
          };
        }
      }
    } catch (e: any) {
      console.error('Copilot session token exchange error:', e);
    }

    // Fallback directly with raw token
    return { token: raw, host: 'https://api.githubcopilot.com' };
  }

  // Token Test Endpoint for Frontend Verification
  ipcMain.handle('auth:copilotTestToken', async (_, tokenOverride?: string) => {
    try {
      const settings = readJsonFile(SETTINGS_FILE, defaultSettings);
      const token = (tokenOverride || settings.apiKeys?.githubCopilot || '').trim();
      if (!token) {
        return { valid: false, error: 'Kayıtlı GitHub Copilot tokenı bulunamadı.' };
      }

      // Check GitHub user identity
      let username = '';
      try {
        const uRes = await fetch('https://api.github.com/user', {
          headers: {
            Authorization: `token ${token}`,
            'User-Agent': 'GitHubCopilotChat/0.22.4',
            Accept: 'application/json',
          },
        });
        if (uRes.ok) {
          const uData: any = await uRes.json();
          username = uData.login || uData.name || '';
        }
      } catch (_) {}

      // Test Copilot internal token exchange
      const session = await getCopilotSessionToken(token);
      if (session.error) {
        return { valid: false, error: session.error, user: username };
      }
      if (!session.token) {
        return { valid: false, error: 'Copilot oturum anahtarı alınamadı.', user: username };
      }

      // Test Copilot API ping
      const pingRes = await fetch(`${session.host || 'https://api.githubcopilot.com'}/models`, {
        headers: {
          Authorization: `Bearer ${session.token}`,
          'Editor-Version': 'vscode/1.95.3',
          'Editor-Plugin-Version': 'copilot-chat/0.22.4',
          'User-Agent': 'GitHubCopilotChat/0.22.4',
          'Copilot-Integration-Id': 'vscode-chat',
        },
      });

      if (pingRes.ok) {
        return { valid: true, user: username || 'GitHub Kullanıcısı' };
      } else {
        const errText = await pingRes.text();
        return {
          valid: false,
          error: `Copilot API yetkilendirme yanıt vermedi (HTTP ${pingRes.status}: ${errText.slice(0, 80)})`,
          user: username,
        };
      }
    } catch (err: any) {
      return { valid: false, error: err.message || 'Token testi sırasında bağlantı hatası oluştu.' };
    }
  });

  // AI Chat Request Handler (Full BYOK + Smart Local Autonomous Reasoning Engine)
  ipcMain.handle('ai:sendChat', async (event, params) => {
    const settings = readJsonFile(SETTINGS_FILE, defaultSettings);
    const { messages, model, thinkingLevel, projectPath } = params;
    const keys = settings.apiKeys || {};

    const lastUserMessage = messages[messages.length - 1]?.content || '';

    const sendChunk = (data: { chunk?: string; done?: boolean; error?: string }) => {
      try {
        if (!event.sender.isDestroyed()) {
          event.sender.send('ai:streamChunk', data);
        }
      } catch {}
      try {
        if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents !== event.sender) {
          mainWindow.webContents.send('ai:streamChunk', data);
        }
      } catch {}
    };

    // Live Web Research check (/search, @web, or research intent)
    const isWebSearchRequested = lastUserMessage.startsWith('/search') || lastUserMessage.includes('@web');
    let webContextStr = '';
    if (isWebSearchRequested) {
      const cleanSearchQuery = lastUserMessage.replace(/^(\/search|@web)\s*/i, '').trim();
      if (cleanSearchQuery) {
        sendChunk({ chunk: `🌐 [Web Araştırması: "${cleanSearchQuery}"]\n` });
        try {
          const webItems = await multiSourceWebSearch(cleanSearchQuery);
          if (webItems.length > 0) {
            webContextStr = `\n\n[Canlı Web Araştırması Sonuçları - "${cleanSearchQuery}"]:\n` +
              webItems.map((item, idx) => `${idx + 1}. **${item.title}**\nKaynak Link: ${item.link}\nÖzet: ${item.snippet} (${item.source})`).join('\n\n') +
              `\n\n(Yukarıdaki güncel web kaynaklarını referans göstererek kullanıcının sorusunu yanıtla.)\n`;

            sendChunk({ chunk: `> ${webItems.length} kaynak incelendi (GitHub, Tech Web, Dökümanlar).\n\n` });
          }
        } catch (err) {
          console.error('Web search execution failed:', err);
        }
      }
    }

    // 1. Sanitize messages for multi-turn conversations & model changes
    // Prevents 400 Bad Request on provider switches (enforces alternating roles, filters error cards, removes empty msgs)
    const sanitizedMessages: { role: string; content: string }[] = [];
    if (Array.isArray(messages)) {
      for (const m of messages) {
        if (!m || typeof m.content !== 'string' || !m.content.trim()) continue;
        // Exclude system error diagnostic cards from context history
        if (
          m.content.startsWith('[Baglanti Hatasi]:') ||
          m.content.startsWith('API / Baglanti Hatasi:') ||
          m.content.startsWith('HTTP ')
        ) {
          continue;
        }
        const role = m.role === 'assistant' ? 'assistant' : 'user';
        if (sanitizedMessages.length > 0 && sanitizedMessages[sanitizedMessages.length - 1].role === role) {
          sanitizedMessages[sanitizedMessages.length - 1].content += `\n\n${m.content}`;
        } else {
          sanitizedMessages.push({ role, content: m.content });
        }
      }
    }

    // Ensure conversation starts with user role
    while (sanitizedMessages.length > 0 && sanitizedMessages[0].role !== 'user') {
      sanitizedMessages.shift();
    }
    if (sanitizedMessages.length === 0) {
      sanitizedMessages.push({ role: 'user', content: lastUserMessage || 'Merhaba' });
    }
    if (webContextStr && sanitizedMessages.length > 0) {
      sanitizedMessages[sanitizedMessages.length - 1].content += webContextStr;
    }

    let endpoint = '';
    let headers: Record<string, string> = { 'Content-Type': 'application/json' };
    let body: any = null;
    let isAnthropic = false;
    let isOllama = false;

    // Model ID Resolver
    const MODEL_ID_MAP: Record<string, string> = {
      'Nemotron 3.5 Lightning': 'nvidia/nemotron-3.5-lightning:free',
      'Nemotron Reasoning 30B': 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
      'Laguna 2.1 Coder': 'poolside/laguna-s-2.1:free',
      'MiniMax 3.1 Flash': 'minimax/minimax-m3.1-flash:free',
      'Claude 3.5 Sonnet': 'anthropic/claude-3.5-sonnet',
      'Claude 3.7 Sonnet': 'anthropic/claude-3-7-sonnet-20250219',
      'DeepSeek V3': 'deepseek/deepseek-chat',
      'DeepSeek R1': 'deepseek/deepseek-r1',
      'Llama 3.3 70B': 'meta-llama/llama-3.3-70b-instruct',
      'GPT-4o': 'openai/gpt-4o',
      'GPT-4o Mini': 'openai/gpt-4o-mini',
      'o1': 'openai/o1',
      'o3-mini': 'openai/o3-mini',
      'Gemini 2.5 Flash': 'google/gemini-2.5-flash',
      'Gemini 2.0 Flash': 'google/gemini-2.5-flash',
      'Codestral': 'mistral/codestral-latest',
      'Mistral Large': 'mistral/mistral-large-latest',
      'Grok 2': 'xai/grok-2-latest',
      'Cerebras Llama 3.3 70B': 'cerebras/llama3.3-70b',
      'SambaNova Qwen 2.5 Coder': 'sambanova/Qwen2.5-Coder-32B-Instruct',
      'Perplexity Sonar': 'perplexity/sonar-reasoning',
      'Cohere Command R+': 'cohere/command-r-plus-08-2024',
      'Together Qwen 2.5 Coder': 'together/Qwen/Qwen2.5-Coder-32B-Instruct',
      'Fireworks DeepSeek V3': 'fireworks/accounts/fireworks/models/deepseek-v3',
      'Copilot Claude 3.5 Sonnet': 'copilot/claude-3.5-sonnet',
      'Copilot GPT-4o': 'copilot/gpt-4o',
      'Nemotron 3 Super Free (Zen)': 'nemotron-3-super-free',
      'MiniMax M2.5 Free (Zen)': 'minimax-m2.5-free',
      'Big Pickle (Zen)': 'big-pickle',
      'Qwen 3.5 Plus (Zen)': 'qwen3.5-plus',
      'Custom Endpoint Model': 'custom-endpoint-model',
      'gemini-3.8-flash': 'nvidia/nemotron-3.5-lightning:free',
    };

    const targetModel = MODEL_ID_MAP[model] || model;
    const sysPrompt = settings.systemInstructions || 'You are Elythra Code, an expert autonomous AI software engineer.';

    // 2. Deterministic Provider Routing
    if (model.startsWith('Copilot ') || targetModel.startsWith('copilot/')) {
      // 2.1 GitHub Copilot (OAuth / Token Gateway)
      if (!keys.githubCopilot) {
        const errorMsg = 'GitHub Copilot OAuth token bulunamadı. Lütfen Ayarlar > API Keys bölümünden Copilot ile bağlanın.';
        sendChunk({ error: errorMsg });
        sendChunk({ done: true });
        return null;
      }
      const copilotSession = await getCopilotSessionToken(keys.githubCopilot);
      if (copilotSession.error) {
        sendChunk({ error: `[GitHub Copilot Yetkilendirme Hatası]: ${copilotSession.error}` });
        sendChunk({ done: true });
        return null;
      }
      endpoint = `${copilotSession.host || 'https://api.githubcopilot.com'}/chat/completions`;
      headers['Authorization'] = `Bearer ${copilotSession.token}`;
      headers['Editor-Version'] = 'vscode/1.95.3';
      headers['Editor-Plugin-Version'] = 'copilot-chat/0.22.4';
      headers['User-Agent'] = 'GitHubCopilotChat/0.22.4';
      headers['Copilot-Integration-Id'] = 'vscode-chat';
      headers['Openai-Intent'] = 'conversation-edits';

      let copilotModel = targetModel.replace('copilot/', '');
      if (copilotModel === 'copilot' || !copilotModel || copilotModel.includes('3.5-sonnet')) {
        copilotModel = 'claude-3.5-sonnet';
      } else if (copilotModel.includes('3.7-sonnet')) {
        copilotModel = 'claude-3.7-sonnet';
      } else if (copilotModel.includes('gpt-4o')) {
        copilotModel = 'gpt-4o';
      } else if (copilotModel.includes('o1')) {
        copilotModel = 'o1';
      }
      body = {
        model: copilotModel,
        messages: [{ role: 'system', content: sysPrompt }, ...sanitizedMessages],
        stream: true,
      };
    } else if (
      model.includes('(Zen)') ||
      targetModel.includes('zen') ||
      targetModel === 'nemotron-3-super-free' ||
      targetModel === 'minimax-m2.5-free' ||
      targetModel === 'big-pickle' ||
      targetModel === 'qwen3.5-plus'
    ) {
      // 2.2 OpenCode Zen Gateway
      let zenUrl = (keys.customEndpoint && keys.customEndpoint.includes('opencode.ai'))
        ? keys.customEndpoint.trim()
        : 'https://opencode.ai/zen/v1/chat/completions';
      if (!zenUrl.endsWith('/chat/completions') && !zenUrl.endsWith('/responses')) {
        zenUrl = zenUrl.replace(/\/$/, '') + '/chat/completions';
      }
      endpoint = zenUrl;
      const zenKey = keys.opencodeZen || keys.customKey;
      if (zenKey) headers['Authorization'] = `Bearer ${zenKey}`;

      let zenModel = targetModel;
      if (zenModel.includes('nemotron')) zenModel = 'nemotron-3-super-free';
      else if (zenModel.includes('minimax')) zenModel = 'minimax-m2.5-free';
      else if (zenModel.includes('pickle')) zenModel = 'big-pickle';
      else if (zenModel.includes('qwen')) zenModel = 'qwen3.5-plus';

      body = {
        model: zenModel,
        messages: [{ role: 'system', content: sysPrompt }, ...sanitizedMessages],
        stream: true,
      };
    } else if (model.includes('Cerebras') || targetModel.startsWith('cerebras/')) {
      // 2.3 Cerebras Cloud
      endpoint = 'https://api.cerebras.ai/v1/chat/completions';
      headers['Authorization'] = `Bearer ${keys.cerebras}`;
      body = {
        model: 'llama3.3-70b',
        messages: [{ role: 'system', content: sysPrompt }, ...sanitizedMessages],
        stream: true,
      };
    } else if (model.includes('SambaNova') || targetModel.startsWith('sambanova/')) {
      // 2.4 SambaNova Cloud
      endpoint = 'https://api.sambanova.ai/v1/chat/completions';
      headers['Authorization'] = `Bearer ${keys.sambanova}`;
      let snModel = targetModel.includes('qwen') || model.includes('Qwen') ? 'Qwen2.5-Coder-32B-Instruct' : 'Meta-Llama-3.3-70B-Instruct';
      body = {
        model: snModel,
        messages: [{ role: 'system', content: sysPrompt }, ...sanitizedMessages],
        stream: true,
      };
    } else if (model.includes('Codestral') || model.includes('Mistral') || targetModel.startsWith('mistral/')) {
      // 2.5 Mistral AI
      if (keys.mistral) {
        endpoint = 'https://api.mistral.ai/v1/chat/completions';
        headers['Authorization'] = `Bearer ${keys.mistral}`;
        body = {
          model: model.toLowerCase().includes('large') ? 'mistral-large-latest' : 'codestral-latest',
          messages: [{ role: 'system', content: sysPrompt }, ...sanitizedMessages],
          stream: true,
        };
      } else if (keys.openrouter) {
        endpoint = 'https://openrouter.ai/api/v1/chat/completions';
        headers['Authorization'] = `Bearer ${keys.openrouter}`;
        headers['HTTP-Referer'] = 'https://elytra.code';
        headers['X-Title'] = 'Elytra Code';
        body = {
          model: 'mistralai/codestral-2501',
          messages: [{ role: 'system', content: sysPrompt }, ...sanitizedMessages],
          stream: true,
        };
      }
    } else if (model.includes('Grok') || targetModel.startsWith('xai/')) {
      // 2.6 xAI Grok
      if (keys.xai) {
        endpoint = 'https://api.x.ai/v1/chat/completions';
        headers['Authorization'] = `Bearer ${keys.xai}`;
        body = {
          model: 'grok-2-latest',
          messages: [{ role: 'system', content: sysPrompt }, ...sanitizedMessages],
          stream: true,
        };
      } else if (keys.openrouter) {
        endpoint = 'https://openrouter.ai/api/v1/chat/completions';
        headers['Authorization'] = `Bearer ${keys.openrouter}`;
        headers['HTTP-Referer'] = 'https://elytra.code';
        headers['X-Title'] = 'Elytra Code';
        body = {
          model: 'x-ai/grok-2-1212',
          messages: [{ role: 'system', content: sysPrompt }, ...sanitizedMessages],
          stream: true,
        };
      }
    } else if (model.includes('Perplexity') || targetModel.startsWith('perplexity/')) {
      // 2.7 Perplexity
      endpoint = 'https://api.perplexity.ai/chat/completions';
      headers['Authorization'] = `Bearer ${keys.perplexity}`;
      body = {
        model: 'sonar-reasoning',
        messages: [{ role: 'system', content: sysPrompt }, ...sanitizedMessages],
        stream: true,
      };
    } else if (model.includes('Cohere') || targetModel.startsWith('cohere/')) {
      // 2.8 Cohere
      endpoint = 'https://api.cohere.com/v2/chat';
      headers['Authorization'] = `Bearer ${keys.cohere}`;
      body = {
        model: 'command-r-plus-08-2024',
        messages: sanitizedMessages.map((m: any) => ({ role: m.role, content: m.content })),
        stream: true,
      };
    } else if (model.includes('Together') || targetModel.startsWith('together/')) {
      // 2.9 Together AI
      if (keys.together) {
        endpoint = 'https://api.together.xyz/v1/chat/completions';
        headers['Authorization'] = `Bearer ${keys.together}`;
        body = {
          model: 'Qwen/Qwen2.5-Coder-32B-Instruct',
          messages: [{ role: 'system', content: sysPrompt }, ...sanitizedMessages],
          stream: true,
        };
      } else if (keys.openrouter) {
        endpoint = 'https://openrouter.ai/api/v1/chat/completions';
        headers['Authorization'] = `Bearer ${keys.openrouter}`;
        headers['HTTP-Referer'] = 'https://elytra.code';
        headers['X-Title'] = 'Elytra Code';
        body = {
          model: 'qwen/qwen-2.5-coder-32b-instruct',
          messages: [{ role: 'system', content: sysPrompt }, ...sanitizedMessages],
          stream: true,
        };
      }
    } else if (model.includes('Claude') || targetModel.startsWith('anthropic/')) {
      // 2.10 Anthropic Claude (Direct or OpenRouter fallback)
      const claudeVersion = model.includes('3.7') ? 'claude-3-7-sonnet-20250219' : 'claude-3-5-sonnet-20241022';
      if (keys.anthropic) {
        isAnthropic = true;
        endpoint = 'https://api.anthropic.com/v1/messages';
        headers['x-api-key'] = keys.anthropic;
        headers['anthropic-version'] = '2023-06-01';
        body = {
          model: claudeVersion,
          max_tokens: 4096,
          system: sysPrompt,
          messages: sanitizedMessages.map((m: any) => ({ role: m.role, content: m.content })),
          stream: true,
        };
      } else if (keys.openrouter) {
        endpoint = 'https://openrouter.ai/api/v1/chat/completions';
        headers['Authorization'] = `Bearer ${keys.openrouter}`;
        headers['HTTP-Referer'] = 'https://elytra.code';
        headers['X-Title'] = 'Elytra Code';
        body = {
          model: model.includes('3.7') ? 'anthropic/claude-3.7-sonnet' : 'anthropic/claude-3.5-sonnet',
          messages: [{ role: 'system', content: sysPrompt }, ...sanitizedMessages],
          stream: true,
        };
      }
    } else if (model.includes('DeepSeek') || targetModel.startsWith('deepseek/')) {
      // 2.11 DeepSeek (Direct or OpenRouter fallback)
      const isR1 = model.toLowerCase().includes('r1') || targetModel.includes('r1');
      if (keys.deepseek) {
        endpoint = 'https://api.deepseek.com/v1/chat/completions';
        headers['Authorization'] = `Bearer ${keys.deepseek}`;
        body = {
          model: isR1 ? 'deepseek-reasoner' : 'deepseek-chat',
          messages: [{ role: 'system', content: sysPrompt }, ...sanitizedMessages],
          stream: true,
        };
      } else if (keys.openrouter) {
        endpoint = 'https://openrouter.ai/api/v1/chat/completions';
        headers['Authorization'] = `Bearer ${keys.openrouter}`;
        headers['HTTP-Referer'] = 'https://elytra.code';
        headers['X-Title'] = 'Elytra Code';
        body = {
          model: isR1 ? 'deepseek/deepseek-r1' : 'deepseek/deepseek-chat',
          messages: [{ role: 'system', content: sysPrompt }, ...sanitizedMessages],
          stream: true,
        };
      }
    } else if (model.includes('GPT') || model.includes('o1') || model.includes('o3') || targetModel.startsWith('openai/')) {
      // 2.12 OpenAI (Direct or OpenRouter fallback)
      let oaiModel = 'gpt-4o';
      if (model.includes('o3-mini') || targetModel.includes('o3-mini')) oaiModel = 'o3-mini';
      else if (model.includes('o1') || targetModel.includes('o1')) oaiModel = 'o1';
      else if (model.includes('Mini') || targetModel.includes('mini')) oaiModel = 'gpt-4o-mini';

      if (keys.openai) {
        endpoint = 'https://api.openai.com/v1/chat/completions';
        headers['Authorization'] = `Bearer ${keys.openai}`;
        body = {
          model: oaiModel,
          messages: [{ role: 'system', content: sysPrompt }, ...sanitizedMessages],
          stream: true,
        };
      } else if (keys.openrouter) {
        endpoint = 'https://openrouter.ai/api/v1/chat/completions';
        headers['Authorization'] = `Bearer ${keys.openrouter}`;
        headers['HTTP-Referer'] = 'https://elytra.code';
        headers['X-Title'] = 'Elytra Code';
        body = {
          model: `openai/${oaiModel}`,
          messages: [{ role: 'system', content: sysPrompt }, ...sanitizedMessages],
          stream: true,
        };
      }
    } else if (model.includes('Gemini') || targetModel.startsWith('google/')) {
      // 2.13 Google Gemini (Direct or OpenRouter fallback)
      const geminiKey = (keys.gemini || '').trim();
      if (geminiKey.length > 5) {
        const geminiModel = 'gemini-2.0-flash';
        endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:streamGenerateContent?key=${geminiKey}&alt=sse`;
        body = {
          contents: sanitizedMessages.map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }],
          })),
          generationConfig: {
            temperature: thinkingLevel === 'High' ? 0.7 : 0.2,
          },
        };
      } else if (keys.openrouter) {
        endpoint = 'https://openrouter.ai/api/v1/chat/completions';
        headers['Authorization'] = `Bearer ${keys.openrouter}`;
        headers['HTTP-Referer'] = 'https://elytra.code';
        headers['X-Title'] = 'Elytra Code';
        body = {
          model: 'google/gemini-2.0-flash-001',
          messages: [{ role: 'system', content: sysPrompt }, ...sanitizedMessages],
          stream: true,
        };
      }
    } else if (model.includes('Llama') || targetModel.includes('llama')) {
      // 2.14 Llama 3.3 70B (Groq -> Cerebras -> SambaNova -> OpenRouter)
      if (keys.groq) {
        endpoint = 'https://api.groq.com/openai/v1/chat/completions';
        headers['Authorization'] = `Bearer ${keys.groq}`;
        body = {
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'system', content: sysPrompt }, ...sanitizedMessages],
          stream: true,
        };
      } else if (keys.cerebras) {
        endpoint = 'https://api.cerebras.ai/v1/chat/completions';
        headers['Authorization'] = `Bearer ${keys.cerebras}`;
        body = {
          model: 'llama3.3-70b',
          messages: [{ role: 'system', content: sysPrompt }, ...sanitizedMessages],
          stream: true,
        };
      } else if (keys.sambanova) {
        endpoint = 'https://api.sambanova.ai/v1/chat/completions';
        headers['Authorization'] = `Bearer ${keys.sambanova}`;
        body = {
          model: 'Meta-Llama-3.3-70B-Instruct',
          messages: [{ role: 'system', content: sysPrompt }, ...sanitizedMessages],
          stream: true,
        };
      } else if (keys.openrouter) {
        endpoint = 'https://openrouter.ai/api/v1/chat/completions';
        headers['Authorization'] = `Bearer ${keys.openrouter}`;
        headers['HTTP-Referer'] = 'https://elytra.code';
        headers['X-Title'] = 'Elytra Code';
        body = {
          model: 'meta-llama/llama-3.3-70b-instruct',
          messages: [{ role: 'system', content: sysPrompt }, ...sanitizedMessages],
          stream: true,
        };
      }
    } else if (keys.customEndpoint) {
      // 2.15 Custom Endpoint
      let customUrl = keys.customEndpoint.trim();
      if (!customUrl.endsWith('/chat/completions') && !customUrl.endsWith('/responses') && !customUrl.endsWith('/completions')) {
        customUrl = customUrl.replace(/\/$/, '') + '/chat/completions';
      }
      endpoint = customUrl;
      if (keys.customKey) headers['Authorization'] = `Bearer ${keys.customKey}`;
      let customTargetModel = keys.customModel?.trim() || (targetModel === 'custom-endpoint-model' ? 'default' : targetModel);
      body = {
        model: customTargetModel,
        messages: [{ role: 'system', content: sysPrompt }, ...sanitizedMessages],
        stream: true,
      };
    } else if (keys.openrouter) {
      // 2.16 General OpenRouter
      endpoint = 'https://openrouter.ai/api/v1/chat/completions';
      headers['Authorization'] = `Bearer ${keys.openrouter}`;
      headers['HTTP-Referer'] = 'https://elytra.code';
      headers['X-Title'] = 'Elytra Code';
      let orModel = targetModel;
      if (orModel === 'gemini-3.8-flash' || orModel === 'custom-endpoint-model') {
        orModel = 'nvidia/nemotron-3.5-lightning:free';
      }
      body = {
        model: orModel,
        messages: [{ role: 'system', content: sysPrompt }, ...sanitizedMessages],
        stream: true,
      };
    } else if (keys.ollamaUrl) {
      isOllama = true;
      endpoint = `${keys.ollamaUrl.replace(/\/$/, '')}/api/chat`;
      body = {
        model: targetModel,
        messages: sanitizedMessages,
        stream: true,
      };
    }

    try {
      if (!endpoint) {
        const isTurkish = /[çğıöşüÇĞİÖŞÜ]|\b(nasıl|nedir|nerede|çalıştır|yap|kod|hata|düzelt|ekle|aç|yardım|test|neden|öğren|bak|yaz|oluştur|bu|ile|ve)\b/i.test(lastUserMessage);
        const warningMsg = isTurkish
          ? `### Aktif Model Bağlantısı Bulunamadı\n\nElytra Code şu anda **${model}** için geçerli bir API anahtarına veya servis sağlayıcıya bağlı değil.\n\n**Bağlantı Kurmak İçin:**\n1. Sol alttaki **Ayarlar (Dişli Çark)** butonuna tıklayın.\n2. **API Keys** sekmesinden ilgili sağlayıcının anahtarını girin (veya **OpenCode Zen / Copilot OAuth / OpenRouter** bağlayın).\n3. Ayarları kaydedip tekrar mesaj gönderdiğinizde model doğrudan yanıt verecektir.`
          : `### No Active AI Model Connected\n\nElytra Code is not currently connected to an active API key or provider for **${model}**.\n\n**To connect:**\n1. Open **Settings > API Keys**.\n2. Configure your API key or OAuth connection for this provider.\n3. Save and resubmit your prompt.`;

        sendChunk({ chunk: warningMsg });
        sendChunk({ done: true });
        return warningMsg;
      }

      // Live Provider Fetch
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errText = await response.text();
        let errorMsg = `HTTP ${response.status} ${response.statusText || 'Error'}: ${errText.slice(0, 300)}`;
        try {
          const errObj = JSON.parse(errText);
          if (errObj.error?.message) {
            errorMsg = `[Sağlayıcı Yanıtı]: ${errObj.error.message}`;
          } else if (errObj.message) {
            errorMsg = `[Sağlayıcı Yanıtı]: ${errObj.message}`;
          }
        } catch {}
        sendChunk({ error: errorMsg });
        sendChunk({ done: true });
        return null;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let inReasoning = false;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value);

          if (isAnthropic) {
            const lines = text.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const parsed = JSON.parse(line.slice(6));
                  if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                    fullContent += parsed.delta.text;
                    sendChunk({ chunk: parsed.delta.text });
                  }
                } catch {}
              }
            }
          } else if (isOllama) {
            const lines = text.split('\n');
            for (const line of lines) {
              if (line.trim()) {
                try {
                  const parsed = JSON.parse(line);
                  if (parsed.message?.content) {
                    fullContent += parsed.message.content;
                    sendChunk({ chunk: parsed.message.content });
                  }
                } catch {}
              }
            }
          } else {
            // OpenAI / Gemini SSE / OpenRouter / DeepSeek / Groq standard SSE
            const lines = text.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                try {
                  const parsed = JSON.parse(line.slice(6));
                  const reasoningDelta =
                    parsed.choices?.[0]?.delta?.reasoning_content ||
                    parsed.choices?.[0]?.delta?.reasoning ||
                    '';
                  const contentDelta =
                    parsed.choices?.[0]?.delta?.content ||
                    parsed.candidates?.[0]?.content?.parts?.[0]?.text ||
                    '';

                  if (reasoningDelta) {
                    if (!inReasoning) {
                      inReasoning = true;
                      fullContent += '<think>\n';
                      sendChunk({ chunk: '<think>\n' });
                    }
                    fullContent += reasoningDelta;
                    sendChunk({ chunk: reasoningDelta });
                  }

                  if (contentDelta) {
                    if (inReasoning) {
                      inReasoning = false;
                      fullContent += '\n</think>\n\n';
                      sendChunk({ chunk: '\n</think>\n\n' });
                    }
                    fullContent += contentDelta;
                    sendChunk({ chunk: contentDelta });
                  }
                } catch {}
              }
            }
          }
        }
      }

      if (inReasoning) {
        inReasoning = false;
        fullContent += '\n</think>\n\n';
        sendChunk({ chunk: '\n</think>\n\n' });
      }

      sendChunk({ done: true });
      return fullContent;
    } catch (err: any) {
      console.error('AI chat error:', err);
      const userError = `Bağlantı Hatası: ${err.message || 'API servisine erişilemedi'}. Lütfen internet bağlantınızı ve API ayarlarınızı kontrol edin.`;
      sendChunk({ error: userError });
      sendChunk({ done: true });
      return userError;
    }
  });
}
