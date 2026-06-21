// Pure horizontal movement model. One call per frame returns the new vx, easing
// it toward a target speed at an acceleration chosen by two questions:
//
//   - grounded or airborne? (ground is snappier, air keeps momentum)
//   - speeding up toward the input, or slowing to rest? (accel vs decel)
//
// Reversing direction is just acceleration toward an opposite-sign target — the
// ease naturally carries vx across zero, no special case. Decoupling this from
// the old "snap vx to maxSpeed" gives variable air control without new state:
// the controller is pure tuning data, all runtime is the passed-in vx.

import type { MovementController } from './components';

export interface MoveInput {
  moveX: number; // input axis in [-1, 1]
  grounded: boolean;
  vx: number; // current horizontal velocity
  dt: number; // seconds this step
}

export function stepHorizontalMove(mc: MovementController, input: MoveInput): number {
  const target = input.moveX * mc.maxSpeed;
  const hasInput = input.moveX !== 0;
  const rate = hasInput
    ? input.grounded
      ? mc.groundAccel
      : mc.airAccel
    : input.grounded
      ? mc.groundDecel
      : mc.airDecel;
  return approach(input.vx, target, rate * input.dt);
}

// Move `current` toward `target` by at most `maxDelta`, never overshooting.
function approach(current: number, target: number, maxDelta: number): number {
  if (current < target) return Math.min(current + maxDelta, target);
  if (current > target) return Math.max(current - maxDelta, target);
  return target;
}
