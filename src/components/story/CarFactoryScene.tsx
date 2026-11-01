import React from 'react';
import { StoryStage, StorySceneProps } from './StoryStage';
import { useAnimPhases, useProgress } from './useAnimPhases';
import { PALETTE, tint, useSvgIds } from './kit/materials';
import { Flag } from './kit/props';
import { useChapter } from './kit/chapter';

/** A gear for a station's machine. */
const Gear: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x}, ${y})`}>
    {Array.from({ length: 8 }, (_, k) => (
      <rect key={k} x="-2" y="-9.5" width="4" height="5" rx="1" fill="#6b7680" transform={`rotate(${k * 45})`} />
    ))}
    <circle r="6.5" fill="#9aa8b4" />
    <circle r="2.5" fill="#4a5560" />
  </g>
);

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
const GOLD = '#e8a817';

const Car: React.FC<{ x: number; y: number; ghost?: boolean; colour?: string }> = ({ x, y, ghost, colour = '#d9473b' }) => (
  <g transform={`translate(${x}, ${y})`} opacity={ghost ? 0.5 : 1}>
    <ellipse cx="0" cy="7" rx="22" ry="3" fill="#3a2414" opacity="0.18" />
    <path d="M -21 0 Q -21 -12 -12 -12 L -8 -21 Q -6 -23 -3 -23 L 7 -23 Q 10 -23 12 -20 L 16 -12 Q 21 -11 21 -4 L 21 0 Z" fill={colour} />
    <path d="M -21 0 L 21 0 L 21 -4 Q 21 -7 18 -7 L -18 -7 Q -21 -7 -21 -4 Z" fill={tint(colour, -0.2)} />
    <path d="M -6 -20 L 0 -20 L 0 -13 L -9 -13 Z M 3 -20 L 9 -20 L 13 -13 L 3 -13 Z" fill="#dff1ff" />
    <path d="M -18 -9 H 17" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1.5" strokeLinecap="round" />
    {[-11, 11].map((cx) => (
      <g key={cx}>
        <circle cx={cx} cy="1" r="5" fill="#1a1a1a" />
        <circle cx={cx} cy="1" r="2" fill="#c9c2b2" />
      </g>
    ))}
  </g>
);

export const CarFactoryScene: React.FC<StorySceneProps> = ({ step, stepMs }) => {
  const ids = useSvgIds();
  const field = useChapter();
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
    return <Car key={`g-${fromLine}`} x={x} y={y + 38} ghost colour="#8a8273" />;
  };

  return (
    <StoryStage
      title="The Car Factory"
      subtitle="Stay on your belt or take the forklift across. Each station keeps only the fastest car."
      narration={narration}
      status={st.minTotalTime !== undefined ? `Fastest route • ${st.minTotalTime} min` : `Station • ${j + 1} of ${n}`}
    >
      <svg viewBox={`0 0 ${width} ${height}`} className="block mx-auto w-full h-auto overflow-visible" style={{ maxWidth: width * 1.15 }} role="img" aria-label="Car factory">
        <defs>
          <linearGradient id={`${ids}-concrete`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f0ebe1" />
            <stop offset="1" stopColor="#e2dacb" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width={width} height={height} rx="22" fill={`url(#${ids}-concrete)`} />
        {[Y1, Y2].map((y) => (
          <rect key={y} x="8" y={y - 82} width={width - 16} height="150" rx="16" fill={tint(field.bg, 0.8)} opacity="0.55" />
        ))}

        {/* entry and exit */}
        <g transform={`translate(34, ${(Y1 + Y2) / 2})`}>
          <rect x="-15" y="-22" width="30" height="40" rx="5" fill="#8a5a35" />
          <rect x="-11" y="-18" width="22" height="34" rx="3" fill="#b07a4a" />
          <circle cx="6" cy="0" r="2" fill={PALETTE.goldLight} />
        </g>
        <g transform={`translate(${sx(n - 1) + 116}, ${(Y1 + Y2) / 2 + 16})`}>
          <Flag size={34} checkered />
        </g>
        {[0, 1].map((l) => (
          <g key={`io-${l}`}>
            <line x1="52" y1={(Y1 + Y2) / 2} x2={sx(0) - 40} y2={ly(l + 1)} stroke="#b8ad98" strokeWidth="5" strokeDasharray="8 6" strokeLinecap="round" />
            <text x={(52 + sx(0) - 40) / 2} y={((Y1 + Y2) / 2 + ly(l + 1)) / 2 + (l ? 18 : -8)} fontSize="12" fontWeight="800" fill="#3a3732">
              {e[l]} min
            </text>
            <line x1={sx(n - 1) + 40} y1={ly(l + 1)} x2={sx(n - 1) + 104} y2={(Y1 + Y2) / 2} stroke={phaseName !== 'forward' && phaseName !== 'init' && st.winningLine === l + 1 ? GOLD : '#b8ad98'} strokeWidth="5" strokeDasharray="8 6" strokeLinecap="round" />
            <text x={sx(n - 1) + 72} y={((Y1 + Y2) / 2 + ly(l + 1)) / 2 + (l ? 18 : -8)} fontSize="12" fontWeight="800" fill="#3a3732">
              {xx[l]} min
            </text>
          </g>
        ))}

        {/* belts */}
        {[1, 2].map((l) => (
          <g key={`belt-${l}`}>
            <rect x={sx(0) - 44} y={ly(l) - 2} width={sx(n - 1) - sx(0) + 88} height="16" rx="8" fill="#3a2414" opacity="0.14" />
            <rect x={sx(0) - 44} y={ly(l) - 6} width={sx(n - 1) - sx(0) + 88} height="16" rx="8" fill="#3c3833" />
            <rect x={sx(0) - 44} y={ly(l) - 6} width={sx(n - 1) - sx(0) + 88} height="4" rx="2" fill="#6b655d" />
            {[sx(0) - 36, sx(n - 1) + 36].map((cx) => (
              <circle key={cx} cx={cx} cy={ly(l) + 2} r="6" fill="#9aa8b4" stroke="#4a5560" strokeWidth="1.5" />
            ))}
            <line x1={sx(0) - 28} y1={ly(l) + 3} x2={sx(n - 1) + 28} y2={ly(l) + 3} stroke="#8a8273" strokeWidth="2" strokeDasharray="6 6" className="animate-flow-dash" />
            <text x={sx(0) - 54} y={ly(l) + 7} textAnchor="end" fontSize="13" fontWeight="900" fill="#1a1a1a" style={{ fontFamily: '"Red Hat Display", system-ui, sans-serif' }}>
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
                  <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={gold ? GOLD : '#cfc6b4'} strokeWidth={gold ? 6 : 3} strokeDasharray={gold ? undefined : '4 5'} strokeLinecap="round" />
                  <g transform={`translate(${(from.x + to.x) / 2 + (l === 0 ? -18 : 18)}, ${(from.y + to.y) / 2 + (l === 0 ? -8 : 10)})`}>
                    <rect x="-22" y="-10" width="44" height="20" rx="10" fill="#fbf9f4" stroke={gold ? GOLD : '#cfc6b4'} strokeWidth="1.2" />
                    <rect x="-16" y="-4" width="9" height="7" rx="1.5" fill={PALETTE.gold} />
                    <path d="M-7 -4 V-8 M-7 -8 H-4" stroke="#4a5560" strokeWidth="1.4" strokeLinecap="round" />
                    <text x="6" y="4.5" textAnchor="middle" fontSize="11.5" fontWeight="800" fill="#3a3732">
                      {t[l][s]}
                    </text>
                  </g>
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
                <rect x={sx(s) - 36} y={ly(l) - 56} width="72" height="46" rx="12" fill="#3a2414" opacity="0.1" />
                <rect x={sx(s) - 36} y={ly(l) - 60} width="72" height="46" rx="12" fill={gold ? PALETTE.goldLight : '#fbf9f4'} stroke={gold ? GOLD : isNow ? '#c4501a' : '#cfc6b4'} strokeWidth={gold || isNow ? 4 : 1.5} />
                <Gear x={sx(s) - 16} y={ly(l) - 37} />
                <text x={sx(s) + 12} y={ly(l) - 32} textAnchor="middle" fontSize="13" fontWeight="900" fill="#1a1a1a" style={{ fontFamily: '"Red Hat Display", system-ui, sans-serif' }}>
                  {a[l - 1][s]}m
                </text>
                {done !== null && done !== undefined && (
                  <g className={isNow ? 'animate-story-pop' : undefined}>
                    <Car x={sx(s)} y={ly(l) + (l === 1 ? 38 : 38)} colour={gold ? GOLD : '#d9473b'} />
                    <g transform={`translate(${sx(s)}, ${ly(l) + 58})`}>
                      <rect x="-22" y="-10" width="44" height="20" rx="10" fill="#1a1a1a" />
                      <text textAnchor="middle" y="4.5" fontSize="12" fontWeight="900" fill="#f3efe6" style={{ fontFamily: '"Red Hat Display", system-ui, sans-serif' }}>
                        {done} min
                      </text>
                    </g>
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
