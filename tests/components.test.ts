import { describe, it, expect } from 'vitest';
import {
  COMPONENT,
  makeTransform,
  makeVelocity,
  makeCollider,
  makeSprite,
} from '../src/core/components';
import { World } from '../src/core/world';
import type { Transform, Velocity } from '../src/core/components';

describe('component keys', () => {
  it('exposes stable namespaced string keys', () => {
    expect(COMPONENT.Transform).toBe('component.transform');
    expect(COMPONENT.Velocity).toBe('component.velocity');
    expect(COMPONENT.Collider).toBe('component.collider');
    expect(COMPONENT.Sprite).toBe('component.sprite');
  });
});

describe('makeTransform', () => {
  it('defaults to origin with zero rotation', () => {
    expect(makeTransform()).toEqual({ x: 0, y: 0, rotation: 0 });
  });

  it('honors overrides', () => {
    expect(makeTransform(10, 20, Math.PI / 2)).toEqual({
      x: 10,
      y: 20,
      rotation: Math.PI / 2,
    });
  });
});

describe('makeVelocity', () => {
  it('defaults to zero', () => {
    expect(makeVelocity()).toEqual({ x: 0, y: 0 });
  });

  it('honors overrides', () => {
    expect(makeVelocity(5, -3)).toEqual({ x: 5, y: -3 });
  });
});

describe('makeCollider', () => {
  it('requires width and height; offset defaults to zero', () => {
    expect(makeCollider(32, 48)).toEqual({
      width: 32,
      height: 48,
      offsetX: 0,
      offsetY: 0,
    });
  });

  it('honors offset overrides', () => {
    expect(makeCollider(16, 16, 4, -2)).toEqual({
      width: 16,
      height: 16,
      offsetX: 4,
      offsetY: -2,
    });
  });
});

describe('makeSprite', () => {
  it('requires a texture key; tint defaults to white, depth to 0', () => {
    expect(makeSprite('player')).toEqual({
      textureKey: 'player',
      tint: 0xffffff,
      depth: 0,
    });
  });

  it('honors tint and depth overrides', () => {
    expect(makeSprite('player', { tint: 0xff0000, depth: 5 })).toEqual({
      textureKey: 'player',
      tint: 0xff0000,
      depth: 5,
    });
  });
});

describe('components integrate with World', () => {
  it('round-trip Transform and Velocity through ECS storage', () => {
    const w = new World();
    const e = w.createEntity();
    w.addComponent(e, COMPONENT.Transform, makeTransform(1, 2));
    w.addComponent(e, COMPONENT.Velocity, makeVelocity(3, 4));

    const t = w.getComponent<Transform>(e, COMPONENT.Transform);
    const v = w.getComponent<Velocity>(e, COMPONENT.Velocity);

    expect(t).toEqual({ x: 1, y: 2, rotation: 0 });
    expect(v).toEqual({ x: 3, y: 4 });
  });
});
