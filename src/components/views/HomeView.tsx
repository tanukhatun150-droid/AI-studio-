import React, { useEffect, useState } from 'react';
import {
  Bot,
  Terminal,
  FolderCode,
  Github,
  Play,
  Sparkles,
  Zap,
  MessageSquare,
  Clock,
  ChevronRight,
  Plus,
  Cpu,
  ShieldCheck,
  Radio,
  FileCode2,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { AppTab, ChatSession, Model, WorkspaceFile } from '../../types';

interface HomeViewProps {
  currentModel: Model;
  onOpenModelPicker: () => void;
  onSelectTab: (tab: AppTab) => void;
  sessions: ChatSession[];
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  files: WorkspaceFile[];
  onOpenFile: (path: string) => void;
  onOpenGitHub: () => void;
  onOpenPreview: () => void;
  activeTaskCount?: number;
}

interface ProviderStatus {
  configured: boolean;
  name: string;
  model: string;
  status: string;
}

export function HomeView({
  currentModel,
  onOpenModelPicker,
  onSelectTab,
  sessions,
  onSelectSession,
  onNewChat,
  files,
  onOpenFile,
  onOpenGitHub,
  onOpenPreview,
  activeTaskCount = 0,
}: HomeViewProps) {
  const [providerStatuses, setProviderStatuses] = useState<Record<string, ProviderStatus>>({});

  useEffect(() => {
    fetch('/api/models/status')
      .then((res) => res.json())
      .then((data) => {
        if (data?.providers) {
          setProviderStatuses(data.providers);
        }
      })
      .catch(() => {
        // Fallback default statuses
      });
  }, []);

  const activeProviderKey = currentModel.provider?.toLowerCase().includes('groq')
    ? 'groq'
    : currentModel.provider?.toLowerCase().includes('gemini') || currentModel.name.toLowerCase().includes('gemini')
    ? 'gemini'
    : currentModel.id;

  return (
    <div
      id="view-home"
      className="h-full overflow-y-auto pb-20 p-4 sm:p-6 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-150 custom-scrollbar"
    >
      {/* 1. Hero Welcome & System Readiness */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#181a20] via-[#14161b] to-[#111216] border border-[#2d3037] p-5 sm:p-7 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                SYSTEM ONLINE • INGRESS PORT 3000
              </span>
              {activeTaskCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono bg-sky-500/15 text-sky-300 border border-sky-500/30">
                  <Zap className="w-3 h-3 text-sky-400" />
                  {activeTaskCount} Tasks Running
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-teal-300">CodePilot AI</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#9aa0a6] leading-relaxed">
              Autonomous full-stack engineering workspace with real interactive bash execution, multi-agent reasoning, and live preview rendering.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 md:pt-0">
            <button
              id="home-btn-start-agent"
              type="button"
              onClick={() => onSelectTab('agent')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-black font-semibold text-xs transition-all shadow-md shadow-sky-500/20 active:scale-95 cursor-pointer"
            >
              <Bot className="w-4 h-4" />
              <span>Launch AI Agent</span>
            </button>
            <button
              id="home-btn-quick-terminal"
              type="button"
              onClick={() => onSelectTab('terminal')}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#1f2228] hover:bg-[#282a30] text-[#e3e3e3] hover:text-white border border-[#33353c] text-xs font-medium transition-all active:scale-95 cursor-pointer"
            >
              <Terminal className="w-4 h-4 text-sky-400" />
              <span>Open Shell</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. AI Model Status Card */}
      <div
        id="home-model-status-card"
        className="rounded-2xl bg-[#16171b] border border-[#2b2d34] p-5 shadow-lg relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#26282e]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500/20 to-teal-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Active Intelligence Model: {currentModel.name}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  {currentModel.provider}
                </span>
              </div>
              <p className="text-xs text-[#8e918f] mt-0.5">{currentModel.description}</p>
            </div>
          </div>

          <button
            id="home-btn-change-model"
            type="button"
            onClick={onOpenModelPicker}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#22242a] hover:bg-[#2d3038] text-xs font-semibold text-[#e3e3e3] border border-[#373942] transition-colors cursor-pointer shrink-0 self-start sm:self-center"
          >
            <span>Switch Model</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#8e918f]" />
          </button>
        </div>

        {/* Live Provider Cluster Status Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <div className="p-3 rounded-xl bg-[#1b1d22] border border-[#26282e] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#8e918f]">Groq LPU</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <div className="mt-2 text-xs font-bold text-white flex items-center gap-1">
              <span>Llama 3.3 70B</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 mt-0.5">Ultra Fast (~120ms)</span>
          </div>

          <div className="p-3 rounded-xl bg-[#1b1d22] border border-[#26282e] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#8e918f]">Google AI</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <div className="mt-2 text-xs font-bold text-white flex items-center gap-1">
              <span>Gemini 3.8 Flash</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 mt-0.5">Multimodal Reasoning</span>
          </div>

          <div className="p-3 rounded-xl bg-[#1b1d22] border border-[#26282e] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#8e918f]">Local / Ollama</span>
              <span className="w-2 h-2 rounded-full bg-sky-400" />
            </div>
            <div className="mt-2 text-xs font-bold text-white flex items-center gap-1">
              <span>qwen2.5-coder</span>
            </div>
            <span className="text-[10px] font-mono text-sky-400 mt-0.5">Offline Self-Hosted</span>
          </div>

          <div className="p-3 rounded-xl bg-[#1b1d22] border border-[#26282e] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#8e918f]">Kimi / Moonshot</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <div className="mt-2 text-xs font-bold text-white flex items-center gap-1">
              <span>Moonshot v1</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 mt-0.5">128k Long Context</span>
          </div>
        </div>
      </div>

      {/* 3. Quick Start Actions Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#8e918f]">
          Quick Workspace Launchers
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            id="home-action-new-task"
            type="button"
            onClick={() => {
              onNewChat();
              onSelectTab('agent');
            }}
            className="p-4 rounded-xl bg-[#16171b] hover:bg-[#1f2127] border border-[#282a30] hover:border-sky-500/40 text-left transition-all group cursor-pointer shadow-xs"
          >
            <div className="w-9 h-9 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Bot className="w-5 h-5" />
            </div>
            <div className="font-semibold text-xs text-white group-hover:text-sky-300 transition-colors">
              New Agent Session
            </div>
            <p className="text-[11px] text-[#8e918f] mt-1 leading-snug">
              Start fresh prompt with transparent agent thinking & task planner.
            </p>
          </button>

          <button
            id="home-action-open-terminal"
            type="button"
            onClick={() => onSelectTab('terminal')}
            className="p-4 rounded-xl bg-[#16171b] hover:bg-[#1f2127] border border-[#282a30] hover:border-teal-500/40 text-left transition-all group cursor-pointer shadow-xs"
          >
            <div className="w-9 h-9 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Terminal className="w-5 h-5" />
            </div>
            <div className="font-semibold text-xs text-white group-hover:text-teal-300 transition-colors">
              Interactive Bash Shell
            </div>
            <p className="text-[11px] text-[#8e918f] mt-1 leading-snug">
              Real container terminal with full bash syntax, npm, git & curl.
            </p>
          </button>

          <button
            id="home-action-browse-projects"
            type="button"
            onClick={() => onSelectTab('projects')}
            className="p-4 rounded-xl bg-[#16171b] hover:bg-[#1f2127] border border-[#282a30] hover:border-indigo-500/40 text-left transition-all group cursor-pointer shadow-xs"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <FolderCode className="w-5 h-5" />
            </div>
            <div className="font-semibold text-xs text-white group-hover:text-indigo-300 transition-colors">
              Project Explorer
            </div>
            <p className="text-[11px] text-[#8e918f] mt-1 leading-snug">
              Browse repository files, edit code, and inspect APK assets.
            </p>
          </button>

          <button
            id="home-action-launch-preview"
            type="button"
            onClick={onOpenPreview}
            className="p-4 rounded-xl bg-[#16171b] hover:bg-[#1f2127] border border-[#282a30] hover:border-emerald-500/40 text-left transition-all group cursor-pointer shadow-xs"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Play className="w-5 h-5" />
            </div>
            <div className="font-semibold text-xs text-white group-hover:text-emerald-300 transition-colors">
              Live Web Preview
            </div>
            <p className="text-[11px] text-[#8e918f] mt-1 leading-snug">
              View rendered frontend app running on container port 3000.
            </p>
          </button>
        </div>
      </div>

      {/* 4. Two-Column Layout: Recent Projects & Recent Conversations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects / Workspaces */}
        <div className="rounded-2xl bg-[#16171b] border border-[#2b2d34] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderCode className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white">Active Projects & Repos</h3>
            </div>
            <button
              type="button"
              onClick={() => onSelectTab('projects')}
              className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {/* Primary Workspace */}
            <div
              onClick={() => onSelectTab('projects')}
              className="p-3 rounded-xl bg-[#1d1f25] hover:bg-[#252830] border border-[#2c2f36] flex items-center justify-between cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center font-mono text-xs font-bold">
                  TS
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">CodePilot Full-Stack Core</div>
                  <div className="text-[10px] text-[#8e918f]">
                    React 18 + Express + Vite + Tailwind • {files.length} files
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Active
              </span>
            </div>

            {/* Mobile APK Workspace */}
            <div
              onClick={() => onSelectTab('projects')}
              className="p-3 rounded-xl bg-[#1d1f25] hover:bg-[#252830] border border-[#2c2f36] flex items-center justify-between cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-500/15 text-teal-400 flex items-center justify-center font-mono text-xs font-bold">
                  APK
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Mobile Assistant Bundle</div>
                  <div className="text-[10px] text-[#8e918f]">
                    Jarvis Voice Floating Mode • Web Speech API
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#2e3138] text-[#c4c7c5]">
                Ready
              </span>
            </div>

            {/* Quick File Access List */}
            <div className="pt-2 border-t border-[#26282e]">
              <div className="text-[11px] font-semibold text-[#8e918f] mb-2">Key Files:</div>
              <div className="flex flex-wrap gap-1.5">
                {files.slice(0, 5).map((file) => (
                  <button
                    key={file.id}
                    type="button"
                    onClick={() => onOpenFile(file.path)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#22242a] hover:bg-[#2d3038] text-[11px] font-mono text-[#c4c7c5] hover:text-white border border-[#2e3036] transition-colors cursor-pointer"
                  >
                    <FileCode2 className="w-3 h-3 text-sky-400" />
                    <span>{file.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Conversations */}
        <div className="rounded-2xl bg-[#16171b] border border-[#2b2d34] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white">Recent Conversations</h3>
            </div>
            <button
              type="button"
              onClick={() => {
                onNewChat();
                onSelectTab('agent');
              }}
              className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Chat</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {sessions.length === 0 ? (
              <div className="text-center py-8 text-[#8e918f] text-xs">
                No previous conversations recorded yet. Start a new prompt in the Agent tab!
              </div>
            ) : (
              sessions.slice(0, 4).map((session) => (
                <div
                  key={session.id}
                  onClick={() => {
                    onSelectSession(session.id);
                    onSelectTab('agent');
                  }}
                  className="p-3 rounded-xl bg-[#1d1f25] hover:bg-[#252830] border border-[#2c2f36] flex items-center justify-between cursor-pointer transition-colors group"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="text-xs font-semibold text-white group-hover:text-sky-300 truncate transition-colors">
                      {session.title || 'Untitled Engineering Session'}
                    </div>
                    <div className="text-[10px] text-[#8e918f] truncate mt-0.5">
                      {session.preview || `${session.messages?.length || 0} messages exchanged`}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 text-[10px] text-[#8e918f] font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{session.updatedAt || 'Recent'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
