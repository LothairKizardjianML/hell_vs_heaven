import { describe, it, expect } from 'vitest';
import { Tilemap } from '../src/physics/tilemap';

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
        [0, 1],
        [2, 3],
      ],
      16,
    );
    expect(tm.tileAt(0, 0)).toBe(0);
    expect(tm.tileAt(1, 0)).toBe(1);
    expect(tm.tileAt(0, 1)).toBe(2);
    expect(tm.tileAt(1, 1)).toBe(3);
  });

  it('tileAt returns 0 for out-of-bounds coords (treated as empty)', () => {
    const tm = new Tilemap([[1, 1]], 16);
    expect(tm.tileAt(-1, 0)).toBe(0);
    expect(tm.tileAt(0, -1)).toBe(0);
    expect(tm.tileAt(2, 0)).toBe(0);
    expect(tm.tileAt(0, 1)).toBe(0);
  });

  it('isSolid: 0 = empty, anything else = solid', () => {
    const tm = new Tilemap([[0, 1, 2]], 16);
    expect(tm.isSolid(0, 0)).toBe(false);
    expect(tm.isSolid(1, 0)).toBe(true);
    expect(tm.isSolid(2, 0)).toBe(true);
  });
});
