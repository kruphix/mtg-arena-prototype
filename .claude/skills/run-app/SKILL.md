---
name: run-app
description: Launch the Vite dev server for this MTG-style hotseat card game and drive it with headless Chromium (Playwright) to visually verify UI behavior. Use this whenever a change touches src/App.tsx or src/ui/, or when verifying a UI bug fix (e.g. combat/blocker selection, targeting, hand/board rendering).
---

# Running and driving this app

This is a Vite + React app with no backend. "Running" it means starting
the dev server and driving a real headless browser against it — reducer
unit tests (`npm test`) do not exercise `App.tsx` or any component in
`src/ui/`, so a UI bug fix isn't verified until you've clicked through it.

## Dev server

```bash
npm run dev > /tmp/vite-dev.log 2>&1 &
# poll until it responds (Vite prints "ready" fast, but don't sleep blindly)
for i in $(seq 1 30); do curl -sf http://localhost:5173 >/dev/null && break; sleep 1; done
```

Default port is `5173` (see `CLAUDE.md`). Stop it with:

```bash
pkill -f vite
```

Kill any stale instance before relaunching or you'll get `EADDRINUSE` /
a stale second instance on 5174.

## Driving the browser

Playwright (`playwright` devDependency) and its Chromium binary are
already installed in this repo (`npx playwright install chromium` if the
binary ever goes missing after a fresh clone). There's no `chromium-cli`
here, so use the small REPL driver at
`.claude/skills/run-app/scripts/browser-repl.mjs` instead — same idea:
pipe a script to stdin, one command per line.

```bash
cat <<'EOF' | node .claude/skills/run-app/scripts/browser-repl.mjs
nav http://localhost:5173
wait-for text=Main Phase 1
screenshot 01-initial
console --errors
quit
EOF
```

Screenshots are written to `.claude/skills/run-app/screenshots/<name>.png`
(gitignored — treat as scratch, not artifacts to commit). Read the PNG
back with the Read tool to actually look at it — a passing command is
not the same as a correct render.

Commands the REPL understands (Playwright selector syntax — CSS,
`text=...`, `text=Foo >> nth=0` for the Nth match, etc):

- `nav <url>`
- `click <selector>`
- `fill <selector> <text...>`
- `press <key>`
- `wait-for <selector>`
- `screenshot [name]`
- `eval <js expression>` — runs in page context, prints JSON result
- `console [--errors]` — dumps captured console/page errors
- `quit`

## App-specific notes

- Every permanent/card renders as a `<button>` (see `CardView.tsx`); it's
  only clickable (and only gets an `onClick`) when the engine state says
  it should be, so `page.click(...)` on a non-clickable card times out
  rather than silently no-op'ing — that's a useful signal, not a driver bug.
- Two players share one screen (hotseat). The **active player's** hand
  and battlefield render at the bottom, the opponent's at the top — this
  flips each turn, so don't assume "bottom board" means a fixed player.
- Cards with duplicate names (e.g. two `Ashcrag` lands) need
  `text=Ashcrag >> nth=0` / `nth=1` to disambiguate — a bare `text=`
  selector throws a strict-mode violation if it matches more than one.
- To reach combat: play a land, cast/hold creatures across turns (there's
  no haste in this prototype — summoning sickness blocks attacking the
  turn a creature enters), click "Next Phase" until `declareAttackers`,
  click a creature to select it as attacker, click "Declare Attackers",
  click "Next Phase" into `declareBlockers`, click the attacker then the
  blocking creature.

## Example: verifying a bug fix end to end

```bash
cat <<'EOF' | node .claude/skills/run-app/scripts/browser-repl.mjs
nav http://localhost:5173
click text=Ashcrag >> nth=0
click text=Next Phase
screenshot after-land
console --errors
quit
EOF
```

Then `Read` the screenshot file to confirm the board matches what the
code change was supposed to do.
