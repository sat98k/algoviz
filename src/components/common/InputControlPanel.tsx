import React, { useState } from 'react';
import { AlgorithmConfig } from '../../types/algorithm';
import { Dices, SlidersHorizontal, Play } from 'lucide-react';

interface InputControlPanelProps {
  config: AlgorithmConfig;
  currentInputs: Record<string, any>;
  onApplyInputs: (newInputs: Record<string, any>) => void;
}

export const InputControlPanel: React.FC<InputControlPanelProps> = ({
  config,
  currentInputs,
  onApplyInputs,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({ ...currentInputs });
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const handleInputChange = (name: string, value: any, type: string) => {
    let parsedVal = value;
    if (type === 'number') {
      parsedVal = parseFloat(value);
    } else if (type === 'array') {
      parsedVal = value
        .split(',')
        .map((s: string) => parseFloat(s.trim()))
        .filter((n: number) => !isNaN(n));
    }
    setFormData((prev) => ({ ...prev, [name]: parsedVal }));
    setActivePreset(null);
  };

  const handleRandomize = () => {
    const randomData = config.generateRandomInput();
    setFormData(randomData);
    setActivePreset(null);
    onApplyInputs(randomData);
  };

  const handlePresetSelect = (presetName: string, data: Record<string, any>) => {
    setFormData(data);
    setActivePreset(presetName);
    onApplyInputs(data);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyInputs(formData);
  };

  return (
    <div className="flex flex-col gap-4 p-5 bg-obsidian-900 border border-hairline">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-hairline">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-amber" />
          <h3 className="font-mono text-xs uppercase tracking-widest text-chalk-200">
            INPUT PARAMETERS & PRESETS
          </h3>
        </div>
        <button
          type="button"
          onClick={handleRandomize}
          className="flex items-center gap-1.5 px-3 py-1 bg-obsidian-850 hover:bg-obsidian-800 text-amber-glow border border-amber/30 text-xs font-mono transition-colors"
        >
          <Dices className="w-3.5 h-3.5 text-amber" /> RANDOMIZE
        </button>
      </div>

      {/* Preset Chips */}
      {config.presets && config.presets.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-chalk-500 mr-1">
            PRESETS:
          </span>
          {config.presets.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => handlePresetSelect(preset.name, preset.data)}
              className={`px-3 py-1 font-mono text-xs transition-all ${
                activePreset === preset.name
                  ? 'bg-amber text-obsidian-950 font-bold shadow-sm'
                  : 'bg-obsidian-950 hover:bg-obsidian-800 text-chalk-400 border border-hairline'
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      )}

      {/* Dynamic Input Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {config.inputSchema.map((field) => {
            const rawVal = formData[field.name];
            const displayVal = Array.isArray(rawVal) ? rawVal.join(', ') : rawVal ?? '';

            return (
              <div key={field.name} className="flex flex-col gap-1.5">
                <label className="font-mono text-xs text-chalk-300 flex items-center justify-between">
                  <span>{field.label}</span>
                  <span className="text-[10px] text-chalk-500 uppercase">{field.type}</span>
                </label>
                {field.type === 'select' ? (
                  <select
                    value={rawVal}
                    onChange={(e) => handleInputChange(field.name, e.target.value, field.type)}
                    className="px-3 py-2 bg-obsidian-950 border border-hairline text-xs font-mono text-chalk-200 focus:outline-none focus:border-amber"
                  >
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-obsidian-900 text-chalk-200">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type === 'number' ? 'number' : 'text'}
                    min={field.min}
                    max={field.max}
                    placeholder={field.placeholder}
                    value={displayVal}
                    onChange={(e) => handleInputChange(field.name, e.target.value, field.type)}
                    className="px-3 py-2 bg-obsidian-950 border border-hairline text-xs font-mono text-chalk-200 placeholder-chalk-600 focus:outline-none focus:border-amber"
                  />
                )}
                {field.helperText && (
                  <span className="font-mono text-[10px] text-chalk-500">{field.helperText}</span>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="submit"
          className="flex items-center justify-center gap-2 mt-2 px-4 py-2.5 bg-obsidian-800 hover:bg-obsidian-700 text-chalk-100 border border-hairline font-mono text-xs uppercase tracking-wider font-semibold transition-colors"
        >
          <Play className="w-3.5 h-3.5 text-amber fill-current" />
          <span>INITIALIZE & RUN SIMULATION</span>
        </button>
      </form>
    </div>
  );
};

