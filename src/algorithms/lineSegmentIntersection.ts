import { AlgorithmStep } from '../types/algorithm';

/**
 * Any-Segments-Intersect (Shamos–Hoey sweep line) with an AVL tree as the sweep status.
 *
 * A vertical sweep line moves left to right and stops only at segment endpoints (the event
 * queue). The segments the line currently cuts are kept in an AVL tree T, ordered by where
 * they meet the sweep line: left subtree = below, right subtree = above. Only segments that
 * are neighbours in T (in-order predecessor / successor) are ever tested for intersection:
 *   - left endpoint  → insert s, test s against the segment directly above and below it;
 *   - right endpoint → read s's above/below neighbours, delete s, test those two.
 * The leftmost intersection point always involves two segments that are neighbours in T just
 * before the sweep line reaches it, so these tests are enough. Every insert, delete and
 * neighbour lookup is O(log n) because the AVL tree keeps its height ≤ 1.44·log₂ n by rotating.
 *
 * Coordinates are mathematical: y grows upwards, so "above" means larger y.
 */

export interface Point {
  x: number;
  y: number;
}

export interface LineSegment {
  id: string;
  label: string;
  p1: Point; // left endpoint (smaller x; lower y on a tie)
  p2: Point; // right endpoint
}

export interface SweepEvent {
  x: number;
  y: number;
  type: 'left' | 'right';
  segmentId: string;
}

/** A frozen picture of one AVL node (and its subtree) for a step. */
export interface AvlSnapshot {
  id: string; // segment id stored in this node
  height: number;
  /** height(left) − height(right). AVL keeps it in {−1, 0, +1}. */
  balance: number;
  left: AvlSnapshot | null;
  right: AvlSnapshot | null;
}

export type RotationCase = 'LL' | 'RR' | 'LR' | 'RL';

export interface RotationInfo {
  /** The node whose balance hit ±2. */
  unbalanced: string;
  /** The balance it had (+2 or −2). */
  balance: number;
  case: RotationCase;
  /** 'right' or 'left': the single rotation shown in this step. */
  direction: 'left' | 'right';
  /** The node the rotation turned around (it moves down). */
  pivot: string;
  /** The child that moved up to take the pivot's place. */
  riser: string;
  /** For double rotations: 1 or 2. */
  part?: 1 | 2;
}

export type SweepPhase =
  | 'init'
  | 'event_left'
  | 'avl_insert'
  | 'avl_rotate'
  | 'neighbours'
  | 'event_right'
  | 'avl_delete'
  | 'check_adj'
  | 'found'
  | 'no_intersection';

export interface SweepLineState {
  segments: LineSegment[];
  /** Every endpoint, in the order the sweep line visits them. */
  events: SweepEvent[];
  /** Index into `events` of the event being handled (−1 before the sweep starts). */
  eventIndex: number;
  currentSweepX: number;
  currentEvent?: SweepEvent;
  /** The AVL tree T (null when empty). */
  tree: AvlSnapshot | null;
  /** Segments cut by the sweep line, top to bottom (reverse in-order of T). */
  activeSegmentIds: string[];
  /** Nodes visited on the way down during an insert / delete search (root first). */
  searchPath?: string[];
  /** For each node on `searchPath`: which way the walk went next ('left' = below, 'right' = above, 'hit' = found). */
  searchTurns?: ('left' | 'right' | 'hit')[];
  /** The segment just inserted into T. */
  insertedId?: string;
  /** The segment just removed from T. */
  removedId?: string;
  /** In a two-child delete: the successor whose segment was copied into the deleted node. */
  replacedBy?: string;
  rotation?: RotationInfo;
  /** In-order neighbours of the segment being handled. */
  aboveId?: string | null;
  belowId?: string | null;
  checkedPair?: [string, string];
  intersectionFound: boolean;
  intersectionPoint?: { x: number; y: number; s1: string; s2: string };
  phase: SweepPhase;
}

// ─── Geometry ────────────────────────────────────────────────────────────────

/** Cross product (b − a) × (c − a): > 0 when c is counter-clockwise of a→b (left / above). */
function crossProduct(ax: number, ay: number, bx: number, by: number, cx: number, cy: number): number {
  return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
}

function onSegment(px: number, py: number, qx: number, qy: number, rx: number, ry: number): boolean {
  return qx <= Math.max(px, rx) && qx >= Math.min(px, rx) && qy <= Math.max(py, ry) && qy >= Math.min(py, ry);
}

export function doIntersect(s1: LineSegment, s2: LineSegment): { intersect: boolean; point?: Point } {
  const { x: x1, y: y1 } = s1.p1;
  const { x: x2, y: y2 } = s1.p2;
  const { x: x3, y: y3 } = s2.p1;
  const { x: x4, y: y4 } = s2.p2;

  const d1 = crossProduct(x3, y3, x4, y4, x1, y1);
  const d2 = crossProduct(x3, y3, x4, y4, x2, y2);
  const d3 = crossProduct(x1, y1, x2, y2, x3, y3);
  const d4 = crossProduct(x1, y1, x2, y2, x4, y4);

  const generalIntersect = ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));

  if (generalIntersect) {
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) > 1e-9) {
      const ix = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / denom;
      const iy = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / denom;
      return { intersect: true, point: { x: parseFloat(ix.toFixed(2)), y: parseFloat(iy.toFixed(2)) } };
    }
    return { intersect: true };
  }

  if (d1 === 0 && onSegment(x3, y3, x1, y1, x4, y4)) return { intersect: true, point: { x: x1, y: y1 } };
  if (d2 === 0 && onSegment(x3, y3, x2, y2, x4, y4)) return { intersect: true, point: { x: x2, y: y2 } };
  if (d3 === 0 && onSegment(x1, y1, x3, y3, x2, y2)) return { intersect: true, point: { x: x3, y: y3 } };
  if (d4 === 0 && onSegment(x1, y1, x4, y4, x2, y2)) return { intersect: true, point: { x: x4, y: y4 } };

  return { intersect: false };
}

/** y of a segment where it meets the vertical line at x (its lower end for a vertical segment). */
export function yAtX(seg: LineSegment, x: number): number {
  if (seg.p2.x === seg.p1.x) return seg.p1.y;
  return seg.p1.y + ((seg.p2.y - seg.p1.y) * (x - seg.p1.x)) / (seg.p2.x - seg.p1.x);
}

/**
 * Is segment s above segment t where the sweep line meets s at point p?
 * Exact: one cross product, no division. Ties (p lies on t) are broken by the direction s
 * leaves p in, then by id, so the order is always strict.
 */
export function isAbove(s: LineSegment, t: LineSegment, p: Point): boolean {
  const d = crossProduct(t.p1.x, t.p1.y, t.p2.x, t.p2.y, p.x, p.y);
  if (d !== 0) return d > 0;
  const other = p === s.p1 ? s.p2 : s.p1;
  const sign = p === s.p1 ? 1 : -1;
  const d2 = sign * crossProduct(t.p1.x, t.p1.y, t.p2.x, t.p2.y, other.x, other.y);
  if (d2 !== 0) return d2 > 0;
  return s.id > t.id;
}

// ─── The AVL tree ────────────────────────────────────────────────────────────

interface AvlNode {
  seg: LineSegment;
  left: AvlNode | null;
  right: AvlNode | null;
  height: number;
}

const h = (n: AvlNode | null) => (n ? n.height : 0);
const balanceOf = (n: AvlNode) => h(n.left) - h(n.right);
const fix = (n: AvlNode) => {
  n.height = 1 + Math.max(h(n.left), h(n.right));
};

/** Right rotation around y: its left child x rises, y becomes x's right child. */
function rotateRight(y: AvlNode): AvlNode {
  const x = y.left!;
  y.left = x.right;
  x.right = y;
  fix(y);
  fix(x);
  return x;
}

/** Left rotation around x: its right child y rises, x becomes y's left child. */
function rotateLeft(x: AvlNode): AvlNode {
  const y = x.right!;
  x.right = y.left;
  y.left = x;
  fix(x);
  fix(y);
  return y;
}

function snapshot(n: AvlNode | null): AvlSnapshot | null {
  if (!n) return null;
  return { id: n.seg.id, height: n.height, balance: balanceOf(n), left: snapshot(n.left), right: snapshot(n.right) };
}

function inOrder(n: AvlNode | null, out: string[] = []): string[] {
  if (!n) return out;
  inOrder(n.left, out);
  out.push(n.seg.id);
  inOrder(n.right, out);
  return out;
}

/** Root-to-node path to the node holding `seg`, using the sweep-line order at point p. */
function findPath(root: AvlNode | null, seg: LineSegment, p: Point): { path: AvlNode[]; turns: ('left' | 'right' | 'hit')[] } {
  const path: AvlNode[] = [];
  const turns: ('left' | 'right' | 'hit')[] = [];
  let cur = root;
  while (cur) {
    path.push(cur);
    if (cur.seg.id === seg.id) {
      turns.push('hit');
      return { path, turns };
    }
    const right = isAbove(seg, cur.seg, p);
    turns.push(right ? 'right' : 'left');
    cur = right ? cur.right : cur.left;
  }
  // Safety net for degenerate inputs (e.g. touching segments compared at a shared point):
  // fall back to a plain depth-first search so the tree never loses a segment.
  const dfs = (n: AvlNode | null, acc: AvlNode[], tr: ('left' | 'right' | 'hit')[]): boolean => {
    if (!n) return false;
    acc.push(n);
    if (n.seg.id === seg.id) {
      tr.push('hit');
      return true;
    }
    tr.push('left');
    if (dfs(n.left, acc, tr)) return true;
    tr[tr.length - 1] = 'right';
    if (dfs(n.right, acc, tr)) return true;
    acc.pop();
    tr.pop();
    return false;
  };
  const p2: AvlNode[] = [];
  const t2: ('left' | 'right' | 'hit')[] = [];
  dfs(root, p2, t2);
  return { path: p2, turns: t2 };
}

/** In-order successor (above) and predecessor (below) of the last node on `path`. */
function neighboursOf(path: AvlNode[], turns: ('left' | 'right' | 'hit')[]): { above: AvlNode | null; below: AvlNode | null } {
  const node = path[path.length - 1];
  let above: AvlNode | null = null;
  let below: AvlNode | null = null;
  if (node.right) {
    above = node.right;
    while (above.left) above = above.left;
  } else {
    for (let i = path.length - 2; i >= 0; i--) if (turns[i] === 'left') { above = path[i]; break; }
  }
  if (node.left) {
    below = node.left;
    while (below.right) below = below.right;
  } else {
    for (let i = path.length - 2; i >= 0; i--) if (turns[i] === 'right') { below = path[i]; break; }
  }
  return { above, below };
}

// ─── The sweep, step by step ─────────────────────────────────────────────────

const DEFAULT_SEGMENTS = [
  { id: 'S1', label: 'S1', p1: { x: 50, y: 300 }, p2: { x: 450, y: 100 } },
  { id: 'S2', label: 'S2', p1: { x: 80, y: 190 }, p2: { x: 200, y: 190 } },
  { id: 'S3', label: 'S3', p1: { x: 100, y: 80 }, p2: { x: 450, y: 280 } },
];

/** Pseudocode line numbers (1-based) used by the steps; kept next to the registry's pseudocode. */
const L = {
  sortEvents: 2,
  emptyTree: 3,
  forEach: 4,
  segOf: 5,
  ifLeft: 6,
  insert: 7,
  neighboursIns: 8,
  testIns: 9,
  elseRight: 10,
  neighboursDel: 11,
  del: 12,
  testDel: 13,
  returnFalse: 14,
  insWalk: 17,
  insAttach: 18,
  heights: 19,
  plus2: 20,
  minus2: 21,
  delFind: 24,
  delUnlink: 25,
  above1: 28,
  above2: 29,
} as const;

export function* lineSegmentIntersectionSteps(inputs: {
  segments?: { id: string; label: string; p1: Point; p2: Point }[];
}): Generator<AlgorithmStep<SweepLineState>> {
  const raw = inputs.segments && inputs.segments.length >= 2 ? inputs.segments : DEFAULT_SEGMENTS;

  const segments: LineSegment[] = raw.map((s, idx) => {
    let p1 = { ...s.p1 };
    let p2 = { ...s.p2 };
    if (p1.x > p2.x || (p1.x === p2.x && p1.y > p2.y)) [p1, p2] = [p2, p1];
    return { id: s.id || `S${idx + 1}`, label: s.label || `S${idx + 1}`, p1, p2 };
  });
  const byId = new Map(segments.map((s) => [s.id, s]));
  const lbl = (id: string | null | undefined) => (id ? byId.get(id)?.label ?? id : '—');

  const events: SweepEvent[] = [];
  for (const seg of segments) {
    events.push({ x: seg.p1.x, y: seg.p1.y, type: 'left', segmentId: seg.id });
    events.push({ x: seg.p2.x, y: seg.p2.y, type: 'right', segmentId: seg.id });
  }
  // CLRS order: by x; on a tie, left endpoints before right endpoints; then lower y first.
  events.sort((a, b) => (a.x !== b.x ? a.x - b.x : a.type !== b.type ? (a.type === 'left' ? -1 : 1) : a.y - b.y));

  let root: AvlNode | null = null;
  let stepIndex = 0;
  let comparisons = 0; // segment-vs-node comparisons inside the tree
  let intersectionTests = 0;
  let rotations = 0;
  let eventsDone = 0;

  const metrics = () => ({ comparisons, iterations: eventsDone, custom: { intersectionTests, avlRotations: rotations } });
  const active = () => inOrder(root).reverse();

  type Extra = Partial<SweepLineState>;
  const state = (eventIndex: number, phase: SweepPhase, extra: Extra = {}): SweepLineState => {
    const ev = eventIndex >= 0 ? events[eventIndex] : undefined;
    return {
      segments,
      events,
      eventIndex,
      currentSweepX: ev ? ev.x : (events[0]?.x ?? 0) - 20,
      currentEvent: ev,
      tree: snapshot(root),
      activeSegmentIds: active(),
      intersectionFound: false,
      phase,
      ...extra,
    };
  };

  yield {
    stepIndex: stepIndex++,
    title: 'Initialize: Sort the Endpoints, Start with an Empty AVL Tree',
    description: `${segments.length} segments give ${events.length} endpoints. Sorted by x, they form the event queue: the sweep line will stop only at these ${events.length} places. The sweep status T, the segments the line currently cuts ordered from bottom to top, starts as an empty AVL tree.`,
    codeLine: [L.sortEvents, L.emptyTree],
    state: state(-1, 'init'),
    highlights: {},
    metrics: metrics(),
  };

  /**
   * Walk back up `path` (root first) after an insert or delete, fixing heights and rotating
   * wherever the balance reaches ±2. Yields one step per single rotation.
   */
  function* rebalance(
    path: AvlNode[],
    turns: ('left' | 'right' | 'hit')[],
    eventIndex: number,
    context: 'insert' | 'delete',
    keep: Extra
  ): Generator<AlgorithmStep<SweepLineState>> {
    for (let i = path.length - 1; i >= 0; i--) {
      const node = path[i];
      fix(node);
      const bf = balanceOf(node);
      if (bf >= -1 && bf <= 1) continue;

      const relink = (sub: AvlNode) => {
        if (i === 0) root = sub;
        else if (turns[i - 1] === 'left') path[i - 1].left = sub;
        else path[i - 1].right = sub;
        path[i] = sub;
        // Ancestors above the rotated subtree are one level shorter now; refresh them for the picture.
        for (let j = i - 1; j >= 0; j--) fix(path[j]);
      };
      const unbalanced = node.seg.id;
      const ctxLine = context === 'insert' ? L.insert : L.del;

      if (bf > 1) {
        const child = node.left!;
        if (balanceOf(child) >= 0) {
          const riser = child.seg.id;
          relink(rotateRight(node));
          rotations++;
          yield {
            stepIndex: stepIndex++,
            title: `AVL Rotate Right at ${lbl(unbalanced)} (LL case)`,
            description: `${lbl(unbalanced)} has balance +2: its lower (left) side is two levels taller, and the extra height is on the left of its left child ${lbl(riser)}. One right rotation lifts ${lbl(riser)} into ${lbl(unbalanced)}'s place and moves ${lbl(unbalanced)} down to its right. The bottom-to-top order of the segments does not change, only the shape of the tree.`,
            codeLine: [ctxLine, L.heights, L.plus2],
            state: state(eventIndex, 'avl_rotate', { ...keep, rotation: { unbalanced, balance: bf, case: 'LL', direction: 'right', pivot: unbalanced, riser } }),
            highlights: { nodes: [unbalanced, riser] },
            metrics: metrics(),
          };
        } else {
          const grand = child.right!.seg.id;
          node.left = rotateLeft(child);
          rotations++;
          yield {
            stepIndex: stepIndex++,
            title: `AVL Rotate Left at ${lbl(child.seg.id)} (LR case, 1 of 2)`,
            description: `${lbl(unbalanced)} has balance +2, but the extra height sits on the right of its left child ${lbl(child.seg.id)} (a zig-zag). First a left rotation at ${lbl(child.seg.id)} lifts ${lbl(grand)} up, turning the zig-zag into a straight line.`,
            codeLine: [ctxLine, L.heights, L.plus2],
            state: state(eventIndex, 'avl_rotate', { ...keep, rotation: { unbalanced, balance: bf, case: 'LR', direction: 'left', pivot: child.seg.id, riser: grand, part: 1 } }),
            highlights: { nodes: [child.seg.id, grand] },
            metrics: metrics(),
          };
          relink(rotateRight(node));
          rotations++;
          yield {
            stepIndex: stepIndex++,
            title: `AVL Rotate Right at ${lbl(unbalanced)} (LR case, 2 of 2)`,
            description: `Now a right rotation at ${lbl(unbalanced)} lifts ${lbl(grand)} to the top of this subtree, with ${lbl(child.seg.id)} below it on the left and ${lbl(unbalanced)} on the right. Balance restored.`,
            codeLine: [ctxLine, L.heights, L.plus2],
            state: state(eventIndex, 'avl_rotate', { ...keep, rotation: { unbalanced, balance: bf, case: 'LR', direction: 'right', pivot: unbalanced, riser: grand, part: 2 } }),
            highlights: { nodes: [unbalanced, grand] },
            metrics: metrics(),
          };
        }
      } else {
        const child = node.right!;
        if (balanceOf(child) <= 0) {
          const riser = child.seg.id;
          relink(rotateLeft(node));
          rotations++;
          yield {
            stepIndex: stepIndex++,
            title: `AVL Rotate Left at ${lbl(unbalanced)} (RR case)`,
            description: `${lbl(unbalanced)} has balance −2: its upper (right) side is two levels taller, and the extra height is on the right of its right child ${lbl(riser)}. One left rotation lifts ${lbl(riser)} into ${lbl(unbalanced)}'s place and moves ${lbl(unbalanced)} down to its left. The bottom-to-top order of the segments does not change.`,
            codeLine: [ctxLine, L.heights, L.minus2],
            state: state(eventIndex, 'avl_rotate', { ...keep, rotation: { unbalanced, balance: bf, case: 'RR', direction: 'left', pivot: unbalanced, riser } }),
            highlights: { nodes: [unbalanced, riser] },
            metrics: metrics(),
          };
        } else {
          const grand = child.left!.seg.id;
          node.right = rotateRight(child);
          rotations++;
          yield {
            stepIndex: stepIndex++,
            title: `AVL Rotate Right at ${lbl(child.seg.id)} (RL case, 1 of 2)`,
            description: `${lbl(unbalanced)} has balance −2, but the extra height sits on the left of its right child ${lbl(child.seg.id)} (a zig-zag). First a right rotation at ${lbl(child.seg.id)} lifts ${lbl(grand)} up, turning the zig-zag into a straight line.`,
            codeLine: [ctxLine, L.heights, L.minus2],
            state: state(eventIndex, 'avl_rotate', { ...keep, rotation: { unbalanced, balance: bf, case: 'RL', direction: 'right', pivot: child.seg.id, riser: grand, part: 1 } }),
            highlights: { nodes: [child.seg.id, grand] },
            metrics: metrics(),
          };
          relink(rotateLeft(node));
          rotations++;
          yield {
            stepIndex: stepIndex++,
            title: `AVL Rotate Left at ${lbl(unbalanced)} (RL case, 2 of 2)`,
            description: `Now a left rotation at ${lbl(unbalanced)} lifts ${lbl(grand)} to the top of this subtree, with ${lbl(unbalanced)} below it on the left and ${lbl(child.seg.id)} on the right. Balance restored.`,
            codeLine: [ctxLine, L.heights, L.minus2],
            state: state(eventIndex, 'avl_rotate', { ...keep, rotation: { unbalanced, balance: bf, case: 'RL', direction: 'left', pivot: unbalanced, riser: grand, part: 2 } }),
            highlights: { nodes: [unbalanced, grand] },
            metrics: metrics(),
          };
        }
      }
    }
  }

  /** Test a neighbouring pair; returns true (after yielding the verdict) if they intersect. */
  function* test(
    a: LineSegment,
    b: LineSegment,
    eventIndex: number,
    line: number,
    title: string,
    why: string,
    keep: Extra
  ): Generator<AlgorithmStep<SweepLineState>, boolean> {
    intersectionTests++;
    const res = doIntersect(a, b);
    const pt = res.intersect ? { ...(res.point ?? { x: 0, y: 0 }), s1: a.label, s2: b.label } : undefined;
    yield {
      stepIndex: stepIndex++,
      title: `${title}: ${a.label} and ${b.label}`,
      description: `${why} Four cross products decide it: ${
        res.intersect
          ? `each segment's endpoints lie on opposite sides of the other (or touch it), so they intersect.`
          : `at least one segment has both endpoints on the same side of the other, so they do not intersect.`
      }`,
      codeLine: [line],
      state: state(eventIndex, 'check_adj', { ...keep, checkedPair: [a.id, b.id], intersectionFound: res.intersect, intersectionPoint: pt }),
      highlights: { edges: [{ u: a.id, v: b.id, status: res.intersect ? 'active' : 'visited' }] },
      metrics: metrics(),
    };
    if (!res.intersect) return false;
    yield {
      stepIndex: stepIndex++,
      title: `INTERSECTION FOUND: ${a.label} × ${b.label}`,
      description: `${a.label} and ${b.label} cross${res.point ? ` at (${res.point.x}, ${res.point.y})` : ''}. One intersecting pair is enough to answer the question, so the sweep stops here after ${eventsDone} of ${events.length} events and ${rotations} AVL rotation${rotations === 1 ? '' : 's'}.`,
      codeLine: [line],
      state: state(eventIndex, 'found', { ...keep, checkedPair: [a.id, b.id], intersectionFound: true, intersectionPoint: pt }),
      highlights: { edges: [{ u: a.id, v: b.id, status: 'cover' }] },
      metrics: metrics(),
      isFinal: true,
      result: {
        hasIntersection: true,
        intersectingPair: [a.label, b.label],
        point: res.point,
        eventsProcessed: eventsDone,
        rotations,
      },
    };
    return true;
  }

  for (let ei = 0; ei < events.length; ei++) {
    const ev = events[ei];
    const s = byId.get(ev.segmentId)!;
    eventsDone++;

    if (ev.type === 'left') {
      // ── Event: the sweep line reaches s's left end.
      yield {
        stepIndex: stepIndex++,
        title: `Left Endpoint of ${s.label} at x = ${ev.x}`,
        description: `The sweep line jumps to x = ${ev.x}, the left end of ${s.label} at (${ev.x}, ${ev.y}). ${s.label} starts crossing the sweep line, so it must go into T in its bottom-to-top place.`,
        codeLine: [L.forEach, L.segOf, L.ifLeft],
        state: state(ei, 'event_left'),
        highlights: { nodes: [s.id] },
        metrics: metrics(),
      };

      // ── AVL insert: walk down, attach a leaf.
      const path: AvlNode[] = [];
      const turns: ('left' | 'right' | 'hit')[] = [];
      let cur = root;
      while (cur) {
        path.push(cur);
        comparisons++;
        const up = isAbove(s, cur.seg, s.p1);
        turns.push(up ? 'right' : 'left');
        cur = up ? cur.right : cur.left;
      }
      const leaf: AvlNode = { seg: s, left: null, right: null, height: 1 };
      if (path.length === 0) root = leaf;
      else if (turns[turns.length - 1] === 'left') path[path.length - 1].left = leaf;
      else path[path.length - 1].right = leaf;
      for (let i = path.length - 1; i >= 0; i--) fix(path[i]); // heights on the way back up (balance may now be ±2)

      const walk = path
        .map((n, i) => `${s.label} is ${turns[i] === 'right' ? 'above' : 'below'} ${n.seg.label} at x = ${ev.x} → go ${turns[i]}`)
        .join('; ');
      yield {
        stepIndex: stepIndex++,
        title: path.length ? `AVL Insert ${s.label}: ${path.map((n) => n.seg.label).join(' → ')} → new leaf` : `AVL Insert ${s.label} as the Root`,
        description: path.length
          ? `Walk down from the root, comparing where the segments meet the sweep line (one cross product each): ${walk}. ${s.label} is attached there as a new leaf with height 1.`
          : `T is empty, so ${s.label} becomes the root.`,
        codeLine: [L.insert, L.insWalk, L.insAttach],
        state: state(ei, 'avl_insert', {
          insertedId: s.id,
          searchPath: [...path.map((n) => n.seg.id), s.id],
          searchTurns: [...turns, 'hit'],
        }),
        highlights: { nodes: [s.id] },
        metrics: metrics(),
      };

      yield* rebalance([...path], [...turns], ei, 'insert', { insertedId: s.id });

      // ── Neighbours: in-order successor / predecessor.
      const found = findPath(root, s, s.p1);
      const { above, below } = neighboursOf(found.path, found.turns);
      const keep: Extra = { insertedId: s.id, aboveId: above?.seg.id ?? null, belowId: below?.seg.id ?? null };
      yield {
        stepIndex: stepIndex++,
        title: `Neighbours of ${s.label}: above ${lbl(above?.seg.id)}, below ${lbl(below?.seg.id)}`,
        description: `Above(${s.label}) is its in-order successor and Below(${s.label}) its in-order predecessor, each found in O(log n). ${
          above ? `${above.seg.label} is directly above.` : `Nothing is above it.`
        } ${below ? `${below.seg.label} is directly below.` : `Nothing is below it.`} ${
          above || below ? 'Only these new neighbours can be the first to cross ' + s.label + '.' : 'With no neighbours, there is nothing to test.'
        }`,
        codeLine: [L.neighboursIns, L.above1, L.above2],
        state: state(ei, 'neighbours', { ...keep, searchPath: found.path.map((n) => n.seg.id), searchTurns: found.turns }),
        highlights: { nodes: [s.id] },
        metrics: metrics(),
      };

      if (above && (yield* test(s, above.seg, ei, L.testIns, 'Check Neighbours', `${s.label} and ${above.seg.label} just became neighbours (${above.seg.label} is above).`, keep))) return;
      if (below && (yield* test(s, below.seg, ei, L.testIns, 'Check Neighbours', `${s.label} and ${below.seg.label} just became neighbours (${below.seg.label} is below).`, keep))) return;
    } else {
      // ── Event: the sweep line reaches s's right end. Read the neighbours first.
      const found = findPath(root, s, s.p2);
      comparisons += Math.max(0, found.path.length - 1);
      const { above, below } = neighboursOf(found.path, found.turns);
      const aboveId = above?.seg.id ?? null;
      const belowId = below?.seg.id ?? null;
      yield {
        stepIndex: stepIndex++,
        title: `Right Endpoint of ${s.label} at x = ${ev.x}`,
        description: `The sweep line jumps to x = ${ev.x}, the right end of ${s.label}. Before deleting it, find ${s.label} in T and read its neighbours: above ${lbl(aboveId)}, below ${lbl(belowId)}.${
          above && below ? ` Once ${s.label} is gone, ${above.seg.label} and ${below.seg.label} will sit next to each other.` : ''
        }`,
        codeLine: [L.elseRight, L.neighboursDel],
        state: state(ei, 'event_right', { aboveId, belowId, searchPath: found.path.map((n) => n.seg.id), searchTurns: found.turns }),
        highlights: { nodes: [s.id] },
        metrics: metrics(),
      };

      // ── AVL delete.
      const path = found.path;
      const turns = found.turns;
      const target = path[path.length - 1];
      let replacedBy: string | undefined;
      if (target.left && target.right) {
        // Two children: copy the in-order successor's segment here, then delete the successor.
        turns[turns.length - 1] = 'right';
        let succ = target.right;
        path.push(succ);
        while (succ.left) {
          turns.push('left');
          succ = succ.left;
          path.push(succ);
        }
        turns.push('hit');
        replacedBy = succ.seg.id;
        target.seg = succ.seg;
      }
      const gone = path[path.length - 1];
      const child = gone.left ?? gone.right;
      path.pop();
      turns.pop();
      if (path.length === 0) root = child;
      else if (turns[turns.length - 1] === 'left') path[path.length - 1].left = child;
      else path[path.length - 1].right = child;
      for (let i = path.length - 1; i >= 0; i--) fix(path[i]);

      const keep: Extra = { removedId: s.id, aboveId, belowId };
      yield {
        stepIndex: stepIndex++,
        title: `AVL Delete ${s.label}`,
        description: replacedBy
          ? `${s.label}'s node has two children, so its in-order successor ${lbl(replacedBy)} moves into that node and the successor's old spot (a node with at most one child) is unlinked. ${s.label} has left T.`
          : `${s.label}'s node has at most one child, so it is unlinked and its child (if any) takes its place. ${s.label} has left T.`,
        codeLine: [L.del, L.delFind, L.delUnlink],
        state: state(ei, 'avl_delete', { ...keep, replacedBy }),
        highlights: {},
        metrics: metrics(),
      };

      yield* rebalance(path, turns, ei, 'delete', keep);

      if (above && below) {
        if (
          yield* test(
            above.seg,
            below.seg,
            ei,
            L.testDel,
            'Check Former Neighbors',
            `With ${s.label} gone, ${above.seg.label} and ${below.seg.label} are neighbours in T for the first time.`,
            keep
          )
        )
          return;
      }
    }
  }

  yield {
    stepIndex: stepIndex++,
    title: 'Sweep Complete: No Intersections Found',
    description: `The sweep line passed all ${events.length} endpoints. Every pair of segments that were ever neighbours in T was tested (${intersectionTests} test${intersectionTests === 1 ? '' : 's'}) and none crossed, so no two segments intersect. The AVL tree needed ${rotations} rotation${rotations === 1 ? '' : 's'} to stay balanced.`,
    codeLine: [L.returnFalse],
    state: { ...state(-1, 'no_intersection'), currentSweepX: (events[events.length - 1]?.x ?? 500) + 30, eventIndex: events.length },
    highlights: {},
    metrics: metrics(),
    isFinal: true,
    result: {
      hasIntersection: false,
      eventsProcessed: events.length,
      segmentsChecked: segments.length,
      rotations,
    },
  };
}
