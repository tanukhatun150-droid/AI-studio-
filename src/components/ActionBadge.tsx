import React, { useState } from 'react';
import {
  FileCode,
  FileCheck,
  CheckCircle2,
  ExternalLink,
  Eye,
  Code,
  Copy,
  Check,
} from 'lucide-react';

interface ActionBadgeProps {
  key?: React.Key;
  action: 'Created' | 'Updated' | string;
  filePath: string;
  lines?: number | string;
  onOpenFile?: (path: string) => void;
  onOpenPreview?: () => void;
}

export function ActionBadge({
  action,
  filePath,
  lines,
  onOpenFile,
  onOpenPreview,
}: ActionBadgeProps) {
  const [copied, setCopied] = useState(false);
  const isCreated = action.toLowerCase() === 'created';

  const handleCopyPath = () => {
    navigator.clipboard.writeText(filePath);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      id={`action-badge-${filePath.replace(/[^a-zA-Z0-9]/g, '-')}`}
      className="my-3 max-w-2xl rounded-xl border border-[#272a34] bg-[#14161d] p-3 shadow-lg transition-all hover:border-[#383d4c]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left Status & Path */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
              isCreated
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                : 'border-sky-500/30 bg-sky-500/10 text-sky-400 shadow-[0_0_12px_rgba(14,165,233,0.2)]'
            }`}
          >
            {isCreated ? <FileCheck className="h-4 w-4" /> : <FileCode className="h-4 w-4" />}
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                  isCreated
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                }`}
              >
                <CheckCircle2 className="h-3 w-3" />
                {action}
              </span>
              {lines ? (
                <span className="text-[11px] font-mono text-zinc-500">
                  {lines} lines
                </span>
              ) : null}
            </div>

            <span
              className="mt-0.5 truncate font-mono text-xs font-medium text-zinc-200 hover:text-white transition-colors"
              title={filePath}
            >
              {filePath}
            </span>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          <button
            id={`btn-copy-${filePath.replace(/[^a-zA-Z0-9]/g, '-')}`}
            onClick={handleCopyPath}
            title="Copy path"
            className="flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-medium text-zinc-400 hover:bg-[#20232b] hover:text-zinc-200 transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {onOpenFile && (
            <button
              id={`btn-open-file-${filePath.replace(/[^a-zA-Z0-9]/g, '-')}`}
              onClick={() => onOpenFile(filePath)}
              title="Open file in Code Editor"
              className="flex h-7 items-center gap-1 rounded-md border border-[#2e323e] bg-[#1a1d26] px-2 text-[11px] font-medium text-zinc-300 hover:border-sky-500/40 hover:bg-sky-500/10 hover:text-sky-300 transition-all"
            >
              <Code className="h-3.5 w-3.5 text-sky-400" />
              <span>Editor</span>
            </button>
          )}

          {onOpenPreview && (
            <button
              id={`btn-open-preview-${filePath.replace(/[^a-zA-Z0-9]/g, '-')}`}
              onClick={onOpenPreview}
              title="View updated Live Preview"
              className="flex h-7 items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 text-[11px] font-medium text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Preview</span>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
