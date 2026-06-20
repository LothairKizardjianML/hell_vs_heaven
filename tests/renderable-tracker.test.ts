import { describe, it, expect } from 'vitest';
import { RenderableTracker } from '../src/rendering/renderable-tracker';
import { World } from '../src/core/world';
import {
  COMPONENT,
  makeTransform,
  makeSprite,
} from '../src/core/components';

describe('RenderableTracker', () => {
  it('reports new Sprite+Transform entities as additions', () => {
    const w = new World();
    const e = w.createEntity();
    w.addComponent(e, COMPONENT.Transform, makeTransform());
    w.addComponent(e, COMPONENT.Sprite, makeSprite('rect'));

    const tracker = new RenderableTracker();
    expect(tracker.pickAdditions(w)).toEqual([e]);
  });

  it('does not report already-attached entities as additions', () => {
    const w = new World();
    const e = w.createEntity();
    w.addComponent(e, COMPONENT.Transform, makeTransform());
    w.addComponent(e, COMPONENT.Sprite, makeSprite('rect'));

    const tracker = new RenderableTracker();
    tracker.markAttached(e);
    expect(tracker.pickAdditions(w)).toEqual([]);
  });

  it('skips entities missing Sprite or Transform', () => {
    const w = new World();
    const a = w.createEntity();
    w.addComponent(a, COMPONENT.Transform, makeTransform());

    const b = w.createEntity();
    w.addComponent(b, COMPONENT.Sprite, makeSprite('rect'));

    const tracker = new RenderableTracker();
    expect(tracker.pickAdditions(w)).toEqual([]);
  });

  it('reports removals when an attached entity loses Sprite', () => {
    const w = new World();
    const e = w.createEntity();
    w.addComponent(e, COMPONENT.Transform, makeTransform());
    w.addComponent(e, COMPONENT.Sprite, makeSprite('rect'));

    const tracker = new RenderableTracker();
    tracker.markAttached(e);
    w.removeComponent(e, COMPONENT.Sprite);
    expect(tracker.pickRemovals(w)).toEqual([e]);
  });

  it('reports removals when an attached entity is destroyed', () => {
    const w = new World();
    const e = w.createEntity();
    w.addComponent(e, COMPONENT.Transform, makeTransform());
    w.addComponent(e, COMPONENT.Sprite, makeSprite('rect'));

    const tracker = new RenderableTracker();
    tracker.markAttached(e);
    w.destroyEntity(e);
    expect(tracker.pickRemovals(w)).toEqual([e]);
  });

  it('does not report removals for entities still renderable', () => {
    const w = new World();
    const e = w.createEntity();
    w.addComponent(e, COMPONENT.Transform, makeTransform());
    w.addComponent(e, COMPONENT.Sprite, makeSprite('rect'));

    const tracker = new RenderableTracker();
    tracker.markAttached(e);
    expect(tracker.pickRemovals(w)).toEqual([]);
  });

  it('markDetached drops the entity from attached set', () => {
    const tracker = new RenderableTracker();
    tracker.markAttached(7);
    expect(tracker.attachedIds()).toEqual([7]);
    tracker.markDetached(7);
    expect(tracker.attachedIds()).toEqual([]);
  });

  it('handles a full lifecycle: add → attach → detach → re-add', () => {
    const w = new World();
    const e = w.createEntity();
    w.addComponent(e, COMPONENT.Transform, makeTransform());
    w.addComponent(e, COMPONENT.Sprite, makeSprite('rect'));

    const tracker = new RenderableTracker();
    expect(tracker.pickAdditions(w)).toEqual([e]);
    tracker.markAttached(e);
    expect(tracker.pickAdditions(w)).toEqual([]);

    w.removeComponent(e, COMPONENT.Sprite);
    expect(tracker.pickRemovals(w)).toEqual([e]);
    tracker.markDetached(e);

    w.addComponent(e, COMPONENT.Sprite, makeSprite('rect'));
    expect(tracker.pickAdditions(w)).toEqual([e]);
  });
});
