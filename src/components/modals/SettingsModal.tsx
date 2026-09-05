import React, { useState } from 'react';
import { X, Sliders, Smartphone, Monitor, Shield, Sparkles } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMobileFrame: boolean;
  onToggleFrame: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  isMobileFrame,
  onToggleFrame,
}: SettingsModalProps) {
  const [temperature, setTemperature] = useState(0.7);
  const [streamResponses, setStreamResponses] = useState(true);
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md bg-[#1e1f20] border border-[#333538] rounded-2xl p-5 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between pb-3 border-b border-[#333538]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#282a2c] flex items-center justify-center text-[#a8c7fa]">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Workspace Settings</h3>
              <p className="text-xs text-[#8e918f]">Customize agent behavior & layout</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#282a2c] text-[#8e918f] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4 text-xs">
          {/* Viewport Frame Mode */}
          <div className="space-y-1.5">
            <label className="font-semibold text-white block">Display Shell Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  if (!isMobileFrame) onToggleFrame();
                }}
                className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all text-left cursor-pointer ${
                  isMobileFrame
                    ? 'bg-[#282a2c] border-[#a8c7fa] text-white shadow-sm'
                    : 'bg-[#18191c] border-[#333538] text-[#8e918f] hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4 text-[#a8c7fa]" />
                <div>
                  <div className="font-semibold text-xs">Mobile Shell</div>
                  <div className="text-[10px] text-[#8e918f]">iOS / Expo frame</div>
                </div>
              </button>

              <button
                onClick={() => {
                  if (isMobileFrame) onToggleFrame();
                }}
                className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all text-left cursor-pointer ${
                  !isMobileFrame
                    ? 'bg-[#282a2c] border-[#a8c7fa] text-white shadow-sm'
                    : 'bg-[#18191c] border-[#333538] text-[#8e918f] hover:text-white'
                }`}
              >
                <Monitor className="w-4 h-4 text-[#a8c7fa]" />
                <div>
                  <div className="font-semibold text-xs">Desktop Fluid</div>
                  <div className="text-[10px] text-[#8e918f]">Full width canvas</div>
                </div>
              </button>
            </div>
          </div>

          {/* Temperature Slider */}
          <div className="space-y-2 p-3 rounded-xl bg-[#282a2c] border border-[#333538]">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Agent Temperature</span>
              <span className="font-mono text-[#a8c7fa]">{temperature.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-[#a8c7fa] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#8e918f]">
              <span>Focused (0.0)</span>
              <span>Balanced (0.7)</span>
              <span>Creative (1.0)</span>
            </div>
          </div>

          {/* Streaming Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#282a2c] border border-[#333538]">
            <div>
              <span className="font-semibold text-white block">Real-time Token Streaming</span>
              <span className="text-[11px] text-[#8e918f]">
                Stream characters as the model generates them
              </span>
            </div>
            <input
              type="checkbox"
              checked={streamResponses}
              onChange={(e) => setStreamResponses(e.target.checked)}
              className="w-4 h-4 accent-[#a8c7fa] rounded cursor-pointer"
            />
          </div>

          {/* Connected Model Providers Status */}
          <div className="space-y-2 p-3 rounded-xl bg-[#18191c] border border-[#333538]">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Configured Model Providers</span>
              <span className="text-[10px] text-[#34a853] flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34a853]"></span>
                Server Integrated
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <div className="p-2 rounded-lg bg-[#282a2c] border border-[#333538] flex items-center justify-between">
                <span className="text-[11px] text-[#e3e3e3] font-medium">Gemini 3.8</span>
                <span className="text-[10px] text-[#34a853]">● Ready</span>
              </div>
              <div className="p-2 rounded-lg bg-[#282a2c] border border-[#333538] flex items-center justify-between">
                <span className="text-[11px] text-[#e3e3e3] font-medium">Groq LPU</span>
                <span className="text-[10px] text-[#34a853]">● Ready</span>
              </div>
              <div className="p-2 rounded-lg bg-[#282a2c] border border-[#333538] flex items-center justify-between">
                <span className="text-[11px] text-[#e3e3e3] font-medium">Ollama Cloud</span>
                <span className="text-[10px] text-[#34a853]">● Ready</span>
              </div>
              <div className="p-2 rounded-lg bg-[#282a2c] border border-[#333538] flex items-center justify-between">
                <span className="text-[11px] text-[#e3e3e3] font-medium">Kimi</span>
                <span className="text-[10px] text-[#a8c7fa]">● Loaded</span>
              </div>
            </div>
          </div>

          {/* Workspace Info */}
          <div className="p-3 rounded-xl bg-[#18191c] border border-[#333538] flex items-center gap-2.5 text-[#8e918f]">
            <Shield className="w-4 h-4 text-[#34a853] shrink-0" />
            <span className="text-[11px]">
              Full-Stack Express + Vite reverse proxy on port 3000. All API keys remain securely on the server.
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-[#333538] flex items-center justify-between">
          <span className="text-[11px] text-[#34a853] font-medium">
            {savedNotice ? 'Settings saved!' : ''}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#282a2c] hover:bg-[#333538] text-xs font-semibold text-[#8e918f] hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-[#a8c7fa] hover:bg-[#c2d7ff] text-[#07111f] font-semibold text-xs transition-colors cursor-pointer shadow-md"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
