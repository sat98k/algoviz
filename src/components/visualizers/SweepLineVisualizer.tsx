import React from 'react';
import { AlgorithmStep } from '../../types/algorithm';
import { SweepLineState, LineSegment } from '../../algorithms/lineSegmentIntersection';
import { Sliders, CheckCircle2, AlertTriangle } from 'lucide-react';

interface SweepLineVisualizerProps {
  step: AlgorithmStep;
}

export const SweepLineVisualizer: React.FC<SweepLineVisualizerProps> = ({ step }) => {
  const state = (step.state || {}) as SweepLineState;
  const segments: LineSegment[] = state.segments || [];
  const currentSweepX = state.currentSweepX ?? 0;
  const activeIds = state.activeSegmentIds || [];
  const checkedPair = state.checkedPair;
  const intersectionFound = state.intersectionFound;
  const intPt = state.intersectionPoint;

  const svgWidth = 580;
  const svgHeight = 380;
  const padding = 50;

  // Calculate bounding box for normalization
  const allX = segments.flatMap((s) => [s.p1.x, s.p2.x]);
  const allY = segments.flatMap((s) => [s.p1.y, s.p2.y]);
  const minX = Math.min(...allX, 0);
  const maxX = Math.max(...allX, 500);
  const minY = Math.min(...allY, 0);
  const maxY = Math.max(...allY, 400);

  const scaleX = (x: number) => padding + ((x - minX) / (maxX - minX || 1)) * (svgWidth - 2 * padding);
  // Invert y for Cartesian plane
  const scaleY = (y: number) => svgHeight - padding - ((y - minY) / (maxY - minY || 1)) * (svgHeight - 2 * padding);

  const sweepSvgX = scaleX(currentSweepX);

  return (
    <div className="flex flex-col items-center w-full min-h-[420px] p-4 sm:p-6 bg-obsidian-900 border border-hairline transition-all">
      {/* Top Banner Status */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 p-3.5 mb-4 bg-obsidian-950 border border-hairline font-mono text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-chalk-200">
            <Sliders className="w-4 h-4 text-amber" />
            <span>SWEEP LINE: <strong>x = {Math.round(currentSweepX)}</strong></span>
          </div>
          <span className="text-chalk-600">|</span>
          <div>
            ACTIVE SEGMENTS |T|:{' '}
            <strong className="text-electric-400">
              {activeIds.length} {activeIds.length > 0 ? `[${activeIds.join(', ')}]` : '(empty)'}
            </strong>
          </div>
        </div>

        {intersectionFound ? (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-red-950/70 border border-red-500 text-red-300 font-bold">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span>INTERSECTION AT ({intPt?.x}, {intPt?.y})</span>
          </div>
        ) : step.isFinal ? (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950/60 border border-emerald-500 text-emerald-400 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>NO INTERSECTIONS</span>
          </div>
        ) : checkedPair ? (
          <div className="px-3 py-1 bg-amber/15 border border-amber/40 text-amber-glow font-semibold">
            TESTING: {checkedPair[0]} × {checkedPair[1]}
          </div>
        ) : null}
      </div>

      {/* Main Grid: Left Canvas, Right Active-Set Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 w-full">
        {/* SVG Canvas */}
        <div className="xl:col-span-8 flex justify-center bg-obsidian-950 border border-hairline p-3 overflow-hidden">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full max-w-2xl h-[360px] select-none">
            {/* Coordinate Grid axes */}
            <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="#1e293b" strokeWidth="1.5" />
            <line x1={padding} y1={padding} x2={padding} y2={svgHeight - padding} stroke="#1e293b" strokeWidth="1.5" />

            {/* Segments */}
            {segments.map((seg) => {
              const x1 = scaleX(seg.p1.x);
              const y1 = scaleY(seg.p1.y);
              const x2 = scaleX(seg.p2.x);
              const y2 = scaleY(seg.p2.y);

              const isActive = activeIds.includes(seg.id);
              const isChecked = checkedPair?.includes(seg.id);
              const isIntersecting = intPt && (intPt.s1 === seg.label || intPt.s2 === seg.label);

              let stroke = '#64748b'; // default slate
              let strokeWidth = 2;

              if (isIntersecting) {
                stroke = '#ef4444';
                strokeWidth = 3.5;
              } else if (isChecked) {
                stroke = '#fbbf24';
                strokeWidth = 3;
              } else if (isActive) {
                stroke = '#38bdf8';
                strokeWidth = 2.5;
              }

              return (
                <g key={seg.id}>
                  {/* Line */}
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    className="transition-all duration-200"
                  />

                  {/* Left Endpoint */}
                  <circle cx={x1} cy={y1} r={4} fill={stroke} />
                  {/* Right Endpoint */}
                  <circle cx={x2} cy={y2} r={4} fill={stroke} />

                  {/* Segment Label */}
                  <text
                    x={(x1 + x2) / 2 + 8}
                    y={(y1 + y2) / 2 - 8}
                    className="text-[11px] font-mono font-bold"
                    fill={stroke}
                  >
                    {seg.label}
                  </text>
                </g>
              );
            })}

            {/* Sweep Line */}
            {currentSweepX > minX - 10 && (
              <g>
                <line
                  x1={sweepSvgX}
                  y1={padding - 10}
                  x2={sweepSvgX}
                  y2={svgHeight - padding + 10}
                  stroke="#fbbf24"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                  className="transition-all duration-300"
                />
                <text
                  x={sweepSvgX + 6}
                  y={padding}
                  className="text-[9px] font-mono font-bold fill-amber-400 uppercase tracking-wider"
                >
                  Sweep
                </text>
              </g>
            )}

            {/* Intersection Point Marker */}
            {intPt && (
              <g transform={`translate(${scaleX(intPt.x)}, ${scaleY(intPt.y)})`}>
                <circle r={14} fill="none" stroke="#ef4444" strokeWidth="2" className="animate-ping" />
                <circle r={7} fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
                <text
                  x={12}
                  y={-8}
                  className="text-[11px] font-mono font-bold fill-red-400 drop-shadow"
                >
                  ({intPt.x}, {intPt.y})
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Right Active-Set Panel */}
        <div className="xl:col-span-4 flex flex-col p-4 bg-obsidian-950 border border-hairline font-mono text-xs space-y-4">
          <div className="flex items-center justify-between border-b border-hairline pb-2.5">
            <span className="font-bold text-chalk-200 uppercase tracking-wider">
              Active Segments Status T
            </span>
            <span className="text-[10px] text-chalk-400">Top-to-Bottom</span>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] text-chalk-400">
              Segments currently crossing sweep line at x = {Math.round(currentSweepX)}:
            </div>

            {activeIds.length === 0 ? (
              <div className="p-4 text-center bg-obsidian-900 border border-hairline text-chalk-500 italic">
                Active status structure T is empty.
              </div>
            ) : (
              <div className="space-y-2">
                {activeIds.map((id, rank) => {
                  const seg = segments.find((s) => s.id === id);
                  const isChecked = checkedPair?.includes(id);

                  return (
                    <div
                      key={id}
                      className={`flex items-center justify-between p-2.5 rounded border transition-all ${
                        isChecked
                          ? 'bg-amber/20 border-amber text-amber-glow font-bold scale-[1.02]'
                          : 'bg-obsidian-900 border-sky-500/30 text-sky-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-chalk-500">#{rank + 1}</span>
                        <strong className="text-chalk-100">{seg?.label || id}</strong>
                      </div>
                      <span className="text-[10px] text-chalk-400">
                        [{seg?.p1.x}, {seg?.p1.y}] → [{seg?.p2.x}, {seg?.p2.y}]
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Adjacency Check Summary */}
          <div className="p-3 bg-obsidian-900 border border-hairline text-chalk-300 font-sans text-xs space-y-1">
            <div className="font-mono text-[10px] uppercase font-bold text-amber tracking-wider">
              Sweep-Line Invariant:
            </div>
            <p>
              If an intersection exists, the intersecting segments must become adjacent in the active status structure T before or at the intersection point.
            </p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-5 mt-4 text-xs font-mono text-chalk-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-sky-400"></span>
          <span>Active in T</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-amber"></span>
          <span>Adjacent Pair Under Test</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          <span>Intersection Point</span>
        </div>
      </div>
    </div>
  );
};
