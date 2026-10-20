import React, { useState } from 'react';
import {
  PanelLeftClose,
  ArrowLeft,
  ArrowRight,
  Search,
  Plus,
  History,
  Clock,
  Layers,
  Folder,
  FolderPlus,
  Filter,
  Settings,
  Trash2,
} from 'lucide-react';
import { ElythraLogo } from './icons/ElythraLogo';
import { useElythraStore } from '../store/useElythraStore';

export const Sidebar: React.FC = () => {
  const {
    sidebarTab,
    setSidebarTab,
    isSidebarOpen,
    toggleSidebar,
    sidebarWidth,
    setSidebarWidth,
    projects,
    openProject,
    activeProject,
    closeProject,
    conversations,
    activeConversationId,
    selectConversation,
    deleteConversation,
    setActiveModal,
  } = useElythraStore();

  const [projectFilter, setProjectFilter] = useState('');
  const [showFilterInput, setShowFilterInput] = useState(false);

  if (!isSidebarOpen) return null;

  const handleAddNewProject = async () => {
    if (!window.elythraAPI) return;
    const folder = await window.elythraAPI.openDirectoryDialog();
    if (folder) {
      await openProject(folder);
    }
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(projectFilter.toLowerCase())
  );

  return (
    <aside
      style={{ width: `${sidebarWidth}px` }}
      className="h-[calc(100vh-44px)] bg-[#0f0f0f] border-r border-[#1f1f1f] flex flex-col select-none relative z-20 flex-shrink-0"
    >
      {/* 1. En Üstte İkon Sırası: logo, panel aç/kapa, geri oku, ileri oku, arama ikonu */}
      <div className="h-10 px-3 border-b border-[#1f1f1f] flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              closeProject();
              setSidebarTab('new-chat');
            }}
            className="p-1.5 hover:bg-[#2a2a2a] rounded-btn text-white transition-colors"
            title="Elythra Home"
          >
            <ElythraLogo size={16} />
          </button>
          <button
            onClick={toggleSidebar}
            className="p-1.5 text-[#8a8a8a] hover:text-[#e5e5e5] hover:bg-[#2a2a2a] rounded-btn transition-colors"
            title="Toggle Sidebar"
          >
            <PanelLeftClose size={16} />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            className="p-1.5 text-[#8a8a8a] hover:text-[#e5e5e5] hover:bg-[#2a2a2a] rounded-btn transition-colors"
            title="Back"
          >
            <ArrowLeft size={15} />
          </button>
          <button
            className="p-1.5 text-[#8a8a8a] hover:text-[#e5e5e5] hover:bg-[#2a2a2a] rounded-btn transition-colors"
            title="Forward"
          >
            <ArrowRight size={15} />
          </button>
          <button
            onClick={() => setActiveModal('command-palette')}
            className="p-1.5 text-[#8a8a8a] hover:text-[#e5e5e5] hover:bg-[#2a2a2a] rounded-btn transition-colors"
            title="Search Workspace"
          >
            <Search size={15} />
          </button>
        </div>
      </div>

      {/* 2. Dikey Menü (İkon + Yazı) */}
      <div className="p-2 space-y-1 border-b border-[#1f1f1f]">
        <button
          onClick={() => setSidebarTab('new-chat')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] rounded-btn font-medium transition-colors ${
            sidebarTab === 'new-chat' && !activeProject
              ? 'bg-[#2a2a2a] text-[#e5e5e5]'
              : 'text-[#8a8a8a] hover:text-[#e5e5e5] hover:bg-[#1a1a1a]'
          }`}
        >
          <Plus size={16} />
          <span>New Conversation</span>
        </button>

        <button
          onClick={() => setSidebarTab('history')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] rounded-btn font-medium transition-colors ${
            sidebarTab === 'history'
              ? 'bg-[#2a2a2a] text-[#e5e5e5]'
              : 'text-[#8a8a8a] hover:text-[#e5e5e5] hover:bg-[#1a1a1a]'
          }`}
        >
          <History size={16} />
          <span>Conversation History</span>
        </button>

        <button
          onClick={() => setSidebarTab('automations')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] rounded-btn font-medium transition-colors ${
            sidebarTab === 'automations'
              ? 'bg-[#2a2a2a] text-[#e5e5e5]'
              : 'text-[#8a8a8a] hover:text-[#e5e5e5] hover:bg-[#1a1a1a]'
          }`}
        >
          <Clock size={16} />
          <span>Automations</span>
        </button>

        <button
          onClick={() => setSidebarTab('customizations')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] rounded-btn font-medium transition-colors ${
            sidebarTab === 'customizations'
              ? 'bg-[#2a2a2a] text-[#e5e5e5]'
              : 'text-[#8a8a8a] hover:text-[#e5e5e5] hover:bg-[#1a1a1a]'
          }`}
        >
          <Layers size={16} />
          <span>Customizations</span>
        </button>
      </div>

      {/* 3. Projects Bölümü */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-[#8a8a8a]">
            Projects
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowFilterInput(!showFilterInput)}
              className="p-1 text-[#8a8a8a] hover:text-[#e5e5e5] hover:bg-[#1f1f1f] rounded-btn transition-colors"
              title="Filter Projects"
            >
              <Filter size={13} />
            </button>
            <button
              onClick={handleAddNewProject}
              className="p-1 text-[#8a8a8a] hover:text-[#e5e5e5] hover:bg-[#1f1f1f] rounded-btn transition-colors"
              title="Add Existing Folder"
            >
              <FolderPlus size={14} />
            </button>
          </div>
        </div>

        {showFilterInput && (
          <div className="px-2 mb-2">
            <input
              type="text"
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              placeholder="Filter..."
              className="w-full bg-[#161616] border border-[#262626] rounded-btn px-2 py-1 text-[12px] text-[#e5e5e5] focus:outline-none"
              autoFocus
            />
          </div>
        )}

        {/* Proje Listesi */}
        <div className="space-y-1">
          {filteredProjects.length === 0 ? (
            <div className="px-3 py-4 text-center">
              <p className="text-[12px] text-[#8a8a8a]">No projects added</p>
              <button
                onClick={handleAddNewProject}
                className="mt-2 text-[11px] text-[#e5e5e5] underline hover:text-white"
              >
                Open a folder
              </button>
            </div>
          ) : (
            filteredProjects.map((p) => {
              const isSelected = activeProject?.path === p.path;
              const projectConvos = conversations.filter((c) => c.projectId === p.id);

              return (
                <div
                  key={p.id}
                  className={`group rounded-btn transition-colors ${
                    isSelected ? 'bg-[#2a2a2a]' : 'hover:bg-[#161616]'
                  }`}
                >
                  <div
                    onClick={() => openProject(p.path)}
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer"
                  >
                    <Folder size={15} className={isSelected ? 'text-white' : 'text-[#8a8a8a]'} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-[#e5e5e5] truncate">
                        {p.name}
                      </div>
                      <div className="text-[11px] text-[#8a8a8a] truncate">
                        {projectConvos.length > 0
                          ? `${projectConvos.length} conversation${projectConvos.length > 1 ? 's' : ''}`
                          : 'No conversations yet'}
                      </div>
                    </div>
                  </div>

                  {/* Projenin altındaki sohbetler */}
                  {isSelected && projectConvos.length > 0 && (
                    <div className="pl-7 pr-2 pb-2 space-y-0.5">
                      {projectConvos.slice(0, 3).map((convo) => (
                        <div
                          key={convo.id}
                          onClick={() => selectConversation(convo.id)}
                          className={`flex items-center justify-between px-2 py-1 text-[12px] rounded cursor-pointer ${
                            activeConversationId === convo.id
                              ? 'bg-[#333333] text-white'
                              : 'text-[#8a8a8a] hover:text-[#e5e5e5] hover:bg-[#222222]'
                          }`}
                        >
                          <span className="truncate">{convo.title}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteConversation(convo.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-0.5"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 4. En Altta: Settings (Dişli İkonuyla) */}
      <div className="p-2 border-t border-[#1f1f1f]">
        <button
          onClick={() => setActiveModal('settings')}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#8a8a8a] hover:text-[#e5e5e5] hover:bg-[#1a1a1a] rounded-btn transition-colors font-medium"
        >
          <Settings size={16} />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
};
