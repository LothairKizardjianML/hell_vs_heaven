import Phaser from 'phaser';

// Toggle with F1. Renderer concern only — no gameplay state should depend on it.
export class DebugOverlay {
  private text: Phaser.GameObjects.Text;
  private enabled = false;

  constructor(private scene: Phaser.Scene) {
    this.text = scene.add
      .text(8, 8, '', { font: '12px monospace', color: '#00ff88' })
      .setScrollFactor(0)
      .setDepth(9999);
    this.text.setVisible(false);

    scene.input.keyboard?.on('keydown-F1', () => this.toggle());
  }

  toggle(): void {
    this.enabled = !this.enabled;
    this.text.setVisible(this.enabled);
  }

  update(): void {
    if (!this.enabled) return;
    const fps = this.scene.game.loop.actualFps.toFixed(1);
    const dpr = window.devicePixelRatio.toFixed(2);
    this.text.setText([`FPS ${fps}`, `DPR ${dpr}`, 'F1: toggle debug']);
  }
}
