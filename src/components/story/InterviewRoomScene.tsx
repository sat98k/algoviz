import React, { useRef } from 'react';
import { StoryStage, StorySceneProps } from './StoryStage';
import { ContactShadow, PALETTE, Room, SceneDefs, tint, useSvgIds } from './kit/materials';
import { HairStyle, Person, personTop } from './kit/Person';
import { useChapter } from './kit/chapter';
import { useStepTimeline } from './kit/useStepTimeline';
import { gsap } from './kit/gsapSetup';

/**
 * 🧑‍💼 The Hiring Problem as an interview room.
 *
 * Candidates arrive and stand on numbered spots in the hallway. Before anyone is interviewed
 * the line is shuffled: everyone walks to a random spot, and the spot numbers become the order
 * of interviews. Each one then walks to the interview chair (a small coin into the interview
 * jar). If they beat the person at the desk, the old employee packs a box and leaves, the new
 * one takes the desk and a big coin goes into the hiring jar; otherwise they go home.
 *
 * Every candidate is one person that keeps their look (picked by their arrival place) and walks
 * from where they stood to where they stand now, so the shuffle and each hire are visible.
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
    <rect x="-46" y="8" width={(70 * score) / Math.max(1, max)} height="8" rx="4" fill={tone} />
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

// Layout, in SVG units. The room is on top, the hallway (floor) below it.
const W = 780;
const H = 506;
const FLOOR = 250;
const DESK_X = 210;
const CHAIR_X = 360;
const GO_X = 448; // where someone stands for a moment on their way out
const ROW_LINE = 356; // feet of the waiting line
const ROW_OUT = 478; // feet of the two hallway groups below it
const PERSON = 150; // everyone is drawn this tall and scaled to where they stand
const SMALL = 0.46;

type Place = 'line' | 'chair' | 'desk' | 'out' | 'boxed' | 'home';
interface Slot {
  x: number;
  y: number;
  s: number;
  place: Place;
}

export const InterviewRoomScene: React.FC<StorySceneProps> = ({ step, stepMs }) => {
  const ids = useSvgIds();
  const field = useChapter();
  const svgRef = useRef<SVGSVGElement>(null);
  const st: any = step.state || {};
  const scores: number[] = st.array || [];
  const n = scores.length;
  // Who stands at each place in line (their arrival place); older states have no shuffle.
  const who: number[] = st.arrivalOrder?.length === n ? st.arrivalOrder : scores.map((_, k) => k);
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
  const atDesk: number | undefined = phase === 'interview' ? hired.filter((h) => h !== i).slice(-1)[0] : best;
  const boxed = hired.filter((h) => h !== atDesk && !(phase === 'interview' && h === i));
  const wentHome = scores.map((_, k) => k).filter((k) => (phase === 'complete' || k < i) && !hired.includes(k));

  // Where everyone stands at this step, by their place in (shuffled) line.
  const lineGap = Math.min(40, 640 / Math.max(1, n - 1));
  const outGap = Math.min(34, 320 / Math.max(1, n - 1));
  const lineX = (p: number) => 52 + p * lineGap;
  const slotOf = (p: number): Slot => {
    const inRoom = (place: Place, x: number, h: number, back = 0): Slot => ({ x, y: FLOOR - back, s: h / PERSON, place });
    if (phase !== 'complete' && p > i) return { x: lineX(p), y: ROW_LINE, s: SMALL, place: 'line' };
    if (p === atDesk) return inRoom('desk', DESK_X, 150, 10); // a step behind the desk, so it hides their shoes
    if (p === i && phase === 'interview') return inRoom('chair', CHAIR_X, 140);
    if (p === i && phase === 'decision' && decision === 'skip') return inRoom('out', GO_X, 140);
    const b = boxed.indexOf(p);
    if (b >= 0) return { x: 52 + b * outGap, y: ROW_OUT, s: SMALL, place: 'boxed' };
    return { x: 436 + Math.max(0, wentHome.indexOf(p)) * outGap, y: ROW_OUT, s: SMALL, place: 'home' };
  };
  const people = scores.map((_, p) => ({ p, id: who[p], ...slotOf(p) }));
  const slots = new Map(people.map((m) => [m.id, m as Slot]));
  const chairPerson = people.find((m) => m.place === 'chair');
  const deskPerson = people.find((m) => m.place === 'desk');
  const cards = [deskPerson && `desk-${deskPerson.p}`, chairPerson && `chair-${chairPerson.p}`, ...people.filter((m) => m.place === 'out').map((m) => `out-${m.p}`)].filter(Boolean) as string[];

  // Where everyone stood at the previous step, so the timeline can walk them from there.
  const placesRef = useRef<{ key: number; prev: Map<number, Slot>; cur: Map<number, Slot>; prevCards: string[]; curCards: string[] }>({
    key: -1,
    prev: new Map(),
    cur: new Map(),
    prevCards: [],
    curCards: [],
  });
  if (placesRef.current.key !== step.stepIndex) {
    const was = placesRef.current;
    placesRef.current = { key: step.stepIndex, prev: was.cur, cur: slots, prevCards: was.curCards, curCards: cards };
  }

  useStepTimeline(svgRef, step.stepIndex, stepMs, (tl, q) => {
    const { prev, prevCards } = placesRef.current;
    // A step left mid-walk must not leave anyone offset: start everyone from where React put them.
    gsap.set(q('.ir-move, .ir-hop'), { clearProps: 'transform' });
    q('.ir-grow').forEach((g) => g.removeAttribute('transform'));
    const part = (id: number, cls: string) => q(`[data-cand="${id}"] ${cls}`);
    // Whoever leaves a spot goes first; whoever takes the chair or the desk follows them.
    const leaving: Place[] = ['out', 'boxed', 'home'];
    let last = 0;
    people.forEach(({ id, x, y, s, place }) => {
      const from = prev.get(id);
      if (!from || (Math.abs(from.x - x) < 0.5 && Math.abs(from.y - y) < 0.5)) return;
      const at = phase === 'shuffle' || leaving.includes(place) ? 0 : 0.55;
      const dur = phase === 'shuffle' ? 1.2 : 1;
      last = Math.max(last, at + dur);
      tl.fromTo(part(id, '.ir-move'), { x: from.x - x, y: from.y - y }, { x: 0, y: 0, duration: dur, ease: 'story.move' }, at);
      if (from.s !== s) {
        // Grow or shrink around the feet (the group's origin), written straight to the attribute.
        const grow = part(id, '.ir-grow')[0];
        const k = { v: from.s / s };
        const apply = () => grow?.setAttribute('transform', `scale(${k.v})`);
        apply();
        tl.to(k, { v: 1, duration: dur, ease: 'story.move', onUpdate: apply }, at);
      }
      // Walking: a few little steps; in the shuffle everyone steps out of line and back in.
      const hops = phase === 'shuffle' ? 1 : 5;
      tl.fromTo(part(id, '.ir-hop'), { y: 0 }, { y: phase === 'shuffle' ? -26 : -6, duration: dur / (hops + 1), ease: 'sine.inOut', yoyo: true, repeat: hops }, at);
    });
    if (phase === 'init') {
      tl.to(q('.ir-hop'), { y: -10, duration: 0.2, yoyo: true, repeat: 1, ease: 'sine.out', stagger: 0.06 }, 0);
    }
    // New cards and tags appear once whoever they belong to has arrived.
    const fresh = cards.filter((c) => !prevCards.includes(c)).flatMap((c) => q(`[data-card="${c}"]`));
    if (fresh.length) tl.fromTo(fresh, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.4 }, last > 0 ? last - 0.1 : 0.2);
  });

  const narration = (() => {
    switch (phase) {
      case 'init':
        return `${n} candidates arrive and line up. We interview them one by one (${ci} coin each). Whenever someone is better than the person at the desk, we hire them right away (${ch} coins each). How often will we end up hiring?`;
      case 'shuffle':
        return `First, shuffle the line! Everyone moves to a random spot, so nobody can hand us a line from weakest to strongest. The spot numbers are now the order of interviews.`;
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

  const label = (text: string, x: number, y: number) => (
    <text x={x} y={y} fontSize="17" fontWeight="900" fill={tint(field.bg, -0.55)} style={F}>
      {text}
    </text>
  );
  const nobody = (x: number, y: number) => (
    <text x={x} y={y} fontSize="16" fontStyle="italic" fill="#5c554c">
      nobody
    </text>
  );

  return (
    <StoryStage
      title="The Interview Room"
      subtitle="Shuffle the line, interview everyone, hire whenever someone beats the person at the desk."
      narration={narration}
      status={`Spent • ${interviewed * ci + hired.length * ch} coins`}
    >
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="block mx-auto w-full h-auto overflow-visible" style={{ maxWidth: W * 1.2 }} role="img" aria-label="Interview room">
        <SceneDefs ids={ids} floor={field.bg} />
        <Room ids={ids} width={W} floorY={FLOOR} depth={H - FLOOR} floor={field.bg} />
        {/* a window on the wall */}
        <rect x="40" y="26" width="110" height="80" rx="10" fill="#dff1ff" stroke="#c9b48f" strokeWidth="6" />
        <path d="M95 26 V106 M40 66 H150" stroke="#c9b48f" strokeWidth="4" />

        {/* the hallway: numbered spots for the line, and the two groups that have left */}
        {label('Waiting in line', 30, 286)}
        {label('Hired, then replaced', 30, 412)}
        {label('Went home', 420, 412)}
        {scores.map((_, p) => (
          <g key={`spot-${p}`} transform={`translate(${lineX(p)}, ${ROW_LINE})`}>
            <ellipse rx="15" ry="5" fill={tint(field.bg, -0.3)} opacity="0.45" />
            <text y="20" textAnchor="middle" fontSize="15" fontWeight="900" fill={PALETTE.ink} style={F}>
              {p + 1}
            </text>
          </g>
        ))}
        {!people.some((m) => m.place === 'line') && nobody(170, 286)}
        {boxed.length === 0 && nobody(30, 452)}
        {wentHome.length === 0 && nobody(420, 452)}

        {/* everyone, back rows first; the furniture below is drawn over them */}
        {[...people]
          .sort((a, b) => a.y - b.y || a.x - b.x)
          .map(({ p, id, x, y, s, place }) => (
            <g key={`cand-${id}`} data-cand={id} transform={`translate(${x}, ${y})`}>
              <g className="ir-move">
                <g className="ir-hop">
                  <g className="ir-grow">
                    <g transform={`scale(${s})`} opacity={place === 'home' || place === 'out' ? 0.75 : 1}>
                      <Person height={PERSON} {...look(id)} number={s > 0.8 ? p + 1 : undefined} />
                    </g>
                  </g>
                </g>
                {place === 'boxed' && <Box x={0} y={-30} />}
                {place === 'out' && (
                  <g data-card={`out-${p}`}>
                    <rect x="-46" y="10" width="92" height="22" rx="11" fill="#e3dccd" />
                    <text y="25.5" textAnchor="middle" fontSize="12" fontWeight="800" fill="#3a3732">
                      goes home
                    </text>
                  </g>
                )}
                {(place === 'boxed' || place === 'home') && (
                  <text y="18" textAnchor="middle" fontSize="13" fontWeight="900" fill={PALETTE.ink}>
                    {p + 1}
                  </text>
                )}
              </g>
            </g>
          ))}

        {/* an empty desk chair when nobody is hired yet */}
        {!deskPerson && (
          <g transform={`translate(${DESK_X}, ${FLOOR})`}>
            <rect x="-20" y="-96" width="40" height="44" rx="10" fill="#6e4426" opacity="0.5" />
          </g>
        )}
        {/* the desk */}
        <g transform={`translate(${DESK_X}, ${FLOOR})`}>
          <ContactShadow ids={ids} cy={2} rx={84} />
          <rect x="-80" y="-70" width="160" height="16" rx="6" fill="#a8743f" />
          <rect x="-80" y="-70" width="160" height="5" rx="2.5" fill="#d1a36a" />
          <rect x="-72" y="-54" width="144" height="54" rx="4" fill="#8a5a35" />
          <rect x="-60" y="-44" width="40" height="14" rx="3" fill="#a8743f" />
          <circle cx="-40" cy="-37" r="2" fill={PALETTE.goldLight} />
        </g>
        {/* the interview chair */}
        <g transform={`translate(${CHAIR_X}, ${FLOOR})`}>
          <ContactShadow ids={ids} cy={2} rx={34} />
          <rect x="-26" y="-58" width="52" height="10" rx="5" fill="#3f78b5" />
          <path d="M-22 -48 V0 M22 -48 V0" stroke="#4a5560" strokeWidth="4" strokeLinecap="round" />
        </g>

        {deskPerson && (
          <g key={`desk-card-${deskPerson.p}`} data-card={`desk-${deskPerson.p}`}>
            <Skill x={DESK_X} y={FLOOR - 10 + personTop(150) - 36} score={scores[deskPerson.p]} max={max} tone="#0c8030" label={`At the desk: ${deskPerson.p + 1}`} />
          </g>
        )}
        {chairPerson && (
          <g key={`chair-card-${chairPerson.p}`} data-card={`chair-${chairPerson.p}`}>
            <Skill x={CHAIR_X} y={FLOOR + personTop(140) - 36} score={scores[chairPerson.p]} max={max} tone={PALETTE.gold} label={`Interviewing: ${chairPerson.p + 1}`} />
          </g>
        )}

        {/* the coin jars on a shelf */}
        <rect x="520" y={FLOOR - 4} width="210" height="10" rx="5" fill="#8a5a35" />
        <Jar x={570} y={FLOOR - 4} coins={interviewed} total={interviewed * ci} label={`interviews × ${ci}`} />
        <Jar x={680} y={FLOOR - 4} coins={hired.length} big total={hired.length * ch} label={`hires × ${ch}`} />
      </svg>
    </StoryStage>
  );
};
