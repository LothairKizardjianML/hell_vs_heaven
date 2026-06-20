// Phaser adapter that mirrors ECS state into the scene. For the placeholder art
// phase, every Sprite becomes a tinted rectangle sized from its Collider (or a
// default 24x24 if no Collider). When real textures arrive in Phase 1.5 / Phase
// 10, swap the rectangle for `scene.add.sprite(...)` keyed by `Sprite.textureKey`.

import Phaser from 'phaser';
import type { World, EntityId } from '@core/world';
import {
  COMPONENT,
  type Sprite,
  type Transform,
  type Collider,
} from '@core/components';
import { RenderableTracker } from './renderable-tracker';

const DEFAULT_SIZE = 24;

export class RenderSystem {
  private readonly tracker = new RenderableTracker();
  private readonly displays = new Map<EntityId, Phaser.GameObjects.Rectangle>();

  constructor(private readonly scene: Phaser.Scene) {}

  sync(world: World): void {
    for (const id of this.tracker.pickRemovals(world)) {
      this.displays.get(id)?.destroy();
      this.displays.delete(id);
      this.tracker.markDetached(id);
    }

    for (const id of this.tracker.pickAdditions(world)) {
      const sprite = world.getComponent<Sprite>(id, COMPONENT.Sprite)!;
      const transform = world.getComponent<Transform>(id, COMPONENT.Transform)!;
      const collider = world.getComponent<Collider>(id, COMPONENT.Collider);
      const width = collider?.width ?? DEFAULT_SIZE;
      const height = collider?.height ?? DEFAULT_SIZE;
      const rect = this.scene.add.rectangle(transform.x, transform.y, width, height, sprite.tint);
      rect.setRotation(transform.rotation);
      rect.setDepth(sprite.depth);
      this.displays.set(id, rect);
      this.tracker.markAttached(id);
    }

    for (const id of this.tracker.attachedIds()) {
      const rect = this.displays.get(id);
      if (!rect) continue;
      const transform = world.getComponent<Transform>(id, COMPONENT.Transform)!;
      const sprite = world.getComponent<Sprite>(id, COMPONENT.Sprite)!;
      rect.x = transform.x;
      rect.y = transform.y;
      rect.rotation = transform.rotation;
      rect.fillColor = sprite.tint;
      rect.setDepth(sprite.depth);
    }
  }

  destroy(): void {
    for (const rect of this.displays.values()) rect.destroy();
    this.displays.clear();
  }
}
