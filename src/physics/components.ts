// Physics force components. Pure data; the integrator in `integrator.ts`
// applies them once per simulation step. Components live here (not in
// `@core/components`) so the physics layer owns its own data shapes —
// `core/` stays the shared ECS substrate, free of domain concerns.

export const PHYSICS_COMPONENT = {
  Gravity: 'physics.gravity',
  Drag: 'physics.drag',
  TerminalVelocity: 'physics.terminal-velocity',
  CharacterController: 'physics.character-controller',
} as const;

export type PhysicsComponentKey = (typeof PHYSICS_COMPONENT)[keyof typeof PHYSICS_COMPONENT];

// Constant downward acceleration in world units per second squared.
export interface Gravity {
  y: number;
}

export function makeGravity(y = 1200): Gravity {
  return { y };
}

// Horizontal velocity damping. Each step, vel.x is multiplied by
// max(0, 1 - x*dt). A value of 0 disables drag.
export interface Drag {
  x: number;
}

export function makeDrag(x = 0): Drag {
  return { x };
}

// Absolute caps applied after gravity + drag, per axis.
export interface TerminalVelocity {
  x: number;
  y: number;
}

export function makeTerminalVelocity(x = Infinity, y = 1500): TerminalVelocity {
  return { x, y };
}

// Per-entity character state. Written by the controller each frame from the
// resolver's collision flags; read by jump / wall-slide / dash logic in later
// subtasks. Lives on the entity (not the scene) so multiple characters can
// share the same code path.
export interface CharacterController {
  grounded: boolean;
}

export function makeCharacterController(): CharacterController {
  return { grounded: false };
}
