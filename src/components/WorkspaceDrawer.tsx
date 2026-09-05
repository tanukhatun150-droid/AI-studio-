import React from 'react';
import {
  X,
  Plus,
  Package,
  Database,
  Cloud,
  GitBranch,
  GitPullRequest,
  Terminal,
  Monitor,
  CheckSquare,
  RefreshCw,
  Folder,
  FileCode,
  BookOpen,
  Settings,
  ChevronRight,
  ShieldCheck,
  History,
  MessageSquare,
  Trash2,
  FolderGit2,
  Smartphone,
} from 'lucide-react';
import { AgentPersona, WorkspaceFile, WorkspaceTool, ChatSession } from '../types';

interface WorkspaceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  agents: AgentPersona[];
  activeAgentId: string;
  onSelectAgent: (id: string) => void;
  tools: WorkspaceTool[];
  onSelectTool: (tool: WorkspaceTool) => void;
  files: WorkspaceFile[];
  onSelectFile: (file: WorkspaceFile) => void;
  onRefreshFiles: () => void;
  isRefreshingFiles: boolean;
  onNewChat: () => void;
  onOpenTasks: () => void;
  onOpenMemory: () => void;
  onOpenSettings: () => void;
  onOpenRecent?: () => void;
  onOpenGitHub?: () => void;
  connectedGithubUser?: string | null;
  isMobileFrame?: boolean;
  onToggleFrame?: () => void;
  activeTaskCount?: number;
  sessions?: ChatSession[];
  currentSessionId?: string;
  onSelectSession?: (sessionId: string) => void;
  onDeleteSession?: (sessionId: string) => void;
}

export function WorkspaceDrawer({
  isOpen,
  onClose,
  agents,
  activeAgentId,
  onSelectAgent,
  tools,
  onSelectTool,
  files,
  onSelectFile,
  onRefreshFiles,
  isRefreshingFiles,
  onNewChat,
  onOpenTasks,
  onOpenMemory,
  onOpenSettings,
  onOpenRecent,
  onOpenGitHub,
  connectedGithubUser,
  isMobileFrame = false,
  onToggleFrame,
  activeTaskCount = 0,
  sessions = [],
  currentSessionId,
  onSelectSession,
  onDeleteSession,
}: WorkspaceDrawerProps) {
  if (!isOpen) return null;

  const renderToolIcon = (iconName: string) => {
    switch (iconName) {
      case 'FolderGit2':
        return <FolderGit2 className="w-4 h-4 text-[#a8c7fa]" />;
      case 'Package':
        return <Package className="w-4 h-4 text-[#a8c7fa]" />;
      case 'Database':
        return <Database className="w-4 h-4 text-[#a8c7fa]" />;
      case 'Cloud':
        return <Cloud className="w-4 h-4 text-[#a8c7fa]" />;
      case 'GitBranch':
        return <GitBranch className="w-4 h-4 text-[#a8c7fa]" />;
      case 'GitPullRequest':
        return <GitPullRequest className="w-4 h-4 text-[#a8c7fa]" />;
      case 'Terminal':
        return <Terminal className="w-4 h-4 text-[#a8c7fa]" />;
      case 'Monitor':
        return <Monitor className="w-4 h-4 text-[#a8c7fa]" />;
      default:
        return <Package className="w-4 h-4 text-[#a8c7fa]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div className="relative w-full max-w-[340px] bg-[#1e1f20] border-r border-[#333538] text-[#e3e3e3] flex flex-col h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#333538]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#a8c7fa] to-[#3b82f6] flex items-center justify-center text-[#111216] font-bold text-xs shadow-md">
              CP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white tracking-tight">CodePilot AI</h2>
                {connectedGithubUser && (
                  <span className="text-[10px] bg-[#34a853]/20 border border-[#34a853]/40 text-[#81c995] px-1.5 py-0.5 rounded-full font-mono">
                    @{connectedGithubUser}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#8e918f]">Intelligent Workspace</p>
            </div>
          </div>
          <button
            id="btn-close-drawer"
            onClick={onClose}
            aria-label="Close workspace menu"
            className="p-1.5 rounded-lg hover:bg-[#282a2c] text-[#8e918f] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-5 custom-scrollbar">
          {/* New Chat Button (minHeight 48, borderRadius 24, paddingHorizontal 17) */}
          <button
            id="btn-drawer-new-chat"
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full min-h-[48px] rounded-[24px] bg-[#282a2c] hover:bg-[#333538] text-white flex items-center px-[17px] gap-3 transition-all cursor-pointer shadow-sm active:scale-[0.98] border border-[#333538]"
          >
            <Plus className="w-5 h-5 text-[#a8c7fa]" />
            <span className="font-medium text-[15px]">New Chat</span>
          </button>

          {/* RECENT CHATS Section */}
          <div>
            <div className="px-2 mb-1.5 flex items-center justify-between">
              <span className="text-[10px] font-medium tracking-[0.5px] text-[#8e918f] uppercase flex items-center gap-1.5">
                <History className="w-3 h-3 text-[#a8c7fa]" />
                RECENT CHATS
              </span>
              <div className="flex items-center gap-2">
                {sessions.length > 0 && (
                  <span className="text-[10px] text-[#8e918f] font-mono">
                    {sessions.length}
                  </span>
                )}
                {onOpenRecent && sessions.length > 0 && (
                  <button
                    onClick={() => {
                      onOpenRecent();
                      onClose();
                    }}
                    className="text-[10px] text-[#a8c7fa] hover:underline cursor-pointer font-medium"
                  >
                    View All
                  </button>
                )}
              </div>
            </div>

            {sessions.length === 0 ? (
              <div className="px-3 py-2.5 rounded-xl bg-[#282a2c]/40 border border-[#333538]/40 text-center">
                <p className="text-xs text-[#8e918f]">No recent chats yet</p>
                <p className="text-[10px] text-[#8e918f]/70 mt-0.5">Your conversations will be saved here</p>
              </div>
            ) : (
              <div className="space-y-1">
                {sessions.slice(0, 6).map((session) => {
                  const isCurrent = session.id === currentSessionId;
                  return (
                    <div
                      key={session.id}
                      className={`group w-full flex items-center justify-between px-2.5 py-2 rounded-xl transition-all text-left ${
                        isCurrent
                          ? 'bg-[#282a2c] border border-[#a8c7fa]/40 text-white'
                          : 'hover:bg-[#282a2c]/70 text-[#e3e3e3]'
                      }`}
                    >
                      <button
                        onClick={() => {
                          onSelectSession?.(session.id);
                          onClose();
                        }}
                        className="flex-1 min-w-0 text-left cursor-pointer flex items-center gap-2"
                      >
                        <MessageSquare
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isCurrent ? 'text-[#a8c7fa]' : 'text-[#8e918f]'
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium truncate">
                            {session.title}
                          </div>
                          <div className="text-[10px] text-[#8e918f] flex items-center gap-1.5 mt-0.5">
                            <span>{session.updatedAt}</span>
                            <span>•</span>
                            <span>{session.messages.length} msgs</span>
                          </div>
                        </div>
                      </button>
                      {onDeleteSession && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSession(session.id);
                          }}
                          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-[#8e918f] hover:text-red-400 transition-all cursor-pointer"
                          title="Delete chat"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* AI AGENTS Section */}
          <div>
            <div className="px-2 mb-1.5 flex items-center justify-between">
              <span className="text-[10px] font-medium tracking-[0.5px] text-[#8e918f] uppercase">
                AI AGENTS
              </span>
              <span className="text-[10px] text-[#34a853] font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34a853]" />
                Interactive
              </span>
            </div>
            <div className="space-y-1">
              {agents.map((agent) => {
                const isActive = agent.id === activeAgentId;
                return (
                  <button
                    key={agent.id}
                    id={`agent-${agent.id}`}
                    onClick={() => onSelectAgent(agent.id)}
                    className={`w-full min-h-[44px] rounded-[22px] flex items-center px-2.5 gap-2.5 transition-all text-left cursor-pointer border ${
                      isActive
                        ? 'bg-[#282a2c] border-[#3b82f6]/50 shadow-sm'
                        : 'bg-transparent border-transparent hover:bg-[#282a2c]/60'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[9px] text-[#111216] shrink-0"
                      style={{ backgroundColor: agent.tint }}
                    >
                      {agent.initials}
                    </div>
                    <span className="flex-1 text-[14px] text-[#e3e3e3] font-normal truncate">
                      {agent.name}
                    </span>
                    <span
                      className={`text-[10px] rounded-[10px] px-2 py-0.5 shrink-0 ${
                        isActive
                          ? 'bg-[#34a853]/20 text-[#34a853] font-medium'
                          : 'bg-[#282a2c] text-[#8e918f]'
                      }`}
                    >
                      {isActive ? 'Active' : 'Idle'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* WORKSPACE TOOLS Section */}
          <div>
            <div className="px-2 mb-1.5">
              <span className="text-[10px] font-medium tracking-[0.5px] text-[#8e918f] uppercase">
                WORKSPACE TOOLS
              </span>
            </div>
            <div className="space-y-0.5">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  id={`tool-${tool.id}`}
                  onClick={() => {
                    onSelectTool(tool);
                    onClose();
                  }}
                  className="w-full min-h-[42px] flex items-center gap-3 px-2 rounded-xl hover:bg-[#282a2c] text-left transition-colors group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#282a2c] group-hover:bg-[#333538] flex items-center justify-center transition-colors shrink-0">
                    {renderToolIcon(tool.iconName)}
                  </div>
                  <span className="flex-1 text-[14px] text-[#e3e3e3] group-hover:text-white font-normal truncate">
                    {tool.label}
                  </span>
                  {tool.detail && (
                    <span className="text-[10px] text-[#8e918f] bg-[#282a2c] px-2 py-0.5 rounded-[10px] shrink-0">
                      {tool.detail}
                    </span>
                  )}
                </button>
              ))}

              {/* Task Manager Row */}
              <button
                id="drawer-task-manager"
                onClick={() => {
                  onOpenTasks();
                  onClose();
                }}
                className="w-full min-h-[42px] flex items-center gap-3 px-2 rounded-xl hover:bg-[#282a2c] text-left transition-colors group cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-[#282a2c] group-hover:bg-[#333538] flex items-center justify-center shrink-0">
                  <CheckSquare className="w-4 h-4 text-[#a8c7fa]" />
                </div>
                <span className="flex-1 text-[14px] text-[#e3e3e3] group-hover:text-white font-normal">
                  Task manager
                </span>
                <ChevronRight className="w-4 h-4 text-[#8e918f] group-hover:text-white transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>

          {/* WORKSPACE FILES Section */}
          <div>
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-[11px] font-semibold tracking-wider text-[#8e918f] uppercase">
                FILES
              </span>
              <button
                id="btn-refresh-files"
                onClick={onRefreshFiles}
                disabled={isRefreshingFiles}
                title="Refresh workspace files"
                className="p-1 rounded hover:bg-[#282a2c] text-[#8e918f] hover:text-white transition-colors cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isRefreshingFiles ? 'animate-spin text-[#a8c7fa]' : ''}`}
                />
              </button>
            </div>
            <div className="space-y-1">
              {files.map((file) => (
                <button
                  key={file.id}
                  id={`file-${file.id}`}
                  onClick={() => {
                    onSelectFile(file);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#282a2c] text-left transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {file.type === 'directory' ? (
                      <Folder className="w-3.5 h-3.5 text-[#fbbc04] shrink-0" />
                    ) : (
                      <FileCode className="w-3.5 h-3.5 text-[#a8c7fa] shrink-0" />
                    )}
                    <span className="text-xs font-mono text-[#e3e3e3] truncate group-hover:text-white">
                      {file.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {file.size && (
                      <span className="text-[10px] text-[#8e918f] font-mono">
                        {file.size < 1024
                          ? `${file.size}B`
                          : `${(file.size / 1024).toFixed(1)}K`}
                      </span>
                    )}
                    <ChevronRight className="w-3 h-3 text-[#8e918f] group-hover:text-white" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Drawer Footer Actions matching index.tsx sheetFooter */}
        <div className="px-5 py-3.5 border-t border-[#333538] bg-[#1e1f20] flex items-center justify-between">
          <button
            id="drawer-footer-memory"
            onClick={() => {
              onOpenMemory();
              onClose();
            }}
            className="flex items-center gap-1.5 p-1 text-[#8e918f] hover:text-[#e3e3e3] text-[12px] font-medium transition-colors cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-[#8e918f]" />
            <span>Memory</span>
          </button>

          {onToggleFrame && (
            <button
              id="drawer-footer-frame"
              onClick={() => {
                onToggleFrame();
                onClose();
              }}
              title={isMobileFrame ? 'Switch to Desktop canvas' : 'Switch to Mobile frame'}
              className="flex items-center gap-1.5 p-1 text-[#8e918f] hover:text-[#e3e3e3] text-[12px] font-medium transition-colors cursor-pointer"
            >
              <Smartphone className="w-4 h-4 text-[#8e918f]" />
              <span>{isMobileFrame ? 'Desktop' : 'Mobile'}</span>
            </button>
          )}

          <button
            id="drawer-footer-settings"
            onClick={() => {
              onOpenSettings();
              onClose();
            }}
            className="flex items-center gap-1.5 p-1 text-[#8e918f] hover:text-[#e3e3e3] text-[12px] font-medium transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4 text-[#8e918f]" />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
