import React, { useState } from 'react';
import {
  Bot,
  ListTodo,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  Eye,
  Plus,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import {
  AgentPersona,
  ChatAttachment,
  Message,
  Model,
  WorkspaceTask,
} from '../../types';
import { ChatStream } from '../ChatStream';
import { Composer } from '../Composer';
import { LivePreview } from '../LivePreview';

interface AgentViewProps {
  messages: Message[];
  isLoading: boolean;
  currentModel: Model;
  agents: AgentPersona[];
  activeAgentId: string;
  onSelectAgent: (id: string) => void;
  tasks: WorkspaceTask[];
  onToggleTaskItem: (taskId: string, itemId: string) => void;
  onAddTaskItem?: (taskId: string, title: string) => void;
  onOpenTasksModal: () => void;
  onSendMessage: (content: string, attachment?: ChatAttachment) => Promise<void>;
  onRegenerate: () => void;
  onOpenTerminal: () => void;
  onOpenFile: (path: string) => void;
  onOpenPreview: () => void;
  isPreviewOpen: boolean;
  previewRefreshKey?: number;
  onClosePreview: () => void;
  starterChips: string[];
  selectedLanguage: 'english' | 'hindi' | 'auto';
  onSelectLanguage: (lang: 'english' | 'hindi' | 'auto') => void;
  onNewChat: () => void;
}

export function AgentView({
  messages,
  isLoading,
  currentModel,
  agents,
  activeAgentId,
  onSelectAgent,
  tasks,
  onToggleTaskItem,
  onOpenTasksModal,
  onSendMessage,
  onRegenerate,
  onOpenTerminal,
  onOpenFile,
  onOpenPreview,
  isPreviewOpen,
  previewRefreshKey = 0,
  onClosePreview,
  starterChips,
  selectedLanguage,
  onSelectLanguage,
  onNewChat,
}: AgentViewProps) {
  const [isTaskChecklistOpen, setIsTaskChecklistOpen] = useState(false);
  const activeAgent = agents.find((a) => a.id === activeAgentId) || agents[0];

  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const allItems = tasks.flatMap((t) => t.items || []);
  const completedItemsCount = allItems.filter((i) => i.completed).length;
  const totalItemsCount = allItems.length;
  const progressPercent =
    totalItemsCount > 0 ? Math.round((completedItemsCount / totalItemsCount) * 100) : 100;

  return (
    <div id="view-agent" className="h-full flex overflow-hidden relative">
      {/* Primary Multi-Agent Chat & Orchestration Column */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {/* Multi-Agent Orchestrator Subheader */}
        <div className="h-11 px-3 sm:px-4 bg-[#14161b]/95 backdrop-blur-md border-b border-[#292b32] flex items-center justify-between gap-2 shrink-0 z-10 select-none">
          {/* Agent Persona Quick Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 min-w-0">
            {agents.map((agent) => {
              const isCurrent = agent.id === activeAgentId;
              return (
                <button
                  key={agent.id}
                  id={`agent-persona-chip-${agent.id}`}
                  type="button"
                  onClick={() => onSelectAgent(agent.id)}
                  title={agent.role}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer shrink-0 ${
                    isCurrent
                      ? 'bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/40 shadow-xs'
                      : 'bg-[#1e2026] text-[#8e918f] hover:text-[#e3e3e3] border border-[#2c2e36]'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: agent.tint }}
                  />
                  <span className="truncate max-w-[120px]">{agent.name}</span>
                </button>
              );
            })}
          </div>

          {/* Right Action Icons: Live Tasks Dropdown & Preview Split Toggle */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Live Task Checklist Toggle */}
            <button
              id="agent-btn-toggle-tasks"
              type="button"
              onClick={() => setIsTaskChecklistOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                isTaskChecklistOpen
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  : 'bg-[#1e2026] text-[#8e918f] hover:text-[#e3e3e3] border-[#2c2e36]'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden xs:inline">Tasks</span>
              <span className="px-1.5 py-0.2 rounded-full bg-[#2a2d36] text-[10px] font-mono text-zinc-300">
                {completedItemsCount}/{totalItemsCount}
              </span>
              {isTaskChecklistOpen ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>

            {/* Split Preview Toggle Button */}
            <button
              id="agent-btn-split-preview"
              type="button"
              onClick={onOpenPreview}
              title="Toggle Live Web Preview"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                isPreviewOpen
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-[#1e2026] text-[#8e918f] hover:text-[#e3e3e3] border-[#2c2e36]'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Preview</span>
            </button>
          </div>
        </div>

        {/* Expandable Live Task Checklist Panel */}
        {isTaskChecklistOpen && (
          <div
            id="agent-live-task-panel"
            className="px-4 py-3 bg-[#181a20] border-b border-[#2b2d35] shrink-0 animate-in slide-in-from-top-2 space-y-2 z-10"
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">Live Execution Checklist</span>
                <span className="text-[10px] font-mono text-emerald-400">
                  {progressPercent}% Complete
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenTasksModal}
                className="text-[11px] text-sky-400 hover:text-sky-300 cursor-pointer"
              >
                Detailed Planner →
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 rounded-full bg-[#252830] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Checklist items */}
            <div className="max-h-36 overflow-y-auto space-y-1.5 pt-1 pr-1 custom-scrollbar">
              {tasks.map((task) => (
                <div key={task.id} className="space-y-1">
                  <div className="text-[11px] font-semibold text-[#8e918f] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                    <span>{task.title}</span>
                  </div>
                  {task.items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onToggleTaskItem(task.id, item.id)}
                      className="flex items-center gap-2 p-1.5 rounded-md hover:bg-[#20222a] text-xs cursor-pointer select-none transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => {}}
                        className="w-3.5 h-3.5 accent-sky-400 rounded cursor-pointer"
                      />
                      <span
                        className={
                          item.completed
                            ? 'line-through text-[#6a6d75]'
                            : 'text-[#e3e3e3]'
                        }
                      >
                        {item.title}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scrollable Transparent Chat Stream with Thinking Accordion */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <ChatStream
            messages={messages}
            isLoading={isLoading}
            currentModel={currentModel}
            onSelectPromptChip={(prompt) => {
              onSendMessage(prompt);
            }}
            starterChips={starterChips}
            onRegenerate={onRegenerate}
            onOpenTerminal={onOpenTerminal}
            onOpenFile={onOpenFile}
            onOpenPreview={onOpenPreview}
          />
        </div>

        {/* Docked Prompt Composer (with pb-20 so it sits cleanly above the sticky 16 bottom bar) */}
        <div className="pb-16 bg-[#111216] border-t border-[#26282d] shrink-0">
          <Composer
            onSendMessage={onSendMessage}
            isLoading={isLoading}
            modelName={currentModel.name}
            selectedLanguage={selectedLanguage}
            onSelectLanguage={onSelectLanguage}
          />
        </div>
      </div>

      {/* Split-Pane Live Web Preview Window (Side-by-side on larger displays) */}
      {isPreviewOpen && (
        <div className="w-full lg:w-[48%] xl:w-[50%] h-full shrink-0 border-l border-[#2e3036] z-20 flex flex-col animate-in slide-in-from-right-2 pb-16">
          <LivePreview
            onClose={onClosePreview}
            isSplitView={true}
            refreshKey={previewRefreshKey}
          />
        </div>
      )}
    </div>
  );
}
