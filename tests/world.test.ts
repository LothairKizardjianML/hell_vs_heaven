import { describe, it, expect } from 'vitest';
import { World } from '../src/core/world';

interface Vec2 {
  x: number;
  y: number;
}

describe('World — entities', () => {
  it('creates entities with unique sequential ids starting at 1', () => {
    const w = new World();
    expect(w.createEntity()).toBe(1);
    expect(w.createEntity()).toBe(2);
    expect(w.createEntity()).toBe(3);
  });

  it('hasEntity reflects creation and destruction', () => {
    const w = new World();
    const e = w.createEntity();
    expect(w.hasEntity(e)).toBe(true);
    w.destroyEntity(e);
    expect(w.hasEntity(e)).toBe(false);
  });

  it('destroyEntity on unknown id is a no-op', () => {
    const w = new World();
    expect(() => w.destroyEntity(999)).not.toThrow();
  });
});

describe('World — components', () => {
  it('adds and reads components', () => {
    const w = new World();
    const e = w.createEntity();
    w.addComponent<Vec2>(e, 'transform', { x: 1, y: 2 });
    expect(w.getComponent<Vec2>(e, 'transform')).toEqual({ x: 1, y: 2 });
  });

  it('hasComponent reflects state', () => {
    const w = new World();
    const e = w.createEntity();
    expect(w.hasComponent(e, 'transform')).toBe(false);
    w.addComponent<Vec2>(e, 'transform', { x: 0, y: 0 });
    expect(w.hasComponent(e, 'transform')).toBe(true);
  });

  it('removeComponent clears the component', () => {
    const w = new World();
    const e = w.createEntity();
    w.addComponent<Vec2>(e, 'transform', { x: 0, y: 0 });
    w.removeComponent(e, 'transform');
    expect(w.hasComponent(e, 'transform')).toBe(false);
    expect(w.getComponent(e, 'transform')).toBeUndefined();
  });

  it('addComponent on a non-existent entity throws', () => {
    const w = new World();
    expect(() => w.addComponent<Vec2>(42, 'transform', { x: 0, y: 0 })).toThrow();
  });

  it('destroyEntity removes all its components', () => {
    const w = new World();
    const e = w.createEntity();
    w.addComponent<Vec2>(e, 'transform', { x: 0, y: 0 });
    w.addComponent<Vec2>(e, 'velocity', { x: 1, y: 0 });
    w.destroyEntity(e);
    expect(w.hasComponent(e, 'transform')).toBe(false);
    expect(w.hasComponent(e, 'velocity')).toBe(false);
  });

  it('getComponent on a destroyed entity returns undefined', () => {
    const w = new World();
    const e = w.createEntity();
    w.addComponent<Vec2>(e, 'transform', { x: 1, y: 2 });
    w.destroyEntity(e);
    expect(w.getComponent(e, 'transform')).toBeUndefined();
  });
});

describe('World — query', () => {
  it('returns entities holding all listed components', () => {
    const w = new World();
    const a = w.createEntity();
    const b = w.createEntity();
    const c = w.createEntity();
    w.addComponent<Vec2>(a, 'transform', { x: 0, y: 0 });
    w.addComponent<Vec2>(a, 'velocity', { x: 0, y: 0 });
    w.addComponent<Vec2>(b, 'transform', { x: 0, y: 0 });
    w.addComponent<Vec2>(c, 'velocity', { x: 0, y: 0 });
    expect(w.query('transform', 'velocity').sort()).toEqual([a]);
    expect(w.query('transform').sort()).toEqual([a, b].sort());
    expect(w.query('velocity').sort()).toEqual([a, c].sort());
  });

  it('returns all live entities when called with no keys', () => {
    const w = new World();
    const a = w.createEntity();
    const b = w.createEntity();
    expect(w.query().sort()).toEqual([a, b].sort());
  });

  it('returns empty array when a requested component has no instances', () => {
    const w = new World();
    const e = w.createEntity();
    w.addComponent<Vec2>(e, 'transform', { x: 0, y: 0 });
    expect(w.query('transform', 'nothing-uses-this')).toEqual([]);
  });

  it('excludes entities that have only some of the requested components', () => {
    const w = new World();
    const a = w.createEntity();
    w.addComponent<Vec2>(a, 'transform', { x: 0, y: 0 });
    expect(w.query('transform', 'velocity')).toEqual([]);
  });
});

describe('System (plain function over World)', () => {
  it('iterates query results and mutates components', () => {
    const w = new World();
    const e = w.createEntity();
    w.addComponent<Vec2>(e, 'transform', { x: 0, y: 0 });
    w.addComponent<Vec2>(e, 'velocity', { x: 10, y: -5 });

    const movement = (world: World, dt: number): void => {
      for (const id of world.query('transform', 'velocity')) {
        const t = world.getComponent<Vec2>(id, 'transform')!;
        const v = world.getComponent<Vec2>(id, 'velocity')!;
        t.x += v.x * dt;
        t.y += v.y * dt;
      }
    };

    movement(w, 0.5);
    expect(w.getComponent<Vec2>(e, 'transform')).toEqual({ x: 5, y: -2.5 });
  });
});
