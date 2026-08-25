import React from 'react';
import { AlgorithmStep } from '../../types/algorithm';
import { Point2D } from '../../algorithms/grahamScan';

interface PointCanvasVisualizerProps {
  step: AlgorithmStep;
}

export const PointCanvasVisualizer: React.FC<PointCanvasVisualizerProps> = ({ step }) => {
  const state = step.state || {};
  const points: Point2D[] = state.points || [];
  const pivot: Point2D | undefined = state.pivot;
  const hullStack: Point2D[] = state.hullStack || [];
  const checkTriplet = state.checkTriplet;
  const turnOrientation = state.turnOrientation;
  const isComplete = state.phase === 'complete';

  const svgWidth = 650;
  const svgHeight = 420;
  const padding = 50;

  // Compute bounding box of points for coordinate normalization
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs, 0);
  const maxX = Math.max(...xs, 500);
  const minY = Math.min(...ys, 0);
  const maxY = Math.max(...ys, 400);

  const scaleX = (x: number) => padding + ((x - minX) / (maxX - minX || 1)) * (svgWidth - 2 * padding);
  // Invert y for standard Cartesian coordinate plane
  const scaleY = (y: number) => svgHeight - padding - ((y - minY) / (maxY - minY || 1)) * (svgHeight - 2 * padding);

  const hullPathData = hullStack.length > 0
    ? hullStack
        .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${scaleX(p.x)} ${scaleY(p.y)}`)
        .join(' ') + (isComplete && hullStack.length >= 3 ? ' Z' : '')
    : '';

  return (
    <div className="flex flex-col items-center w-full min-h-[420px] p-6 bg-slate-900/90 rounded-xl border border-slate-800 backdrop-blur">
      {/* Turn Orientation status banner */}
      {checkTriplet && turnOrientation && (
        <div
          className={`mb-4 px-4 py-1.5 rounded-full text-xs font-mono border flex items-center gap-2 ${
            turnOrientation === 'ccw'
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
              : 'bg-rose-950/80 border-rose-500 text-rose-300'
          }`}
        >
          <span>
            Triplet: ({checkTriplet[0].label} → {checkTriplet[1].label} → {checkTriplet[2].label})
          </span>
          <span>|</span>
          <strong>Turn: {turnOrientation.toUpperCase()} {turnOrientation === 'ccw' ? '✔ (Left Turn)' : '✖ (Right Turn - Pop)'}</strong>
        </div>
      )}

      {/* SVG Canvas */}
      <div className="w-full flex justify-center bg-slate-950/80 rounded-lg border border-slate-800 p-2">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full max-w-2xl h-[380px] select-none">
          {/* Coordinate Grid Lines */}
          <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="#334155" strokeWidth="1.5" />
          <line x1={padding} y1={padding} x2={padding} y2={svgHeight - padding} stroke="#334155" strokeWidth="1.5" />

          {/* Hull Polygon / Perimeter Path */}
          {hullPathData && (
            <path
              d={hullPathData}
              fill={isComplete ? 'rgba(16, 185, 129, 0.15)' : 'none'}
              stroke="#10b981"
              strokeWidth="2.5"
              strokeDasharray={isComplete ? undefined : '4 3'}
            />
          )}

          {/* Check Triplet Orientation Vectors */}
          {checkTriplet && checkTriplet.length === 3 && (
            <g>
              <line
                x1={scaleX(checkTriplet[0].x)}
                y1={scaleY(checkTriplet[0].y)}
                x2={scaleX(checkTriplet[1].x)}
                y2={scaleY(checkTriplet[1].y)}
                stroke="#f59e0b"
                strokeWidth="2"
              />
              <line
                x1={scaleX(checkTriplet[1].x)}
                y1={scaleY(checkTriplet[1].y)}
                x2={scaleX(checkTriplet[2].x)}
                y2={scaleY(checkTriplet[2].y)}
                stroke={turnOrientation === 'ccw' ? '#10b981' : '#f43f5e'}
                strokeWidth="2"
              />
            </g>
          )}

          {/* Render Points */}
          {points.map((pt) => {
            const isPivot = pivot?.id === pt.id;
            const inHull = hullStack.some((h) => h.id === pt.id);
            const isCurrent = state.currentPoint?.id === pt.id;
            const isChecking = checkTriplet?.some((t: Point2D) => t.id === pt.id);

            let fillClass = 'fill-slate-600 stroke-slate-400';
            if (isPivot) fillClass = 'fill-amber-400 stroke-amber-200 stroke-2';
            else if (inHull) fillClass = 'fill-emerald-500 stroke-emerald-200 stroke-2';
            else if (isCurrent || isChecking) fillClass = 'fill-sky-400 stroke-sky-100 stroke-2';

            const px = scaleX(pt.x);
            const py = scaleY(pt.y);

            return (
              <g key={pt.id} transform={`translate(${px}, ${py})`} className="cursor-pointer">
                <circle r={isPivot || inHull || isCurrent ? 8 : 6} className={`${fillClass} transition-all`} />
                <text
                  x={12}
                  y={4}
                  className="text-[10px] font-mono font-bold fill-slate-300 pointer-events-none drop-shadow"
                >
                  {pt.label || `P${pt.id}`} ({pt.x}, {pt.y})
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-5 text-xs text-slate-300">
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-amber-400 border border-amber-200"></span>
          <span>Pivot Point P0 (Anchor)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-emerald-200"></span>
          <span>Convex Hull Vertex</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-sky-400 border border-sky-100"></span>
          <span>Active / Evaluating</span>
        </div>
      </div>
    </div>
  );
};
