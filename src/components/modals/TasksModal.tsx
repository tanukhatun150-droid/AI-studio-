import React, { useState } from 'react';
import { X, PlayCircle, CheckCircle2, Circle, Plus } from 'lucide-react';
import { WorkspaceTask } from '../../types';

interface TasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: WorkspaceTask[];
  onToggleTaskItem: (taskId: string, itemId: string) => void;
  onAddTaskItem: (taskId: string, title: string) => void;
}

export function TasksModal({
  isOpen,
  onClose,
  tasks,
  onToggleTaskItem,
  onAddTaskItem,
}: TasksModalProps) {
  const [newItemTitle, setNewItemTitle] = useState('');

  if (!isOpen) return null;

  const currentTask = tasks[0];

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim() || !currentTask) return;
    onAddTaskItem(currentTask.id, newItemTitle.trim());
    setNewItemTitle('');
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
          <div>
            <h3 className="text-lg font-semibold text-white">Tasks</h3>
            <p className="text-xs text-[#8e918f] mt-0.5">
              {tasks.length} active workspace task
            </p>
          </div>
          <button
            id="btn-close-tasks-modal"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[#282a2c] text-[#8e918f] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {currentTask && (
          <div className="p-4 rounded-[16px] bg-[#282a2c] my-4 space-y-3">
            {/* Task Row (gap: 9, font-medium 14px, percent font-semibold 13px) */}
            <div className="flex items-center gap-[9px]">
              <PlayCircle className="w-[21px] h-[21px] text-[#a8c7fa] shrink-0" />
              <span className="flex-1 text-[14px] font-medium text-[#e3e3e3]">
                {currentTask.title}
              </span>
              <span className="text-[13px] font-semibold text-[#a8c7fa]">
                {currentTask.progress}%
              </span>
            </div>

            {/* Progress Track (height: 6, borderRadius: 3, marginVertical: 12) */}
            <div className="w-full h-[6px] rounded-[3px] bg-[#333538] overflow-hidden my-3">
              <div
                className="h-full rounded-[3px] bg-[#a8c7fa] transition-all duration-300"
                style={{ width: `${currentTask.progress}%` }}
              />
            </div>

            {/* Task Detail (fontSize: 12, lineHeight: 17) */}
            <p className="text-[12px] leading-[17px] text-[#8e918f]">
              {currentTask.detail}
            </p>

            {/* Task Checklist Items */}
            <div className="pt-2 border-t border-[#333538]/60 space-y-2">
              <div className="text-[10px] font-medium text-[#8e918f] uppercase tracking-wider">
                Milestones & Steps
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                {currentTask.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onToggleTaskItem(currentTask.id, item.id)}
                    className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#1e1f20] text-left transition-colors cursor-pointer group"
                  >
                    {item.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-[#34a853] shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-[#8e918f] group-hover:text-white shrink-0" />
                    )}
                    <span
                      className={`text-[12px] ${
                        item.completed
                          ? 'line-through text-[#8e918f]'
                          : 'text-[#e3e3e3] group-hover:text-white'
                      }`}
                    >
                      {item.title}
                    </span>
                  </button>
                ))}
              </div>

              {/* Add step form */}
              <form onSubmit={handleAddItem} className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  placeholder="Add a milestone..."
                  className="flex-1 px-3 py-1.5 rounded-lg bg-[#1e1f20] border border-[#333538] text-xs text-[#e3e3e3] placeholder-[#8e918f] focus:outline-none focus:border-[#a8c7fa]"
                />
                <button
                  type="submit"
                  disabled={!newItemTitle.trim()}
                  className="px-3 py-1.5 rounded-lg bg-[#333538] hover:bg-[#a8c7fa] text-[#e3e3e3] hover:text-[#07111f] transition-all text-xs font-medium cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Dialog Button (minHeight: 46, borderRadius: 23, fontSize: 14, font-semibold) */}
        <div className="mt-2">
          <button
            id="btn-done-tasks"
            onClick={onClose}
            className="w-full min-h-[46px] rounded-[23px] bg-[#a8c7fa] hover:bg-[#c2d7ff] text-[#07111f] font-semibold text-[14px] transition-all cursor-pointer flex items-center justify-center active:scale-[0.99] shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
