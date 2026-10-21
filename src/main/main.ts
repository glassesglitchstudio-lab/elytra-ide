import { app, BrowserWindow, ipcMain, dialog } from 'electron';
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
  defaultModel: 'Gemini 3.8 Flash',
  thinkingLevel: 'High',
  fontSize: 14,
  fontFamily: 'Inter',
  autoSave: true,
  terminalShell: process.platform === 'win32' ? 'powershell.exe' : 'bash',
  systemInstructions: 'You are Elythra Code, an expert software engineer and autonomous AI pair programmer.',
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
      '0.1-Pro (27B Çift Beyin)': 'gulmez-27b',
      '0.1-Pro (27B)': 'gulmez-27b',
      'Claude 3.5 Sonnet': 'anthropic/claude-3.5-sonnet',
      'DeepSeek V3': 'deepseek/deepseek-chat',
      'DeepSeek R1': 'deepseek/deepseek-r1',
      'Llama 3.3 70B': 'meta-llama/llama-3.3-70b-instruct',
      'GPT-4o': 'openai/gpt-4o',
      'Gemini 2.5 Flash': 'google/gemini-2.5-flash',
      'Gemini 2.0 Flash': 'google/gemini-2.5-flash',
      'gemini-3.8-flash': 'nvidia/nemotron-3.5-lightning:free',
    };

    const targetModel = MODEL_ID_MAP[model] || model;

    // 1. Direct BYOK Providers if key matches selected model
    if (keys.gemini && (model.toLowerCase().includes('gemini') || targetModel.includes('gemini')) && typeof keys.gemini === 'string' && keys.gemini.startsWith('AIzaSy')) {
      const geminiModel = 'gemini-2.0-flash';
      endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:streamGenerateContent?key=${keys.gemini}&alt=sse`;
      body = {
        contents: messages.map((m: any) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }],
        })),
        generationConfig: {
          temperature: thinkingLevel === 'High' ? 0.7 : 0.2,
        },
      };
    } else if (keys.anthropic && (model.toLowerCase().includes('claude') || targetModel.includes('claude'))) {
      isAnthropic = true;
      endpoint = 'https://api.anthropic.com/v1/messages';
      headers['x-api-key'] = keys.anthropic;
      headers['anthropic-version'] = '2023-06-01';
      body = {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        system: settings.systemInstructions,
        messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
        stream: true,
      };
    } else if (keys.deepseek && (model.toLowerCase().includes('deepseek') || targetModel.includes('deepseek'))) {
      endpoint = 'https://api.deepseek.com/v1/chat/completions';
      headers['Authorization'] = `Bearer ${keys.deepseek}`;
      body = {
        model: model.includes('r1') ? 'deepseek-reasoner' : 'deepseek-chat',
        messages: [{ role: 'system', content: settings.systemInstructions }, ...messages],
        stream: true,
      };
    } else if (keys.groq && (model.toLowerCase().includes('llama') || targetModel.includes('llama'))) {
      endpoint = 'https://api.groq.com/openai/v1/chat/completions';
      headers['Authorization'] = `Bearer ${keys.groq}`;
      body = {
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: settings.systemInstructions }, ...messages],
        stream: true,
      };
    } else if (keys.openai && (model.toLowerCase().includes('gpt') || targetModel.includes('gpt'))) {
      endpoint = 'https://api.openai.com/v1/chat/completions';
      headers['Authorization'] = `Bearer ${keys.openai}`;
      body = {
        model: model.includes('gpt') ? model : 'gpt-4o',
        messages: [{ role: 'system', content: settings.systemInstructions }, ...messages],
        stream: true,
      };
    } else if (keys.customEndpoint && (model.includes('0.1-Pro') || targetModel === 'gulmez-27b' || keys.customModel)) {
      endpoint = keys.customEndpoint;
      if (keys.customKey) headers['Authorization'] = `Bearer ${keys.customKey}`;
      body = {
        model: keys.customModel || 'gulmez-27b',
        messages: [{ role: 'system', content: settings.systemInstructions }, ...messages],
        stream: true,
      };
    } else if (keys.openrouter) {
      // 2. OpenRouter Hub (Universal BYOK Gateway)
      endpoint = 'https://openrouter.ai/api/v1/chat/completions';
      headers['Authorization'] = `Bearer ${keys.openrouter}`;
      headers['HTTP-Referer'] = 'https://elytra.code';
      headers['X-Title'] = 'Elytra Code';

      let orModel = targetModel;
      if (orModel === 'gulmez-27b' || orModel.includes('0.1-Pro') || orModel === 'gemini-3.8-flash') {
        orModel = 'nvidia/nemotron-3.5-lightning:free';
      }

      body = {
        model: orModel,
        messages: [{ role: 'system', content: settings.systemInstructions }, ...messages],
        stream: true,
      };
    } else if (keys.ollamaUrl) {
      isOllama = true;
      endpoint = `${keys.ollamaUrl.replace(/\/$/, '')}/api/chat`;
      body = {
        model: targetModel,
        messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
        stream: true,
      };
    }

    try {
      // If NO API key is supplied, do NOT fake responses. Inform the user clearly.
      if (!endpoint) {
        const isTurkish = /[çğıöşüÇĞİÖŞÜ]|\b(nasıl|nedir|nerede|çalıştır|yap|kod|hata|düzelt|ekle|aç|yardım|test|neden|öğren|bak|yaz|oluştur|bu|ile|ve)\b/i.test(lastUserMessage);
        const warningMsg = isTurkish
          ? `### Aktif Model Bağlantısı Bulunamadı\n\nElytra Code şu anda herhangi bir gerçek AI modeline veya API anahtarına bağlı değil.\n\n**Gerçek model yanıtları almak için:**\n1. Sol alttaki **Ayarlar (Dişli Çark)** butonuna tıklayın.\n2. **API Keys** sekmesinden bir sağlayıcı seçip anahtarınızı girin:\n   - **Google Gemini:** [Google AI Studio](https://aistudio.google.com/app/apikey) üzerinden ücretsiz anında API anahtarı alınabilir.\n   - **OpenRouter / Groq / Anthropic / OpenAI / DeepSeek:** Mevcut API anahtarınızı yapıştırabilirsiniz.\n   - **Gülmez & Çetiner 0.1-Pro (27B) / Özel Model:** Kaggle b98 vLLM tünelini veya yerel modelinizi **Custom Endpoint** alanına girebilirsiniz.\n   - **Ollama (Yerel):** \`http://localhost:11434\` adresini bağlayabilirsiniz.\n\nAnahtarınızı kaydedip tekrar mesaj gönderdiğinizde gerçek yapay zeka modeli doğrudan yanıt verecektir.`
          : `### No Active AI Model Connected\n\nElytra Code is not currently connected to any live AI model or API key.\n\n**To get real AI responses:**\n1. Click the **Settings (Gear icon)** in the bottom left.\n2. Under **API Keys**, configure a provider:\n   - **Google Gemini:** Free API keys available at [Google AI Studio](https://aistudio.google.com/app/apikey).\n   - **OpenRouter / Groq / Anthropic / OpenAI / DeepSeek:** Enter your API key.\n   - **0.1-Pro (27B) / Custom Endpoint:** Connect your Kaggle b98 vLLM tunnel or OpenAI-compatible server.\n   - **Local Model / Ollama:** Connect your local Ollama (\`http://localhost:11434\`).\n\nSave your settings and submit your prompt to receive real model completions.`;

        sendChunk({ chunk: warningMsg });
        sendChunk({ done: true });
        return warningMsg;
      }

      // Live Provider Fetch with Detailed Error Surfacing
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
          }
        } catch {}
        sendChunk({ error: errorMsg });
        sendChunk({ done: true });
        return errorMsg;
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
