import { describe, it, expect } from 'vitest';
import {
  INTENT,
  makeMoveIntent,
  makeJumpIntent,
  makeAttackIntent,
  applyInputToIntents,
  type MoveIntent,
  type JumpIntent,
  type AttackIntent,
  type InputSnapshot,
} from '../src/input/intents';
import { World } from '../src/core/world';

const EMPTY: InputSnapshot = {
  left: false,
  right: false,
  jump: false,
  attackLight: false,
  attackHeavy: false,
};

describe('intent keys', () => {
  it('exposes stable string keys', () => {
    expect(INTENT.Move).toBe('intent.move');
    expect(INTENT.Jump).toBe('intent.jump');
    expect(INTENT.Attack).toBe('intent.attack');
  });
});

describe('intent factories', () => {
  it('makeMoveIntent defaults to zero', () => {
    expect(makeMoveIntent()).toEqual({ x: 0 });
  });

  it('makeMoveIntent honors override', () => {
    expect(makeMoveIntent(-1)).toEqual({ x: -1 });
  });

  it('makeJumpIntent defaults to not pressed', () => {
    expect(makeJumpIntent()).toEqual({ pressed: false });
  });

  it('makeAttackIntent defaults to both buttons released', () => {
    expect(makeAttackIntent()).toEqual({ light: false, heavy: false });
  });
});

describe('applyInputToIntents — MoveIntent', () => {
  function setupEntity(): { world: World; entity: number } {
    const world = new World();
    const entity = world.createEntity();
    world.addComponent(entity, INTENT.Move, makeMoveIntent());
    world.addComponent(entity, INTENT.Jump, makeJumpIntent());
    world.addComponent(entity, INTENT.Attack, makeAttackIntent());
    return { world, entity };
  }

  it('neither direction → x = 0', () => {
    const { world, entity } = setupEntity();
    applyInputToIntents(world, entity, EMPTY);
    expect(world.getComponent<MoveIntent>(entity, INTENT.Move)).toEqual({ x: 0 });
  });

  it('right only → x = 1', () => {
    const { world, entity } = setupEntity();
    applyInputToIntents(world, entity, { ...EMPTY, right: true });
    expect(world.getComponent<MoveIntent>(entity, INTENT.Move)).toEqual({ x: 1 });
  });

  it('left only → x = -1', () => {
    const { world, entity } = setupEntity();
    applyInputToIntents(world, entity, { ...EMPTY, left: true });
    expect(world.getComponent<MoveIntent>(entity, INTENT.Move)).toEqual({ x: -1 });
  });

  it('both directions held → x = 0 (cancels out)', () => {
    const { world, entity } = setupEntity();
    applyInputToIntents(world, entity, { ...EMPTY, left: true, right: true });
    expect(world.getComponent<MoveIntent>(entity, INTENT.Move)).toEqual({ x: 0 });
  });

  it('overwrites previous frame value', () => {
    const { world, entity } = setupEntity();
    applyInputToIntents(world, entity, { ...EMPTY, right: true });
    applyInputToIntents(world, entity, EMPTY);
    expect(world.getComponent<MoveIntent>(entity, INTENT.Move)).toEqual({ x: 0 });
  });
});

describe('applyInputToIntents — JumpIntent', () => {
  function setupEntity(): { world: World; entity: number } {
    const world = new World();
    const entity = world.createEntity();
    world.addComponent(entity, INTENT.Move, makeMoveIntent());
    world.addComponent(entity, INTENT.Jump, makeJumpIntent());
    world.addComponent(entity, INTENT.Attack, makeAttackIntent());
    return { world, entity };
  }

  it('jump key down → pressed: true', () => {
    const { world, entity } = setupEntity();
    applyInputToIntents(world, entity, { ...EMPTY, jump: true });
    expect(world.getComponent<JumpIntent>(entity, INTENT.Jump)).toEqual({ pressed: true });
  });

  it('jump key up → pressed: false', () => {
    const { world, entity } = setupEntity();
    applyInputToIntents(world, entity, { ...EMPTY, jump: true });
    applyInputToIntents(world, entity, EMPTY);
    expect(world.getComponent<JumpIntent>(entity, INTENT.Jump)).toEqual({ pressed: false });
  });
});

describe('applyInputToIntents — AttackIntent', () => {
  function setupEntity(): { world: World; entity: number } {
    const world = new World();
    const entity = world.createEntity();
    world.addComponent(entity, INTENT.Move, makeMoveIntent());
    world.addComponent(entity, INTENT.Jump, makeJumpIntent());
    world.addComponent(entity, INTENT.Attack, makeAttackIntent());
    return { world, entity };
  }

  it('light + heavy independently mirror input', () => {
    const { world, entity } = setupEntity();
    applyInputToIntents(world, entity, { ...EMPTY, attackLight: true });
    expect(world.getComponent<AttackIntent>(entity, INTENT.Attack)).toEqual({
      light: true,
      heavy: false,
    });
    applyInputToIntents(world, entity, { ...EMPTY, attackHeavy: true });
    expect(world.getComponent<AttackIntent>(entity, INTENT.Attack)).toEqual({
      light: false,
      heavy: true,
    });
    applyInputToIntents(world, entity, { ...EMPTY, attackLight: true, attackHeavy: true });
    expect(world.getComponent<AttackIntent>(entity, INTENT.Attack)).toEqual({
      light: true,
      heavy: true,
    });
  });
});

describe('applyInputToIntents — missing components', () => {
  it('does not throw when an intent component is absent', () => {
    const world = new World();
    const entity = world.createEntity();
    // Only Move present; Jump and Attack missing.
    world.addComponent(entity, INTENT.Move, makeMoveIntent());
    expect(() =>
      applyInputToIntents(world, entity, { ...EMPTY, right: true, jump: true, attackLight: true }),
    ).not.toThrow();
    expect(world.getComponent<MoveIntent>(entity, INTENT.Move)).toEqual({ x: 1 });
  });
});
