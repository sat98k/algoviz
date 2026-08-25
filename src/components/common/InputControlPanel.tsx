import React, { useState } from 'react';
import { AlgorithmConfig } from '../../types/algorithm';
import { Dices, Sliders, PlayCircle } from 'lucide-react';

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
    <div className="flex flex-col gap-4 p-4 bg-slate-900/90 border border-slate-800 rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Input Controls & Presets
          </h3>
        </div>
        <button
          type="button"
          onClick={handleRandomize}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40 rounded-lg text-xs font-medium transition-colors"
        >
          <Dices className="w-3.5 h-3.5" /> Randomize Input
        </button>
      </div>

      {/* Preset Buttons */}
      {config.presets && config.presets.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Presets:</span>
          {config.presets.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => handlePresetSelect(preset.name, preset.data)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                activePreset === preset.name
                  ? 'bg-sky-500 text-white shadow'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      )}

      {/* Dynamic Input Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {config.inputSchema.map((field) => {
            const rawVal = formData[field.name];
            const displayVal = Array.isArray(rawVal) ? rawVal.join(', ') : rawVal ?? '';

            return (
              <div key={field.name} className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-300 font-mono">
                  {field.label}
                </label>
                {field.type === 'select' ? (
                  <select
                    value={rawVal}
                    onChange={(e) => handleInputChange(field.name, e.target.value, field.type)}
                    className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
                  >
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
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
                    className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500"
                  />
                )}
                {field.helperText && (
                  <span className="text-[10px] text-slate-500">{field.helperText}</span>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="submit"
          className="flex items-center justify-center gap-2 mt-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/30 rounded-lg text-xs font-semibold transition-colors"
        >
          <PlayCircle className="w-4 h-4" /> Load & Run Visualization
        </button>
      </form>
    </div>
  );
};
