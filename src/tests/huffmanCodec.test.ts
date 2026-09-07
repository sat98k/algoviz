import { describe, it, expect } from 'vitest';
import { huffmanSteps } from '../algorithms/huffman';
import { generateEncodingSteps, generateDecodingSteps, findPathToChar } from '../utils/huffmanCodec';

describe('Huffman Codec Tree Traversal', () => {
  it('correctly generates encoding and decoding steps matching existing Huffman tree', () => {
    const text = 'ABRACADABRA';
    const steps = Array.from(huffmanSteps({ text }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep).toBeDefined();
    const treeRoot = finalStep.state.treeRoot!;
    const codeTable = finalStep.state.codeTable;
    const encodedBits = finalStep.state.encodedBits!;

    expect(treeRoot).toBeDefined();
    expect(codeTable).toBeDefined();
    expect(encodedBits).toBeDefined();

    // 1. Path finding verification
    for (const char of Object.keys(codeTable)) {
      const path = findPathToChar(treeRoot, char);
      expect(path).not.toBeNull();
      const codeFromPath = path!.slice(1).map((p) => p.bit).join('');
      expect(codeFromPath).toBe(codeTable[char]);
    }

    // 2. Encoding steps verification
    const encodeSteps = generateEncodingSteps(treeRoot, text, codeTable);
    expect(encodeSteps.length).toBeGreaterThan(text.length);

    // Verify last step produced exact encodedBits
    const lastEncodeStep = encodeSteps[encodeSteps.length - 1];
    expect(lastEncodeStep.stepType).toBe('complete');
    expect(lastEncodeStep.accumulatedBits).toBe(encodedBits);

    // Verify all active nodes exist in the tree
    for (const step of encodeSteps) {
      expect(step.activeNodeId).toBeTruthy();
      if (step.activeEdge) {
        expect(step.activeEdge.from).toBeTruthy();
        expect(step.activeEdge.to).toBeTruthy();
        expect(['0', '1']).toContain(step.activeEdge.label);
      }
    }

    // 3. Decoding steps verification
    const decodeSteps = generateDecodingSteps(treeRoot, encodedBits, text);
    expect(decodeSteps.length).toBeGreaterThan(encodedBits.length);

    const lastDecodeStep = decodeSteps[decodeSteps.length - 1];
    expect(lastDecodeStep.stepType).toBe('complete');
    expect(lastDecodeStep.accumulatedText).toBe(text);

    // Verify leaf reaches emit correct characters
    const leafSteps = decodeSteps.filter((s) => s.stepType === 'leaf-reached');
    expect(leafSteps.length).toBe(text.length);
    const decodedChars = leafSteps.map((s) => s.currentChar).join('');
    expect(decodedChars).toBe(text);
  });

  it('safely handles empty input and edge cases without crashing', () => {
    const emptyEncode = generateEncodingSteps(undefined, '', {});
    expect(emptyEncode.length).toBe(1);
    expect(emptyEncode[0].title).toContain('No Input');

    const emptyDecode = generateDecodingSteps(undefined, '', '');
    expect(emptyDecode.length).toBe(1);
    expect(emptyDecode[0].title).toContain('No Bits');
  });

  it('safely handles single character Huffman tree', () => {
    const singleNodeRoot = {
      id: 'single-1',
      char: 'A',
      freq: 5,
    };
    const codeTable = { A: '0' };
    const encodeSteps = generateEncodingSteps(singleNodeRoot, 'AAAA', codeTable);
    expect(encodeSteps.length).toBeGreaterThan(1);
    expect(encodeSteps[encodeSteps.length - 1].accumulatedBits).toBe('0000');

    const decodeSteps = generateDecodingSteps(singleNodeRoot, '0000', 'AAAA');
    expect(decodeSteps.length).toBeGreaterThan(1);
    expect(decodeSteps[decodeSteps.length - 1].accumulatedText).toBe('AAAA');
  });
});
