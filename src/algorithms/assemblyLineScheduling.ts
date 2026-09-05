import { AlgorithmStep } from '../types/algorithm';

export interface AssemblyLineInputs {
  a1?: number[];
  a2?: number[];
  t1?: number[];
  t2?: number[];
  e1?: number;
  e2?: number;
  x1?: number;
  x2?: number;
}

export interface PathSegment {
  fromStation: number;
  fromLine: 1 | 2;
  toStation: number;
  toLine: 1 | 2;
  isTransfer: boolean;
}

export interface AssemblyLineState {
  numStations: number;
  a1: number[];
  a2: number[];
  t1: number[];
  t2: number[];
  e1: number;
  e2: number;
  x1: number;
  x2: number;
  f1: (number | null)[];
  f2: (number | null)[];
  l1: (number | null)[];
  l2: (number | null)[];
  currentStation: number;
  currentLine?: 1 | 2;
  phase: 'init' | 'forward' | 'exit' | 'backtrack' | 'complete';
  optimalPath: { station: number; line: 1 | 2 }[];
  activeSegments: PathSegment[];
  minTotalTime?: number;
  winningLine?: 1 | 2;
  formulaExplanation?: string;
  explanation?: string;
}

export function* assemblyLineSchedulingSteps(
  inputs: AssemblyLineInputs
): Generator<AlgorithmStep<AssemblyLineState>> {
  // Classic textbook example: CLRS 6 stations
  const a1 = inputs.a1 || [7, 9, 3, 4, 8, 4];
  const a2 = inputs.a2 || [8, 5, 6, 4, 5, 7];
  const t1 = inputs.t1 || [2, 3, 1, 3, 4];
  const t2 = inputs.t2 || [2, 1, 2, 2, 1];
  const e1 = inputs.e1 ?? 2;
  const e2 = inputs.e2 ?? 4;
  const x1 = inputs.x1 ?? 3;
  const x2 = inputs.x2 ?? 2;

  const n = Math.min(a1.length, a2.length);

  let stepIndex = 0;
  let comparisons = 0;
  let iterations = 0;

  const f1: (number | null)[] = Array(n).fill(null);
  const f2: (number | null)[] = Array(n).fill(null);
  const l1: (number | null)[] = Array(n).fill(null);
  const l2: (number | null)[] = Array(n).fill(null);

  // Step 1: Initialize Base Cases (Station 1)
  f1[0] = e1 + a1[0];
  f2[0] = e2 + a2[0];

  yield {
    stepIndex: stepIndex++,
    title: 'Initialize Assembly Line Entry Costs',
    description: `Station 1 base cases: Line 1 entry cost f1[1] = e1 (${e1}) + a1[1] (${a1[0]}) = ${f1[0]}. Line 2 entry cost f2[1] = e2 (${e2}) + a2[1] (${a2[0]}) = ${f2[0]}.`,
    codeLine: 1,
    state: {
      numStations: n,
      a1,
      a2,
      t1,
      t2,
      e1,
      e2,
      x1,
      x2,
      f1: [...f1],
      f2: [...f2],
      l1: [...l1],
      l2: [...l2],
      currentStation: 0,
      phase: 'init',
      optimalPath: [],
      activeSegments: [],
      formulaExplanation: `f1[1] = e1 + a1[1] = ${f1[0]}, f2[1] = e2 + a2[1] = ${f2[0]}`,
      explanation: 'Calculate base arrival costs by adding entry times to station 1 processing times.',
    },
    highlights: {
      nodes: ['L1-S1', 'L2-S1'],
    },
    metrics: { comparisons, iterations },
  };

  // Step 2: Forward DP Pass for stations 2 through n
  for (let j = 1; j < n; j++) {
    iterations++;

    // Compute Line 1 at station j
    comparisons++;
    const stayLine1 = f1[j - 1]! + a1[j];
    const transferFrom2 = f2[j - 1]! + t2[j - 1] + a1[j];

    if (stayLine1 <= transferFrom2) {
      f1[j] = stayLine1;
      l1[j] = 1;
    } else {
      f1[j] = transferFrom2;
      l1[j] = 2;
    }

    yield {
      stepIndex: stepIndex++,
      title: `Compute Station ${j + 1} on Line 1`,
      description: `Line 1 (Station ${j + 1}): Option 1 (Stay on Line 1) = f1[${j}] (${f1[j - 1]}) + a1[${j + 1}] (${a1[j]}) = ${stayLine1}. Option 2 (Transfer from Line 2) = f2[${j}] (${f2[j - 1]}) + t2[${j}] (${t2[j - 1]}) + a1[${j + 1}] (${a1[j]}) = ${transferFrom2}. Selected: f1[${j + 1}] = ${f1[j]} via Line ${l1[j]}.`,
      codeLine: 2,
      state: {
        numStations: n,
        a1,
        a2,
        t1,
        t2,
        e1,
        e2,
        x1,
        x2,
        f1: [...f1],
        f2: [...f2],
        l1: [...l1],
        l2: [...l2],
        currentStation: j,
        currentLine: 1,
        phase: 'forward',
        optimalPath: [],
        activeSegments: [],
        formulaExplanation: `f1[${j + 1}] = min(f1[${j}] + a1[${j + 1}] = ${stayLine1}, f2[${j}] + t2[${j}] + a1[${j + 1}] = ${transferFrom2}) = ${f1[j]} (from Line ${l1[j]})`,
      },
      highlights: {
        nodes: [`L1-S${j + 1}`],
      },
      metrics: { comparisons, iterations },
    };

    // Compute Line 2 at station j
    comparisons++;
    const stayLine2 = f2[j - 1]! + a2[j];
    const transferFrom1 = f1[j - 1]! + t1[j - 1] + a2[j];

    if (stayLine2 <= transferFrom1) {
      f2[j] = stayLine2;
      l2[j] = 2;
    } else {
      f2[j] = transferFrom1;
      l2[j] = 1;
    }

    yield {
      stepIndex: stepIndex++,
      title: `Compute Station ${j + 1} on Line 2`,
      description: `Line 2 (Station ${j + 1}): Option 1 (Stay on Line 2) = f2[${j}] (${f2[j - 1]}) + a2[${j + 1}] (${a2[j]}) = ${stayLine2}. Option 2 (Transfer from Line 1) = f1[${j}] (${f1[j - 1]}) + t1[${j}] (${t1[j - 1]}) + a2[${j + 1}] (${a2[j]}) = ${transferFrom1}. Selected: f2[${j + 1}] = ${f2[j]} via Line ${l2[j]}.`,
      codeLine: 2,
      state: {
        numStations: n,
        a1,
        a2,
        t1,
        t2,
        e1,
        e2,
        x1,
        x2,
        f1: [...f1],
        f2: [...f2],
        l1: [...l1],
        l2: [...l2],
        currentStation: j,
        currentLine: 2,
        phase: 'forward',
        optimalPath: [],
        activeSegments: [],
        formulaExplanation: `f2[${j + 1}] = min(f2[${j}] + a2[${j + 1}] = ${stayLine2}, f1[${j}] + t1[${j}] + a2[${j + 1}] = ${transferFrom1}) = ${f2[j]} (from Line ${l2[j]})`,
      },
      highlights: {
        nodes: [`L2-S${j + 1}`],
      },
      metrics: { comparisons, iterations },
    };
  }

  // Step 3: Exit Choice
  comparisons++;
  const exitLine1 = f1[n - 1]! + x1;
  const exitLine2 = f2[n - 1]! + x2;
  const minTotalTime = Math.min(exitLine1, exitLine2);
  const winningLine: 1 | 2 = exitLine1 <= exitLine2 ? 1 : 2;

  yield {
    stepIndex: stepIndex++,
    title: 'Forward DP Pass Complete: Choose Optimal Exit Line',
    description: `Exit comparison: Line 1 exit = f1[${n}] (${f1[n - 1]}) + x1 (${x1}) = ${exitLine1}. Line 2 exit = f2[${n}] (${f2[n - 1]}) + x2 (${x2}) = ${exitLine2}. Minimum total time: ${minTotalTime} exiting from Line ${winningLine}.`,
    codeLine: 3,
    state: {
      numStations: n,
      a1,
      a2,
      t1,
      t2,
      e1,
      e2,
      x1,
      x2,
      f1: [...f1],
      f2: [...f2],
      l1: [...l1],
      l2: [...l2],
      currentStation: n - 1,
      phase: 'exit',
      optimalPath: [{ station: n, line: winningLine }],
      activeSegments: [],
      minTotalTime,
      winningLine,
      formulaExplanation: `f* = min(f1[${n}] + x1 = ${exitLine1}, f2[${n}] + x2 = ${exitLine2}) = ${minTotalTime} (Exit Line ${winningLine})`,
    },
    highlights: {
      nodes: [`L${winningLine}-S${n}`],
    },
    metrics: { comparisons, iterations },
  };

  // Step 4: Backtrack Phase to Reconstruct Optimal Path
  const fullPath: { station: number; line: 1 | 2 }[] = [{ station: n, line: winningLine }];
  const activeSegments: PathSegment[] = [];
  let currLine: 1 | 2 = winningLine;

  for (let j = n - 1; j > 0; j--) {
    const prevLine = (currLine === 1 ? l1[j] : l2[j]) as 1 | 2;
    const isTransfer = prevLine !== currLine;

    activeSegments.unshift({
      fromStation: j,
      fromLine: prevLine,
      toStation: j + 1,
      toLine: currLine,
      isTransfer,
    });

    fullPath.unshift({ station: j, line: prevLine });

    yield {
      stepIndex: stepIndex++,
      title: `Backtrack: Station ${j + 1} ➔ Station ${j}`,
      description: `Station ${j + 1} was reached on Line ${currLine} from Line ${prevLine} at Station ${j} (${isTransfer ? `Line Transfer: Line ${prevLine} ➔ Line ${currLine}` : `Stay on Line ${currLine}`}).`,
      codeLine: 4,
      state: {
        numStations: n,
        a1,
        a2,
        t1,
        t2,
        e1,
        e2,
        x1,
        x2,
        f1: [...f1],
        f2: [...f2],
        l1: [...l1],
        l2: [...l2],
        currentStation: j - 1,
        currentLine: prevLine,
        phase: 'backtrack',
        optimalPath: [...fullPath],
        activeSegments: [...activeSegments],
        minTotalTime,
        winningLine,
        formulaExplanation: `l${currLine}[${j + 1}] = ${prevLine} ➔ Predecessor is Station ${j} on Line ${prevLine}`,
      },
      highlights: {
        nodes: fullPath.map((p) => `L${p.line}-S${p.station}`),
      },
      metrics: { comparisons, iterations },
    };

    currLine = prevLine;
  }

  // Step 5: Final Result
  yield {
    stepIndex: stepIndex++,
    title: 'Assembly Line Scheduling Complete',
    description: `Optimal manufacturing path verified: Total Minimum Time = ${minTotalTime}. Path sequence: [${fullPath.map((p) => `Station ${p.station} on Line ${p.line}`).join(' ➔ ')}].`,
    codeLine: 5,
    state: {
      numStations: n,
      a1,
      a2,
      t1,
      t2,
      e1,
      e2,
      x1,
      x2,
      f1: [...f1],
      f2: [...f2],
      l1: [...l1],
      l2: [...l2],
      currentStation: 0,
      phase: 'complete',
      optimalPath: fullPath,
      activeSegments,
      minTotalTime,
      winningLine,
      formulaExplanation: `Optimal Path: ${fullPath.map((p) => `L${p.line}:S${p.station}`).join(' ➔ ')} with Total Time = ${minTotalTime}`,
    },
    highlights: {
      nodes: fullPath.map((p) => `L${p.line}-S${p.station}`),
    },
    metrics: { comparisons, iterations },
    isFinal: true,
    result: {
      minTotalTime,
      winningExitLine: winningLine,
      optimalPath: fullPath,
      stationCount: n,
      finalF1: f1[n - 1],
      finalF2: f2[n - 1],
    },
  };
}
