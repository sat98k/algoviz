import React from 'react';
import { StoryStage, StorySceneProps } from './StoryStage';
import { ContactShadow, PALETTE, Room, SceneDefs, tint, useSvgIds } from './kit/materials';
import { HairStyle, Person, personTop } from './kit/Person';
import { useChapter } from './kit/chapter';

/**
 * 🧑‍💼 The Hiring Problem as an interview room.
 *
 * Candidates wait in line with hidden skill. Each one is interviewed (a small coin into
 * the interview jar). If they beat the person at the desk, they are hired on the spot —
 * the old employee leaves with a box, and a big coin goes into the hiring jar. Shuffling
 * the line first makes it very unlikely that we keep hiring over and over.
 */

const F = { fontFamily: '"Red Hat Display", system-ui, sans-serif' };
const SKINS = PALETTE.skins;
const look = (k: number) => ({
  skin: SKINS[(k * 3 + 1) % SKINS.length],
  hair: PALETTE.hair[(k * 2 + 1) % PALETTE.hair.length],
  hairStyle: ((k * 7) % 5) as HairStyle,
  shirt: PALETTE.fabrics[(k * 3 + 2) % PALETTE.fabrics.length],
});

/** A skill bar on a little card, with the score. */
const Skill: React.FC<{ x: number; y: number; score: number; max: number; tone: string; label: string }> = ({ x, y, score, max, tone, label }) => (
  <g transform={`translate(${x}, ${y})`}>
    <rect x="-56" y="-14" width="112" height="40" rx="12" fill="#fbf9f4" stroke="#e3dccd" />
    <text x="-46" y="0" fontSize="12" fontWeight="900" fill={PALETTE.ink} style={F}>
      {label}
    </text>
    <rect x="-46" y="8" width="70" height="8" rx="4" fill="#e3dccd" />
    <rect x="-46" y="8" width={(70 * score) / Math.max(1, max)} height="8" rx="4" fill={tone} style={{ transition: 'width 0.7s var(--ease-move)' }} />
    <text x="40" y="16" textAnchor="middle" fontSize="13" fontWeight="900" fill={PALETTE.ink} style={F}>
      {score}
    </text>
  </g>
);

/** A glass jar of coins on the shelf; `big` coins are hiring coins. */
const Jar: React.FC<{ x: number; y: number; coins: number; big?: boolean; label: string; total: number }> = ({ x, y, coins, big, label, total }) => {
  const r = big ? 7 : 4.5;
  const per = big ? 4 : 6;
  return (
    <g transform={`translate(${x}, ${y})`}>
      <ellipse cx="0" cy="2" rx="38" ry="5" fill="#3a2414" opacity="0.14" />
      <rect x="-34" y="-92" width="68" height="94" rx="16" fill="#eef6fb" fillOpacity="0.85" stroke="#9fb3c2" strokeWidth="1.6" />
      {Array.from({ length: Math.min(coins, big ? 24 : 54) }, (_, k) => (
        <g key={k} transform={`translate(${-24 + (k % per) * ((48) / (per - 1))}, ${-r - 2 - Math.floor(k / per) * (r * 1.7)})`}>
          <ellipse rx={r} ry={r * 0.6} fill="#9a6416" cy="1" />
          <ellipse rx={r} ry={r * 0.6} fill={PALETTE.gold} />
        </g>
      ))}
      <rect x="-30" y="-88" width="6" height="82" rx="3" fill="#ffffff" opacity="0.7" />
      <rect x="-28" y="-100" width="56" height="11" rx="4" fill="#8a5a35" />
      <text y="22" textAnchor="middle" fontSize="12" fontWeight="700" fill="#4a463e">
        {label}
      </text>
      <text y="40" textAnchor="middle" fontSize="16" fontWeight="900" fill={PALETTE.ink} style={F}>
        {total}
      </text>
    </g>
  );
};

/** A cardboard box held at the chest. */
const Box: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x}, ${y})`}>
    <rect x="-13" y="-10" width="26" height="20" rx="2" fill="#c99a62" />
    <rect x="-13" y="-10" width="26" height="5" fill="#b07a4a" />
    <path d="M-4 -10 V-5 M4 -10 V-5" stroke="#8a5a35" strokeWidth="1.2" />
  </g>
);

export const InterviewRoomScene: React.FC<StorySceneProps> = ({ step }) => {
  const ids = useSvgIds();
  const field = useChapter();
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

  const W = 780;
  const FLOOR = 250;
  const DESK_X = 210;
  const CHAIR_X = 360;
  const smallX = (k: number, start: number) => start + k * 34;

  return (
    <StoryStage
      title="The Interview Room"
      subtitle="Interview everyone; hire whenever someone beats the person at the desk."
      narration={narration}
      status={`Spent • ${interviewed * ci + hired.length * ch} coins`}
    >
      <svg viewBox={`0 0 ${W} 420`} className="block mx-auto w-full h-auto overflow-visible" style={{ maxWidth: W * 1.2 }} role="img" aria-label="Interview room">
        <SceneDefs ids={ids} floor={field.bg} />
        <Room ids={ids} width={W} floorY={FLOOR} depth={170} floor={field.bg} />
        {/* a window and a framed picture on the wall */}
        <rect x="40" y="26" width="110" height="80" rx="10" fill="#dff1ff" stroke="#c9b48f" strokeWidth="6" />
        <path d="M95 26 V106 M40 66 H150" stroke="#c9b48f" strokeWidth="4" />

        {/* the person at the desk */}
        {atDesk !== undefined ? (
          <g key={`desk-${atDesk}`} transform={`translate(${DESK_X}, ${FLOOR})`} className="animate-story-pop">
            <Person height={150} {...look(atDesk)} number={atDesk + 1} />
          </g>
        ) : (
          <g transform={`translate(${DESK_X}, ${FLOOR})`}>
            <rect x="-20" y="-96" width="40" height="44" rx="10" fill="#6e4426" opacity="0.5" />
          </g>
        )}
        {/* the desk in front of them */}
        <g transform={`translate(${DESK_X}, ${FLOOR})`}>
          <ContactShadow ids={ids} cy={2} rx={84} />
          <rect x="-80" y="-70" width="160" height="16" rx="6" fill="#a8743f" />
          <rect x="-80" y="-70" width="160" height="5" rx="2.5" fill="#d1a36a" />
          <rect x="-72" y="-54" width="144" height="54" rx="4" fill="#8a5a35" />
          <rect x="-60" y="-44" width="40" height="14" rx="3" fill="#a8743f" />
          <circle cx="-40" cy="-37" r="2" fill={PALETTE.goldLight} />
        </g>
        {atDesk !== undefined && <Skill x={DESK_X} y={FLOOR - 230} score={scores[atDesk]} max={max} tone="#0c8030" label={`At the desk: ${atDesk + 1}`} />}

        {/* the interview chair */}
        <g transform={`translate(${CHAIR_X}, ${FLOOR})`}>
          <ContactShadow ids={ids} cy={2} rx={34} />
          {phase === 'interview' && i >= 0 && (
            <g key={`int-${i}`} className="animate-story-pop">
              <Person height={140} {...look(i)} number={i + 1} />
            </g>
          )}
          <rect x="-26" y="-58" width="52" height="10" rx="5" fill="#3f78b5" />
          <path d="M-22 -48 V0 M22 -48 V0" stroke="#4a5560" strokeWidth="4" strokeLinecap="round" />
        </g>
        {phase === 'interview' && i >= 0 && <Skill x={CHAIR_X} y={FLOOR + personTop(140) - 40} score={scores[i]} max={max} tone={PALETTE.gold} label={`Interviewing: ${i + 1}`} />}
        {phase === 'decision' && decision === 'skip' && i >= 0 && (
          <g transform={`translate(${CHAIR_X + 50}, ${FLOOR})`} opacity="0.75" className="animate-story-pop">
            <Person height={140} {...look(i)} number={i + 1} />
            <rect x="-62" y="16" width="124" height="22" rx="11" fill="#e3dccd" />
            <text y="31.5" textAnchor="middle" fontSize="12" fontWeight="800" fill="#3a3732">
              goes home
            </text>
          </g>
        )}

        {/* the coin jars on a shelf */}
        <rect x="520" y={FLOOR - 4} width="210" height="10" rx="5" fill="#8a5a35" />
        <Jar x={570} y={FLOOR - 4} coins={interviewed} total={interviewed * ci} label={`interviews × ${ci}`} />
        <Jar x={680} y={FLOOR - 4} coins={hired.length} big total={hired.length * ch} label={`hires × ${ch}`} />

        {/* the hallway: waiting line, replaced employees with boxes, people who went home */}
        {[
          ['Waiting in line', 30],
          ['Hired, then replaced', 300],
          ['Went home', 540],
        ].map(([label, x]) => (
          <text key={label as string} x={x as number} y={FLOOR + 74} fontSize="17" fontWeight="900" fill={tint(field.bg, -0.55)} style={F}>
            {label}
          </text>
        ))}
        {waiting.map(({ k }, idx) => (
          <g key={`w-${k}`} transform={`translate(${smallX(idx, 46)}, ${FLOOR + 150})`}>
            <Person height={62} {...look(k)} />
            <text y="20" textAnchor="middle" fontSize="16" fontWeight="900" fill={PALETTE.ink}>
              {k + 1}
            </text>
          </g>
        ))}
        {waiting.length === 0 && (
          <text x="30" y={FLOOR + 110} fontSize="16" fontStyle="italic" fill="#5c554c">
            nobody
          </text>
        )}
        {leftWithBox.map((k, idx) => (
          <g key={`b-${k}`} transform={`translate(${smallX(idx, 316)}, ${FLOOR + 150})`}>
            <Person height={62} {...look(k)} />
            <Box x={0} y={-28} />
            <text y="20" textAnchor="middle" fontSize="16" fontWeight="900" fill={PALETTE.ink}>
              {k + 1}
            </text>
          </g>
        ))}
        {leftWithBox.length === 0 && (
          <text x="300" y={FLOOR + 110} fontSize="16" fontStyle="italic" fill="#5c554c">
            nobody
          </text>
        )}
        {wentHome.map((k, idx) => (
          <g key={`h-${k}`} transform={`translate(${smallX(idx % 7, 556)}, ${FLOOR + 150 - Math.floor(idx / 7) * 0})`} opacity="0.7">
            <Person height={62} {...look(k)} />
            <text y="20" textAnchor="middle" fontSize="16" fontWeight="900" fill={PALETTE.ink}>
              {k + 1}
            </text>
          </g>
        ))}
        {wentHome.length === 0 && (
          <text x="540" y={FLOOR + 110} fontSize="16" fontStyle="italic" fill="#5c554c">
            nobody
          </text>
        )}
      </svg>
    </StoryStage>
  );
};
