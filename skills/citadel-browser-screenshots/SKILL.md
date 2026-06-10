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

## Recording GIFs

`scripts/record_citadel_gif.mjs` records a key sequence as an animated GIF
with an on-screen KeyCastr-style keystroke HUD (requires `ffmpeg` and `gifski`
on PATH). With the default `--crop panel` it dry-runs the sequence once to
measure the panel's maximum extent (the panel grows upward as output
accumulates), reloads, then records; `--crop viewport` keeps the whole page.
`--speed` time-compresses at encode time, and `--root-font` bumps the document
root font-size (Citadel's type is rem-based, so text scales crisply). Unlike
the screenshot script there is no implicit open-key press — include the
opening `.` in `--keys`. This is what generates the README demo GIF:

```bash
node skills/citadel-browser-screenshots/scripts/record_citadel_gif.mjs \
  --url http://localhost:5173 \
  --tab "Basic" \
  --keys ". wait:1100 c wait:1300 Hello! wait:500 Enter wait:2600 u wait:800 s wait:800 1234 wait:600 Enter wait:3000" \
  --viewport-height 1120 \
  --root-font 19 \
  --speed 1.25 \
  --quality 95 \
  --out docs/images/citadel-demo.gif
```

Mind the HUD fade timing when sequencing: keystroke runs merge into one pill
unless separated by a pause longer than ~1.3s (e.g. the `wait:1300` between
the `c` expansion and its argument above). If output scroll-clips at the end,
increase `--viewport-height` — the panel is 50vh, so taller viewport = taller
pane.

## Command Sequences

Read `references/citadel_sequences.md` for known-good sequences per demo tab:

- Basic
- Page Control
- Local Full-Stack
- DevOps
- Runtime Config

Load only the sequence(s) needed for the current screenshot task.
