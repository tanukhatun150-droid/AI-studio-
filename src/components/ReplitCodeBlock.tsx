import React, { useState } from 'react';
import {
  Play,
  Copy,
  Check,
  Code2,
  Terminal,
  Loader2,
  ChevronDown,
  ChevronUp,
  X,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';

interface ReplitCodeBlockProps {
  code: string;
  language?: string;
  codeKey: string;
  onCopy: () => void;
  isCopied: boolean;
  onOpenTerminal?: (command: string) => void;
  key?: React.Key;
}

interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
}

export function ReplitCodeBlock({
  code,
  language = 'code',
  onCopy,
  isCopied,
  onOpenTerminal,
}: ReplitCodeBlockProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [showConsole, setShowConsole] = useState(false);
  const [wrapLines, setWrapLines] = useState(false);

  const cleanLang = (language || 'code').toLowerCase().trim();

  // Language mapping to realistic file names, colors, and runtime commands
  const getLanguageDetails = (lang: string) => {
    switch (lang) {
      case 'python':
      case 'py':
        return {
          filename: 'main.py',
          badge: 'Python 3',
          color: '#3b82f6',
          runnable: true,
          getCommand: (c: string) => `python3 -c ${JSON.stringify(c)}`,
        };
      case 'javascript':
      case 'js':
        return {
          filename: 'index.js',
          badge: 'Node.js',
          color: '#eab308',
          runnable: true,
          getCommand: (c: string) => `node -e ${JSON.stringify(c)}`,
        };
      case 'typescript':
      case 'ts':
      case 'tsx':
        return {
          filename: lang.endsWith('x') ? 'App.tsx' : 'index.ts',
          badge: 'TypeScript',
          color: '#38bdf8',
          runnable: true,
          getCommand: (c: string) => `npx tsx -e ${JSON.stringify(c)}`,
        };
      case 'bash':
      case 'sh':
      case 'shell':
      case 'zsh':
        return {
          filename: 'script.sh',
          badge: 'Bash',
          color: '#10b981',
          runnable: true,
          getCommand: (c: string) => c.trim(),
        };
      case 'html':
        return {
          filename: 'index.html',
          badge: 'HTML5',
          color: '#f97316',
          runnable: false,
          getCommand: () => '',
        };
      case 'css':
        return {
          filename: 'styles.css',
          badge: 'CSS3',
          color: '#06b6d4',
          runnable: false,
          getCommand: () => '',
        };
      case 'json':
        return {
          filename: 'package.json',
          badge: 'JSON',
          color: '#a855f7',
          runnable: false,
          getCommand: () => '',
        };
      case 'sql':
        return {
          filename: 'query.sql',
          badge: 'PostgreSQL',
          color: '#ec4899',
          runnable: false,
          getCommand: () => '',
        };
      default:
        return {
          filename: `script.${lang || 'txt'}`,
          badge: (lang || 'CODE').toUpperCase(),
          color: '#a8c7fa',
          runnable: true,
          getCommand: (c: string) => c.trim(),
        };
    }
  };

  const details = getLanguageDetails(cleanLang);
  const trimmedCode = code.trim();
  const lines = trimmedCode.split('\n');

  const handleRunCode = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setShowConsole(true);
    const startTime = Date.now();

    try {
      const commandToRun = details.getCommand(trimmedCode);
      const res = await fetch('/api/terminal/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: commandToRun }),
      });

      const data = await res.json();
      const durationMs = Date.now() - startTime;

      setResult({
        stdout: data.stdout || '',
        stderr: data.stderr || '',
        exitCode: typeof data.exitCode === 'number' ? data.exitCode : 0,
        durationMs,
      });
    } catch (err: unknown) {
      const durationMs = Date.now() - startTime;
      setResult({
        stdout: '',
        stderr: err instanceof Error ? err.message : 'Terminal execution failed',
        exitCode: 1,
        durationMs,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleOpenInTerminal = () => {
    if (onOpenTerminal) {
      const commandToRun = details.getCommand(trimmedCode);
      onOpenTerminal(commandToRun);
    }
  };

  return (
    <div className="my-3 rounded-xl bg-[#0e1013] border border-[#2e3138] overflow-hidden shadow-lg group">
      {/* Replit-style Tab Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#16181d] border-b border-[#2e3138] text-[11px] text-[#8e918f] font-mono select-none">
        {/* Left: File Tab & Language Badge */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1f2229] border border-[#333742] text-white">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: details.color }}
            />
            <span className="font-semibold text-[11px] truncate">{details.filename}</span>
          </div>

          <span
            className="text-[10px] px-1.5 py-0.5 rounded font-medium border border-[#333538]"
            style={{ color: details.color, borderColor: `${details.color}40` }}
          >
            {details.badge}
          </span>
          <span className="text-[10px] text-[#5f6368] hidden sm:inline">
            {lines.length} {lines.length === 1 ? 'line' : 'lines'}
          </span>
        </div>

        {/* Right: Actions (Run, Wrap, Copy) */}
        <div className="flex items-center gap-1.5">
          {/* Replit Run Button */}
          {details.runnable && (
            <button
              type="button"
              onClick={handleRunCode}
              disabled={isRunning}
              title={`Run ${details.badge} in Replit Terminal`}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1b3e2b] hover:bg-[#235339] text-[#7ce38b] border border-[#34a853]/40 text-xs font-semibold cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  <span>Run</span>
                </>
              )}
            </button>
          )}

          {/* Toggle Wrap */}
          <button
            type="button"
            onClick={() => setWrapLines((w) => !w)}
            title={wrapLines ? 'Disable line wrap' : 'Enable line wrap'}
            className={`px-1.5 py-1 rounded text-[10px] border transition-colors cursor-pointer ${
              wrapLines
                ? 'bg-[#282a2c] text-[#a8c7fa] border-[#a8c7fa]/40'
                : 'text-[#8e918f] border-transparent hover:text-white hover:bg-[#252830]'
            }`}
          >
            wrap
          </button>

          {/* Copy Button */}
          <button
            type="button"
            onClick={onCopy}
            title="Copy code"
            className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md hover:bg-[#252830] hover:text-white transition-all cursor-pointer text-[#8e918f]"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#34a853]" />
                <span className="text-[#34a853] font-sans">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="font-sans">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Editor Body with Line Numbers */}
      <div className="flex bg-[#0a0b0e] text-xs font-mono">
        {/* Line Numbers Gutter */}
        <div className="py-3 pl-3 pr-2 text-right text-[#4e535e] select-none bg-[#090a0c] border-r border-[#1e2129] font-mono text-[11px] leading-[20px]">
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Code Content */}
        <pre
          className={`flex-1 p-3 text-[#e3e3e3] font-mono text-[12px] leading-[20px] selection:bg-[#a8c7fa]/25 ${
            wrapLines ? 'whitespace-pre-wrap break-words' : 'overflow-x-auto whitespace-pre'
          }`}
        >
          <code>{trimmedCode}</code>
        </pre>
      </div>

      {/* Replit Console Output Tray */}
      {showConsole && (
        <div className="border-t border-[#2e3138] bg-[#07080a] text-xs font-mono animate-in fade-in slide-in-from-top-1">
          {/* Console Header */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#121418] border-b border-[#242730] text-[11px]">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-[#a8c7fa]" />
              <span className="font-semibold text-white">Console Output</span>

              {result && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                    result.exitCode === 0
                      ? 'bg-[#1b3e2b] text-[#7ce38b]'
                      : 'bg-[#4b1e1e] text-[#f28b82]'
                  }`}
                >
                  Exit: {result.exitCode} ({result.durationMs}ms)
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {/* Re-run */}
              <button
                type="button"
                onClick={handleRunCode}
                disabled={isRunning}
                title="Re-run in terminal"
                className="p-1 rounded hover:bg-[#252830] text-[#8e918f] hover:text-white cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
              </button>

              {/* Open in full interactive terminal if supported */}
              {onOpenTerminal && (
                <button
                  type="button"
                  onClick={handleOpenInTerminal}
                  title="Open full interactive terminal"
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#1e222a] hover:bg-[#282d38] text-[10px] text-[#a8c7fa] hover:text-white cursor-pointer transition-colors"
                >
                  <span>Terminal</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </button>
              )}

              {/* Close Console */}
              <button
                type="button"
                onClick={() => setShowConsole(false)}
                title="Hide console"
                className="p-1 rounded hover:bg-[#252830] text-[#8e918f] hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Console Body */}
          <div className="p-3 max-h-[220px] overflow-y-auto custom-scrollbar font-mono text-[11px] leading-relaxed">
            {isRunning && (
              <div className="flex items-center gap-2 text-[#8e918f] animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#a8c7fa]" />
                <span>Executing in sandbox environment...</span>
              </div>
            )}

            {!isRunning && result && (
              <>
                {result.stdout && (
                  <div className="text-[#81c995] whitespace-pre-wrap">{result.stdout}</div>
                )}
                {result.stderr && (
                  <div className="text-[#f28b82] whitespace-pre-wrap mt-1">
                    {result.stderr}
                  </div>
                )}
                {!result.stdout && !result.stderr && (
                  <div className="text-[#8e918f] italic">Program executed with no output.</div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
