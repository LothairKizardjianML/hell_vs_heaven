import { describe, it, expect } from 'vitest';
import { World } from '../src/core/world';
import { COMPONENT, makeVelocity, type Velocity } from '../src/core/components';
import {
  PHYSICS_COMPONENT,
  makeGravity,
  makeDrag,
  makeTerminalVelocity,
} from '../src/physics/components';
import { integrateVelocity } from '../src/physics/integrator';

describe('integrateVelocity — Gravity', () => {
  it('adds gravity.y * dt to vel.y when Gravity is present', () => {
    const w = new World();
    const e = w.createEntity();
    w.addComponent(e, COMPONENT.Velocity, makeVelocity(0, 0));
    w.addComponent(e, PHYSICS_COMPONENT.Gravity, makeGravity(1200));
    integrateVelocity(w, 0.5);
    expect(w.getComponent<Velocity>(e, COMPONENT.Velocity)).toEqual({ x: 0, y: 600 });
  });

  it('leaves velocity unchanged when no Gravity component', () => {
    const w = new World();
    const e = w.createEntity();
    w.addComponent(e, COMPONENT.Velocity, makeVelocity(10, 5));
    integrateVelocity(w, 1);
    expect(w.getComponent<Velocity>(e, COMPONENT.Velocity)).toEqual({ x: 10, y: 5 });
  });

  it('does not touch vel.x even when Gravity is present', () => {
    const w = new World();
    const e = w.createEntity();
    w.addComponent(e, COMPONENT.Velocity, makeVelocity(50, 0));
    w.addComponent(e, PHYSICS_COMPONENT.Gravity, makeGravity(1000));
    integrateVelocity(w, 0.1);
    const v = w.getComponent<Velocity>(e, COMPONENT.Velocity)!;
    expect(v.x).toBe(50);
    expect(v.y).toBeCloseTo(100);
  });
});

describe('integrateVelocity — Drag', () => {
  it('multiplies vel.x by (1 - drag.x * dt)', () => {
    const w = new World();
    const e = w.createEntity();
    w.addComponent(e, COMPONENT.Velocity, makeVelocity(100, 50));
    w.addComponent(e, PHYSICS_COMPONENT.Drag, makeDrag(1));
    integrateVelocity(w, 0.1);
    const v = w.getComponent<Velocity>(e, COMPONENT.Velocity)!;
    expect(v.x).toBeCloseTo(90);
    expect(v.y).toBe(50);
  });

  it('drag factor clamps at 0 (no negative-velocity inversion)', () => {
    const w = new World();
    const e = w.createEntity();
    w.addComponent(e, COMPONENT.Velocity, makeVelocity(100, 0));
    w.addComponent(e, PHYSICS_COMPONENT.Drag, makeDrag(10));
    integrateVelocity(w, 1);
    expect(w.getComponent<Velocity>(e, COMPONENT.Velocity)!.x).toBe(0);
  });

  it('drag of zero is a no-op', () => {
    const w = new World();
    const e = w.createEntity();
    w.addComponent(e, COMPONENT.Velocity, makeVelocity(100, 0));
    w.addComponent(e, PHYSICS_COMPONENT.Drag, makeDrag(0));
    integrateVelocity(w, 1);
    expect(w.getComponent<Velocity>(e, COMPONENT.Velocity)!.x).toBe(100);
  });
});

describe('integrateVelocity — TerminalVelocity', () => {
  it('caps positive velocities on both axes', () => {
    const w = new World();
    const e = w.createEntity();
    w.addComponent(e, COMPONENT.Velocity, makeVelocity(500, 2000));
    w.addComponent(e, PHYSICS_COMPONENT.TerminalVelocity, makeTerminalVelocity(300, 1500));
    integrateVelocity(w, 0.01);
    const v = w.getComponent<Velocity>(e, COMPONENT.Velocity)!;
    expect(v.x).toBe(300);
    expect(v.y).toBe(1500);
  });

  it('caps negative velocities on both axes', () => {
    const w = new World();
    const e = w.createEntity();
    w.addComponent(e, COMPONENT.Velocity, makeVelocity(-500, -2000));
    w.addComponent(e, PHYSICS_COMPONENT.TerminalVelocity, makeTerminalVelocity(300, 1500));
    integrateVelocity(w, 0.01);
    const v = w.getComponent<Velocity>(e, COMPONENT.Velocity)!;
    expect(v.x).toBe(-300);
    expect(v.y).toBe(-1500);
  });

  it('leaves under-cap velocities untouched', () => {
    const w = new World();
    const e = w.createEntity();
    w.addComponent(e, COMPONENT.Velocity, makeVelocity(50, -100));
    w.addComponent(e, PHYSICS_COMPONENT.TerminalVelocity, makeTerminalVelocity(300, 1500));
    integrateVelocity(w, 0.01);
    expect(w.getComponent<Velocity>(e, COMPONENT.Velocity)).toEqual({ x: 50, y: -100 });
  });
});

describe('integrateVelocity — composition', () => {
  it('applies gravity then caps by TerminalVelocity in the same step', () => {
    const w = new World();
    const e = w.createEntity();
    w.addComponent(e, COMPONENT.Velocity, makeVelocity(0, 1499));
    w.addComponent(e, PHYSICS_COMPONENT.Gravity, makeGravity(1200));
    w.addComponent(e, PHYSICS_COMPONENT.TerminalVelocity, makeTerminalVelocity(Infinity, 1500));
    integrateVelocity(w, 1);
    const v = w.getComponent<Velocity>(e, COMPONENT.Velocity)!;
    expect(v.y).toBe(1500);
  });

  it('processes multiple entities independently', () => {
    const w = new World();
    const a = w.createEntity();
    const b = w.createEntity();
    w.addComponent(a, COMPONENT.Velocity, makeVelocity(0, 0));
    w.addComponent(a, PHYSICS_COMPONENT.Gravity, makeGravity(100));
    w.addComponent(b, COMPONENT.Velocity, makeVelocity(0, 0));
    w.addComponent(b, PHYSICS_COMPONENT.Gravity, makeGravity(500));
    integrateVelocity(w, 1);
    expect(w.getComponent<Velocity>(a, COMPONENT.Velocity)).toEqual({ x: 0, y: 100 });
    expect(w.getComponent<Velocity>(b, COMPONENT.Velocity)).toEqual({ x: 0, y: 500 });
  });

  it('skips entities without Velocity (no crash on intent-only entity)', () => {
    const w = new World();
    w.createEntity();
    expect(() => integrateVelocity(w, 1)).not.toThrow();
  });
});
