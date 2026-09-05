import React from 'react';
import { AlgorithmStep } from '../../types/algorithm';
import { AssemblyLineState } from '../../algorithms/assemblyLineScheduling';
import { ArrowRight, Factory } from 'lucide-react';

interface AssemblyLineVisualizerProps {
  step: AlgorithmStep;
}

export const AssemblyLineVisualizer: React.FC<AssemblyLineVisualizerProps> = ({ step }) => {
  const state = (step.state || {}) as AssemblyLineState;
  const n = state.numStations || 6;
  const a1 = state.a1 || [];
  const a2 = state.a2 || [];
  const t1 = state.t1 || [];
  const t2 = state.t2 || [];
  const e1 = state.e1 ?? 2;
  const e2 = state.e2 ?? 4;
  const x1 = state.x1 ?? 3;
  const x2 = state.x2 ?? 2;
  const f1 = state.f1 || [];
  const f2 = state.f2 || [];
  const optimalPath = state.optimalPath || [];
  const activeSegments = state.activeSegments || [];
  const minTotalTime = state.minTotalTime;
  const winningLine = state.winningLine;

  const svgWidth = 920;
  const svgHeight = 340;
  const startX = 130;
  const endX = svgWidth - 130;
  const stationSpacing = (endX - startX) / Math.max(n - 1, 1);

  const line1Y = 100;
  const line2Y = 220;
  const radius = 24;

  const isStationOnPath = (line: 1 | 2, stationIdx: number) => {
    return optimalPath.some((p) => p.line === line && p.station === stationIdx + 1);
  };

  const isSegmentOnPath = (fromStation: number, fromLine: 1 | 2, toStation: number, toLine: 1 | 2) => {
    return activeSegments.some(
      (s) =>
        s.fromStation === fromStation &&
        s.fromLine === fromLine &&
        s.toStation === toStation &&
        s.toLine === toLine
    );
  };

  return (
    <div className="flex flex-col items-center w-full min-h-[440px] p-4 sm:p-6 bg-obsidian-900 border border-hairline transition-all gap-4">
      {/* Top Banner: Status & Optimal Cost */}
      <div className="w-full max-w-5xl flex flex-col gap-2 p-4 bg-obsidian-950 border border-hairline font-mono text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-2">
          <div className="flex items-center gap-2 text-amber-glow">
            <Factory className="w-4 h-4 text-amber" />
            <span className="font-semibold uppercase tracking-wider">{step.title}</span>
          </div>
          {minTotalTime !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-chalk-500 uppercase text-[10px]">Optimal Total Time:</span>
              <span className="text-acid-500 font-bold text-sm">{minTotalTime}</span>
              {winningLine && (
                <span className="text-[10px] text-chalk-400 font-mono">(via Exit Line {winningLine})</span>
              )}
            </div>
          )}
        </div>

        {/* Narrative Callout */}
        {state.formulaExplanation && (
          <div className="text-amber-glow text-xs flex items-center gap-2">
            <span className="text-chalk-500 uppercase font-semibold">[ DP STATE ]:</span>
            <span>{state.formulaExplanation}</span>
          </div>
        )}

        {/* Reconstructed Path Banner */}
        {optimalPath.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-xs pt-1 border-t border-hairline">
            <span className="text-chalk-500 uppercase text-[10px]">Optimal Route:</span>
            <div className="flex flex-wrap items-center gap-1.5 font-bold">
              {optimalPath.map((p, idx) => (
                <React.Fragment key={idx}>
                  <span className="px-2 py-0.5 bg-acid-500/15 border border-acid-500 text-acid-500">
                    Line {p.line} : S{p.station}
                  </span>
                  {idx < optimalPath.length - 1 && (
                    <ArrowRight className="w-3 h-3 text-chalk-500" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SVG Canvas for Assembly Lines */}
      <div className="w-full max-w-5xl bg-obsidian-950 border border-hairline p-2 sm:p-4 flex items-center justify-center overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto max-h-[360px] font-mono select-none"
        >
          <defs>
            {/* Arrow Markers */}
            <marker id="arrow-default" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748B" />
            </marker>
            <marker id="arrow-active" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#10B981" />
            </marker>
            <marker id="arrow-amber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#F59E0B" />
            </marker>
          </defs>

          {/* Line Labels */}
          <text x={35} y={line1Y + 5} fill="#F59E0B" fontSize="12" fontWeight="bold">LINE 1</text>
          <text x={35} y={line2Y + 5} fill="#06B6D4" fontSize="12" fontWeight="bold">LINE 2</text>

          {/* Entry Arrows */}
          <line
            x1={80}
            y1={line1Y}
            x2={startX - radius}
            y2={line1Y}
            stroke={isStationOnPath(1, 0) ? '#10B981' : '#64748B'}
            strokeWidth={isStationOnPath(1, 0) ? 2.5 : 1.5}
            markerEnd={isStationOnPath(1, 0) ? 'url(#arrow-active)' : 'url(#arrow-default)'}
          />
          <text x={95} y={line1Y - 8} fill="#94A3B8" fontSize="10">e1={e1}</text>

          <line
            x1={80}
            y1={line2Y}
            x2={startX - radius}
            y2={line2Y}
            stroke={isStationOnPath(2, 0) ? '#10B981' : '#64748B'}
            strokeWidth={isStationOnPath(2, 0) ? 2.5 : 1.5}
            markerEnd={isStationOnPath(2, 0) ? 'url(#arrow-active)' : 'url(#arrow-default)'}
          />
          <text x={95} y={line2Y + 18} fill="#94A3B8" fontSize="10">e2={e2}</text>

          {/* Exit Arrows */}
          <line
            x1={endX + radius}
            y1={line1Y}
            x2={svgWidth - 60}
            y2={line1Y}
            stroke={winningLine === 1 && optimalPath.length > 0 ? '#10B981' : '#64748B'}
            strokeWidth={winningLine === 1 && optimalPath.length > 0 ? 2.5 : 1.5}
            markerEnd={winningLine === 1 && optimalPath.length > 0 ? 'url(#arrow-active)' : 'url(#arrow-default)'}
          />
          <text x={endX + 40} y={line1Y - 8} fill="#94A3B8" fontSize="10">x1={x1}</text>

          <line
            x1={endX + radius}
            y1={line2Y}
            x2={svgWidth - 60}
            y2={line2Y}
            stroke={winningLine === 2 && optimalPath.length > 0 ? '#10B981' : '#64748B'}
            strokeWidth={winningLine === 2 && optimalPath.length > 0 ? 2.5 : 1.5}
            markerEnd={winningLine === 2 && optimalPath.length > 0 ? 'url(#arrow-active)' : 'url(#arrow-default)'}
          />
          <text x={endX + 40} y={line2Y + 18} fill="#94A3B8" fontSize="10">x2={x2}</text>

          {/* Station Connections (Horizontal and Diagonal Crossing Transfers) */}
          {Array.from({ length: n - 1 }, (_, idx) => {
            const x1Pos = startX + idx * stationSpacing + radius;
            const x2Pos = startX + (idx + 1) * stationSpacing - radius;
            const midX = (x1Pos + x2Pos) / 2;

            const isHoriz1OnPath = isSegmentOnPath(idx + 1, 1, idx + 2, 1);
            const isHoriz2OnPath = isSegmentOnPath(idx + 1, 2, idx + 2, 2);
            const isDiag1to2OnPath = isSegmentOnPath(idx + 1, 1, idx + 2, 2);
            const isDiag2to1OnPath = isSegmentOnPath(idx + 1, 2, idx + 2, 1);

            return (
              <g key={`conn-${idx}`}>
                {/* Horizontal Line 1 -> Line 1 */}
                <line
                  x1={x1Pos}
                  y1={line1Y}
                  x2={x2Pos}
                  y2={line1Y}
                  stroke={isHoriz1OnPath ? '#10B981' : '#334155'}
                  strokeWidth={isHoriz1OnPath ? 2.8 : 1.5}
                  markerEnd={isHoriz1OnPath ? 'url(#arrow-active)' : 'url(#arrow-default)'}
                />

                {/* Horizontal Line 2 -> Line 2 */}
                <line
                  x1={x1Pos}
                  y1={line2Y}
                  x2={x2Pos}
                  y2={line2Y}
                  stroke={isHoriz2OnPath ? '#10B981' : '#334155'}
                  strokeWidth={isHoriz2OnPath ? 2.8 : 1.5}
                  markerEnd={isHoriz2OnPath ? 'url(#arrow-active)' : 'url(#arrow-default)'}
                />

                {/* Diagonal Line 1 -> Line 2 */}
                <line
                  x1={x1Pos - 4}
                  y1={line1Y + 16}
                  x2={x2Pos + 4}
                  y2={line2Y - 16}
                  stroke={isDiag1to2OnPath ? '#10B981' : '#475569'}
                  strokeWidth={isDiag1to2OnPath ? 2.8 : 1.2}
                  strokeDasharray={isDiag1to2OnPath ? undefined : '3 2'}
                  markerEnd={isDiag1to2OnPath ? 'url(#arrow-active)' : 'url(#arrow-default)'}
                />
                <text x={midX - 10} y={(line1Y + line2Y) / 2 - 8} fill="#94A3B8" fontSize="9" textAnchor="middle">
                  t1={t1[idx]}
                </text>

                {/* Diagonal Line 2 -> Line 1 */}
                <line
                  x1={x1Pos - 4}
                  y1={line2Y - 16}
                  x2={x2Pos + 4}
                  y2={line1Y + 16}
                  stroke={isDiag2to1OnPath ? '#10B981' : '#475569'}
                  strokeWidth={isDiag2to1OnPath ? 2.8 : 1.2}
                  strokeDasharray={isDiag2to1OnPath ? undefined : '3 2'}
                  markerEnd={isDiag2to1OnPath ? 'url(#arrow-active)' : 'url(#arrow-default)'}
                />
                <text x={midX + 10} y={(line1Y + line2Y) / 2 + 16} fill="#94A3B8" fontSize="9" textAnchor="middle">
                  t2={t2[idx]}
                </text>
              </g>
            );
          })}

          {/* Station Circle Nodes */}
          {Array.from({ length: n }, (_, idx) => {
            const cx = startX + idx * stationSpacing;
            const isL1Active = state.currentStation === idx && state.currentLine === 1;
            const isL2Active = state.currentStation === idx && state.currentLine === 2;
            const isL1OnPath = isStationOnPath(1, idx);
            const isL2OnPath = isStationOnPath(2, idx);

            return (
              <g key={`station-${idx}`}>
                {/* Station Column Header */}
                <text x={cx} y={40} fill="#94A3B8" fontSize="11" fontWeight="bold" textAnchor="middle">
                  Task {idx + 1}
                </text>

                {/* Line 1 Station Node */}
                <g>
                  <circle
                    cx={cx}
                    cy={line1Y}
                    r={radius}
                    className={`transition-all duration-300 ${
                      isL1OnPath
                        ? 'fill-acid-500/25 stroke-acid-500'
                        : isL1Active
                        ? 'fill-amber/30 stroke-amber'
                        : f1[idx] !== null
                        ? 'fill-obsidian-900 stroke-amber/60'
                        : 'fill-obsidian-950 stroke-hairline'
                    }`}
                    strokeWidth={isL1OnPath ? 2.5 : isL1Active ? 2 : 1.2}
                  />
                  <text x={cx} y={line1Y - 4} fill="#F8FAFC" fontSize="10" fontWeight="bold" textAnchor="middle">
                    S1,{idx + 1}
                  </text>
                  <text x={cx} y={line1Y + 9} fill="#F59E0B" fontSize="9" textAnchor="middle">
                    a={a1[idx]}
                  </text>
                  {f1[idx] !== null && (
                    <text x={cx} y={line1Y - radius - 5} fill={isL1OnPath ? '#10B981' : '#CBD5E1'} fontSize="9" fontWeight="bold" textAnchor="middle">
                      f1={f1[idx]}
                    </text>
                  )}
                </g>

                {/* Line 2 Station Node */}
                <g>
                  <circle
                    cx={cx}
                    cy={line2Y}
                    r={radius}
                    className={`transition-all duration-300 ${
                      isL2OnPath
                        ? 'fill-acid-500/25 stroke-acid-500'
                        : isL2Active
                        ? 'fill-amber/30 stroke-amber'
                        : f2[idx] !== null
                        ? 'fill-obsidian-900 stroke-cyan-400/60'
                        : 'fill-obsidian-950 stroke-hairline'
                    }`}
                    strokeWidth={isL2OnPath ? 2.5 : isL2Active ? 2 : 1.2}
                  />
                  <text x={cx} y={line2Y - 4} fill="#F8FAFC" fontSize="10" fontWeight="bold" textAnchor="middle">
                    S2,{idx + 1}
                  </text>
                  <text x={cx} y={line2Y + 9} fill="#06B6D4" fontSize="9" textAnchor="middle">
                    a={a2[idx]}
                  </text>
                  {f2[idx] !== null && (
                    <text x={cx} y={line2Y + radius + 14} fill={isL2OnPath ? '#10B981' : '#CBD5E1'} fontSize="9" fontWeight="bold" textAnchor="middle">
                      f2={f2[idx]}
                    </text>
                  )}
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-5 text-xs font-mono text-chalk-400">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber/40 border border-amber"></span>
          <span>Active Station Computation</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-acid-500/40 border border-acid-500"></span>
          <span>Optimal Path Node (Backtrack)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-0.5 bg-acid-500"></div>
          <span>Winning Path Segment</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-0.5 border-t border-dashed border-chalk-500"></div>
          <span>Transfer Option (t1 / t2)</span>
        </div>
      </div>
    </div>
  );
};
