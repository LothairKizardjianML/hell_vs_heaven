// Input intents are the boundary between raw devices and gameplay. Devices
// (currently keyboard) translate their state into an InputSnapshot once per
// frame; this module writes that snapshot into the entity's intent components.
// Gameplay systems read the components — they never look at the raw devices,
// which keeps gameplay headless-testable and makes remapping/rollback easier
// later. Attack intents arrive in Phase 4 alongside the combat system that
// actually consumes them.

import type { World, EntityId } from '@core/world';

export const INTENT = {
  Move: 'intent.move',
  Jump: 'intent.jump',
} as const;

export type IntentKey = (typeof INTENT)[keyof typeof INTENT];

// Horizontal movement axis in [-1, 1]. Digital input snaps to {-1, 0, 1};
// analog input (gamepad stick) writes anywhere in the range.
export interface MoveIntent {
  x: number;
}

export function makeMoveIntent(x = 0): MoveIntent {
  return { x };
}

// `pressed` is the current frame's held state. Edge detection (justPressed,
// jump buffering, coyote time) is the platformer controller's job in Phase 2.
export interface JumpIntent {
  pressed: boolean;
}

export function makeJumpIntent(pressed = false): JumpIntent {
  return { pressed };
}

// Device-agnostic per-frame button state.
export interface InputSnapshot {
  left: boolean;
  right: boolean;
  jump: boolean;
}

export function applyInputToIntents(world: World, entity: EntityId, snap: InputSnapshot): void {
  const move = world.getComponent<MoveIntent>(entity, INTENT.Move)!;
  move.x = (snap.right ? 1 : 0) - (snap.left ? 1 : 0);
  const jump = world.getComponent<JumpIntent>(entity, INTENT.Jump)!;
  jump.pressed = snap.jump;
}
