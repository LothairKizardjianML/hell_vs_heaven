import { describe, it, expect } from 'vitest';
import {
  PHYSICS_COMPONENT,
  makeCharacterController,
} from '../src/physics/components';

describe('CharacterController', () => {
  it('exposes a stable namespaced key', () => {
    expect(PHYSICS_COMPONENT.CharacterController).toBe('physics.character-controller');
  });

  it('factory defaults to grounded: false with no wall contact', () => {
    expect(makeCharacterController()).toEqual({ grounded: false, wallSide: 0 });
  });
});
