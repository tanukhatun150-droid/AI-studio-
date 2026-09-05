import React from 'react';
import { X, Sparkles, Check, Zap, Cpu, Compass } from 'lucide-react';
import { Model } from '../../types';

interface ModelPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  models: Model[];
  selectedModelId: string;
  onSelectModel: (model: Model) => void;
}

export function ModelPickerModal({
  isOpen,
  onClose,
  models,
  selectedModelId,
  onSelectModel,
}: ModelPickerModalProps) {
  if (!isOpen) return null;

  const getModelIcon = (id: string) => {
    switch (id) {
      case 'gemini':
        return <Sparkles className="w-4 h-4 text-[#a8c7fa]" />;
      case 'groq':
        return <Zap className="w-4 h-4 text-[#fbbc04]" />;
      case 'ollama':
        return <Cpu className="w-4 h-4 text-[#34a853]" />;
      case 'kimi':
        return <Compass className="w-4 h-4 text-[#a8c7fa]" />;
      default:
        return <Sparkles className="w-4 h-4 text-[#a8c7fa]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-[#1e1f20] border border-[#333538] rounded-2xl p-5 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Choose a model</h3>
            <p className="text-xs text-[#8e918f] mt-0.5">
              Select the intelligence engine for this chat session
            </p>
          </div>
          <button
            id="btn-close-model-picker"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[#282a2c] text-[#8e918f] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          {models.map((model) => {
            const isSelected = model.id === selectedModelId;
            return (
              <button
                key={model.id}
                id={`model-option-${model.id}`}
                onClick={() => {
                  onSelectModel(model);
                  onClose();
                }}
                className={`w-full min-h-[58px] rounded-[15px] flex items-center px-3 gap-3 text-left transition-all cursor-pointer active:scale-[0.98] ${
                  isSelected
                    ? 'bg-[#282a2c] ring-1 ring-[#a8c7fa]/60 shadow-sm'
                    : 'bg-[#282a2c]/70 hover:bg-[#282a2c] border border-transparent'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-[#a8c7fa] text-[#07111f]' : 'bg-[#1e1f20]'
                  }`}
                >
                  {getModelIcon(model.id)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium text-[#e3e3e3] truncate">
                    {model.name}
                  </div>
                  <div className="text-[11px] text-[#8e918f] mt-0.5 truncate">
                    {model.detail} • {model.provider}
                  </div>
                </div>

                {isSelected && (
                  <div className="w-[21px] h-[21px] rounded-full bg-[#a8c7fa] text-[#07111f] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-5 pt-3 border-t border-[#333538] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#282a2c] hover:bg-[#333538] text-xs font-semibold text-[#e3e3e3] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
