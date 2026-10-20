import React from 'react';
import { StoryStage, StorySceneProps } from './StoryStage';

/**
 * 🧑‍💼 The Hiring Problem as an interview room.
 *
 * Candidates wait in line with hidden skill. Each one is interviewed (a small coin into
 * the interview jar). If they beat the person at the desk, they are hired on the spot —
 * the old employee leaves with a box, and a big coin goes into the hiring jar. Shuffling
 * the line first makes it very unlikely that we keep hiring over and over.
 */

const Meter: React.FC<{ score: number; max: number; tone: string }> = ({ score, max, tone }) => (
  <div className="flex items-center gap-1.5">
    <div className="w-20 h-2.5 rounded-full bg-stone-200 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(score / Math.max(1, max)) * 100}%`, background: tone }} />
    </div>
    <span className="text-xs font-black text-stone-800">{score}</span>
  </div>
);

const Jar: React.FC<{ label: string; coins: number; big?: boolean; total: number }> = ({ label, coins, big, total }) => (
  <div className="flex flex-col items-center gap-1">
    <div className="relative w-20 h-24 rounded-b-2xl rounded-t-md border-2 border-sky-300 bg-sky-50/70 flex flex-wrap-reverse content-start justify-center gap-0.5 p-1.5 overflow-visible">
      <div className="absolute -top-2 left-2 right-2 h-2.5 rounded-sm bg-amber-700" />
      {Array.from({ length: Math.min(coins, 24) }, (_, k) => (
        <span key={k} className={`${big ? 'w-4 h-4' : 'w-2.5 h-2.5'} rounded-full bg-yellow-400 border border-yellow-700`} />
      ))}
    </div>
    <span className="text-[11px] font-bold text-stone-600">{label}</span>
    <span className="text-sm font-black text-stone-900">{total}</span>
  </div>
);

export const InterviewRoomScene: React.FC<StorySceneProps> = ({ step }) => {
  const st: any = step.state || {};
  const scores: number[] = st.array || [];
  const n = scores.length;
  const i: number = st.currentIndex ?? -1;
  const phase: string = st.phase || 'init';
  const hired: number[] = st.hiredIndices || [];
  const best: number | undefined = st.currentBestIndex;
  const ci: number = st.interviewCost ?? 1;
  const ch: number = st.hiringCost ?? 5;
  const decision: string | undefined = st.currentDecision;
  const max = Math.max(1, ...scores);

  const interviewed = phase === 'complete' ? n : Math.max(0, i + 1);
  // At the interview step the hire hasn't happened yet: the desk still has the previous best.
  const atDesk = phase === 'interview' ? hired.filter((h) => h !== i).slice(-1)[0] : best;
  const waiting = scores.map((s, k) => ({ s, k })).filter(({ k }) => k > i && phase !== 'complete');
  const leftWithBox = hired.filter((h) => h !== atDesk && !(phase === 'interview' && h === i));
  const wentHome = scores.map((_, k) => k).filter((k) => k < i && !hired.includes(k));

  const narration = (() => {
    switch (phase) {
      case 'init':
        return `${n} candidates wait in line. We interview them one by one (${ci} coin each). Whenever someone is better than the person at the desk, we hire them right away (${ch} coins each). How often will we end up hiring?`;
      case 'interview':
        return `Interview candidate ${i + 1}: skill ${st.currentScore}. ${atDesk === undefined ? 'The desk is empty.' : `The person at the desk has skill ${scores[atDesk]}.`}`;
      case 'decision':
        return decision === 'hire'
          ? `Better than everyone so far: hire them! ${hired.length > 1 ? 'The old employee packs a box and leaves. ' : ''}${ch} coins go into the hiring jar.`
          : `Not better than the person at the desk, so they go home. Only the interview coin is spent.`;
      case 'complete':
        return `All ${n} interviewed and ${hired.length} hired. Hiring is the expensive part; if the line is in random order, we expect only about ln ${n} ≈ ${Math.log(n).toFixed(1)} hires.`;
      default:
        return step.title;
    }
  })();

  return (
    <StoryStage
      emoji="💼"
      title="The Interview Room"
      subtitle="Interview everyone; hire whenever someone beats the person at the desk."
      narration={narration}
      status={`Spent • ${interviewed * ci + hired.length * ch} coins`}
    >
      <div className="flex flex-col gap-4 font-sans">
        <div className="flex flex-col md:flex-row items-stretch gap-4">
          {/* desk and interview chair */}
          <div className="flex-1 flex items-end justify-center gap-6 p-4 rounded-2xl bg-[#efe3d3] border-2 border-[#d5be9f]">
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">At the desk</span>
              {atDesk !== undefined ? (
                <div key={`desk-${atDesk}`} className="flex flex-col items-center gap-1 animate-story-pop">
                  <span className="text-4xl">😎</span>
                  <span className="text-xs font-bold text-stone-700">Candidate {atDesk + 1}</span>
                  <Meter score={scores[atDesk]} max={max} tone="#16a34a" />
                </div>
              ) : (
                <span className="text-4xl opacity-30">🪑</span>
              )}
              <div className="w-28 h-3 rounded bg-[#8b5a2b] mt-1" />
            </div>
            {phase === 'interview' && i >= 0 && (
              <div className="flex flex-col items-center gap-1 animate-story-pop">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Interviewing</span>
                <span className="text-4xl">🙋</span>
                <span className="text-xs font-bold text-stone-700">Candidate {i + 1}</span>
                <Meter score={scores[i]} max={max} tone="#f59e0b" />
              </div>
            )}
            {phase === 'decision' && decision === 'skip' && (
              <div className="flex flex-col items-center gap-1 opacity-70">
                <span className="text-4xl">👋</span>
                <span className="text-xs font-bold text-stone-600">Candidate {i + 1} goes home</span>
              </div>
            )}
          </div>

          {/* jars */}
          <div className="flex items-end justify-center gap-4 p-3">
            <Jar label={`interviews × ${ci}`} coins={interviewed} total={interviewed * ci} />
            <Jar label={`hires × ${ch}`} coins={hired.length} big total={hired.length * ch} />
          </div>
        </div>

        {/* the waiting line and who has left */}
        <div className="flex flex-wrap items-start gap-6 justify-center text-xs">
          <div className="flex flex-col items-center gap-1">
            <span className="font-semibold uppercase tracking-wider text-stone-500">Waiting in line</span>
            <div className="flex gap-1">
              {waiting.length === 0 && <span className="italic text-stone-400">nobody</span>}
              {waiting.map(({ k }) => (
                <span key={k} className="flex flex-col items-center">
                  <span className="text-2xl">🧍</span>
                  <span className="font-bold text-stone-500">{k + 1}</span>
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="font-semibold uppercase tracking-wider text-stone-500">Hired, then replaced</span>
            <div className="flex gap-1">
              {leftWithBox.length === 0 && <span className="italic text-stone-400">nobody</span>}
              {leftWithBox.map((k) => (
                <span key={k} className="flex flex-col items-center">
                  <span className="text-2xl">📦</span>
                  <span className="font-bold text-stone-500">{k + 1}</span>
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="font-semibold uppercase tracking-wider text-stone-500">Went home</span>
            <div className="flex gap-1 flex-wrap max-w-[220px] justify-center">
              {wentHome.length === 0 && <span className="italic text-stone-400">nobody</span>}
              {wentHome.map((k) => (
                <span key={k} className="flex flex-col items-center opacity-70">
                  <span className="text-2xl">🚶</span>
                  <span className="font-bold text-stone-500">{k + 1}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </StoryStage>
  );
};
