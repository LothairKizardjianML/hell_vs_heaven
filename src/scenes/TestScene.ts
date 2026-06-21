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
import { Tilemap, TILE, type TileId } from '@physics/tilemap';
import { aabbFromTransformCollider, resolveAabbMove } from '@physics/aabb';
import {
  PHYSICS_COMPONENT,
  makeGravity,
  makeDrag,
  makeTerminalVelocity,
  makeCharacterController,
  makeJumpController,
  type CharacterController,
  type JumpController,
} from '@physics/components';
import { integrateVelocity } from '@physics/integrator';
import { stepJump } from '@physics/jump';

const MOVE_SPEED = 220;
const PLAYER_W = 32;
const PLAYER_H = 48;

const TILE_SIZE = 32;
const STAGE_COLS = 40;
const STAGE_ROWS = 22;

export class TestScene extends Phaser.Scene {
  private world!: World;
  private renderSystem!: RenderSystem;
  private tilemap!: Tilemap;
  private player!: EntityId;
  private bouncer!: EntityId;
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
      .text(640, 24, 'Arrows move · Up to jump (double-jump + coyote) · blue = pass-through · F1 debug', {
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
    integrateVelocity(this.world, dt);
    this.stepPlayerJump();
    this.stepPlayerMovement(dt);
    this.stepBouncer(dt);
    this.renderSystem.sync(this.world);
    this.debug.update();
  }

  private buildStageTilemap(): Tilemap {
    const grid: TileId[][] = [];
    for (let r = 0; r < STAGE_ROWS; r++) {
      grid.push(new Array<TileId>(STAGE_COLS).fill(TILE.Empty));
    }
    for (let c = 0; c < STAGE_COLS; c++) grid[STAGE_ROWS - 1]![c] = TILE.Solid;
    for (let c = 20; c <= 27; c++) grid[14]![c] = TILE.Solid;
    // One-way platform — jump up through it from below, land on it from above.
    for (let c = 8; c <= 15; c++) grid[10]![c] = TILE.OneWayUp;
    return new Tilemap(grid, TILE_SIZE);
  }

  private drawTilemap(): void {
    for (let r = 0; r < this.tilemap.rows; r++) {
      for (let c = 0; c < this.tilemap.cols; c++) {
        const x = c * TILE_SIZE + TILE_SIZE / 2;
        const y = r * TILE_SIZE + TILE_SIZE / 2;
        if (this.tilemap.isSolid(c, r)) {
          this.add
            .rectangle(x, y, TILE_SIZE, TILE_SIZE, 0x555555)
            .setStrokeStyle(1, 0x333333);
        } else if (this.tilemap.isOneWayUp(c, r)) {
          // Just the top edge — visual cue for "passable from below".
          this.add.rectangle(x, r * TILE_SIZE + 3, TILE_SIZE, 6, 0x88aaee);
        }
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
    this.world.addComponent(id, PHYSICS_COMPONENT.Gravity, makeGravity(1200));
    this.world.addComponent(id, PHYSICS_COMPONENT.Drag, makeDrag(8));
    this.world.addComponent(
      id,
      PHYSICS_COMPONENT.TerminalVelocity,
      makeTerminalVelocity(Infinity, 1500),
    );
    this.world.addComponent(
      id,
      PHYSICS_COMPONENT.CharacterController,
      makeCharacterController(),
    );
    this.world.addComponent(id, PHYSICS_COMPONENT.JumpController, makeJumpController());
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

  // Reads the held jump button + last frame's ground contact and applies the
  // jump model to vy. Runs before movement so the launch velocity is resolved
  // this frame; `cc.grounded` is one frame stale, which is exactly what the
  // coyote window wants.
  private stepPlayerJump(): void {
    const vel = this.world.getComponent<Velocity>(this.player, COMPONENT.Velocity)!;
    const jump = this.world.getComponent<JumpIntent>(this.player, INTENT.Jump)!;
    const cc = this.world.getComponent<CharacterController>(
      this.player,
      PHYSICS_COMPONENT.CharacterController,
    )!;
    const jc = this.world.getComponent<JumpController>(
      this.player,
      PHYSICS_COMPONENT.JumpController,
    )!;

    const { vy, jumped } = stepJump(jc, {
      held: jump.pressed,
      grounded: cc.grounded,
      vy: vel.y,
    });
    vel.y = vy;
    if (jumped) eventBus.emit(GameEvents.PlayerJumped, { entityId: this.player });
  }

  private stepPlayerMovement(dt: number): void {
    const transform = this.world.getComponent<Transform>(this.player, COMPONENT.Transform)!;
    const collider = this.world.getComponent<Collider>(this.player, COMPONENT.Collider)!;
    const vel = this.world.getComponent<Velocity>(this.player, COMPONENT.Velocity)!;
    const move = this.world.getComponent<MoveIntent>(this.player, INTENT.Move)!;
    const cc = this.world.getComponent<CharacterController>(
      this.player,
      PHYSICS_COMPONENT.CharacterController,
    )!;

    if (move.x !== 0) vel.x = move.x * MOVE_SPEED;

    const aabb = aabbFromTransformCollider(transform, collider);
    const { resolved, flags } = resolveAabbMove(aabb, vel.x * dt, vel.y * dt, this.tilemap);

    transform.x = resolved.x - collider.offsetX;
    transform.y = resolved.y - collider.offsetY;

    if (flags.bottom || flags.top) vel.y = 0;
    if (flags.left || flags.right) vel.x = 0;
    cc.grounded = flags.bottom;
  }

  private stepBouncer(dt: number): void {
    const t = this.world.getComponent<Transform>(this.bouncer, COMPONENT.Transform)!;
    const v = this.world.getComponent<Velocity>(this.bouncer, COMPONENT.Velocity)!;
    t.x += v.x * dt;
    t.y += v.y * dt;
    if (t.x < 14 || t.x > 1266) v.x = -v.x;
    if (t.y < 14 || t.y > 400) v.y = -v.y;
  }
}
