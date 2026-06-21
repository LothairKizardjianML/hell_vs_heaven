import { describe, it, expect } from 'vitest';
import { makeJumpController } from '../src/physics/components';
import { stepJump } from '../src/physics/jump';

// The jump model is a pure per-frame function over a JumpController. Timers are
// frame-counted (the sim is fixed-step). Each test drives stepJump frame by
// frame with explicit { held, grounded, vy } inputs.

describe('jump model', () => {
  it('launches a ground jump on the rising edge of held', () => {
    const jc = makeJumpController({ jumpVelocity: -500 });
    const r = stepJump(jc, { held: true, grounded: true, vy: 0 });
    expect(r.jumped).toBe(true);
    expect(r.vy).toBe(-500);
  });

  it('does not re-fire while the button stays held on the ground', () => {
    const jc = makeJumpController({ jumpVelocity: -500 });
    stepJump(jc, { held: true, grounded: true, vy: 0 });
    const r = stepJump(jc, { held: true, grounded: true, vy: 0 });
    expect(r.jumped).toBe(false);
  });

  it('cuts upward velocity when released while still rising (variable height)', () => {
    const jc = makeJumpController({ jumpVelocity: -500, cutMultiplier: 0.5 });
    stepJump(jc, { held: true, grounded: true, vy: 0 }); // jump
    const r = stepJump(jc, { held: false, grounded: false, vy: -480 }); // release, rising
    expect(r.jumped).toBe(false);
    expect(r.vy).toBeCloseTo(-240);
  });

  it('does not cut when released while already falling', () => {
    const jc = makeJumpController({ cutMultiplier: 0.5 });
    stepJump(jc, { held: true, grounded: true, vy: 0 });
    const r = stepJump(jc, { held: false, grounded: false, vy: 120 }); // falling
    expect(r.vy).toBe(120);
  });

  it('allows a ground jump within the coyote window after leaving ground', () => {
    const jc = makeJumpController({ jumpVelocity: -500, coyoteFrames: 6, maxJumps: 1 });
    stepJump(jc, { held: false, grounded: true, vy: 0 }); // arm coyote
    stepJump(jc, { held: false, grounded: false, vy: 100 }); // airborne, still in window
    const r = stepJump(jc, { held: true, grounded: false, vy: 120 });
    expect(r.jumped).toBe(true);
    expect(r.vy).toBe(-500);
  });

  it('refuses the ground jump for a single-jump char once coyote expires', () => {
    const jc = makeJumpController({ coyoteFrames: 3, maxJumps: 1 });
    stepJump(jc, { held: false, grounded: true, vy: 0 }); // arm coyote = 3
    for (let i = 0; i < 3; i++) stepJump(jc, { held: false, grounded: false, vy: 100 });
    const r = stepJump(jc, { held: true, grounded: false, vy: 100 });
    expect(r.jumped).toBe(false);
  });

  it('buffers a press made just before landing and fires it on touchdown', () => {
    const jc = makeJumpController({ bufferFrames: 6, maxJumps: 1, jumpVelocity: -500 });
    stepJump(jc, { held: true, grounded: true, vy: 0 }); // ground jump, jumps spent
    stepJump(jc, { held: false, grounded: false, vy: -400 }); // release midair
    const press = stepJump(jc, { held: true, grounded: false, vy: 200 }); // no jumps left
    expect(press.jumped).toBe(false);
    const land = stepJump(jc, { held: true, grounded: true, vy: 0 }); // land within buffer
    expect(land.jumped).toBe(true);
    expect(land.vy).toBe(-500);
  });

  it('supports a double jump and caps at maxJumps', () => {
    const jc = makeJumpController({ maxJumps: 2, jumpVelocity: -500 });
    expect(stepJump(jc, { held: true, grounded: true, vy: 0 }).jumped).toBe(true); // 1
    stepJump(jc, { held: false, grounded: false, vy: -300 }); // release
    expect(stepJump(jc, { held: true, grounded: false, vy: 100 }).jumped).toBe(true); // 2
    stepJump(jc, { held: false, grounded: false, vy: -300 }); // release
    expect(stepJump(jc, { held: true, grounded: false, vy: 100 }).jumped).toBe(false); // capped
  });

  it('forfeits the grounded jump on a walk-off, leaving maxJumps-1 air jumps', () => {
    const jc = makeJumpController({ maxJumps: 2, coyoteFrames: 2 });
    stepJump(jc, { held: false, grounded: true, vy: 0 }); // arm coyote = 2
    stepJump(jc, { held: false, grounded: false, vy: 50 }); // 2 -> 1
    stepJump(jc, { held: false, grounded: false, vy: 80 }); // 1 -> 0, forfeit one jump
    expect(stepJump(jc, { held: true, grounded: false, vy: 100 }).jumped).toBe(true); // air jump
    stepJump(jc, { held: false, grounded: false, vy: -300 }); // release
    expect(stepJump(jc, { held: true, grounded: false, vy: 100 }).jumped).toBe(false); // none left
  });

  it('resets the jump count when grounded again', () => {
    const jc = makeJumpController({ maxJumps: 1 });
    stepJump(jc, { held: true, grounded: true, vy: 0 }); // jump
    stepJump(jc, { held: false, grounded: false, vy: -200 }); // air
    stepJump(jc, { held: false, grounded: true, vy: 0 }); // land, reset
    expect(stepJump(jc, { held: true, grounded: true, vy: 0 }).jumped).toBe(true);
  });
});
