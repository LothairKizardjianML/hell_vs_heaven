import { describe, it, expect } from 'vitest';
import { resolveAabbMove, type AABB } from '../src/physics/aabb';
import { Tilemap, TILE } from '../src/physics/tilemap';

// One-way platform at row 3 (col 0..4). Player can pass through it from below
// and walk through it sideways, but lands on it when falling from above.
const ONE_WAY_MAP = new Tilemap(
  [
    [TILE.Empty, TILE.Empty, TILE.Empty, TILE.Empty, TILE.Empty],
    [TILE.Empty, TILE.Empty, TILE.Empty, TILE.Empty, TILE.Empty],
    [TILE.Empty, TILE.Empty, TILE.Empty, TILE.Empty, TILE.Empty],
    [TILE.OneWayUp, TILE.OneWayUp, TILE.OneWayUp, TILE.OneWayUp, TILE.OneWayUp],
    [TILE.Empty, TILE.Empty, TILE.Empty, TILE.Empty, TILE.Empty],
  ],
  16,
);

describe('one-way platforms', () => {
  it('lands on top when falling from above (flags.bottom + snapped y)', () => {
    // AABB at y=32 (bottom edge = 40), platform top at y=48. Fall 20px.
    const aabb: AABB = { x: 24, y: 32, halfWidth: 8, halfHeight: 8 };
    const { resolved, flags } = resolveAabbMove(aabb, 0, 20, ONE_WAY_MAP);
    expect(flags.bottom).toBe(true);
    expect(resolved.y + aabb.halfHeight).toBeCloseTo(48, 1);
  });

  it('passes through when jumping up from below (no top flag, full y movement)', () => {
    // AABB below platform: y=72 (bottom row), bottom edge=80. Jump up 40px.
    const aabb: AABB = { x: 24, y: 72, halfWidth: 8, halfHeight: 8 };
    const { resolved, flags } = resolveAabbMove(aabb, 0, -40, ONE_WAY_MAP);
    expect(flags.top).toBe(false);
    expect(resolved.y).toBeCloseTo(32, 1);
  });

  it('passes through when moving sideways at platform height', () => {
    // AABB inside platform row, moving right
    const aabb: AABB = { x: 8, y: 56, halfWidth: 4, halfHeight: 4 };
    const { resolved, flags } = resolveAabbMove(aabb, 40, 0, ONE_WAY_MAP);
    expect(flags.left).toBe(false);
    expect(flags.right).toBe(false);
    expect(resolved.x).toBeCloseTo(48, 1);
  });

  it('zero dy does not push an AABB resting on the platform top', () => {
    // AABB sits flush on top: bottom edge at y=48.
    const aabb: AABB = { x: 24, y: 40, halfWidth: 8, halfHeight: 8 };
    const { resolved, flags } = resolveAabbMove(aabb, 0, 0, ONE_WAY_MAP);
    expect(flags.bottom).toBe(false);
    expect(resolved.y).toBe(40);
  });

  it('a tiny downward step from resting still snaps to the platform top', () => {
    // Already on top; gravity nudges 0.5px down. Should snap back.
    const aabb: AABB = { x: 24, y: 40, halfWidth: 8, halfHeight: 8 };
    const { resolved, flags } = resolveAabbMove(aabb, 0, 0.5, ONE_WAY_MAP);
    expect(flags.bottom).toBe(true);
    expect(resolved.y + aabb.halfHeight).toBeCloseTo(48, 1);
  });

  it('mixed map: solid tile still blocks every direction, one-way only Y-down', () => {
    const mixed = new Tilemap(
      [
        [TILE.Empty, TILE.Empty, TILE.Empty],
        [TILE.Empty, TILE.Empty, TILE.Empty],
        [TILE.Solid, TILE.OneWayUp, TILE.Empty],
      ],
      16,
    );
    // Move up into the solid tile at (col 0, row 2): top should block.
    const upIntoSolid = resolveAabbMove(
      { x: 8, y: 40, halfWidth: 4, halfHeight: 4 },
      0,
      -8,
      mixed,
    );
    expect(upIntoSolid.flags.top).toBe(true);

    // Move up into the one-way tile at (col 1, row 2): should pass.
    const upIntoOneWay = resolveAabbMove(
      { x: 24, y: 40, halfWidth: 4, halfHeight: 4 },
      0,
      -8,
      mixed,
    );
    expect(upIntoOneWay.flags.top).toBe(false);
  });
});
