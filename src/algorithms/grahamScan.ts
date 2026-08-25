import { AlgorithmStep } from '../types/algorithm';

export interface Point2D {
  id: number;
  x: number;
  y: number;
  label?: string;
  angle?: number;
  distance?: number;
}

export interface GrahamScanState {
  points: Point2D[];
  pivot?: Point2D;
  sortedPoints: Point2D[];
  hullStack: Point2D[];
  currentPoint?: Point2D;
  checkTriplet?: [Point2D, Point2D, Point2D];
  turnOrientation?: 'ccw' | 'cw' | 'collinear';
  phase: 'find_pivot' | 'sort_polar' | 'scan' | 'complete';
}

export function* grahamScanSteps(inputs: { points: { x: number; y: number }[] }): Generator<AlgorithmStep<GrahamScanState>> {
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
    title: 'Initialize Graham’s Scan',
    description: `Loaded ${points.length} 2D points. Phase 1: Find the bottom-most anchor pivot point P0.`,
    codeLine: 1,
    state: {
      points: [...points],
      sortedPoints: [],
      hullStack: [],
      phase: 'find_pivot',
    },
    highlights: {},
    metrics: { comparisons, iterations },
  };

  // Step 1: Find pivot (lowest y, then lowest x)
  let pivotIdx = 0;
  for (let i = 1; i < points.length; i++) {
    comparisons++;
    if (points[i].y < points[pivotIdx].y || (points[i].y === points[pivotIdx].y && points[i].x < points[pivotIdx].x)) {
      pivotIdx = i;
    }
  }

  const pivot = { ...points[pivotIdx] };

  yield {
    stepIndex: stepIndex++,
    title: `Pivot Selected: ${pivot.label} (${pivot.x}, ${pivot.y})`,
    description: `Found lowest y-coordinate point ${pivot.label}. All other points will be sorted by polar angle relative to this anchor.`,
    codeLine: 2,
    state: {
      points: [...points],
      pivot,
      sortedPoints: [],
      hullStack: [],
      phase: 'find_pivot',
    },
    highlights: {
      activePoint: pivot.id,
    },
    metrics: { comparisons, iterations },
  };

  // Cross product of vectors (p2 - p1) and (p3 - p1)
  // > 0 -> Counter-Clockwise (left turn)
  // < 0 -> Clockwise (right turn)
  // = 0 -> Collinear
  function orientation(p1: Point2D, p2: Point2D, p3: Point2D): number {
    return (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
  }

  function distSq(p1: Point2D, p2: Point2D): number {
    return (p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y);
  }

  // Step 2: Sort remaining points by polar angle with pivot
  const otherPoints = points.filter((_, idx) => idx !== pivotIdx);
  for (const pt of otherPoints) {
    pt.angle = Math.atan2(pt.y - pivot.y, pt.x - pivot.x);
    pt.distance = distSq(pivot, pt);
  }

  otherPoints.sort((a, b) => {
    comparisons++;
    const o = orientation(pivot, a, b);
    if (o === 0) {
      return (a.distance || 0) - (b.distance || 0);
    }
    return o > 0 ? -1 : 1;
  });

  const sortedPoints: Point2D[] = [pivot, ...otherPoints];

  yield {
    stepIndex: stepIndex++,
    title: 'Points Sorted by Polar Angle',
    description: `Sorted remaining ${otherPoints.length} points counter-clockwise by polar angle around pivot ${pivot.label}.`,
    codeLine: 3,
    state: {
      points: [...points],
      pivot,
      sortedPoints: [...sortedPoints],
      hullStack: [],
      phase: 'sort_polar',
    },
    highlights: {
      activePoint: pivot.id,
      points: sortedPoints.map((p) => p.id),
    },
    metrics: { comparisons, iterations },
  };

  // Step 3: Scan points using stack
  const stack: Point2D[] = [sortedPoints[0], sortedPoints[1], sortedPoints[2]];

  yield {
    stepIndex: stepIndex++,
    title: 'Initialize Hull Stack with First 3 Points',
    description: `Pushed [${stack.map((p) => p.label).join(', ')}] onto hull stack.`,
    codeLine: 4,
    state: {
      points: [...points],
      pivot,
      sortedPoints: [...sortedPoints],
      hullStack: [...stack],
      phase: 'scan',
    },
    highlights: {
      hullPoints: stack.map((p) => p.id),
    },
    metrics: { comparisons, iterations },
  };

  for (let i = 3; i < sortedPoints.length; i++) {
    iterations++;
    const pt = sortedPoints[i];

    while (stack.length >= 2) {
      comparisons++;
      const top = stack[stack.length - 1];
      const nextToTop = stack[stack.length - 2];
      const o = orientation(nextToTop, top, pt);

      const turnType = o > 0 ? 'ccw' : o < 0 ? 'cw' : 'collinear';

      yield {
        stepIndex: stepIndex++,
        title: `Check Orientation: ${nextToTop.label} -> ${top.label} -> ${pt.label}`,
        description: `Evaluating turn from (${nextToTop.label} to ${top.label} to ${pt.label}). Cross product = ${o}. Turn is ${turnType.toUpperCase()} (${o > 0 ? 'Valid CCW Left Turn' : 'Invalid Non-Left Turn'}).`,
        codeLine: 5,
        state: {
          points: [...points],
          pivot,
          sortedPoints: [...sortedPoints],
          hullStack: [...stack],
          currentPoint: pt,
          checkTriplet: [nextToTop, top, pt],
          turnOrientation: turnType,
          phase: 'scan',
        },
        highlights: {
          hullPoints: stack.map((p) => p.id),
          checkPoint: pt.id,
        },
        metrics: { comparisons, iterations },
      };

      if (o <= 0) {
        const popped = stack.pop()!;
        yield {
          stepIndex: stepIndex++,
          title: `Pop ${popped.label} from Hull Stack`,
          description: `Popped ${popped.label} because it creates a clockwise/collinear dent in the convex hull.`,
          codeLine: 6,
          state: {
            points: [...points],
            pivot,
            sortedPoints: [...sortedPoints],
            hullStack: [...stack],
            currentPoint: pt,
            phase: 'scan',
          },
          highlights: {
            hullPoints: stack.map((p) => p.id),
            checkPoint: pt.id,
          },
          metrics: { comparisons, iterations },
        };
      } else {
        break;
      }
    }

    stack.push(pt);
    yield {
      stepIndex: stepIndex++,
      title: `Push ${pt.label} onto Hull Stack`,
      description: `Added point ${pt.label} (${pt.x}, ${pt.y}) to current convex hull stack.`,
      codeLine: 7,
      state: {
        points: [...points],
        pivot,
        sortedPoints: [...sortedPoints],
        hullStack: [...stack],
        currentPoint: pt,
        phase: 'scan',
      },
      highlights: {
        hullPoints: stack.map((p) => p.id),
      },
      metrics: { comparisons, iterations },
    };
  }

  yield {
    stepIndex: stepIndex++,
    title: 'Graham’s Scan Complete',
    description: `Convex Hull successfully computed! Enclosing polygon contains ${stack.length} vertices: [${stack.map((p) => p.label).join(' → ')}].`,
    codeLine: 8,
    state: {
      points: [...points],
      pivot,
      sortedPoints: [...sortedPoints],
      hullStack: [...stack],
      phase: 'complete',
    },
    highlights: {
      hullPoints: stack.map((p) => p.id),
    },
    metrics: { comparisons, iterations },
    isFinal: true,
    result: {
      hullVertexCount: stack.length,
      hullVertices: stack.map((p) => ({ label: p.label, x: p.x, y: p.y })),
      perimeterOrder: [...stack.map((p) => p.label), stack[0].label].join(' → '),
    },
  };
}
