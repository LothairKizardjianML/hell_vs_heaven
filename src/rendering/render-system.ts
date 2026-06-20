// Phaser adapter that mirrors ECS state into the scene. Each Sprite + Transform
// entity becomes a Phaser.GameObjects.Sprite, scaled to the entity's Collider
// (or a 24×24 default) and tinted. The texture key on the Sprite component must
// exist in the scene's texture cache — usually populated by BootScene preloading
// from `src/content/assets.ts`. A missing key is a setup bug; we throw so it
// surfaces immediately instead of silently rendering nothing.

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
  private readonly displays = new Map<EntityId, Phaser.GameObjects.Sprite>();

  constructor(private readonly scene: Phaser.Scene) {}

  sync(world: World): void {
    const renderable = new Set(world.query(COMPONENT.Sprite, COMPONENT.Transform));

    for (const [id, display] of this.displays) {
      if (!renderable.has(id)) {
        display.destroy();
        this.displays.delete(id);
      }
    }

    for (const id of renderable) {
      const transform = world.getComponent<Transform>(id, COMPONENT.Transform)!;
      const sprite = world.getComponent<Sprite>(id, COMPONENT.Sprite)!;
      let display = this.displays.get(id);
      if (!display) {
        const collider = world.getComponent<Collider>(id, COMPONENT.Collider);
        display = this.mount(sprite, transform, collider);
        this.displays.set(id, display);
      }
      display.x = transform.x;
      display.y = transform.y;
      display.rotation = transform.rotation;
      display.setDepth(sprite.depth);
      display.setTint(sprite.tint);
    }
  }

  destroy(): void {
    for (const display of this.displays.values()) display.destroy();
    this.displays.clear();
  }

  private mount(
    sprite: Sprite,
    transform: Transform,
    collider: Collider | undefined,
  ): Phaser.GameObjects.Sprite {
    if (!this.scene.textures.exists(sprite.textureKey)) {
      throw new Error(`RenderSystem: texture '${sprite.textureKey}' is not loaded`);
    }
    const width = collider?.width ?? DEFAULT_SIZE;
    const height = collider?.height ?? DEFAULT_SIZE;
    const s = this.scene.add.sprite(transform.x, transform.y, sprite.textureKey);
    s.setDisplaySize(width, height);
    return s;
  }
}
