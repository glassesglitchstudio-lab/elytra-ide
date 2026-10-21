import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  FileText,
  FileCode,
  FileJson,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  FlaskConical,
  Wand2,
} from 'lucide-react';
import type { FileItem } from '../../types/elythra';
import { useElythraStore } from '../store/useElythraStore';

interface FileTreeProps {
  items: FileItem[];
}

export const FileTree: React.FC<FileTreeProps> = ({ items }) => {
  const {
    openFileTab,
    activeProject,
    refreshFileTree,
    setActiveView,
    setSidebarTab,
    sendMessage,
  } = useElythraStore();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: FileItem } | null>(null);

  const toggleExpand = async (item: FileItem) => {
    if (!item.isDirectory) {
      await openFileTab(item.path);
      return;
    }

    const nextState = !expanded[item.path];
    setExpanded((prev) => ({ ...prev, [item.path]: nextState }));

    // If expanding and doesn't have children loaded yet, load children
    if (nextState && !item.children && window.elythraAPI) {
      const children = await window.elythraAPI.readDirectory(item.path);
      item.children = children;
      useElythraStore.setState({}); // trigger re-render
    }
  };

  const getFileIcon = (item: FileItem) => {
    if (item.isDirectory) {
      return expanded[item.path] ? (
        <FolderOpen size={14} className="text-[#8a8a8a] flex-shrink-0" />
      ) : (
        <Folder size={14} className="text-[#8a8a8a] flex-shrink-0" />
      );
    }
    const ext = item.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx':
      case 'js':
      case 'jsx':
      case 'py':
      case 'rs':
      case 'html':
      case 'css':
        return <FileCode size={14} className="text-[#8a8a8a] flex-shrink-0" />;
      case 'json':
        return <FileJson size={14} className="text-[#8a8a8a] flex-shrink-0" />;
      default:
        return <FileText size={14} className="text-[#8a8a8a] flex-shrink-0" />;
    }
  };

  const handleContextMenu = (e: React.MouseEvent, item: FileItem) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, item });
  };

  const handleCreateFile = async (parentPath: string) => {
    const fileName = prompt('Enter new file name:');
    if (!fileName || !window.elythraAPI) return;
    const newPath = `${parentPath}/${fileName}`;
    await window.elythraAPI.createFile(newPath);
    await refreshFileTree();
    setContextMenu(null);
  };

  const handleCreateFolder = async (parentPath: string) => {
    const folderName = prompt('Enter new folder name:');
    if (!folderName || !window.elythraAPI) return;
    const newPath = `${parentPath}/${folderName}`;
    await window.elythraAPI.createDirectory(newPath);
    await refreshFileTree();
    setContextMenu(null);
  };

  const handleDelete = async (targetPath: string) => {
    if (!confirm('Are you sure you want to delete this?') || !window.elythraAPI) return;
    await window.elythraAPI.deletePath(targetPath);
    await refreshFileTree();
    setContextMenu(null);
  };

  const handleAIFileAction = async (item: FileItem, type: 'explain' | 'test' | 'refactor') => {
    setContextMenu(null);
    if (!window.elythraAPI) return;
    try {
      const content = await window.elythraAPI.readFile(item.path);
      if (!content) return;
      const ext = item.name.split('.').pop() || 'plaintext';
      let prompt = '';
      if (type === 'explain') {
        prompt = `Aşağıdaki dosyanın (${item.name}) mimarisini, ne işe yaradığını ve çalışma mantığını detaylı olarak açıkla:\n\n\`\`\`${ext}\n${content.slice(0, 5000)}\n\`\`\``;
      } else if (type === 'test') {
        prompt = `Aşağıdaki dosya (${item.name}) için kapsamlı birim testleri (unit tests) ve edge case senaryoları yaz:\n\n\`\`\`${ext}\n${content.slice(0, 5000)}\n\`\`\``;
      } else if (type === 'refactor') {
        prompt = `Aşağıdaki dosyayı (${item.name}) temiz kod (clean code) prensiplerine göre optimize et, performansını artır ve refactor edilmiş sürümünü sun:\n\n\`\`\`${ext}\n${content.slice(0, 5000)}\n\`\`\``;
      }

      setActiveView('studio');
      setSidebarTab('chat');
      sendMessage(prompt);
    } catch (err) {
      console.error('File AI action error:', err);
    }
  };

  const renderTree = (nodes: FileItem[], level = 0) => {
    return nodes.map((node) => {
      const isExp = expanded[node.path];

      return (
        <div key={node.path}>
          <div
            onClick={() => toggleExpand(node)}
            onContextMenu={(e) => handleContextMenu(e, node)}
            style={{ paddingLeft: `${level * 12 + 8}px` }}
            className="flex items-center gap-1.5 py-1 pr-2 text-[13px] text-[#8a8a8a] hover:text-[#e5e5e5] hover:bg-[#1a1a1a] rounded-sm cursor-pointer select-none transition-colors"
          >
            {node.isDirectory ? (
              <span className="w-3 flex items-center justify-center">
                {isExp ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              </span>
            ) : (
              <span className="w-3" />
            )}
            {getFileIcon(node)}
            <span className="truncate">{node.name}</span>
          </div>

          {node.isDirectory && isExp && node.children && (
            <div>{renderTree(node.children, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="w-64 h-full bg-[#0f0f0f] border-r border-[#1f1f1f] flex flex-col select-none flex-shrink-0">
      <div className="h-9 px-3 border-b border-[#1f1f1f] flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-[#8a8a8a] truncate">
          {activeProject?.name || 'EXPLORER'}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => activeProject && handleCreateFile(activeProject.path)}
            className="p-1 text-[#8a8a8a] hover:text-[#e5e5e5] hover:bg-[#1f1f1f] rounded"
            title="New File"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {items.length === 0 ? (
          <div className="p-4 text-center text-[12px] text-[#8a8a8a]">
            Empty workspace
          </div>
        ) : (
          renderTree(items)
        )}
      </div>

      {/* Sağ Tık Menüsü */}
      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed bg-[#161616] border border-[#262626] rounded-xl py-1 shadow-2xl z-50 w-52 text-[12px]"
          onMouseLeave={() => setContextMenu(null)}
        >
          {contextMenu.item.isDirectory ? (
            <>
              <button
                onClick={() => handleCreateFile(contextMenu.item.path)}
                className="w-full text-left px-3 py-1.5 text-[#e5e5e5] hover:bg-[#2a2a2a] flex items-center gap-2"
              >
                <Plus size={13} /> New File
              </button>
              <button
                onClick={() => handleCreateFolder(contextMenu.item.path)}
                className="w-full text-left px-3 py-1.5 text-[#e5e5e5] hover:bg-[#2a2a2a] flex items-center gap-2"
              >
                <Folder size={13} /> New Folder
              </button>
              <div className="my-1 border-t border-[#1f1f1f]" />
            </>
          ) : (
            <>
              <button
                onClick={() => handleAIFileAction(contextMenu.item, 'explain')}
                className="w-full text-left px-3 py-1.5 text-sky-400 hover:bg-[#2a2a2a] flex items-center gap-2 font-medium"
              >
                <Sparkles size={13} /> Elytra ile Açıkla
              </button>
              <button
                onClick={() => handleAIFileAction(contextMenu.item, 'test')}
                className="w-full text-left px-3 py-1.5 text-[#e5e5e5] hover:bg-[#2a2a2a] flex items-center gap-2"
              >
                <FlaskConical size={13} /> Birim Testleri Üret
              </button>
              <button
                onClick={() => handleAIFileAction(contextMenu.item, 'refactor')}
                className="w-full text-left px-3 py-1.5 text-[#e5e5e5] hover:bg-[#2a2a2a] flex items-center gap-2"
              >
                <Wand2 size={13} /> Kodu Optimize Et
              </button>
              <div className="my-1 border-t border-[#1f1f1f]" />
            </>
          )}
          <button
            onClick={() => handleDelete(contextMenu.item.path)}
            className="w-full text-left px-3 py-1.5 text-red-400 hover:bg-[#2a2a2a] flex items-center gap-2"
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      )}
    </div>
  );
};
