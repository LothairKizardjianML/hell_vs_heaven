// Per-step velocity integrator. Applies optional Gravity, Drag, and
// TerminalVelocity to every entity with a Velocity component. Each force is
// independent — entities only carry the components they need; the others are
// no-ops.
//
// Order: gravity adds, drag scales, terminal velocity clamps. Drag runs after
// gravity so a falling object's vertical speed is governed by gravity + cap,
// not by drag's horizontal-only damping.

import type { World } from '@core/world';
import { COMPONENT, type Velocity } from '@core/components';
import {
  PHYSICS_COMPONENT,
  type Gravity,
  type Drag,
  type TerminalVelocity,
} from './components';

export function integrateVelocity(world: World, dtSec: number): void {
  for (const id of world.query(COMPONENT.Velocity)) {
    const v = world.getComponent<Velocity>(id, COMPONENT.Velocity)!;

    const gravity = world.getComponent<Gravity>(id, PHYSICS_COMPONENT.Gravity);
    if (gravity) {
      v.y += gravity.y * dtSec;
    }

    const drag = world.getComponent<Drag>(id, PHYSICS_COMPONENT.Drag);
    if (drag && drag.x > 0) {
      const factor = Math.max(0, 1 - drag.x * dtSec);
      v.x *= factor;
    }

    const cap = world.getComponent<TerminalVelocity>(id, PHYSICS_COMPONENT.TerminalVelocity);
    if (cap) {
      if (v.x > cap.x) v.x = cap.x;
      else if (v.x < -cap.x) v.x = -cap.x;
      if (v.y > cap.y) v.y = cap.y;
      else if (v.y < -cap.y) v.y = -cap.y;
    }
  }
}
