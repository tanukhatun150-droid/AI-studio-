import React, { useState } from 'react';
import {
  Sparkles,
  Download,
  Copy,
  Check,
  Maximize2,
  ExternalLink,
  Loader2,
  X,
  RotateCcw,
  Image as ImageIcon,
} from 'lucide-react';

interface GeneratedImageCardProps {
  alt: string;
  url: string;
  key?: React.Key;
}

export function GeneratedImageCard({ alt, url }: GeneratedImageCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const cleanTitle =
    alt
      .replace(/^Generated Photo:?\s*/i, '')
      .replace(/^AI Generated:?\s*/i, '')
      .trim() || 'AI Generated Photo';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsDownloading(true);
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${cleanTitle.slice(0, 30).replace(/[^a-zA-Z0-9_-]/g, '_')}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      // fallback to open in new tab
      window.open(url, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <div className="my-3.5 rounded-2xl bg-[#111317] border border-[#2e3138] overflow-hidden shadow-xl group">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-3.5 py-2 bg-[#171920] border-b border-[#2e3138]">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-[#a8c7fa]/15 flex items-center justify-center text-[#a8c7fa] shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-xs text-white truncate max-w-[240px] sm:max-w-md">
                {cleanTitle}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#34a853]/15 text-[#7ce38b] font-medium border border-[#34a853]/30 shrink-0">
                Flux 1024×1024
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Copy Link */}
            <button
              type="button"
              onClick={handleCopyLink}
              title="Copy image link"
              className="p-1.5 rounded-lg hover:bg-[#252830] text-[#8e918f] hover:text-white transition-colors cursor-pointer"
            >
              {isCopied ? (
                <Check className="w-3.5 h-3.5 text-[#34a853]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Expand / Lightbox */}
            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              title="View full screen"
              className="p-1.5 rounded-lg hover:bg-[#252830] text-[#8e918f] hover:text-white transition-colors cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              title="Download full resolution photo"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#223554] hover:bg-[#2c456f] text-[#a8c7fa] hover:text-white text-xs font-medium transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
            >
              {isDownloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">Save</span>
            </button>
          </div>
        </div>

        {/* Visual Canvas Stage */}
        <div
          onClick={() => isLoaded && setIsLightboxOpen(true)}
          className="relative bg-[#090a0d] min-h-[260px] max-h-[520px] flex items-center justify-center overflow-hidden cursor-zoom-in"
        >
          {/* Skeleton Loader */}
          {!isLoaded && !hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[#8e918f] bg-[#090a0d] p-6 text-center animate-pulse">
              <div className="w-12 h-12 rounded-2xl bg-[#1a1d24] flex items-center justify-center border border-[#2e3138]">
                <Loader2 className="w-6 h-6 text-[#a8c7fa] animate-spin" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-medium text-[#e3e3e3]">Rendering photorealistic photo...</div>
                <div className="text-[11px] text-[#5f6368]">Generating 1024×1024 via Flux neural engine</div>
              </div>
            </div>
          )}

          {/* Error fallback */}
          {hasError ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#4b1e1e] text-[#f28b82] mx-auto flex items-center justify-center">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div className="text-xs text-[#f28b82]">Image generation could not load directly.</div>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#a8c7fa] hover:underline"
              >
                <span>Open direct render link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ) : (
            <img
              src={url}
              alt={cleanTitle}
              referrerPolicy="no-referrer"
              onLoad={() => setIsLoaded(true)}
              onError={() => setHasError(true)}
              className={`w-full max-h-[520px] object-contain transition-all duration-500 group-hover:scale-[1.01] ${
                isLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}

          {/* Hover Overlay Badge */}
          {isLoaded && (
            <div className="absolute bottom-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] text-white flex items-center gap-1.5 pointer-events-none">
              <Maximize2 className="w-3 h-3 text-[#a8c7fa]" />
              <span>Click to expand</span>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-md animate-in fade-in"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Top Modal Controls */}
          <div
            className="absolute top-4 right-4 flex items-center gap-2 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-[#252830] text-[#e3e3e3] hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Tab</span>
            </a>
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg bg-[#223554] text-[#a8c7fa] hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download 1024×1024</span>
            </button>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="p-1.5 rounded-lg bg-[#282a2c] hover:bg-[#333538] text-white cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* High-res Image Display */}
          <div
            className="relative max-w-5xl max-h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={url}
              alt={cleanTitle}
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-[#2e3138]"
            />
          </div>

          {/* Image Caption Footer */}
          <div
            className="mt-3 text-xs text-[#c4c7c5] max-w-2xl text-center select-none px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="font-semibold text-white">{cleanTitle}</span>
            <span className="text-[#8e918f] ml-2">• Flux Photorealistic Neural Engine</span>
          </div>
        </div>
      )}
    </>
  );
}
