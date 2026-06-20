// Axis-aligned bounding box collision against a Tilemap. Resolution runs each
// axis independently (X first, then Y) — the canonical platformer pattern.
// Each axis sweeps from the starting edge to the destination edge tile-by-tile
// so fast-moving objects don't tunnel through walls. A small EPS keeps the
// resolved AABB strictly outside the tile face, so the next frame's broad-
// phase doesn't immediately re-collide.

import type { Transform, Collider } from '@core/components';
import type { Tilemap } from './tilemap';

const EPS = 0.001;

export interface AABB {
  x: number; // center x
  y: number; // center y
  halfWidth: number;
  halfHeight: number;
}

export interface CollisionFlags {
  left: boolean;
  right: boolean;
  top: boolean;
  bottom: boolean;
}

export interface ResolveResult {
  resolved: AABB;
  flags: CollisionFlags;
}

export function aabbFromTransformCollider(transform: Transform, collider: Collider): AABB {
  return {
    x: transform.x + collider.offsetX,
    y: transform.y + collider.offsetY,
    halfWidth: collider.width / 2,
    halfHeight: collider.height / 2,
  };
}

export function aabbIntersects(a: AABB, b: AABB): boolean {
  return (
    Math.abs(a.x - b.x) < a.halfWidth + b.halfWidth &&
    Math.abs(a.y - b.y) < a.halfHeight + b.halfHeight
  );
}

export function resolveAabbMove(
  aabb: AABB,
  dx: number,
  dy: number,
  tilemap: Tilemap,
): ResolveResult {
  const flags: CollisionFlags = { left: false, right: false, top: false, bottom: false };
  const size = tilemap.tileSize;
  let x = aabb.x + dx;
  let y = aabb.y;

  if (dx > 0) {
    const oldRight = aabb.x + aabb.halfWidth;
    const newRight = x + aabb.halfWidth;
    const startCol = Math.floor(oldRight / size);
    const endCol = Math.floor(newRight / size);
    const topRow = Math.floor((y - aabb.halfHeight) / size);
    const bottomRow = Math.floor((y + aabb.halfHeight - EPS) / size);
    for (let col = startCol; col <= endCol; col++) {
      if (anyRowSolid(tilemap, col, topRow, bottomRow)) {
        x = col * size - aabb.halfWidth - EPS;
        flags.right = true;
        break;
      }
    }
  } else if (dx < 0) {
    const oldLeft = aabb.x - aabb.halfWidth;
    const newLeft = x - aabb.halfWidth;
    const startCol = Math.floor(oldLeft / size);
    const endCol = Math.floor(newLeft / size);
    const topRow = Math.floor((y - aabb.halfHeight) / size);
    const bottomRow = Math.floor((y + aabb.halfHeight - EPS) / size);
    for (let col = startCol; col >= endCol; col--) {
      if (anyRowSolid(tilemap, col, topRow, bottomRow)) {
        x = (col + 1) * size + aabb.halfWidth + EPS;
        flags.left = true;
        break;
      }
    }
  }

  y = aabb.y + dy;

  if (dy > 0) {
    const oldBottom = aabb.y + aabb.halfHeight;
    const newBottom = y + aabb.halfHeight;
    const startRow = Math.floor(oldBottom / size);
    const endRow = Math.floor(newBottom / size);
    const leftCol = Math.floor((x - aabb.halfWidth) / size);
    const rightCol = Math.floor((x + aabb.halfWidth - EPS) / size);
    for (let row = startRow; row <= endRow; row++) {
      if (anyColSolid(tilemap, row, leftCol, rightCol)) {
        y = row * size - aabb.halfHeight - EPS;
        flags.bottom = true;
        break;
      }
    }
  } else if (dy < 0) {
    const oldTop = aabb.y - aabb.halfHeight;
    const newTop = y - aabb.halfHeight;
    const startRow = Math.floor(oldTop / size);
    const endRow = Math.floor(newTop / size);
    const leftCol = Math.floor((x - aabb.halfWidth) / size);
    const rightCol = Math.floor((x + aabb.halfWidth - EPS) / size);
    for (let row = startRow; row >= endRow; row--) {
      if (anyColSolid(tilemap, row, leftCol, rightCol)) {
        y = (row + 1) * size + aabb.halfHeight + EPS;
        flags.top = true;
        break;
      }
    }
  }

  return {
    resolved: { x, y, halfWidth: aabb.halfWidth, halfHeight: aabb.halfHeight },
    flags,
  };
}

function anyRowSolid(tm: Tilemap, col: number, topRow: number, bottomRow: number): boolean {
  for (let row = topRow; row <= bottomRow; row++) {
    if (tm.isSolid(col, row)) return true;
  }
  return false;
}

function anyColSolid(tm: Tilemap, row: number, leftCol: number, rightCol: number): boolean {
  for (let col = leftCol; col <= rightCol; col++) {
    if (tm.isSolid(col, row)) return true;
  }
  return false;
}
