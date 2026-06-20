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

const DEFAULT_SIZE = 24;

export class RenderSystem {
  private readonly displays = new Map<EntityId, Phaser.GameObjects.Rectangle>();

  constructor(private readonly scene: Phaser.Scene) {}

  sync(world: World): void {
    const renderable = new Set(world.query(COMPONENT.Sprite, COMPONENT.Transform));

    for (const [id, rect] of this.displays) {
      if (!renderable.has(id)) {
        rect.destroy();
        this.displays.delete(id);
      }
    }

    for (const id of renderable) {
      const transform = world.getComponent<Transform>(id, COMPONENT.Transform)!;
      const sprite = world.getComponent<Sprite>(id, COMPONENT.Sprite)!;
      let rect = this.displays.get(id);
      if (!rect) {
        const collider = world.getComponent<Collider>(id, COMPONENT.Collider);
        rect = this.scene.add.rectangle(
          transform.x,
          transform.y,
          collider?.width ?? DEFAULT_SIZE,
          collider?.height ?? DEFAULT_SIZE,
          sprite.tint,
        );
        this.displays.set(id, rect);
      }
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
