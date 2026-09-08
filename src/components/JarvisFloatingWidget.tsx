import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Send,
  X,
  Maximize2,
  Volume2,
  VolumeX,
  Sparkles,
  Archive,
  Terminal,
  RefreshCw,
  Cpu,
  Loader2,
  Bot,
} from 'lucide-react';
import { Message, Model } from '../types';
import {
  downloadFileSafely,
  speakJarvisResponse,
  stopSpeaking,
  triggerHaptic,
} from '../utils/nativeBridge';

interface JarvisFloatingWidgetProps {
  messages: Message[];
  isLoading: boolean;
  currentModel: Model;
  onSendMessage: (content: string) => void;
  onExitJarvisMode: () => void;
  selectedLanguage: 'english' | 'hindi' | 'auto';
  onSelectLanguage: (lang: 'english' | 'hindi' | 'auto') => void;
  onOpenTerminal?: () => void;
  defaultOpen?: boolean;
}

export function JarvisFloatingWidget({
  messages,
  isLoading,
  currentModel,
  onSendMessage,
  onExitJarvisMode,
  selectedLanguage,
  onSelectLanguage,
  onOpenTerminal,
  defaultOpen = true,
}: JarvisFloatingWidgetProps) {
  // Popover open state (false = circular avatar docked at screen edge, true = compact voice+chat popover)
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Position of the floating circular avatar
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    if (typeof window !== 'undefined') {
      return {
        x: Math.max(16, window.innerWidth - 86),
        y: Math.max(80, window.innerHeight - 190),
      };
    }
    return { x: 280, y: 550 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({
    startX: 0,
    startY: 0,
    posX: 0,
    posY: 0,
  });

  // Voice recording state
  const [isListening, setIsListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState<'hi' | 'en'>(
    selectedLanguage === 'hindi' ? 'hi' : 'en'
  );
  const [interimTranscript, setInterimTranscript] = useState('');
  const [inputVal, setInputVal] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Dragging support with smooth pointer capture
  const handlePointerDown = (e: React.PointerEvent) => {
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y,
    };
    setIsDragging(false);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.buttons !== 1) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      setIsDragging(true);
      const newX = Math.min(
        Math.max(10, dragStartRef.current.posX + dx),
        (typeof window !== 'undefined' ? window.innerWidth : 400) - 76
      );
      const newY = Math.min(
        Math.max(10, dragStartRef.current.posY + dy),
        (typeof window !== 'undefined' ? window.innerHeight : 800) - 86
      );
      setPosition({ x: newX, y: newY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    setTimeout(() => setIsDragging(false), 60);
  };

  // Speech Recognition hook
  const recognitionRef = useRef<any>(null);

  const startVoiceInput = () => {
    triggerHaptic(30);

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      const fallbackPrompt =
        voiceLang === 'hi'
          ? 'नमस्ते जार्विस, प्रोजेक्ट का स्टेटस चेक करो'
          : 'Jarvis, check the project build status';
      setInputVal(fallbackPrompt);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = voiceLang === 'hi' ? 'hi-IN' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setInterimTranscript('');
      };

      recognition.onresult = (event: any) => {
        let finalStr = '';
        let interimStr = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalStr += trans;
          } else {
            interimStr += trans;
          }
        }
        if (finalStr) {
          setInputVal(finalStr);
          setInterimTranscript('');
          setIsListening(false);
          triggerHaptic(20);
          // Auto send on clear voice command if popover is open
          onSendMessage(finalStr);
        } else {
          setInterimTranscript(interimStr);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleSend = () => {
    if (!inputVal.trim() || isLoading) return;
    triggerHaptic(25);
    onSendMessage(inputVal.trim());
    setInputVal('');
    setInterimTranscript('');
  };

  const handleTts = (text: string) => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }
    const success = speakJarvisResponse(text, voiceLang === 'hi' ? 'hi-IN' : 'en-US');
    if (success) {
      setIsSpeaking(true);
      setTimeout(() => setIsSpeaking(false), 8000);
    }
  };

  // Scroll to bottom when messages update
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  return (
    <>
      {/* 1. DOCKED FLOATING CIRCULAR AVATAR (JARVIS ORB / WIDGET) */}
      {!isOpen && (
        <div
          id="jarvis-floating-avatar"
          style={{ left: `${position.x}px`, top: `${position.y}px` }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onClick={() => {
            if (!isDragging) {
              triggerHaptic(30);
              setIsOpen(true);
            }
          }}
          className="fixed z-50 cursor-pointer select-none touch-none animate-in fade-in zoom-in-75 duration-300"
          title="Jarvis Assistant (Tap to open)"
        >
          <div className="relative group flex items-center justify-center">
            {/* Outer Holographic Arc-Reactor Rings */}
            <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-cyan-500/30 via-blue-500/25 to-teal-400/30 blur-md group-hover:blur-lg animate-pulse" />
            <div className="absolute -inset-1 rounded-full border border-cyan-400/50 animate-[spin_8s_linear_infinite]" />

            {/* Glowing Core Sphere */}
            <div className="relative w-16 h-16 rounded-full bg-[#080d14] border-2 border-cyan-400/80 shadow-[0_0_25px_rgba(6,182,212,0.6)] flex flex-col items-center justify-center p-1.5 transition-transform active:scale-90 group-hover:scale-105">
              {isListening ? (
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 animate-ping">
                    <Mic className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-bold text-red-400 mt-0.5 tracking-wider">REC</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <Cpu className="w-5 h-5 text-cyan-300 animate-pulse" />
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  </div>
                  <span className="text-[9px] font-mono font-bold text-cyan-200 tracking-wider mt-0.5">
                    JARVIS
                  </span>
                </div>
              )}

              {/* Mini audio wave indicators */}
              <div className="flex items-center gap-0.5 mt-0.5">
                <span className="w-0.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                <span className="w-0.5 h-2.5 bg-cyan-300 rounded-full animate-pulse delay-75" />
                <span className="w-0.5 h-1.5 bg-cyan-400 rounded-full animate-pulse delay-150" />
              </div>
            </div>

            {/* Floating Status Pill */}
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full bg-[#0d1522]/90 border border-cyan-500/40 text-[9px] font-mono text-cyan-300 shadow-md">
              Tap for Voice
            </div>
          </div>
        </div>
      )}

      {/* 2. COMPACT VOICE + CHAT POPOVER (JARVIS EXPANDED MODE) */}
      {isOpen && (
        <div
          id="jarvis-compact-popover"
          className="fixed inset-x-2 bottom-4 sm:bottom-6 sm:right-6 sm:left-auto sm:w-[420px] max-h-[82vh] z-50 rounded-3xl bg-[#090d14]/95 backdrop-blur-2xl border border-cyan-500/40 shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(6,182,212,0.25)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header Bar */}
          <div className="px-4 py-3 bg-[#0f1724]/90 border-b border-cyan-500/30 flex items-center justify-between select-none">
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-full bg-cyan-950/80 border border-cyan-400/60 flex items-center justify-center text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.4)]">
                <Bot className="w-4 h-4 text-cyan-300" />
                <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-black animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-white tracking-wider font-mono">
                    JARVIS MOBILE AI
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-400/30">
                    APK ACTIVE
                  </span>
                </div>
                <div className="text-[10px] text-[#8e918f] flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Autonomous Senior Engineer</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Hindi / English Toggle */}
              <div className="flex items-center rounded-lg bg-[#141d2e] p-0.5 border border-cyan-500/30 text-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    setVoiceLang('hi');
                    onSelectLanguage('hindi');
                  }}
                  className={`px-1.5 py-0.5 rounded cursor-pointer transition-all ${
                    voiceLang === 'hi'
                      ? 'bg-cyan-500 text-black font-semibold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  हिन्दी
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVoiceLang('en');
                    onSelectLanguage('english');
                  }}
                  className={`px-1.5 py-0.5 rounded cursor-pointer transition-all ${
                    voiceLang === 'en'
                      ? 'bg-cyan-500 text-black font-semibold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  EN
                </button>
              </div>

              {/* Restore Full IDE Button */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(20);
                  onExitJarvisMode();
                }}
                title="Restore Full IDE Workspace"
                className="w-7 h-7 rounded-lg bg-[#141d2e] hover:bg-[#1f2b42] text-cyan-300 border border-cyan-500/30 flex items-center justify-center transition-colors cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              {/* Collapse to Circular Avatar */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(20);
                  setIsOpen(false);
                }}
                title="Minimize to Floating Avatar"
                className="w-7 h-7 rounded-lg bg-[#141d2e] hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-cyan-500/30 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Central Voice Mic Section */}
          <div className="p-3 bg-gradient-to-b from-[#0c131f] to-[#070a10] border-b border-cyan-500/20 flex flex-col items-center justify-center relative">
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-[11px] font-mono text-cyan-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                {isListening ? 'Listening in ' + (voiceLang === 'hi' ? 'Hindi' : 'English') + '...' : 'Direct Microphone Input'}
              </span>
              <button
                type="button"
                onClick={() => downloadFileSafely('/api/workspace/zip', 'codepilot-project.zip')}
                className="text-[10px] px-2 py-0.5 rounded-md bg-[#1b3e2b] hover:bg-[#25573b] text-[#7ce38b] border border-[#34a853]/50 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Archive className="w-3 h-3" />
                <span>Export ZIP</span>
              </button>
            </div>

            {/* Main Interactive Arc-Reactor Microphone Button */}
            <div className="relative my-1">
              <button
                type="button"
                onClick={startVoiceInput}
                className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 shadow-xl ${
                  isListening
                    ? 'bg-red-500 text-white ring-4 ring-red-400/50 scale-105 shadow-[0_0_30px_rgba(239,68,68,0.7)]'
                    : 'bg-gradient-to-tr from-cyan-600 to-blue-500 text-white ring-2 ring-cyan-300/60 hover:scale-105 shadow-[0_0_25px_rgba(6,182,212,0.5)]'
                }`}
              >
                <Mic className={`w-7 h-7 ${isListening ? 'animate-bounce' : ''}`} />
              </button>

              {/* Pulse waves */}
              {isListening && (
                <>
                  <span className="absolute -inset-3 rounded-full bg-red-500/30 animate-ping" />
                  <span className="absolute -inset-6 rounded-full bg-red-500/15 animate-pulse" />
                </>
              )}
            </div>

            {/* Audio waveform equalizer bars */}
            {isListening && (
              <div className="flex items-center gap-1 my-1.5 h-5">
                <span className="w-1 bg-cyan-400 rounded-full animate-[bounce_0.6s_infinite_100ms] h-3" />
                <span className="w-1 bg-red-400 rounded-full animate-[bounce_0.6s_infinite_200ms] h-5" />
                <span className="w-1 bg-cyan-300 rounded-full animate-[bounce_0.6s_infinite_300ms] h-4" />
                <span className="w-1 bg-teal-300 rounded-full animate-[bounce_0.6s_infinite_400ms] h-5" />
                <span className="w-1 bg-cyan-400 rounded-full animate-[bounce_0.6s_infinite_500ms] h-2.5" />
              </div>
            )}

            {/* Interim voice transcript feedback */}
            {interimTranscript && (
              <div className="mt-2 text-xs text-cyan-200 font-mono bg-cyan-950/60 px-3 py-1 rounded-xl border border-cyan-500/30 animate-pulse text-center max-w-full truncate">
                "{interimTranscript}"
              </div>
            )}
            {!interimTranscript && (
              <div className="mt-1 text-[11px] text-[#8e918f]">
                {isListening ? 'Bolie (Speaking now)...' : 'Tap mic to speak voice command'}
              </div>
            )}
          </div>

          {/* Quick Action Chips */}
          <div className="px-3 py-2 bg-[#0a0f18] border-b border-cyan-500/20 flex items-center gap-1.5 overflow-x-auto custom-scrollbar select-none text-[11px]">
            <button
              type="button"
              onClick={() => onSendMessage('Project code ko .zip bundle me export karo')}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-[#141d2e] hover:bg-cyan-900/40 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Archive className="w-3 h-3" />
              <span>ZIP Download</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (onOpenTerminal) onOpenTerminal();
                onSendMessage('Terminal me git status check karo');
              }}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-[#141d2e] hover:bg-cyan-900/40 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Terminal className="w-3 h-3" />
              <span>Run Terminal</span>
            </button>
            <button
              type="button"
              onClick={() => onSendMessage('Generate a photorealistic image of Jarvis high-tech mobile UI')}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-[#141d2e] hover:bg-cyan-900/40 text-[#fbbc04] border border-[#fbbc04]/30 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              <span>AI Photo</span>
            </button>
          </div>

          {/* Compact Messages Stream */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5 min-h-[160px] max-h-[36vh] bg-[#070a10]/90 text-xs custom-scrollbar">
            {messages.length === 0 && (
              <div className="text-center py-6 text-[#8e918f]">
                <Cpu className="w-8 h-8 text-cyan-400 mx-auto mb-2 opacity-60 animate-pulse" />
                <p className="font-mono text-cyan-200 text-xs">Jarvis Assistant Standing By</p>
                <p className="text-[11px] mt-1">
                  Speak in Hindi or English, or ask to build code, create zip, or execute commands.
                </p>
              </div>
            )}

            {messages.map((m, idx) => (
              <div
                key={m.id || idx}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium rounded-br-xs shadow-md'
                      : 'bg-[#121824] text-[#e3e3e3] border border-cyan-500/30 rounded-bl-xs shadow-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>

                  {/* Direct ZIP download card if message contains zip */}
                  {m.role === 'assistant' && m.content.includes('/api/workspace/zip') && (
                    <button
                      type="button"
                      onClick={() => downloadFileSafely('/api/workspace/zip', 'codepilot-project.zip')}
                      className="mt-2 w-full px-3 py-1.5 rounded-xl bg-[#34a853] hover:bg-[#2d9248] text-black font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>⬇️ Download Project .ZIP</span>
                    </button>
                  )}
                </div>

                {/* Assistant TTS Voice Read-out Button */}
                {m.role === 'assistant' && (
                  <div className="flex items-center gap-2 mt-1 px-1 text-[10px] text-[#8e918f]">
                    <button
                      type="button"
                      onClick={() => handleTts(m.content)}
                      className="hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {isSpeaking ? <VolumeX className="w-3 h-3 text-cyan-400" /> : <Volume2 className="w-3 h-3" />}
                      <span>{isSpeaking ? 'Stop Voice' : 'Read Aloud'}</span>
                    </button>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-cyan-300 text-xs font-mono py-1">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Jarvis is processing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Compact Input Footer */}
          <div className="p-2.5 bg-[#0e1420] border-t border-cyan-500/30 flex items-center gap-2">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              placeholder={voiceLang === 'hi' ? 'कुछ भी पूछिए या कोड मांगिए...' : 'Ask Jarvis anything...'}
              className="flex-1 bg-[#141b29] border border-cyan-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-[#8e918f] focus:outline-none focus:border-cyan-400"
            />
            <button
              type="button"
              onClick={startVoiceInput}
              title="Speak"
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isListening
                  ? 'bg-red-500 border-red-400 text-white animate-pulse'
                  : 'bg-[#141b29] border-cyan-500/30 text-cyan-300 hover:text-white'
              }`}
            >
              <Mic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={!inputVal.trim() || isLoading}
              className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-semibold transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
