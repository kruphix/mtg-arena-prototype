# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A browser-based, local-hotseat card game prototype in the spirit of Magic: The Gathering Arena (two players, same screen, take turns), built with React + Vite + TypeScript. Card names/text are original — mechanics (mana, creatures, combat, spells) are MTG-like but the content is not copied from Wizards of the Coast.

## Commands

- `npm run dev` — start the Vite dev server (default port 5173).
- `npm test` — run the full vitest suite once (`vitest run`).
- `npx vitest run src/engine/combat.test.ts` — run a single test file.
- `npx vitest run -t "trample"` — run tests matching a name pattern.
- `npm run build` — type-check (`tsc -b`) then production build.
- `npm run lint` — run oxlint.

There is no separate typecheck script; `npx tsc -b` (project-references build) is the way to type-check without emitting/bundling.

## Architecture

The code is split into a pure rules **engine** (`src/engine/`, zero React imports) and a **UI** layer (`src/ui/` + `src/App.tsx`) that only dispatches actions into the engine and renders the resulting state. This separation is deliberate: combat/mana/effect logic is unit-tested in isolation from rendering, and the UI stays "dumb" (no game rules live in components).

### Engine (`src/engine/`)

- `types.ts` — all core types: `Card`/`CardDefinition`, `Permanent` (a card instance on the battlefield with runtime state — tapped, summoning sickness, damage, temp buffs), `PlayerState`, `GameState`, `Phase`, `GameAction`.
- `cards.ts` — static definitions for every card (the `CARDS` registry, looked up via `getCard(defId)`). Two mana colors: `flame` and `tide`, plus colorless. Adding a card means adding an entry here (and a matching entry in `effects.ts` if it does anything beyond vanilla stats).
- `deck.ts` — the fixed 40-card decklist (17 lands + 23 unique nonland cards, singleton) and a `shuffle()` helper that takes an injectable RNG for deterministic tests.
- `gameState.ts` — `createInitialGameState()` builds both players, shuffles, and draws opening hands (player going first starts at `main1`, skipping their first untap/draw — see below). Also has `getPlayer`/`getOpponent`/`drawCard` helpers reused throughout the engine.
- `actions.ts` — the reducer: `gameReducer(state, action)`. `structuredClone`s state, then mutates the clone via helper functions. This is the one place that knows about mana payment (`selectLandsForCost`/`payManaCost`/`canAffordCost`), land-per-turn limits, and phase advancement.
- `combat.ts` — attacker/blocker damage resolution, Flying (can only be blocked by Flying) and Trample (excess damage past blocker's toughness hits the player) rules, lethal-damage/death checks.
- `effects.ts` — a lookup table (`EFFECTS`, keyed by `effectKey` on a card definition) implementing each card's unique behavior (burn, draw, bounce, lifegain, pump, freeze, etc.), invoked by the reducer on cast/ETB.
- `testUtils.ts` — fixture builders (`makeState`, `makePlayer`, `makePermanent`, `handCard`) used across the `*.test.ts` files to construct minimal `GameState`s without relying on random shuffling.

### Phase machine (the trickiest part of `actions.ts`)

`PHASE_ORDER` is the full MTG-style turn structure (`untap, draw, main1, beginCombat, declareAttackers, declareBlockers, combatDamage, main2, end, cleanup`), but `untap`, `draw`, `cleanup`, and `combatDamage` are in an `AUTO_PHASES` set: `advancePhase()` loops through `stepOnce()` and keeps going while the new phase is auto, so a single `ADVANCE_PHASE` action can cascade through several steps (e.g. from `declareBlockers` straight through `combatDamage` resolution into `main2`, or from `end` through `cleanup`/`untap`/`draw` into the next player's `main1`). When editing phase logic, remember this collapsing behavior is intentional (mirrors Arena's auto-pass over empty steps) — don't assume one dispatched action advances exactly one visible phase.

Turn 1 is a special case: `createInitialGameState()` starts the state directly at `main1` (not `untap`) for player 1, since the first player skips untap (nothing to untap) and their first draw step, per Magic rules.

Sorcery-speed only: all spells resolve immediately when cast during `main1`/`main2`. There is no stack, no instants, no priority passing.

Mana payment is automatic: casting a card auto-taps whatever untapped lands are needed to cover the cost (colored requirements first, then generic from whatever's left) rather than requiring a separate "tap for mana" step — see `selectLandsForCost` in `actions.ts`.

### UI (`src/App.tsx` + `src/ui/components/`)

`App.tsx` owns the reducer (`useReducer(gameReducer, ...)`) plus local-only UI state for in-progress selections (a card awaiting a target, attackers being multi-selected, block assignments being built up) — none of this selection state is authoritative; it's discarded on dispatch or on phase change (see the `useEffect` keyed on `state.phase`/`state.turn`). Components (`Board`, `Hand`, `CardView`, `PlayerPanel`, `PhaseBar`, `CombatOverlay`) are presentational; they receive state/callbacks as props and contain no game rules.

The active player's hand is always rendered at the bottom (face up); the opponent's hand is rendered face-down at the top — this flips each turn since it's hotseat play on one screen, not tied to `players[0]`/`players[1]`.
