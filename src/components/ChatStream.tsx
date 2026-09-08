import React, { useRef, useEffect, useState } from 'react';
import {
  Sparkles,
  FileText,
  Image as ImageIcon,
  Video,
  Archive,
  Copy,
  Check,
  Code2,
  Brain,
  ChevronDown,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  ExternalLink,
  Info,
  AlertTriangle,
  Lightbulb,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ChatAttachment, Message, Model } from '../types';
import { ReplitCodeBlock } from './ReplitCodeBlock';
import { GeneratedImageCard } from './GeneratedImageCard';
import { ActionBadge } from './ActionBadge';
import { AgentExecutionSteps } from './AgentExecutionSteps';

interface ChecklistItem {
  status: 'completed' | 'in_progress' | 'pending';
  text: string;
}

interface ParsedAgentMessage {
  thinking?: string;
  currentAction?: string;
  checklist?: ChecklistItem[];
  body: string;
}

function parseMultiAgentContent(rawContent: string): ParsedAgentMessage {
  let content = rawContent;
  let thinking: string | undefined;
  let currentAction: string | undefined;
  let checklist: ChecklistItem[] | undefined;

  // 1. Extract <thinking> ... </thinking>
  const thinkingMatch = content.match(/<thinking>([\s\S]*?)<\/thinking>/i);
  if (thinkingMatch) {
    thinking = thinkingMatch[1].trim();
    content = content.replace(thinkingMatch[0], '').trim();
  }

  // 2. Extract ⚡ Current Action: ...
  const actionMatch = content.match(/(?:⚡\s*)?Current Action:\s*([^\n\r]+)/i);
  if (actionMatch) {
    currentAction = actionMatch[1].trim();
    content = content.replace(actionMatch[0], '').trim();
  }

  // 3. Extract ### 📋 Task Checklist
  const checklistHeaderRegex = /###\s*(?:📋\s*)?Task Checklist\s*([\s\S]*?)(?=(?:###\s*(?:💬\s*)?(?:Agent Response|Code Updates)|\n{2,}#|$))/i;
  const checklistMatch = content.match(checklistHeaderRegex);
  if (checklistMatch) {
    const rawChecklist = checklistMatch[1].trim();
    const items: ChecklistItem[] = [];
    const lines = rawChecklist.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (/^[-*]\s*\[[xX]\]/.test(trimmed)) {
        items.push({
          status: 'completed',
          text: trimmed.replace(/^[-*]\s*\[[xX]\]\s*(?:Completed:\s*)?/i, '').trim(),
        });
      } else if (/^[-*]\s*\[(?:🔄|~|\.\.\.|\*)\]/.test(trimmed) || /in[ -]?progress/i.test(trimmed)) {
        items.push({
          status: 'in_progress',
          text: trimmed
            .replace(/^[-*]\s*\[(?:🔄|~|\.\.\.|\*|\s)\]\s*(?:In Progress:\s*)?/i, '')
            .replace(/^[-*]\s*/, '')
            .trim(),
        });
      } else if (/^[-*]\s*\[\s*\]/.test(trimmed)) {
        items.push({
          status: 'pending',
          text: trimmed.replace(/^[-*]\s*\[\s*\]\s*(?:Pending:\s*)?/i, '').trim(),
        });
      } else if (/^[-*]\s*/.test(trimmed)) {
        items.push({
          status: 'pending',
          text: trimmed.replace(/^[-*]\s*/, '').trim(),
        });
      }
    }

    if (items.length > 0) {
      checklist = items;
    }
    content = content.replace(checklistMatch[0], '').trim();
  }

  // 4. Clean up "### 💬 Agent Response & Code Updates" header line if present
  content = content.replace(/^###\s*(?:💬\s*)?(?:Agent Response(?:\s*&\s*Code Updates)?|Code Updates)[^\n]*\n?/im, '').trim();

  return {
    thinking,
    currentAction,
    checklist,
    body: content,
  };
}

// Inline token renderer for Markdown (bold, italic, code, links, images, strikethrough)
function renderInlineMarkdown(text: string): React.ReactNode[] {
  const regex = /(!?\[[^\]]+\]\([^)]+\)|`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|~~[^~]+~~)/g;
  const nodes: React.ReactNode[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      nodes.push(text.slice(lastIdx, match.index));
    }
    const token = match[0];

    if (token.startsWith('![') && token.includes('](') && token.endsWith(')')) {
      const imgMatch = token.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (imgMatch) {
        nodes.push(
          <GeneratedImageCard
            key={match.index}
            alt={imgMatch[1] || 'Generated Photo'}
            url={imgMatch[2]}
          />
        );
      } else {
        nodes.push(token);
      }
    } else if (token.startsWith('`') && token.endsWith('`')) {
      nodes.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 rounded-md bg-[#16181d] border border-[#2e3138] text-[#a8c7fa] font-mono text-[12px] font-medium"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (
      (token.startsWith('**') && token.endsWith('**')) ||
      (token.startsWith('__') && token.endsWith('__'))
    ) {
      nodes.push(
        <strong key={match.index} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (
      (token.startsWith('*') && token.endsWith('*')) ||
      (token.startsWith('_') && token.endsWith('_'))
    ) {
      nodes.push(
        <em key={match.index} className="italic text-[#d0d3d8]">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith('~~') && token.endsWith('~~')) {
      nodes.push(
        <del key={match.index} className="line-through text-[#8e918f]">
          {token.slice(2, -2)}
        </del>
      );
    } else if (token.startsWith('[') && token.includes('](') && token.endsWith(')')) {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const linkText = linkMatch[1];
        const linkUrl = linkMatch[2];
        const isZip =
          linkUrl.includes('/api/workspace/zip') ||
          linkUrl.includes('/api/zip') ||
          linkUrl.endsWith('.zip') ||
          linkText.toLowerCase().includes('zip');

        if (isZip) {
          nodes.push(
            <a
              key={match.index}
              href={linkUrl}
              download="codepilot-workspace.zip"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#1b3e2b] hover:bg-[#24533a] text-[#7ce38b] hover:text-white border border-[#34a853]/50 text-xs font-semibold shadow-md active:scale-95 transition-all no-underline cursor-pointer my-1 select-none"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>{linkText.includes('ZIP') ? linkText : '⬇️ Download Project .ZIP'}</span>
            </a>
          );
        } else {
          nodes.push(
            <a
              key={match.index}
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#a8c7fa] hover:text-[#c2e7ff] underline underline-offset-2 inline-flex items-center gap-0.5 transition-colors"
            >
              {linkText}
              <ExternalLink className="w-2.5 h-2.5 inline opacity-70" />
            </a>
          );
        }
      } else {
        nodes.push(token);
      }
    } else {
      nodes.push(token);
    }
    lastIdx = match.index + token.length;
  }

  if (lastIdx < text.length) {
    nodes.push(text.slice(lastIdx));
  }

  return nodes.length > 0 ? nodes : [text];
}

interface ChatStreamProps {
  messages: Message[];
  isLoading: boolean;
  currentModel: Model;
  onSelectPromptChip: (text: string) => void;
  starterChips: string[];
  onRegenerate?: () => void;
  onOpenTerminal?: (command: string) => void;
  onOpenFile?: (filePath: string) => void;
  onOpenPreview?: () => void;
}

export function ChatStream({
  messages,
  isLoading,
  currentModel,
  onSelectPromptChip,
  starterChips,
  onRegenerate,
  onOpenTerminal,
  onOpenFile,
  onOpenPreview,
}: ChatStreamProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openThinkingMap, setOpenThinkingMap] = useState<Record<string, boolean>>({});
  const [customChecked, setCustomChecked] = useState<Record<string, boolean>>({});
  const [feedbackMap, setFeedbackMap] = useState<Record<string, 'up' | 'down' | null>>({});
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isLoadingVoice, setIsLoadingVoice] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<'Zephyr' | 'Puck' | 'Charon' | 'Kore' | 'Fenrir'>('Zephyr');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCache = useRef<Record<string, string>>({});

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Clean up any playing audio/speech when component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Clean raw markdown, code blocks, and tags for natural voice reading (Google Gemini style)
  const cleanTextForSpeech = (raw: string): string => {
    return raw
      .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
      .replace(/```[\s\S]*?```/g, ' Code snippet omitted. ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/#{1,6}\s+/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_~]{1,3}/g, '')
      .replace(/[-*•]\s*\[[xX ]\]/g, '')
      .replace(/⚡\s*Current Action:[^\n]+/gi, '')
      .replace(/###\s*(?:📋\s*)?Task Checklist[\s\S]*?(?=###|$)/gi, '')
      .replace(/###\s*(?:💬\s*)?(?:Agent Response|Code Updates)[^\n]*/gi, '')
      .replace(/https?:\/\/\S+/gi, '')
      .replace(/\n{2,}/g, '. ')
      .trim();
  };

  // Browser Web Speech fallback if Gemini TTS API is unreachable
  const runFallbackWebSpeech = (text: string, msgId: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSpeakingMessageId(null);
      setIsLoadingVoice(null);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find((v) => v.name.includes('Google') && (v.lang.startsWith('en') || v.lang.startsWith('hi'))) ||
      voices.find((v) => v.name.includes('Natural') && v.lang.startsWith('en')) ||
      voices.find((v) => v.lang.startsWith('en')) ||
      voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onstart = () => {
      setSpeakingMessageId(msgId);
      setIsLoadingVoice(null);
    };
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);
    window.speechSynthesis.speak(utterance);
  };

  const handleToggleSpeech = async (msgId: string, rawContent: string) => {
    // If currently playing/speaking, clicking stops it
    if (speakingMessageId === msgId || isLoadingVoice === msgId) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setSpeakingMessageId(null);
      setIsLoadingVoice(null);
      return;
    }

    // Stop previous audio if any was running
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    const textToRead = cleanTextForSpeech(rawContent);
    if (!textToRead) return;

    // Check if we already have the generated Gemini Human Audio in memory
    const cacheKey = `${msgId}_${selectedVoice}`;
    let cachedAudio = audioCache.current[cacheKey];

    if (cachedAudio) {
      try {
        const audio = new Audio(cachedAudio);
        audioRef.current = audio;
        audio.onplay = () => setSpeakingMessageId(msgId);
        audio.onended = () => setSpeakingMessageId(null);
        audio.onerror = () => runFallbackWebSpeech(textToRead, msgId);
        await audio.play();
        return;
      } catch {
        // fall through to regenerate
      }
    }

    // Fetch real Google Gemini human voice from backend
    setIsLoadingVoice(msgId);
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToRead,
          voice: selectedVoice,
        }),
      });

      const data = await response.json();

      if (data.audio) {
        const audioSrc = `data:audio/wav;base64,${data.audio}`;
        audioCache.current[cacheKey] = audioSrc;

        const audio = new Audio(audioSrc);
        audioRef.current = audio;

        audio.onplay = () => {
          setIsLoadingVoice(null);
          setSpeakingMessageId(msgId);
        };
        audio.onended = () => {
          setSpeakingMessageId(null);
          setIsLoadingVoice(null);
        };
        audio.onerror = () => {
          setIsLoadingVoice(null);
          runFallbackWebSpeech(textToRead, msgId);
        };

        await audio.play();
        return;
      } else {
        // Fallback if backend returned error
        setIsLoadingVoice(null);
        runFallbackWebSpeech(textToRead, msgId);
      }
    } catch (e) {
      console.warn('Asli Gemini voice fetch failed, using fallback speech:', e);
      setIsLoadingVoice(null);
      runFallbackWebSpeech(textToRead, msgId);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleThinking = (msgId: string) => {
    setOpenThinkingMap((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  const handleToggleChecklistItem = (key: string, newStatus: boolean) => {
    setCustomChecked((prev) => ({
      ...prev,
      [key]: newStatus,
    }));
  };

  const handleFeedback = (msgId: string, type: 'up' | 'down') => {
    setFeedbackMap((prev) => ({
      ...prev,
      [msgId]: prev[msgId] === type ? null : type,
    }));
  };

  const renderAttachmentIcon = (attachment: ChatAttachment) => {
    const name = attachment.name.toLowerCase();
    if (attachment.mimeType?.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/.test(name)) {
      return <ImageIcon className="w-4 h-4 text-[#a8c7fa]" />;
    }
    if (attachment.mimeType?.startsWith('video/') || /\.(mp4|mov|avi|mkv|webm)$/.test(name)) {
      return <Video className="w-4 h-4 text-[#a8c7fa]" />;
    }
    if (/\.(zip|rar|7z|tar|gz)$/.test(name)) {
      return <Archive className="w-4 h-4 text-[#a8c7fa]" />;
    }
    return <FileText className="w-4 h-4 text-[#a8c7fa]" />;
  };

  const formatFileSize = (size?: number) => {
    if (!size) return 'File';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Structured Markdown block parser & renderer
  const renderRichTextBlocks = (text: string, messageId: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // Empty line
      if (!trimmed) {
        i++;
        continue;
      }

      // 1. Headings
      if (trimmed.startsWith('#### ')) {
        elements.push(
          <h4 key={`h4-${i}`} className="text-xs font-semibold text-[#a8c7fa] uppercase tracking-wider mt-3 mb-1.5">
            {renderInlineMarkdown(trimmed.replace(/^####\s+/, ''))}
          </h4>
        );
        i++;
        continue;
      }
      if (trimmed.startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${i}`} className="text-sm font-semibold text-white mt-3 mb-1.5 flex items-center gap-1.5">
            {renderInlineMarkdown(trimmed.replace(/^###\s+/, ''))}
          </h3>
        );
        i++;
        continue;
      }
      if (trimmed.startsWith('## ')) {
        elements.push(
          <h2 key={`h2-${i}`} className="text-base font-semibold text-[#a8c7fa] mt-3.5 mb-1.5 border-b border-[#333538]/50 pb-1 flex items-center gap-2">
            {renderInlineMarkdown(trimmed.replace(/^##\s+/, ''))}
          </h2>
        );
        i++;
        continue;
      }
      if (trimmed.startsWith('# ')) {
        elements.push(
          <h1 key={`h1-${i}`} className="text-lg font-bold text-white mt-4 mb-2 flex items-center gap-2">
            {renderInlineMarkdown(trimmed.replace(/^#\s+/, ''))}
          </h1>
        );
        i++;
        continue;
      }

      // 2. Horizontal Rules
      if (/^(\*\*\*|---|___)$/.test(trimmed)) {
        elements.push(<hr key={`hr-${i}`} className="my-3 border-[#333538]" />);
        i++;
        continue;
      }

      // 3. Blockquotes / Callout Cards (> 💡, > ⚠️, > ℹ️, > ...)
      if (trimmed.startsWith('>')) {
        const quoteLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('>')) {
          quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
          i++;
        }
        const fullQuote = quoteLines.join('\n');
        const isTip = fullQuote.includes('💡') || /tip/i.test(fullQuote);
        const isWarning = fullQuote.includes('⚠️') || fullQuote.includes('🚨') || /warn/i.test(fullQuote);
        const isInfo = fullQuote.includes('ℹ️') || fullQuote.includes('Notice');

        let cardStyle = 'bg-[#181a20] border-[#2e3138] border-l-[#8e918f] text-[#c4c7c5]';
        let IconComponent = Info;
        if (isTip) {
          cardStyle = 'bg-[#14202e] border-[#23354d] border-l-[#a8c7fa] text-[#dbe8ff]';
          IconComponent = Lightbulb;
        } else if (isWarning) {
          cardStyle = 'bg-[#291e14] border-[#473322] border-l-[#fbbc04] text-[#ffe8d6]';
          IconComponent = AlertTriangle;
        } else if (isInfo) {
          cardStyle = 'bg-[#162327] border-[#25393f] border-l-[#78d9ec] text-[#e0f7fa]';
          IconComponent = Info;
        }

        elements.push(
          <div
            key={`quote-${i}`}
            className={`my-2.5 p-3 rounded-xl border border-l-4 text-xs leading-relaxed flex items-start gap-2.5 shadow-sm ${cardStyle}`}
          >
            <IconComponent className="w-4 h-4 shrink-0 mt-0.5 opacity-90" />
            <div className="flex-1 whitespace-pre-wrap">{renderInlineMarkdown(fullQuote)}</div>
          </div>
        );
        continue;
      }

      // 3.5. Photorealistic AI Generated Image (![alt](url))
      const directImgMatch = trimmed.match(/^!\[([^\]]*)\]\((https?:\/\/[^)]+)\)$/);
      if (directImgMatch) {
        elements.push(
          <GeneratedImageCard
            key={`img-${i}`}
            alt={directImgMatch[1] || 'Generated Photo'}
            url={directImgMatch[2]}
          />
        );
        i++;
        continue;
      }

      // 3.55. Action Badge: Created/Updated File to replace raw code dumps
      const actionBadgeMatch = trimmed.match(/^\[ACTION_BADGE:(Created|Updated):([^:]+):?([0-9]*)\]$/i);
      if (actionBadgeMatch) {
        elements.push(
          <ActionBadge
            key={`action-badge-${i}`}
            action={actionBadgeMatch[1]}
            filePath={actionBadgeMatch[2]}
            lines={actionBadgeMatch[3]}
            onOpenFile={onOpenFile}
            onOpenPreview={onOpenPreview}
          />
        );
        i++;
        continue;
      }

      const textBadgeMatch = trimmed.match(/^(?:Created|Updated):\s*([a-zA-Z0-9_\-\.\/]+\.[a-zA-Z0-9]{1,10})$/i);
      if (textBadgeMatch && !trimmed.includes('```')) {
        const actionType = trimmed.toLowerCase().startsWith('created') ? 'Created' : 'Updated';
        elements.push(
          <ActionBadge
            key={`text-badge-${i}`}
            action={actionType}
            filePath={textBadgeMatch[1]}
            onOpenFile={onOpenFile}
            onOpenPreview={onOpenPreview}
          />
        );
        i++;
        continue;
      }

      // 3.6. Actionable Project ZIP Download Card
      if (
        trimmed.includes('/api/workspace/zip') ||
        trimmed.includes('/api/zip') ||
        (trimmed.startsWith('[') &&
          trimmed.toLowerCase().includes('download') &&
          trimmed.toLowerCase().includes('zip'))
      ) {
        elements.push(
          <div
            key={`zip-block-${i}`}
            className="my-3 p-3.5 rounded-2xl bg-[#111914] border border-[#34a853]/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg group hover:border-[#34a853] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#34a853]/20 border border-[#34a853]/40 flex items-center justify-center text-[#7ce38b] shrink-0 group-hover:scale-105 transition-transform">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-[13px] text-white flex items-center gap-2">
                  <span>Project Source Code Archive</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#34a853]/20 text-[#7ce38b] font-mono border border-[#34a853]/40">
                    .ZIP READY
                  </span>
                </div>
                <div className="text-[11px] text-[#8e918f]">
                  Bundled via JSZip & archiver backend tool • Complete working project files
                </div>
              </div>
            </div>
            <a
              href="/api/workspace/zip"
              download="codepilot-workspace.zip"
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#34a853] hover:bg-[#2e9549] text-[#061e0e] font-semibold text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all no-underline shrink-0"
            >
              <Archive className="w-4 h-4" />
              <span>⬇️ Download Project .ZIP</span>
            </a>
          </div>
        );
        i++;
        continue;
      }

      // 4. Tables (| col1 | col2 |)
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
          tableLines.push(lines[i].trim());
          i++;
        }

        if (tableLines.length >= 2) {
          const parseRow = (r: string) =>
            r
              .slice(1, -1)
              .split('|')
              .map((c) => c.trim());
          const headerCells = parseRow(tableLines[0]);
          const dataRows = tableLines.slice(2).map(parseRow);

          elements.push(
            <div key={`table-${i}`} className="my-2.5 overflow-x-auto rounded-xl border border-[#333538] bg-[#111216]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#18191c] border-b border-[#333538] text-[#a8c7fa]">
                    {headerCells.map((cell, cIdx) => (
                      <th key={cIdx} className="px-3 py-2 font-semibold">
                        {renderInlineMarkdown(cell)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataRows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className="border-b border-[#333538]/40 hover:bg-[#18191d]/60 transition-colors"
                    >
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3 py-2 text-[#e3e3e3]">
                          {renderInlineMarkdown(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          continue;
        }
      }

      // 5. Unordered List Items (- or * or •)
      if (/^[-*•]\s+/.test(trimmed)) {
        const listItems: string[] = [];
        while (i < lines.length && /^[-*•]\s+/.test(lines[i].trim())) {
          listItems.push(lines[i].trim().replace(/^[-*•]\s+/, ''));
          i++;
        }
        elements.push(
          <ul key={`ul-${i}`} className="my-2 space-y-1.5 pl-1">
            {listItems.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-[#e3e3e3]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#a8c7fa] mt-1.5 shrink-0" />
                <span className="flex-1">{renderInlineMarkdown(item)}</span>
              </li>
            ))}
          </ul>
        );
        continue;
      }

      // 6. Ordered List Items (1. 2. 3.)
      if (/^\d+\.\s+/.test(trimmed)) {
        const orderedItems: string[] = [];
        while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
          orderedItems.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
          i++;
        }
        elements.push(
          <ol key={`ol-${i}`} className="my-2 space-y-1.5 pl-1">
            {orderedItems.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-[#e3e3e3]">
                <span className="text-[11px] font-mono font-semibold text-[#a8c7fa] shrink-0 min-w-[18px]">
                  {idx + 1}.
                </span>
                <span className="flex-1">{renderInlineMarkdown(item)}</span>
              </li>
            ))}
          </ol>
        );
        continue;
      }

      // 7. Regular paragraph
      elements.push(
        <p key={`p-${i}`} className="text-xs leading-relaxed text-[#e3e3e3] my-1.5">
          {renderInlineMarkdown(trimmed)}
        </p>
      );
      i++;
    }

    return elements;
  };

  // Main Markdown & Code block rendering pipeline
  const renderMessageContent = (content: string, messageId: string) => {
    // Split by markdown code blocks ```lang ... ```
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const parts: { type: 'text' | 'code'; language?: string; code?: string; value?: string }[] = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          value: content.slice(lastIndex, match.index),
        });
      }
      parts.push({
        type: 'code',
        language: match[1] || 'code',
        code: match[2],
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        value: content.slice(lastIndex),
      });
    }

    if (parts.length === 0) {
      return <div className="space-y-1">{renderRichTextBlocks(content, messageId)}</div>;
    }

    return (
      <div className="space-y-2.5">
        {parts.map((part, index) => {
          if (part.type === 'code') {
            const codeKey = `${messageId}-code-${index}`;
            return (
              <ReplitCodeBlock
                key={index}
                code={part.code || ''}
                language={part.language || 'code'}
                codeKey={codeKey}
                onCopy={() => handleCopy(part.code || '', codeKey)}
                isCopied={copiedId === codeKey}
                onOpenTerminal={onOpenTerminal}
              />
            );
          }
          return (
            <div key={index} className="space-y-1">
              {renderRichTextBlocks(part.value || '', messageId)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
      {messages.length === 0 ? (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 max-w-lg mx-auto select-none py-6">
          <div className="w-[54px] h-[54px] rounded-full bg-[#1e1f20] border border-[#333538] flex items-center justify-center mb-[15px] shadow-md">
            <Sparkles className="w-[26px] h-[26px] text-[#a8c7fa]" />
          </div>

          <h1 className="font-semibold text-[28px] leading-[34px] text-[#e3e3e3] text-center mb-6">
            Hi Sk, let&apos;s get into it
          </h1>

          <div className="w-full space-y-2.5 text-left">
            <span className="text-[11px] font-medium tracking-wide text-[#8e918f] uppercase block px-1">
              Suggested Prompts
            </span>
            <div className="space-y-2">
              {starterChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectPromptChip(chip)}
                  className="w-full min-h-[53px] rounded-[14px] bg-[#1e1f20] hover:bg-[#282a2c] border border-[#333538] hover:border-[#a8c7fa]/40 px-[14px] flex items-center gap-[11px] text-left transition-all cursor-pointer group shadow-sm active:scale-[0.99]"
                >
                  <Sparkles className="w-4 h-4 text-[#a8c7fa] shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="text-[13px] font-medium text-[#e3e3e3] group-hover:text-white flex-1 leading-snug">
                    {chip}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((message, msgIndex) => {
            const isUser = message.role === 'user';
            const isLastAssistant = !isUser && msgIndex === messages.length - 1;
            const wordCount = message.content.trim().split(/\s+/).length;

            return (
              <div
                key={message.id}
                className={`flex gap-[9px] items-start mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-[30px] h-[30px] rounded-full bg-[#1e1f20] border border-[#333538] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Sparkles className="w-4 h-4 text-[#a8c7fa]" />
                  </div>
                )}

                <div
                  className={`max-w-[84%] rounded-[17px] px-[15px] py-[12px] text-[14px] leading-[20px] shadow-sm ${
                    isUser
                      ? 'bg-[#282a2c] text-[#e3e3e3]'
                      : 'bg-[#1a1b1e] border border-[#2e3138] text-[#e3e3e3]'
                  }`}
                >
                  {/* Model Header for Assistant */}
                  {!isUser && (
                    <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-[#2e3138] text-[11px] text-[#8e918f]">
                      <div className="flex items-center gap-1.5 font-medium">
                        <span className="text-[#a8c7fa] font-semibold text-[12px]">
                          {message.modelId || currentModel.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#5f6368] hidden sm:inline">
                          {wordCount} words
                        </span>
                        <button
                          onClick={() => handleCopy(message.content, message.id)}
                          className="hover:text-white transition-colors cursor-pointer p-1 rounded hover:bg-[#282a2f]"
                          title="Copy entire response"
                        >
                          {copiedId === message.id ? (
                            <Check className="w-3.5 h-3.5 text-[#34a853]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Attachment Card if present */}
                  {message.attachment && (
                    <div className="mb-3 max-w-sm rounded-xl overflow-hidden border border-[#333538] bg-[#111216]">
                      {message.attachment.mediaType === 'image' || message.attachment.mimeType?.startsWith('image/') ? (
                        <div>
                          <div className="relative group max-h-72 overflow-hidden bg-black/40 flex items-center justify-center">
                            <img
                              src={message.attachment.dataUrl || message.attachment.uri}
                              alt={message.attachment.name}
                              className="w-full max-h-72 object-contain rounded-t-xl"
                              loading="lazy"
                            />
                          </div>
                          <div className="flex items-center justify-between px-3 py-1.5 bg-[#18191c] text-[11px] text-[#8e918f] border-t border-[#333538]/60">
                            <span className="truncate max-w-[180px] text-[#e3e3e3] font-medium">
                              {message.attachment.name}
                            </span>
                            <span>{formatFileSize(message.attachment.size)}</span>
                          </div>
                        </div>
                      ) : message.attachment.mediaType === 'video' || message.attachment.mimeType?.startsWith('video/') ? (
                        <div>
                          <video
                            controls
                            preload="metadata"
                            src={message.attachment.dataUrl || message.attachment.uri}
                            className="w-full max-h-72 rounded-t-xl bg-black"
                          />
                          <div className="flex items-center justify-between px-3 py-1.5 bg-[#18191c] text-[11px] text-[#8e918f] border-t border-[#333538]/60">
                            <span className="truncate max-w-[180px] text-[#e3e3e3] font-medium">
                              {message.attachment.name}
                            </span>
                            <span>{formatFileSize(message.attachment.size)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5 p-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#282a2c] flex items-center justify-center shrink-0">
                            {renderAttachmentIcon(message.attachment)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-white truncate">
                              {message.attachment.name}
                            </div>
                            <div className="text-[10px] text-[#8e918f] mt-0.5">
                              {formatFileSize(message.attachment.size)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Content */}
                  {isUser ? (
                    <div className="space-y-1">{renderRichTextBlocks(message.content, message.id)}</div>
                  ) : (() => {
                    const parsed = parseMultiAgentContent(message.content);
                    const completedCount = parsed.checklist
                      ? parsed.checklist.filter(
                          (item, idx) => customChecked[`${message.id}-${idx}`] ?? item.status === 'completed'
                        ).length
                      : 0;
                    const totalChecklist = parsed.checklist?.length || 0;
                    const progressPercent =
                      totalChecklist > 0 ? Math.round((completedCount / totalChecklist) * 100) : 0;

                    return (
                      <div className="space-y-2.5">
                        {/* 1. Thinking Accordion */}
                        {parsed.thinking && (
                          <div className="mb-2.5">
                            <button
                              type="button"
                              onClick={() => toggleThinking(message.id)}
                              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#131418] border border-[#2a2d35] hover:border-[#a8c7fa]/50 text-xs text-[#a8c7fa] transition-all cursor-pointer group shadow-sm select-none"
                            >
                              <div className="flex items-center gap-2 font-medium">
                                <Brain className="w-3.5 h-3.5 text-[#a8c7fa] group-hover:scale-110 transition-transform" />
                                <span>Agent Reasoning & Plan</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-[#8e918f]">
                                <span>{openThinkingMap[message.id] ? 'Hide' : 'Show details'}</span>
                                <ChevronDown
                                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                    openThinkingMap[message.id] ? 'rotate-180 text-[#a8c7fa]' : ''
                                  }`}
                                />
                              </div>
                            </button>
                            {openThinkingMap[message.id] && (
                              <div className="mt-1.5 p-3 rounded-xl bg-[#101115] border border-[#252830] text-xs text-[#c4c7c5] font-mono leading-relaxed whitespace-pre-wrap selection:bg-[#a8c7fa]/20 border-l-2 border-l-[#a8c7fa]">
                                {parsed.thinking}
                              </div>
                            )}
                          </div>
                        )}

                        {/* 2. Current Action Bar */}
                        {parsed.currentAction && (
                          <div className="mb-2.5 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#141824] border border-[#233148] text-xs shadow-inner">
                            <div className="relative flex items-center justify-center shrink-0">
                              <span className="w-2 h-2 rounded-full bg-[#a8c7fa] animate-ping absolute opacity-75" />
                              <span className="w-2 h-2 rounded-full bg-[#a8c7fa] relative" />
                            </div>
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <span className="font-semibold text-[#a8c7fa] shrink-0">
                                Current Action:
                              </span>
                              <span className="text-[#e3e3e3] font-medium truncate">
                                {parsed.currentAction}
                              </span>
                            </div>
                            <Loader2 className="w-3.5 h-3.5 text-[#a8c7fa] animate-spin shrink-0 opacity-80" />
                          </div>
                        )}

                        {/* 2.5 Real Autonomous Agent Tool Executions Timeline */}
                        {message.toolSteps && message.toolSteps.length > 0 && (
                          <AgentExecutionSteps
                            steps={message.toolSteps}
                            onOpenFile={onOpenFile}
                            onOpenTerminal={onOpenTerminal}
                          />
                        )}

                        {/* 3. Task Checklist Cards with Progress Bar */}
                        {parsed.checklist && parsed.checklist.length > 0 && (
                          <div className="mb-2.5 rounded-2xl bg-[#131418] border border-[#282b33] p-3 space-y-2 shadow-sm">
                            <div className="flex items-center justify-between pb-1.5 text-[11px] font-semibold text-[#8e918f] uppercase tracking-wider">
                              <div className="flex items-center gap-1.5 text-[#e3e3e3]">
                                <span>📋</span>
                                <span>Task Checklist</span>
                              </div>
                              <span className="text-[10px] font-mono text-[#a8c7fa] bg-[#1a2130] px-2 py-0.5 rounded-full">
                                {completedCount} / {totalChecklist} Completed ({progressPercent}%)
                              </span>
                            </div>

                            {/* Checklist Progress Bar */}
                            <div className="w-full bg-[#20232b] h-1.5 rounded-full overflow-hidden mb-2">
                              <div
                                className="bg-[#a8c7fa] h-full transition-all duration-300 rounded-full"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>

                            <div className="space-y-1.5 pt-0.5">
                              {parsed.checklist.map((item, idx) => {
                                const itemKey = `${message.id}-${idx}`;
                                const isDone = customChecked[itemKey] ?? item.status === 'completed';
                                const isInProgress = !isDone && item.status === 'in_progress';
                                return (
                                  <div
                                    key={idx}
                                    onClick={() => handleToggleChecklistItem(itemKey, !isDone)}
                                    className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs transition-all cursor-pointer select-none ${
                                      isDone
                                        ? 'bg-[#17241c] border-[#1e4028] text-[#81c995]'
                                        : isInProgress
                                        ? 'bg-[#152030] border-[#223652] text-[#a8c7fa]'
                                        : 'bg-[#18191d] border-[#282a2f] text-[#c4c7c5] hover:bg-[#202227]'
                                    }`}
                                  >
                                    <div className="shrink-0 flex items-center justify-center">
                                      {isDone ? (
                                        <div className="w-4 h-4 rounded-full bg-[#34a853]/20 text-[#34a853] flex items-center justify-center">
                                          <Check className="w-3 h-3 stroke-[3]" />
                                        </div>
                                      ) : isInProgress ? (
                                        <Loader2 className="w-4 h-4 text-[#a8c7fa] animate-spin" />
                                      ) : (
                                        <div className="w-4 h-4 rounded-full border border-[#52555a]" />
                                      )}
                                    </div>
                                    <span className={`flex-1 leading-snug ${isDone ? 'line-through opacity-80' : 'font-normal'}`}>
                                      {item.text}
                                    </span>
                                    {isInProgress && (
                                      <span className="text-[9px] uppercase font-semibold tracking-wider text-[#a8c7fa] bg-[#a8c7fa]/15 px-1.5 py-0.5 rounded-full">
                                        In Progress
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* 4. Agent Response & Code Updates Body */}
                        {parsed.body ? (
                          <div>{renderMessageContent(parsed.body, message.id)}</div>
                        ) : null}
                      </div>
                    );
                  })()}

                  {/* Loading Voice Indicator */}
                  {!isUser && isLoadingVoice === message.id && (
                    <div className="mt-3 px-3 py-2 rounded-xl bg-[#141d2e] border border-[#2c3d5e] flex items-center justify-between text-xs text-[#a8c7fa] animate-in fade-in shadow-md">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#a8c7fa]" />
                        <span className="font-medium">
                          Generating Asli Gemini Human Voice ({selectedVoice})...
                        </span>
                      </div>
                      <button
                        onClick={() => handleToggleSpeech(message.id, message.content)}
                        className="px-2 py-0.5 rounded bg-[#1e2a42] hover:bg-[#283756] text-[#e3e3e3] hover:text-white transition-colors cursor-pointer text-[11px]"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Active Voice Playing Indicator (Asli Google Gemini Human Voice) */}
                  {!isUser && speakingMessageId === message.id && (
                    <div className="mt-3 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#141d2e] to-[#1c2333] border border-[#3b5282] flex items-center justify-between text-xs text-[#a8c7fa] animate-in fade-in shadow-lg">
                      <div className="flex items-center gap-3">
                        {/* 4 Animated Equalizer Audio Bars */}
                        <div className="flex items-end gap-1 h-4 px-0.5">
                          <span className="w-1 h-4 bg-[#a8c7fa] rounded-full animate-[pulse_0.6s_ease-in-out_infinite]" />
                          <span className="w-1 h-2.5 bg-[#a8c7fa] rounded-full animate-[pulse_0.4s_ease-in-out_infinite_100ms]" />
                          <span className="w-1 h-3.5 bg-[#a8c7fa] rounded-full animate-[pulse_0.8s_ease-in-out_infinite_200ms]" />
                          <span className="w-1 h-2 bg-[#a8c7fa] rounded-full animate-[pulse_0.5s_ease-in-out_infinite_50ms]" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-[#e3e3e3] flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-[#a8c7fa]" />
                            Playing Real Human Voice
                          </span>
                          <span className="text-[11px] text-[#a8c7fa]">
                            Google Gemini {selectedVoice} (24kHz HD Audio)
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleSpeech(message.id, message.content)}
                        className="px-2.5 py-1 rounded-lg bg-[#283756] hover:bg-[#344870] text-[#e3e3e3] hover:text-white transition-all cursor-pointer text-[11px] font-semibold shadow"
                      >
                        Stop
                      </button>
                    </div>
                  )}

                  {/* Assistant Footer & Interactive Action Row */}
                  <div
                    className={`mt-2.5 pt-1.5 border-t border-[#2a2c33] flex items-center justify-between text-[11px] text-[#8e918f] ${
                      isUser ? 'justify-end' : ''
                    }`}
                  >
                    {!isUser && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Google Gemini Asli Human Voice / Listen Button */}
                        <button
                          id={`btn-listen-${message.id}`}
                          onClick={() => handleToggleSpeech(message.id, message.content)}
                          disabled={isLoadingVoice === message.id}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                            speakingMessageId === message.id
                              ? 'text-[#a8c7fa] bg-[#a8c7fa]/20 ring-1 ring-[#a8c7fa]/50 shadow-sm'
                              : 'text-[#a8c7fa] hover:text-white hover:bg-[#252830]'
                          }`}
                          title={
                            speakingMessageId === message.id
                              ? 'Stop voice'
                              : `Listen in real Gemini human voice (${selectedVoice})`
                          }
                        >
                          {isLoadingVoice === message.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#a8c7fa]" />
                              <span>Loading voice...</span>
                            </>
                          ) : speakingMessageId === message.id ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5 text-[#a8c7fa]" />
                              <span className="text-[#a8c7fa] font-semibold">Stop Voice</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5 text-[#a8c7fa]" />
                              <span>Human Voice</span>
                            </>
                          )}
                        </button>

                        {/* Human Voice Selector Dropdown */}
                        <div className="relative inline-flex items-center">
                          <select
                            value={selectedVoice}
                            onChange={(e) => setSelectedVoice(e.target.value as any)}
                            title="Select Gemini Human Voice"
                            className="bg-[#1c1d22] hover:bg-[#252830] text-[#c4c7c5] hover:text-white border border-[#333538] text-[10px] rounded-md px-1.5 py-1 cursor-pointer focus:outline-none focus:border-[#a8c7fa] transition-colors"
                          >
                            <option value="Zephyr">Zephyr (Warm Female)</option>
                            <option value="Puck">Puck (Lively Male)</option>
                            <option value="Kore">Kore (Gentle Female)</option>
                            <option value="Charon">Charon (Deep Male)</option>
                            <option value="Fenrir">Fenrir (Bold Male)</option>
                          </select>
                        </div>

                        {/* Copy Full Response Button */}
                        <button
                          id={`btn-copy-msg-${message.id}`}
                          onClick={() => handleCopy(cleanTextForSpeech(message.content), `msg-${message.id}`)}
                          className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-[#252830] transition-colors cursor-pointer text-[#8e918f] hover:text-[#e3e3e3]"
                          title="Copy response"
                        >
                          {copiedId === `msg-${message.id}` ? (
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

                        {/* Thumbs Feedback */}
                        <button
                          onClick={() => handleFeedback(message.id, 'up')}
                          className={`p-1 rounded hover:bg-[#252830] transition-colors cursor-pointer ${
                            feedbackMap[message.id] === 'up' ? 'text-[#34a853] bg-[#34a853]/10' : ''
                          }`}
                          title="Helpful response"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleFeedback(message.id, 'down')}
                          className={`p-1 rounded hover:bg-[#252830] transition-colors cursor-pointer ${
                            feedbackMap[message.id] === 'down' ? 'text-[#ea4335] bg-[#ea4335]/10' : ''
                          }`}
                          title="Unhelpful response"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </button>

                        {/* Regenerate if last assistant message */}
                        {isLastAssistant && onRegenerate && (
                          <button
                            onClick={onRegenerate}
                            disabled={isLoading}
                            className="flex items-center gap-1 ml-1 px-2 py-0.5 rounded hover:bg-[#252830] hover:text-[#a8c7fa] transition-colors cursor-pointer disabled:opacity-50"
                            title="Regenerate response"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Regenerate</span>
                          </button>
                        )}
                      </div>
                    )}
                    <div className="font-mono text-[10px]">{message.timestamp}</div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Thinking Indicator */}
          {isLoading && (
            <div className="flex gap-[9px] items-start mb-4">
              <div className="w-[30px] h-[30px] rounded-full bg-[#1e1f20] border border-[#333538] flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-[#a8c7fa] animate-spin" />
              </div>
              <div className="rounded-[17px] px-[14px] py-[11px] bg-[#1e1f20] border border-[#333538] flex items-center gap-[9px]">
                <div className="flex gap-[3px]">
                  <span className="w-[5px] h-[5px] rounded-full bg-[#a8c7fa] animate-bounce" />
                  <span
                    className="w-[5px] h-[5px] rounded-full bg-[#a8c7fa] animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="w-[5px] h-[5px] rounded-full bg-[#a8c7fa] animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
                <span className="text-[12px] text-[#8e918f]">
                  Synthesizing with {currentModel.name}...
                </span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
