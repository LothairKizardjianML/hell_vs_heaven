import { describe, it, expect } from 'vitest';
import {
  INTENT,
  makeMoveIntent,
  makeJumpIntent,
  applyInputToIntents,
  type MoveIntent,
  type JumpIntent,
  type InputSnapshot,
} from '../src/input/intents';
import { World, type EntityId } from '../src/core/world';

const EMPTY: InputSnapshot = { left: false, right: false, jump: false };

function setupEntity(): { world: World; entity: EntityId } {
  const world = new World();
  const entity = world.createEntity();
  world.addComponent(entity, INTENT.Move, makeMoveIntent());
  world.addComponent(entity, INTENT.Jump, makeJumpIntent());
  return { world, entity };
}

describe('intent keys', () => {
  it('exposes stable namespaced string keys', () => {
    expect(INTENT.Move).toBe('intent.move');
    expect(INTENT.Jump).toBe('intent.jump');
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
});

describe('applyInputToIntents — MoveIntent', () => {
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
