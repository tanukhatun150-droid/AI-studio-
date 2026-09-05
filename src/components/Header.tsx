import React from 'react';
import {
  Menu,
  ChevronDown,
  ExternalLink,
  Settings,
  Eye,
  Code2,
  Terminal,
} from 'lucide-react';
import { Model } from '../types';

export type WorkspaceMode = 'preview' | 'code' | 'terminal';

interface HeaderProps {
  currentModel: Model;
  onOpenMenu: () => void;
  onOpenModelPicker: () => void;
  onOpenSettings: () => void;
  activeMode: WorkspaceMode;
  onSelectMode: (mode: WorkspaceMode) => void;
  onExternalLaunch?: () => void;
}

export function Header({
  currentModel,
  onOpenMenu,
  onOpenModelPicker,
  onOpenSettings,
  activeMode,
  onSelectMode,
  onExternalLaunch,
}: HeaderProps) {
  const handleExternalLaunch = () => {
    if (onExternalLaunch) {
      onExternalLaunch();
    } else {
      window.open(window.location.origin, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <header
      id="top-header-bar"
      className="sticky top-0 z-20 h-12 flex items-center justify-between px-3 bg-[#111216]/95 backdrop-blur-md border-b border-[#333538]/60 flex-nowrap overflow-hidden gap-2 select-none"
    >
      {/* Left: Hamburger Menu + Compact Model Selector */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink min-w-0">
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
          className="h-8 max-w-[115px] sm:max-w-[170px] md:max-w-[210px] rounded-lg bg-[#1e1f20] hover:bg-[#282a2c] active:scale-[0.98] border border-[#333538] px-2 sm:px-2.5 flex items-center justify-between gap-1 sm:gap-1.5 transition-all cursor-pointer group shrink truncate shadow-xs"
        >
          <span className="font-medium text-xs text-[#e3e3e3] group-hover:text-white truncate">
            {currentModel.name}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-[#8e918f] group-hover:text-white transition-colors shrink-0" />
        </button>
      </div>

      {/* Center: Workspace Mode Toggle Segmented Control (Preview | Code | Terminal) */}
      <div className="flex items-center justify-center shrink-0">
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

      {/* Right: Only two essential action buttons (External Launch ↗ & Settings ⚙) */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* External Launch / Open in New Tab */}
        <button
          id="btn-header-external-launch"
          onClick={handleExternalLaunch}
          aria-label="Open in New Tab"
          title="Open preview in new tab (↗)"
          className="w-8 h-8 rounded-lg bg-[#1e1f20] hover:bg-[#282a2c] border border-[#333538] text-[#8e918f] hover:text-[#e3e3e3] flex items-center justify-center transition-colors cursor-pointer shrink-0 active:scale-95"
        >
          <ExternalLink className="w-4 h-4 text-[#a8c7fa]" />
        </button>

        {/* Settings & Secrets */}
        <button
          id="btn-header-settings"
          onClick={onOpenSettings}
          aria-label="Settings and Secrets"
          title="Workspace Settings & Secrets (⚙)"
          className="w-8 h-8 rounded-lg bg-[#1e1f20] hover:bg-[#282a2c] border border-[#333538] text-[#8e918f] hover:text-[#e3e3e3] flex items-center justify-center transition-colors cursor-pointer shrink-0 active:scale-95"
        >
          <Settings className="w-4 h-4 text-[#a8c7fa]" />
        </button>
      </div>
    </header>
  );
}
