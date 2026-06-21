import { describe, it, expect } from 'vitest';
import { makeMovementController } from '../src/physics/components';
import { stepHorizontalMove } from '../src/physics/movement';

// Horizontal movement is a pure per-frame function: it eases vx toward a target
// (input * maxSpeed) at an acceleration that depends on whether the character is
// grounded or airborne, and on whether it's speeding up or slowing down. Timers
// are seconds; the sim is fixed-step so callers pass a constant dt.

describe('horizontal movement', () => {
  it('accelerates toward maxSpeed without snapping there in one frame', () => {
    const mc = makeMovementController({ maxSpeed: 220, groundAccel: 2000 });
    const vx = stepHorizontalMove(mc, { moveX: 1, grounded: true, vx: 0, dt: 1 / 60 });
    expect(vx).toBeGreaterThan(0);
    expect(vx).toBeLessThan(220);
    expect(vx).toBeCloseTo(2000 / 60); // accel * dt
  });

  it('clamps to maxSpeed instead of overshooting on a large step', () => {
    const mc = makeMovementController({ maxSpeed: 220, groundAccel: 2000 });
    const vx = stepHorizontalMove(mc, { moveX: 1, grounded: true, vx: 0, dt: 1 });
    expect(vx).toBe(220);
  });

  it('decelerates toward rest when there is no input', () => {
    const mc = makeMovementController({ groundDecel: 2600 });
    const vx = stepHorizontalMove(mc, { moveX: 0, grounded: true, vx: 200, dt: 1 / 60 });
    expect(vx).toBeGreaterThan(0);
    expect(vx).toBeLessThan(200);
    expect(vx).toBeCloseTo(200 - 2600 / 60);
  });

  it('clamps to exactly zero instead of reversing past it', () => {
    const mc = makeMovementController({ groundDecel: 2600 });
    const vx = stepHorizontalMove(mc, { moveX: 0, grounded: true, vx: 10, dt: 1 });
    expect(vx).toBe(0);
  });

  it('accelerates slower in the air than on the ground', () => {
    const mc = makeMovementController({ maxSpeed: 220, groundAccel: 2000, airAccel: 1200 });
    const ground = stepHorizontalMove(mc, { moveX: 1, grounded: true, vx: 0, dt: 1 / 60 });
    const air = stepHorizontalMove(mc, { moveX: 1, grounded: false, vx: 0, dt: 1 / 60 });
    expect(air).toBeLessThan(ground);
    expect(air).toBeCloseTo(1200 / 60);
  });

  it('decelerates slower in the air — keeps more momentum', () => {
    const mc = makeMovementController({ groundDecel: 2600, airDecel: 800 });
    const ground = stepHorizontalMove(mc, { moveX: 0, grounded: true, vx: 200, dt: 1 / 60 });
    const air = stepHorizontalMove(mc, { moveX: 0, grounded: false, vx: 200, dt: 1 / 60 });
    expect(air).toBeGreaterThan(ground); // less speed shed in the air
    expect(air).toBeCloseTo(200 - 800 / 60);
  });

  it('is symmetric for leftward input', () => {
    const mc = makeMovementController({ maxSpeed: 220, groundAccel: 2000 });
    const vx = stepHorizontalMove(mc, { moveX: -1, grounded: true, vx: 0, dt: 1 });
    expect(vx).toBe(-220);
  });

  it('uses acceleration to reverse direction across zero', () => {
    const mc = makeMovementController({ maxSpeed: 220, groundAccel: 2000 });
    // moving right at 100, now holding left: eases toward -220, so vx drops.
    const vx = stepHorizontalMove(mc, { moveX: -1, grounded: true, vx: 100, dt: 1 / 60 });
    expect(vx).toBeLessThan(100);
    expect(vx).toBeCloseTo(100 - 2000 / 60);
  });
});
