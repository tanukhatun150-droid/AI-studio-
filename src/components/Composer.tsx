import React, { useRef, useState } from 'react';
import {
  Plus,
  ArrowUp,
  Mic,
  X,
  FileText,
  Image as ImageIcon,
  Video,
  FileCode,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { ChatAttachment } from '../types';

interface ComposerProps {
  onSendMessage: (content: string, attachment?: ChatAttachment) => void;
  isLoading: boolean;
  modelName: string;
  selectedLanguage?: string;
  onSelectLanguage?: (lang: string) => void;
}

export function Composer({
  onSendMessage,
  isLoading,
  modelName,
  selectedLanguage = 'auto',
}: ComposerProps) {
  const [input, setInput] = useState('');
  const [pendingAttachment, setPendingAttachment] = useState<ChatAttachment | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState<'hi' | 'en'>(selectedLanguage === 'hindi' ? 'hi' : 'en');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Hidden File Inputs
  const generalFileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Process any incoming file (photo, video, code, document)
  const processFile = (file: File) => {
    if (!file) return;

    const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(file.name);
    const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi|m4v)$/i.test(file.name);
    const isAudio = file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac)$/i.test(file.name);

    const mediaType: 'image' | 'video' | 'audio' | 'file' = isImage
      ? 'image'
      : isVideo
      ? 'video'
      : isAudio
      ? 'audio'
      : 'file';

    const mimeType = file.type || (isImage ? 'image/jpeg' : isVideo ? 'video/mp4' : 'application/octet-stream');

    setIsReadingFile(true);
    const reader = new FileReader();

    if (isImage || isVideo || isAudio) {
      // Read as DataURL (base64) so it can be previewed immediately and sent to multimodal AI
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setPendingAttachment({
          name: file.name,
          size: file.size,
          mimeType,
          dataUrl,
          uri: dataUrl,
          mediaType,
        });
        setIsReadingFile(false);
      };
      reader.onerror = () => {
        setIsReadingFile(false);
      };
      reader.readAsDataURL(file);
    } else {
      // Text or Code files: read text content and also dataUrl
      reader.onload = () => {
        const textContent = reader.result as string;
        setPendingAttachment({
          name: file.name,
          size: file.size,
          mimeType: mimeType || 'text/plain',
          content: textContent,
          dataUrl: `data:text/plain;charset=utf-8,${encodeURIComponent(textContent.slice(0, 50000))}`,
          mediaType: 'file',
        });
        setIsReadingFile(false);
      };
      reader.onerror = () => {
        setIsReadingFile(false);
      };
      reader.readAsText(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    e.target.value = '';
    setShowAttachMenu(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  // Clipboard paste support (e.g. screenshots)
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          processFile(file);
          return;
        }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const trimmed = input.trim();
    if ((!trimmed && !pendingAttachment) || isLoading || isReadingFile) return;

    onSendMessage(trimmed, pendingAttachment || undefined);
    setInput('');
    setPendingAttachment(null);
    setShowAttachMenu(false);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleInputResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
  };

  const toggleVoiceInput = (targetLang?: 'hi' | 'en') => {
    const langToUse = targetLang || voiceLang;
    if (targetLang && targetLang !== voiceLang) {
      setVoiceLang(targetLang);
    }

    // If currently listening and no new language requested, clicking mic stops recording
    if (isListening && !targetLang) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
      return;
    }

    if (isListening && targetLang) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      const demoSpeech = langToUse === 'hi'
        ? 'नमस्ते, मुझे इस प्रोजेक्ट में कोड बनाकर दीजिए'
        : 'Can you help me build and run this full stack project?';
      setInput((prev) => (prev ? `${prev} ${demoSpeech}` : demoSpeech));
      return;
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      // Real SpeechRecognition configuration for Hindi & English
      recognition.lang = langToUse === 'hi' ? 'hi-IN' : 'en-US';
      recognition.continuous = true;
      recognition.interimResults = true;

      let baselineInput = input ? `${input.trim()} ` : '';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript;
        }
        setInput(baselineInput + fullTranscript);
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
        }
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const formatFileSize = (size?: number) => {
    if (!size) return 'File';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const hasContent = Boolean(input.trim() || pendingAttachment);

  return (
    <div
      className={`px-4 pt-2 pb-3 bg-[#111216] border-t border-[#333538]/40 shrink-0 relative transition-colors ${
        isDragOver ? 'bg-[#181a20] ring-2 ring-[#a8c7fa]/50' : ''
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="max-w-3xl mx-auto relative">
        {/* Hidden Inputs for different types */}
        <input
          type="file"
          ref={generalFileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.txt,.json,.js,.ts,.tsx,.py,.html,.css,.md,.apk,.zip,.tar,.gz"
        />
        <input
          type="file"
          ref={photoInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
        />
        <input
          type="file"
          ref={videoInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="video/*"
        />

        {/* Quick Attach Menu Popover */}
        {showAttachMenu && (
          <>
            {/* Click-outside backdrop to dismiss */}
            <div
              className="fixed inset-0 z-20"
              onClick={() => setShowAttachMenu(false)}
            />
            <div className="absolute bottom-[66px] left-2 z-30 w-60 bg-[#1e1f20] border border-[#333538] rounded-2xl p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              <div className="text-[10px] font-semibold text-[#8e918f] px-3 py-1.5 uppercase tracking-wider">
                Attach Media or File
              </div>

              {/* ✨ Generate Real Photo */}
              <button
                type="button"
                onClick={() => {
                  setInput('Generate a photorealistic image of ');
                  setShowAttachMenu(false);
                  setTimeout(() => textareaRef.current?.focus(), 50);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#e3e3e3] hover:text-white hover:bg-[#282a2c] transition-colors cursor-pointer text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-[#fbbc04]/15 flex items-center justify-center text-[#fbbc04] shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium text-white text-[13px]">Generate Real Photo</div>
                  <div className="text-[10px] text-[#8e918f]">Flux 1024×1024 Photorealistic AI</div>
                </div>
              </button>

              {/* 📷 Upload Image */}
              <button
                type="button"
                onClick={() => {
                  photoInputRef.current?.click();
                  setShowAttachMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#e3e3e3] hover:text-white hover:bg-[#282a2c] transition-colors cursor-pointer text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-[#a8c7fa]/10 flex items-center justify-center text-[#a8c7fa] shrink-0">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium text-white text-[13px]">Upload Image</div>
                  <div className="text-[10px] text-[#8e918f]">JPG, PNG, WEBP, GIF</div>
                </div>
              </button>

              {/* 🎥 Upload Video */}
              <button
                type="button"
                onClick={() => {
                  videoInputRef.current?.click();
                  setShowAttachMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#e3e3e3] hover:text-white hover:bg-[#282a2c] transition-colors cursor-pointer text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-[#a8c7fa]/10 flex items-center justify-center text-[#a8c7fa] shrink-0">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium text-white text-[13px]">Upload Video</div>
                  <div className="text-[10px] text-[#8e918f]">MP4, WEBM, MOV</div>
                </div>
              </button>

              {/* 📁 Attach Code / File / APK */}
              <button
                type="button"
                onClick={() => {
                  generalFileInputRef.current?.click();
                  setShowAttachMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#e3e3e3] hover:text-white hover:bg-[#282a2c] transition-colors cursor-pointer text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-[#a8c7fa]/10 flex items-center justify-center text-[#a8c7fa] shrink-0">
                  <FileCode className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium text-white text-[13px]">Attach Code / File / APK</div>
                  <div className="text-[10px] text-[#8e918f]">PDF, TXT, APK, Code, ZIP</div>
                </div>
              </button>
            </div>
          </>
        )}

        {/* Reading File Loading Card */}
        {isReadingFile && (
          <div className="min-h-[50px] border border-[#a8c7fa]/40 rounded-[15px] bg-[#1e1f20] flex items-center gap-3 px-3 py-2 mb-2 animate-pulse">
            <Loader2 className="w-5 h-5 text-[#a8c7fa] animate-spin shrink-0" />
            <div className="text-xs text-[#e3e3e3]">Processing attachment...</div>
          </div>
        )}

        {/* Pending Attachment Card with Visual Preview */}
        {pendingAttachment && !isReadingFile && (
          <div className="min-h-[58px] border border-[#333538] rounded-[15px] bg-[#1e1f20] flex items-center gap-3 px-3 py-2 mb-2 animate-in fade-in slide-in-from-bottom-1 shadow-md">
            {/* Visual Thumbnail or Icon */}
            <div className="relative shrink-0">
              {pendingAttachment.mediaType === 'image' && pendingAttachment.dataUrl ? (
                <img
                  src={pendingAttachment.dataUrl}
                  alt="Attachment preview"
                  className="w-11 h-11 rounded-lg object-cover border border-[#333538]"
                />
              ) : pendingAttachment.mediaType === 'video' ? (
                <div className="w-11 h-11 rounded-lg bg-[#282a2c] border border-[#333538] flex flex-col items-center justify-center text-[#a8c7fa]">
                  <Video className="w-5 h-5" />
                  <span className="text-[8px] font-semibold uppercase mt-0.5">Video</span>
                </div>
              ) : (
                <div className="w-11 h-11 rounded-lg bg-[#282a2c] border border-[#333538] flex items-center justify-center text-[#a8c7fa]">
                  <FileText className="w-5 h-5" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-xs text-[#e3e3e3] truncate">
                {pendingAttachment.name}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-[#8e918f] mt-0.5">
                <span className="capitalize px-1.5 py-0.2 rounded bg-[#282a2c] text-[#a8c7fa]">
                  {pendingAttachment.mediaType || 'file'}
                </span>
                <span>{formatFileSize(pendingAttachment.size)}</span>
              </div>
            </div>

            {/* Remove Button */}
            <button
              id="btn-remove-attachment"
              type="button"
              onClick={() => setPendingAttachment(null)}
              className="w-8 h-8 flex items-center justify-center text-[#8e918f] hover:text-[#e3e3e3] rounded-lg hover:bg-[#282a2c] transition-colors cursor-pointer"
              title="Remove attachment"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Active Voice Listening Banner (Hindi/English Web Speech API) */}
        {isListening && (
          <div className="mb-2 px-3.5 py-2.5 rounded-[18px] bg-[#1a141e] border border-[#a8c7fa]/40 flex flex-wrap items-center justify-between gap-2 shadow-lg animate-in fade-in slide-in-from-bottom-1">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">
                  Recording Voice ({voiceLang === 'hi' ? 'हिन्दी hi-IN' : 'English en-US'})
                </span>
                <div className="flex items-end gap-0.5 h-3 px-1">
                  <span className="w-1 h-3 bg-[#a8c7fa] rounded-full animate-[pulse_0.6s_ease-in-out_infinite]" />
                  <span className="w-1 h-2 bg-[#a8c7fa] rounded-full animate-[pulse_0.4s_ease-in-out_infinite_100ms]" />
                  <span className="w-1 h-3 bg-[#a8c7fa] rounded-full animate-[pulse_0.8s_ease-in-out_infinite_200ms]" />
                  <span className="w-1 h-1.5 bg-[#a8c7fa] rounded-full animate-[pulse_0.5s_ease-in-out_infinite_50ms]" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-lg bg-[#282a2c] p-0.5 border border-[#3c4043]">
                <button
                  type="button"
                  onClick={() => toggleVoiceInput('hi')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
                    voiceLang === 'hi' ? 'bg-[#a8c7fa] text-[#07111f] font-semibold' : 'text-[#8e918f] hover:text-white'
                  }`}
                >
                  🇮🇳 हिन्दी
                </button>
                <button
                  type="button"
                  onClick={() => toggleVoiceInput('en')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
                    voiceLang === 'en' ? 'bg-[#a8c7fa] text-[#07111f] font-semibold' : 'text-[#8e918f] hover:text-white'
                  }`}
                >
                  🇬🇧 English
                </button>
              </div>

              <button
                type="button"
                onClick={() => toggleVoiceInput()}
                className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                Stop / Done
              </button>
            </div>
          </div>
        )}

        {/* Composer Bar */}
        <div className="min-h-[56px] border border-[#333538] rounded-[24px] bg-[#1e1f20] px-2.5 py-2 flex items-end gap-2 focus-within:border-[#a8c7fa]/70 transition-all shadow-lg">
          {/* Plus / Attach Button */}
          <button
            id="btn-attach-file"
            type="button"
            onClick={() => setShowAttachMenu((prev) => !prev)}
            title="Attach image, video, or file"
            className={`w-[40px] h-[40px] rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
              showAttachMenu
                ? 'bg-[#a8c7fa] text-[#07111f] scale-105'
                : 'text-[#8e918f] hover:text-[#e3e3e3] hover:bg-[#282a2c]'
            }`}
          >
            <Plus className={`w-5 h-5 transition-transform ${showAttachMenu ? 'rotate-45' : ''}`} />
          </button>

          {/* Auto-expanding Input Field with full width */}
          <textarea
            id="composer-input"
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={handleInputResize}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Ask anything, generate photo, or write code..."
            className="flex-1 bg-transparent py-2 px-2 font-normal text-[15px] leading-[22px] text-[#e3e3e3] placeholder-[#8e918f] focus:outline-none resize-none max-h-[120px] custom-scrollbar"
          />

          {/* Send or Mic Action */}
          <div className="shrink-0 mb-0.5 flex items-center gap-1.5">
            {/* Mic Button always available for voice input */}
            <button
              id="btn-voice-input"
              type="button"
              onClick={() => toggleVoiceInput()}
              title={isListening ? 'Listening (click to stop)...' : 'Voice Input (Click to speak in Hindi or English)'}
              className={`w-[40px] h-[40px] rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isListening
                  ? 'bg-red-500/25 text-red-400 animate-pulse ring-2 ring-red-500/60'
                  : 'bg-[#282a2c] text-[#8e918f] hover:text-white hover:bg-[#333538]'
              }`}
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* Send Button */}
            {hasContent && (
              <button
                id="btn-send-message"
                type="button"
                onClick={handleSubmit}
                disabled={isLoading || isReadingFile}
                title="Send message"
                className="w-[40px] h-[40px] rounded-full bg-[#a8c7fa] hover:bg-[#c2d7ff] text-[#07111f] flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
              >
                <ArrowUp className="w-5 h-5 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>

        {/* Footer Row: Model Info */}
        <div className="flex items-center justify-between px-3 mt-2 text-[11px] text-[#8e918f]">
          <div className="flex items-center gap-2">
            <span>
              Model: <span className="font-medium text-[#e3e3e3]">{modelName}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
