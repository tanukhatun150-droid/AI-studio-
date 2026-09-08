import React from 'react';
import { Home, FolderCode, Bot, Terminal, Settings } from 'lucide-react';
import { AppTab } from '../types';

interface BottomNavBarProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  activeTaskCount?: number;
  isAgentRunning?: boolean;
}

interface TabConfig {
  id: AppTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
}

export function BottomNavBar({
  activeTab,
  onSelectTab,
  activeTaskCount = 0,
  isAgentRunning = false,
}: BottomNavBarProps) {
  const tabs: TabConfig[] = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: FolderCode,
    },
    {
      id: 'agent',
      label: 'Agent',
      icon: Bot,
      badge: activeTaskCount > 0 ? activeTaskCount : (isAgentRunning ? '●' : undefined),
    },
    {
      id: 'terminal',
      label: 'Terminal',
      icon: Terminal,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <nav
      id="bottom-nav-bar"
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 h-16 bg-[#121316] border-t border-[#26282d] flex items-center justify-around z-50 select-none shadow-[0_-4px_20px_rgba(0,0,0,0.4)] backdrop-blur-md"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            id={`nav-tab-${tab.id}`}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            aria-current={isActive ? 'page' : undefined}
            className={`relative flex flex-col items-center justify-center w-16 sm:w-20 h-full py-1 transition-all duration-150 cursor-pointer group ${
              isActive
                ? 'text-sky-400 font-semibold'
                : 'text-[#8e918f] hover:text-[#e3e3e3]'
            }`}
          >
            {/* Active glow indicator on top edge */}
            {isActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-sky-400 rounded-full shadow-[0_0_8px_#38bdf8]" />
            )}

            {/* Icon wrapper with optional badge */}
            <div className="relative flex items-center justify-center">
              <div
                className={`p-1 rounded-xl transition-all ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-400 scale-110'
                    : 'group-hover:bg-[#1a1c22] text-[#9aa0a6] group-hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 transition-transform" />
              </div>

              {/* Badge indicator */}
              {tab.badge !== undefined && (
                <span
                  className={`absolute -top-1 -right-2 px-1.5 min-w-4 h-4 rounded-full text-[10px] font-mono font-bold flex items-center justify-center border border-[#121316] ${
                    isAgentRunning && tab.id === 'agent'
                      ? 'bg-amber-500 text-black animate-pulse'
                      : 'bg-sky-500 text-black'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </div>

            {/* Tab Label */}
            <span
              className={`text-[11px] tracking-tight transition-colors whitespace-nowrap mt-0.5 ${
                isActive ? 'text-sky-300 font-semibold' : 'text-[#8e918f] group-hover:text-[#c4c7c5]'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
