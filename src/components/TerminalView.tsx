import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { SearchAddon } from '@xterm/addon-search';
import '@xterm/xterm/css/xterm.css';
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Shell,
  Search,
  Trash2,
  X,
  Play,
  RotateCcw,
  CornerDownLeft,
  Keyboard,
} from 'lucide-react';

interface TerminalViewProps {
  initialCommand?: string;
  onExecuteAgentCommand?: (cmd: string) => void;
  className?: string;
  onClose?: () => void;
}

export function TerminalView({
  initialCommand,
  className = '',
  onClose,
}: TerminalViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const searchAddonRef = useRef<SearchAddon | null>(null);

  const [cwd, setCwd] = useState('~/workspace');
  const [fontSize, setFontSize] = useState(17);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSessionMenuOpen, setIsSessionMenuOpen] = useState(false);
  const [activeSession, setActiveSession] = useState('bash');
  const [isExecuting, setIsExecuting] = useState(false);
  const [showQuickKeys, setShowQuickKeys] = useState(false);
  const [quickInput, setQuickInput] = useState('');

  // Line buffer & history refs for interactive keyboard typing
  const inputBufferRef = useRef('');
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const cwdRef = useRef('/app/applet');
  const isExecutingRef = useRef(false);

  // Format path to match the screenshot: ~/workspace
  const formatDisplayPath = useCallback((dir: string) => {
    if (!dir || dir === '/' || dir.includes('applet') || dir.includes('workspace')) {
      return '~/workspace';
    }
    const cleaned = dir.replace(/^\/root/, '~').replace(/^\/home\/[^\/]+/, '~');
    return cleaned.startsWith('~') ? cleaned : `~/${cleaned.replace(/^\//, '')}`;
  }, []);

  // Format prompt exactly as shown in the screenshot:
  // ~/workspace in bright cyan, followed by $ in white/gray
  const getPrompt = useCallback(
    (dir: string) => {
      const display = formatDisplayPath(dir);
      return `\x1b[38;2;56;189;248m${display}\x1b[0m$ `;
    },
    [formatDisplayPath]
  );

  // Execute command on container backend
  const executeCommand = useCallback(
    async (cmd: string, echoPrompt = false) => {
      const term = xtermRef.current;
      if (!term) return;

      const trimmed = cmd.trim();

      if (echoPrompt) {
        term.write(`\x1b[37m${trimmed}\x1b[0m\r\n`);
      }

      if (!trimmed) {
        term.write(getPrompt(cwdRef.current));
        return;
      }

      if (trimmed === 'clear') {
        term.clear();
        term.write(getPrompt(cwdRef.current));
        return;
      }

      if (historyRef.current[historyRef.current.length - 1] !== trimmed) {
        historyRef.current.push(trimmed);
      }
      historyIndexRef.current = historyRef.current.length;

      setIsExecuting(true);
      isExecutingRef.current = true;

      try {
        const res = await fetch('/api/terminal/exec', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: trimmed, cwd: cwdRef.current }),
        });
        const data = await res.json();

        if (data.cwd) {
          cwdRef.current = data.cwd;
          setCwd(formatDisplayPath(data.cwd));
        }

        if (data.stdout) {
          const formatted = data.stdout.replace(/\r?\n/g, '\r\n');
          term.write(formatted);
          if (!formatted.endsWith('\r\n')) {
            term.write('\r\n');
          }
        }

        if (data.stderr) {
          const formatted = data.stderr.replace(/\r?\n/g, '\r\n');
          term.write(`\x1b[31m${formatted}\x1b[0m`);
          if (!formatted.endsWith('\r\n')) {
            term.write('\r\n');
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        term.write(`\x1b[31mbash: execution error: ${msg}\x1b[0m\r\n`);
      } finally {
        setIsExecuting(false);
        isExecutingRef.current = false;
        inputBufferRef.current = '';
        term.write(getPrompt(cwdRef.current));
      }
    },
    [getPrompt, formatDisplayPath]
  );

  // Initialize xterm with screenshot-faithful theme and addons
  useEffect(() => {
    if (!containerRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      cursorStyle: 'block',
      fontSize: fontSize,
      fontWeight: '600',
      fontWeightBold: '700',
      lineHeight: 1.4,
      letterSpacing: 0.5,
      fontFamily:
        'JetBrains Mono, Menlo, Monaco, Consolas, "Courier New", monospace',
      theme: {
        background: '#161719',
        foreground: '#e3e3e3',
        cursor: '#ffffff',
        cursorAccent: '#161719',
        selectionBackground: 'rgba(56, 189, 248, 0.3)',
        black: '#1f2124',
        red: '#f28b82',
        green: '#81c995',
        yellow: '#fdd663',
        blue: '#38bdf8',
        magenta: '#d7aefb',
        cyan: '#38bdf8',
        white: '#e3e3e3',
        brightBlack: '#6f7278',
        brightRed: '#ee675c',
        brightGreen: '#5bb974',
        brightYellow: '#fcc934',
        brightBlue: '#60a5fa',
        brightMagenta: '#c58af9',
        brightCyan: '#78d9ec',
        brightWhite: '#ffffff',
      },
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    const searchAddon = new SearchAddon();
    term.loadAddon(searchAddon);

    term.open(containerRef.current);

    // Initial fit with small delay for container sizing
    setTimeout(() => {
      try {
        fitAddon.fit();
      } catch {}
    }, 50);

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;
    searchAddonRef.current = searchAddon;

    // Direct clean start: exactly as shown in the screenshot
    term.write(getPrompt(cwdRef.current));

    // Fetch container cwd silently in background to ensure sync
    fetch('/api/terminal/info')
      .then((r) => r.json())
      .then((info) => {
        if (info.cwd) {
          cwdRef.current = info.cwd;
          setCwd(formatDisplayPath(info.cwd));
        }
        if (initialCommand) {
          executeCommand(initialCommand, true);
        }
      })
      .catch(() => {});

    // Interactive keystroke handler
    const dataDisposable = term.onData((data) => {
      if (isExecutingRef.current) return;

      // Enter / Return
      if (data === '\r') {
        const cmd = inputBufferRef.current;
        inputBufferRef.current = '';
        term.write('\r\n');
        executeCommand(cmd, false);
        return;
      }

      // Backspace
      if (data === '\u007F' || data === '\b') {
        if (inputBufferRef.current.length > 0) {
          inputBufferRef.current = inputBufferRef.current.slice(0, -1);
          term.write('\b \b');
        }
        return;
      }

      // Ctrl+C
      if (data === '\u0003') {
        inputBufferRef.current = '';
        term.write('^C\r\n' + getPrompt(cwdRef.current));
        return;
      }

      // Ctrl+L (Clear screen)
      if (data === '\u000C') {
        term.clear();
        term.write(getPrompt(cwdRef.current) + inputBufferRef.current);
        return;
      }

      // Arrow Up (History Previous)
      if (data === '\x1b[A') {
        if (historyRef.current.length > 0 && historyIndexRef.current > 0) {
          historyIndexRef.current -= 1;
          const prevCmd = historyRef.current[historyIndexRef.current] || '';
          while (inputBufferRef.current.length > 0) {
            term.write('\b \b');
            inputBufferRef.current = inputBufferRef.current.slice(0, -1);
          }
          inputBufferRef.current = prevCmd;
          term.write(prevCmd);
        }
        return;
      }

      // Arrow Down (History Next)
      if (data === '\x1b[B') {
        if (historyIndexRef.current < historyRef.current.length - 1) {
          historyIndexRef.current += 1;
          const nextCmd = historyRef.current[historyIndexRef.current] || '';
          while (inputBufferRef.current.length > 0) {
            term.write('\b \b');
            inputBufferRef.current = inputBufferRef.current.slice(0, -1);
          }
          inputBufferRef.current = nextCmd;
          term.write(nextCmd);
        } else if (historyIndexRef.current === historyRef.current.length - 1) {
          historyIndexRef.current = historyRef.current.length;
          while (inputBufferRef.current.length > 0) {
            term.write('\b \b');
            inputBufferRef.current = inputBufferRef.current.slice(0, -1);
          }
        }
        return;
      }

      // Tab key
      if (data === '\t') {
        return;
      }

      // Escape sequences
      if (data.startsWith('\x1b')) {
        return;
      }

      // Regular characters
      inputBufferRef.current += data;
      term.write(data);
    });

    const handleResize = () => {
      try {
        fitAddon.fit();
      } catch {}
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      dataDisposable.dispose();
      term.dispose();
    };
  }, [getPrompt, executeCommand, initialCommand, formatDisplayPath]);

  // Handle dynamic font resize
  useEffect(() => {
    if (xtermRef.current) {
      xtermRef.current.options.fontSize = fontSize;
      try {
        fitAddonRef.current?.fit();
      } catch {}
    }
  }, [fontSize]);

  // Search Addon helper
  const handleSearch = (direction: 'next' | 'prev') => {
    if (!searchAddonRef.current || !searchQuery.trim()) return;
    if (direction === 'next') {
      searchAddonRef.current.findNext(searchQuery);
    } else {
      searchAddonRef.current.findPrevious(searchQuery);
    }
  };

  // Clear terminal screen
  const handleClear = () => {
    const term = xtermRef.current;
    if (term) {
      term.clear();
      inputBufferRef.current = '';
      term.write(getPrompt(cwdRef.current));
      term.focus();
    }
  };

  // Quick keys helpers for mobile
  const handleSendKey = (key: string) => {
    const term = xtermRef.current;
    if (!term) return;

    if (key === 'TAB') {
      term.focus();
    } else if (key === 'CTRL+C') {
      inputBufferRef.current = '';
      term.write('^C\r\n' + getPrompt(cwdRef.current));
      term.focus();
    } else if (key === 'CLEAR') {
      handleClear();
    } else if (key === 'UP') {
      if (historyRef.current.length > 0 && historyIndexRef.current > 0) {
        historyIndexRef.current -= 1;
        const prevCmd = historyRef.current[historyIndexRef.current] || '';
        while (inputBufferRef.current.length > 0) {
          term.write('\b \b');
          inputBufferRef.current = inputBufferRef.current.slice(0, -1);
        }
        inputBufferRef.current = prevCmd;
        term.write(prevCmd);
      }
      term.focus();
    } else if (key === 'DOWN') {
      if (historyIndexRef.current < historyRef.current.length - 1) {
        historyIndexRef.current += 1;
        const nextCmd = historyRef.current[historyIndexRef.current] || '';
        while (inputBufferRef.current.length > 0) {
          term.write('\b \b');
          inputBufferRef.current = inputBufferRef.current.slice(0, -1);
        }
        inputBufferRef.current = nextCmd;
        term.write(nextCmd);
      }
      term.focus();
    }
  };

  return (
    <div
      className={`flex flex-col h-full w-full bg-[#161719] text-[#e3e3e3] select-none ${className}`}
    >
      {/* 1. TOP HEADER BAR: Back Arrow < + [ 🐚 Shell ] Pill (Larger & Touch-Friendly) */}
      <div className="h-16 px-4 flex items-center justify-between bg-[#161719] shrink-0 border-b border-transparent">
        <div className="flex items-center gap-3.5">
          {/* Back button < */}
          <button
            onClick={onClose}
            aria-label="Back"
            className="p-2 -ml-1.5 text-[#e3e3e3] hover:text-white hover:bg-[#25272a] rounded-xl transition-colors cursor-pointer active:scale-95"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Shell Pill Button */}
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-[#232529] border border-[#32353a] shadow-xs select-none">
            <Shell className="w-5 h-5 text-[#78d9ec]" />
            <span className="text-base font-semibold text-[#f1f3f4] tracking-tight">
              Shell
            </span>
          </div>
        </div>

        {/* Font Size & Accessory Controls */}
        <div className="flex items-center gap-2">
          {/* Font Size Zoom Stepper */}
          <div className="flex items-center bg-[#232529] border border-[#32353a] rounded-xl px-1 py-0.5 text-xs text-[#c4c7c5]">
            <button
              type="button"
              onClick={() => setFontSize((s) => Math.max(12, s - 2))}
              title="Decrease text size"
              className="px-2 py-1 hover:text-white rounded-lg transition-colors cursor-pointer active:scale-90 font-mono font-medium"
            >
              A-
            </button>
            <span className="text-[11px] text-[#8e918f] font-mono px-1 select-none">
              {fontSize}px
            </span>
            <button
              type="button"
              onClick={() => setFontSize((s) => Math.min(26, s + 2))}
              title="Increase text size"
              className="px-2 py-1 hover:text-white rounded-lg transition-colors cursor-pointer active:scale-90 font-mono font-medium"
            >
              A+
            </button>
          </div>

          {/* Mobile Keyboard Accessory Toggle */}
          <button
            type="button"
            onClick={() => setShowQuickKeys(!showQuickKeys)}
            title="Toggle Mobile Keypad Helper"
            className={`p-2.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
              showQuickKeys
                ? 'bg-[#232529] text-[#78d9ec]'
                : 'text-[#8e918f] hover:text-[#e3e3e3] hover:bg-[#202225]'
            }`}
          >
            <Keyboard className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. SUBHEADER: ~/workspace: bash (Left) + Search, Trash, Close (Right) */}
      <div className="relative h-11 px-4 flex items-center justify-between bg-[#161719] border-b border-[#25272a] text-sm shrink-0">
        {/* Left: Down Chevron v + Path: bash */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsSessionMenuOpen(!isSessionMenuOpen)}
            className="flex items-center gap-2 text-sm text-[#9aa0a6] font-mono hover:text-[#e3e3e3] transition-colors cursor-pointer py-1"
          >
            <ChevronDown className="w-4 h-4 text-[#9aa0a6]" />
            <span className="text-[#c4c7c5] font-medium">{cwd}</span>
            <span className="text-[#8e918f]">: {activeSession}</span>
          </button>

          {/* Session Switcher Popover */}
          {isSessionMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsSessionMenuOpen(false)}
              />
              <div className="absolute top-9 left-0 z-50 w-56 py-1.5 bg-[#232529] border border-[#333538] rounded-xl shadow-2xl animate-in fade-in zoom-in-95">
                <div className="px-3.5 py-1 text-[11px] font-semibold text-[#8e918f] uppercase tracking-wider">
                  Active Sessions
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveSession('bash');
                    setIsSessionMenuOpen(false);
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-mono flex items-center justify-between text-white hover:bg-[#2c2f35]"
                >
                  <span>~/workspace: bash</span>
                  <span className="text-[10px] text-[#81c995] font-sans font-medium">● Live</span>
                </button>
                <div className="h-[1px] bg-[#333538] my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setIsSessionMenuOpen(false);
                    executeCommand('node', true);
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-mono text-[#c4c7c5] hover:text-white hover:bg-[#2c2f35]"
                >
                  Start Node REPL
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSessionMenuOpen(false);
                    handleClear();
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs text-[#c4c7c5] hover:text-white hover:bg-[#2c2f35]"
                >
                  Clear Screen (Ctrl+L)
                </button>
              </div>
            </>
          )}
        </div>

        {/* Right: Search, Trash, Close Icons (Larger Touch Targets) */}
        <div className="flex items-center gap-4">
          {/* Search Icon */}
          <button
            type="button"
            onClick={() => {
              setIsSearchOpen(!isSearchOpen);
              setTimeout(() => {
                if (!isSearchOpen) {
                  document.getElementById('terminal-search-input')?.focus();
                }
              }, 50);
            }}
            title="Search in terminal"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isSearchOpen
                ? 'text-[#78d9ec]'
                : 'text-[#9aa0a6] hover:text-[#e3e3e3]'
            }`}
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Trash Icon (Clear Buffer) */}
          <button
            type="button"
            onClick={handleClear}
            title="Clear terminal output"
            className="p-1.5 text-[#9aa0a6] hover:text-[#e3e3e3] rounded-lg transition-colors cursor-pointer active:scale-90"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Close Icon */}
          <button
            type="button"
            onClick={onClose}
            title="Close terminal"
            className="p-1.5 text-[#9aa0a6] hover:text-[#e3e3e3] rounded-lg transition-colors cursor-pointer active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. INLINE SEARCH BAR (Toggled via Search Icon) */}
      {isSearchOpen && (
        <div className="px-4 py-2 bg-[#1b1d20] border-b border-[#25272a] flex items-center gap-2.5 animate-in slide-in-from-top-1">
          <input
            id="terminal-search-input"
            type="text"
            placeholder="Search terminal output..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              searchAddonRef.current?.findNext(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch(e.shiftKey ? 'prev' : 'next');
              } else if (e.key === 'Escape') {
                setIsSearchOpen(false);
              }
            }}
            className="flex-1 bg-[#232529] border border-[#333538] rounded-lg px-3 py-1.5 text-xs text-white placeholder-[#757575] focus:outline-none focus:border-[#78d9ec]"
          />
          <button
            type="button"
            onClick={() => handleSearch('prev')}
            className="p-1.5 text-[#9aa0a6] hover:text-white rounded"
            title="Previous match (Shift+Enter)"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleSearch('next')}
            className="p-1.5 text-[#9aa0a6] hover:text-white rounded"
            title="Next match (Enter)"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsSearchOpen(false)}
            className="p-1.5 text-[#9aa0a6] hover:text-white rounded"
            title="Close search"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4. TERMINAL CANVAS (Screenshot Faithful: Deep Dark Background & Large Bold Prompt) */}
      <div
        ref={containerRef}
        onClick={() => xtermRef.current?.focus()}
        className="flex-1 w-full px-4 pt-3.5 pb-2 bg-[#161719] overflow-hidden cursor-text"
      />

      {/* 5. MOBILE QUICK ACCESSORY ROW (Optional keypad helper for touch devices) */}
      {showQuickKeys && (
        <div className="px-2 py-1.5 bg-[#1b1d20] border-t border-[#25272a] flex flex-col gap-1.5 shrink-0 animate-in slide-in-from-bottom-2">
          {/* Quick Keys */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px] font-mono">
            {['TAB', 'CTRL+C', 'CLEAR', 'UP', 'DOWN'].map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => handleSendKey(k)}
                className="px-2.5 py-1 rounded bg-[#25272c] hover:bg-[#32353b] text-[#c4c7c5] hover:text-white border border-[#333538] transition-colors cursor-pointer shrink-0 active:scale-95"
              >
                {k === 'UP' ? '↑ Up' : k === 'DOWN' ? '↓ Down' : k}
              </button>
            ))}

            {/* Quick preset commands */}
            {['ls -la', 'pwd', 'git status'].map((cmd) => (
              <button
                key={cmd}
                type="button"
                onClick={() => executeCommand(cmd, true)}
                className="px-2 py-1 rounded bg-[#232529] hover:bg-[#32353b] text-[#8e918f] hover:text-[#78d9ec] border border-[#2e3137] transition-colors cursor-pointer shrink-0 flex items-center gap-1"
              >
                <Play className="w-2.5 h-2.5 text-[#78d9ec] fill-current" />
                <span>{cmd}</span>
              </button>
            ))}
          </div>

          {/* Direct Input Line (Helpful for virtual keyboards) */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!quickInput.trim() || isExecuting) return;
              executeCommand(quickInput.trim(), true);
              setQuickInput('');
            }}
            className="flex items-center gap-1.5"
          >
            <span className="text-[#38bdf8] font-mono text-xs select-none">$</span>
            <input
              type="text"
              placeholder="Type command here..."
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              disabled={isExecuting}
              className="flex-1 bg-[#232529] border border-[#333538] rounded-md px-2 py-1 text-xs text-white placeholder-[#757575] focus:outline-none focus:border-[#78d9ec] font-mono"
            />
            <button
              type="submit"
              disabled={!quickInput.trim() || isExecuting}
              className="px-2.5 py-1 bg-[#283756] hover:bg-[#344870] disabled:opacity-40 text-[#78d9ec] rounded-md text-xs font-medium cursor-pointer"
            >
              <CornerDownLeft className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
