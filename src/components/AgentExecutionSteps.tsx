import React, { useState } from 'react';
import {
  FolderTree,
  FolderOpen,
  FileText,
  FileEdit,
  FilePlus,
  Trash2,
  Search,
  Terminal,
  FileQuestion,
  Info,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Activity,
  Code2,
} from 'lucide-react';
import { AgentExecutionStep } from '../types';

interface AgentExecutionStepsProps {
  steps: AgentExecutionStep[];
  onOpenFile?: (path: string) => void;
  onOpenTerminal?: (command?: string) => void;
}

export function AgentExecutionSteps({
  steps,
  onOpenFile,
  onOpenTerminal,
}: AgentExecutionStepsProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [isAllExpanded, setIsAllExpanded] = useState<boolean>(false);

  if (!steps || steps.length === 0) return null;

  const getToolIcon = (tool: string) => {
    switch (tool) {
      case 'get_project_structure':
        return <FolderTree className="w-3.5 h-3.5 text-amber-400" />;
      case 'list_files':
        return <FolderOpen className="w-3.5 h-3.5 text-blue-400" />;
      case 'read_file':
        return <FileText className="w-3.5 h-3.5 text-sky-400" />;
      case 'write_file':
      case 'edit_file':
        return <FileEdit className="w-3.5 h-3.5 text-purple-400" />;
      case 'create_file':
        return <FilePlus className="w-3.5 h-3.5 text-emerald-400" />;
      case 'delete_file':
        return <Trash2 className="w-3.5 h-3.5 text-rose-400" />;
      case 'search_files':
        return <Search className="w-3.5 h-3.5 text-yellow-400" />;
      case 'run_command':
        return <Terminal className="w-3.5 h-3.5 text-green-400" />;
      case 'check_file_exists':
        return <FileQuestion className="w-3.5 h-3.5 text-cyan-400" />;
      case 'get_file_info':
        return <Info className="w-3.5 h-3.5 text-indigo-400" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-gray-400" />;
    }
  };

  const toggleStep = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  const successCount = steps.filter((s) => s.result.success).length;

  return (
    <div
      id="agent-execution-steps-container"
      className="my-3 rounded-xl border border-[#272a34] bg-[#111318] p-3 shadow-md max-w-2xl font-sans"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-[#232630]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-zinc-200">
            Real Agent Loop Execution ({steps.length} {steps.length === 1 ? 'step' : 'steps'})
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
            {successCount}/{steps.length} Succeeded
          </span>
        </div>

        <button
          id="btn-toggle-all-steps"
          type="button"
          onClick={() => setIsAllExpanded(!isAllExpanded)}
          className="text-[11px] text-zinc-400 hover:text-zinc-200 px-2 py-0.5 rounded hover:bg-[#1a1d24] transition-colors"
        >
          {isAllExpanded ? 'Collapse All' : 'Expand All'}
        </button>
      </div>

      {/* Step items list */}
      <div className="space-y-1.5">
        {steps.map((step, idx) => {
          const isOpen = isAllExpanded || expandedIndex === idx;
          const isSuccess = step.result.success;

          return (
            <div
              key={`step-${idx}-${step.tool}`}
              id={`agent-step-item-${idx}`}
              className={`rounded-lg border transition-colors overflow-hidden ${
                isSuccess
                  ? 'border-[#222631] bg-[#141720] hover:border-[#323746]'
                  : 'border-rose-900/40 bg-rose-950/20 hover:border-rose-800/60'
              }`}
            >
              {/* Step Header */}
              <div
                onClick={() => toggleStep(idx)}
                className="flex items-center justify-between gap-2 px-2.5 py-2 cursor-pointer select-none text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="shrink-0">{getToolIcon(step.tool)}</div>
                  <span className="font-mono text-[11px] text-zinc-400 shrink-0">
                    Step {step.step}:
                  </span>
                  <span className="font-medium text-zinc-200 truncate" title={step.summary}>
                    {step.summary}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {step.durationMs ? (
                    <span className="text-[10px] font-mono text-zinc-500">
                      {step.durationMs}ms
                    </span>
                  ) : null}

                  {isSuccess ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  )}

                  {isOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                  )}
                </div>
              </div>

              {/* Step Detail Drawer */}
              {isOpen && (
                <div className="px-3 pb-3 pt-1 border-t border-[#1f232d] bg-[#0e1015] text-[11px] space-y-2">
                  {/* Tool Arguments */}
                  <div>
                    <div className="flex items-center justify-between text-zinc-400 mb-1">
                      <span className="font-semibold text-[10px] uppercase tracking-wider text-zinc-500">
                        Tool Inputs:
                      </span>
                      {step.args.path && onOpenFile && (
                        <button
                          type="button"
                          onClick={() => onOpenFile(step.args.path)}
                          className="flex items-center gap-1 text-sky-400 hover:text-sky-300 transition-colors"
                        >
                          <Code2 className="w-3 h-3" />
                          <span>View in Editor</span>
                        </button>
                      )}
                      {step.tool === 'run_command' && onOpenTerminal && (
                        <button
                          type="button"
                          onClick={() => onOpenTerminal(step.args.command)}
                          className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                          <Terminal className="w-3 h-3" />
                          <span>Open Terminal</span>
                        </button>
                      )}
                    </div>
                    <pre className="p-2 rounded bg-[#08090c] border border-[#1c1f26] font-mono text-[10.5px] text-amber-200/90 overflow-x-auto max-h-32">
                      {JSON.stringify(step.args, null, 2)}
                    </pre>
                  </div>

                  {/* Tool Output */}
                  <div>
                    <span className="font-semibold text-[10px] uppercase tracking-wider text-zinc-500 block mb-1">
                      Tool Structured Output:
                    </span>
                    <pre
                      className={`p-2 rounded border font-mono text-[10.5px] overflow-x-auto max-h-40 ${
                        isSuccess
                          ? 'bg-[#08090c] border-[#1c1f26] text-emerald-300/90'
                          : 'bg-rose-950/30 border-rose-800/40 text-rose-300'
                      }`}
                    >
                      {step.result.content && typeof step.result.content === 'string' && step.result.content.length > 500
                        ? JSON.stringify(
                            {
                              ...step.result,
                              content: `${step.result.content.slice(0, 300)}... [${step.result.lines} lines truncated for preview]`,
                            },
                            null,
                            2
                          )
                        : JSON.stringify(step.result, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
