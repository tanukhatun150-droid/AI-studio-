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
  Zap,
} from 'lucide-react';
import { ChatAttachment, Message, Model } from '../types';

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

interface ChatStreamProps {
  messages: Message[];
  isLoading: boolean;
  currentModel: Model;
  onSelectPromptChip: (text: string) => void;
  starterChips: string[];
}

export function ChatStream({
  messages,
  isLoading,
  currentModel,
  onSelectPromptChip,
  starterChips,
}: ChatStreamProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openThinkingMap, setOpenThinkingMap] = useState<Record<string, boolean>>({});
  const [customChecked, setCustomChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

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

  // Simple Markdown & Code renderer
  const renderMessageContent = (content: string) => {
    // Split by markdown code blocks ```lang ... ```
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const parts = [];
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
      return <p className="whitespace-pre-wrap leading-relaxed text-sm">{content}</p>;
    }

    return (
      <div className="space-y-3">
        {parts.map((part, index) => {
          if (part.type === 'code') {
            return (
              <div
                key={index}
                className="my-2 rounded-xl bg-[#111216] border border-[#333538] overflow-hidden shadow-sm"
              >
                <div className="flex items-center justify-between px-3 py-1.5 bg-[#18191c] border-b border-[#333538] text-[11px] text-[#8e918f] font-mono">
                  <div className="flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-[#a8c7fa]" />
                    <span>{part.language}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(part.code || '', `code-${index}`)}
                    className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedId === `code-${index}` ? (
                      <>
                        <Check className="w-3 h-3 text-[#34a853]" />
                        <span className="text-[#34a853]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 text-xs font-mono text-[#e3e3e3] overflow-x-auto leading-relaxed">
                  <code>{part.code}</code>
                </pre>
              </div>
            );
          }
          return (
            <p key={index} className="whitespace-pre-wrap leading-relaxed text-sm text-[#e3e3e3]">
              {part.value}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
      {messages.length === 0 ? (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 max-w-lg mx-auto select-none py-6">
          {/* Hero Mark (width: 54, height: 54, borderRadius: 27, marginBottom: 15) */}
          <div className="w-[54px] h-[54px] rounded-full bg-[#1e1f20] border border-[#333538] flex items-center justify-center mb-[15px] shadow-md">
            <Sparkles className="w-[26px] h-[26px] text-[#a8c7fa]" />
          </div>

          {/* Greeting (fontFamily: Inter_600SemiBold, fontSize: 28, lineHeight: 34, textAlign: center) */}
          <h1 className="font-semibold text-[28px] leading-[34px] text-[#e3e3e3] text-center mb-6">
            Hi Sk, let&apos;s get into it
          </h1>

          {/* Prompt Grid (gap: 9, minHeight: 53, borderRadius: 14) */}
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
          {messages.map((message) => {
            const isUser = message.role === 'user';
            return (
              <div
                key={message.id}
                className={`flex gap-[9px] items-start mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-[30px] h-[30px] rounded-full bg-[#1e1f20] border border-[#333538] flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4 text-[#a8c7fa]" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-[17px] px-[14px] py-[11px] text-[14px] leading-[20px] shadow-sm ${
                    isUser
                      ? 'bg-[#282a2c] text-[#e3e3e3]'
                      : 'bg-[#1e1f20] border border-[#333538] text-[#e3e3e3]'
                  }`}
                >
                  {/* Persona or Model Header for Assistant */}
                  {!isUser && (
                    <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-[#333538]/60 text-[11px] text-[#8e918f]">
                      <div className="flex items-center gap-1.5 font-medium">
                        <span className="text-[#a8c7fa] font-semibold">
                          {message.agentPersona || 'AI Agent'}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-[10px]">{message.modelId || currentModel.name}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(message.content, message.id)}
                        className="hover:text-white transition-colors cursor-pointer"
                        title="Copy message"
                      >
                        {copiedId === message.id ? (
                          <Check className="w-3.5 h-3.5 text-[#34a853]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
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
                    <div>{renderMessageContent(message.content)}</div>
                  ) : (() => {
                    const parsed = parseMultiAgentContent(message.content);
                    return (
                      <div className="space-y-2">
                        {/* 1. Thinking Accordion */}
                        {parsed.thinking && (
                          <div className="mb-2.5">
                            <button
                              type="button"
                              onClick={() => toggleThinking(message.id)}
                              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#141519] border border-[#2e3036] hover:border-[#a8c7fa]/50 text-xs text-[#a8c7fa] transition-all cursor-pointer group shadow-sm select-none"
                            >
                              <div className="flex items-center gap-2 font-medium">
                                <Brain className="w-3.5 h-3.5 text-[#a8c7fa] group-hover:scale-110 transition-transform" />
                                <span>Thinking it through ⌵</span>
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
                              <div className="mt-1.5 p-3 rounded-xl bg-[#121316] border border-[#2a2c32] text-xs text-[#c4c7c5] font-mono leading-relaxed whitespace-pre-wrap selection:bg-[#a8c7fa]/20 border-l-2 border-l-[#a8c7fa]">
                                {parsed.thinking}
                              </div>
                            )}
                          </div>
                        )}

                        {/* 2. Current Action Bar */}
                        {parsed.currentAction && (
                          <div className="mb-2.5 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#181a20] border border-[#2e3344] text-xs shadow-inner">
                            <div className="relative flex items-center justify-center shrink-0">
                              <span className="w-2.5 h-2.5 rounded-full bg-[#a8c7fa] animate-ping absolute opacity-70" />
                              <span className="w-2 h-2 rounded-full bg-[#a8c7fa] relative" />
                            </div>
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <span className="font-semibold text-[#a8c7fa] shrink-0">
                                ⚡ Current Action:
                              </span>
                              <span className="text-[#e3e3e3] font-medium truncate">
                                {parsed.currentAction}
                              </span>
                            </div>
                            <Loader2 className="w-3.5 h-3.5 text-[#a8c7fa] animate-spin shrink-0 opacity-85" />
                          </div>
                        )}

                        {/* 3. Task Checklist Cards */}
                        {parsed.checklist && parsed.checklist.length > 0 && (
                          <div className="mb-2.5 rounded-2xl bg-[#141519] border border-[#2a2c32] p-3 space-y-2 shadow-sm">
                            <div className="flex items-center justify-between pb-1 border-b border-[#24262c] text-[11px] font-semibold text-[#8e918f] uppercase tracking-wider">
                              <div className="flex items-center gap-1.5 text-[#e3e3e3]">
                                <span className="text-sm">📋</span>
                                <span>Task Checklist</span>
                              </div>
                              <span className="text-[10px] font-mono text-[#a8c7fa]">
                                {parsed.checklist.filter((item, idx) => customChecked[`${message.id}-${idx}`] ?? item.status === 'completed').length} / {parsed.checklist.length} Completed
                              </span>
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
                                        ? 'bg-[#1b2520] border-[#22442d] text-[#81c995]'
                                        : isInProgress
                                        ? 'bg-[#1a2130] border-[#263854] text-[#a8c7fa]'
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
                                      <span className="text-[10px] uppercase font-semibold tracking-wider text-[#a8c7fa] bg-[#a8c7fa]/15 px-1.5 py-0.5 rounded-full">
                                        Active
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
                          <div>{renderMessageContent(parsed.body)}</div>
                        ) : null}
                      </div>
                    );
                  })()}

                  {/* Timestamp */}
                  <div
                    className={`mt-1.5 text-[10px] text-[#8e918f] font-mono ${
                      isUser ? 'text-right' : 'text-left'
                    }`}
                  >
                    {message.timestamp}
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
                  Thinking with {currentModel.name}
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
