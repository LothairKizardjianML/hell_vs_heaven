// Pure jump model. One call per frame mutates the JumpController's timers and
// returns the new vertical velocity. Folds four platformer feel features into a
// single uniform rule:
//
//   - Variable height : releasing the button while rising cuts upward speed.
//   - Coyote time      : a ground jump is still allowed for a few frames after
//                        walking off a ledge.
//   - Jump buffering   : a press made just before landing fires on touchdown.
//   - Multi-jump       : up to `maxJumps` jumps before the next landing.
//
// Coyote folds into the jump counter: while grounded (or inside the coyote
// window) `jumpsUsed` stays 0, so the first buffered press is the ground jump.
// Once the window lapses without jumping we forfeit that ground jump
// (`jumpsUsed -> 1`) so a double-jump character keeps exactly maxJumps-1 air
// jumps after a walk-off, and a single-jump character gets nothing.

import type { JumpController } from './components';

export interface JumpInput {
  held: boolean; // jump button held this frame
  grounded: boolean; // character's ground contact this frame
  vy: number; // current vertical velocity (after gravity)
}

export interface JumpResult {
  vy: number;
  jumped: boolean;
}

export function stepJump(jc: JumpController, input: JumpInput): JumpResult {
  const justPressed = input.held && !jc.prevHeld;
  const released = !input.held && jc.prevHeld;

  // Ground arms the coyote window and refills jumps. Airborne bleeds the window;
  // when it empties (or never existed) an unused ground jump is forfeited.
  if (input.grounded) {
    jc.coyoteTimer = jc.coyoteFrames;
    jc.jumpsUsed = 0;
  } else if (jc.coyoteTimer > 0) {
    jc.coyoteTimer -= 1;
    if (jc.coyoteTimer === 0 && jc.jumpsUsed === 0) jc.jumpsUsed = 1;
  } else if (jc.jumpsUsed === 0) {
    jc.jumpsUsed = 1;
  }

  // Arm the input buffer on a fresh press, otherwise let it bleed down.
  if (justPressed) jc.bufferTimer = jc.bufferFrames;
  else if (jc.bufferTimer > 0) jc.bufferTimer -= 1;

  let vy = input.vy;
  let jumped = false;
  if (jc.bufferTimer > 0 && jc.jumpsUsed < jc.maxJumps) {
    vy = jc.jumpVelocity;
    jc.jumpsUsed += 1;
    jc.bufferTimer = 0;
    jc.coyoteTimer = 0;
    jumped = true;
  }

  // Variable height: a release while still ascending trims the arc. Skip a jump
  // that launched this same frame — a buffered jump firing on the release frame
  // (e.g. release + land coincide) must keep its full height, not get halved.
  if (released && !jumped && vy < 0) vy *= jc.cutMultiplier;

  jc.prevHeld = input.held;
  return { vy, jumped };
}
