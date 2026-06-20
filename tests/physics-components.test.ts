import { describe, it, expect } from 'vitest';
import {
  PHYSICS_COMPONENT,
  makeGravity,
  makeDrag,
  makeTerminalVelocity,
} from '../src/physics/components';

describe('PHYSICS_COMPONENT keys', () => {
  it('exposes string keys under the physics. module prefix', () => {
    expect(PHYSICS_COMPONENT.Gravity).toBe('physics.gravity');
    expect(PHYSICS_COMPONENT.Drag).toBe('physics.drag');
    expect(PHYSICS_COMPONENT.TerminalVelocity).toBe('physics.terminal-velocity');
  });
});

describe('makeGravity', () => {
  it('defaults to 1200 px/s² downward', () => {
    expect(makeGravity()).toEqual({ y: 1200 });
  });
  it('honors override', () => {
    expect(makeGravity(500)).toEqual({ y: 500 });
  });
});

describe('makeDrag', () => {
  it('defaults to zero', () => {
    expect(makeDrag()).toEqual({ x: 0 });
  });
  it('honors override', () => {
    expect(makeDrag(8)).toEqual({ x: 8 });
  });
});

describe('makeTerminalVelocity', () => {
  it('defaults to infinite horizontal cap, 1500 vertical cap', () => {
    expect(makeTerminalVelocity()).toEqual({ x: Infinity, y: 1500 });
  });
  it('honors overrides', () => {
    expect(makeTerminalVelocity(300, 800)).toEqual({ x: 300, y: 800 });
  });
});
