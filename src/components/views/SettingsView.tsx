import React, { useState, useEffect } from 'react';
import {
  Settings,
  Key,
  Sun,
  Moon,
  Github,
  Shield,
  CheckCircle2,
  Lock,
  Cpu,
  RefreshCw,
  Eye,
  EyeOff,
  Save,
  Sliders,
  Sparkles,
  Smartphone,
  Monitor,
  User,
  LogOut,
  LogIn,
} from 'lucide-react';
import { UserProfile } from '../../types';

interface SettingsViewProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  isMobileFrame: boolean;
  onToggleFrame: () => void;
  currentUser?: UserProfile | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onOpenGitHubModal: () => void;
}

export function SettingsView({
  theme,
  onToggleTheme,
  isMobileFrame,
  onToggleFrame,
  currentUser,
  onOpenAuth,
  onSignOut,
  onOpenGitHubModal,
}: SettingsViewProps) {
  // API Keys state
  const [groqKey, setGroqKey] = useState(() => localStorage.getItem('codepilot_api_groq') || '');
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('codepilot_api_gemini') || '');
  const [ollamaHost, setOllamaHost] = useState(() => localStorage.getItem('codepilot_api_ollama') || 'http://localhost:11434');
  const [kimiKey, setKimiKey] = useState(() => localStorage.getItem('codepilot_api_kimi') || '');
  const [githubPat, setGithubPat] = useState(() => localStorage.getItem('codepilot_github_pat') || '');

  // Visibility toggles
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showKimiKey, setShowKimiKey] = useState(false);
  const [showGithubPat, setShowGithubPat] = useState(false);

  // Agent Permissions
  const [autoExecuteBash, setAutoExecuteBash] = useState(() => {
    return localStorage.getItem('codepilot_perm_bash') !== 'false';
  });
  const [autoApplyCode, setAutoApplyCode] = useState(() => {
    return localStorage.getItem('codepilot_perm_code') !== 'false';
  });
  const [showThinking, setShowThinking] = useState(() => {
    return localStorage.getItem('codepilot_perm_thinking') !== 'false';
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveKeys = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('codepilot_api_groq', groqKey.trim());
      localStorage.setItem('codepilot_api_gemini', geminiKey.trim());
      localStorage.setItem('codepilot_api_ollama', ollamaHost.trim());
      localStorage.setItem('codepilot_api_kimi', kimiKey.trim());
      localStorage.setItem('codepilot_github_pat', githubPat.trim());

      localStorage.setItem('codepilot_perm_bash', String(autoExecuteBash));
      localStorage.setItem('codepilot_perm_code', String(autoApplyCode));
      localStorage.setItem('codepilot_perm_thinking', String(showThinking));

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <div
      id="view-settings"
      className="h-full overflow-y-auto pb-20 p-4 sm:p-6 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-150 custom-scrollbar"
    >
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#2b2d34]">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-sky-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">System & Agent Settings</h1>
          </div>
          <p className="text-xs text-[#8e918f] mt-0.5">
            Manage model credentials, UI appearance, GitHub tokens, and execution permissions.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings Saved Successfully</span>
          </div>
        )}
      </div>

      {/* 2. Theme & Appearance Switcher */}
      <div className="rounded-2xl bg-[#16171b] border border-[#2b2d34] p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {theme === 'light' ? (
              <Sun className="w-5 h-5 text-amber-500" />
            ) : (
              <Moon className="w-5 h-5 text-sky-400" />
            )}
            <div>
              <h3 className="text-sm font-bold text-white">Appearance & Theme</h3>
              <p className="text-xs text-[#8e918f]">Toggle between high-contrast dark and light themes</p>
            </div>
          </div>

          <button
            id="settings-btn-theme-toggle"
            type="button"
            onClick={onToggleTheme}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#20222a] hover:bg-[#2a2c36] text-xs font-semibold text-white border border-[#33353e] transition-all cursor-pointer shadow-xs active:scale-95"
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-4 h-4 text-blue-400" />
                <span>Switch to 🌙 Dark</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Switch to ☀️ Light</span>
              </>
            )}
          </button>
        </div>

        {/* Display Shell Mode (Mobile Shell vs Desktop Fluid) */}
        <div className="pt-3 border-t border-[#26282e] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-white block">Workspace Display Frame</span>
            <span className="text-[11px] text-[#8e918f]">
              {isMobileFrame ? 'Mobile Shell Frame (400px iOS frame)' : 'Desktop Fluid (Full Canvas)'}
            </span>
          </div>

          <button
            type="button"
            onClick={onToggleFrame}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#20222a] hover:bg-[#2a2c36] text-xs text-[#c4c7c5] hover:text-white border border-[#33353e] transition-colors cursor-pointer self-start sm:self-center"
          >
            {isMobileFrame ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
            <span>{isMobileFrame ? 'Switch to Desktop Fluid' : 'Switch to Mobile Frame'}</span>
          </button>
        </div>
      </div>

      {/* 3. API Key Management (Groq, Gemini, Ollama, Kimi) */}
      <form
        onSubmit={handleSaveKeys}
        className="rounded-2xl bg-[#16171b] border border-[#2b2d34] p-5 shadow-sm space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#26282e]">
          <div className="flex items-center gap-2.5">
            <Key className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="text-sm font-bold text-white">AI Model API Credentials</h3>
              <p className="text-xs text-[#8e918f]">Stored securely in local client storage</p>
            </div>
          </div>

          <button
            type="submit"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Credentials</span>
          </button>
        </div>

        <div className="space-y-3.5 text-xs">
          {/* Groq API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-white flex items-center gap-1.5">
                <span>Groq API Key (LPU Ultra-Fast)</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400">
                  Recommended
                </span>
              </label>
              <button
                type="button"
                onClick={() => setShowGroqKey(!showGroqKey)}
                className="text-[11px] text-[#8e918f] hover:text-white"
              >
                {showGroqKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="relative">
              <input
                type={showGroqKey ? 'text' : 'password'}
                placeholder="gsk_..."
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                className="w-full bg-[#1b1d22] border border-[#33353c] rounded-xl px-3 py-2 text-xs text-white placeholder-[#757575] focus:outline-none focus:border-sky-400 font-mono"
              />
            </div>
          </div>

          {/* Gemini API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-white flex items-center gap-1.5">
                <span>Google Gemini API Key</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-blue-500/20 text-blue-400">
                  Multimodal
                </span>
              </label>
              <button
                type="button"
                onClick={() => setShowGeminiKey(!showGeminiKey)}
                className="text-[11px] text-[#8e918f] hover:text-white"
              >
                {showGeminiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <input
              type={showGeminiKey ? 'text' : 'password'}
              placeholder="AIzaSy..."
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="w-full bg-[#1b1d22] border border-[#33353c] rounded-xl px-3 py-2 text-xs text-white placeholder-[#757575] focus:outline-none focus:border-sky-400 font-mono"
            />
          </div>

          {/* Ollama Local Endpoint */}
          <div className="space-y-1.5">
            <label className="font-semibold text-white flex items-center gap-1.5">
              <span>Ollama Host URL (Local Self-Hosted)</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-sky-500/20 text-sky-400">
                Offline
              </span>
            </label>
            <input
              type="text"
              placeholder="http://localhost:11434"
              value={ollamaHost}
              onChange={(e) => setOllamaHost(e.target.value)}
              className="w-full bg-[#1b1d22] border border-[#33353c] rounded-xl px-3 py-2 text-xs text-white placeholder-[#757575] focus:outline-none focus:border-sky-400 font-mono"
            />
          </div>

          {/* Kimi / Moonshot API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-white flex items-center gap-1.5">
                <span>Kimi / Moonshot API Key</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-purple-500/20 text-purple-400">
                  128k Context
                </span>
              </label>
              <button
                type="button"
                onClick={() => setShowKimiKey(!showKimiKey)}
                className="text-[11px] text-[#8e918f] hover:text-white"
              >
                {showKimiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <input
              type={showKimiKey ? 'text' : 'password'}
              placeholder="sk-..."
              value={kimiKey}
              onChange={(e) => setKimiKey(e.target.value)}
              className="w-full bg-[#1b1d22] border border-[#33353c] rounded-xl px-3 py-2 text-xs text-white placeholder-[#757575] focus:outline-none focus:border-sky-400 font-mono"
            />
          </div>
        </div>
      </form>

      {/* 4. GitHub Personal Access Token (PAT) */}
      <div className="rounded-2xl bg-[#16171b] border border-[#2b2d34] p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Github className="w-5 h-5 text-white" />
            <div>
              <h3 className="text-sm font-bold text-white">GitHub Token & Repositories</h3>
              <p className="text-xs text-[#8e918f]">Configure PAT with `repo` scope for commits & push</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenGitHubModal}
            className="px-3 py-1.5 rounded-xl bg-[#20222a] hover:bg-[#2a2c36] text-xs font-semibold text-sky-400 hover:text-sky-300 border border-[#33353e] transition-colors cursor-pointer"
          >
            Manage GitHub
          </button>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-white">Personal Access Token (PAT)</label>
            <button
              type="button"
              onClick={() => setShowGithubPat(!showGithubPat)}
              className="text-[11px] text-[#8e918f] hover:text-white"
            >
              {showGithubPat ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          <input
            type={showGithubPat ? 'text' : 'password'}
            placeholder="ghp_..."
            value={githubPat}
            onChange={(e) => setGithubPat(e.target.value)}
            className="w-full bg-[#1b1d22] border border-[#33353c] rounded-xl px-3 py-2 text-xs text-white placeholder-[#757575] focus:outline-none focus:border-sky-400 font-mono"
          />
        </div>
      </div>

      {/* 5. Autonomous Agent Permissions */}
      <div className="rounded-2xl bg-[#16171b] border border-[#2b2d34] p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <Shield className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="text-sm font-bold text-white">Agent Execution Permissions</h3>
            <p className="text-xs text-[#8e918f]">Control autonomous terminal and file system capabilities</p>
          </div>
        </div>

        <div className="space-y-3 pt-2 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#1b1d22] border border-[#282a30]">
            <div>
              <span className="font-semibold text-white block">Auto-execute Bash Commands</span>
              <span className="text-[11px] text-[#8e918f]">
                Allow the agent to run terminal commands (`npm`, `git`, `bash`) automatically
              </span>
            </div>
            <input
              type="checkbox"
              checked={autoExecuteBash}
              onChange={(e) => setAutoExecuteBash(e.target.checked)}
              className="w-4 h-4 accent-sky-400 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-[#1b1d22] border border-[#282a30]">
            <div>
              <span className="font-semibold text-white block">Direct File Writing</span>
              <span className="text-[11px] text-[#8e918f]">
                Allow the agent to write components and backend modules directly
              </span>
            </div>
            <input
              type="checkbox"
              checked={autoApplyCode}
              onChange={(e) => setAutoApplyCode(e.target.checked)}
              className="w-4 h-4 accent-sky-400 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-[#1b1d22] border border-[#282a30]">
            <div>
              <span className="font-semibold text-white block">Transparent Multi-Agent Thinking</span>
              <span className="text-[11px] text-[#8e918f]">
                Display detailed &lt;thinking&gt; accordion reasoning steps in chat
              </span>
            </div>
            <input
              type="checkbox"
              checked={showThinking}
              onChange={(e) => setShowThinking(e.target.checked)}
              className="w-4 h-4 accent-sky-400 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 6. Account & System Details */}
      <div className="rounded-2xl bg-[#16171b] border border-[#2b2d34] p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <User className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Developer Account</h3>
              <p className="text-xs text-[#8e918f]">
                {currentUser ? `${currentUser.name} (${currentUser.email})` : 'Guest Session Active'}
              </p>
            </div>
          </div>

          {currentUser ? (
            <button
              type="button"
              onClick={onSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs font-semibold border border-red-500/30 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black text-xs font-semibold transition-colors cursor-pointer shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
