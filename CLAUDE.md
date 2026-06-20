# hell-vs-heaven

## Project Overview

2D co-op roguelike platformer with a Brawlhalla-style PvP finale.

- **Phase 1 (PvE):** Two players on the same team (Hell *or* Heaven) run through procedurally selected rooms, fight enemies, and assemble a build from roguelike upgrades, weapons, and powers.
- **Phase 2 (PvP):** Hell team vs Heaven team in a platform-fighter arena, carrying the builds they earned in PvE.
- **Target platforms:** web first (itch.io / share link), Steam later via Tauri or Electron wrapper.

See `PLAN.md` for the phased build plan and per-phase subtasks.

## Tech Stack

- **Language:** TypeScript (strict mode)
- **Rendering:** Phaser 3 (WebGL)
- **Physics:** Phaser Arcade Physics + custom character controller (Brawlhalla-style movement)
- **Bundler / dev server:** Vite
- **Testing:** Vitest
- **Lint / format:** ESLint + Prettier
- **Audio (later):** Howler.js
- **Networking (later):** Colyseus or Geckos.io
- **Desktop / Steam (later):** Tauri (preferred) or Electron

## Commands

```bash
npm install          # install deps
npm run dev          # Vite dev server at http://localhost:5173
npm run build        # production build → dist/
npm run preview      # preview the production build
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run lint:fix     # eslint --fix
npm run format       # prettier --write .
npm run test         # vitest run (one-shot)
npm run test:watch   # vitest watch
```

## Architecture

Strict module boundaries. No layer reaches across.

```
src/
  core/          # ECS, event bus, time, math, seeded RNG
  physics/       # collision, character controller, hitboxes — no rendering
  gameplay/      # rules, abilities, damage, status effects — no rendering, no input
  input/         # keyboard, gamepad, remapping — emits intents
  rendering/     # Phaser scenes, sprites, particles, camera — reads state, never writes gameplay
  audio/         # sound triggers driven by events
  content/       # data-driven definitions: characters, weapons, powers, rooms
  net/           # networking adapters (stub locally, real later)
  ui/            # HUD, menus, run summary
  scenes/        # boot, menu, run, arena, results
```

Path aliases mirror the layout: `@core/*`, `@physics/*`, `@gameplay/*`, `@input/*`, `@rendering/*`, `@content/*`, `@scenes/*`.

### Rules

- **Gameplay never imports rendering.** Renderer subscribes to gameplay events (`src/core/events.ts`) and reads ECS components. This keeps headless tests possible.
- **All randomness routes through the seeded `Rng`** in `src/core/rng.ts`. Never call `Math.random()` directly. Runs must be reproducible from a seed.
- **Logic uses a fixed timestep.** Decouple update rate from frame rate (`src/core/loop.ts`). Rendering reads interpolated state.
- **Content is data, not code.** Characters, weapons, powers, upgrades, rooms live in `src/content/` as JSON. Effects are composable modifiers/event hooks, not bespoke classes.
- **State updates are pure functions where practical.** Easier to test, easier to network-roll-back later.

## Conventions

### Keep it simple

- **Smallest thing that works.** Build the minimum code that satisfies the current subtask. No speculative abstractions, no "we might need this later", no half-finished scaffolding for future phases.
- **Three similar lines beat a premature abstraction.** Wait until the third or fourth copy before extracting a helper.
- **Delete code aggressively.** Unused exports, dead branches, "just in case" error handling for impossible states — remove them.
- **No new dependencies without a clear, immediate need.** Phaser + Vite + Vitest already cover most of what we want.
- **Prefer flat over nested.** Long functions are fine if they read top-to-bottom. Avoid manager-of-manager classes.

### Test-Driven Development

- **Red → green → refactor.** Write a failing test, write the minimum code to pass it, then clean up.
- **No new game logic without a test.** Physics math, RNG-driven systems, damage formulas, upgrade modifiers, state machines — all start with a Vitest case. Rendering and Phaser-scene wiring are exempt (verified manually in the browser).
- **Tests live in `tests/`** mirroring `src/` structure. One test file per source file when the file has logic worth testing.
- **Run `npm run test` (or `test:watch`) constantly while coding.** CI runs it on every PR.
- **Headless first.** A new system should be exercisable without booting Phaser. If a test needs Phaser, the design is probably wrong — split the pure logic out.

### Misc

- TypeScript strict mode is non-negotiable. No `any` without a comment explaining why.
- Commit messages: Conventional Commits style (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`).
- Don't commit `dist/` or `node_modules/` (already gitignored).
