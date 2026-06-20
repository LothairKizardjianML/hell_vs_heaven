// Core component shapes. Data only — no methods, no class behavior. Systems
// read these and act on them. Factory functions exist so callers don't repeat
// default values across the codebase.

export const COMPONENT = {
  Transform: 'transform',
  Velocity: 'velocity',
  Collider: 'collider',
  Sprite: 'sprite',
} as const;

export type ComponentKey = (typeof COMPONENT)[keyof typeof COMPONENT];

// World-space position and rotation (radians).
export interface Transform {
  x: number;
  y: number;
  rotation: number;
}

export function makeTransform(x = 0, y = 0, rotation = 0): Transform {
  return { x, y, rotation };
}

// Linear velocity in world units per second.
export interface Velocity {
  x: number;
  y: number;
}

export function makeVelocity(x = 0, y = 0): Velocity {
  return { x, y };
}

// Axis-aligned bounding box relative to the entity's Transform.
export interface Collider {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

export function makeCollider(width: number, height: number, offsetX = 0, offsetY = 0): Collider {
  return { width, height, offsetX, offsetY };
}

// Renderer hint: which texture to draw, tint as 0xRRGGBB, depth for sort order.
export interface Sprite {
  textureKey: string;
  tint: number;
  depth: number;
}

export interface SpriteOptions {
  tint?: number;
  depth?: number;
}

export function makeSprite(textureKey: string, opts: SpriteOptions = {}): Sprite {
  return {
    textureKey,
    tint: opts.tint ?? 0xffffff,
    depth: opts.depth ?? 0,
  };
}
