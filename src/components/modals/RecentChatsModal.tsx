import React, { useState } from 'react';
import { X, History, MessageSquare, Trash2, Plus, ArrowRight, Search, Clock } from 'lucide-react';
import { ChatSession } from '../../types';

interface RecentChatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
  onClearAllSessions: () => void;
}

export function RecentChatsModal({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onClearAllSessions,
}: RecentChatsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredSessions = sessions.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="relative w-full max-w-lg bg-[#1e1f20] border border-[#333538] rounded-2xl p-5 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#333538]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#a8c7fa]/10 border border-[#a8c7fa]/20 flex items-center justify-center text-[#a8c7fa]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Recent Chats</h3>
              <p className="text-xs text-[#8e918f]">
                {sessions.length} conversation{sessions.length === 1 ? '' : 's'} recorded in CodePilot AI
              </p>
            </div>
          </div>
          <button
            id="btn-close-recent-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#282a2c] text-[#8e918f] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar: New Chat & Search */}
        <div className="pt-3 pb-2 space-y-2.5">
          <div className="flex items-center gap-2">
            <button
              id="btn-recent-new-chat"
              onClick={() => {
                onNewChat();
                onClose();
              }}
              className="flex-1 py-2 px-3.5 rounded-xl bg-[#282a2c] hover:bg-[#333538] border border-[#333538] text-white text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#a8c7fa]" />
              <span>Start New Chat</span>
            </button>

            {sessions.length > 0 && (
              <button
                id="btn-clear-all-recent"
                onClick={() => {
                  if (confirm('Clear all recent chat history?')) {
                    onClearAllSessions();
                  }
                }}
                className="py-2 px-3 rounded-xl hover:bg-red-500/10 text-[#8e918f] hover:text-red-400 text-xs transition-colors cursor-pointer"
                title="Clear all recent history"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Search Box */}
          {sessions.length > 2 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#8e918f] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recent conversations..."
                className="w-full bg-[#111216] border border-[#333538] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#e3e3e3] placeholder-[#8e918f] focus:outline-none focus:border-[#a8c7fa]/60"
              />
            </div>
          )}
        </div>

        {/* List of Recent Conversations */}
        <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-1 custom-scrollbar">
          {filteredSessions.length === 0 ? (
            <div className="py-12 text-center text-[#8e918f]">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#a8c7fa]" />
              <p className="text-sm font-medium text-[#e3e3e3]">
                {searchQuery ? 'No matching conversations' : 'No recent chats yet'}
              </p>
              <p className="text-xs text-[#8e918f] mt-1 max-w-xs mx-auto">
                {searchQuery
                  ? 'Try a different keyword or start a new conversation.'
                  : 'Start talking with CodePilot AI to build a history of your queries and projects.'}
              </p>
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isCurrent = session.id === currentSessionId;
              return (
                <div
                  key={session.id}
                  className={`group relative rounded-xl border p-3 transition-all text-left flex items-start justify-between gap-3 ${
                    isCurrent
                      ? 'bg-[#282a2c] border-[#a8c7fa]/60 shadow-sm'
                      : 'bg-[#18191c] border-[#333538] hover:border-[#8e918f]/50 hover:bg-[#202226]'
                  }`}
                >
                  <button
                    onClick={() => {
                      onSelectSession(session.id);
                      onClose();
                    }}
                    className="flex-1 min-w-0 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white truncate">
                        {session.title}
                      </span>
                      {isCurrent && (
                        <span className="text-[9px] uppercase tracking-wider font-bold bg-[#a8c7fa]/20 text-[#a8c7fa] px-1.5 py-0.5 rounded">
                          Current
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-[#8e918f] line-clamp-1 mt-1 font-normal">
                      {session.preview || 'Empty conversation'}
                    </p>

                    <div className="flex items-center gap-3 mt-2 text-[10px] text-[#8e918f]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {session.updatedAt}
                      </span>
                      <span>•</span>
                      <span>{session.messages.length} messages</span>
                    </div>
                  </button>

                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    <button
                      onClick={() => {
                        onSelectSession(session.id);
                        onClose();
                      }}
                      className="p-1.5 rounded-lg hover:bg-[#282a2c] text-[#a8c7fa] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Open conversation"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-[#8e918f] hover:text-red-400 transition-colors cursor-pointer"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#333538] flex items-center justify-between text-[11px] text-[#8e918f]">
          <span>Saved locally in browser</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-[#282a2c] hover:bg-[#333538] text-white font-medium cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
