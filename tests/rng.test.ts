import { describe, it, expect } from 'vitest';
import { Rng } from '../src/core/rng';

describe('Rng', () => {
  it('is deterministic for the same seed', () => {
    const a = new Rng(42);
    const b = new Rng(42);
    const seqA = Array.from({ length: 16 }, () => a.next());
    const seqB = Array.from({ length: 16 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('produces different sequences for different seeds', () => {
    const a = new Rng(1);
    const b = new Rng(2);
    expect(a.next()).not.toEqual(b.next());
  });

  it('int respects bounds inclusively', () => {
    const rng = new Rng(1);
    for (let i = 0; i < 1000; i++) {
      const n = rng.int(5, 10);
      expect(n).toBeGreaterThanOrEqual(5);
      expect(n).toBeLessThanOrEqual(10);
    }
  });

  it('pick returns an element from the array', () => {
    const rng = new Rng(7);
    const items = ['a', 'b', 'c'];
    for (let i = 0; i < 100; i++) {
      expect(items).toContain(rng.pick(items));
    }
  });

  it('shuffle preserves elements', () => {
    const rng = new Rng(123);
    const items = [1, 2, 3, 4, 5];
    const shuffled = rng.shuffle(items);
    expect(shuffled.slice().sort()).toEqual(items);
    expect(shuffled).not.toBe(items);
  });

  it('chance is bounded by probability over many trials', () => {
    const rng = new Rng(99);
    let hits = 0;
    const trials = 10000;
    for (let i = 0; i < trials; i++) if (rng.chance(0.25)) hits++;
    const ratio = hits / trials;
    expect(ratio).toBeGreaterThan(0.22);
    expect(ratio).toBeLessThan(0.28);
  });
});
