import React, { useContext, useState, useEffect } from 'react';
import { useAnimatingReport, useNarrationHold } from '../story/narrationGate';
import { FitToBox, FitToScreenContext } from '../common/FitToBox';
import { AlgorithmStep } from '../../types/algorithm';
import { FractionalKnapsackItem } from '../../algorithms/fractionalKnapsack';
import { RotateCcw } from 'lucide-react';
import { OwlBubble } from '../story/StoryStage';

interface FractionalKnapsackAnimatedViewProps {
  step: AlgorithmStep;
}

const fmt = (n: number) => String(parseFloat(n.toFixed(2)));

/** The owl's sentence for a Fractional Knapsack step, in cheese-and-backpack words. */
export const cheeseNarration = (step: AlgorithmStep): string => {
  const state = step.state || {};
  const items: FractionalKnapsackItem[] = state.items || [];
  const capacity: number = state.capacity || 0;
  const room = Math.max(0, capacity - (state.currentWeight || 0));
  const item: FractionalKnapsackItem | undefined = items[state.currentItemIndex ?? -1];
  const name = (it: FractionalKnapsackItem) => `cheese ${it.id}`;

  if (step.isFinal) {
    return `The backpack is full: $${fmt(state.currentValue || 0)} of cheese in ${fmt(state.currentWeight || 0)} kg. Packing the best value per kg first is the best anyone can do here, because cheese can be cut.`;
  }
  if (!state.isSorted) {
    return `${items.length} cheese wheels sit on the board and the backpack holds ${capacity} kg. Bigger wheels weigh more. Cheese can be cut, so we may take just part of a wheel. First question: how many dollars is one kg of each cheese worth (value ÷ weight)?`;
  }
  if (!item) {
    return `Line the wheels up by dollars per kg, best first: ${items.map((it) => `${name(it)} ($${fmt(it.ratio)}/kg)`).join(', ')}. We always pack the best-value cheese first: that is the greedy choice.`;
  }
  switch (item.status) {
    case 'examining':
      return `Next in line: ${name(item)}, ${item.weight} kg worth $${item.value} ($${fmt(item.ratio)} per kg). The backpack has ${fmt(room)} kg of room left. Does the whole wheel fit?`;
    case 'taken_full':
      return `It fits! The whole ${item.weight} kg wheel goes into the backpack: +$${fmt(item.valueTaken)}. Room left: ${fmt(room)} kg.`;
    case 'taken_fraction':
      return `Too big: only ${fmt(item.weightTaken)} kg of room is left. The knife cuts exactly that much (${fmt(item.fractionTaken * 100)}% of the wheel) and only the slice goes in: +$${fmt(item.valueTaken)}. The rest stays on the board.`;
    case 'skipped':
      return `The backpack is already full, so ${name(item)} stays on the board.`;
    default:
      return `Look at ${name(item)}.`;
  }
};

// Classic appetizing normal yellow cheese theme for all cheese wheels
const NORMAL_CHEESE_THEME = {
  rindColor: '#e8a817',
  pasteColor: '#fde68a',
  holeColor: '#d99a1e',
  rindBorder: '#b8740f',
  highlight: '#fff6d6',
};

/** Renders a classic 3D Cheese Wheel in appetizing normal yellow with cheese eyes */
const renderNormalCheese = (
  width: number,
  height: number,
  slicedFraction: number = 1
) => {
  const rx = width / 2;
  const ry = height * 0.32;
  const cx = rx;
  const topY = ry + 2;
  const cylinderHeight = height * 0.44;
  const bottomY = topY + cylinderHeight;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="drop-shadow-sm select-none overflow-visible">
      <defs>
        <linearGradient id="normalCheeseRind" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={NORMAL_CHEESE_THEME.rindBorder} />
          <stop offset="25%" stopColor={NORMAL_CHEESE_THEME.rindColor} />
          <stop offset="75%" stopColor={NORMAL_CHEESE_THEME.rindColor} />
          <stop offset="100%" stopColor={NORMAL_CHEESE_THEME.rindBorder} />
        </linearGradient>
        <linearGradient id="normalCheesePaste" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={NORMAL_CHEESE_THEME.highlight} />
          <stop offset="60%" stopColor={NORMAL_CHEESE_THEME.pasteColor} />
          <stop offset="100%" stopColor={NORMAL_CHEESE_THEME.rindColor} />
        </linearGradient>
      </defs>

      {/* 3D Cylinder Bottom & Side Rind */}
      <ellipse cx={cx} cy={bottomY} rx={rx - 1} ry={ry} fill={NORMAL_CHEESE_THEME.rindBorder} />
      <rect x={1} y={topY} width={width - 2} height={cylinderHeight} fill="url(#normalCheeseRind)" />
      <ellipse cx={cx} cy={bottomY} rx={rx - 1} ry={ry} fill="url(#normalCheeseRind)" />

      {/* Side cheese holes */}
      <ellipse cx={cx * 0.48} cy={topY + cylinderHeight * 0.55} rx={rx * 0.16} ry={cylinderHeight * 0.22} fill={NORMAL_CHEESE_THEME.holeColor} opacity="0.85" />
      <ellipse cx={cx * 1.42} cy={topY + cylinderHeight * 0.42} rx={rx * 0.18} ry={cylinderHeight * 0.25} fill={NORMAL_CHEESE_THEME.holeColor} opacity="0.85" />

      {/* Top Sunny Yellow Cheese Face */}
      <ellipse cx={cx} cy={topY} rx={rx - 1} ry={ry} fill="url(#normalCheesePaste)" stroke={NORMAL_CHEESE_THEME.rindBorder} strokeWidth="1.5" />

      {/* Top Swiss cheese holes */}
      <ellipse cx={cx * 0.65} cy={topY * 0.9} rx={rx * 0.17} ry={ry * 0.28} fill={NORMAL_CHEESE_THEME.holeColor} />
      <ellipse cx={cx * 1.3} cy={topY * 1.08} rx={rx * 0.22} ry={ry * 0.35} fill={NORMAL_CHEESE_THEME.holeColor} />
      <ellipse cx={cx * 1.02} cy={topY * 0.72} rx={rx * 0.12} ry={ry * 0.22} fill={NORMAL_CHEESE_THEME.holeColor} />

      {/* Red cut guide line if sliced */}
      {slicedFraction < 1 && (
        <line
          x1={width * slicedFraction}
          y1={1}
          x2={width * slicedFraction}
          y2={height - 2}
          stroke="#cc2e2e"
          strokeWidth="2.5"
          strokeDasharray="4 2"
        />
      )}
    </svg>
  );
};

/**
 * One piece of a cut cheese wheel: the real full-size wheel, clipped between `from` and `to`
 * (fractions of its width), with a pale cut face along the cut edge. The left piece (0 → f)
 * is the slice that is taken; the right piece (f → 1) is the leftover that stays on the board.
 * Pieces are never squeezed, so the slice and the leftover fit back together into the wheel.
 */
const renderCheesePiece = (width: number, height: number, from: number, to: number, id: string) => {
  const rx = width / 2;
  const ry = height * 0.32;
  const cx = rx;
  const topY = ry + 2;
  const cylinderHeight = height * 0.44;
  const bottomY = topY + cylinderHeight;
  const x0 = Math.max(0, from) * width;
  const x1 = Math.min(1, to) * width;
  const faceDepth = 7;
  // Where the cut runs, and which side of it this piece is on.
  const cutX = from > 0 ? x0 : x1;
  const faceSide = from > 0 ? 1 : -1; // the face sits inside the piece, on its cut edge
  const k = Math.sqrt(Math.max(0, 1 - ((cutX - cx) / (rx - 1)) ** 2));
  const faceTop = topY - ry * k;
  const faceBottom = bottomY + ry * k;
  const fx = cutX + faceSide * faceDepth;
  const clipId = `cheese-cut-${id}`;
  const hasCut = from > 0 || to < 1;

  return (
    <svg
      width={x1 - x0}
      height={height}
      viewBox={`${x0} 0 ${x1 - x0} ${height}`}
      className="drop-shadow-sm select-none overflow-visible"
      data-cheese-piece={from > 0 ? 'leftover' : 'slice'}
    >
      <defs>
        <linearGradient id="normalCheeseRind" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={NORMAL_CHEESE_THEME.rindBorder} />
          <stop offset="25%" stopColor={NORMAL_CHEESE_THEME.rindColor} />
          <stop offset="75%" stopColor={NORMAL_CHEESE_THEME.rindColor} />
          <stop offset="100%" stopColor={NORMAL_CHEESE_THEME.rindBorder} />
        </linearGradient>
        <linearGradient id="normalCheesePaste" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={NORMAL_CHEESE_THEME.highlight} />
          <stop offset="60%" stopColor={NORMAL_CHEESE_THEME.pasteColor} />
          <stop offset="100%" stopColor={NORMAL_CHEESE_THEME.rindColor} />
        </linearGradient>
        <linearGradient id="cheeseCutFace" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fffbe6" />
          <stop offset="100%" stopColor={NORMAL_CHEESE_THEME.pasteColor} />
        </linearGradient>
        <clipPath id={clipId}>
          <rect x={x0} y={-2} width={x1 - x0} height={height + 4} />
        </clipPath>
      </defs>

      <g clipPath={`url(#${clipId})`}>
        <ellipse cx={cx} cy={bottomY} rx={rx - 1} ry={ry} fill={NORMAL_CHEESE_THEME.rindBorder} />
        <rect x={1} y={topY} width={width - 2} height={cylinderHeight} fill="url(#normalCheeseRind)" />
        <ellipse cx={cx} cy={bottomY} rx={rx - 1} ry={ry} fill="url(#normalCheeseRind)" />
        <ellipse cx={cx * 0.48} cy={topY + cylinderHeight * 0.55} rx={rx * 0.16} ry={cylinderHeight * 0.22} fill={NORMAL_CHEESE_THEME.holeColor} opacity="0.85" />
        <ellipse cx={cx * 1.42} cy={topY + cylinderHeight * 0.42} rx={rx * 0.18} ry={cylinderHeight * 0.25} fill={NORMAL_CHEESE_THEME.holeColor} opacity="0.85" />
        <ellipse cx={cx} cy={topY} rx={rx - 1} ry={ry} fill="url(#normalCheesePaste)" stroke={NORMAL_CHEESE_THEME.rindBorder} strokeWidth="1.5" />
        <ellipse cx={cx * 0.65} cy={topY * 0.9} rx={rx * 0.17} ry={ry * 0.28} fill={NORMAL_CHEESE_THEME.holeColor} />
        <ellipse cx={cx * 1.3} cy={topY * 1.08} rx={rx * 0.22} ry={ry * 0.35} fill={NORMAL_CHEESE_THEME.holeColor} />
        <ellipse cx={cx * 1.02} cy={topY * 0.72} rx={rx * 0.12} ry={ry * 0.22} fill={NORMAL_CHEESE_THEME.holeColor} />

        {/* The cut face: the pale inside of the cheese, along the cut */}
        {hasCut && k > 0 && (
          <g>
            <polygon
              points={`${cutX},${faceTop} ${fx},${faceTop + 3} ${fx},${faceBottom - 3} ${cutX},${faceBottom}`}
              fill="url(#cheeseCutFace)"
              stroke={NORMAL_CHEESE_THEME.rindBorder}
              strokeWidth="1"
              strokeLinejoin="round"
            />
            <ellipse cx={(cutX + fx) / 2} cy={faceTop + (faceBottom - faceTop) * 0.35} rx={1.8} ry={3} fill={NORMAL_CHEESE_THEME.holeColor} />
            <ellipse cx={(cutX + fx) / 2} cy={faceTop + (faceBottom - faceTop) * 0.7} rx={1.5} ry={2.4} fill={NORMAL_CHEESE_THEME.holeColor} />
          </g>
        )}
      </g>
    </svg>
  );
};

export const FractionalKnapsackAnimatedView: React.FC<FractionalKnapsackAnimatedViewProps> = ({ step }) => {
  const state = step.state || {};
  const items: FractionalKnapsackItem[] = state.items || [];
  const capacity: number = state.capacity || 50;
  const currentWeight: number = state.currentWeight || 0;
  const currentValue: number = state.currentValue || 0;
  const isSorted: boolean = !!state.isSorted;
  const originalOrder: number[] = state.originalOrder || items.map((it) => it.id);
  const isBagFullAtStep = currentWeight >= capacity || step.isFinal;

  // Is this step currently evaluating/taking a fraction?
  const isFractionStep = !step.isFinal && state.items?.[state.currentItemIndex]?.status === 'taken_fraction';

  // Animation sequence phases for the fractional step: 'idle' | 'slicing' | 'dragging' | 'dropped' | 'lidClosing' | 'closed'
  const [animPhase, setAnimPhase] = useState<'idle' | 'slicing' | 'dragging' | 'dropped' | 'lidClosing' | 'closed'>(
    step.isFinal ? 'closed' : isFractionStep ? 'slicing' : isBagFullAtStep ? 'closed' : 'idle'
  );

  // In the player the owl tells the step first; the knife waits for it.
  const hold = useNarrationHold();
  // Playback waits until the slice has landed and the lid has closed.
  useAnimatingReport(isFractionStep && !step.isFinal && !hold && animPhase !== 'closed');
  // Player, fit-to-screen: the frame fills its pane at a fixed size; only the table and bag zoom.
  const { enabled: fit } = useContext(FitToScreenContext);

  // Control sequential timing for slicing and physically dragging cheese into bag
  useEffect(() => {
    if (step.isFinal) {
      setAnimPhase('closed');
      return;
    }
    if (isFractionStep && hold) {
      setAnimPhase('idle');
      return;
    }
    if (isFractionStep) {
      // 1. Knife starts slow, deliberate slicing
      setAnimPhase('slicing');

      // 2. Slicing finishes; sliced piece smoothly drags downward through open air into bag
      const dragTimer = setTimeout(() => {
        setAnimPhase('dragging');
      }, 1400);

      // 3. Piece settles inside the bag
      const dropTimer = setTimeout(() => {
        setAnimPhase('dropped');
      }, 3000);

      // 4. ONLY AFTER the piece has completely landed inside, lid animates down smoothly
      const lidTimer = setTimeout(() => {
        setAnimPhase('lidClosing');
      }, 3600);

      // 5. Lid is fully closed and buckled
      const fullTimer = setTimeout(() => {
        setAnimPhase('closed');
      }, 4800);

      return () => {
        clearTimeout(dragTimer);
        clearTimeout(dropTimer);
        clearTimeout(lidTimer);
        clearTimeout(fullTimer);
      };
    } else if (isBagFullAtStep) {
      setAnimPhase('closed');
    } else {
      setAnimPhase('idle');
    }
  }, [step.stepIndex, step.isFinal, isFractionStep, isBagFullAtStep, hold]);

  // Is lid closed or currently in closing animation?
  const isLidActive = step.isFinal || animPhase === 'lidClosing' || animPhase === 'closed';

  // Items currently placed inside the bag
  const itemsInBag = items.filter((it) => it.fractionTaken > 0);

  // Slots calculation for the table (e.g. 3 items at 18%, 50%, 82%)
  const numItems = items.length || 3;
  const getSlotXPercent = (slotIndex: number) => {
    return ((slotIndex + 0.5) / numItems) * 100;
  };

  return (
    <div
      className={`ss-stage flex flex-col w-full min-h-[620px] rounded-[28px] p-4 sm:p-8 select-none relative text-stone-800 ${
        fit ? 'lg:flex-1 lg:min-h-0 lg:px-4 lg:py-2.5' : ''
      }`}
    >
      
      {/* ─── STAGE HEADER: Clean Light-Mode Story Bar ─── */}
      <div className={`flex flex-wrap items-end justify-between gap-3 z-30 ${fit ? 'lg:pb-0' : 'pb-1'}`}>
        <div className="min-w-0">
          <div className={fit ? 'lg:flex lg:items-baseline lg:gap-3 lg:flex-wrap' : undefined}>
            <h2 className={`ss-title ${fit ? 'ss-title-fit' : ''}`}>
              The Cheese Knapsack
            </h2>
            <p className="ss-subtitle">
              {!isSorted
                ? 'Cheese wheels resting on the wooden board in raw entered order.'
                : animPhase === 'slicing'
                ? 'Too big for remaining space! Chef knife is slowly slicing the exact wedge...'
                : animPhase === 'dragging'
                ? 'Physically dragging the sliced cheese wedge down into the bag...'
                : isLidActive
                ? 'Capacity reached! Sliced piece is packed and lid is buckled.'
                : 'Cheese wheels sorted by value density. Watch them get placed smoothly into the bag!'}
            </p>
          </div>
        </div>

        {/* Narrative Badges & Replay Trigger */}
        <div className="flex items-center gap-2.5">
          {isFractionStep && (
            <button
              onClick={() => {
                setAnimPhase('slicing');
                setTimeout(() => setAnimPhase('dragging'), 1400);
                setTimeout(() => setAnimPhase('dropped'), 3000);
                setTimeout(() => setAnimPhase('lidClosing'), 3600);
                setTimeout(() => setAnimPhase('closed'), 4800);
              }}
              className="c-pill"
            >
              <RotateCcw className="w-4 h-4" aria-hidden /> Replay Slicing & Packing
            </button>
          )}
        </div>
      </div>

      <OwlBubble narration={cheeseNarration(step)} className={fit ? 'mt-4 lg:mt-1.5' : 'mt-4'} steady={fit} />

      <ZoomIf fit={fit}>
      {/* ─── UNCLIPPED FULL-STAGE ARENA (TABLE TOP & BAG BOTTOM) ─── */}
      <div className={`fk-arena relative w-full min-h-[500px] mt-4 flex flex-col justify-between ${fit ? 'lg:mt-1' : ''}`}>
        
        {/* ─── WOODEN CUTTING BOARD (TABLE) ─── */}
        <div
          className="relative w-full h-[180px] rounded-[26px] z-10"
          style={{
            background: 'linear-gradient(180deg, #f6e9d2 0%, #ecd7b4 70%, #ddc196 100%)',
            boxShadow: 'inset 0 -10px 0 rgb(150 105 55 / 0.25), inset 0 2px 0 rgb(255 255 255 / 0.6), 0 14px 24px -16px rgb(58 36 20 / 0.55)',
          }}
        >
          <div className="absolute inset-3 rounded-[18px] border-2 border-[#d8bd94]/70 pointer-events-none" />
          <div className="flex flex-wrap items-baseline gap-x-3 text-sm font-sans text-stone-700 px-5 pt-3 font-medium">
            <span className="font-display font-black text-base text-stone-900">
              Kitchen Table (Available Cheese Wheels)
            </span>
            <span className="text-stone-600 italic">
              {isSorted ? 'Sorted: Highest value per kg first' : 'Initial raw order'}
            </span>
          </div>

          {/* Wooden plank groove */}
          <div className="absolute inset-x-0 bottom-0 h-3 rounded-b-[26px] bg-[#c9a77a]/40" />
        </div>

        {/* ─── PHYSICAL CHEESE WHEELS LAYER (ABSOLUTELY POSITIONED ACROSS WHOLE ARENA) ─── */}
        {/* Because this container has NO overflow-hidden, cheese wheels can physically fly down from table into the bag! */}
        <div className="absolute inset-0 pointer-events-none z-30">
          {items.map((item) => {
            // Size strictly scales with weight:
            // Weight 10 -> width 85px, height 50px
            // Weight 20 -> width 130px, height 70px
            // Weight 30 -> width 175px, height 90px
            const baseWidth = Math.max(75, Math.min(185, 40 + item.weight * 4.5));
            const baseHeight = Math.max(46, Math.min(95, 28 + item.weight * 2.1));

            // Target table slot: smoothly transitions from initialSlotIdx to sortedSlotIdx
            const initialSlotIdx = originalOrder.indexOf(item.id);
            const sortedSlotIdx = items.findIndex((it) => it.id === item.id);
            const slotIdx = isSorted ? sortedSlotIdx : initialSlotIdx;

            // Calculate horizontal position percentage on table
            const currentXPercent = getSlotXPercent(slotIdx);

            const isExamining = item.status === 'examining';
            const isTakenFull = item.status === 'taken_full';
            const isFractionalItem = item.fractionTaken > 0 && item.fractionTaken < 1;
            const isSkipped = item.status === 'skipped';

            // Fully taken item: flies into bag
            if (isTakenFull) {
              return (
                <div
                  key={`phys-cheese-${item.id}`}
                  className="absolute flex flex-col items-center pointer-events-none transition-all duration-1200 ease-in-out"
                  style={{
                    left: '50%',
                    top: '440px',
                    transform: 'translate(-50%, -50%) scale(0.75)',
                    opacity: 0,
                  }}
                />
              );
            }

            // Sliced item: The leftover wedge remains anchored on the cutting board forever!
            if (isFractionalItem) {
              return (
                <div
                  key={`phys-cheese-${item.id}`}
                  className="absolute flex flex-col items-center pointer-events-auto transition-all duration-1000 ease-in-out"
                  style={{
                    left: `${currentXPercent}%`,
                    top: '85px',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 30,
                  }}
                >
                  {/* Knife chopping down during active slicing */}
                  {isFractionStep && animPhase === 'slicing' && (
                    <div className="absolute -top-12 z-50 pointer-events-none animate-knife-chop">
                      <svg width="45" height="75" viewBox="0 0 40 70" className="drop-shadow-xl">
                        <defs>
                          <linearGradient id="knifeSteel" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0" stopColor="#c9d3db" />
                            <stop offset="0.5" stopColor="#f4f7f9" />
                            <stop offset="1" stopColor="#9aa8b4" />
                          </linearGradient>
                        </defs>
                        <path d="M 18 5 L 36 45 C 36 60, 24 65, 18 65 L 18 5 Z" fill="url(#knifeSteel)" stroke="#6b7680" strokeWidth="1.2" />
                        <path d="M 36 45 C 36 60, 24 65, 18 65" stroke="#ffffff" strokeWidth="2" fill="none" />
                        <rect x="12.5" y="1" width="11" height="23" rx="4" fill="#7a4f2c" />
                        <rect x="14" y="2.5" width="3" height="20" rx="1.5" fill="#a8743f" />
                        <circle cx="18" cy="8" r="1.6" fill="#e3e8ec" />
                        <circle cx="18" cy="17" r="1.6" fill="#e3e8ec" />
                      </svg>
                    </div>
                  )}

                  {/* During slicing: show both halves on the board before separation */}
                  {isFractionStep && (animPhase === 'slicing' || animPhase === 'idle') ? (
                    /* The whole wheel, cut through: the slice on the left eases away from the leftover */
                    <div className="flex flex-col items-center">
                      <div className="flex items-end" data-cheese-cut>
                        <div
                          className="transition-transform duration-700 ease-out"
                          style={{ transform: animPhase === 'slicing' ? 'translateX(-10px) rotate(-3deg)' : 'none', transitionDelay: animPhase === 'slicing' ? '0.9s' : '0s' }}
                        >
                          {renderCheesePiece(baseWidth, baseHeight, 0, item.fractionTaken, `slice-${item.id}`)}
                        </div>
                        {renderCheesePiece(baseWidth, baseHeight, item.fractionTaken, 1, `left-${item.id}`)}
                      </div>
                      {animPhase === 'slicing' ? (
                        <div className="flex flex-col items-center gap-1 mt-1.5">
                          <span className="text-xs font-bold text-stone-900 bg-[#f2c21a] px-3 py-1 rounded-2xl text-center max-w-[12rem]">
                            ✓ Cut piece slides into bag! ({fmt(item.fractionTaken * 100)}%)
                          </span>
                          <span className="text-xs font-bold text-stone-800 bg-[#fbf9f4] px-3 py-1 rounded-full whitespace-nowrap">
                            Left on board ({fmt((1 - item.fractionTaken) * 100)}%)
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-stone-800 bg-[#fbf9f4] px-3 py-1 rounded-full whitespace-nowrap mt-1.5">
                          Cheese #{item.id}
                        </span>
                      )}
                    </div>
                  ) : (
                    /* Leftover piece permanently sitting on the cutting board, its cut face showing */
                    <div className="flex flex-col items-center">
                      {renderCheesePiece(baseWidth, baseHeight, item.fractionTaken, 1, `left-${item.id}`)}
                      <span className="text-xs font-bold text-stone-800 bg-[#fbf9f4] px-3 py-1 rounded-full whitespace-nowrap mt-1.5">
                        Left on board ({fmt((1 - item.fractionTaken) * 100)}%)
                      </span>
                    </div>
                  )}
                </div>
              );
            }

            // Normal unsliced item on table
            return (
              <div
                key={`phys-cheese-${item.id}`}
                className="absolute flex flex-col items-center pointer-events-auto transition-all duration-1000 ease-in-out"
                style={{
                  left: `${currentXPercent}%`,
                  top: isExamining ? '65px' : '85px',
                  transform: `translate(-50%, -50%) scale(${isExamining ? 1.05 : 1})`,
                  opacity: isSkipped ? 0.35 : 1,
                  zIndex: isExamining ? 50 : 30,
                }}
              >
                {/* Floating Selection Banner */}
                {isExamining && (
                  <div className="mb-2 px-3 py-1 bg-[#1a1a1a] text-[#f3efe6] font-bold text-xs rounded-full animate-story-bob">
                    <span>Picking this up!</span>
                  </div>
                )}
                <div className="p-1 transition-transform duration-300 hover:scale-105">
                  {renderNormalCheese(baseWidth, baseHeight)}
                </div>
                <span className="text-xs font-bold text-stone-800 bg-[#fbf9f4] px-3 py-1 rounded-full whitespace-nowrap mt-1.5">
                  Cheese #{item.id}
                </span>
              </div>
            );
          })}

          {/* ─── DEDICATED FLYING TAKEN WEDGE (DRAGS DOWN INTO THE BAG SEPARATELY) ─── */}
          {isFractionStep && (animPhase === 'dragging' || animPhase === 'dropped' || animPhase === 'lidClosing') && (() => {
            const fracItem = items[state.currentItemIndex];
            if (!fracItem) return null;

            const baseWidth = Math.max(75, Math.min(185, 40 + fracItem.weight * 4.5));
            const baseHeight = Math.max(46, Math.min(95, 28 + fracItem.weight * 2.1));

            // Flies down through open air from table into bag mouth
            const targetX = 50;
            const targetY = animPhase === 'dragging' ? 360 : 430;
            const targetScale = animPhase === 'dragging' ? 0.85 : 0.75;
            const targetOpacity = animPhase === 'dragging' ? 1 : 0;

            return (
              <div
                key="flying-taken-wedge"
                className="absolute flex flex-col items-center pointer-events-none transition-all duration-1400 ease-in-out z-50"
                style={{
                  left: `${targetX}%`,
                  top: `${targetY}px`,
                  transform: `translate(-50%, -50%) scale(${targetScale})`,
                  opacity: targetOpacity,
                }}
              >
                <div className="drop-shadow-xl">{renderCheesePiece(baseWidth, baseHeight, 0, fracItem.fractionTaken, `fly-${fracItem.id}`)}</div>
                <span className="text-xs font-bold text-stone-900 bg-[#f2c21a] px-3 py-1 rounded-2xl text-center max-w-[12rem] mt-1.5">
                  ✓ Cut piece slides into bag!
                </span>
              </div>
            );
          })()}
        </div>

        {/* ─── ROW 2: THE CONSISTENT LEATHER KNAPSACK (EXACT W-80) ─── */}
        <div className="relative w-full flex flex-col items-center justify-center pt-8 z-20">
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-24 rounded-[26px] -z-10"
            style={{ background: 'linear-gradient(180deg, #f07a6f 0%, #ed4b44 100%)', boxShadow: 'inset 0 6px 0 rgb(255 255 255 / 0.18)' }}
          />
          
          {/* Header above Bag: Shows Capacity & Total Profit */}
          <div className="flex flex-wrap items-center justify-between gap-2 w-80 max-w-full px-1 text-sm font-sans text-stone-700 pb-2 font-medium">
            <span className="font-display font-black text-base text-stone-900">
              The Leather Knapsack
            </span>
            <div>
              {isLidActive ? (
                <span className="font-bold text-stone-900 bg-[#18bc42] px-3 py-1 rounded-full text-xs">
                  Capacity Reached • Total Profit: <strong className="font-black">${fmt(currentValue)}</strong>
                </span>
              ) : (
                <span className="text-stone-600 font-medium">
                  Open and ready for cheese
                </span>
              )}
            </div>
          </div>

          {/* Consistent Fixed-Width Backpack Shell (320px / w-80) */}
          <div className="relative w-80 max-w-full flex flex-col items-center">
            
            {/* Top Leather Handle */}
            <div className="w-16 h-6 border-[5px] border-[#7a4a26] rounded-t-2xl bg-transparent -mb-1" />

            {/* ─── CONSISTENT LID FLAP (EXACT W-80) ─── */}
            <div className="relative z-20 w-80 max-w-full">
              {isLidActive ? (
                /* Snapped Closed Leather Lid Animation */
                <div className="animate-lid-close w-80 max-w-full h-14 rounded-t-[22px] flex items-center justify-between px-6" style={{ background: 'linear-gradient(180deg, #b77a44 0%, #9a6235 100%)', boxShadow: 'inset 0 -4px 0 rgb(0 0 0 / 0.15), inset 0 2px 0 rgb(255 255 255 / 0.25)' }}>
                  {/* Left leather strap & brass buckle */}
                  <div className="flex flex-col items-center">
                    <div className="w-5 h-10 bg-[#6e4426] rounded-md flex items-center justify-center">
                      <div className="w-3 h-4 border-[2.5px] border-[#e8a817] rounded-[3px]" />
                    </div>
                  </div>

                  {/* Brass Centre Clasp: Clean and Buckled */}
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-[#6e4426] rounded-full">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#e8a817]" />
                    <span className="text-xs font-black text-[#fde68a] tracking-wider">LID CLOSED & BUCKLED</span>
                  </div>

                  {/* Right leather strap & brass buckle */}
                  <div className="flex flex-col items-center">
                    <div className="w-5 h-10 bg-[#6e4426] rounded-md flex items-center justify-center">
                      <div className="w-3 h-4 border-[2.5px] border-[#e8a817] rounded-[3px]" />
                    </div>
                  </div>
                </div>
              ) : (
                /* Open Mouth (Tilted Upwards, Consistent Dimensions) */
                <div
                  className="w-80 max-w-full h-11 rounded-t-[18px] flex items-center justify-center gap-2 transition-all duration-700"
                  style={{
                    transform: 'perspective(600px) rotateX(45deg)',
                    transformOrigin: 'top center',
                    background: 'linear-gradient(180deg, #5a3820 0%, #7a4a26 100%)',
                    boxShadow: 'inset 0 6px 10px rgb(0 0 0 / 0.35)',
                  }}
                >
                  <span className="text-[#fde68a] text-xs font-bold">
                    Cheese drops in here
                  </span>
                </div>
              )}
            </div>

            {/* ─── MAIN BACKPACK STORAGE CHAMBER (EXACT W-80, NO JUMP) ─── */}
            <div className="relative w-80 max-w-full min-h-[175px] rounded-b-[34px] p-4 flex flex-col justify-end overflow-hidden z-10" style={{ background: 'linear-gradient(180deg, #c98a52 0%, #b07240 60%, #93592f 100%)', boxShadow: 'inset 0 -8px 0 rgb(0 0 0 / 0.14), inset 0 0 0 2px rgb(255 228 190 / 0.25), 0 22px 30px -18px rgb(58 36 20 / 0.7)' }}>
              <div className="absolute inset-2.5 rounded-b-[28px] rounded-t-md border-2 border-dashed border-[#f1d2ad]/45 pointer-events-none" />
              
              {/* Backpack Leather Straps Accents */}
              <div className="absolute top-0 left-6 w-3.5 h-full bg-[#7a4a26]/45 rounded-full" />
              <div className="absolute top-0 right-6 w-3.5 h-full bg-[#7a4a26]/45 rounded-full" />

              {/* Cheese Wheels Stacked Inside the Bag */}
              <div className="flex flex-wrap items-center justify-center gap-3 py-2 z-10 min-h-[90px]">
                {itemsInBag.length === 0 ? (
                  <div className="text-center text-sm text-[#fdf0dc] py-6 italic">
                    The bag is empty. Waiting to pack cheese.
                  </div>
                ) : (
                  itemsInBag.map((item) => {
                    const isFraction = item.status === 'taken_fraction';

                    // Only show inside bag after piece has finished dragging and dropped in
                    if (isFraction && isFractionStep && (animPhase === 'slicing' || animPhase === 'dragging')) {
                      return null;
                    }

                    const inBagWidth = Math.max(50, Math.min(100, item.weight * 2.8));
                    const inBagHeight = Math.max(34, Math.min(55, 20 + item.weight * 1.1));

                    return (
                      <div
                        key={`bag-cheese-${item.id}`}
                        className="flex flex-col items-center animate-fade-in transition-all duration-700"
                      >
                        <div className="p-1.5 rounded-2xl bg-[#6e4426]/45">
                          {isFraction
                            ? renderCheesePiece(inBagWidth, inBagHeight, 0, item.fractionTaken, `bag-${item.id}`)
                            : renderNormalCheese(inBagWidth, inBagHeight, 1)}
                        </div>
                        <span className="text-xs font-bold text-[#fff3dd] mt-1">
                          {isFraction ? `${Math.round(item.fractionTaken * 100)}% wedge` : `Cheese #${item.id}`}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Consistent Floor Shadow */}
            <div
              className={`h-4 bg-[#3a2414]/35 rounded-full filter blur-md mt-1 transition-all duration-700 ${
                isLidActive ? 'w-80 max-w-full opacity-70' : 'w-76 opacity-40'
              }`}
            />
          </div>
        </div>

      </div>
      </ZoomIf>

    </div>
  );
};

/** In the player's fit-to-screen layout, the table and bag zoom to fit; otherwise as is. */
const ZoomIf: React.FC<{ fit: boolean; children: React.ReactNode }> = ({ fit, children }) =>
  // The table and bag do not get taller when wider, so they re-flow to the full width before zooming.
  // With room to spare they zoom in (up to 1.6×), so the cheese and the bag read large.
  fit ? <FitToBox widen maxScale={1.6}>{children}</FitToBox> : <>{children}</>;
