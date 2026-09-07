import React, { useState, useEffect } from 'react';
import { AlgorithmStep } from '../../types/algorithm';
import { AssemblyLineState } from '../../algorithms/assemblyLineScheduling';
import { ArrowRight, Factory, Table } from 'lucide-react';
import { AssemblyLineDpMatrix } from './AssemblyLineDpMatrix';

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

  const [showDpMatrix, setShowDpMatrix] = useState<boolean>(false);

  // Real-time reactive theme detection for SVG color tokens
  const [isDark, setIsDark] = useState<boolean>(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : true
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

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

  // Semantic Contrast & Color Palette for Light & Dark Mode
  const colors = {
    // Normal / inactive edges & arrows
    edgeNormal: isDark ? '#475569' : '#94A3B8',
    edgeTransfer: isDark ? '#64748B' : '#64748B',
    edgeActive: isDark ? '#10B981' : '#059669',
    edgeMarkerNormal: isDark ? '#475569' : '#94A3B8',
    edgeMarkerActive: isDark ? '#10B981' : '#059669',

    // Unexplored / Normal station nodes (guaranteed visible boundary in both themes)
    nodeUnexploredFill: isDark ? '#11141c' : '#F8FAFC',
    nodeUnexploredStroke: isDark ? '#475569' : '#64748B',
    nodeUnexploredText: isDark ? '#F8FAFC' : '#0F172A',

    // Active station computation
    nodeActiveFill: isDark ? 'rgba(245, 158, 11, 0.28)' : '#FEF3C7',
    nodeActiveStroke: isDark ? '#F59E0B' : '#D97706',

    // Optimal path station nodes
    nodeOptimalFill: isDark ? 'rgba(16, 185, 129, 0.22)' : '#ECFDF5',
    nodeOptimalStroke: isDark ? '#10B981' : '#059669',

    // Propagated / Computed station nodes
    nodeL1ComputedFill: isDark ? '#141824' : '#FFFBEB',
    nodeL1ComputedStroke: isDark ? '#D97706' : '#B45309',

    nodeL2ComputedFill: isDark ? '#141824' : '#F0F9FF',
    nodeL2ComputedStroke: isDark ? '#0284C7' : '#0369A1',

    // Text fills
    taskHeader: isDark ? '#94A3B8' : '#475569',
    line1Header: isDark ? '#F59E0B' : '#B45309',
    line2Header: isDark ? '#38BDF8' : '#0284C7',

    costL1Text: isDark ? '#FBBF24' : '#92400E',
    costL2Text: isDark ? '#38BDF8' : '#0369A1',

    dpValueOptimal: isDark ? '#10B981' : '#047857',
    dpValueNormal: isDark ? '#E2E8F0' : '#1E293B',

    // Protective high-contrast transfer badge
    transferBadgeBg: isDark ? '#0B0D13' : '#FFFFFF',
    transferBadgeBorder: isDark ? '#334155' : '#CBD5E1',
    transferBadgeText: isDark ? '#CBD5E1' : '#1E293B',

    entryExitText: isDark ? '#CBD5E1' : '#334155',
  };

  return (
    <div className="flex flex-col items-center w-full min-h-[440px] p-4 sm:p-6 bg-obsidian-900 border border-hairline transition-all gap-4">
      {/* Top Banner: Status & Optimal Cost */}
      <div
        className={`w-full ${
          showDpMatrix ? 'max-w-7xl' : 'max-w-5xl'
        } flex flex-col gap-2 p-4 bg-obsidian-950 border border-hairline font-mono text-xs transition-all duration-300`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-2">
          <div className="flex items-center gap-2 text-amber-glow">
            <Factory className="w-4 h-4 text-amber" />
            <span className="font-semibold uppercase tracking-wider">{step.title}</span>
          </div>
          <div className="flex items-center gap-3">
            {minTotalTime !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-chalk-500 uppercase text-[10px]">Optimal Total Time:</span>
                <span className="text-acid-500 font-bold text-sm">{minTotalTime}</span>
                {winningLine && (
                  <span className="text-[10px] text-chalk-400 font-mono">(via Exit Line {winningLine})</span>
                )}
              </div>
            )}
            {/* View DP Matrix Toggle */}
            <button
              onClick={() => setShowDpMatrix((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-semibold border transition-all ${
                showDpMatrix
                  ? 'bg-amber text-obsidian-950 border-amber shadow-sm'
                  : 'bg-obsidian-900 hover:bg-obsidian-850 text-chalk-300 hover:text-chalk-100 border-hairline'
              }`}
              title={showDpMatrix ? 'Hide DP Matrix' : 'View DP Matrix'}
            >
              <Table className="w-3.5 h-3.5" />
              <span>{showDpMatrix ? 'Hide DP Matrix' : 'View DP Matrix'}</span>
            </button>
          </div>
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

      {/* Main Content Layout: Assembly Line Graph + Optional Right-Side DP Matrix */}
      <div
        className={`w-full ${
          showDpMatrix ? 'max-w-7xl flex flex-col xl:flex-row items-start gap-4' : 'max-w-5xl flex flex-col gap-4'
        } transition-all duration-300`}
      >
        {/* SVG Canvas for Assembly Lines */}
        <div
          className={`w-full ${
            showDpMatrix ? 'xl:flex-1' : ''
          } bg-obsidian-950 border border-hairline p-2 sm:p-4 flex items-center justify-center overflow-hidden`}
        >
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto max-h-[360px] font-mono select-none"
        >
          <defs>
            {/* Arrow Markers */}
            <marker id="arrow-default" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill={colors.edgeMarkerNormal} />
            </marker>
            <marker id="arrow-active" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill={colors.edgeMarkerActive} />
            </marker>
            <marker id="arrow-amber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill={colors.nodeActiveStroke} />
            </marker>
          </defs>

          {/* Line Labels */}
          <text x={35} y={line1Y + 5} fill={colors.line1Header} fontSize="12" fontWeight="bold">LINE 1</text>
          <text x={35} y={line2Y + 5} fill={colors.line2Header} fontSize="12" fontWeight="bold">LINE 2</text>

          {/* Entry Arrows */}
          <line
            x1={80}
            y1={line1Y}
            x2={startX - radius}
            y2={line1Y}
            stroke={isStationOnPath(1, 0) ? colors.edgeActive : colors.edgeNormal}
            strokeWidth={isStationOnPath(1, 0) ? 2.5 : 1.6}
            markerEnd={isStationOnPath(1, 0) ? 'url(#arrow-active)' : 'url(#arrow-default)'}
            className="transition-colors duration-200"
          />
          <text x={95} y={line1Y - 8} fill={colors.entryExitText} fontSize="10" fontWeight="600">e1={e1}</text>

          <line
            x1={80}
            y1={line2Y}
            x2={startX - radius}
            y2={line2Y}
            stroke={isStationOnPath(2, 0) ? colors.edgeActive : colors.edgeNormal}
            strokeWidth={isStationOnPath(2, 0) ? 2.5 : 1.6}
            markerEnd={isStationOnPath(2, 0) ? 'url(#arrow-active)' : 'url(#arrow-default)'}
            className="transition-colors duration-200"
          />
          <text x={95} y={line2Y + 18} fill={colors.entryExitText} fontSize="10" fontWeight="600">e2={e2}</text>

          {/* Exit Arrows */}
          <line
            x1={endX + radius}
            y1={line1Y}
            x2={svgWidth - 60}
            y2={line1Y}
            stroke={winningLine === 1 && optimalPath.length > 0 ? colors.edgeActive : colors.edgeNormal}
            strokeWidth={winningLine === 1 && optimalPath.length > 0 ? 2.5 : 1.6}
            markerEnd={winningLine === 1 && optimalPath.length > 0 ? 'url(#arrow-active)' : 'url(#arrow-default)'}
            className="transition-colors duration-200"
          />
          <text x={endX + 40} y={line1Y - 8} fill={colors.entryExitText} fontSize="10" fontWeight="600">x1={x1}</text>

          <line
            x1={endX + radius}
            y1={line2Y}
            x2={svgWidth - 60}
            y2={line2Y}
            stroke={winningLine === 2 && optimalPath.length > 0 ? colors.edgeActive : colors.edgeNormal}
            strokeWidth={winningLine === 2 && optimalPath.length > 0 ? 2.5 : 1.6}
            markerEnd={winningLine === 2 && optimalPath.length > 0 ? 'url(#arrow-active)' : 'url(#arrow-default)'}
            className="transition-colors duration-200"
          />
          <text x={endX + 40} y={line2Y + 18} fill={colors.entryExitText} fontSize="10" fontWeight="600">x2={x2}</text>

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
                  stroke={isHoriz1OnPath ? colors.edgeActive : colors.edgeNormal}
                  strokeWidth={isHoriz1OnPath ? 2.8 : 1.6}
                  markerEnd={isHoriz1OnPath ? 'url(#arrow-active)' : 'url(#arrow-default)'}
                  className="transition-colors duration-200"
                />

                {/* Horizontal Line 2 -> Line 2 */}
                <line
                  x1={x1Pos}
                  y1={line2Y}
                  x2={x2Pos}
                  y2={line2Y}
                  stroke={isHoriz2OnPath ? colors.edgeActive : colors.edgeNormal}
                  strokeWidth={isHoriz2OnPath ? 2.8 : 1.6}
                  markerEnd={isHoriz2OnPath ? 'url(#arrow-active)' : 'url(#arrow-default)'}
                  className="transition-colors duration-200"
                />

                {/* Diagonal Line 1 -> Line 2 */}
                <line
                  x1={x1Pos - 4}
                  y1={line1Y + 16}
                  x2={x2Pos + 4}
                  y2={line2Y - 16}
                  stroke={isDiag1to2OnPath ? colors.edgeActive : colors.edgeTransfer}
                  strokeWidth={isDiag1to2OnPath ? 2.8 : 1.4}
                  strokeDasharray={isDiag1to2OnPath ? undefined : '4 3'}
                  markerEnd={isDiag1to2OnPath ? 'url(#arrow-active)' : 'url(#arrow-default)'}
                  className="transition-colors duration-200"
                />
                <g transform={`translate(${midX - 10}, ${(line1Y + line2Y) / 2 - 8})`}>
                  <rect
                    x="-16"
                    y="-7"
                    width="32"
                    height="14"
                    rx="3"
                    fill={colors.transferBadgeBg}
                    stroke={colors.transferBadgeBorder}
                    strokeWidth="0.8"
                    className="shadow-sm"
                  />
                  <text
                    x="0"
                    y="3.5"
                    fill={colors.transferBadgeText}
                    fontSize="9"
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    t1={t1[idx]}
                  </text>
                </g>

                {/* Diagonal Line 2 -> Line 1 */}
                <line
                  x1={x1Pos - 4}
                  y1={line2Y - 16}
                  x2={x2Pos + 4}
                  y2={line1Y + 16}
                  stroke={isDiag2to1OnPath ? colors.edgeActive : colors.edgeTransfer}
                  strokeWidth={isDiag2to1OnPath ? 2.8 : 1.4}
                  strokeDasharray={isDiag2to1OnPath ? undefined : '4 3'}
                  markerEnd={isDiag2to1OnPath ? 'url(#arrow-active)' : 'url(#arrow-default)'}
                  className="transition-colors duration-200"
                />
                <g transform={`translate(${midX + 10}, ${(line1Y + line2Y) / 2 + 16})`}>
                  <rect
                    x="-16"
                    y="-7"
                    width="32"
                    height="14"
                    rx="3"
                    fill={colors.transferBadgeBg}
                    stroke={colors.transferBadgeBorder}
                    strokeWidth="0.8"
                    className="shadow-sm"
                  />
                  <text
                    x="0"
                    y="3.5"
                    fill={colors.transferBadgeText}
                    fontSize="9"
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    t2={t2[idx]}
                  </text>
                </g>
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
            const isL1Computed = f1[idx] !== null && f1[idx] !== undefined;
            const isL2Computed = f2[idx] !== null && f2[idx] !== undefined;

            // Line 1 station styling resolution
            let l1Fill = colors.nodeUnexploredFill;
            let l1Stroke = colors.nodeUnexploredStroke;
            let l1StrokeWidth = 1.8;

            if (isL1OnPath) {
              l1Fill = colors.nodeOptimalFill;
              l1Stroke = colors.nodeOptimalStroke;
              l1StrokeWidth = 2.6;
            } else if (isL1Active) {
              l1Fill = colors.nodeActiveFill;
              l1Stroke = colors.nodeActiveStroke;
              l1StrokeWidth = 2.6;
            } else if (isL1Computed) {
              l1Fill = colors.nodeL1ComputedFill;
              l1Stroke = colors.nodeL1ComputedStroke;
              l1StrokeWidth = 2.0;
            }

            // Line 2 station styling resolution
            let l2Fill = colors.nodeUnexploredFill;
            let l2Stroke = colors.nodeUnexploredStroke;
            let l2StrokeWidth = 1.8;

            if (isL2OnPath) {
              l2Fill = colors.nodeOptimalFill;
              l2Stroke = colors.nodeOptimalStroke;
              l2StrokeWidth = 2.6;
            } else if (isL2Active) {
              l2Fill = colors.nodeActiveFill;
              l2Stroke = colors.nodeActiveStroke;
              l2StrokeWidth = 2.6;
            } else if (isL2Computed) {
              l2Fill = colors.nodeL2ComputedFill;
              l2Stroke = colors.nodeL2ComputedStroke;
              l2StrokeWidth = 2.0;
            }

            return (
              <g key={`station-${idx}`}>
                {/* Station Column Header */}
                <text x={cx} y={40} fill={colors.taskHeader} fontSize="11" fontWeight="bold" textAnchor="middle">
                  Task {idx + 1}
                </text>

                {/* Line 1 Station Node */}
                <g>
                  {/* Pulsing Active Ring */}
                  {isL1Active && (
                    <circle
                      cx={cx}
                      cy={line1Y}
                      r={radius + 4}
                      fill="none"
                      stroke={colors.nodeActiveStroke}
                      strokeWidth={2}
                      className="animate-pulse"
                    />
                  )}
                  <circle
                    cx={cx}
                    cy={line1Y}
                    r={radius}
                    fill={l1Fill}
                    stroke={l1Stroke}
                    strokeWidth={l1StrokeWidth}
                    className="transition-all duration-300 shadow-sm"
                  />
                  <text
                    x={cx}
                    y={line1Y - 4}
                    fill={colors.nodeUnexploredText}
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    S1,{idx + 1}
                  </text>
                  <text
                    x={cx}
                    y={line1Y + 9}
                    fill={colors.costL1Text}
                    fontSize="9"
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    a={a1[idx]}
                  </text>
                  {isL1Computed && (
                    <text
                      x={cx}
                      y={line1Y - radius - 6}
                      fill={isL1OnPath ? colors.dpValueOptimal : colors.dpValueNormal}
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      f1={f1[idx]}
                    </text>
                  )}
                </g>

                {/* Line 2 Station Node */}
                <g>
                  {/* Pulsing Active Ring */}
                  {isL2Active && (
                    <circle
                      cx={cx}
                      cy={line2Y}
                      r={radius + 4}
                      fill="none"
                      stroke={colors.nodeActiveStroke}
                      strokeWidth={2}
                      className="animate-pulse"
                    />
                  )}
                  <circle
                    cx={cx}
                    cy={line2Y}
                    r={radius}
                    fill={l2Fill}
                    stroke={l2Stroke}
                    strokeWidth={l2StrokeWidth}
                    className="transition-all duration-300 shadow-sm"
                  />
                  <text
                    x={cx}
                    y={line2Y - 4}
                    fill={colors.nodeUnexploredText}
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    S2,{idx + 1}
                  </text>
                  <text
                    x={cx}
                    y={line2Y + 9}
                    fill={colors.costL2Text}
                    fontSize="9"
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    a={a2[idx]}
                  </text>
                  {isL2Computed && (
                    <text
                      x={cx}
                      y={line2Y + radius + 14}
                      fill={isL2OnPath ? colors.dpValueOptimal : colors.dpValueNormal}
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      f2={f2[idx]}
                    </text>
                  )}
                </g>
              </g>
            );
          })}
        </svg>
        </div>

        {/* Optional Right-Side DP Matrix Pane */}
        {showDpMatrix && (
          <div className="w-full xl:w-[420px] xl:shrink-0 flex flex-col">
            <AssemblyLineDpMatrix step={step} onClose={() => setShowDpMatrix(false)} />
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-5 text-xs font-mono text-chalk-400">
        <div className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-full"
            style={{
              backgroundColor: colors.nodeActiveFill,
              borderColor: colors.nodeActiveStroke,
              borderWidth: 1.5,
            }}
          />
          <span className="text-chalk-300">Active Station Computation</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-full"
            style={{
              backgroundColor: colors.nodeOptimalFill,
              borderColor: colors.nodeOptimalStroke,
              borderWidth: 1.5,
            }}
          />
          <span className="text-chalk-300">Optimal Path Station</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-full"
            style={{
              backgroundColor: colors.nodeUnexploredFill,
              borderColor: colors.nodeUnexploredStroke,
              borderWidth: 1.5,
            }}
          />
          <span className="text-chalk-300">Unexplored / Normal Station</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-5 h-0.5"
            style={{ backgroundColor: colors.edgeActive }}
          />
          <span className="text-chalk-300">Winning Path Segment</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-5 h-0.5 border-t border-dashed"
            style={{ borderColor: colors.edgeTransfer }}
          />
          <span className="text-chalk-300">Transfer Option (t1 / t2)</span>
        </div>
      </div>
    </div>
  );
};

