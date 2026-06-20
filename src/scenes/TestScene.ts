import Phaser from 'phaser';
import { DebugOverlay } from '@core/debug';
import { eventBus, GameEvents } from '@core/events';
import { World, type EntityId } from '@core/world';
import {
  COMPONENT,
  makeTransform,
  makeVelocity,
  makeCollider,
  makeSprite,
  type Transform,
  type Velocity,
} from '@core/components';
import { RenderSystem } from '@rendering/render-system';

// Tunables for the placeholder demo. Real physics constants live in Phase 2.
const GRAVITY = 1200;
const MOVE_SPEED = 220;
const JUMP_VELOCITY = -560;
const GROUND_Y = 700;
const GROUND_H = 40;
const PLAYER_W = 32;
const PLAYER_H = 48;

// Placeholder scene: confirms the ECS → RenderSystem → Phaser bridge works.
// Movement logic is inlined here on purpose — it will be replaced by proper
// systems in Phase 1.4 (input intents) and Phase 2 (character controller).
export class TestScene extends Phaser.Scene {
  private world!: World;
  private renderSystem!: RenderSystem;
  private player!: EntityId;
  private bouncer!: EntityId;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private debug!: DebugOverlay;

  constructor() {
    super('TestScene');
  }

  create(): void {
    this.world = new World();
    this.renderSystem = new RenderSystem(this);

    // Static visual ground. Not yet an ECS entity — the platformer collision
    // pass in Phase 2 will turn the level into proper tilemap data.
    this.add.rectangle(640, GROUND_Y, 1280, GROUND_H, 0x444444);

    this.player = this.spawnPlayer();
    this.bouncer = this.spawnBouncer();

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.debug = new DebugOverlay(this);

    this.add
      .text(640, 40, 'ECS-driven render · arrow keys move player · F1 debug', {
        font: '16px monospace',
        color: '#aaaaaa',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    eventBus.emit(GameEvents.SceneReady, { scene: 'TestScene' });
  }

  update(_time: number, deltaMs: number): void {
    const dt = Math.min(deltaMs / 1000, 0.05);
    this.readInputIntoVelocity();
    this.stepMovement(dt);
    this.stepBouncer(dt);
    this.renderSystem.sync(this.world);
    this.debug.update();
  }

  private spawnPlayer(): EntityId {
    const id = this.world.createEntity();
    this.world.addComponent(id, COMPONENT.Transform, makeTransform(200, 200));
    this.world.addComponent(id, COMPONENT.Velocity, makeVelocity());
    this.world.addComponent(id, COMPONENT.Collider, makeCollider(PLAYER_W, PLAYER_H));
    this.world.addComponent(id, COMPONENT.Sprite, makeSprite('rect', { tint: 0xcc3333, depth: 1 }));
    return id;
  }

  private spawnBouncer(): EntityId {
    const id = this.world.createEntity();
    this.world.addComponent(id, COMPONENT.Transform, makeTransform(900, 360));
    this.world.addComponent(id, COMPONENT.Velocity, makeVelocity(140, -90));
    this.world.addComponent(id, COMPONENT.Collider, makeCollider(28, 28));
    this.world.addComponent(id, COMPONENT.Sprite, makeSprite('rect', { tint: 0x33aaff, depth: 1 }));
    return id;
  }

  private readInputIntoVelocity(): void {
    const vel = this.world.getComponent<Velocity>(this.player, COMPONENT.Velocity)!;
    const transform = this.world.getComponent<Transform>(this.player, COMPONENT.Transform)!;
    const groundTop = GROUND_Y - GROUND_H / 2 - PLAYER_H / 2;
    const grounded = transform.y >= groundTop - 0.5;

    if (this.cursors.left?.isDown) vel.x = -MOVE_SPEED;
    else if (this.cursors.right?.isDown) vel.x = MOVE_SPEED;
    else vel.x = 0;

    if (this.cursors.up && Phaser.Input.Keyboard.JustDown(this.cursors.up) && grounded) {
      vel.y = JUMP_VELOCITY;
      eventBus.emit(GameEvents.PlayerJumped, { entityId: this.player });
    }
  }

  private stepMovement(dt: number): void {
    const transform = this.world.getComponent<Transform>(this.player, COMPONENT.Transform)!;
    const vel = this.world.getComponent<Velocity>(this.player, COMPONENT.Velocity)!;

    vel.y += GRAVITY * dt;
    transform.x += vel.x * dt;
    transform.y += vel.y * dt;

    const groundTop = GROUND_Y - GROUND_H / 2 - PLAYER_H / 2;
    if (transform.y > groundTop) {
      transform.y = groundTop;
      vel.y = 0;
    }
    transform.x = Phaser.Math.Clamp(transform.x, PLAYER_W / 2, 1280 - PLAYER_W / 2);
  }

  private stepBouncer(dt: number): void {
    const t = this.world.getComponent<Transform>(this.bouncer, COMPONENT.Transform)!;
    const v = this.world.getComponent<Velocity>(this.bouncer, COMPONENT.Velocity)!;
    t.x += v.x * dt;
    t.y += v.y * dt;
    if (t.x < 14 || t.x > 1266) v.x = -v.x;
    if (t.y < 14 || t.y > 706) v.y = -v.y;
  }
}
