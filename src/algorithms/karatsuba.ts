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
  /** a + b and c + d, the factors of P3. */
  aPlusB?: string;
  cPlusD?: string;
  /** a·d and b·c, computed only to check P3 − P1 − P2 on screen; not counted as work. */
  adCheck?: string;
  bcCheck?: string;
  /** Base case: the product computed directly (not a P1/P2/P3 product). */
  baseProduct?: string;
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
    codeLine: number | number[],
    activeNodeId: string,
    explanation: string,
    details: KaratsubaDetails = {},
    formulaExplanation?: string,
    isFinal = false,
    finalResult?: any,
    callFlow?: { type: 'call' | 'return'; nodeId: string | number }
  ): AlgorithmStep<KaratsubaState> => {
    return {
      stepIndex: stepIndex++,
      title,
      description,
      codeLine,
      callFlow,
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

    const isRecursiveCall = !!parentId;
    const initialCallFlow = isRecursiveCall ? { type: 'call' as const, nodeId } : undefined;

    // Initial recursive call frame
    yield makeSnapshot(
      `Recursive Call: ${xText} × ${yText}`,
      `New job: multiply X = ${xText} by Y = ${yText}, using the Karatsuba recipe.`,
      1,
      nodeId,
      `Evaluating subproblem ${label} (${edgeLabel || 'Root'}).`,
      {},
      `Subproblem: X = ${xText}, Y = ${yText}`,
      false,
      undefined,
      initialCallFlow
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
        `One of the numbers is a single digit, so multiply directly: ${xText} × ${yText} = ${prod}, and return it.`,
        2,
        nodeId,
        `Base case multiplication: ${xText} × ${yText} = ${prod}.`,
        {
          baseProduct: prod.toString(),
          finalResult: prod.toString(),
        },
        `${xText} × ${yText} = ${prod}`,
        false,
        undefined,
        { type: 'return', nodeId }
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

    const aPlusB = a + b;
    const cPlusD = c + d;
    const detailsStep1: KaratsubaDetails = {
      m,
      a: a.toString(),
      b: b.toString(),
      c: c.toString(),
      d: d.toString(),
      aPlusB: aPlusB.toString(),
      cPlusD: cPlusD.toString(),
    };

    node.subLabel = `split m=${m}`;

    yield makeSnapshot(
      `Step 1: Split Numbers X and Y (m=${m})`,
      `Cut each number ${m} digit${m === 1 ? '' : 's'} from the right. X = ${xText} gives a high part a = ${a} and a low part b = ${b} (X = ${a}·10^${m} + ${b}). Y = ${yText} gives c = ${c} and d = ${d} (Y = ${c}·10^${m} + ${d}).`,
      [3, 4],
      nodeId,
      `Step 1 (Split): X = (${a}·10^${m} + ${b}), Y = (${c}·10^${m} + ${d})`,
      detailsStep1,
      `X = ${a}·10^${m} + ${b}  |  Y = ${c}·10^${m} + ${d}`
    );

    // Step 2: Three Multiplications (P1, P2, P3)
    // --- 2A: Branch P1 = a * c ---
    yield makeSnapshot(
      `Step 2A: Compute P1 = a · c = ${a} × ${c}`,
      `First smaller multiplication: P1 = a × c = ${a} × ${c} (the two high parts). It is worked out with the same recipe.`,
      5,
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
      `Second smaller multiplication: P2 = b × d = ${b} × ${d} (the two low parts).`,
      6,
      nodeId,
      `Step 2B: P2 = b · d = ${b} × ${d}`,
      detailsStep1,
      `P1 = ${p1}  |  Computing P2 = ${b} × ${d}...`
    );
    const p2 = yield* solveKaratsuba(b, d, nodeId, `P2: (${b}×${d})`);
    detailsStep1.p2 = p2.toString();

    // --- 2C: Branch P3 = (a + b) * (c + d) ---
    yield makeSnapshot(
      `Step 2C: Compute P3 = (a + b) · (c + d) = ${aPlusB} × ${cPlusD}`,
      `Third and last: add first, then multiply once. P3 = (a + b) × (c + d) = (${a} + ${b}) × (${c} + ${d}) = ${aPlusB} × ${cPlusD}. This single product contains both middle products.`,
      7,
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
    detailsStep1.adCheck = (a * d).toString();
    detailsStep1.bcCheck = (b * c).toString();

    yield makeSnapshot(
      `Step 3: Cross Term = P3 − P1 − P2 = ${crossTerm}`,
      `P3 = ac + ad + bc + bd. Taking away P1 (= ac) and P2 (= bd) leaves just the middle part: ad + bc = ${p3} − ${p1} − ${p2} = ${crossTerm}. That saved a fourth multiplication.`,
      8,
      nodeId,
      `Step 3 (cross term): ${p3} − ${p1} − ${p2} = ${crossTerm}`,
      detailsStep1,
      `ad + bc = P3 − P1 − P2 = ${p3} − ${p1} − ${p2} = ${crossTerm}`
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
      `Put the pieces back by place value: P1 shifted ${2 * m} places (${term1}) + the middle part shifted ${m} place${m === 1 ? '' : 's'} (${term2}) + P2 (${term3}) = ${finalProduct}. This answer is passed back up.`,
      9,
      nodeId,
      `Step 4 (Combine): Result = ${term1} + ${term2} + ${term3} = ${finalProduct}`,
      detailsStep1,
      `Result = ${term1} + ${term2} + ${term3} = ${finalProduct}`,
      false,
      undefined,
      { type: 'return', nodeId }
    );

    return finalProduct;
  }

  const rootProduct = yield* solveKaratsuba(BigInt(xStr), BigInt(yStr));

  if (treeNodes.length > 0) {
    treeNodes[0].status = 'optimal';
  }

  yield makeSnapshot(
    'Karatsuba Multiplication Complete: Final Product at Root',
    `Done: ${xStr} × ${yStr} = ${rootProduct.toString()}. Every split needed three smaller multiplications instead of four (${recursiveCalls} multiplication jobs in total), which is why Karatsuba is faster for long numbers.`,
    9,
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
