import { describe, it, expect } from 'vitest';
import { Tilemap, TILE } from '../src/physics/tilemap';

describe('TILE constants', () => {
  it('exposes Empty, Solid, OneWayUp', () => {
    expect(TILE.Empty).toBe(0);
    expect(TILE.Solid).toBe(1);
    expect(TILE.OneWayUp).toBe(2);
  });
});

describe('Tilemap', () => {
  it('exposes column / row counts and pixel dimensions from grid + tile size', () => {
    const tm = new Tilemap(
      [
        [0, 0, 0],
        [1, 1, 1],
      ],
      16,
    );
    expect(tm.cols).toBe(3);
    expect(tm.rows).toBe(2);
    expect(tm.tileSize).toBe(16);
    expect(tm.widthPx).toBe(48);
    expect(tm.heightPx).toBe(32);
  });

  it('tileAt returns the tile id', () => {
    const tm = new Tilemap(
      [
        [TILE.Empty, TILE.Solid],
        [TILE.OneWayUp, TILE.Empty],
      ],
      16,
    );
    expect(tm.tileAt(0, 0)).toBe(TILE.Empty);
    expect(tm.tileAt(1, 0)).toBe(TILE.Solid);
    expect(tm.tileAt(0, 1)).toBe(TILE.OneWayUp);
    expect(tm.tileAt(1, 1)).toBe(TILE.Empty);
  });

  it('tileAt returns 0 for out-of-bounds coords (treated as empty)', () => {
    const tm = new Tilemap([[1, 1]], 16);
    expect(tm.tileAt(-1, 0)).toBe(0);
    expect(tm.tileAt(0, -1)).toBe(0);
    expect(tm.tileAt(2, 0)).toBe(0);
    expect(tm.tileAt(0, 1)).toBe(0);
  });

  it('isSolid is true only for TILE.Solid (1) — one-way platforms are NOT generally solid', () => {
    const tm = new Tilemap([[TILE.Empty, TILE.Solid, TILE.OneWayUp]], 16);
    expect(tm.isSolid(0, 0)).toBe(false);
    expect(tm.isSolid(1, 0)).toBe(true);
    expect(tm.isSolid(2, 0)).toBe(false);
  });

  it('isOneWayUp is true only for TILE.OneWayUp (2)', () => {
    const tm = new Tilemap([[TILE.Empty, TILE.Solid, TILE.OneWayUp]], 16);
    expect(tm.isOneWayUp(0, 0)).toBe(false);
    expect(tm.isOneWayUp(1, 0)).toBe(false);
    expect(tm.isOneWayUp(2, 0)).toBe(true);
  });
});
