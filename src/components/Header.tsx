import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  ChevronDown,
  Eye,
  Code2,
  Terminal,
  LogIn,
  LogOut,
  ShieldCheck,
  User as UserIcon,
  Sparkles,
  ExternalLink,
  Bot,
  Settings,
} from 'lucide-react';
import { Model, UserProfile } from '../types';

export type WorkspaceMode = 'preview' | 'code' | 'terminal';

interface HeaderProps {
  currentModel: Model;
  onOpenMenu: () => void;
  onOpenModelPicker: () => void;
  onOpenSettings?: () => void;
  activeMode: WorkspaceMode;
  onSelectMode: (mode: WorkspaceMode) => void;
  onExternalLaunch?: () => void;
  currentUser?: UserProfile | null;
  onOpenAuth?: () => void;
  onSignOut?: () => void;
}

export function Header({
  currentModel,
  onOpenMenu,
  onOpenModelPicker,
  onOpenSettings,
  activeMode,
  onSelectMode,
  onExternalLaunch,
  currentUser,
  onOpenAuth,
  onSignOut,
}: HeaderProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      id="top-header-bar"
      className="sticky top-0 z-30 h-13 flex items-center justify-between px-3 bg-[#111216]/95 backdrop-blur-md border-b border-[#2e3036] flex-nowrap overflow-visible gap-2 select-none"
    >
      {/* Left: Hamburger menu + Model picker */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          id="btn-open-workspace-drawer"
          type="button"
          onClick={onOpenMenu}
          aria-label="Open Workspace Menu"
          title="Open Workspace Menu"
          className="p-1.5 rounded-lg text-[#c4c7c5] hover:text-white hover:bg-[#1e2025] transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Model Selector Dropdown Button */}
        <button
          id="btn-model-picker"
          type="button"
          onClick={onOpenModelPicker}
          aria-label={`Select AI Model, Current: ${currentModel.name}`}
          className="h-8.5 px-2.5 rounded-full bg-[#1b1d22] hover:bg-[#252830] border border-[#33353c] flex items-center gap-1.5 transition-all cursor-pointer shadow-xs group"
        >
          <span className="text-xs font-semibold text-[#e3e3e3] group-hover:text-white truncate max-w-[110px] sm:max-w-[140px]">
            {currentModel.name}
          </span>
          <span className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#2a2c35] text-sky-300">
            {currentModel.provider}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-[#8e918f] group-hover:text-white transition-colors shrink-0" />
        </button>
      </div>

      {/* Center: Mode Segmented Switcher (Preview | Code | Terminal) */}
      <div className="flex items-center justify-center">
        <div className="flex items-center p-0.5 rounded-xl bg-[#18191d] border border-[#2d2f36] shadow-inner">
          <button
            id="header-tab-preview"
            type="button"
            onClick={() => onSelectMode('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeMode === 'preview'
                ? 'bg-emerald-500 text-black shadow-xs'
                : 'text-[#8e918f] hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>

          <button
            id="header-tab-code"
            type="button"
            onClick={() => onSelectMode('code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeMode === 'code'
                ? 'bg-sky-500 text-black shadow-xs'
                : 'text-[#8e918f] hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Code</span>
          </button>

          <button
            id="header-tab-terminal"
            type="button"
            onClick={() => onSelectMode('terminal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeMode === 'terminal'
                ? 'bg-amber-400 text-black shadow-xs'
                : 'text-[#8e918f] hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Terminal</span>
          </button>
        </div>
      </div>

      {/* Right: External Launch, & Profile / Sign-in */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* External Launch New Window */}
        {onExternalLaunch && (
          <button
            id="header-btn-external-launch"
            type="button"
            onClick={onExternalLaunch}
            title="Open Live Preview in New Window"
            className="p-1.5 rounded-lg text-[#8e918f] hover:text-white hover:bg-[#1e2025] transition-colors cursor-pointer hidden sm:block"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        )}

        {/* User Profile or Sign-in button */}
        {currentUser ? (
          <div className="relative" ref={profileMenuRef}>
            <button
              id="header-btn-user-profile"
              type="button"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-1.5 h-8 pl-1 pr-2 rounded-full bg-[#1e1f24] hover:bg-[#26282f] border border-[#33353c] transition-all cursor-pointer shadow-xs"
            >
              <img
                src={
                  currentUser.avatar ||
                  `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.email}`
                }
                alt={currentUser.name}
                className="w-6 h-6 rounded-full bg-zinc-800 object-cover border border-[#444746]"
              />
              <span className="text-xs font-medium text-[#e3e3e3] max-w-[80px] truncate hidden sm:inline-block">
                {currentUser.name}
              </span>
              <ChevronDown className="w-3 h-3 text-[#8e918f]" />
            </button>

            {/* Profile Dropdown */}
            {isProfileMenuOpen && (
              <div
                id="header-user-dropdown"
                className="absolute right-0 mt-2 w-56 rounded-xl border border-[#333538] bg-[#1a1c22] p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 text-white"
              >
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#2d3038]">
                  <img
                    src={
                      currentUser.avatar ||
                      `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.email}`
                    }
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-full bg-zinc-800 object-cover border border-sky-500/40"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
                    <div className="text-[10px] text-zinc-400 truncate">{currentUser.email}</div>
                  </div>
                </div>

                <div className="py-2 space-y-1 text-[11px] text-zinc-400">
                  <div className="flex items-center justify-between">
                    <span>Account Status</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verified
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#2d3038]">
                  <button
                    id="header-btn-signout"
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      if (onSignOut) onSignOut();
                    }}
                    className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            id="header-btn-signin"
            type="button"
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 hover:text-sky-300 border border-sky-500/40 text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
}
