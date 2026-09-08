import React, { useState } from 'react';
import { X, PlayCircle, CheckCircle2, Circle, Plus, Trash2, CheckSquare } from 'lucide-react';
import { WorkspaceTask } from '../../types';

interface TasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: WorkspaceTask[];
  onToggleTaskItem: (taskId: string, itemId: string) => void;
  onAddTaskItem: (taskId: string, title: string) => void;
  onAddNewTask?: (title: string, detail?: string) => void;
  onDeleteTask?: (taskId: string) => void;
}

export function TasksModal({
  isOpen,
  onClose,
  tasks,
  onToggleTaskItem,
  onAddTaskItem,
  onAddNewTask,
  onDeleteTask,
}: TasksModalProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string>(() => tasks[0]?.id || '');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDetail, setNewTaskDetail] = useState('');

  if (!isOpen) return null;

  const currentTask = tasks.find((t) => t.id === selectedTaskId) || tasks[0];

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim() || !currentTask) return;
    onAddTaskItem(currentTask.id, newItemTitle.trim());
    setNewItemTitle('');
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !onAddNewTask) return;
    onAddNewTask(newTaskTitle.trim(), newTaskDetail.trim());
    setNewTaskTitle('');
    setNewTaskDetail('');
    setIsCreatingTask(false);
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
      <div className="relative w-full max-w-lg bg-[#1e1f20] border border-[#333538] rounded-2xl p-5 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between mb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#282a2c] flex items-center justify-center text-[#a8c7fa]">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Workspace Tasks</h3>
              <p className="text-xs text-[#8e918f]">
                {tasks.length} active project milestones & development tasks
              </p>
            </div>
          </div>
          <button
            id="btn-close-tasks-modal"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[#282a2c] text-[#8e918f] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Task Tabs Pill Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1.5 scrollbar-none shrink-0 border-b border-[#333538]/60 mb-3">
          {tasks.map((task) => {
            const isSelected = task.id === (currentTask?.id || '');
            return (
              <button
                key={task.id}
                onClick={() => setSelectedTaskId(task.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-[#a8c7fa] text-[#07111f] shadow-sm font-semibold'
                    : 'bg-[#282a2c] text-[#8e918f] hover:text-[#e3e3e3] hover:bg-[#333538]'
                }`}
              >
                <span>{task.title.length > 20 ? `${task.title.slice(0, 20)}...` : task.title}</span>
                <span className={`text-[10px] px-1 rounded-full ${isSelected ? 'bg-black/20 text-[#07111f]' : 'bg-black/40 text-[#a8c7fa]'}`}>
                  {task.progress}%
                </span>
              </button>
            );
          })}
          {onAddNewTask && (
            <button
              onClick={() => setIsCreatingTask(!isCreatingTask)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-[#282a2c] hover:bg-[#333538] text-[#a8c7fa] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              title="Add new task"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          )}
        </div>

        {/* Create Task Inline Form */}
        {isCreatingTask && onAddNewTask && (
          <form onSubmit={handleCreateTask} className="p-3 rounded-xl bg-[#282a2c] border border-[#333538] mb-3 space-y-2 shrink-0 animate-in fade-in duration-150">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Task title (e.g. Add payment gateway)..."
              className="w-full px-3 py-1.5 rounded-lg bg-[#1e1f20] border border-[#333538] text-xs text-white placeholder-[#8e918f] focus:outline-none focus:border-[#a8c7fa]"
              autoFocus
            />
            <input
              type="text"
              value={newTaskDetail}
              onChange={(e) => setNewTaskDetail(e.target.value)}
              placeholder="Optional detail/description..."
              className="w-full px-3 py-1.5 rounded-lg bg-[#1e1f20] border border-[#333538] text-xs text-white placeholder-[#8e918f] focus:outline-none focus:border-[#a8c7fa]"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCreatingTask(false)}
                className="px-3 py-1 rounded-lg text-xs text-[#8e918f] hover:text-white hover:bg-[#1e1f20] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newTaskTitle.trim()}
                className="px-3 py-1 rounded-lg bg-[#a8c7fa] text-[#07111f] font-semibold text-xs disabled:opacity-50 transition-colors"
              >
                Add Task
              </button>
            </div>
          </form>
        )}

        {/* Selected Task Details */}
        <div className="overflow-y-auto flex-1 pr-1 custom-scrollbar">
          {currentTask ? (
            <div className="p-4 rounded-[16px] bg-[#282a2c] space-y-3">
              <div className="flex items-center gap-[9px]">
                <PlayCircle className="w-[21px] h-[21px] text-[#a8c7fa] shrink-0" />
                <span className="flex-1 text-[14px] font-medium text-[#e3e3e3]">
                  {currentTask.title}
                </span>
                <span className="text-[13px] font-semibold text-[#a8c7fa]">
                  {currentTask.progress}%
                </span>
                {onDeleteTask && tasks.length > 1 && (
                  <button
                    onClick={() => onDeleteTask(currentTask.id)}
                    className="p-1 rounded-lg text-[#8e918f] hover:text-[#f28b82] hover:bg-[#1e1f20] transition-colors ml-1"
                    title="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Progress Track */}
              <div className="w-full h-[6px] rounded-[3px] bg-[#333538] overflow-hidden my-2">
                <div
                  className="h-full rounded-[3px] bg-[#a8c7fa] transition-all duration-300"
                  style={{ width: `${currentTask.progress}%` }}
                />
              </div>

              {/* Task Detail */}
              {currentTask.detail && (
                <p className="text-[12px] leading-[17px] text-[#8e918f]">
                  {currentTask.detail}
                </p>
              )}

              {/* Task Checklist Items */}
              <div className="pt-2 border-t border-[#333538]/60 space-y-2">
                <div className="text-[10px] font-medium text-[#8e918f] uppercase tracking-wider">
                  Milestones ({currentTask.items.filter(i => i.completed).length}/{currentTask.items.length})
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
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
                  {currentTask.items.length === 0 && (
                    <p className="text-xs text-[#8e918f] italic py-2">No milestones added yet. Add one below!</p>
                  )}
                </div>

                {/* Add step form */}
                <form onSubmit={handleAddItem} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                    placeholder="Add a milestone step..."
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
          ) : (
            <div className="py-8 text-center text-[#8e918f] text-sm">
              No tasks found. Click "New" to create your first task.
            </div>
          )}
        </div>

        {/* Dialog Button */}
        <div className="mt-3 pt-2 border-t border-[#333538] shrink-0">
          <button
            id="btn-done-tasks"
            onClick={onClose}
            className="w-full min-h-[44px] rounded-[22px] bg-[#a8c7fa] hover:bg-[#c2d7ff] text-[#07111f] font-semibold text-[14px] transition-all cursor-pointer flex items-center justify-center active:scale-[0.99] shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
