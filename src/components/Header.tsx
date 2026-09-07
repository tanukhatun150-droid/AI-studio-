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
  isJarvisMode?: boolean;
  onToggleJarvisMode?: () => void;
  currentUser?: UserProfile | null;
  onOpenAuth?: () => void;
  onSignOut?: () => void;
}

export function Header({
  currentModel,
  onOpenMenu,
  onOpenModelPicker,
  activeMode,
  onSelectMode,
  currentUser,
  onOpenAuth,
  onSignOut,
}: HeaderProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
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
      className="sticky top-0 z-20 h-12 flex items-center justify-between px-3 bg-[#111216]/95 backdrop-blur-md border-b border-[#333538]/60 flex-nowrap overflow-visible gap-2 select-none relative"
    >
      {/* Left: Hamburger Menu + Compact Model Selector */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink min-w-0 z-10">
        {/* Workspace Menu Drawer Toggle */}
        <button
          id="btn-workspace-menu"
          onClick={onOpenMenu}
          aria-label="Open workspace menu"
          title="Workspace Menu"
          className="w-8 h-8 rounded-lg bg-[#1e1f20] hover:bg-[#282a2c] active:scale-95 text-[#e3e3e3] hover:text-white border border-[#333538] flex items-center justify-center transition-colors cursor-pointer shrink-0"
        >
          <Menu className="w-4 h-4 text-[#e3e3e3]" />
        </button>

        {/* Model Picker Compact Pill */}
        <button
          id="btn-model-picker"
          onClick={onOpenModelPicker}
          aria-label={`Change model, currently ${currentModel.name}`}
          title={`${currentModel.name} (${currentModel.detail})`}
          className="h-8 max-w-[125px] sm:max-w-[170px] md:max-w-[210px] rounded-lg bg-[#1e1f20] hover:bg-[#282a2c] active:scale-[0.98] border border-[#333538] px-2 sm:px-2.5 flex items-center justify-between gap-1 sm:gap-1.5 transition-all cursor-pointer group shrink truncate shadow-xs"
        >
          <span className="font-medium text-xs text-[#e3e3e3] group-hover:text-white truncate">
            {currentModel.name}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-[#8e918f] group-hover:text-white transition-colors shrink-0" />
        </button>
      </div>

      {/* Center: Workspace Mode Toggle Segmented Control (Preview | Code | Terminal) centered in header */}
      <div className="flex-1 flex items-center justify-center sm:absolute sm:left-1/2 sm:-translate-x-1/2 z-10">
        <div
          id="workspace-mode-tabs"
          className="flex items-center p-0.5 rounded-lg bg-[#1e1f20] border border-[#333538] shadow-xs"
        >
          {/* Preview Tab */}
          <button
            id="tab-mode-preview"
            onClick={() => onSelectMode('preview')}
            aria-label="Preview Mode"
            title="Live Web Preview"
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer select-none ${
              activeMode === 'preview'
                ? 'bg-[#282a2c] text-white shadow-xs border border-[#444746]/50'
                : 'text-[#8e918f] hover:text-[#e3e3e3] border border-transparent'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-[#a8c7fa]" />
            <span className="text-[11px] sm:text-xs">Preview</span>
          </button>

          {/* Code Tab */}
          <button
            id="tab-mode-code"
            onClick={() => onSelectMode('code')}
            aria-label="Code Mode"
            title="Autonomous Code & Chat"
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer select-none ${
              activeMode === 'code'
                ? 'bg-[#282a2c] text-white shadow-xs border border-[#444746]/50'
                : 'text-[#8e918f] hover:text-[#e3e3e3] border border-transparent'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-[#a8c7fa]" />
            <span className="text-[11px] sm:text-xs">Code</span>
          </button>

          {/* Terminal Tab */}
          <button
            id="tab-mode-terminal"
            onClick={() => onSelectMode('terminal')}
            aria-label="Terminal Mode"
            title="Interactive Bash Terminal"
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer select-none ${
              activeMode === 'terminal'
                ? 'bg-[#282a2c] text-white shadow-xs border border-[#444746]/50'
                : 'text-[#8e918f] hover:text-[#e3e3e3] border border-transparent'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-[#a8c7fa]" />
            <span className="text-[11px] sm:text-xs">Terminal</span>
          </button>
        </div>
      </div>

      {/* Right: Auth Profile or Sign In Button */}
      <div className="flex items-center justify-end min-w-[90px] sm:min-w-[140px] md:min-w-[170px] shrink-0 z-20">
        {currentUser ? (
          <div className="relative" ref={profileMenuRef}>
            <button
              id="btn-header-user-profile"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-1.5 h-8 pl-1 pr-2 rounded-full bg-[#1e1f20] hover:bg-[#282a2c] border border-[#333538] transition-all cursor-pointer shadow-xs"
              title={`${currentUser.name} (${currentUser.email})`}
            >
              <img
                src={currentUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.email}`}
                alt={currentUser.name}
                className="w-6 h-6 rounded-full bg-zinc-800 object-cover border border-[#444746]"
              />
              <span className="text-xs font-medium text-[#e3e3e3] max-w-[80px] sm:max-w-[110px] truncate hidden xs:inline-block">
                {currentUser.name}
              </span>
              <ChevronDown className="w-3 h-3 text-[#8e918f]" />
            </button>

            {/* Profile Dropdown */}
            {isProfileMenuOpen && (
              <div
                id="header-user-dropdown"
                className="absolute right-0 mt-2 w-64 rounded-xl border border-[#333538] bg-[#1a1c22] p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 text-white"
              >
                <div className="flex items-center gap-2.5 pb-3 border-b border-[#2d3038]">
                  <img
                    src={currentUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.email}`}
                    alt={currentUser.name}
                    className="w-9 h-9 rounded-full bg-zinc-800 object-cover border border-sky-500/40"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
                    <div className="text-[11px] text-zinc-400 truncate">{currentUser.email}</div>
                  </div>
                </div>

                <div className="py-2.5 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Provider</span>
                    <span className="capitalize font-semibold text-zinc-200">
                      {currentUser.provider}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Email Status</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verified
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#2d3038] flex flex-col gap-1">
                  <button
                    id="btn-switch-account"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      if (onOpenAuth) onOpenAuth();
                    }}
                    className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs text-zinc-300 hover:bg-[#252833] hover:text-white transition-colors cursor-pointer"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-sky-400" />
                    <span>Switch Account</span>
                  </button>

                  <button
                    id="btn-sign-out"
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
            id="btn-header-signin"
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 hover:text-sky-300 border border-sky-500/40 text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Sign In</span>
            <span className="xs:hidden">Login</span>
          </button>
        )}
      </div>
    </header>
  );
}

