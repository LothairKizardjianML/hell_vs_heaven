// Pure wall slide + wall jump model. One call per frame returns the new vx/vy
// plus whether the character is sliding or just wall-jumped. Two airborne
// behaviours fold into one wall-contact branch:
//
//   - Wall jump  : on the jump button's rising edge, launch up and away from
//                  the wall. Always available on a wall, regardless of how many
//                  air jumps are spent — that's the recovery tool.
//   - Wall slide : while falling and holding into the wall, cap the descent to
//                  a slow `slideSpeed` so the wall can be climbed/recovered.
//
// The jump takes precedence on the press frame. The controller owns its own
// `prevJumpHeld` so the edge is detected here, mirroring the jump model — one
// shared button, but each model tracks its own edge and the scene resolves who
// consumes the press.

import type { WallController } from './components';

export interface WallInput {
  wallSide: -1 | 0 | 1; // contact from last frame: -1 left, 1 right, 0 none
  moveX: number; // input axis in [-1, 1]
  grounded: boolean;
  jumpHeld: boolean; // jump button held this frame
  vx: number;
  vy: number; // current vertical velocity (after gravity); down is positive
}

export interface WallResult {
  vx: number;
  vy: number;
  sliding: boolean;
  jumped: boolean;
}

export function stepWall(wc: WallController, input: WallInput): WallResult {
  const justPressed = input.jumpHeld && !wc.prevJumpHeld;
  wc.prevJumpHeld = input.jumpHeld;

  let vx = input.vx;
  let vy = input.vy;
  let sliding = false;
  let jumped = false;

  const onWall = input.wallSide !== 0 && !input.grounded;
  if (onWall) {
    if (justPressed) {
      vy = -wc.jumpVelocityY;
      vx = -input.wallSide * wc.jumpVelocityX;
      jumped = true;
    } else if (vy > 0 && Math.sign(input.moveX) === input.wallSide) {
      // Falling and pressing into the wall — drag the descent down to a crawl.
      vy = Math.min(vy, wc.slideSpeed);
      sliding = true;
    }
  }

  return { vx, vy, sliding, jumped };
}
