import React, { useState, useRef } from 'react';
import {
  RotateCw,
  ExternalLink,
  Monitor,
  Tablet,
  Smartphone,
  CheckCircle2,
  ShieldAlert,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  X,
  Sparkles,
} from 'lucide-react';

interface LivePreviewProps {
  initialUrl?: string;
  onClose?: () => void;
  isSplitView?: boolean;
}

export function LivePreview({
  initialUrl = window.location.origin,
  onClose,
  isSplitView = true,
}: LivePreviewProps) {
  const [urlInput, setUrlInput] = useState(initialUrl);
  const [activeUrl, setActiveUrl] = useState(initialUrl);
  const [deviceMode, setDeviceMode] = useState<'responsive' | 'desktop' | 'tablet' | 'mobile'>('responsive');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [key, setKey] = useState(0);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setKey((prev) => prev + 1);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    let target = urlInput.trim();
    if (!target.startsWith('http://') && !target.startsWith('https://') && !target.startsWith('/')) {
      target = `http://${target}`;
    }
    setActiveUrl(target);
  };

  const setQuickUrl = (path: string) => {
    const fullUrl = `${window.location.origin}${path}`;
    setUrlInput(fullUrl);
    setActiveUrl(fullUrl);
  };

  // Get viewport constraint style based on device mode
  const getDeviceStyle = () => {
    switch (deviceMode) {
      case 'mobile':
        return 'w-[375px] max-w-full h-[667px] max-h-[90vh] my-auto rounded-[32px] border-[6px] border-[#222428] shadow-[0_20px_50px_rgba(0,0,0,0.8)]';
      case 'tablet':
        return 'w-[768px] max-w-full h-[1024px] max-h-[92vh] my-auto rounded-[24px] border-[6px] border-[#222428] shadow-[0_20px_50px_rgba(0,0,0,0.8)]';
      case 'desktop':
        return 'w-[1024px] max-w-full h-full rounded-lg border border-[#333538]';
      case 'responsive':
      default:
        return 'w-full h-full';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#111216] border-l border-[#2e3036] overflow-hidden">
      {/* Top Browser URL & Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#17191e] border-b border-[#2e3036] text-xs">
        {/* Navigation buttons & status */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleRefresh}
            title="Reload preview"
            className="p-1.5 rounded-lg hover:bg-[#282a30] text-[#8e918f] hover:text-white transition-colors cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#a8c7fa]' : ''}`} />
          </button>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#1e2026] border border-[#2e3036] text-[11px]">
            <span className="w-2 h-2 rounded-full bg-[#34a853] animate-pulse" />
            <span className="font-semibold text-[#81c995]">Port 3000</span>
          </div>
        </div>

        {/* URL address bar */}
        <form onSubmit={handleNavigate} className="flex-1 min-w-[200px] flex items-center">
          <div className="relative w-full flex items-center">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="http://localhost:3000/"
              className="w-full pl-3 pr-8 py-1.5 rounded-lg bg-[#0e1013] border border-[#2e3036] text-[12px] font-mono text-[#e3e3e3] focus:outline-none focus:border-[#a8c7fa] transition-colors"
            />
            <button
              type="submit"
              className="absolute right-1 px-2 py-0.5 rounded bg-[#282a30] hover:bg-[#343740] text-[10px] text-[#a8c7fa] font-semibold cursor-pointer"
            >
              Go
            </button>
          </div>
        </form>

        {/* Device Viewport Presets & External Open */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="flex items-center bg-[#0e1013] p-0.5 rounded-lg border border-[#2e3036]">
            <button
              onClick={() => setDeviceMode('responsive')}
              title="Responsive (100%)"
              className={`p-1 rounded cursor-pointer ${
                deviceMode === 'responsive'
                  ? 'bg-[#282a30] text-[#a8c7fa]'
                  : 'text-[#8e918f] hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDeviceMode('tablet')}
              title="Tablet (768px)"
              className={`p-1 rounded cursor-pointer ${
                deviceMode === 'tablet'
                  ? 'bg-[#282a30] text-[#a8c7fa]'
                  : 'text-[#8e918f] hover:text-white'
              }`}
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDeviceMode('mobile')}
              title="Mobile (375px)"
              className={`p-1 rounded cursor-pointer ${
                deviceMode === 'mobile'
                  ? 'bg-[#282a30] text-[#a8c7fa]'
                  : 'text-[#8e918f] hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Open in external tab */}
          <a
            href={activeUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in new window"
            className="p-1.5 rounded-lg hover:bg-[#282a30] text-[#8e918f] hover:text-white transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {onClose && (
            <button
              onClick={onClose}
              title="Close Preview"
              className="p-1.5 rounded-lg hover:bg-[#282a30] text-[#8e918f] hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Navigation Chips */}
      <div className="flex items-center gap-1.5 px-3 py-1 bg-[#14161b] border-b border-[#25272e] text-[10px] overflow-x-auto custom-scrollbar">
        <span className="text-[#8e918f] uppercase font-semibold">Presets:</span>
        <button
          onClick={() => setQuickUrl('/')}
          className="px-2 py-0.5 rounded bg-[#1e2026] hover:bg-[#282a32] text-[#c4c7c5] hover:text-white border border-[#2e3036] cursor-pointer"
        >
          / (Root App)
        </button>
        <button
          onClick={() => setQuickUrl('/api/health')}
          className="px-2 py-0.5 rounded bg-[#1e2026] hover:bg-[#282a32] text-[#c4c7c5] hover:text-white border border-[#2e3036] cursor-pointer"
        >
          /api/health
        </button>
        <button
          onClick={() => setQuickUrl('/api/git/status')}
          className="px-2 py-0.5 rounded bg-[#1e2026] hover:bg-[#282a32] text-[#c4c7c5] hover:text-white border border-[#2e3036] cursor-pointer"
        >
          /api/git/status
        </button>
        <button
          onClick={() => setQuickUrl('/api/models/status')}
          className="px-2 py-0.5 rounded bg-[#1e2026] hover:bg-[#282a32] text-[#c4c7c5] hover:text-white border border-[#2e3036] cursor-pointer"
        >
          /api/models/status
        </button>
      </div>

      {/* Preview Iframe Container */}
      <div className="flex-1 bg-[#0b0c0e] flex items-center justify-center p-2 sm:p-3 overflow-auto">
        <div className={`transition-all duration-300 relative ${getDeviceStyle()} flex flex-col bg-white overflow-hidden`}>
          <iframe
            key={key}
            ref={iframeRef}
            src={activeUrl}
            title="Application Live Preview"
            className="w-full h-full border-0 bg-white"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
          />
        </div>
      </div>
    </div>
  );
}
