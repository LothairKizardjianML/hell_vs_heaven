// Pure logic that decides which ECS entities the renderer should mount, unmount,
// or leave alone. Kept Phaser-free so it can be unit-tested headlessly. The
// Phaser-side RenderSystem drives the actual creation/destruction.

import type { World, EntityId } from '@core/world';
import { COMPONENT } from '@core/components';

export class RenderableTracker {
  private readonly attached = new Set<EntityId>();

  pickAdditions(world: World): EntityId[] {
    const renderable = world.query(COMPONENT.Sprite, COMPONENT.Transform);
    const out: EntityId[] = [];
    for (const id of renderable) {
      if (!this.attached.has(id)) out.push(id);
    }
    return out;
  }

  pickRemovals(world: World): EntityId[] {
    const renderable = new Set(world.query(COMPONENT.Sprite, COMPONENT.Transform));
    const out: EntityId[] = [];
    for (const id of this.attached) {
      if (!renderable.has(id)) out.push(id);
    }
    return out;
  }

  markAttached(id: EntityId): void {
    this.attached.add(id);
  }

  markDetached(id: EntityId): void {
    this.attached.delete(id);
  }

  attachedIds(): EntityId[] {
    return Array.from(this.attached);
  }
}
