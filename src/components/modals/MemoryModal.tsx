import React, { useState } from 'react';
import { X, BookOpen, Plus, Trash2 } from 'lucide-react';
import { MemoryItem } from '../../types';

interface MemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memories: MemoryItem[];
  onAddMemory: (key: string, value: string) => void;
  onDeleteMemory: (id: string) => void;
}

export function MemoryModal({
  isOpen,
  onClose,
  memories,
  onAddMemory,
  onDeleteMemory,
}: MemoryModalProps) {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;
    onAddMemory(newKey.trim(), newValue.trim());
    setNewKey('');
    setNewValue('');
    setIsAdding(false);
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
      <div className="relative w-full max-w-lg bg-[#1e1f20] border border-[#333538] rounded-2xl p-5 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#282a2c] flex items-center justify-center text-[#a8c7fa]">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Project memory</h3>
              <p className="text-xs text-[#8e918f]">
                Context and preferences the agent references during builds
              </p>
            </div>
          </div>
          <button
            id="btn-close-memory-modal"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[#282a2c] text-[#8e918f] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Memory list */}
        <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
          {memories.map((mem) => (
            <div
              key={mem.id}
              className="p-3 rounded-xl bg-[#282a2c] border border-[#333538] flex items-start justify-between gap-3 group hover:border-[#8e918f]/40 transition-colors"
            >
              <div className="min-w-0">
                <span className="text-[10px] font-bold tracking-wider uppercase text-[#a8c7fa] block mb-0.5">
                  {mem.key}
                </span>
                <p className="text-xs text-[#e3e3e3] leading-relaxed break-words">{mem.value}</p>
              </div>
              <button
                onClick={() => onDeleteMemory(mem.id)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#1e1f20] text-[#8e918f] hover:text-red-400 rounded transition-all cursor-pointer"
                title="Delete memory"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Add Memory Section */}
        {isAdding ? (
          <form onSubmit={handleAdd} className="mt-3 p-3 rounded-xl bg-[#18191c] border border-[#333538] space-y-2">
            <input
              type="text"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="Topic or Label (e.g. Styling rules)"
              className="w-full px-3 py-1.5 rounded-lg bg-[#282a2c] border border-[#333538] text-xs text-white placeholder-[#8e918f] focus:outline-none focus:border-[#a8c7fa]"
            />
            <textarea
              rows={2}
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Information the agent should always remember..."
              className="w-full px-3 py-1.5 rounded-lg bg-[#282a2c] border border-[#333538] text-xs text-white placeholder-[#8e918f] focus:outline-none focus:border-[#a8c7fa] resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1 rounded-lg bg-[#282a2c] text-xs text-[#8e918f] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 rounded-lg bg-[#a8c7fa] text-[#07111f] font-semibold text-xs hover:bg-[#c2d7ff]"
              >
                Save
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="mt-3 w-full py-2 rounded-xl border border-dashed border-[#333538] hover:border-[#a8c7fa]/50 text-xs text-[#8e918f] hover:text-[#a8c7fa] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add context memory</span>
          </button>
        )}

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#282a2c] hover:bg-[#333538] text-[#e3e3e3] font-semibold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
