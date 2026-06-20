# Hell vs Heaven — Build Plan

A 2D co-op roguelike platformer (PvE) that transitions into a Brawlhalla-style PvP arena (Hell team vs Heaven team).

---

> **Tech stack, architecture, conventions, and commands live in [CLAUDE.md](CLAUDE.md).** This file is the phased work list only.

---

## Phase 0 — Project Setup

Independent subtasks:

- [ ] **0.1** Init repo: Vite + TS + Phaser 3 template, ESLint, Prettier, Vitest.
- [ ] **0.2** Set up directory skeleton matching architecture above.
- [ ] **0.3** Add event bus (typed, sync) in `core/events.ts`.
- [ ] **0.4** Add seeded RNG (`mulberry32` or `seedrandom`) in `core/rng.ts`. All randomness routes through this.
- [ ] **0.5** Add fixed-timestep game loop wrapper (decouple update rate from render rate).
- [ ] **0.6** Add debug overlay toggle (FPS, entity count, hitbox draw).
- [ ] **0.7** CI: GitHub Actions running typecheck + lint + tests on PR.

---

## Phase 1 — Core Engine

- [ ] **1.1** Minimal ECS: `Entity`, `Component` registry, `System` interface. Keep it tiny — no third-party until we feel pain.
- [ ] **1.2** `Transform`, `Velocity`, `Collider`, `Sprite` components.
- [ ] **1.3** Scene manager that mounts Phaser scenes but treats them as views over ECS state.
- [ ] **1.4** Input intent layer: keyboard/gamepad → `MoveIntent`, `JumpIntent`, `AttackIntent` components. Renderer/physics never read raw input.
- [ ] **1.5** Asset loader pipeline (sprites, atlases, sounds) with manifest in `content/`.

---

## Phase 2 — Platformer Physics (FOCUS)

This phase makes the game *feel good*. Spend time tuning.

- [ ] **2.1** AABB collider + tile collision against a tilemap (Phaser tilemap layer used only as data source).
- [ ] **2.2** Gravity, terminal velocity, horizontal drag.
- [ ] **2.3** Character controller: ground detection, slope handling (optional), one-way platforms.
- [ ] **2.4** Jump model:
  - Variable jump height (release-to-cut)
  - Coyote time (~6 frames after leaving ledge)
  - Jump buffering (~6 frames before landing)
  - Double jump / multi-jump (Brawlhalla has 2 air jumps — make count data-driven)
- [ ] **2.5** Air control: separate accel/decel for grounded vs airborne.
- [ ] **2.6** Wall slide + wall jump.
- [ ] **2.7** Dash / air-dash (cooldown, i-frames optional).
- [ ] **2.8** Knockback model (Brawlhalla style):
  - Damage % accumulates
  - Knockback magnitude = base + scaling * damage%
  - Direction from hitbox angle
  - Hitstun frames proportional to knockback
- [ ] **2.9** Ring-out / death detection (off-stage volume for PvP; pits for PvE).
- [ ] **2.10** Test stage: flat ground + platforms + walls. Both characters playable on one keyboard (P1 WASD, P2 arrows).
- [ ] **2.11** Tune `feel`: tweak constants in a JSON file hot-reloaded in dev. Iterate until movement is satisfying.

**Exit criteria:** two characters can move, jump, dash, attack-knockback each other on a test stage, with PvE pits killing them. No graphics polish needed — placeholder rectangles fine.

---

## Phase 3 — Stage / Level System

- [ ] **3.1** Tilemap format (Tiled `.tmj` JSON) loader.
- [ ] **3.2** Room schema in `content/rooms/`: tilemap ref, spawn points, exits, encounter table.
- [ ] **3.3** Room transitions (door triggers, fade).
- [ ] **3.4** Camera: follow target, deadzone, room-bounded clamp. Split-screen-ready (Phase 6).
- [ ] **3.5** Hand-build 3 PvE test rooms + 1 PvP arena.

---

## Phase 4 — Combat Primitives

- [ ] **4.1** Hitbox / hurtbox components. Active frames driven by data, not code.
- [ ] **4.2** Attack state machine per character: startup → active → recovery.
- [ ] **4.3** Damage events on hitbox/hurtbox overlap. Damage modifier pipeline (resistances, crits).
- [ ] **4.4** Hitstop / screen shake on impact (renderer subscribes to `DamageDealtEvent`).
- [ ] **4.5** Basic melee combo (light/heavy, like Brawlhalla sig moves) — data-driven, two moves per character to start.

---

## Phase 5 — PvE Roguelike Run

- [ ] **5.1** Run state machine: `Lobby → Room → Choice → Room → ... → Boss → Results`.
- [ ] **5.2** Procedural room sequence from seeded RNG (pick from a pool of hand-authored rooms — no full procgen yet).
- [ ] **5.3** Enemy entity: AI driven by behavior tree or state machine. Start with 3 archetypes (chaser, ranger, brute).
- [ ] **5.4** Loot drops on clear: gold/souls currency + one upgrade choice screen.
- [ ] **5.5** Boss room at end of run. One boss per team theme (Hell boss, Heaven boss).
- [ ] **5.6** Run summary screen (kills, damage, time).

---

## Phase 6 — Co-op (Same Team)

- [ ] **6.1** Local 2-player co-op on one machine. Two input devices, two characters in the same scene.
- [ ] **6.2** Shared camera with auto-zoom OR split-screen toggle.
- [ ] **6.3** Revive mechanic (downed state, teammate revives within window).
- [ ] **6.4** Shared run state (both players in the same roguelike run, choices may differ).
- [ ] **6.5** Networked co-op (stub). Define wire protocol; implement against local mock. Real netcode in Phase 11.

---

## Phase 7 — PvP Arena (Hell vs Heaven)

- [ ] **7.1** Match state machine: `LobbyArena → CountIn → Fight → KO → Result`.
- [ ] **7.2** Stock-based win condition (configurable, default 3 lives each).
- [ ] **7.3** Arena selection — start with 2 hand-built stages.
- [ ] **7.4** Carry over the run's build: each player enters the arena with the powers/weapons they assembled in PvE.
- [ ] **7.5** Spectator camera for KO'd players.
- [ ] **7.6** Post-match: winner banner, return to lobby or rematch.

---

## Phase 8 — Powers / Upgrades / Weapons

Data-driven from `content/`. Each item is a JSON entry; effects are composable components.

- [ ] **8.1** Upgrade schema: id, name, rarity, slot, modifiers, on-event hooks.
- [ ] **8.2** Modifier pipeline: damage, speed, jump count, dash count, etc. Apply at run start and on pickup.
- [ ] **8.3** Weapon schema: light/heavy attack data, range, hitbox shape, knockback profile.
- [ ] **8.4** Power system: active abilities with cooldowns, triggered on input.
- [ ] **8.5** Hell-themed starter set: 1 weapon, 3 upgrades, 1 power.
- [ ] **8.6** Heaven-themed starter set: 1 weapon, 3 upgrades, 1 power.
- [ ] **8.7** Choice screen UI between rooms (pick 1 of 3).
- [ ] **8.8** Synergy hooks: events like `on_hit`, `on_kill`, `on_dash` for chained effects (this is what makes roguelikes feel deep — invest here).
- [ ] **8.9** Expand to ~15 upgrades per side once the system works.

---

## Phase 9 — Meta Progression

- [ ] **9.1** Persistent currency (saved to localStorage / Steam Cloud later).
- [ ] **9.2** Unlock pool for starter weapons / powers / characters.
- [ ] **9.3** Account-wide stats.

---

## Phase 10 — Polish

- [ ] **10.1** Art pass: replace placeholders with real sprites + animations.
- [ ] **10.2** VFX: hit sparks, dash trails, death explosions.
- [ ] **10.3** Audio: SFX per action + music per scene.
- [ ] **10.4** Menu / HUD pass.
- [ ] **10.5** Settings: keybinds, volume, screen shake toggle.

---

## Phase 11 — Online Multiplayer

- [ ] **11.1** Decide netcode model: rollback (ideal for PvP) vs lockstep vs client-authoritative.
- [ ] **11.2** Server: Colyseus room per match.
- [ ] **11.3** Matchmaking (basic queue, no skill rating yet).
- [ ] **11.4** Latency masking: input prediction + reconciliation.

---

## Phase 12 — Web Deploy + Steam Packaging

- [ ] **12.1** Production build, deploy to itch.io for early access.
- [ ] **12.2** Wrap with Tauri for desktop.
- [ ] **12.3** Steamworks integration: achievements, cloud saves, leaderboards.
- [ ] **12.4** Steam page, store assets, Early Access launch.

---

## Working Order Summary

1. **Phases 0–2** — engine + physics. Game must *feel* right before anything else.
2. **Phases 3–5** — PvE roguelike loop end-to-end with placeholder art and one weapon.
3. **Phase 6** — co-op locally.
4. **Phase 7** — PvP arena reusing the same characters.
5. **Phase 8** — depth via powers/weapons/upgrades.
6. **Phases 9–10** — meta + polish.
7. **Phases 11–12** — online + ship.

Each subtask is sized to land in a single PR. Phases overlap freely once their prerequisites are met (e.g., 8 can start as soon as 4 lands).
