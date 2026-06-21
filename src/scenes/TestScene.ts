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
  makeTerminalVelocity,
  makeCharacterController,
  makeJumpController,
  makeMovementController,
  makeWallController,
  type CharacterController,
  type JumpController,
  type MovementController,
  type WallController,
} from '@physics/components';
import { integrateVelocity } from '@physics/integrator';
import { stepJump } from '@physics/jump';
import { stepHorizontalMove } from '@physics/movement';
import { stepWall } from '@physics/wall';

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
      .text(640, 24, 'Arrows move · Up to jump (double-jump + coyote) · hug a wall to slide, Up to wall-jump · F1 debug', {
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
    // Wall jump owns the press when on a wall; only fall through to the normal
    // jump model if it did not fire.
    if (!this.stepPlayerWall()) this.stepPlayerJump();
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
    // Tall pillar — slide down its faces and wall-jump between them.
    for (let r = 6; r < STAGE_ROWS - 1; r++) grid[r]![30] = TILE.Solid;
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
    this.world.addComponent(id, PHYSICS_COMPONENT.MovementController, makeMovementController());
    this.world.addComponent(id, PHYSICS_COMPONENT.WallController, makeWallController());
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

  // Wall slide + wall jump. Reads last frame's wall contact (one frame stale,
  // like grounded) and the held jump button. On a wall jump it sets vx/vy away
  // from the wall and swallows the press so the jump model below can't also
  // fire it; returns whether the wall jump fired.
  private stepPlayerWall(): boolean {
    const vel = this.world.getComponent<Velocity>(this.player, COMPONENT.Velocity)!;
    const move = this.world.getComponent<MoveIntent>(this.player, INTENT.Move)!;
    const jump = this.world.getComponent<JumpIntent>(this.player, INTENT.Jump)!;
    const cc = this.world.getComponent<CharacterController>(
      this.player,
      PHYSICS_COMPONENT.CharacterController,
    )!;
    const wc = this.world.getComponent<WallController>(
      this.player,
      PHYSICS_COMPONENT.WallController,
    )!;

    const res = stepWall(wc, {
      wallSide: cc.wallSide,
      moveX: move.x,
      grounded: cc.grounded,
      jumpHeld: jump.pressed,
      vx: vel.x,
      vy: vel.y,
    });
    vel.x = res.vx;
    vel.y = res.vy;

    if (res.jumped) {
      // Keep the jump model from re-firing the same press as an air jump.
      const jc = this.world.getComponent<JumpController>(
        this.player,
        PHYSICS_COMPONENT.JumpController,
      )!;
      jc.prevHeld = jump.pressed;
      jc.bufferTimer = 0;
      eventBus.emit(GameEvents.PlayerJumped, { entityId: this.player });
    }
    return res.jumped;
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
    const mc = this.world.getComponent<MovementController>(
      this.player,
      PHYSICS_COMPONENT.MovementController,
    )!;

    vel.x = stepHorizontalMove(mc, {
      moveX: move.x,
      grounded: cc.grounded,
      vx: vel.x,
      dt,
    });

    const aabb = aabbFromTransformCollider(transform, collider);
    const { resolved, flags } = resolveAabbMove(aabb, vel.x * dt, vel.y * dt, this.tilemap);

    transform.x = resolved.x - collider.offsetX;
    transform.y = resolved.y - collider.offsetY;

    if (flags.bottom || flags.top) vel.y = 0;
    if (flags.left || flags.right) vel.x = 0;
    cc.grounded = flags.bottom;
    cc.wallSide = flags.right ? 1 : flags.left ? -1 : 0;
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
