import React, { useState, useEffect } from 'react';
import {
  DEFAULT_TSP_CITY_NAMES,
  createDefaultCostMatrix,
  ensureSymmetricCostMatrix,
} from '../../algorithms/tsp';
import {
  SlidersHorizontal,
  Check,
  RotateCcw,
  Dices,
  AlertCircle,
  X,
  Sparkles,
} from 'lucide-react';

export interface TspPreset {
  name: string;
  description?: string;
  data: {
    numCities: number;
    costMatrix: number[][];
    cityNames?: string[];
  };
}

interface TspDistanceMatrixEditorProps {
  currentNumCities: number;
  currentCostMatrix: number[][];
  onApply: (newInputs: { numCities: number; costMatrix: number[][]; cityNames: string[] }) => void;
  onClose?: () => void;
  presets?: TspPreset[];
  inline?: boolean;
}

export const TspDistanceMatrixEditor: React.FC<TspDistanceMatrixEditorProps> = ({
  currentNumCities,
  currentCostMatrix,
  onApply,
  onClose,
  presets,
  inline = false,
}) => {
  const [numCities, setNumCities] = useState<number>(() =>
    Math.min(Math.max(currentNumCities || 4, 3), 6)
  );

  // Maintain local editable matrix state as string grid for seamless typing
  const [matrixText, setMatrixText] = useState<string[][]>(() => {
    const n = Math.min(Math.max(currentNumCities || 4, 3), 6);
    const valid = ensureSymmetricCostMatrix(currentCostMatrix, n);
    return valid.map((row) => row.map((val) => String(val)));
  });

  const [hoveredCell, setHoveredCell] = useState<{ r: number; c: number } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Sync state if current inputs change from external source
  useEffect(() => {
    const n = Math.min(Math.max(currentNumCities || 4, 3), 6);
    setNumCities(n);
    const valid = ensureSymmetricCostMatrix(currentCostMatrix, n);
    setMatrixText(valid.map((row) => row.map((val) => String(val))));
    setValidationError(null);
  }, [currentNumCities, currentCostMatrix]);

  // Handle City Count Change (3 to 6)
  const handleCityCountChange = (newCount: number) => {
    const targetN = Math.min(Math.max(newCount, 3), 6);
    if (targetN === numCities) return;

    setNumCities(targetN);
    setActivePreset(null);

    // Resize matrix preserving existing values
    setMatrixText((prev) => {
      const defaultForNew = createDefaultCostMatrix(targetN);
      const newGrid: string[][] = Array.from({ length: targetN }, () => Array(targetN).fill('0'));

      for (let r = 0; r < targetN; r++) {
        for (let c = 0; c < targetN; c++) {
          if (r === c) {
            newGrid[r][c] = '0';
          } else if (r < prev.length && c < (prev[r]?.length ?? 0)) {
            newGrid[r][c] = prev[r][c];
          } else {
            newGrid[r][c] = String(defaultForNew[r][c]);
          }
        }
      }
      return newGrid;
    });
    setValidationError(null);
  };

  // Handle single cell modification with symmetric pair synchronization
  const handleCellChange = (r: number, c: number, rawVal: string) => {
    if (r === c) return; // Diagonal is fixed at 0

    setActivePreset(null);
    setMatrixText((prev) => {
      const copy = prev.map((row) => [...row]);
      copy[r][c] = rawVal;
      copy[c][r] = rawVal; // Symmetric synchronization
      return copy;
    });

    // Validate on change
    validateMatrix(matrixText, r, c, rawVal);
  };

  // Validation function
  const validateMatrix = (
    grid: string[][],
    overrideR?: number,
    overrideC?: number,
    overrideVal?: string
  ): { valid: boolean; matrix: number[][] | null; error: string | null } => {
    const n = numCities;
    const numMatrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (r === c) {
          numMatrix[r][c] = 0;
          continue;
        }

        let strVal = grid[r]?.[c] ?? '';
        if (overrideR !== undefined && overrideC !== undefined) {
          if ((r === overrideR && c === overrideC) || (r === overrideC && c === overrideR)) {
            strVal = overrideVal!;
          }
        }

        strVal = strVal.trim();
        if (strVal === '') {
          const err = `Cell (${DEFAULT_TSP_CITY_NAMES[r]}, ${DEFAULT_TSP_CITY_NAMES[c]}) cannot be empty.`;
          setValidationError(err);
          return { valid: false, matrix: null, error: err };
        }

        const parsed = Number(strVal);
        if (isNaN(parsed) || !Number.isFinite(parsed)) {
          const err = `Distance between ${DEFAULT_TSP_CITY_NAMES[r]} and ${DEFAULT_TSP_CITY_NAMES[c]} must be a valid number.`;
          setValidationError(err);
          return { valid: false, matrix: null, error: err };
        }

        if (parsed <= 0) {
          const err = `Distance between ${DEFAULT_TSP_CITY_NAMES[r]} and ${DEFAULT_TSP_CITY_NAMES[c]} must be greater than 0.`;
          setValidationError(err);
          return { valid: false, matrix: null, error: err };
        }

        if (parsed > 999) {
          const err = `Distance between ${DEFAULT_TSP_CITY_NAMES[r]} and ${DEFAULT_TSP_CITY_NAMES[c]} must not exceed 999.`;
          setValidationError(err);
          return { valid: false, matrix: null, error: err };
        }

        numMatrix[r][c] = Math.round(parsed);
      }
    }

    setValidationError(null);
    return { valid: true, matrix: numMatrix, error: null };
  };

  // Handle Preset selection
  const handleSelectPreset = (preset: TspPreset) => {
    const targetN = Math.min(Math.max(preset.data.numCities || preset.data.costMatrix.length, 3), 6);
    const valid = ensureSymmetricCostMatrix(preset.data.costMatrix, targetN);
    setNumCities(targetN);
    setMatrixText(valid.map((row) => row.map((val) => String(val))));
    setActivePreset(preset.name);
    setValidationError(null);

    // Immediately trigger apply for presets
    onApply({
      numCities: targetN,
      costMatrix: valid,
      cityNames: preset.data.cityNames || DEFAULT_TSP_CITY_NAMES.slice(0, targetN),
    });
  };

  // Handle Randomize
  const handleRandomize = () => {
    const targetN = numCities;
    const randMatrix: number[][] = Array.from({ length: targetN }, () => Array(targetN).fill(0));
    for (let r = 0; r < targetN; r++) {
      for (let c = r + 1; c < targetN; c++) {
        const cost = Math.floor(Math.random() * 30) + 5;
        randMatrix[r][c] = cost;
        randMatrix[c][r] = cost;
      }
    }

    setMatrixText(randMatrix.map((row) => row.map((val) => String(val))));
    setActivePreset(null);
    setValidationError(null);

    onApply({
      numCities: targetN,
      costMatrix: randMatrix,
      cityNames: DEFAULT_TSP_CITY_NAMES.slice(0, targetN),
    });
  };

  // Handle Reset to Default
  const handleReset = () => {
    const def = createDefaultCostMatrix(numCities);
    setMatrixText(def.map((row) => row.map((val) => String(val))));
    setActivePreset(null);
    setValidationError(null);
    onApply({
      numCities,
      costMatrix: def,
      cityNames: DEFAULT_TSP_CITY_NAMES.slice(0, numCities),
    });
  };

  // Submit/Apply edited matrix
  const handleApply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const result = validateMatrix(matrixText);
    if (!result.valid || !result.matrix) return;

    onApply({
      numCities,
      costMatrix: result.matrix,
      cityNames: DEFAULT_TSP_CITY_NAMES.slice(0, numCities),
    });
  };

  const cities = DEFAULT_TSP_CITY_NAMES.slice(0, numCities);

  return (
    <div
      className={`flex flex-col w-full bg-obsidian-950 border border-hairline font-mono text-xs shadow-xl rounded-sm overflow-hidden ${
        inline ? '' : 'p-4'
      }`}
    >
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-hairline bg-obsidian-900/60 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber/15 border border-amber/30 text-amber-glow rounded">
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-chalk-100">
              User-Editable TSP Distance Matrix
            </h4>
            <p className="text-[10px] text-chalk-400">
              Symmetric costs c(i, j) = c(j, i). Driving graph, DP states, and tour solution.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRandomize}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-obsidian-900 hover:bg-obsidian-850 text-amber-glow border border-amber/30 text-[11px] font-mono rounded transition-colors"
            title="Generate random distances"
          >
            <Dices className="w-3.5 h-3.5 text-amber" />
            <span>Randomize</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-2 py-1 bg-obsidian-900 hover:bg-obsidian-850 text-chalk-300 border border-hairline text-[11px] font-mono rounded transition-colors"
            title="Reset to default textbook matrix"
          >
            <RotateCcw className="w-3 h-3 text-chalk-400" />
            <span>Reset</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-chalk-400 hover:text-chalk-100 hover:bg-obsidian-850 rounded transition-colors ml-1"
              title="Close editor"
              aria-label="Close editor"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-3.5 flex flex-col gap-4">
        {/* City count & Presets controls row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* City count selector */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-chalk-400 text-[11px] uppercase tracking-wider">
              Vertices (n):
            </span>
            <div className="flex items-center gap-1 bg-obsidian-900 p-0.5 border border-hairline rounded">
              {[3, 4, 5, 6].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => handleCityCountChange(count)}
                  className={`px-2.5 py-1 text-xs font-mono font-bold rounded transition-all ${
                    numCities === count
                      ? 'bg-amber text-obsidian-950 shadow-sm'
                      : 'text-chalk-400 hover:text-chalk-100 hover:bg-obsidian-800'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-chalk-500 font-normal">
              ({cities.join(', ')})
            </span>
          </div>

          {/* Preset Buttons */}
          {presets && presets.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-[10px] uppercase text-chalk-500 mr-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber" /> Presets:
              </span>
              {presets.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className={`px-2 py-0.5 text-[11px] font-mono rounded border transition-all ${
                    activePreset === p.name
                      ? 'bg-amber/20 border-amber text-amber-glow font-bold'
                      : 'bg-obsidian-900 hover:bg-obsidian-850 text-chalk-300 border-hairline'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Matrix Table */}
        <form onSubmit={handleApply} className="flex flex-col gap-3">
          <div className="overflow-x-auto p-1 bg-obsidian-900/40 border border-hairline rounded">
            <table className="border-collapse mx-auto">
              <thead>
                <tr>
                  <th className="p-1 text-[10px] text-chalk-500 font-normal border-b border-r border-hairline w-12 text-center">
                    From \ To
                  </th>
                  {cities.map((city, cIdx) => (
                    <th
                      key={city}
                      className={`p-2 font-mono font-bold text-xs uppercase border-b border-r border-hairline min-w-[58px] text-center transition-colors ${
                        hoveredCell && (hoveredCell.c === cIdx || hoveredCell.r === cIdx)
                          ? 'text-amber-glow bg-amber/15'
                          : 'text-chalk-200 bg-obsidian-900/80'
                      }`}
                    >
                      {city}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cities.map((rowCity, rIdx) => (
                  <tr key={rowCity}>
                    {/* Row Header */}
                    <th
                      className={`p-2 font-mono font-bold text-xs uppercase border-b border-r border-hairline text-center transition-colors ${
                        hoveredCell && (hoveredCell.r === rIdx || hoveredCell.c === rIdx)
                          ? 'text-amber-glow bg-amber/15'
                          : 'text-chalk-200 bg-obsidian-900/80'
                      }`}
                    >
                      {rowCity}
                    </th>

                    {/* Matrix Cells */}
                    {cities.map((colCity, cIdx) => {
                      const isDiagonal = rIdx === cIdx;
                      const valStr = matrixText[rIdx]?.[cIdx] ?? '';
                      const isCellHovered =
                        hoveredCell &&
                        ((hoveredCell.r === rIdx && hoveredCell.c === cIdx) ||
                          (hoveredCell.r === cIdx && hoveredCell.c === rIdx));

                      if (isDiagonal) {
                        return (
                          <td
                            key={`${rIdx}-${cIdx}`}
                            className="p-1 border-b border-r border-hairline bg-obsidian-950/70 text-center select-none"
                            title={`Distance from ${rowCity} to itself is 0`}
                          >
                            <span className="block w-full py-1.5 font-mono text-chalk-600 font-bold text-xs">
                              0
                            </span>
                          </td>
                        );
                      }

                      const numVal = Number(valStr);
                      const isCellInvalid =
                        valStr.trim() === '' || isNaN(numVal) || numVal <= 0 || numVal > 999;

                      return (
                        <td
                          key={`${rIdx}-${cIdx}`}
                          className={`p-1 border-b border-r border-hairline text-center transition-colors ${
                            isCellHovered ? 'bg-amber/20' : 'hover:bg-obsidian-900'
                          }`}
                          onMouseEnter={() => setHoveredCell({ r: rIdx, c: cIdx })}
                          onMouseLeave={() => setHoveredCell(null)}
                        >
                          <input
                            type="number"
                            min={1}
                            max={999}
                            value={valStr}
                            onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                            title={`Distance between ${rowCity} and ${colCity} (symmetric with ${colCity} to ${rowCity})`}
                            className={`w-full py-1.5 px-1 font-mono text-xs font-bold text-center rounded focus:outline-none transition-all ${
                              isCellInvalid
                                ? 'bg-rose-950/60 border border-rose-500 text-rose-200 focus:border-rose-400 animate-pulse'
                                : isCellHovered
                                ? 'bg-obsidian-950 border border-amber text-amber-glow focus:border-amber-glow'
                                : 'bg-obsidian-950/80 border border-hairline text-chalk-100 focus:border-amber hover:border-chalk-500'
                            }`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Validation Banner if error */}
          {validationError && (
            <div className="flex items-center gap-2 p-2 bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs rounded">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Apply & Synchronize Action Button */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="text-[11px] text-chalk-500">
              💡 Modifying any cell instantly syncs its symmetric partner.
            </span>

            <button
              type="submit"
              disabled={Boolean(validationError)}
              className={`flex items-center gap-2 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider rounded transition-all duration-150 ${
                validationError
                  ? 'bg-obsidian-900 border border-hairline text-chalk-600 cursor-not-allowed'
                  : 'bg-amber text-obsidian-950 hover:bg-amber/90 active:scale-95 shadow-md font-extrabold'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>APPLY DISTANCES & RECOMPUTE</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
