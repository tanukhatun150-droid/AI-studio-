import React, { useState, useEffect } from 'react';
import {
  initialAgents,
  initialMemoryItems,
  initialModels,
  initialWorkspaceFiles,
  initialWorkspaceTasks,
  initialWorkspaceTools,
  starterPromptChips,
} from './data/initialData';
import {
  AgentPersona,
  ChatAttachment,
  MemoryItem,
  Message,
  Model,
  WorkspaceFile,
  WorkspaceTask,
  WorkspaceTool,
  ChatSession,
} from './types';
import { Header } from './components/Header';
import { WorkspaceDrawer } from './components/WorkspaceDrawer';
import { ChatStream } from './components/ChatStream';
import { Composer } from './components/Composer';
import { TerminalView } from './components/TerminalView';
import { LivePreview } from './components/LivePreview';
import { GitHubConnectModal } from './components/modals/GitHubConnectModal';
import { ModelPickerModal } from './components/modals/ModelPickerModal';
import { TasksModal } from './components/modals/TasksModal';
import { MemoryModal } from './components/modals/MemoryModal';
import { ToolModal } from './components/modals/ToolModal';
import { FileModal } from './components/modals/FileModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { RecentChatsModal } from './components/modals/RecentChatsModal';

export default function App() {
  // Models & Agents
  const [models] = useState<Model[]>(initialModels);
  const [currentModel, setCurrentModel] = useState<Model>(initialModels[0]); // Default Gemini
  const [agents, setAgents] = useState<AgentPersona[]>(initialAgents);
  const [activeAgentId, setActiveAgentId] = useState<string>('frontend');

  // Workspace Files, Tools, Tasks, Memory
  const [tools] = useState<WorkspaceTool[]>(initialWorkspaceTools);
  const [files, setFiles] = useState<WorkspaceFile[]>(initialWorkspaceFiles);
  const [tasks, setTasks] = useState<WorkspaceTask[]>(initialWorkspaceTasks);
  const [memories, setMemories] = useState<MemoryItem[]>(initialMemoryItems);

  // Chat Messages
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('ai_agent_home_messages');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(false);

  // Modals & Drawers state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModelPickerOpen, setIsModelPickerOpen] = useState(false);
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<WorkspaceTool | null>(null);
  const [selectedFile, setSelectedFile] = useState<WorkspaceFile | null>(null);
  const [isRefreshingFiles, setIsRefreshingFiles] = useState(false);

  // Viewport mode (desktop fluid vs mobile device shell)
  const [isMobileFrame, setIsMobileFrame] = useState(false);

  // Split Workspace Live Preview & Interactive Terminal
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

  // Real GitHub Connect modal & session user
  const [isGitHubOpen, setIsGitHubOpen] = useState(false);
  const [connectedGithubUser, setConnectedGithubUser] = useState<string | null>(null);

  const checkGithubStatus = () => {
    fetch('/api/github/status')
      .then((r) => r.json())
      .then((data) => {
        if (data?.connected && data?.user?.login) {
          setConnectedGithubUser(data.user.login);
        } else {
          setConnectedGithubUser(null);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    checkGithubStatus();

    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        return;
      }
      if (event.data?.type === 'GITHUB_AUTH_SUCCESS') {
        if (event.data.user?.login) {
          setConnectedGithubUser(event.data.user.login);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Active workspace mode: preview, code, or terminal
  const activeWorkspaceMode: 'preview' | 'code' | 'terminal' = isPreviewOpen
    ? 'preview'
    : isTerminalOpen
    ? 'terminal'
    : 'code';

  const handleRepoImported = (repo: any, importedFiles: WorkspaceFile[]) => {
    if (importedFiles && importedFiles.length > 0) {
      setFiles(importedFiles);
    }
    const notificationMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: `### 🚀 Repository Imported: **${repo.full_name || repo.name}**\n\n- **Default Branch**: \`${repo.default_branch || 'main'}\`\n- **Visibility**: ${repo.private ? '🔒 Private' : '🌐 Public'}\n- **Files Synced**: ${importedFiles.length} files imported into workspace\n\nAll repository files are now available in your workspace file explorer. You can inspect files, run terminal commands, or ask me to modify code directly!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, notificationMsg]);
  };

  const handleSelectWorkspaceMode = (mode: 'preview' | 'code' | 'terminal') => {
    if (mode === activeWorkspaceMode) {
      if (mode === 'preview') setIsPreviewOpen(false);
      if (mode === 'terminal') setIsTerminalOpen(false);
      return;
    }
    if (mode === 'preview') {
      setIsPreviewOpen(true);
      setIsTerminalOpen(false);
      if (isMobileFrame) setIsMobileFrame(false);
    } else if (mode === 'terminal') {
      setIsTerminalOpen(true);
      setIsPreviewOpen(false);
    } else {
      setIsPreviewOpen(false);
      setIsTerminalOpen(false);
    }
  };

  // Recent Sessions & Current Session state
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('codepilot_recent_sessions');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    return `session-${Date.now()}`;
  });
  const [isRecentOpen, setIsRecentOpen] = useState(false);

  // Multilingual selection state (auto, hinglish, hindi, english, etc.)
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => {
    try {
      return localStorage.getItem('ai_agent_home_lang') || 'auto';
    } catch {
      return 'auto';
    }
  });

  const handleSelectLanguage = (lang: string) => {
    setSelectedLanguage(lang);
    try {
      localStorage.setItem('ai_agent_home_lang', lang);
    } catch {
      // ignore
    }
  };

  // Persist messages safely (preventing localStorage quota crash on large base64 media)
  useEffect(() => {
    try {
      const safeMessages = messages.map((m) => {
        if (m.attachment?.dataUrl && m.attachment.dataUrl.length > 500000) {
          return {
            ...m,
            attachment: {
              ...m.attachment,
              dataUrl: m.attachment.dataUrl.slice(0, 500000),
            },
          };
        }
        return m;
      });
      localStorage.setItem('ai_agent_home_messages', JSON.stringify(safeMessages));
    } catch {
      // ignore quota error
    }
  }, [messages]);

  const activeAgent = agents.find((a) => a.id === activeAgentId) || agents[1];

  // Select active agent
  const handleSelectAgent = (id: string) => {
    setActiveAgentId(id);
    setAgents((prev) =>
      prev.map((agent) => ({
        ...agent,
        active: agent.id === id,
        status: agent.id === id ? 'Active' : 'Idle',
      }))
    );
  };

  // Toggle task checklist
  const handleToggleTaskItem = (taskId: string, itemId: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        const updatedItems = task.items.map((item) =>
          item.id === itemId ? { ...item, completed: !item.completed } : item
        );
        const completedCount = updatedItems.filter((i) => i.completed).length;
        const progress = Math.round((completedCount / updatedItems.length) * 100);
        return {
          ...task,
          items: updatedItems,
          progress,
          status: progress === 100 ? 'completed' : 'in_progress',
        };
      })
    );
  };

  // Add task checklist item
  const handleAddTaskItem = (taskId: string, title: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        const newItem = { id: `t-${Date.now()}`, title, completed: false };
        const updatedItems = [...task.items, newItem];
        const completedCount = updatedItems.filter((i) => i.completed).length;
        const progress = Math.round((completedCount / updatedItems.length) * 100);
        return {
          ...task,
          items: updatedItems,
          progress,
        };
      })
    );
  };

  // Add memory
  const handleAddMemory = (key: string, value: string) => {
    setMemories((prev) => [
      ...prev,
      {
        id: `mem-${Date.now()}`,
        key,
        value,
        category: 'preference',
      },
    ]);
  };

  // Delete memory
  const handleDeleteMemory = (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

  // Refresh files simulation
  const handleRefreshFiles = () => {
    setIsRefreshingFiles(true);
    setTimeout(() => {
      setIsRefreshingFiles(false);
    }, 700);
  };

  // Save or update session in recent chats
  const saveCurrentSession = (newMessages: Message[]) => {
    if (newMessages.length === 0) return;
    const firstUserMsg = newMessages.find((m) => m.role === 'user')?.content || 'New Conversation';
    const title =
      firstUserMsg.length > 36 ? `${firstUserMsg.slice(0, 36)}...` : firstUserMsg;
    const lastMsg = newMessages[newMessages.length - 1]?.content || '';
    const preview = lastMsg.length > 75 ? `${lastMsg.slice(0, 75)}...` : lastMsg;
    const updatedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setSessions((prev) => {
      const existingIdx = prev.findIndex((s) => s.id === currentSessionId);
      const updatedSession: ChatSession = {
        id: currentSessionId,
        title: existingIdx >= 0 ? prev[existingIdx].title : title,
        preview,
        updatedAt,
        messages: newMessages,
        agentId: activeAgentId,
        modelId: currentModel.id,
      };

      const newSessions =
        existingIdx >= 0
          ? [updatedSession, ...prev.filter((s) => s.id !== currentSessionId)]
          : [updatedSession, ...prev];

      try {
        localStorage.setItem('codepilot_recent_sessions', JSON.stringify(newSessions));
      } catch {
        // ignore quota
      }
      return newSessions;
    });
  };

  // Select a recent conversation
  const handleSelectSession = (sessionId: string) => {
    const target = sessions.find((s) => s.id === sessionId);
    if (target) {
      setCurrentSessionId(target.id);
      setMessages(target.messages);
      if (target.agentId) {
        setActiveAgentId(target.agentId);
      }
    }
  };

  // Start a fresh New Chat
  const handleNewChat = () => {
    const newId = `session-${Date.now()}`;
    setCurrentSessionId(newId);
    setMessages([]);
    localStorage.removeItem('ai_agent_home_messages');
  };

  // Delete a specific session
  const handleDeleteSession = (sessionId: string) => {
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== sessionId);
      try {
        localStorage.setItem('codepilot_recent_sessions', JSON.stringify(filtered));
      } catch {
        // ignore
      }
      return filtered;
    });
    if (currentSessionId === sessionId) {
      handleNewChat();
    }
  };

  // Clear all recent sessions
  const handleClearAllSessions = () => {
    setSessions([]);
    localStorage.removeItem('codepilot_recent_sessions');
    handleNewChat();
  };

  // Send message
  const handleSendMessage = async (content: string, attachment?: ChatAttachment) => {
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: content || `Attached ${attachment?.name}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachment,
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    saveCurrentSession(updatedMessages);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: currentModel.id,
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          agentPersona: {
            name: activeAgent.name,
            role: activeAgent.role,
            systemPrompt: activeAgent.systemPrompt,
          },
          language: selectedLanguage,
          attachment: attachment
            ? {
                name: attachment.name,
                size: attachment.size,
                mimeType: attachment.mimeType,
                dataUrl: attachment.dataUrl,
                content: attachment.content,
                mediaType: attachment.mediaType,
              }
            : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server responded with status ${response.status}`);
      }

      const assistantMsg: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: data.reply || 'No response received.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelId: data.modelUsed || currentModel.name,
        agentPersona: activeAgent.name,
      };

      const finalMessages = [...updatedMessages, assistantMsg];
      setMessages(finalMessages);
      saveCurrentSession(finalMessages);
    } catch (err: unknown) {
      const errorText = err instanceof Error ? err.message : String(err);
      const errorMsg: Message = {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **${currentModel.name} Error**: ${errorText}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelId: currentModel.name,
        agentPersona: activeAgent.name,
      };
      const finalMessagesWithError = [...updatedMessages, errorMsg];
      setMessages(finalMessagesWithError);
      saveCurrentSession(finalMessagesWithError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0d0e11] text-[#e3e3e3] flex flex-col items-center justify-center font-sans antialiased select-none sm:select-auto overflow-x-hidden">
      {/* Container: either centered mobile device frame or full desktop width */}
      <div
        className={`w-full flex flex-col bg-[#111216] transition-all duration-300 ${
          isMobileFrame
            ? 'max-w-[400px] h-[860px] max-h-[95vh] my-auto rounded-[40px] border-[8px] border-[#222428] shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden relative'
            : 'h-screen'
        }`}
      >
        {/* Mobile Device Status Bar (if in mobile shell mode) */}
        {isMobileFrame && (
          <div className="flex items-center justify-between px-6 pt-3 pb-1 text-[11px] font-semibold text-[#e3e3e3] bg-[#111216] z-30 select-none">
            <span>9:41</span>
            <div className="w-20 h-4 rounded-full bg-[#1e1f20] mx-auto border border-[#333538]" />
            <div className="flex items-center gap-1.5 text-[10px]">
              <span>5G</span>
              <div className="w-5 h-2.5 rounded-sm border border-current p-0.5 flex items-center">
                <div className="w-3 h-full bg-[#34a853] rounded-xs" />
              </div>
            </div>
          </div>
        )}

        {/* Top Header - Unified Single Sleek Row */}
        <Header
          currentModel={currentModel}
          onOpenMenu={() => setIsDrawerOpen(true)}
          onOpenModelPicker={() => setIsModelPickerOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          activeMode={activeWorkspaceMode}
          onSelectMode={handleSelectWorkspaceMode}
          onExternalLaunch={() => {
            window.open(window.location.origin, '_blank', 'noopener,noreferrer');
          }}
        />

        {/* Main Workspace Body with Split-Pane Preview & Terminal Support */}
        <div className="flex-1 flex overflow-hidden min-h-0 relative">
          {/* Main Autonomous AI Chat & Interaction Section */}
          <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
            {/* Chat Stream (Scrollable message area) */}
            <ChatStream
              messages={messages}
              isLoading={isLoading}
              currentModel={currentModel}
              onSelectPromptChip={(prompt) => handleSendMessage(prompt)}
              starterChips={starterPromptChips}
            />

            {/* Embedded Live Interactive Bash Terminal (Collapsible bottom pane) */}
            {isTerminalOpen && (
              <div className="h-64 sm:h-72 shrink-0 border-t border-[#2e3036] bg-[#0e1013] p-1.5 flex flex-col transition-all animate-in slide-in-from-bottom-2">
                <TerminalView />
              </div>
            )}

            {/* Bottom Composer */}
            <Composer
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              modelName={currentModel.name}
              selectedLanguage={selectedLanguage}
              onSelectLanguage={handleSelectLanguage}
            />
          </div>

          {/* Live Web Preview Window (Split-Pane on Desktop) */}
          {isPreviewOpen && (
            <div className="w-full lg:w-[48%] xl:w-[50%] h-full shrink-0 border-l border-[#2e3036] z-10 flex flex-col animate-in slide-in-from-right-2">
              <LivePreview onClose={() => setIsPreviewOpen(false)} isSplitView={true} />
            </div>
          )}
        </div>

        {/* Mobile Shell Home Indicator */}
        {isMobileFrame && (
          <div className="py-2 bg-[#111216] flex justify-center z-30">
            <div className="w-32 h-1 rounded-full bg-[#8e918f]/40" />
          </div>
        )}
      </div>

      {/* Slide-over Workspace Menu Drawer */}
      <WorkspaceDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        agents={agents}
        activeAgentId={activeAgentId}
        onSelectAgent={handleSelectAgent}
        tools={tools}
        onSelectTool={(tool) => {
          if (tool.id === 'github-connect' || tool.id === 'github-import' || tool.id === 'github-push') {
            setIsGitHubOpen(true);
          } else if (tool.id === 'preview') {
            setIsPreviewOpen(true);
            if (isMobileFrame) setIsMobileFrame(false);
          } else if (tool.id === 'terminal') {
            setIsTerminalOpen(true);
          } else {
            setSelectedTool(tool);
          }
        }}
        files={files}
        onSelectFile={(file) => setSelectedFile(file)}
        onRefreshFiles={handleRefreshFiles}
        isRefreshingFiles={isRefreshingFiles}
        onNewChat={handleNewChat}
        onOpenTasks={() => setIsTasksOpen(true)}
        onOpenMemory={() => setIsMemoryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenRecent={() => setIsRecentOpen(true)}
        onOpenGitHub={() => setIsGitHubOpen(true)}
        connectedGithubUser={connectedGithubUser}
        isMobileFrame={isMobileFrame}
        onToggleFrame={() => setIsMobileFrame((prev) => !prev)}
        activeTaskCount={tasks.filter((t) => t.status === 'in_progress').length}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
      />

      {/* GitHub Connect & Repository Manager Modal */}
      <GitHubConnectModal
        isOpen={isGitHubOpen}
        onClose={() => {
          setIsGitHubOpen(false);
          checkGithubStatus();
        }}
        onRepoImported={handleRepoImported}
        onOpenCode={() => handleSelectWorkspaceMode('code')}
        onOpenTerminal={() => handleSelectWorkspaceMode('terminal')}
      />

      {/* Recent Chats Modal */}
      <RecentChatsModal
        isOpen={isRecentOpen}
        onClose={() => setIsRecentOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onClearAllSessions={handleClearAllSessions}
      />

      {/* Model Picker Modal */}
      <ModelPickerModal
        isOpen={isModelPickerOpen}
        onClose={() => setIsModelPickerOpen(false)}
        models={models}
        selectedModelId={currentModel.id}
        onSelectModel={(model) => setCurrentModel(model)}
      />

      {/* Tasks Modal */}
      <TasksModal
        isOpen={isTasksOpen}
        onClose={() => setIsTasksOpen(false)}
        tasks={tasks}
        onToggleTaskItem={handleToggleTaskItem}
        onAddTaskItem={handleAddTaskItem}
      />

      {/* Memory Modal */}
      <MemoryModal
        isOpen={isMemoryOpen}
        onClose={() => setIsMemoryOpen(false)}
        memories={memories}
        onAddMemory={handleAddMemory}
        onDeleteMemory={handleDeleteMemory}
      />

      {/* Tool Modal (Terminal, Packages, DB, Deploy, GitHub, Preview) */}
      <ToolModal
        isOpen={selectedTool !== null}
        tool={selectedTool}
        onClose={() => setSelectedTool(null)}
      />

      {/* File Inspector Modal */}
      <FileModal
        isOpen={selectedFile !== null}
        file={selectedFile}
        onClose={() => setSelectedFile(null)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isMobileFrame={isMobileFrame}
        onToggleFrame={() => setIsMobileFrame((prev) => !prev)}
      />
    </div>
  );
}
