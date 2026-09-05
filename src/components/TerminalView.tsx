import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import {
  Terminal as TerminalIcon,
  RotateCcw,
  Copy,
  Check,
  Play,
  Trash2,
  Folder,
  Wifi,
  WifiOff,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface TerminalViewProps {
  initialCommand?: string;
  onExecuteAgentCommand?: (cmd: string) => void;
  className?: string;
}

export function TerminalView({
  initialCommand,
  className = '',
}: TerminalViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [copied, setCopied] = useState(false);
  const [cwd, setCwd] = useState('~/applet');
  const [lastCommand, setLastCommand] = useState('');

  // Quick preset commands for AI Developer
  const quickCommands = [
    { label: 'git status', cmd: 'git status\n' },
    { label: 'npm run lint', cmd: 'npm run lint\n' },
    { label: 'npm run dev', cmd: 'npm run dev\n' },
    { label: 'ls -la', cmd: 'ls -la\n' },
    { label: 'node -v', cmd: 'node -v && npm -v\n' },
    { label: 'pip list', cmd: 'python3 -m pip list 2>/dev/null || python3 --version\n' },
  ];

  // Initialize xterm and connect to WebSocket
  useEffect(() => {
    if (!containerRef.current) return;

    // Create xterm instance with clean modern dark styling
    const term = new XTerm({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontSize: 12,
      lineHeight: 1.25,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#0e1013',
        foreground: '#d4d4d4',
        cursor: '#a8c7fa',
        cursorAccent: '#0e1013',
        selectionBackground: '#264f78',
        black: '#1e1f20',
        red: '#f28b82',
        green: '#81c995',
        yellow: '#fdd663',
        blue: '#a8c7fa',
        magenta: '#d7aefb',
        cyan: '#78d9ec',
        white: '#e3e3e3',
        brightBlack: '#5f6368',
        brightRed: '#ee675c',
        brightGreen: '#5bb974',
        brightYellow: '#fcc934',
        brightBlue: '#669df6',
        brightMagenta: '#c58af9',
        brightCyan: '#4ecde6',
        brightWhite: '#ffffff',
      },
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    term.writeln('\x1b[1;36m=== CodePilot Autonomous AI Shell (Bash) ===\x1b[0m');
    term.writeln('\x1b[90mConnecting to backend bash process via WebSocket...\x1b[0m\r\n');

    // Connect WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/terminal`;

    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        setConnecting(false);
        term.writeln('\x1b[1;32m✓ WebSocket connected to bash session.\x1b[0m\r\n');

        // If initial command provided, send it
        if (initialCommand) {
          ws.send(`${initialCommand}\n`);
        }
      };

      ws.onmessage = (event) => {
        term.write(event.data);
      };

      ws.onerror = () => {
        setConnecting(false);
        term.writeln('\r\n\x1b[31m[WebSocket connection error - fallback to REST available]\x1b[0m');
      };

      ws.onclose = () => {
        setConnected(false);
        setConnecting(false);
        term.writeln('\r\n\x1b[33m[Session disconnected]\x1b[0m');
      };

      // Handle user keypress in terminal
      term.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      });
    } catch (e) {
      console.error('Failed to create terminal socket:', e);
      setConnecting(false);
    }

    // Auto-fit on window resize
    const handleResize = () => {
      try {
        fitAddon.fit();
      } catch {}
    };
    window.addEventListener('resize', handleResize);

    // Fetch real cwd
    fetch('/api/terminal/cwd')
      .then((r) => r.json())
      .then((d) => {
        if (d.cwd) setCwd(d.cwd);
      })
      .catch(() => {});

    return () => {
      window.removeEventListener('resize', handleResize);
      if (wsRef.current) {
        wsRef.current.close();
      }
      term.dispose();
    };
  }, [initialCommand]);

  // Send a string command to terminal
  const sendCommand = (cmd: string) => {
    setLastCommand(cmd.trim());
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(cmd);
      xtermRef.current?.focus();
    } else {
      // Fallback to REST execution
      fetch('/api/terminal/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.stdout) xtermRef.current?.write(data.stdout);
          if (data.stderr) xtermRef.current?.write(`\x1b[31m${data.stderr}\x1b[0m`);
        });
    }
  };

  // Reconnect
  const handleReconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    setConnecting(true);
    xtermRef.current?.clear();
    xtermRef.current?.writeln('\x1b[90mReconnecting terminal...\x1b[0m\r\n');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/terminal`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setConnecting(false);
      xtermRef.current?.writeln('\x1b[1;32m✓ Reconnected.\x1b[0m\r\n');
    };
    ws.onmessage = (e) => xtermRef.current?.write(e.data);
    ws.onclose = () => {
      setConnected(false);
      setConnecting(false);
    };
  };

  // Clear terminal
  const handleClear = () => {
    xtermRef.current?.clear();
  };

  // Copy output
  const handleCopy = () => {
    // Select all or copy current buffer
    navigator.clipboard.writeText('Terminal session copied from Autonomous AI Developer');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex flex-col h-full bg-[#0e1013] rounded-xl border border-[#2e3036] overflow-hidden ${className}`}>
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#14161b] border-b border-[#2e3036] text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#1e2026] text-[#a8c7fa] font-mono text-[11px] border border-[#333538]">
            <TerminalIcon className="w-3.5 h-3.5 text-[#a8c7fa]" />
            <span>bash 5.2</span>
          </div>
          <div className="flex items-center gap-1 text-[11px]">
            {connected ? (
              <span className="flex items-center gap-1 text-[#81c995] font-medium">
                <span className="w-2 h-2 rounded-full bg-[#34a853] animate-pulse" />
                Live WS
              </span>
            ) : connecting ? (
              <span className="flex items-center gap-1 text-[#fdd663]">
                <span className="w-2 h-2 rounded-full bg-[#fdd663] animate-ping" />
                Connecting...
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[#f28b82]">
                <WifiOff className="w-3 h-3" />
                Offline
              </span>
            )}
          </div>
          <span className="text-[11px] text-[#8e918f] font-mono hidden md:inline truncate max-w-[180px]">
            {cwd}
          </span>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleClear}
            title="Clear terminal"
            className="p-1 rounded hover:bg-[#282a2c] text-[#8e918f] hover:text-[#e3e3e3] transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleReconnect}
            title="Reconnect shell"
            className="p-1 rounded hover:bg-[#282a2c] text-[#8e918f] hover:text-[#e3e3e3] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleCopy}
            title="Copy buffer"
            className="p-1 rounded hover:bg-[#282a2c] text-[#8e918f] hover:text-[#e3e3e3] transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#81c995]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Quick Action Commands Pill Row */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#121317] border-b border-[#25272e] overflow-x-auto custom-scrollbar text-[11px]">
        <span className="text-[#8e918f] shrink-0 text-[10px] uppercase font-semibold tracking-wider">Quick:</span>
        {quickCommands.map((q, idx) => (
          <button
            key={idx}
            onClick={() => sendCommand(q.cmd)}
            className="shrink-0 px-2 py-0.5 rounded bg-[#1c1e24] hover:bg-[#282a33] text-[#c4c7c5] hover:text-white border border-[#2e313a] transition-colors cursor-pointer font-mono flex items-center gap-1"
          >
            <Play className="w-2.5 h-2.5 text-[#a8c7fa] fill-current" />
            <span>{q.label}</span>
          </button>
        ))}
      </div>

      {/* xterm.js Canvas Mount */}
      <div
        ref={containerRef}
        className="flex-1 w-full h-[320px] sm:h-[400px] p-2 bg-[#0e1013] overflow-hidden"
      />
    </div>
  );
}
