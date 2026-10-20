import React from 'react';
import { StoryStage, StorySceneProps } from './StoryStage';
import { useAnimPhases, useProgress } from './useAnimPhases';

/**
 * 🏭 Assembly Line Scheduling as a car factory with two conveyor belts.
 *
 * Each station takes some minutes of work; a car can stay on its belt or be moved by
 * forklift to the other belt (which takes extra minutes). For every station, two ghost
 * cars race there: one that stayed on this belt and one that switched over. The faster
 * one parks with its stopwatch time. At the end the quickest route through the factory
 * lights up in gold.
 */

const SX = 150;
const GAPX = 130;
const Y1 = 110;
const Y2 = 300;
const GOLD = '#f59e0b';

const Car: React.FC<{ x: number; y: number; ghost?: boolean; colour?: string }> = ({ x, y, ghost, colour = '#dc2626' }) => (
  <g transform={`translate(${x}, ${y})`} opacity={ghost ? 0.55 : 1}>
    <rect x="-20" y="-12" width="40" height="13" rx="4" fill={colour} stroke="#1c1917" strokeWidth="1.2" />
    <path d="M -12 -12 L -7 -21 L 8 -21 L 13 -12 Z" fill={colour} stroke="#1c1917" strokeWidth="1.2" />
    <rect x="-6" y="-19" width="5" height="6" fill="#e0f2fe" />
    <rect x="1" y="-19" width="6" height="6" fill="#e0f2fe" />
    <circle cx="-11" cy="2" r="4.5" fill="#1c1917" />
    <circle cx="11" cy="2" r="4.5" fill="#1c1917" />
  </g>
);

export const CarFactoryScene: React.FC<StorySceneProps> = ({ step, stepMs }) => {
  const st: any = step.state || {};
  const n: number = st.numStations ?? (st.a1 || []).length;
  const a = [st.a1 || [], st.a2 || []] as number[][];
  const t = [st.t1 || [], st.t2 || []] as number[][];
  const e = [st.e1 ?? 0, st.e2 ?? 0];
  const xx = [st.x1 ?? 0, st.x2 ?? 0];
  const f = [st.f1 || [], st.f2 || []] as (number | null)[][];
  const phaseName: string = st.phase || 'init';
  const j: number = st.currentStation ?? 0;
  const line: number = st.currentLine ?? 1;
  const path: { station: number; line: 1 | 2 }[] = st.optimalPath || [];

  const racing = phaseName === 'forward' && j > 0;
  const phases: readonly (readonly [string, number])[] = racing ? [['race', 0], ['park', 0.6]] : [['idle', 0]];
  const phase = useAnimPhases(step.stepIndex, phases, stepMs);
  const prog = useProgress(phase === 'race', stepMs * 0.5, `race-${step.stepIndex}`);

  const sx = (s: number) => SX + s * GAPX;
  const ly = (l: number) => (l === 1 ? Y1 : Y2);
  const width = SX + (n - 1) * GAPX + 170;
  const height = Y2 + 90;

  // The race into station j on `line`.
  const L = line - 1;
  const O = 1 - L;
  const stayTime = racing ? (f[L][j - 1] ?? 0) + a[L][j] : 0;
  const switchTime = racing ? (f[O][j - 1] ?? 0) + (t[O][j - 1] ?? 0) + a[L][j] : 0;
  const stayWins = stayTime <= switchTime;

  const known = (l: number, s: number) => {
    if (racing && s === j && l === line && phase === 'race') return null;
    return f[l - 1][s];
  };
  const onPath = (l: number, s: number) => path.some((p) => p.line === l && p.station === s + 1);
  const goldSegments = (st.activeSegments || []) as { fromStation: number; fromLine: number; toStation: number; toLine: number }[];

  const narration = (() => {
    switch (phaseName) {
      case 'init':
        return `Two conveyor belts build the same car. Each station takes some minutes; a forklift can move the car to the other belt, which also takes time. Getting onto belt 1 takes ${e[0]} min and onto belt 2 takes ${e[1]} min, so the first stations are ready at ${f[0][0]} and ${f[1][0]}.`;
      case 'forward':
        if (!racing) return step.title;
        return phase === 'race'
          ? `Station ${j + 1} on belt ${line}: race! One car stays on belt ${line} (${stayTime} min); the other switches over from belt ${O + 1} by forklift (${switchTime} min).`
          : `${stayWins ? 'Staying' : 'Switching'} is faster: the car parks at station ${j + 1} after ${Math.min(stayTime, switchTime)} minutes.`;
      case 'exit': {
        const out1 = (f[0][n - 1] ?? 0) + xx[0];
        const out2 = (f[1][n - 1] ?? 0) + xx[1];
        return `Last stretch to the exit: from belt 1 the car is done at ${out1} min, from belt 2 at ${out2} min. Belt ${st.winningLine} wins with ${st.minTotalTime} minutes!`;
      }
      case 'backtrack':
        return `Follow the winning car backwards: at each station, which belt did the fastest car come from? The route lights up in gold.`;
      case 'complete':
        return `The fastest route through the factory takes ${st.minTotalTime} minutes (gold). Every other route is slower.`;
      default:
        return step.title;
    }
  })();

  const ghost = (fromLine: number, viaRamp: boolean) => {
    const x0 = sx(j - 1);
    const y0 = ly(fromLine);
    const x1 = sx(j);
    const y1 = ly(line);
    const p = Math.min(1, prog);
    const x = x0 + (x1 - x0) * p;
    const y = viaRamp ? y0 + (y1 - y0) * p : y0;
    return <Car key={`g-${fromLine}`} x={x} y={y + 38} ghost colour="#78716c" />;
  };

  return (
    <StoryStage
      emoji="🏭"
      title="The Car Factory"
      subtitle="Stay on your belt or take the forklift across. Each station keeps only the fastest car."
      narration={narration}
      status={st.minTotalTime !== undefined ? `Fastest route • ${st.minTotalTime} min` : `Station • ${j + 1} of ${n}`}
    >
      <svg viewBox={`0 0 ${width} ${height}`} className="block mx-auto w-full h-auto overflow-visible" style={{ maxWidth: width * 1.15 }} role="img" aria-label="Car factory">
        <rect x="0" y="0" width={width} height={height} rx="18" fill="#f5efe6" />

        {/* entry and exit */}
        <text x="34" y={(Y1 + Y2) / 2 + 8} textAnchor="middle" fontSize="28">
          🚪
        </text>
        <text x={sx(n - 1) + 120} y={(Y1 + Y2) / 2 + 8} textAnchor="middle" fontSize="28">
          🏁
        </text>
        {[0, 1].map((l) => (
          <g key={`io-${l}`}>
            <line x1="52" y1={(Y1 + Y2) / 2} x2={sx(0) - 40} y2={ly(l + 1)} stroke="#a8a29e" strokeWidth="5" strokeDasharray="8 6" />
            <text x={(52 + sx(0) - 40) / 2} y={((Y1 + Y2) / 2 + ly(l + 1)) / 2 + (l ? 18 : -8)} fontSize="11" fontWeight="700" fill="#57534e">
              {e[l]} min
            </text>
            <line x1={sx(n - 1) + 40} y1={ly(l + 1)} x2={sx(n - 1) + 104} y2={(Y1 + Y2) / 2} stroke={phaseName !== 'forward' && phaseName !== 'init' && st.winningLine === l + 1 ? GOLD : '#a8a29e'} strokeWidth="5" strokeDasharray="8 6" />
            <text x={sx(n - 1) + 72} y={((Y1 + Y2) / 2 + ly(l + 1)) / 2 + (l ? 18 : -8)} fontSize="11" fontWeight="700" fill="#57534e">
              {xx[l]} min
            </text>
          </g>
        ))}

        {/* belts */}
        {[1, 2].map((l) => (
          <g key={`belt-${l}`}>
            <rect x={sx(0) - 44} y={ly(l) - 6} width={sx(n - 1) - sx(0) + 88} height="14" rx="7" fill="#57534e" />
            <line x1={sx(0) - 40} y1={ly(l) + 1} x2={sx(n - 1) + 40} y2={ly(l) + 1} stroke="#a8a29e" strokeWidth="2" strokeDasharray="6 6" className="animate-flow-dash" />
            <text x={sx(0) - 52} y={ly(l) + 5} textAnchor="end" fontSize="12" fontWeight="800" fill="#44403c">
              belt {l}
            </text>
          </g>
        ))}

        {/* forklift ramps between belts */}
        {Array.from({ length: n - 1 }, (_, s) => (
          <g key={`ramp-${s}`}>
            {[0, 1].map((l) => {
              const from = { x: sx(s) + 30, y: ly(l + 1) + (l === 0 ? 14 : -14) };
              const to = { x: sx(s + 1) - 30, y: ly(2 - l) + (l === 0 ? -14 : 14) };
              const gold = goldSegments.some((g) => g.fromStation === s + 1 && g.fromLine === l + 1 && g.toLine !== g.fromLine);
              return (
                <g key={l}>
                  <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={gold ? GOLD : '#d6d3d1'} strokeWidth={gold ? 6 : 3} strokeDasharray={gold ? undefined : '4 5'} />
                  <text x={(from.x + to.x) / 2 + (l === 0 ? -16 : 16)} y={(from.y + to.y) / 2 + (l === 0 ? -6 : 14)} textAnchor="middle" fontSize="10" fontWeight="700" fill="#78716c">
                    🚜 {t[l][s]}
                  </text>
                </g>
              );
            })}
          </g>
        ))}

        {/* stations with parked cars */}
        {[1, 2].map((l) =>
          Array.from({ length: n }, (_, s) => {
            const done = known(l, s);
            const isNow = racing && s === j && l === line;
            const gold = onPath(l, s) && (phaseName === 'backtrack' || phaseName === 'complete');
            return (
              <g key={`st-${l}-${s}`}>
                <rect x={sx(s) - 36} y={ly(l) - 60} width="72" height="46" rx="8" fill={gold ? '#fef3c7' : '#ffffff'} stroke={gold ? GOLD : isNow ? '#ea580c' : '#78716c'} strokeWidth={gold || isNow ? 4 : 2} />
                <text x={sx(s) - 20} y={ly(l) - 31} fontSize="15">
                  ⚙️
                </text>
                <text x={sx(s) + 12} y={ly(l) - 31} textAnchor="middle" fontSize="12" fontWeight="800" fill="#44403c">
                  {a[l - 1][s]}m
                </text>
                {done !== null && done !== undefined && (
                  <g className={isNow ? 'animate-story-pop' : undefined}>
                    <Car x={sx(s)} y={ly(l) + (l === 1 ? 38 : 38)} colour={gold ? GOLD : '#dc2626'} />
                    <text x={sx(s)} y={ly(l) + 62} textAnchor="middle" fontSize="12" fontWeight="900" fill="#1c1917">
                      ⏱ {done}
                    </text>
                  </g>
                )}
              </g>
            );
          })
        )}

        {/* the race into the current station */}
        {racing && phase === "race" && (
          <g>
            {ghost(line, false)}
            {ghost(O + 1, true)}
          </g>
        )}
      </svg>
    </StoryStage>
  );
};
