import { AlgorithmStep } from '../types/algorithm';

export interface LineSegment {
  id: string;
  label: string;
  p1: { x: number; y: number }; // left endpoint (smaller x)
  p2: { x: number; y: number }; // right endpoint (larger x)
}

export interface SweepEvent {
  x: number;
  y: number;
  type: 'left' | 'right';
  segmentId: string;
}

export interface SweepLineState {
  segments: LineSegment[];
  currentSweepX: number;
  currentEvent?: SweepEvent;
  activeSegmentIds: string[]; // ordered by y(x) descending (top to bottom)
  checkedPair?: [string, string];
  intersectionFound: boolean;
  intersectionPoint?: { x: number; y: number; s1: string; s2: string };
  phase: 'init' | 'event_left' | 'event_right' | 'check_adj' | 'found' | 'no_intersection';
}

// 2D Orientation / Cross-Product test
function crossProduct(ax: number, ay: number, bx: number, by: number, cx: number, cy: number): number {
  return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
}

function onSegment(px: number, py: number, qx: number, qy: number, rx: number, ry: number): boolean {
  return (
    qx <= Math.max(px, rx) &&
    qx >= Math.min(px, rx) &&
    qy <= Math.max(py, ry) &&
    qy >= Math.min(py, ry)
  );
}

export function doIntersect(
  s1: LineSegment,
  s2: LineSegment
): { intersect: boolean; point?: { x: number; y: number } } {
  const { x: x1, y: y1 } = s1.p1;
  const { x: x2, y: y2 } = s1.p2;
  const { x: x3, y: y3 } = s2.p1;
  const { x: x4, y: y4 } = s2.p2;

  const d1 = crossProduct(x3, y3, x4, y4, x1, y1);
  const d2 = crossProduct(x3, y3, x4, y4, x2, y2);
  const d3 = crossProduct(x1, y1, x2, y2, x3, y3);
  const d4 = crossProduct(x1, y1, x2, y2, x4, y4);

  const generalIntersect =
    ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
    ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));

  if (generalIntersect) {
    // Compute exact line intersection point
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) > 1e-9) {
      const ix = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / denom;
      const iy = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / denom;
      return { intersect: true, point: { x: parseFloat(ix.toFixed(2)), y: parseFloat(iy.toFixed(2)) } };
    }
    return { intersect: true };
  }

  // Collinear checks
  if (d1 === 0 && onSegment(x3, y3, x1, y1, x4, y4)) return { intersect: true, point: { x: x1, y: y1 } };
  if (d2 === 0 && onSegment(x3, y3, x2, y2, x4, y4)) return { intersect: true, point: { x: x2, y: y2 } };
  if (d3 === 0 && onSegment(x1, y1, x3, y3, x2, y2)) return { intersect: true, point: { x: x3, y: y3 } };
  if (d4 === 0 && onSegment(x1, y1, x4, y4, x2, y2)) return { intersect: true, point: { x: x4, y: y4 } };

  return { intersect: false };
}

// Compute y-coordinate of a non-vertical segment at current sweep x
function getYAtX(seg: LineSegment, x: number): number {
  if (seg.p2.x === seg.p1.x) return seg.p1.y; // horizontal/vertical guard
  const slope = (seg.p2.y - seg.p1.y) / (seg.p2.x - seg.p1.x);
  return seg.p1.y + slope * (x - seg.p1.x);
}

export function* lineSegmentIntersectionSteps(inputs: {
  segments?: { id: string; label: string; p1: { x: number; y: number }; p2: { x: number; y: number } }[];
}): Generator<AlgorithmStep<SweepLineState>> {
  // Default benchmark instance: 4 segments with an intersection
  const defaultSegments = [
    { id: 'S1', label: 'S1', p1: { x: 50, y: 120 }, p2: { x: 280, y: 260 } },
    { id: 'S2', label: 'S2', p1: { x: 80, y: 300 }, p2: { x: 320, y: 80 } },
    { id: 'S3', label: 'S3', p1: { x: 200, y: 350 }, p2: { x: 420, y: 330 } },
    { id: 'S4', label: 'S4', p1: { x: 300, y: 150 }, p2: { x: 460, y: 220 } },
  ];

  const rawSegments = inputs.segments && inputs.segments.length >= 2 ? inputs.segments : defaultSegments;

  // Normalize segments so p1 is always left endpoint (smaller x)
  const segments: LineSegment[] = rawSegments.map((s, idx) => {
    let p1 = { ...s.p1 };
    let p2 = { ...s.p2 };
    if (p1.x > p2.x || (p1.x === p2.x && p1.y > p2.y)) {
      [p1, p2] = [p2, p1];
    }
    return {
      id: s.id || `S${idx + 1}`,
      label: s.label || `S${idx + 1}`,
      p1,
      p2,
    };
  });

  // Generate sweep event points
  const events: SweepEvent[] = [];
  for (const seg of segments) {
    events.push({ x: seg.p1.x, y: seg.p1.y, type: 'left', segmentId: seg.id });
    events.push({ x: seg.p2.x, y: seg.p2.y, type: 'right', segmentId: seg.id });
  }

  // Sort events left to right (increasing x), tie break left endpoints before right, then y
  events.sort((a, b) => {
    if (a.x !== b.x) return a.x - b.x;
    if (a.type !== b.type) return a.type === 'left' ? -1 : 1;
    return a.y - b.y;
  });

  let stepIndex = 0;
  let comparisons = 0;
  let iterations = 0;

  yield {
    stepIndex: stepIndex++,
    title: 'Initialize Sweep-Line Segment Intersection',
    description: `Loaded ${segments.length} line segments. Generated ${events.length} event points (endpoints sorted by x-coordinate). Sweep line will move from left to right to detect whether ANY pair of segments intersect.`,
    codeLine: 1,
    state: {
      segments: [...segments],
      currentSweepX: events[0]?.x ? events[0].x - 20 : 0,
      activeSegmentIds: [],
      intersectionFound: false,
      phase: 'init',
    },
    highlights: {},
    metrics: { comparisons, iterations },
  };

  const activeSegmentIds: string[] = [];

  const sortActive = (sweepX: number) => {
    activeSegmentIds.sort((idA, idB) => {
      const segA = segments.find((s) => s.id === idA)!;
      const segB = segments.find((s) => s.id === idB)!;
      return getYAtX(segB, sweepX) - getYAtX(segA, sweepX); // descending order (top to bottom)
    });
  };

  for (const event of events) {
    iterations++;
    const currentSeg = segments.find((s) => s.id === event.segmentId)!;

    if (event.type === 'left') {
      // Step: Left endpoint event
      sortActive(event.x);
      // Insert current segment into active set based on y at event.x
      activeSegmentIds.push(currentSeg.id);
      sortActive(event.x);

      const pos = activeSegmentIds.indexOf(currentSeg.id);
      const aboveId = pos > 0 ? activeSegmentIds[pos - 1] : null;
      const belowId = pos < activeSegmentIds.length - 1 ? activeSegmentIds[pos + 1] : null;

      yield {
        stepIndex: stepIndex++,
        title: `Left Endpoint Event: Insert ${currentSeg.label} at x = ${event.x}`,
        description: `Sweep line reached left endpoint of ${currentSeg.label} (${event.x}, ${event.y}). Inserted ${currentSeg.label} into active structure T. Active set: [${activeSegmentIds.join(', ')}].`,
        codeLine: [2, 3],
        state: {
          segments: [...segments],
          currentSweepX: event.x,
          currentEvent: event,
          activeSegmentIds: [...activeSegmentIds],
          intersectionFound: false,
          phase: 'event_left',
        },
        highlights: {
          nodes: [currentSeg.id],
        },
        metrics: { comparisons, iterations },
      };

      // Check intersection with above neighbor
      if (aboveId) {
        comparisons++;
        const aboveSeg = segments.find((s) => s.id === aboveId)!;
        const res = doIntersect(currentSeg, aboveSeg);

        yield {
          stepIndex: stepIndex++,
          title: `Check Adjacency: ${currentSeg.label} and Above Neighbor ${aboveSeg.label}`,
          description: `Testing newly adjacent segments (${currentSeg.label}, ${aboveSeg.label}) in active status T for intersection.`,
          codeLine: [4, 5],
          state: {
            segments: [...segments],
            currentSweepX: event.x,
            currentEvent: event,
            activeSegmentIds: [...activeSegmentIds],
            checkedPair: [currentSeg.id, aboveId],
            intersectionFound: res.intersect,
            intersectionPoint: res.intersect ? { ...res.point!, s1: currentSeg.label, s2: aboveSeg.label } : undefined,
            phase: 'check_adj',
          },
          highlights: {
            edges: [{ u: currentSeg.id, v: aboveId, status: res.intersect ? 'active' : 'visited' }],
          },
          metrics: { comparisons, iterations },
        };

        if (res.intersect) {
          yield {
            stepIndex: stepIndex++,
            title: `INTERSECTION FOUND: ${currentSeg.label} × ${aboveSeg.label}`,
            description: `Intersection confirmed between ${currentSeg.label} and ${aboveSeg.label} at point (${res.point?.x}, ${res.point?.y})! Algorithm terminates early with positive result.`,
            codeLine: 6,
            state: {
              segments: [...segments],
              currentSweepX: event.x,
              currentEvent: event,
              activeSegmentIds: [...activeSegmentIds],
              checkedPair: [currentSeg.id, aboveId],
              intersectionFound: true,
              intersectionPoint: { ...res.point!, s1: currentSeg.label, s2: aboveSeg.label },
              phase: 'found',
            },
            highlights: {
              edges: [{ u: currentSeg.id, v: aboveId, status: 'cover' }],
            },
            metrics: { comparisons, iterations },
            isFinal: true,
            result: {
              hasIntersection: true,
              intersectingPair: [currentSeg.label, aboveSeg.label],
              point: res.point,
              eventsProcessed: iterations,
            },
          };
          return;
        }
      }

      // Check intersection with below neighbor
      if (belowId) {
        comparisons++;
        const belowSeg = segments.find((s) => s.id === belowId)!;
        const res = doIntersect(currentSeg, belowSeg);

        yield {
          stepIndex: stepIndex++,
          title: `Check Adjacency: ${currentSeg.label} and Below Neighbor ${belowSeg.label}`,
          description: `Testing newly adjacent segments (${currentSeg.label}, ${belowSeg.label}) in active status T for intersection.`,
          codeLine: [4, 5],
          state: {
            segments: [...segments],
            currentSweepX: event.x,
            currentEvent: event,
            activeSegmentIds: [...activeSegmentIds],
            checkedPair: [currentSeg.id, belowId],
            intersectionFound: res.intersect,
            intersectionPoint: res.intersect ? { ...res.point!, s1: currentSeg.label, s2: belowSeg.label } : undefined,
            phase: 'check_adj',
          },
          highlights: {
            edges: [{ u: currentSeg.id, v: belowId, status: res.intersect ? 'active' : 'visited' }],
          },
          metrics: { comparisons, iterations },
        };

        if (res.intersect) {
          yield {
            stepIndex: stepIndex++,
            title: `INTERSECTION FOUND: ${currentSeg.label} × ${belowSeg.label}`,
            description: `Intersection confirmed between ${currentSeg.label} and ${belowSeg.label} at point (${res.point?.x}, ${res.point?.y})! Algorithm terminates early with positive result.`,
            codeLine: 6,
            state: {
              segments: [...segments],
              currentSweepX: event.x,
              currentEvent: event,
              activeSegmentIds: [...activeSegmentIds],
              checkedPair: [currentSeg.id, belowId],
              intersectionFound: true,
              intersectionPoint: { ...res.point!, s1: currentSeg.label, s2: belowSeg.label },
              phase: 'found',
            },
            highlights: {
              edges: [{ u: currentSeg.id, v: belowId, status: 'cover' }],
            },
            metrics: { comparisons, iterations },
            isFinal: true,
            result: {
              hasIntersection: true,
              intersectingPair: [currentSeg.label, belowSeg.label],
              point: res.point,
              eventsProcessed: iterations,
            },
          };
          return;
        }
      }
    } else {
      // Step: Right endpoint event -> remove segment from active structure
      const pos = activeSegmentIds.indexOf(currentSeg.id);
      const aboveId = pos > 0 ? activeSegmentIds[pos - 1] : null;
      const belowId = pos < activeSegmentIds.length - 1 ? activeSegmentIds[pos + 1] : null;

      activeSegmentIds.splice(pos, 1);

      yield {
        stepIndex: stepIndex++,
        title: `Right Endpoint Event: Remove ${currentSeg.label} at x = ${event.x}`,
        description: `Sweep line reached right endpoint of ${currentSeg.label} (${event.x}, ${event.y}). Removed ${currentSeg.label} from active structure T. Remaining active: [${activeSegmentIds.join(', ')}].`,
        codeLine: 7,
        state: {
          segments: [...segments],
          currentSweepX: event.x,
          currentEvent: event,
          activeSegmentIds: [...activeSegmentIds],
          intersectionFound: false,
          phase: 'event_right',
        },
        highlights: {},
        metrics: { comparisons, iterations },
      };

      // Check if former neighbors (above and below) now intersect
      if (aboveId && belowId) {
        comparisons++;
        const aboveSeg = segments.find((s) => s.id === aboveId)!;
        const belowSeg = segments.find((s) => s.id === belowId)!;
        const res = doIntersect(aboveSeg, belowSeg);

        yield {
          stepIndex: stepIndex++,
          title: `Check Former Neighbors: ${aboveSeg.label} and ${belowSeg.label}`,
          description: `Segments ${aboveSeg.label} and ${belowSeg.label} are now newly adjacent in T after deleting ${currentSeg.label}. Testing them for intersection.`,
          codeLine: 8,
          state: {
            segments: [...segments],
            currentSweepX: event.x,
            currentEvent: event,
            activeSegmentIds: [...activeSegmentIds],
            checkedPair: [aboveId, belowId],
            intersectionFound: res.intersect,
            intersectionPoint: res.intersect ? { ...res.point!, s1: aboveSeg.label, s2: belowSeg.label } : undefined,
            phase: 'check_adj',
          },
          highlights: {
            edges: [{ u: aboveId, v: belowId, status: res.intersect ? 'active' : 'visited' }],
          },
          metrics: { comparisons, iterations },
        };

        if (res.intersect) {
          yield {
            stepIndex: stepIndex++,
            title: `INTERSECTION FOUND: ${aboveSeg.label} × ${belowSeg.label}`,
            description: `Intersection confirmed between ${aboveSeg.label} and ${belowSeg.label} at point (${res.point?.x}, ${res.point?.y})!`,
            codeLine: 6,
            state: {
              segments: [...segments],
              currentSweepX: event.x,
              currentEvent: event,
              activeSegmentIds: [...activeSegmentIds],
              checkedPair: [aboveId, belowId],
              intersectionFound: true,
              intersectionPoint: { ...res.point!, s1: aboveSeg.label, s2: belowSeg.label },
              phase: 'found',
            },
            highlights: {
              edges: [{ u: aboveId, v: belowId, status: 'cover' }],
            },
            metrics: { comparisons, iterations },
            isFinal: true,
            result: {
              hasIntersection: true,
              intersectingPair: [aboveSeg.label, belowSeg.label],
              point: res.point,
              eventsProcessed: iterations,
            },
          };
          return;
        }
      }
    }
  }

  // All events processed with no intersections found
  yield {
    stepIndex: stepIndex++,
    title: 'Sweep-Line Complete: No Intersections Found',
    description: `Sweep line traversed all ${events.length} event points across the plane. Zero intersecting segment pairs detected among the input set.`,
    codeLine: 9,
    state: {
      segments: [...segments],
      currentSweepX: (events[events.length - 1]?.x || 500) + 30,
      activeSegmentIds: [],
      intersectionFound: false,
      phase: 'no_intersection',
    },
    highlights: {},
    metrics: { comparisons, iterations },
    isFinal: true,
    result: {
      hasIntersection: false,
      eventsProcessed: events.length,
      segmentsChecked: segments.length,
    },
  };
}
