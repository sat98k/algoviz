import { describe, it, expect } from 'vitest';
import { karatsubaSteps } from '../algorithms/karatsuba';

describe('Karatsuba Multiplication (M1 Divide & Conquer)', () => {
  it('correctly multiplies standard 4-digit numbers 1234 × 5678 = 7006652', () => {
    const num1 = '1234';
    const num2 = '5678';

    const steps = Array.from(karatsubaSteps({ num1, num2 }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.isFinal).toBe(true);
    expect(finalStep.result.product).toBe('7006652');
    expect(finalStep.state.treeNodes.length).toBeGreaterThan(1);
  });

  it('correctly multiplies asymmetric length integers 98765 × 432 = 42666480', () => {
    const num1 = '98765';
    const num2 = '432';

    const steps = Array.from(karatsubaSteps({ num1, num2 }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.isFinal).toBe(true);
    expect(finalStep.result.product).toBe((98765n * 432n).toString());
  });

  it('correctly handles single-digit base cases 7 × 8 = 56', () => {
    const num1 = '7';
    const num2 = '8';

    const steps = Array.from(karatsubaSteps({ num1, num2 }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.isFinal).toBe(true);
    expect(finalStep.result.product).toBe('56');
  });

  it('correctly multiplies large 16-digit integers', () => {
    const num1 = '1234567890123456';
    const num2 = '9876543210987654';
    const expected = (BigInt(num1) * BigInt(num2)).toString();

    const steps = Array.from(karatsubaSteps({ num1, num2 }));
    const finalStep = steps[steps.length - 1];

    expect(finalStep.isFinal).toBe(true);
    expect(finalStep.result.product).toBe(expected);
  });
});
