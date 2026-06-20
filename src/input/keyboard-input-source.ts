// Phaser-coupled adapter: turns a keyboard binding map into a per-frame
// InputSnapshot. Verified manually in the browser; not unit-tested because the
// snapshot logic is trivial and the Phaser key API is not worth mocking.

import Phaser from 'phaser';
import type { InputSnapshot } from './intents';

export interface KeyboardBindings {
  left: number;
  right: number;
  jump: number;
  attackLight: number;
  attackHeavy: number;
}

// Player 1 — arrow keys for movement/jump, Z/X for attacks.
export const PLAYER1_KEYBOARD: KeyboardBindings = {
  left: Phaser.Input.Keyboard.KeyCodes.LEFT,
  right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
  jump: Phaser.Input.Keyboard.KeyCodes.UP,
  attackLight: Phaser.Input.Keyboard.KeyCodes.Z,
  attackHeavy: Phaser.Input.Keyboard.KeyCodes.X,
};

// Player 2 — WASD for movement/jump, F/G for attacks.
export const PLAYER2_KEYBOARD: KeyboardBindings = {
  left: Phaser.Input.Keyboard.KeyCodes.A,
  right: Phaser.Input.Keyboard.KeyCodes.D,
  jump: Phaser.Input.Keyboard.KeyCodes.W,
  attackLight: Phaser.Input.Keyboard.KeyCodes.F,
  attackHeavy: Phaser.Input.Keyboard.KeyCodes.G,
};

export class KeyboardInputSource {
  private readonly left: Phaser.Input.Keyboard.Key;
  private readonly right: Phaser.Input.Keyboard.Key;
  private readonly jump: Phaser.Input.Keyboard.Key;
  private readonly attackLight: Phaser.Input.Keyboard.Key;
  private readonly attackHeavy: Phaser.Input.Keyboard.Key;

  constructor(scene: Phaser.Scene, bindings: KeyboardBindings) {
    const kb = scene.input.keyboard;
    if (!kb) throw new Error('KeyboardInputSource: scene has no keyboard plugin');
    this.left = kb.addKey(bindings.left);
    this.right = kb.addKey(bindings.right);
    this.jump = kb.addKey(bindings.jump);
    this.attackLight = kb.addKey(bindings.attackLight);
    this.attackHeavy = kb.addKey(bindings.attackHeavy);
  }

  read(): InputSnapshot {
    return {
      left: this.left.isDown,
      right: this.right.isDown,
      jump: this.jump.isDown,
      attackLight: this.attackLight.isDown,
      attackHeavy: this.attackHeavy.isDown,
    };
  }
}
