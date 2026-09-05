import { AlgorithmStep } from '../types/algorithm';

export interface Job {
  id: number;
  deadline: number;
  profit: number;
}

export interface JobBBNode {
  id: string;
  level: number;
  profit: number;
  bound: number;
  upperBound: number;
  jobId?: number;
  jobIncluded?: boolean;
  selectedJobs: number[];
  parentId?: string;
  status: 'active' | 'explored' | 'pruned' | 'best';
  pruneReason?: string;
  children?: JobBBNode[];
}

export interface JobSelectionBBState {
  jobs: Job[];
  maxDeadline: number;
  treeRoot?: JobBBNode;
  activeNodeId?: string;
  prunedNodeIds: string[];
  bestProfit: number;
  bestJobs: number[];
  bestSchedule: (number | null)[];
  queueSize: number;
  currentNode?: JobBBNode;
  explanation?: string;
}

export function isScheduleFeasible(jobIds: number[], jobMap: Map<number, Job>): boolean {
  if (jobIds.length === 0) return true;
  const list = jobIds.map((id) => jobMap.get(id)!).filter(Boolean);
  list.sort((a, b) => a.deadline - b.deadline);
  for (let i = 0; i < list.length; i++) {
    if (list[i].deadline < i + 1) {
      return false;
    }
  }
  return true;
}

export function buildSchedule(
  jobIds: number[],
  jobMap: Map<number, Job>,
  maxD: number
): (number | null)[] {
  const schedule: (number | null)[] = new Array(maxD).fill(null);
  const list = jobIds.map((id) => jobMap.get(id)!).filter(Boolean);
  list.sort((a, b) => b.profit - a.profit);

  for (const job of list) {
    for (let slot = Math.min(job.deadline, maxD) - 1; slot >= 0; slot--) {
      if (schedule[slot] === null) {
        schedule[slot] = job.id;
        break;
      }
    }
  }
  return schedule;
}

function calculateUpperBound(
  level: number,
  currentProfit: number,
  selectedCount: number,
  maxDeadline: number,
  sortedJobs: Job[]
): number {
  const freeSlots = maxDeadline - selectedCount;
  if (freeSlots <= 0) return currentProfit;

  let bound = currentProfit;
  let added = 0;
  for (let i = level; i < sortedJobs.length && added < freeSlots; i++) {
    bound += sortedJobs[i].profit;
    added++;
  }
  return bound;
}

export function* jobSelectionBBSteps(inputs: {
  deadlines?: number[];
  profits?: number[];
}): Generator<AlgorithmStep<JobSelectionBBState>> {
  const rawDeadlines = inputs.deadlines || [2, 1, 2, 1, 3];
  const rawProfits = inputs.profits || [100, 19, 27, 25, 15];
  const n = Math.min(rawDeadlines.length, rawProfits.length);

  const jobs: Job[] = Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    deadline: Math.max(1, Math.floor(rawDeadlines[i])),
    profit: Math.max(1, rawProfits[i]),
  })).sort((a, b) => b.profit - a.profit || a.deadline - b.deadline);

  const jobMap = new Map<number, Job>();
  for (const j of jobs) jobMap.set(j.id, j);

  const maxDeadline = Math.max(1, ...jobs.map((j) => j.deadline));

  let stepIndex = 0;
  let comparisons = 0;
  let nodesExplored = 0;
  let prunedNodes = 0;

  let nodeCounter = 1;
  const initialBound = calculateUpperBound(0, 0, 0, maxDeadline, jobs);

  const rootNode: JobBBNode = {
    id: `node-${nodeCounter++}`,
    level: 0,
    profit: 0,
    bound: initialBound,
    upperBound: initialBound,
    selectedJobs: [],
    status: 'active',
  };

  let bestProfit = 0;
  let bestJobs: number[] = [];
  let bestSchedule: (number | null)[] = new Array(maxDeadline).fill(null);
  const prunedNodeIds: string[] = [];

  const nodeMap = new Map<string, JobBBNode>();
  nodeMap.set(rootNode.id, rootNode);

  const queue: JobBBNode[] = [rootNode];

  const makeStep = (
    title: string,
    description: string,
    codeLine: number,
    explanation: string,
    activeNodeId?: string,
    prunedId?: string,
    isFinal = false,
    result?: any
  ): AlgorithmStep<JobSelectionBBState> => {
    return {
      stepIndex: stepIndex++,
      title,
      description,
      codeLine,
      state: {
        jobs,
        maxDeadline,
        treeRoot: JSON.parse(JSON.stringify(rootNode)),
        activeNodeId,
        prunedNodeIds: [...prunedNodeIds],
        bestProfit,
        bestJobs: [...bestJobs],
        bestSchedule: [...bestSchedule],
        queueSize: queue.length,
        currentNode: activeNodeId ? nodeMap.get(activeNodeId) : undefined,
        explanation,
      },
      highlights: {
        activeNode: activeNodeId,
        nodes: activeNodeId ? [activeNodeId] : [],
        prunedNodes: prunedId ? [prunedId] : [],
      },
      metrics: {
        comparisons,
        nodesExplored,
        prunedNodes,
      },
      isFinal,
      result,
    };
  };

  yield makeStep(
    'Initialize Job Selection Branch & Bound',
    `Sorted ${n} jobs by profit descending. Root node initialized with Upper Bound = ${initialBound} across max deadline ${maxDeadline}.`,
    1,
    `Jobs: [${jobs.map((j) => `J${j.id}(d=${j.deadline},p=${j.profit})`).join(', ')}] | Max D=${maxDeadline}`,
    rootNode.id
  );

  while (queue.length > 0) {
    queue.sort((a, b) => b.bound - a.bound || b.profit - a.profit);
    const curr = queue.shift()!;
    nodesExplored++;

    comparisons++;
    if (curr.bound <= bestProfit && bestProfit > 0) {
      prunedNodes++;
      curr.status = 'pruned';
      curr.pruneReason = `Bound (${curr.bound}) <= Best (${bestProfit})`;
      prunedNodeIds.push(curr.id);

      yield makeStep(
        `Prune Node ${curr.id} by Bound`,
        `Upper bound ${curr.bound} cannot beat current best profit ${bestProfit}. Node pruned.`,
        2,
        `Node ${curr.id} pruned: UB (${curr.bound}) <= Best (${bestProfit})`,
        curr.id,
        curr.id
      );
      continue;
    }

    yield makeStep(
      `Explore Node ${curr.id} (Level ${curr.level})`,
      `De-queued node ${curr.id} at level ${curr.level} with Profit = ${curr.profit}, Upper Bound = ${curr.bound}. Current best profit = ${bestProfit}.`,
      3,
      `Exploring node ${curr.id}: Profit=${curr.profit}, UB=${curr.bound}`,
      curr.id
    );

    if (curr.level === n) {
      curr.status = 'explored';
      if (curr.profit > bestProfit) {
        bestProfit = curr.profit;
        bestJobs = [...curr.selectedJobs];
        bestSchedule = buildSchedule(bestJobs, jobMap, maxDeadline);

        yield makeStep(
          `New Best Solution at Leaf Node ${curr.id}`,
          `Reached leaf node with Profit ${curr.profit} > previous best. Updated best profit = ${bestProfit}, Jobs: [${bestJobs.map((id) => `J${id}`).join(', ')}].`,
          4,
          `New best profit = ${bestProfit} [${bestJobs.map((id) => `J${id}`).join(', ')}]`,
          curr.id
        );
      }
      continue;
    }

    const nextJob = jobs[curr.level];
    curr.children = [];

    // Branch 1: INCLUDE nextJob
    const inclJobs = [...curr.selectedJobs, nextJob.id];
    const inclFeasible = isScheduleFeasible(inclJobs, jobMap);
    const inclProfit = curr.profit + nextJob.profit;
    const inclBound = calculateUpperBound(
      curr.level + 1,
      inclProfit,
      inclJobs.length,
      maxDeadline,
      jobs
    );

    const leftNode: JobBBNode = {
      id: `node-${nodeCounter++}`,
      level: curr.level + 1,
      profit: inclProfit,
      bound: inclBound,
      upperBound: inclBound,
      jobId: nextJob.id,
      jobIncluded: true,
      selectedJobs: inclJobs,
      parentId: curr.id,
      status: 'active',
    };
    curr.children.push(leftNode);
    nodeMap.set(leftNode.id, leftNode);

    if (!inclFeasible) {
      prunedNodes++;
      leftNode.status = 'pruned';
      leftNode.pruneReason = `Infeasible: J${nextJob.id} deadline conflict`;
      prunedNodeIds.push(leftNode.id);

      yield makeStep(
        `Prune Left Branch (+J${nextJob.id}): Infeasible`,
        `Adding Job J${nextJob.id} (deadline=${nextJob.deadline}) makes schedule infeasible. Branch pruned.`,
        5,
        `+J${nextJob.id} infeasible — deadline conflict`,
        leftNode.id,
        leftNode.id
      );
    } else {
      if (inclProfit > bestProfit) {
        bestProfit = inclProfit;
        bestJobs = [...inclJobs];
        bestSchedule = buildSchedule(bestJobs, jobMap, maxDeadline);

        yield makeStep(
          `New Best Profit Found: ${bestProfit}`,
          `Feasible schedule with Job J${nextJob.id} achieves profit ${bestProfit}. Schedule: [${bestSchedule.map((id, slot) => `Slot ${slot + 1}: J${id ?? 'empty'}`).join(', ')}].`,
          6,
          `New best profit = ${bestProfit} with J${nextJob.id}`,
          leftNode.id
        );
      }

      comparisons++;
      if (inclBound <= bestProfit && bestProfit > 0) {
        prunedNodes++;
        leftNode.status = 'pruned';
        leftNode.pruneReason = `Bound (${inclBound}) <= Best (${bestProfit})`;
        prunedNodeIds.push(leftNode.id);

        yield makeStep(
          `Prune Left Branch (+J${nextJob.id}) by Bound`,
          `Including J${nextJob.id} yields UB ${inclBound} <= best profit ${bestProfit}. Branch pruned.`,
          7,
          `+J${nextJob.id} pruned: UB (${inclBound}) <= Best (${bestProfit})`,
          leftNode.id,
          leftNode.id
        );
      } else {
        queue.push(leftNode);
        yield makeStep(
          `Include J${nextJob.id} Added to Queue`,
          `Feasible node with J${nextJob.id} added (Profit = ${inclProfit}, UB = ${inclBound}).`,
          8,
          `+J${nextJob.id} active: Profit=${inclProfit}, UB=${inclBound}`,
          leftNode.id
        );
      }
    }

    // Branch 2: EXCLUDE nextJob
    const exclProfit = curr.profit;
    const exclBound = calculateUpperBound(
      curr.level + 1,
      exclProfit,
      curr.selectedJobs.length,
      maxDeadline,
      jobs
    );

    const rightNode: JobBBNode = {
      id: `node-${nodeCounter++}`,
      level: curr.level + 1,
      profit: exclProfit,
      bound: exclBound,
      upperBound: exclBound,
      jobId: nextJob.id,
      jobIncluded: false,
      selectedJobs: [...curr.selectedJobs],
      parentId: curr.id,
      status: 'active',
    };
    curr.children.push(rightNode);
    nodeMap.set(rightNode.id, rightNode);

    comparisons++;
    if (exclBound <= bestProfit && bestProfit > 0) {
      prunedNodes++;
      rightNode.status = 'pruned';
      rightNode.pruneReason = `Bound (${exclBound}) <= Best (${bestProfit})`;
      prunedNodeIds.push(rightNode.id);

      yield makeStep(
        `Prune Right Branch (-J${nextJob.id}) by Bound`,
        `Excluding J${nextJob.id} yields UB ${exclBound} <= best profit ${bestProfit}. Branch pruned.`,
        9,
        `-J${nextJob.id} pruned: UB (${exclBound}) <= Best (${bestProfit})`,
        rightNode.id,
        rightNode.id
      );
    } else {
      queue.push(rightNode);
      yield makeStep(
        `Exclude J${nextJob.id} Added to Queue`,
        `Node excluding J${nextJob.id} added (Profit = ${exclProfit}, UB = ${exclBound}).`,
        10,
        `-J${nextJob.id} active: Profit=${exclProfit}, UB=${exclBound}`,
        rightNode.id
      );
    }
  }

  function markBestPath(node: JobBBNode, bestJobSet: Set<number>): boolean {
    let isOptimalPath = false;
    if (node.profit === bestProfit && node.selectedJobs.length === bestJobs.length) {
      const allMatch = node.selectedJobs.every((id) => bestJobSet.has(id));
      if (allMatch) {
        node.status = 'best';
        isOptimalPath = true;
      }
    }

    if (node.children) {
      for (const child of node.children) {
        if (markBestPath(child, bestJobSet)) {
          isOptimalPath = true;
        }
      }
    }

    if (isOptimalPath) {
      node.status = 'best';
    }
    return isOptimalPath;
  }

  markBestPath(rootNode, new Set(bestJobs));

  yield makeStep(
    'Branch & Bound Job Selection Complete',
    `Optimal job selection found! Max Profit = ${bestProfit}. Optimal Jobs: [${bestJobs.map((id) => `J${id}`).join(', ')}]. Schedule: [${bestSchedule.map((id, s) => `Slot ${s + 1}: J${id ?? 'empty'}`).join(', ')}]. Explored ${nodesExplored} nodes, pruned ${prunedNodes} branches.`,
    11,
    `Optimal: Profit = ${bestProfit}, Jobs: [${bestJobs.map((id) => `J${id}`).join(', ')}]`,
    undefined,
    undefined,
    true,
    {
      maxProfit: bestProfit,
      selectedJobs: bestJobs,
      schedule: bestSchedule,
      maxDeadline,
      nodesExplored,
      prunedNodes,
    }
  );
}
