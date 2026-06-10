---
name: citadel-browser-screenshots
description: Drive Citadel in a real browser session and capture deterministic screenshots. Use when the task requires visual proof of Citadel behavior, command expansion, suggestion chips, output rendering, or UI regressions in the demo app by running keyboard command flows and saving PNG screenshots.
---

# Citadel Browser Screenshots

Use this skill to produce repeatable screenshots of Citadel interactions without manual clicking.

## Workflow

1. Start the app.

```bash
npm run dev
```

2. Capture a screenshot with scripted keyboard input.

```bash
node skills/citadel-browser-screenshots/scripts/capture_citadel_screenshot.mjs \
  --url http://localhost:5173 \
  --tab "Basic" \
  --keys "u s 1234 Enter" \
  --out test-results/screenshots/citadel-basic-user-show.png \
  --clip-citadel
```

Use `localhost`, not `127.0.0.1` — the Vite dev server binds IPv6 (`::1`)
only, so `127.0.0.1` is refused. Read the actual port from Vite's startup
output; it increments past 5173 when that port is busy.

3. Verify output file exists and report its absolute path.

## Script Behavior

`scripts/capture_citadel_screenshot.mjs`:

- Opens Chromium headlessly with Playwright
- Navigates to the supplied URL
- Optionally clicks a demo tab (`--tab`)
- Opens Citadel (`--open-key`, default `.`)
- Replays key tokens (`--keys`)
- Captures screenshot (`--clip-citadel`, viewport, or `--full-page`)

Use key tokens for deterministic timing:

- `Enter`, `Escape`, `Tab`, `Space`, arrow keys
- `wait:<ms>` pauses between interactions (example: `wait:500`)

Tokens are typed back-to-back with no separator, so commands with multiple
arguments need an explicit `Space` token between argument values:
`"loc s demo.theme Space dark Enter"`.

## Command Sequences

Read `references/citadel_sequences.md` for known-good sequences per demo tab:

- Basic
- Page Control
- Local Full-Stack
- DevOps
- Runtime Config

Load only the sequence(s) needed for the current screenshot task.
