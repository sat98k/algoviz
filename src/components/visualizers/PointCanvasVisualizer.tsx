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
    <div className="flex flex-col items-center w-full min-h-[420px] p-6 bg-obsidian-900 border border-hairline transition-all">
      {/* Turn Orientation status banner */}
      {checkTriplet && turnOrientation && (
        <div
          className={`mb-4 px-4 py-1.5 text-xs font-mono border flex items-center gap-3 ${
            turnOrientation === 'ccw'
              ? 'bg-obsidian-950 border-acid-500/50 text-acid-500'
              : 'bg-obsidian-950 border-rose-500/50 text-rose-300'
          }`}
        >
          <span>
            TRIPLET: ({checkTriplet[0].label} → {checkTriplet[1].label} → {checkTriplet[2].label})
          </span>
          <span>|</span>
          <strong>ORIENTATION: {turnOrientation.toUpperCase()} {turnOrientation === 'ccw' ? '✔ (Left Turn - Push)' : '✖ (Right Turn - Pop Stack)'}</strong>
        </div>
      )}

      {/* SVG Canvas */}
      <div className="w-full flex justify-center bg-obsidian-950 border border-hairline p-4">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full max-w-2xl h-[380px] select-none">
          {/* Coordinate Grid Lines */}
          <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="#1c1f26" strokeWidth="1.5" />
          <line x1={padding} y1={padding} x2={padding} y2={svgHeight - padding} stroke="#1c1f26" strokeWidth="1.5" />

          {/* Hull Polygon / Perimeter Path */}
          {hullPathData && (
            <path
              d={hullPathData}
              fill={isComplete ? 'rgba(212, 255, 50, 0.08)' : 'none'}
              stroke="#d4ff32"
              strokeWidth="2"
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
                stroke={turnOrientation === 'ccw' ? '#d4ff32' : '#f43f5e'}
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

            let fillClass = 'fill-obsidian-800 stroke-chalk-600';
            if (isPivot) fillClass = 'fill-amber stroke-amber-glow stroke-2';
            else if (inHull) fillClass = 'fill-acid-500 stroke-acid-400 stroke-2';
            else if (isCurrent || isChecking) fillClass = 'fill-electric-500 stroke-electric-400 stroke-2';

            const px = scaleX(pt.x);
            const py = scaleY(pt.y);

            return (
              <g key={pt.id} transform={`translate(${px}, ${py})`} className="cursor-pointer">
                <circle r={isPivot || inHull || isCurrent ? 8 : 6} className={`${fillClass} transition-all`} />
                <text
                  x={12}
                  y={4}
                  className="text-[10px] font-mono font-bold fill-chalk-300 pointer-events-none"
                >
                  {pt.label || `P${pt.id}`} ({pt.x}, {pt.y})
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-5 mt-5 text-xs font-mono text-chalk-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber border border-amber-glow"></span>
          <span>Pivot Point P0</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-acid-500 border border-acid-400"></span>
          <span>Convex Hull Vertex</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-electric-500 border border-electric-400"></span>
          <span>Active Triplet</span>
        </div>
      </div>
    </div>
  );
};
