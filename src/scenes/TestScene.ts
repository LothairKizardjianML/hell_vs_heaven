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
  type Collider,
} from '@core/components';
import { RenderSystem } from '@rendering/render-system';
import {
  INTENT,
  makeMoveIntent,
  makeJumpIntent,
  applyInputToIntents,
  type MoveIntent,
  type JumpIntent,
} from '@input/intents';
import { KeyboardInputSource, PLAYER1_KEYBOARD } from '@input/keyboard-input-source';
import { TEXTURE_KEYS } from '@content/assets';
import { Tilemap } from '@physics/tilemap';
import { aabbFromTransformCollider, resolveAabbMove } from '@physics/aabb';

// Tunables for the placeholder demo. Real physics constants live in Phase 2.x.
const GRAVITY = 1200;
const MOVE_SPEED = 220;
const JUMP_VELOCITY = -560;
const PLAYER_W = 32;
const PLAYER_H = 48;

const TILE_SIZE = 32;
const STAGE_COLS = 40;
const STAGE_ROWS = 22;

// Placeholder scene: confirms the input intent → ECS → tilemap collision →
// render bridge works. Inline movement here is temporary; it gets replaced by
// a proper character controller in later Phase 2 subtasks.
export class TestScene extends Phaser.Scene {
  private world!: World;
  private renderSystem!: RenderSystem;
  private tilemap!: Tilemap;
  private player!: EntityId;
  private bouncer!: EntityId;
  private playerGrounded = false;
  private p1Input!: KeyboardInputSource;
  private debug!: DebugOverlay;

  constructor() {
    super('TestScene');
  }

  create(): void {
    this.world = new World();
    this.renderSystem = new RenderSystem(this);
    this.tilemap = this.buildStageTilemap();
    this.drawTilemap();

    this.player = this.spawnPlayer();
    this.bouncer = this.spawnBouncer();

    this.p1Input = new KeyboardInputSource(this, PLAYER1_KEYBOARD);
    this.debug = new DebugOverlay(this);

    this.add
      .text(640, 24, 'Arrows move + jump · Land on the platform · F1 debug', {
        font: '16px monospace',
        color: '#aaaaaa',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    eventBus.emit(GameEvents.SceneReady, { scene: 'TestScene' });
  }

  update(_time: number, deltaMs: number): void {
    const dt = Math.min(deltaMs / 1000, 0.05);
    applyInputToIntents(this.world, this.player, this.p1Input.read());
    this.stepPlayerMovement(dt);
    this.stepBouncer(dt);
    this.renderSystem.sync(this.world);
    this.debug.update();
  }

  private buildStageTilemap(): Tilemap {
    const grid: number[][] = [];
    for (let r = 0; r < STAGE_ROWS; r++) {
      grid.push(new Array(STAGE_COLS).fill(0));
    }
    // Solid floor along the bottom row.
    for (let c = 0; c < STAGE_COLS; c++) grid[STAGE_ROWS - 1]![c] = 1;
    // Mid-air platform — somewhere to jump up onto.
    for (let c = 20; c <= 27; c++) grid[14]![c] = 1;
    return new Tilemap(grid, TILE_SIZE);
  }

  private drawTilemap(): void {
    for (let r = 0; r < this.tilemap.rows; r++) {
      for (let c = 0; c < this.tilemap.cols; c++) {
        if (!this.tilemap.isSolid(c, r)) continue;
        const x = c * TILE_SIZE + TILE_SIZE / 2;
        const y = r * TILE_SIZE + TILE_SIZE / 2;
        this.add
          .rectangle(x, y, TILE_SIZE, TILE_SIZE, 0x555555)
          .setStrokeStyle(1, 0x333333);
      }
    }
  }

  private spawnPlayer(): EntityId {
    const id = this.world.createEntity();
    this.world.addComponent(id, COMPONENT.Transform, makeTransform(200, 100));
    this.world.addComponent(id, COMPONENT.Velocity, makeVelocity());
    this.world.addComponent(id, COMPONENT.Collider, makeCollider(PLAYER_W, PLAYER_H));
    this.world.addComponent(
      id,
      COMPONENT.Sprite,
      makeSprite(TEXTURE_KEYS.Placeholder, { tint: 0xcc3333, depth: 1 }),
    );
    this.world.addComponent(id, INTENT.Move, makeMoveIntent());
    this.world.addComponent(id, INTENT.Jump, makeJumpIntent());
    return id;
  }

  private spawnBouncer(): EntityId {
    const id = this.world.createEntity();
    this.world.addComponent(id, COMPONENT.Transform, makeTransform(900, 200));
    this.world.addComponent(id, COMPONENT.Velocity, makeVelocity(140, -90));
    this.world.addComponent(id, COMPONENT.Collider, makeCollider(28, 28));
    this.world.addComponent(
      id,
      COMPONENT.Sprite,
      makeSprite(TEXTURE_KEYS.Placeholder, { tint: 0x33aaff, depth: 1 }),
    );
    return id;
  }

  private stepPlayerMovement(dt: number): void {
    const transform = this.world.getComponent<Transform>(this.player, COMPONENT.Transform)!;
    const collider = this.world.getComponent<Collider>(this.player, COMPONENT.Collider)!;
    const vel = this.world.getComponent<Velocity>(this.player, COMPONENT.Velocity)!;
    const move = this.world.getComponent<MoveIntent>(this.player, INTENT.Move)!;
    const jump = this.world.getComponent<JumpIntent>(this.player, INTENT.Jump)!;

    vel.x = move.x * MOVE_SPEED;
    if (jump.pressed && this.playerGrounded) {
      vel.y = JUMP_VELOCITY;
      eventBus.emit(GameEvents.PlayerJumped, { entityId: this.player });
      this.playerGrounded = false;
    }
    vel.y += GRAVITY * dt;

    const aabb = aabbFromTransformCollider(transform, collider);
    const { resolved, flags } = resolveAabbMove(aabb, vel.x * dt, vel.y * dt, this.tilemap);

    transform.x = resolved.x - collider.offsetX;
    transform.y = resolved.y - collider.offsetY;

    if (flags.bottom || flags.top) vel.y = 0;
    if (flags.left || flags.right) vel.x = 0;
    this.playerGrounded = flags.bottom;
  }

  // Bouncer remains physics-free — it's a visual sanity check that the
  // RenderSystem still syncs every Sprite+Transform entity, not just the player.
  private stepBouncer(dt: number): void {
    const t = this.world.getComponent<Transform>(this.bouncer, COMPONENT.Transform)!;
    const v = this.world.getComponent<Velocity>(this.bouncer, COMPONENT.Velocity)!;
    t.x += v.x * dt;
    t.y += v.y * dt;
    if (t.x < 14 || t.x > 1266) v.x = -v.x;
    if (t.y < 14 || t.y > 400) v.y = -v.y;
  }
}
