import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    // Global asset preloads land here as content arrives.
  }

  create(): void {
    this.scene.start('TestScene');
  }
}
