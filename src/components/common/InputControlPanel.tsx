import React, { useEffect, useMemo, useReducer, useState } from 'react';
import { AlgorithmConfig, InputFieldDefinition } from '../../types/algorithm';
import { Dices, SlidersHorizontal, Play, Plus, Trash2, AlertCircle } from 'lucide-react';
import { initFormState, inputFormReducer, isDirty, validateForm } from '../../utils/inputForm';

interface InputControlPanelProps {
  config: AlgorithmConfig;
  currentInputs: Record<string, any>;
  onApplyInputs: (newInputs: Record<string, any>) => void;
}

const inputClass = (invalid: boolean) =>
  `px-3 py-2 bg-obsidian-950 border text-xs font-mono text-chalk-100 placeholder:text-chalk-400 focus:outline-none ${
    invalid ? 'border-rose-500/70 focus:border-rose-400' : 'border-hairline focus:border-amber'
  }`;

/** Short format hint for list fields, built from the field's own constraints. */
const listHint = (f: InputFieldDefinition) => {
  const parts = ['Separate values with commas'];
  if (f.integer) parts.push('whole numbers');
  if (f.positive) parts.push('greater than 0');
  else if (f.itemMin !== undefined) parts.push(`at least ${f.itemMin}`);
  if (f.minLength && f.maxLength) parts.push(`${f.minLength}–${f.maxLength} values`);
  else if (f.maxLength) parts.push(`up to ${f.maxLength} values`);
  return parts.join(' · ');
};

export const InputControlPanel: React.FC<InputControlPanelProps> = ({ config, currentInputs, onApplyInputs }) => {
  const [state, dispatch] = useReducer(inputFormReducer, undefined, () => initFormState(config, currentInputs));
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Applied inputs changed (Run, preset, randomize, or a different algorithm): start from them again.
  useEffect(() => {
    dispatch({ type: 'reset', config, inputs: currentInputs });
  }, [config, currentInputs]);

  const validation = useMemo(() => validateForm(config, state), [config, state]);
  const dirty = isDirty(state);
  const editableFields = config.inputSchema;
  const showError = (name: string) => (state.touched[name] || state.submitted) && validation.errors[name];

  const applyTrusted = (data: Record<string, any>) => onApplyInputs({ ...currentInputs, ...data });

  const handleRandomize = () => {
    setActivePreset(null);
    applyTrusted(config.generateRandomInput());
  };

  const handlePresetSelect = (presetName: string, data: Record<string, any>) => {
    setActivePreset(presetName);
    applyTrusted(data);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validation.valid) {
      dispatch({ type: 'submitAttempt' });
      return;
    }
    setActivePreset(null);
    onApplyInputs(validation.values);
  };

  const handleMatrixCellChange = (fieldName: string, r: number, c: number, val: string) => {
    if (r === c) return;
    const mat = state.other[fieldName];
    if (!Array.isArray(mat)) return;
    const num = parseFloat(val);
    const validNum = isNaN(num) ? 0 : Math.max(0, Math.round(num));
    const copy = mat.map((row: any[]) => [...row]);
    copy[r][c] = validNum;
    copy[c][r] = validNum; // Symmetric update
    dispatch({ type: 'setOther', name: fieldName, value: copy });
  };

  const errorId = (name: string) => `${config.id}-${name}-error`;

  const renderError = (name: string) =>
    showError(name) ? (
      <span id={errorId(name)} className="flex items-start gap-1 font-mono text-[11px] text-rose-400">
        <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
        {validation.errors[name]}
      </span>
    ) : null;

  const renderField = (field: InputFieldDefinition) => {
    const id = `${config.id}-${field.name}`;
    const invalid = !!showError(field.name);
    const describedBy = invalid ? errorId(field.name) : undefined;

    if (field.type === 'select') {
      return (
        <select
          id={id}
          value={state.other[field.name] ?? ''}
          onChange={(e) => dispatch({ type: 'setOther', name: field.name, value: e.target.value })}
          className="px-3 py-2 bg-obsidian-950 border border-hairline text-xs font-mono text-chalk-200 focus:outline-none focus:border-amber"
        >
          {field.options?.map((opt) => (
            <option key={String(opt.value)} value={opt.value} className="bg-obsidian-900 text-chalk-200">
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    if (field.type === 'matrix') {
      const rawVal = state.other[field.name];
      return (
        <div className="flex flex-col gap-2 p-3 bg-obsidian-950 border border-hairline rounded overflow-x-auto">
          {Array.isArray(rawVal) && rawVal.length > 0 ? (
            <table className="border-collapse mx-auto text-center font-mono text-xs">
              <thead>
                <tr>
                  <th className="p-1 text-[10px] text-chalk-500 font-normal border-b border-r border-hairline w-10">\</th>
                  {rawVal.map((_: any, cIdx: number) => (
                    <th key={cIdx} className="p-1.5 font-bold text-xs uppercase border-b border-r border-hairline min-w-[50px] text-chalk-200 bg-obsidian-900/80">
                      {String.fromCharCode(65 + cIdx)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rawVal.map((row: any[], rIdx: number) => (
                  <tr key={rIdx}>
                    <th className="p-1.5 font-bold text-xs uppercase border-b border-r border-hairline text-chalk-200 bg-obsidian-900/80">
                      {String.fromCharCode(65 + rIdx)}
                    </th>
                    {row.map((cellVal: any, cIdx: number) =>
                      rIdx === cIdx ? (
                        <td key={cIdx} className="p-1 border-b border-r border-hairline bg-obsidian-950/70 text-chalk-600 font-bold" title="Diagonal distance is 0">
                          0
                        </td>
                      ) : (
                        <td key={cIdx} className="p-1 border-b border-r border-hairline">
                          <input
                            type="number"
                            min={0}
                            max={999}
                            value={cellVal ?? ''}
                            onChange={(e) => handleMatrixCellChange(field.name, rIdx, cIdx, e.target.value)}
                            aria-label={`Distance between ${String.fromCharCode(65 + rIdx)} and ${String.fromCharCode(65 + cIdx)}`}
                            className="w-14 py-1 px-1 text-center font-mono text-xs font-bold bg-obsidian-900 border border-hairline text-chalk-100 focus:outline-none focus:border-amber hover:border-chalk-500 rounded"
                          />
                        </td>
                      )
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <span className="text-chalk-500 text-xs">No matrix data available</span>
          )}
        </div>
      );
    }

    if (field.type === 'points') {
      const rows = state.points[field.name] ?? [];
      return (
        <div
          className={`flex flex-col gap-2 p-3 bg-obsidian-950 border ${invalid ? 'border-rose-500/70' : 'border-hairline'}`}
          onBlur={() => dispatch({ type: 'blur', name: field.name })}
          aria-describedby={describedBy}
        >
          <div className="grid grid-cols-[2.5rem_1fr_1fr_2rem] gap-2 font-mono text-[10px] uppercase tracking-wider text-chalk-500">
            <span>Point</span>
            <span>x</span>
            <span>y</span>
            <span className="sr-only">Remove</span>
          </div>
          <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
            {rows.map((row, i) => (
              <div key={i} className="grid grid-cols-[2.5rem_1fr_1fr_2rem] gap-2 items-center">
                <span className="font-mono text-xs text-chalk-400">P{i}</span>
                {(['x', 'y'] as const).map((axis) => (
                  <input
                    key={axis}
                    type="text"
                    inputMode="decimal"
                    value={row[axis]}
                    aria-label={`Point P${i} ${axis} coordinate`}
                    onChange={(e) => dispatch({ type: 'editPoint', name: field.name, index: i, axis, raw: e.target.value })}
                    className={inputClass(false)}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'removePoint', name: field.name, index: i })}
                  aria-label={`Remove point P${i}`}
                  className="p-1.5 text-chalk-400 hover:text-rose-400 border border-hairline hover:border-rose-500/50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => dispatch({ type: 'addPoint', name: field.name })}
            disabled={field.maxLength !== undefined && rows.length >= field.maxLength}
            className="self-start flex items-center gap-1.5 px-3 py-1 bg-obsidian-900 hover:bg-obsidian-850 text-chalk-200 border border-hairline text-xs font-mono disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5 text-amber" /> Add point
          </button>
        </div>
      );
    }

    // number, text, array: raw text is kept exactly as typed until Run.
    return (
      <input
        id={id}
        type="text"
        inputMode={field.type === 'number' ? 'decimal' : undefined}
        placeholder={field.placeholder}
        value={state.drafts[field.name] ?? ''}
        onChange={(e) => dispatch({ type: 'edit', name: field.name, raw: e.target.value })}
        onBlur={() => dispatch({ type: 'blur', name: field.name })}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className={inputClass(invalid)}
      />
    );
  };

  return (
    <div className="flex flex-col gap-4 p-5 bg-obsidian-900 border border-hairline">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-hairline">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-amber" />
          <h3 className="font-mono text-xs uppercase tracking-widest text-chalk-200">Input &amp; presets</h3>
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
          <span className="font-mono text-[10px] uppercase tracking-wider text-chalk-500 mr-1">PRESETS:</span>
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

      {editableFields.length === 0 ? (
        <p className="font-sans text-xs text-chalk-400 leading-relaxed">
          This graph can’t be edited here yet. Choose one of the presets above, or press Randomize where available.
        </p>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 pt-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {editableFields.map((field) => (
              <div
                key={field.name}
                className={`flex flex-col gap-1.5 ${field.type === 'matrix' || field.type === 'points' ? 'md:col-span-2' : ''}`}
              >
                <label htmlFor={`${config.id}-${field.name}`} className="font-mono text-xs text-chalk-300 flex items-center justify-between">
                  <span>{field.label}</span>
                  <span className="text-[10px] text-chalk-500 uppercase">{field.type === 'array' ? 'list' : field.type}</span>
                </label>
                {renderField(field)}
                {renderError(field.name)}
                {!showError(field.name) && (field.helperText || field.type === 'array') && (
                  <span className="font-mono text-[10px] text-chalk-500">
                    {field.helperText ?? ''}
                    {field.type === 'array' && (field.helperText ? ' · ' : '') + listHint(field)}
                  </span>
                )}
              </div>
            ))}
          </div>

          {state.submitted && validation.formError && (
            <p role="alert" className="flex items-start gap-1.5 p-2.5 border border-rose-500/40 bg-rose-500/10 font-mono text-xs text-rose-400">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              {validation.formError}
            </p>
          )}
          {state.submitted && !validation.valid && !validation.formError && (
            <p role="alert" className="font-mono text-xs text-rose-400">
              Fix the highlighted fields to run the algorithm. The visualization still shows the last valid input.
            </p>
          )}
          {dirty && !state.submitted && (
            <p className="font-mono text-[11px] text-amber-glow">You have unapplied changes. Press Run to update the visualization.</p>
          )}

          <button
            type="submit"
            className="flex items-center justify-center gap-2 mt-1 px-4 py-2.5 bg-obsidian-800 hover:bg-obsidian-700 text-chalk-100 border border-hairline font-mono text-xs uppercase tracking-wider font-semibold transition-colors"
          >
            <Play className="w-3.5 h-3.5 text-amber fill-current" />
            <span>Run with these inputs</span>
          </button>
        </form>
      )}
    </div>
  );
};
