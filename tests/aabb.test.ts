import { describe, it, expect } from 'vitest';
import {
  aabbFromTransformCollider,
  aabbIntersects,
  resolveAabbMove,
  type AABB,
} from '../src/physics/aabb';
import { Tilemap } from '../src/physics/tilemap';
import { makeTransform } from '../src/core/components';

describe('aabbFromTransformCollider', () => {
  it('builds an AABB centered on the transform with no offset', () => {
    const t = makeTransform(100, 200);
    const c = { width: 32, height: 48, offsetX: 0, offsetY: 0 };
    expect(aabbFromTransformCollider(t, c)).toEqual({
      x: 100,
      y: 200,
      halfWidth: 16,
      halfHeight: 24,
    });
  });

  it('shifts by the collider offset', () => {
    const t = makeTransform(100, 200);
    const c = { width: 32, height: 48, offsetX: 5, offsetY: -10 };
    expect(aabbFromTransformCollider(t, c)).toEqual({
      x: 105,
      y: 190,
      halfWidth: 16,
      halfHeight: 24,
    });
  });
});

describe('aabbIntersects', () => {
  it('returns true when boxes overlap', () => {
    const a: AABB = { x: 0, y: 0, halfWidth: 10, halfHeight: 10 };
    const b: AABB = { x: 5, y: 5, halfWidth: 10, halfHeight: 10 };
    expect(aabbIntersects(a, b)).toBe(true);
  });

  it('returns false when boxes are clearly apart', () => {
    const a: AABB = { x: 0, y: 0, halfWidth: 10, halfHeight: 10 };
    const b: AABB = { x: 25, y: 0, halfWidth: 10, halfHeight: 10 };
    expect(aabbIntersects(a, b)).toBe(false);
  });

  it('returns false when edges just touch (exclusive)', () => {
    const a: AABB = { x: 0, y: 0, halfWidth: 10, halfHeight: 10 };
    const b: AABB = { x: 20, y: 0, halfWidth: 10, halfHeight: 10 };
    expect(aabbIntersects(a, b)).toBe(false);
  });
});

// Floor at row 5 in a 10-wide map, 16-px tiles.
const FLOOR_MAP = new Tilemap(
  [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  16,
);

describe('resolveAabbMove', () => {
  it('no collision in open space → position updated, no flags', () => {
    const aabb: AABB = { x: 24, y: 24, halfWidth: 8, halfHeight: 8 };
    const { resolved, flags } = resolveAabbMove(aabb, 5, 5, FLOOR_MAP);
    expect(resolved.x).toBeCloseTo(29);
    expect(resolved.y).toBeCloseTo(29);
    expect(flags).toEqual({ left: false, right: false, top: false, bottom: false });
  });

  it('zero displacement leaves position untouched and no flags', () => {
    const aabb: AABB = { x: 24, y: 24, halfWidth: 8, halfHeight: 8 };
    const { resolved, flags } = resolveAabbMove(aabb, 0, 0, FLOOR_MAP);
    expect(resolved).toEqual(aabb);
    expect(flags).toEqual({ left: false, right: false, top: false, bottom: false });
  });

  it('falling onto floor snaps bottom to floor top + sets flags.bottom', () => {
    const aabb: AABB = { x: 40, y: 60, halfWidth: 8, halfHeight: 8 };
    const { resolved, flags } = resolveAabbMove(aabb, 0, 30, FLOOR_MAP);
    expect(flags.bottom).toBe(true);
    expect(flags.top).toBe(false);
    expect(resolved.y + aabb.halfHeight).toBeLessThanOrEqual(80);
    expect(resolved.y + aabb.halfHeight).toBeCloseTo(80, 1);
  });

  it('hitting wall while moving right snaps to wall left + sets flags.right', () => {
    const wallMap = new Tilemap(
      [
        [0, 0, 0, 0, 1],
        [0, 0, 0, 0, 1],
        [0, 0, 0, 0, 1],
      ],
      16,
    );
    const aabb: AABB = { x: 24, y: 24, halfWidth: 8, halfHeight: 8 };
    const { resolved, flags } = resolveAabbMove(aabb, 50, 0, wallMap);
    expect(flags.right).toBe(true);
    expect(resolved.x + aabb.halfWidth).toBeCloseTo(64, 1);
  });

  it('hitting wall while moving left snaps to wall right + sets flags.left', () => {
    const wallMap = new Tilemap(
      [
        [1, 0, 0, 0, 0],
        [1, 0, 0, 0, 0],
        [1, 0, 0, 0, 0],
      ],
      16,
    );
    const aabb: AABB = { x: 50, y: 24, halfWidth: 8, halfHeight: 8 };
    const { resolved, flags } = resolveAabbMove(aabb, -40, 0, wallMap);
    expect(flags.left).toBe(true);
    expect(resolved.x - aabb.halfWidth).toBeCloseTo(16, 1);
  });

  it('hitting ceiling while jumping up snaps to ceiling bottom + sets flags.top', () => {
    const ceilingMap = new Tilemap(
      [
        [1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
      ],
      16,
    );
    const aabb: AABB = { x: 24, y: 40, halfWidth: 8, halfHeight: 8 };
    const { resolved, flags } = resolveAabbMove(aabb, 0, -30, ceilingMap);
    expect(flags.top).toBe(true);
    expect(resolved.y - aabb.halfHeight).toBeCloseTo(16, 1);
  });

  it('resolves X and Y independently so both flags can fire from one move', () => {
    // Wall at col 4, floor at row 3.
    const cornerMap = new Tilemap(
      [
        [0, 0, 0, 0, 1],
        [0, 0, 0, 0, 1],
        [0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1],
      ],
      16,
    );
    const aabb: AABB = { x: 24, y: 24, halfWidth: 8, halfHeight: 8 };
    const { resolved, flags } = resolveAabbMove(aabb, 50, 30, cornerMap);
    expect(flags.right).toBe(true);
    expect(flags.bottom).toBe(true);
    expect(resolved.x + aabb.halfWidth).toBeCloseTo(64, 1);
    expect(resolved.y + aabb.halfHeight).toBeCloseTo(48, 1);
  });

  it('fast movement spanning multiple tiles still stops at the first solid', () => {
    const wallMap = new Tilemap(
      [
        [0, 0, 0, 1, 0, 0, 0, 1],
        [0, 0, 0, 1, 0, 0, 0, 1],
      ],
      16,
    );
    const aabb: AABB = { x: 8, y: 8, halfWidth: 4, halfHeight: 4 };
    const { resolved, flags } = resolveAabbMove(aabb, 200, 0, wallMap);
    expect(flags.right).toBe(true);
    // First wall is at col 3 → leftmost solid edge at x = 48.
    expect(resolved.x + aabb.halfWidth).toBeCloseTo(48, 1);
  });
});
