import React, { useState } from 'react';
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
  Download,
  GitFork,
  ArrowDownToLine,
  Loader2,
  Bot,
  Radio,
  LogIn,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { AgentPersona, WorkspaceFile, WorkspaceTool, ChatSession, UserProfile } from '../types';

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
  isJarvisMode?: boolean;
  onToggleJarvisMode?: () => void;
  activeTaskCount?: number;
  sessions?: ChatSession[];
  currentSessionId?: string;
  onSelectSession?: (sessionId: string) => void;
  onDeleteSession?: (sessionId: string) => void;
  currentUser?: UserProfile | null;
  onOpenAuth?: () => void;
  onSignOut?: () => void;
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
  isJarvisMode = false,
  onToggleJarvisMode,
  activeTaskCount = 0,
  sessions = [],
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  currentUser,
  onOpenAuth,
  onSignOut,
}: WorkspaceDrawerProps) {
  const [showGitImport, setShowGitImport] = useState(false);
  const [gitRepoUrl, setGitRepoUrl] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  const [cloneStatus, setCloneStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCloneRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gitRepoUrl.trim()) return;
    setIsCloning(true);
    setCloneStatus('Cloning repository into workspace...');
    try {
      const res = await fetch('/api/github/clone-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: gitRepoUrl.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setCloneStatus(`✓ ${data.message}`);
        setGitRepoUrl('');
        onRefreshFiles();
        setTimeout(() => setCloneStatus(null), 4000);
      } else {
        setCloneStatus(`✗ ${data.error || 'Clone failed'}`);
      }
    } catch (err: unknown) {
      setCloneStatus(`✗ ${err instanceof Error ? err.message : 'Network error'}`);
    } finally {
      setIsCloning(false);
    }
  };

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
          {/* User Account / Sign In Status Card */}
          {currentUser ? (
            <div
              id="drawer-user-card"
              className="p-3 rounded-2xl bg-[#282a2c]/80 border border-[#383b42] flex items-center justify-between gap-3 shadow-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={
                    currentUser.avatar ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.email}`
                  }
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full bg-zinc-800 object-cover border border-sky-500/30 shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                    <span className="truncate">{currentUser.name}</span>
                    <span className="text-[10px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-1 py-0.2 rounded font-normal shrink-0 flex items-center gap-0.5">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      OTP Verified
                    </span>
                  </div>
                  <div className="text-[11px] text-[#8e918f] truncate">{currentUser.email}</div>
                </div>
              </div>

              <button
                id="btn-drawer-sign-out"
                onClick={() => {
                  if (onSignOut) onSignOut();
                }}
                title="Sign Out"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              id="drawer-guest-login-card"
              className="p-3 rounded-2xl bg-gradient-to-r from-sky-950/40 to-indigo-950/40 border border-sky-500/30 shadow-xs"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-sky-400" />
                  <span>Account & Cloud Sync</span>
                </div>
                <span className="text-[10px] text-sky-300 font-mono bg-sky-500/20 px-1.5 py-0.5 rounded">
                  OTP Ready
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mb-2.5 leading-relaxed">
                Sign in with Google, GitHub, or Email OTP to sync workspaces across devices.
              </p>
              <button
                id="btn-drawer-login"
                onClick={() => {
                  onClose();
                  if (onOpenAuth) onOpenAuth();
                }}
                className="w-full h-8 flex items-center justify-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Create Account</span>
              </button>
            </div>
          )}

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

          {/* Floating Assistant Mode (Jarvis Mobile Mode) */}
          {onToggleJarvisMode && (
            <button
              id="btn-drawer-jarvis-mode"
              onClick={() => {
                onToggleJarvisMode();
                onClose();
              }}
              className="w-full p-3 rounded-2xl bg-gradient-to-r from-cyan-950/60 to-blue-950/60 hover:from-cyan-900/60 hover:to-blue-900/60 border border-cyan-500/40 text-left transition-all cursor-pointer shadow-md group active:scale-[0.98]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 group-hover:scale-105 transition-transform">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Jarvis Floating Assistant</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                        APK
                      </span>
                    </div>
                    <div className="text-[11px] text-cyan-200/70">
                      Collapse IDE into floating circular avatar
                    </div>
                  </div>
                </div>
                <Radio className={`w-4 h-4 ${isJarvisMode ? 'text-cyan-400 animate-pulse' : 'text-[#8e918f]'}`} />
              </div>
            </button>
          )}

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
              <div className="flex items-center gap-1">
                {/* Download Workspace as ZIP */}
                <a
                  id="btn-download-workspace-zip"
                  href="/api/workspace/zip"
                  download="codepilot-workspace.zip"
                  title="Download entire project as ZIP"
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#282a2c] hover:bg-[#333538] text-[10px] text-[#a8c7fa] hover:text-white border border-[#333538] transition-colors cursor-pointer"
                >
                  <Download className="w-3 h-3 text-[#a8c7fa]" />
                  <span>ZIP</span>
                </a>

                {/* Toggle GitHub Repo Import */}
                <button
                  id="btn-toggle-git-import"
                  onClick={() => setShowGitImport(!showGitImport)}
                  title="Import code from GitHub"
                  className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors cursor-pointer text-[10px] ${
                    showGitImport
                      ? 'bg-[#34a853]/20 border-[#34a853] text-[#81c995]'
                      : 'bg-[#282a2c] hover:bg-[#333538] border-[#333538] text-[#c4c7c5] hover:text-white'
                  }`}
                >
                  <GitFork className="w-3 h-3 text-[#81c995]" />
                  <span>Import</span>
                </button>

                {/* Refresh files list */}
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
            </div>

            {/* GitHub Import Card */}
            {showGitImport && (
              <form
                onSubmit={handleCloneRepo}
                className="mb-3 p-2.5 rounded-xl bg-[#14161b] border border-[#333538] space-y-2 animate-in fade-in"
              >
                <div className="flex items-center justify-between text-[11px] font-medium text-[#e3e3e3]">
                  <span className="flex items-center gap-1.5 text-[#81c995]">
                    <GitFork className="w-3.5 h-3.5" />
                    Import from GitHub
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowGitImport(false)}
                    className="text-[#8e918f] hover:text-white text-[10px]"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-[10px] text-[#8e918f]">
                  Paste any public GitHub repository URL to clone it into your workspace:
                </p>
                <input
                  type="text"
                  placeholder="https://github.com/owner/repo"
                  value={gitRepoUrl}
                  onChange={(e) => setGitRepoUrl(e.target.value)}
                  disabled={isCloning}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[#1e2026] border border-[#3b3d45] text-white placeholder-[#6e7178] focus:outline-none focus:border-[#81c995]"
                />
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="submit"
                    disabled={isCloning || !gitRepoUrl.trim()}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[#23432e] hover:bg-[#2e573c] disabled:opacity-50 text-[#81c995] hover:text-white font-medium text-xs border border-[#34a853]/40 transition-colors cursor-pointer"
                  >
                    {isCloning ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Cloning Repository...</span>
                      </>
                    ) : (
                      <>
                        <ArrowDownToLine className="w-3.5 h-3.5" />
                        <span>Clone & Import Code</span>
                      </>
                    )}
                  </button>
                </div>
                {cloneStatus && (
                  <p
                    className={`text-[10px] mt-1 truncate ${
                      cloneStatus.startsWith('✓') ? 'text-[#81c995]' : 'text-[#f28b82]'
                    }`}
                  >
                    {cloneStatus}
                  </p>
                )}
              </form>
            )}
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
