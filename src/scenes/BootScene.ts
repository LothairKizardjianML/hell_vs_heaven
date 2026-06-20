import Phaser from 'phaser';
import { ASSETS } from '@content/assets';
import { preloadAssets } from '@content/asset-loader';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    preloadAssets(this.load, ASSETS);
  }

  create(): void {
    this.scene.start('TestScene');
  }
}
