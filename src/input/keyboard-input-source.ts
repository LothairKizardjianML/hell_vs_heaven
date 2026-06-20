// Phaser-coupled adapter: turns a keyboard binding map into a per-frame
// InputSnapshot. Verified manually in the browser; not unit-tested because the
// snapshot logic is trivial and the Phaser key API is not worth mocking.

import Phaser from 'phaser';
import type { InputSnapshot } from './intents';

export interface KeyboardBindings {
  left: number;
  right: number;
  jump: number;
}

export const PLAYER1_KEYBOARD: KeyboardBindings = {
  left: Phaser.Input.Keyboard.KeyCodes.LEFT,
  right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
  jump: Phaser.Input.Keyboard.KeyCodes.UP,
};

export class KeyboardInputSource {
  private readonly left: Phaser.Input.Keyboard.Key;
  private readonly right: Phaser.Input.Keyboard.Key;
  private readonly jump: Phaser.Input.Keyboard.Key;

  constructor(scene: Phaser.Scene, bindings: KeyboardBindings) {
    const kb = scene.input.keyboard;
    if (!kb) throw new Error('KeyboardInputSource: scene has no keyboard plugin');
    this.left = kb.addKey(bindings.left);
    this.right = kb.addKey(bindings.right);
    this.jump = kb.addKey(bindings.jump);
  }

  read(): InputSnapshot {
    return {
      left: this.left.isDown,
      right: this.right.isDown,
      jump: this.jump.isDown,
    };
  }
}
