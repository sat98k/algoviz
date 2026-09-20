import { AlgorithmStep } from '../types/algorithm';
import { Point2D } from './grahamScan';

export interface JarvisMarchState {
  points: Point2D[];
  pivot?: Point2D;
  hullStack: Point2D[];
  currentPoint?: Point2D;
  checkTriplet?: [Point2D, Point2D, Point2D];
  turnOrientation?: 'ccw' | 'cw' | 'collinear';
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
    description: `Loaded ${points.length} 2D points. Phase 1: Locate starting anchor pivot point with lowest y-coordinate.`,
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
    description: `Found lowest anchor point ${pivot.label}. Gift wrapping will start here and wrap counter-clockwise around the exterior.`,
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

  // Step 2: Gift wrapping loop
  const hull: Point2D[] = [];
  let currentHullPoint = pivot;

  do {
    hull.push(currentHullPoint);
    iterations++;

    // Pick an initial candidate next point (different from current point)
    let candidateNext = points[0].id === currentHullPoint.id ? points[1] : points[0];

    yield {
      stepIndex: stepIndex++,
      title: `Wrap from ${currentHullPoint.label}: Initial Candidate ${candidateNext.label}`,
      description: `Searching for the most counter-clockwise point from ${currentHullPoint.label}. Initial candidate is ${candidateNext.label}.`,
      codeLine: 3,
      state: {
        points: [...points],
        pivot,
        hullStack: [...hull],
        currentPoint: candidateNext,
        phase: 'wrapping',
      },
      highlights: {
        activePoint: currentHullPoint.id,
        hullPoints: hull.map((p) => p.id),
        checkPoint: candidateNext.id,
      },
      metrics: { comparisons, iterations },
    };

    // Iterate through all points to find the most counter-clockwise point
    for (let i = 0; i < points.length; i++) {
      const checkPoint = points[i];
      if (checkPoint.id === currentHullPoint.id) continue;

      comparisons++;
      const o = orientation(currentHullPoint, candidateNext, checkPoint);
      const turnType = o > 0 ? 'ccw' : o < 0 ? 'cw' : 'collinear';

      yield {
        stepIndex: stepIndex++,
        title: `Orientation Check: ${currentHullPoint.label} → ${candidateNext.label} vs ${checkPoint.label}`,
        description: `Checking triplet (${currentHullPoint.label} → ${candidateNext.label} → ${checkPoint.label}). Turn is ${turnType.toUpperCase()} (cross product = ${o}).`,
        codeLine: [4, 5],
        state: {
          points: [...points],
          pivot,
          hullStack: [...hull],
          currentPoint: candidateNext,
          checkTriplet: [currentHullPoint, candidateNext, checkPoint],
          turnOrientation: turnType,
          phase: 'wrapping',
        },
        highlights: {
          activePoint: currentHullPoint.id,
          hullPoints: hull.map((p) => p.id),
          checkPoint: checkPoint.id,
        },
        metrics: { comparisons, iterations },
      };

      // If checkPoint is more counter-clockwise than candidateNext, or collinear and farther away
      if (
        o > 0 ||
        (o === 0 &&
          distSq(currentHullPoint, checkPoint) > distSq(currentHullPoint, candidateNext))
      ) {
        candidateNext = checkPoint;

        yield {
          stepIndex: stepIndex++,
          title: `Update Candidate: ${candidateNext.label} is More Counter-Clockwise`,
          description: `Point ${candidateNext.label} forms a wider left turn. Updated best candidate for next hull edge.`,
          codeLine: 6,
          state: {
            points: [...points],
            pivot,
            hullStack: [...hull],
            currentPoint: candidateNext,
            phase: 'wrapping',
          },
          highlights: {
            activePoint: currentHullPoint.id,
            hullPoints: hull.map((p) => p.id),
            checkPoint: candidateNext.id,
          },
          metrics: { comparisons, iterations },
        };
      }
    }

    // Step 3: Add confirmed point to hull
    currentHullPoint = candidateNext;

    yield {
      stepIndex: stepIndex++,
      title: `Confirmed Hull Vertex: ${currentHullPoint.label}`,
      description: `Point ${currentHullPoint.label} is confirmed as the next convex hull vertex.`,
      codeLine: 7,
      state: {
        points: [...points],
        pivot,
        hullStack: currentHullPoint.id === pivot.id ? [...hull] : [...hull, currentHullPoint],
        currentPoint: currentHullPoint,
        phase: 'wrapping',
      },
      highlights: {
        hullPoints: hull.map((p) => p.id).concat(currentHullPoint.id === pivot.id ? [] : [currentHullPoint.id]),
        activePoint: currentHullPoint.id,
      },
      metrics: { comparisons, iterations },
    };
  } while (currentHullPoint.id !== pivot.id);

  // Complete
  yield {
    stepIndex: stepIndex++,
    title: 'Jarvis’ March Complete',
    description: `Convex Hull completed! Returned to anchor pivot ${pivot.label}. Total hull vertices: ${hull.length} [${hull.map((p) => p.label).join(' → ')}].`,
    codeLine: 8,
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
