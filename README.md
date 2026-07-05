# MTG Arena-style Hotseat Prototype

A browser-based, local-hotseat card game prototype in the spirit of Magic: The Gathering Arena — two players, same screen, take turns. Built with React + Vite + TypeScript. Card names/text are original; mechanics (mana, creatures, combat, spells) are MTG-like but the content is not copied from Wizards of the Coast.

## Running it

```bash
npm install
npm run dev
```

Then open the printed local URL (default `http://localhost:5173`).

## Other commands

- `npm test` — run the engine test suite (`vitest run`).
- `npm run build` — type-check (`tsc -b`) then production build.
- `npm run lint` — run oxlint.

See `CLAUDE.md` for architecture notes (engine vs. UI split, phase machine, etc.).
