import { AlgorithmStep } from '../types/algorithm';
import { Point2D } from './grahamScan';

export interface JarvisMarchState {
  points: Point2D[];
  pivot?: Point2D;
  hullStack: Point2D[];
  currentPoint?: Point2D;
  checkTriplet?: [Point2D, Point2D, Point2D];
  turnOrientation?: 'ccw' | 'cw' | 'collinear';
  /** Jarvis: the hull point the ribbon is wrapped from; it stays fixed while candidates are tested. */
  wrapFrom?: Point2D;
  /** Jarvis: cross product of the check, (candidate − wrapFrom) × (point − wrapFrom). */
  cross?: number;
  /** Jarvis: whether the checked point replaces the candidate. */
  replaces?: boolean;
  phase: 'find_pivot' | 'wrapping' | 'complete';
}

// Cross product of vectors (p2 - p1) and (p3 - p1)
// > 0 -> Counter-Clockwise (left turn, p3 is strictly to the left of p1->p2)
// < 0 -> Clockwise (right turn)
// = 0 -> Collinear
function orientation(p1: Point2D, p2: Point2D, p3: Point2D): number {
  return (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
}

function distSq(p1: Point2D, p2: Point2D): number {
  return (p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y);
}

export function* jarvisMarchSteps(inputs: {
  points: { x: number; y: number }[];
}): Generator<AlgorithmStep<JarvisMarchState>> {
  const defaultPoints: { x: number; y: number }[] = [
    { x: 100, y: 100 },
    { x: 150, y: 250 },
    { x: 250, y: 300 },
    { x: 350, y: 220 },
    { x: 400, y: 120 },
    { x: 280, y: 180 },
    { x: 200, y: 150 },
    { x: 220, y: 80 },
  ];

  const rawPts = inputs.points && inputs.points.length >= 3 ? inputs.points : defaultPoints;
  const points: Point2D[] = rawPts.map((p, idx) => ({ id: idx, x: p.x, y: p.y, label: `P${idx}` }));

  let stepIndex = 0;
  let comparisons = 0;
  let iterations = 0;

  yield {
    stepIndex: stepIndex++,
    title: 'Initialize Jarvis’ March (Gift Wrapping)',
    description: `${points.length} points on a board. We want the tightest fence around all of them. Idea: start at a point surely on the fence and wrap a ribbon around the outside, one corner at a time.`,
    codeLine: 1,
    state: {
      points: [...points],
      hullStack: [],
      phase: 'find_pivot',
    },
    highlights: {},
    metrics: { comparisons, iterations },
  };

  // Step 1: Find pivot point (lowest y-coordinate, tie-breaker lowest x-coordinate)
  let pivotIdx = 0;
  for (let i = 1; i < points.length; i++) {
    comparisons++;
    if (
      points[i].y < points[pivotIdx].y ||
      (points[i].y === points[pivotIdx].y && points[i].x < points[pivotIdx].x)
    ) {
      pivotIdx = i;
    }
  }

  const pivot = { ...points[pivotIdx] };

  yield {
    stepIndex: stepIndex++,
    title: `Anchor Pivot Found: ${pivot.label} (${pivot.x}, ${pivot.y})`,
    description: `${pivot.label} is the lowest point, so nothing is below it and it is surely on the fence. The ribbon starts here and wraps counter-clockwise, heading right along the bottom first.`,
    codeLine: 2,
    state: {
      points: [...points],
      pivot,
      hullStack: [pivot],
      phase: 'find_pivot',
    },
    highlights: {
      activePoint: pivot.id,
      hullPoints: [pivot.id],
    },
    metrics: { comparisons, iterations },
  };

  // Step 2: Gift wrapping loop (counter-clockwise: every hull edge has all other points on its left)
  const hull: Point2D[] = [];
  let currentHullPoint = pivot;

  do {
    hull.push(currentHullPoint);
    iterations++;
    const from = currentHullPoint;

    // Pick an initial candidate next point (different from current point)
    let candidateNext = points[0].id === from.id ? points[1] : points[0];

    yield {
      stepIndex: stepIndex++,
      title: `Wrap from ${from.label}: Initial Candidate ${candidateNext.label}`,
      description: `From ${from.label}, find the next corner going counter-clockwise: the point that has every other point on its left. ${from.label} stays fixed while we search. Aim the ribbon ${from.label} → ${candidateNext.label} for now, then test every other point against it.`,
      codeLine: [5, 6],
      state: {
        points: [...points],
        pivot,
        hullStack: [...hull],
        wrapFrom: from,
        currentPoint: candidateNext,
        phase: 'wrapping',
      },
      highlights: {
        activePoint: from.id,
        hullPoints: hull.map((p) => p.id),
        checkPoint: candidateNext.id,
      },
      metrics: { comparisons, iterations },
    };

    // Test every other point against the ribbon from → candidateNext
    for (let i = 0; i < points.length; i++) {
      const checkPoint = points[i];
      if (checkPoint.id === from.id || checkPoint.id === candidateNext.id) continue;

      comparisons++;
      const o = orientation(from, candidateNext, checkPoint);
      const turnType = o > 0 ? 'ccw' : o < 0 ? 'cw' : 'collinear';
      // Right of the ribbon: the candidate would leave it outside, so it cannot be the next corner.
      // On the ribbon's line: only a point further away replaces it (the nearer one lies on the edge).
      const further = o === 0 && distSq(from, checkPoint) > distSq(from, candidateNext);
      const replaces = o < 0 || further;
      const ribbon = `${from.label} → ${candidateNext.label}`;
      const verdict =
        o < 0
          ? `Cross product ${o} < 0: ${checkPoint.label} lies to the RIGHT of the ribbon ${ribbon}. ${candidateNext.label} would leave ${checkPoint.label} outside, so ${checkPoint.label} becomes the new candidate.`
          : o > 0
          ? `Cross product ${o} > 0: ${checkPoint.label} lies to the LEFT of the ribbon ${ribbon}, on the inside. Keep ${candidateNext.label}.`
          : further
          ? `Cross product 0: ${checkPoint.label} lies on the same line as the ribbon ${ribbon}, but further from ${from.label}. The corner is the far end, so ${checkPoint.label} becomes the new candidate.`
          : `Cross product 0: ${checkPoint.label} lies on the same line as the ribbon ${ribbon}, but no further than ${candidateNext.label}. It sits on the edge, not at a corner. Keep ${candidateNext.label}.`;

      yield {
        stepIndex: stepIndex++,
        title: `Orientation Check: ${from.label} → ${candidateNext.label} vs ${checkPoint.label}`,
        description: `Which side of the ribbon ${ribbon} is ${checkPoint.label} on? ${verdict}`,
        codeLine: [7, 8, 9],
        state: {
          points: [...points],
          pivot,
          hullStack: [...hull],
          wrapFrom: from,
          currentPoint: candidateNext,
          checkTriplet: [from, candidateNext, checkPoint],
          turnOrientation: turnType,
          cross: o,
          replaces,
          phase: 'wrapping',
        },
        highlights: {
          activePoint: from.id,
          hullPoints: hull.map((p) => p.id),
          checkPoint: checkPoint.id,
        },
        metrics: { comparisons, iterations },
      };

      if (replaces) {
        const previous = candidateNext;
        candidateNext = checkPoint;

        yield {
          stepIndex: stepIndex++,
          title: `Update Candidate: ${previous.label} → ${candidateNext.label}`,
          description: `Replace ${previous.label} with ${candidateNext.label}. The ribbon swings to ${from.label} → ${candidateNext.label}; ${from.label} stays where it is. Keep testing the remaining points against the new ribbon.`,
          codeLine: 10,
          state: {
            points: [...points],
            pivot,
            hullStack: [...hull],
            wrapFrom: from,
            currentPoint: candidateNext,
            phase: 'wrapping',
          },
          highlights: {
            activePoint: from.id,
            hullPoints: hull.map((p) => p.id),
            checkPoint: candidateNext.id,
          },
          metrics: { comparisons, iterations },
        };
      }
    }

    // Step 3: Add confirmed point to hull
    currentHullPoint = candidateNext;
    const closed = currentHullPoint.id === pivot.id;

    yield {
      stepIndex: stepIndex++,
      title: `Confirmed Hull Vertex: ${currentHullPoint.label}`,
      description: closed
        ? `Every other point is on the left of ${from.label} → ${pivot.label}, so the ribbon goes back to the start, ${pivot.label}. The wrap is closed.`
        : `Every other point is on the left of ${from.label} → ${currentHullPoint.label} (or on that edge), so ${currentHullPoint.label} is the next corner, counter-clockwise. Tie the ribbon there and wrap from ${currentHullPoint.label} next.`,
      codeLine: 11,
      state: {
        points: [...points],
        pivot,
        hullStack: closed ? [...hull] : [...hull, currentHullPoint],
        currentPoint: currentHullPoint,
        phase: 'wrapping',
      },
      highlights: {
        hullPoints: hull.map((p) => p.id).concat(closed ? [] : [currentHullPoint.id]),
        activePoint: currentHullPoint.id,
      },
      metrics: { comparisons, iterations },
    };
  } while (currentHullPoint.id !== pivot.id);

  // Complete
  yield {
    stepIndex: stepIndex++,
    title: 'Jarvis’ March Complete',
    description: `Done: the ribbon is back at ${pivot.label}. The fence has ${hull.length} corners, counter-clockwise from the lowest point: ${[...hull.map((p) => p.label), pivot.label].join(' → ')}. Every other point is inside.`,
    codeLine: [12, 13],
    state: {
      points: [...points],
      pivot,
      hullStack: [...hull],
      phase: 'complete',
    },
    highlights: {
      hullPoints: hull.map((p) => p.id),
    },
    metrics: { comparisons, iterations },
    isFinal: true,
    result: {
      hullVertexCount: hull.length,
      hullVertices: hull.map((p) => ({ label: p.label, x: p.x, y: p.y })),
      perimeterOrder: [...hull.map((p) => p.label), hull[0].label].join(' → '),
    },
  };
}
