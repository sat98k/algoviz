import React, { useState, useEffect } from 'react';
import { AlgorithmStep } from '../../types/algorithm';
import { TspState } from '../../algorithms/tsp';
import { TspDpMatrix } from './TspDpMatrix';
import { TspDistanceMatrixEditor } from './TspDistanceMatrixEditor';
import { Table, Compass, CheckCircle, MapPin, SlidersHorizontal } from 'lucide-react';

interface TspVisualizerProps {
  step: AlgorithmStep;
  inputs?: Record<string, any>;
  onApplyInputs?: (newInputs: Record<string, any>) => void;
  presets?: any[];
}

export const TspVisualizer: React.FC<TspVisualizerProps> = ({
  step,
  onApplyInputs,
  presets,
}) => {
  const state = (step.state || {}) as TspState;
  const numCities = state.numCities || 4;
  const cities = state.cities || [];
  const costMatrix = state.costMatrix || [];
  const currentMask = state.currentMask ?? 1;
  const currentCity = state.currentCity ?? 0;
  const currentPhase = state.currentPhase || 'init';
  const candidateEdges = state.candidateEdges || [];
  const activeTourEdges = state.activeTourEdges || [];
  const optimalTour = state.optimalTour || [];
  const optimalCost = state.optimalCost;

  const [showDpMatrix, setShowDpMatrix] = useState<boolean>(true);
  const [showDistanceEditor, setShowDistanceEditor] = useState<boolean>(false);

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

  // Theme color tokens for SVG rendering
  const colors = {
    canvasBg: isDark ? '#090a0f' : '#ffffff',
    edgeBg: isDark ? '#090a0f' : '#ffffff',
    edgeInactive: isDark ? '#334155' : '#cbd5e1',
    edgeText: isDark ? '#94a3b8' : '#64748b',
    edgeCandidate: isDark ? '#38bdf8' : '#0284c7', // electric blue
    edgeActive: isDark ? '#f59e0b' : '#d97706', // amber
    edgeOptimal: isDark ? '#10b981' : '#059669', // emerald green

    nodeUnvisitedFill: isDark ? '#11141c' : '#f8fafc',
    nodeUnvisitedStroke: isDark ? '#475569' : '#94a3b8',
    nodeUnvisitedText: isDark ? '#f1f5f9' : '#0f172a',

    nodeInSubsetFill: isDark ? 'rgba(56, 189, 248, 0.16)' : '#e0f2fe',
    nodeInSubsetStroke: isDark ? '#38bdf8' : '#0284c7',

    nodeActiveFill: isDark ? 'rgba(245, 158, 11, 0.28)' : '#fef3c7',
    nodeActiveStroke: isDark ? '#f59e0b' : '#d97706',

    nodeOptimalFill: isDark ? 'rgba(16, 185, 129, 0.22)' : '#ecfdf5',
    nodeOptimalStroke: isDark ? '#10b981' : '#059669',
  };

  const isCityInSubset = (cityId: number) => {
    return (currentMask & (1 << cityId)) !== 0;
  };

  const isEdgeInOptimalTour = (u: number, v: number) => {
    if (currentPhase !== 'reconstruct' && currentPhase !== 'complete') return false;
    return activeTourEdges.some(
      (e) => (e.u === u && e.v === v) || (e.u === v && e.v === u)
    );
  };

  const isEdgeCandidate = (u: number, v: number) => {
    return candidateEdges.find((c) => (c.u === u && c.v === v) || (c.u === v && c.v === u));
  };

  const isEdgeActive = (u: number, v: number) => {
    return activeTourEdges.some((e) => (e.u === u && e.v === v) || (e.u === v && e.v === u));
  };

  // Generate unique undirected pairs for background edge drawing
  const edgePairs: { u: number; v: number; weight: number }[] = [];
  for (let i = 0; i < numCities; i++) {
    for (let j = i + 1; j < numCities; j++) {
      edgePairs.push({
        u: i,
        v: j,
        weight: costMatrix[i]?.[j] ?? 0,
      });
    }
  }

  // Phase badge styles and labels
  const phaseDetails: Record<
    string,
    { label: string; color: string; bg: string; border: string }
  > = {
    init: {
      label: 'INIT GRAPH',
      color: 'text-chalk-400',
      bg: 'bg-obsidian-900',
      border: 'border-hairline',
    },
    base: {
      label: 'BASE CASE',
      color: 'text-amber-glow',
      bg: 'bg-amber/15',
      border: 'border-amber/40',
    },
    fill: {
      label: 'DYNAMIC PROGRAMMING FILL',
      color: 'text-electric-400',
      bg: 'bg-electric-500/15',
      border: 'border-electric-400/40',
    },
    close: {
      label: 'CYCLE CLOSING (➔ START)',
      color: 'text-amber-glow',
      bg: 'bg-amber/20',
      border: 'border-amber',
    },
    reconstruct: {
      label: 'PATH BACKTRACKING',
      color: 'text-acid-500',
      bg: 'bg-acid-500/15',
      border: 'border-acid-500/40',
    },
    complete: {
      label: 'OPTIMAL CYCLE VERIFIED',
      color: 'text-acid-500',
      bg: 'bg-acid-500/20',
      border: 'border-acid-500',
    },
  };

  const currentPhaseInfo = phaseDetails[currentPhase] || phaseDetails.fill;

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Visualizer Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-obsidian-950 border border-hairline rounded-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-amber/15 border border-amber/30 text-amber-glow rounded">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-xs text-chalk-100 uppercase tracking-wider">
              Held-Karp Dynamic Programming Tour
            </h3>
            <p className="text-[11px] text-chalk-400 font-mono">
              Solving TSP on {numCities} cities with exact bitmask state memoization
            </p>
          </div>
        </div>

        {/* Top Control Buttons: Edit Distances & View DP Table */}
        <div className="flex items-center gap-2">
          {onApplyInputs && (
            <button
              onClick={() => setShowDistanceEditor((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-semibold rounded border transition-all duration-150 ${
                showDistanceEditor
                  ? 'bg-amber/20 border-amber text-amber-glow shadow-sm'
                  : 'bg-obsidian-900 border-hairline text-chalk-300 hover:text-chalk-100 hover:bg-obsidian-850'
              }`}
              title="Edit City Distances & Vertices"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber" />
              <span>{showDistanceEditor ? 'Hide Distance Editor' : 'Edit Distances'}</span>
            </button>
          )}

          <button
            onClick={() => setShowDpMatrix((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-semibold rounded border transition-all duration-150 ${
              showDpMatrix
                ? 'bg-amber/20 border-amber text-amber-glow shadow-sm'
                : 'bg-obsidian-900 border-hairline text-chalk-300 hover:text-chalk-100 hover:bg-obsidian-850'
            }`}
            title="Toggle Held-Karp DP State Matrix"
          >
            <Table className="w-3.5 h-3.5" />
            <span>{showDpMatrix ? 'Hide DP Table' : 'View DP Table'}</span>
          </button>
        </div>
      </div>

      {/* User-Configurable Distance Matrix Drawer */}
      {showDistanceEditor && onApplyInputs && (
        <div className="w-full transition-all duration-200">
          <TspDistanceMatrixEditor
            currentNumCities={numCities}
            currentCostMatrix={costMatrix}
            onApply={(newInputs) => {
              onApplyInputs(newInputs);
            }}
            onClose={() => setShowDistanceEditor(false)}
            presets={presets}
          />
        </div>
      )}

      {/* Main Visualization Workspace: Graph + DP Matrix */}
      <div
        className={`w-full ${
          showDpMatrix
            ? 'grid grid-cols-1 xl:grid-cols-12 gap-4 items-start'
            : 'flex flex-col items-center'
        }`}
      >
        {/* Left Column: Interactive Graph Visualizer */}
        <div
          className={`flex flex-col w-full bg-obsidian-950 border border-hairline rounded-sm shadow-md overflow-hidden ${
            showDpMatrix ? 'xl:col-span-7' : 'max-w-4xl mx-auto'
          }`}
        >
          {/* Graph Header Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-obsidian-900 border-b border-hairline text-xs font-mono">
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${currentPhaseInfo.bg} ${currentPhaseInfo.border} ${currentPhaseInfo.color}`}
              >
                {currentPhaseInfo.label}
              </span>
              <span className="text-chalk-400 text-[11px]">
                Subset: <strong className="text-chalk-200">{state.currentSubsetLabel || '{A}'}</strong>
              </span>
            </div>

            {optimalCost !== undefined && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-acid-500/15 border border-acid-500/30 text-acid-500 rounded font-bold text-[11px]">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Min Tour Cost = {optimalCost}</span>
              </div>
            )}
          </div>

          {/* SVG Graph Viewport */}
          <div className="relative w-full aspect-[5/4] sm:aspect-[4/3] bg-obsidian-950 flex items-center justify-center p-2">
            <svg
              viewBox="0 0 500 400"
              className="w-full h-full select-none"
              style={{ overflow: 'visible' }}
            >
              <defs>
                {/* Arrow markers for directed candidate / tour edges */}
                <marker
                  id="tsp-arrow-active"
                  viewBox="0 0 10 10"
                  refX="22"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={colors.edgeActive} />
                </marker>
                <marker
                  id="tsp-arrow-candidate"
                  viewBox="0 0 10 10"
                  refX="22"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={colors.edgeCandidate} />
                </marker>
                <marker
                  id="tsp-arrow-optimal"
                  viewBox="0 0 10 10"
                  refX="23"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 9 5 L 0 9 z" fill={colors.edgeOptimal} />
                </marker>

                {/* Drop shadow filter for active nodes */}
                <filter id="tsp-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#f59e0b" floodOpacity="0.4" />
                </filter>
                <filter id="tsp-optimal-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#10b981" floodOpacity="0.5" />
                </filter>
              </defs>

              {/* 1. Background Edges & Weights */}
              {edgePairs.map((edge) => {
                const uCity = cities[edge.u];
                const vCity = cities[edge.v];
                if (!uCity || !vCity) return null;

                const isOptimal = isEdgeInOptimalTour(edge.u, edge.v);
                const isActive = isEdgeActive(edge.u, edge.v);
                const cand = isEdgeCandidate(edge.u, edge.v);

                // Midpoint for label
                const mx = (uCity.x + vCity.x) / 2;
                const my = (uCity.y + vCity.y) / 2;

                let strokeColor = colors.edgeInactive;
                let strokeWidth = 1.5;
                let strokeDasharray = undefined;

                if (isOptimal) {
                  strokeColor = colors.edgeOptimal;
                  strokeWidth = 3.5;
                } else if (isActive) {
                  strokeColor = colors.edgeActive;
                  strokeWidth = 3;
                } else if (cand) {
                  strokeColor = cand.isChosen ? colors.edgeActive : colors.edgeCandidate;
                  strokeWidth = 2.5;
                  strokeDasharray = cand.isChosen ? undefined : '5,3';
                }

                return (
                  <g key={`edge-${edge.u}-${edge.v}`}>
                    <line
                      x1={uCity.x}
                      y1={uCity.y}
                      x2={vCity.x}
                      y2={vCity.y}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray={strokeDasharray}
                      className="transition-colors duration-200"
                    />

                    {/* Edge Cost Pill */}
                    <g transform={`translate(${mx}, ${my})`}>
                      <rect
                        x="-13"
                        y="-9"
                        width="26"
                        height="18"
                        rx="4"
                        fill={colors.canvasBg}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth > 2 ? '1.5' : '1'}
                      />
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        className="font-mono text-[11px] font-bold select-none pointer-events-none"
                        fill={isOptimal ? colors.edgeOptimal : cand ? strokeColor : colors.edgeText}
                      >
                        {edge.weight}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* 2. Active Candidate Directed Arrows (during fill phase) */}
              {candidateEdges.map((cand) => {
                const uCity = cities[cand.u];
                const vCity = cities[cand.v];
                if (!uCity || !vCity) return null;

                return (
                  <line
                    key={`cand-arrow-${cand.u}-${cand.v}`}
                    x1={uCity.x}
                    y1={uCity.y}
                    x2={vCity.x}
                    y2={vCity.y}
                    stroke={cand.isChosen ? colors.edgeActive : colors.edgeCandidate}
                    strokeWidth={cand.isChosen ? 3 : 2}
                    markerEnd={cand.isChosen ? 'url(#tsp-arrow-active)' : 'url(#tsp-arrow-candidate)'}
                    className="transition-all duration-150"
                  />
                );
              })}

              {/* 3. Optimal Tour Directed Arrows (during reconstruct & complete) */}
              {(currentPhase === 'reconstruct' || currentPhase === 'complete') &&
                activeTourEdges.map((e, idx) => {
                  const uCity = cities[e.u];
                  const vCity = cities[e.v];
                  if (!uCity || !vCity) return null;

                  return (
                    <line
                      key={`tour-dir-${e.u}-${e.v}-${idx}`}
                      x1={uCity.x}
                      y1={uCity.y}
                      x2={vCity.x}
                      y2={vCity.y}
                      stroke={colors.edgeOptimal}
                      strokeWidth={3.5}
                      markerEnd="url(#tsp-arrow-optimal)"
                      className="transition-all duration-200"
                    />
                  );
                })}

              {/* 4. City Vertex Nodes */}
              {cities.map((city) => {
                const isStart = city.id === 0;
                const isCurrent =
                  (currentPhase === 'fill' && city.id === currentCity) ||
                  (currentPhase === 'base' && city.id === 0) ||
                  (currentPhase === 'close' && city.id === 0);
                const isCandidatePred = candidateEdges.some((c) => c.u === city.id);
                const inSubset = isCityInSubset(city.id);
                const isOptimalNode =
                  (currentPhase === 'reconstruct' || currentPhase === 'complete') &&
                  optimalTour.includes(city.id);

                let fill = colors.nodeUnvisitedFill;
                let stroke = colors.nodeUnvisitedStroke;
                let textColor = colors.nodeUnvisitedText;
                let strokeWidth = 2;
                let filter = undefined;

                if (isOptimalNode) {
                  fill = colors.nodeOptimalFill;
                  stroke = colors.nodeOptimalStroke;
                  strokeWidth = 3;
                  filter = 'url(#tsp-optimal-glow)';
                } else if (isCurrent) {
                  fill = colors.nodeActiveFill;
                  stroke = colors.nodeActiveStroke;
                  strokeWidth = 3;
                  filter = 'url(#tsp-glow)';
                } else if (isCandidatePred) {
                  fill = colors.nodeInSubsetFill;
                  stroke = colors.edgeCandidate;
                  strokeWidth = 2.5;
                } else if (inSubset) {
                  fill = colors.nodeInSubsetFill;
                  stroke = colors.nodeInSubsetStroke;
                  strokeWidth = 2;
                }

                return (
                  <g
                    key={`city-${city.id}`}
                    transform={`translate(${city.x}, ${city.y})`}
                    className="cursor-pointer transition-transform duration-150 hover:scale-110"
                  >
                    {/* Outer pulse ring for active or start city */}
                    {isCurrent && (
                      <circle
                        r="31"
                        fill="none"
                        stroke={colors.nodeActiveStroke}
                        strokeWidth="1.5"
                        strokeDasharray="4,3"
                        className="animate-spin"
                        style={{ transformOrigin: '0 0', animationDuration: '8s' }}
                      />
                    )}

                    {isStart && !isCurrent && (
                      <circle
                        r="29"
                        fill="none"
                        stroke={colors.edgeText}
                        strokeWidth="1.2"
                        strokeDasharray="2,2"
                      />
                    )}

                    {/* Main Node Circle */}
                    <circle
                      r="22"
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={strokeWidth}
                      filter={filter}
                      className="transition-all duration-150"
                    />

                    {/* City Label */}
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="font-mono text-sm font-bold select-none pointer-events-none"
                      fill={textColor}
                    >
                      {city.label}
                    </text>

                    {/* Start City Badge */}
                    {isStart && (
                      <g transform="translate(0, -28)">
                        <rect
                          x="-18"
                          y="-7"
                          width="36"
                          height="14"
                          rx="3"
                          fill={isDark ? '#1e293b' : '#f1f5f9'}
                          stroke={isDark ? '#475569' : '#94a3b8'}
                          strokeWidth="1"
                        />
                        <text
                          textAnchor="middle"
                          dominantBaseline="central"
                          className="font-mono text-[9px] font-bold uppercase tracking-wider"
                          fill={isDark ? '#f8fafc' : '#0f172a'}
                        >
                          START
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Graph Footer Legend */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-obsidian-900 border-t border-hairline text-[11px] font-mono text-chalk-400">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber" />
                <span>Base: City {cities[0]?.label || 'A'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-electric-500/30 border border-electric-400 inline-block" />
                <span>In Subset S</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-acid-500/30 border border-acid-500 inline-block" />
                <span>Optimal Tour</span>
              </div>
            </div>

            {optimalTour.length > 0 && (
              <div className="text-acid-500 font-bold">
                Cycle: {optimalTour.map((idx) => cities[idx]?.label).join(' ➔ ')}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Dynamic Programming State Matrix Pane */}
        {showDpMatrix && (
          <div className="flex flex-col w-full xl:col-span-5">
            <TspDpMatrix step={step} onClose={() => setShowDpMatrix(false)} />
          </div>
        )}
      </div>
    </div>
  );
};
