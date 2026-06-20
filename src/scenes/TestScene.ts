import Phaser from 'phaser';
import { DebugOverlay } from '@core/debug';
import { eventBus, GameEvents } from '@core/events';

// Placeholder scene that confirms physics + input + event bus wire up.
// Will be replaced by the real platformer controller in Phase 2.
export class TestScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle & {
    body: Phaser.Physics.Arcade.Body;
  };
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private debug!: DebugOverlay;

  constructor() {
    super('TestScene');
  }

  create(): void {
    const ground = this.add.rectangle(640, 700, 1280, 40, 0x444444);
    this.physics.add.existing(ground, true);

    const platform = this.add.rectangle(900, 520, 240, 24, 0x666666);
    this.physics.add.existing(platform, true);

    this.player = this.add.rectangle(200, 200, 32, 48, 0xcc3333) as Phaser.GameObjects.Rectangle & {
      body: Phaser.Physics.Arcade.Body;
    };
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);

    this.physics.add.collider(this.player, ground);
    this.physics.add.collider(this.player, platform);

    this.cursors = this.input.keyboard!.createCursorKeys();

    this.debug = new DebugOverlay(this);

    const hint = this.add
      .text(640, 40, 'Arrow keys to move + jump · F1 debug', {
        font: '16px monospace',
        color: '#aaaaaa',
      })
      .setOrigin(0.5);
    hint.setScrollFactor(0);

    eventBus.emit(GameEvents.SceneReady, { scene: 'TestScene' });
  }

  update(): void {
    const speed = 220;
    if (this.cursors.left?.isDown) {
      this.player.body.setVelocityX(-speed);
    } else if (this.cursors.right?.isDown) {
      this.player.body.setVelocityX(speed);
    } else {
      this.player.body.setVelocityX(0);
    }

    if (
      this.cursors.up &&
      Phaser.Input.Keyboard.JustDown(this.cursors.up) &&
      this.player.body.blocked.down
    ) {
      this.player.body.setVelocityY(-560);
      eventBus.emit(GameEvents.PlayerJumped, { entityId: 0 });
    }

    this.debug.update();
  }
}
