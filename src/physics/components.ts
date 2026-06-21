// Physics force components. Pure data; the integrator in `integrator.ts`
// applies them once per simulation step. Components live here (not in
// `@core/components`) so the physics layer owns its own data shapes —
// `core/` stays the shared ECS substrate, free of domain concerns.

export const PHYSICS_COMPONENT = {
  Gravity: 'physics.gravity',
  Drag: 'physics.drag',
  TerminalVelocity: 'physics.terminal-velocity',
  CharacterController: 'physics.character-controller',
  JumpController: 'physics.jump-controller',
  MovementController: 'physics.movement-controller',
  WallController: 'physics.wall-controller',
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
  wallSide: -1 | 0 | 1; // last frame's wall contact: -1 left, 1 right, 0 none
}

export function makeCharacterController(): CharacterController {
  return { grounded: false, wallSide: 0 };
}

// Jump model: tuning + runtime state for variable height, coyote time, jump
// buffering and multi-jump. The pure `stepJump` in `jump.ts` reads the held
// button, the grounded flag and current vy, then mutates this each frame.
// Timers are frame-counted because the sim is fixed-step.
export interface JumpController {
  // tuning
  jumpVelocity: number; // launch vy; negative = up
  maxJumps: number; // total jumps before landing (1 = single, 2 = double)
  coyoteFrames: number; // grace window to still ground-jump after leaving ground
  bufferFrames: number; // grace window for a press made before landing
  cutMultiplier: number; // vy *= this when released while rising (0..1)
  // runtime
  jumpsUsed: number;
  coyoteTimer: number;
  bufferTimer: number;
  prevHeld: boolean;
}

export function makeJumpController(overrides: Partial<JumpController> = {}): JumpController {
  return {
    jumpVelocity: -560,
    maxJumps: 2,
    coyoteFrames: 6,
    bufferFrames: 6,
    cutMultiplier: 0.5,
    jumpsUsed: 0,
    coyoteTimer: 0,
    bufferTimer: 0,
    prevHeld: false,
    ...overrides,
  };
}

// Horizontal movement tuning. Pure data; `stepHorizontalMove` in `movement.ts`
// eases vx toward `moveX * maxSpeed`. Separate ground/air accel + decel give the
// Brawlhalla feel: snappy on the ground, floaty and momentum-heavy in the air.
// All accelerations are world units per second squared.
export interface MovementController {
  maxSpeed: number;
  groundAccel: number; // speeding up toward target while grounded
  groundDecel: number; // slowing to rest (no input) while grounded
  airAccel: number; // speeding up toward target while airborne
  airDecel: number; // slowing to rest (no input) while airborne
}

export function makeMovementController(
  overrides: Partial<MovementController> = {},
): MovementController {
  return {
    maxSpeed: 220,
    groundAccel: 2000,
    groundDecel: 2600,
    airAccel: 1400,
    airDecel: 800,
    ...overrides,
  };
}

// Wall slide + wall jump tuning + the jump button's edge state. The pure
// `stepWall` in `wall.ts` caps descent against a wall and launches up-and-away
// on the press edge. Magnitudes are positive; direction is derived from the
// contact side. `slideSpeed` is the max downward speed while sliding.
export interface WallController {
  slideSpeed: number; // max downward speed while wall-sliding (world u/s)
  jumpVelocityX: number; // horizontal launch away from the wall
  jumpVelocityY: number; // vertical launch; applied upward (negative vy)
  prevJumpHeld: boolean; // runtime: rising-edge detection for the jump button
}

export function makeWallController(overrides: Partial<WallController> = {}): WallController {
  return {
    slideSpeed: 120,
    jumpVelocityX: 320,
    jumpVelocityY: 520,
    prevJumpHeld: false,
    ...overrides,
  };
}
