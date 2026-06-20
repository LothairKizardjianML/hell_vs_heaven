// Axis-aligned bounding box collision against a Tilemap. Resolution runs each
// axis independently (X first, then Y) — the canonical platformer pattern. A
// single `sweepAxis` helper handles both directions on both axes; the four
// branches differ only in (a) which AABB edge leads, (b) which tilemap axis to
// scan, and (c) which collision flag to set. The sweep walks tile-by-tile from
// the leading edge's old position to its new position so fast-moving objects
// don't tunnel through walls. A small EPS keeps the resolved AABB strictly
// outside the tile face so the next frame doesn't immediately re-collide.

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

export function resolveAabbMove(
  aabb: AABB,
  dx: number,
  dy: number,
  tilemap: Tilemap,
): ResolveResult {
  const flags: CollisionFlags = { left: false, right: false, top: false, bottom: false };
  const size = tilemap.tileSize;

  let x = aabb.x + dx;
  if (dx !== 0) {
    const dir: 1 | -1 = dx > 0 ? 1 : -1;
    const leadOffset = dir * aabb.halfWidth;
    const perpMin = Math.floor((aabb.y - aabb.halfHeight) / size);
    const perpMax = Math.floor((aabb.y + aabb.halfHeight - EPS) / size);
    const result = sweepAxis({
      leadEdgeOld: aabb.x + leadOffset,
      leadEdgeNew: x + leadOffset,
      perpMin,
      perpMax,
      tileSize: size,
      direction: dir,
      isSolidAt: (lead, perp) => tilemap.isSolid(lead, perp),
    });
    if (result.hit) {
      x = result.blockedLeadEdge - leadOffset;
      if (dir > 0) flags.right = true;
      else flags.left = true;
    }
  }

  let y = aabb.y + dy;
  if (dy !== 0) {
    const dir: 1 | -1 = dy > 0 ? 1 : -1;
    const leadOffset = dir * aabb.halfHeight;
    const perpMin = Math.floor((x - aabb.halfWidth) / size);
    const perpMax = Math.floor((x + aabb.halfWidth - EPS) / size);
    const result = sweepAxis({
      leadEdgeOld: aabb.y + leadOffset,
      leadEdgeNew: y + leadOffset,
      perpMin,
      perpMax,
      tileSize: size,
      direction: dir,
      isSolidAt: (lead, perp) => tilemap.isSolid(perp, lead),
    });
    if (result.hit) {
      y = result.blockedLeadEdge - leadOffset;
      if (dir > 0) flags.bottom = true;
      else flags.top = true;
    }
  }

  return {
    resolved: { x, y, halfWidth: aabb.halfWidth, halfHeight: aabb.halfHeight },
    flags,
  };
}

interface SweepArgs {
  leadEdgeOld: number;
  leadEdgeNew: number;
  perpMin: number;
  perpMax: number;
  tileSize: number;
  direction: 1 | -1;
  isSolidAt: (leadTile: number, perpTile: number) => boolean;
}

interface SweepResult {
  hit: boolean;
  blockedLeadEdge: number;
}

function sweepAxis(args: SweepArgs): SweepResult {
  const startTile = Math.floor(args.leadEdgeOld / args.tileSize);
  const endTile = Math.floor(args.leadEdgeNew / args.tileSize);
  for (
    let lead = startTile;
    args.direction > 0 ? lead <= endTile : lead >= endTile;
    lead += args.direction
  ) {
    for (let perp = args.perpMin; perp <= args.perpMax; perp++) {
      if (args.isSolidAt(lead, perp)) {
        // Snap leading edge to the side of the tile we approached from.
        // Forward: tile's near face = lead * size; back off by EPS so the AABB
        // sits strictly outside. Backward: tile's far face = (lead+1) * size;
        // push out by EPS in the opposite direction.
        const face = args.direction > 0 ? lead * args.tileSize : (lead + 1) * args.tileSize;
        return { hit: true, blockedLeadEdge: face - args.direction * EPS };
      }
    }
  }
  return { hit: false, blockedLeadEdge: args.leadEdgeNew };
}
