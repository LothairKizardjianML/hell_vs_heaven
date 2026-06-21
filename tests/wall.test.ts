import { describe, it, expect } from 'vitest';
import { makeWallController } from '../src/physics/components';
import { stepWall } from '../src/physics/wall';

// Wall slide + wall jump is a pure per-frame function over a WallController.
// `wallSide` is the contact reported by last frame's collision resolver:
// -1 = wall on the left, 1 = wall on the right, 0 = no wall. The controller
// owns its own jump-button edge (`prevJumpHeld`) so a wall jump fires on the
// rising edge only, exactly like the jump model.

describe('wall slide', () => {
  it('caps descent to slideSpeed while falling and holding into a wall', () => {
    const wc = makeWallController({ slideSpeed: 120 });
    const r = stepWall(wc, { wallSide: 1, moveX: 1, grounded: false, jumpHeld: false, vx: 0, vy: 600 });
    expect(r.sliding).toBe(true);
    expect(r.vy).toBe(120);
  });

  it('does not speed a slow fall up to slideSpeed — only clamps', () => {
    const wc = makeWallController({ slideSpeed: 120 });
    const r = stepWall(wc, { wallSide: 1, moveX: 1, grounded: false, jumpHeld: false, vx: 0, vy: 50 });
    expect(r.sliding).toBe(true);
    expect(r.vy).toBe(50);
  });

  it('does not slide when not holding toward the wall', () => {
    const wc = makeWallController({ slideSpeed: 120 });
    const r = stepWall(wc, { wallSide: 1, moveX: -1, grounded: false, jumpHeld: false, vx: 0, vy: 600 });
    expect(r.sliding).toBe(false);
    expect(r.vy).toBe(600);
  });

  it('does not slide while rising', () => {
    const wc = makeWallController({ slideSpeed: 120 });
    const r = stepWall(wc, { wallSide: 1, moveX: 1, grounded: false, jumpHeld: false, vx: 0, vy: -300 });
    expect(r.sliding).toBe(false);
    expect(r.vy).toBe(-300);
  });

  it('does not slide while grounded', () => {
    const wc = makeWallController({ slideSpeed: 120 });
    const r = stepWall(wc, { wallSide: 1, moveX: 1, grounded: true, jumpHeld: false, vx: 0, vy: 600 });
    expect(r.sliding).toBe(false);
    expect(r.vy).toBe(600);
  });

  it('does not slide with no wall contact', () => {
    const wc = makeWallController({ slideSpeed: 120 });
    const r = stepWall(wc, { wallSide: 0, moveX: 1, grounded: false, jumpHeld: false, vx: 0, vy: 600 });
    expect(r.sliding).toBe(false);
    expect(r.vy).toBe(600);
  });
});

describe('wall jump', () => {
  it('launches up and away from a right-side wall on the press edge', () => {
    const wc = makeWallController({ jumpVelocityX: 320, jumpVelocityY: 520 });
    const r = stepWall(wc, { wallSide: 1, moveX: 1, grounded: false, jumpHeld: true, vx: 0, vy: 600 });
    expect(r.jumped).toBe(true);
    expect(r.vy).toBe(-520); // up
    expect(r.vx).toBe(-320); // away from the right wall = leftward
  });

  it('launches away from a left-side wall (mirror)', () => {
    const wc = makeWallController({ jumpVelocityX: 320, jumpVelocityY: 520 });
    const r = stepWall(wc, { wallSide: -1, moveX: -1, grounded: false, jumpHeld: true, vx: 0, vy: 600 });
    expect(r.jumped).toBe(true);
    expect(r.vx).toBe(320); // rightward, away from the left wall
  });

  it('takes precedence over sliding on the press frame', () => {
    const wc = makeWallController({ slideSpeed: 120, jumpVelocityY: 520 });
    const r = stepWall(wc, { wallSide: 1, moveX: 1, grounded: false, jumpHeld: true, vx: 0, vy: 600 });
    expect(r.jumped).toBe(true);
    expect(r.sliding).toBe(false);
    expect(r.vy).toBe(-520);
  });

  it('does not re-fire while the button stays held', () => {
    const wc = makeWallController({ jumpVelocityY: 520 });
    const first = stepWall(wc, { wallSide: 1, moveX: 0, grounded: false, jumpHeld: true, vx: 0, vy: 600 });
    expect(first.jumped).toBe(true);
    const held = stepWall(wc, { wallSide: 1, moveX: 0, grounded: false, jumpHeld: true, vx: -320, vy: -520 });
    expect(held.jumped).toBe(false);
  });

  it('does not wall jump while grounded (that is a normal jump)', () => {
    const wc = makeWallController();
    const r = stepWall(wc, { wallSide: 1, moveX: 1, grounded: true, jumpHeld: true, vx: 0, vy: 0 });
    expect(r.jumped).toBe(false);
  });

  it('does not wall jump with no wall contact', () => {
    const wc = makeWallController();
    const r = stepWall(wc, { wallSide: 0, moveX: 0, grounded: false, jumpHeld: true, vx: 5, vy: 600 });
    expect(r.jumped).toBe(false);
    expect(r.vx).toBe(5);
    expect(r.vy).toBe(600);
  });
});
