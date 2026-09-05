import { AlgorithmStep } from '../types/algorithm';
import { TreeNodeData } from '../components/visualizers/RecursionTreeVisualizer';

export interface KaratsubaDetails {
  m?: number;
  a?: string;
  b?: string;
  c?: string;
  d?: string;
  p1?: string;
  p2?: string;
  p3?: string;
  crossTerm?: string;
  term1?: string;
  term2?: string;
  term3?: string;
  finalResult?: string;
}

export interface KaratsubaState {
  num1: string;
  num2: string;
  treeNodes: TreeNodeData[];
  activeNodeId?: string;
  currentX?: string;
  currentY?: string;
  karatsubaDetails?: KaratsubaDetails;
  formulaExplanation?: string;
  explanation?: string;
}

export function* karatsubaSteps(inputs: {
  num1?: string | number;
  num2?: string | number;
}): Generator<AlgorithmStep<KaratsubaState>> {
  const xStr = String(inputs.num1 ?? '1234').trim().replace(/[^0-9]/g, '') || '1234';
  const yStr = String(inputs.num2 ?? '5678').trim().replace(/[^0-9]/g, '') || '5678';

  let stepIndex = 0;
  let multiplications = 0;
  let recursiveCalls = 0;
  let callCounter = 0;

  const treeNodes: TreeNodeData[] = [];

  const makeSnapshot = (
    title: string,
    description: string,
    codeLine: number,
    activeNodeId: string,
    explanation: string,
    details: KaratsubaDetails = {},
    formulaExplanation?: string,
    isFinal = false,
    finalResult?: any
  ): AlgorithmStep<KaratsubaState> => {
    return {
      stepIndex: stepIndex++,
      title,
      description,
      codeLine,
      state: {
        num1: xStr,
        num2: yStr,
        treeNodes: treeNodes.map((n) => ({ ...n })),
        activeNodeId,
        explanation,
        karatsubaDetails: { ...details },
        formulaExplanation,
      },
      highlights: {
        nodes: [activeNodeId],
      },
      metrics: {
        recursiveCalls,
        comparisons: multiplications,
        nodesExplored: treeNodes.length,
      },
      isFinal,
      result: finalResult,
    };
  };

  function* solveKaratsuba(
    x: bigint,
    y: bigint,
    parentId?: string,
    edgeLabel?: string
  ): Generator<AlgorithmStep<KaratsubaState>, bigint> {
    recursiveCalls++;
    const nodeId = `call-${++callCounter}-(${x}x${y})`;
    const xText = x.toString();
    const yText = y.toString();
    const label = `${xText} × ${yText}`;

    const node: TreeNodeData = {
      id: nodeId,
      parentId,
      label,
      subLabel: `len: max(${xText.length}, ${yText.length})`,
      status: 'dividing',
      edgeLabel,
    };
    treeNodes.push(node);

    // Initial recursive call frame
    yield makeSnapshot(
      `Recursive Call: ${xText} × ${yText}`,
      `Starting Karatsuba multiplication for X = ${xText} and Y = ${yText}.`,
      1,
      nodeId,
      `Evaluating subproblem ${label} (${edgeLabel || 'Root'}).`,
      {},
      `Subproblem: X = ${xText}, Y = ${yText}`
    );

    // Base Case: single digit (< 10)
    if (x < 10n || y < 10n) {
      multiplications++;
      const prod = x * y;
      node.status = 'base_case';
      node.result = prod.toString();
      node.subLabel = `prod = ${prod}`;

      yield makeSnapshot(
        `Base Case: ${xText} × ${yText} = ${prod}`,
        `Single-digit base case reached (X < 10 or Y < 10). Directly computed product: ${xText} × ${yText} = ${prod}.`,
        2,
        nodeId,
        `Base case multiplication: ${xText} × ${yText} = ${prod}.`,
        {
          p1: prod.toString(),
          finalResult: prod.toString(),
        },
        `${xText} × ${yText} = ${prod}`
      );

      return prod;
    }

    // Step 1: Split the Numbers
    const n = Math.max(xText.length, yText.length);
    const m = Math.floor(n / 2);
    const power10m = 10n ** BigInt(m);
    const power10_2m = 10n ** BigInt(2 * m);

    const a = x / power10m;
    const b = x % power10m;
    const c = y / power10m;
    const d = y % power10m;

    const detailsStep1: KaratsubaDetails = {
      m,
      a: a.toString(),
      b: b.toString(),
      c: c.toString(),
      d: d.toString(),
    };

    node.subLabel = `split m=${m}`;

    yield makeSnapshot(
      `Step 1: Split Numbers X and Y (m=${m})`,
      `For X = ${xText}: Higher part a = ${a}, Lower part b = ${b} (X = ${a}·10^${m} + ${b}). For Y = ${yText}: Higher part c = ${c}, Lower part d = ${d} (Y = ${c}·10^${m} + ${d}).`,
      3,
      nodeId,
      `Step 1 (Split): X = (${a}·10^${m} + ${b}), Y = (${c}·10^${m} + ${d})`,
      detailsStep1,
      `X = ${a}·10^${m} + ${b}  |  Y = ${c}·10^${m} + ${d}`
    );

    // Step 2: Three Multiplications (P1, P2, P3)
    // --- 2A: Branch P1 = a * c ---
    yield makeSnapshot(
      `Step 2A: Compute P1 = a · c = ${a} × ${c}`,
      `Spawning recursive branch to compute P1 = a · c = ${a} × ${c}.`,
      4,
      nodeId,
      `Step 2A: P1 = a · c = ${a} × ${c}`,
      detailsStep1,
      `Computing P1 = ${a} × ${c}...`
    );
    const p1 = yield* solveKaratsuba(a, c, nodeId, `P1: (${a}×${c})`);
    detailsStep1.p1 = p1.toString();

    // --- 2B: Branch P2 = b * d ---
    yield makeSnapshot(
      `Step 2B: Compute P2 = b · d = ${b} × ${d}`,
      `Spawning recursive branch to compute P2 = b · d = ${b} × ${d}.`,
      4,
      nodeId,
      `Step 2B: P2 = b · d = ${b} × ${d}`,
      detailsStep1,
      `P1 = ${p1}  |  Computing P2 = ${b} × ${d}...`
    );
    const p2 = yield* solveKaratsuba(b, d, nodeId, `P2: (${b}×${d})`);
    detailsStep1.p2 = p2.toString();

    // --- 2C: Branch P3 = (a + b) * (c + d) ---
    const aPlusB = a + b;
    const cPlusD = c + d;
    yield makeSnapshot(
      `Step 2C: Compute P3 = (a + b) · (c + d) = ${aPlusB} × ${cPlusD}`,
      `Spawning recursive branch to compute P3 = (${a} + ${b}) × (${c} + ${d}) = ${aPlusB} × ${cPlusD}.`,
      4,
      nodeId,
      `Step 2C: P3 = (a+b) · (c+d) = ${aPlusB} × ${cPlusD}`,
      detailsStep1,
      `P1 = ${p1}, P2 = ${p2}  |  Computing P3 = ${aPlusB} × ${cPlusD}...`
    );
    const p3 = yield* solveKaratsuba(aPlusB, cPlusD, nodeId, `P3: (${aPlusB}×${cPlusD})`);
    detailsStep1.p3 = p3.toString();

    // Step 3: Compute Middle Cross-Term
    const crossTerm = p3 - p1 - p2;
    detailsStep1.crossTerm = crossTerm.toString();

    yield makeSnapshot(
      `Step 3: Compute Cross-Term = P3 - P1 - P2 = ${crossTerm}`,
      `Calculated middle cross-term: cross-term = P3 - P1 - P2 = ${p3} - ${p1} - ${p2} = ${crossTerm}.`,
      5,
      nodeId,
      `Step 3 (Cross-Term): ${p3} - ${p1} - ${p2} = ${crossTerm}`,
      detailsStep1,
      `cross-term = ${p3} - ${p1} - ${p2} = ${crossTerm}`
    );

    // Step 4: Combine the Results
    const term1 = p1 * power10_2m;
    const term2 = crossTerm * power10m;
    const term3 = p2;
    const finalProduct = term1 + term2 + term3;

    detailsStep1.term1 = term1.toString();
    detailsStep1.term2 = term2.toString();
    detailsStep1.term3 = term3.toString();
    detailsStep1.finalResult = finalProduct.toString();

    node.status = 'resolved';
    node.result = finalProduct.toString();
    node.subLabel = `prod = ${finalProduct}`;

    yield makeSnapshot(
      `Step 4: Combine Results -> ${finalProduct}`,
      `Combining via Karatsuba formula: Result = P1·10^${2 * m} + (cross-term)·10^${m} + P2 = (${p1}·10^${2 * m}) + (${crossTerm}·10^${m}) + (${p2}) = ${term1} + ${term2} + ${term3} = ${finalProduct}.`,
      6,
      nodeId,
      `Step 4 (Combine): Result = ${term1} + ${term2} + ${term3} = ${finalProduct}`,
      detailsStep1,
      `Result = ${term1} + ${term2} + ${term3} = ${finalProduct}`
    );

    return finalProduct;
  }

  const rootProduct = yield* solveKaratsuba(BigInt(xStr), BigInt(yStr));

  if (treeNodes.length > 0) {
    treeNodes[0].status = 'optimal';
  }

  yield makeSnapshot(
    'Karatsuba Multiplication Complete: Final Product at Root',
    `Karatsuba fast multiplication finished. Final product of ${xStr} × ${yStr} = ${rootProduct.toString()}. Total recursive calls: ${recursiveCalls}.`,
    7,
    treeNodes[0]?.id || '',
    `Final solution successfully computed and verified: ${xStr} × ${yStr} = ${rootProduct.toString()}.`,
    {
      finalResult: rootProduct.toString(),
    },
    `${xStr} × ${yStr} = ${rootProduct.toString()}`,
    true,
    {
      num1: xStr,
      num2: yStr,
      product: rootProduct.toString(),
      totalCalls: recursiveCalls,
      multiplications,
    }
  );
}
