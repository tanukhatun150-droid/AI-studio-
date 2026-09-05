import React, { useState } from 'react';
import { X, FileCode, Folder, Copy, Check } from 'lucide-react';
import { WorkspaceFile } from '../../types';

interface FileModalProps {
  isOpen: boolean;
  file: WorkspaceFile | null;
  onClose: () => void;
}

export function FileModal({ isOpen, file, onClose }: FileModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !file) return null;

  const isDirectory = file.type === 'directory';
  const sizeLabel =
    file.size === undefined
      ? isDirectory
        ? 'Folder'
        : 'Unknown size'
      : file.size < 1024
      ? `${file.size} B`
      : file.size < 1024 * 1024
      ? `${(file.size / 1024).toFixed(1)} KB`
      : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

  const handleCopy = () => {
    if (file.content) {
      navigator.clipboard.writeText(file.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-[#1e1f20] border border-[#333538] rounded-2xl p-5 shadow-2xl z-10 max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between pb-3 border-b border-[#333538]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#282a2c] flex items-center justify-center shrink-0">
              {isDirectory ? (
                <Folder className="w-5 h-5 text-[#fbbc04]" />
              ) : (
                <FileCode className="w-5 h-5 text-[#a8c7fa]" />
              )}
            </div>
            <div>
              <h3 className="text-base font-semibold text-white truncate max-w-xs">{file.name}</h3>
              <p className="text-xs text-[#8e918f]">
                {isDirectory ? 'Directory' : 'Source file'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#282a2c] text-[#8e918f] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metadata Details */}
        <div className="py-3 grid grid-cols-2 gap-3 text-xs">
          <div className="p-2.5 rounded-xl bg-[#282a2c] border border-[#333538]">
            <span className="text-[10px] uppercase font-semibold text-[#8e918f] block mb-0.5">
              PATH
            </span>
            <span className="font-mono text-[#e3e3e3] truncate block">{file.path}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#282a2c] border border-[#333538]">
            <span className="text-[10px] uppercase font-semibold text-[#8e918f] block mb-0.5">
              SIZE
            </span>
            <span className="font-mono text-[#e3e3e3] block">{sizeLabel}</span>
          </div>
        </div>

        {/* File Content Preview */}
        {!isDirectory && (
          <div className="flex-1 min-h-0 flex flex-col rounded-xl bg-[#111216] border border-[#333538] overflow-hidden my-2">
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#18191c] border-b border-[#333538] text-[11px] text-[#8e918f]">
              <span className="font-mono">Preview</span>
              {file.content && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#34a853]" />
                      <span className="text-[#34a853]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <pre className="flex-1 p-3 font-mono text-xs text-[#e3e3e3] overflow-auto custom-scrollbar leading-relaxed">
              <code>{file.content || '// Empty file or binary content'}</code>
            </pre>
          </div>
        )}

        <div className="pt-3 border-t border-[#333538] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#a8c7fa] hover:bg-[#c2d7ff] text-[#07111f] font-semibold text-xs transition-colors cursor-pointer shadow-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
