import { describe, it, expect } from 'vitest';
import { algorithmRegistry } from '../config/algorithmRegistry';
import {
  getModule2SubCategory,
  MODULE_2_PARADIGM_TRACKS,
  Module2SubCategory,
} from '../pages/ModulePage';

describe('Module 2 Paradigm Splitting & Categories', () => {
  const module2Algorithms = algorithmRegistry.filter((algo) => algo.module === 2);

  it('contains exactly 10 algorithms in Module 2', () => {
    expect(module2Algorithms.length).toBe(10);
  });

  it('correctly maps Dynamic Programming algorithms', () => {
    const dpAlgorithms = module2Algorithms.filter(
      (algo) => getModule2SubCategory(algo.paradigm) === 'dp'
    );
    expect(dpAlgorithms.length).toBe(5);
    const ids = dpAlgorithms.map((a) => a.id);
    expect(ids).toContain('knapsack-dp');
    expect(ids).toContain('lcs');
    expect(ids).toContain('matrix-chain-multiplication');
    expect(ids).toContain('assembly-line-scheduling');
    expect(ids).toContain('tsp');
  });

  it('correctly maps Backtracking algorithms', () => {
    const btAlgorithms = module2Algorithms.filter(
      (algo) => getModule2SubCategory(algo.paradigm) === 'backtracking'
    );
    expect(btAlgorithms.length).toBe(3);
    const ids = btAlgorithms.map((a) => a.id);
    expect(ids).toContain('n-queens');
    expect(ids).toContain('subset-sum');
    expect(ids).toContain('graph-coloring');
  });

  it('correctly maps Branch & Bound algorithms', () => {
    const bbAlgorithms = module2Algorithms.filter(
      (algo) => getModule2SubCategory(algo.paradigm) === 'branch-and-bound'
    );
    expect(bbAlgorithms.length).toBe(2);
    const ids = bbAlgorithms.map((a) => a.id);
    expect(ids).toContain('knapsack-bb');
    expect(ids).toContain('job-selection-bb');
  });

  it('partitions all Module 2 algorithms completely (5 + 3 + 2 = 10)', () => {
    const categories: Record<Module2SubCategory, number> = {
      dp: 0,
      backtracking: 0,
      'branch-and-bound': 0,
    };

    for (const algo of module2Algorithms) {
      const cat = getModule2SubCategory(algo.paradigm);
      expect(cat).not.toBeNull();
      if (cat) {
        categories[cat]++;
      }
    }

    expect(categories.dp).toBe(5);
    expect(categories.backtracking).toBe(3);
    expect(categories['branch-and-bound']).toBe(2);
    expect(categories.dp + categories.backtracking + categories['branch-and-bound']).toBe(10);
  });

  it('has valid metadata in MODULE_2_PARADIGM_TRACKS for all 3 paradigms', () => {
    const keys: Module2SubCategory[] = ['dp', 'backtracking', 'branch-and-bound'];
    for (const key of keys) {
      const track = MODULE_2_PARADIGM_TRACKS[key];
      expect(track).toBeDefined();
      expect(track.id).toBe(key);
      expect(track.name).toBeTruthy();
      expect(track.badge).toBeTruthy();
      expect(track.tagline).toBeTruthy();
      expect(track.description).toBeTruthy();
      expect(track.coreConcepts.length).toBeGreaterThan(0);
      expect(track.algorithmsCount).toBeGreaterThan(0);
    }
  });

  it('handles variations in paradigm strings gracefully', () => {
    expect(getModule2SubCategory('Dynamic Programming')).toBe('dp');
    expect(getModule2SubCategory('dp')).toBe('dp');
    expect(getModule2SubCategory('Backtracking')).toBe('backtracking');
    expect(getModule2SubCategory('Branch & Bound')).toBe('branch-and-bound');
    expect(getModule2SubCategory('Branch and Bound')).toBe('branch-and-bound');
    expect(getModule2SubCategory('Unknown Paradigm')).toBeNull();
  });
});
