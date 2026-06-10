#!/usr/bin/env node
// Records a Citadel interaction as video and converts it to an optimized GIF.
// A keystroke HUD is injected into the page so viewers can see which keys are
// pressed — this is what makes prefix expansion legible in the final GIF.
//
// Requires ffmpeg and gifski on PATH.
//
// Usage:
//   node record_citadel_gif.mjs \
//     --url http://localhost:5173 \
//     --tab "Basic" \
//     --keys ". wait:900 u wait:800 s wait:800 1234 wait:500 Enter wait:2400" \
//     --out docs/images/citadel-demo.gif
//
// Key tokens follow the same grammar as capture_citadel_screenshot.mjs:
// single chars and multi-char words are typed (words char-by-char), special
// keys (Enter, Escape, Space, ...) are pressed, wait:<ms> pauses. Unlike the
// screenshot script there is no implicit open-key press — include the opening
// "." in --keys so it appears in the HUD.

import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { chromium } from '@playwright/test';

const SPECIAL_KEYS = new Set([
  'Enter', 'Escape', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'Backspace', 'Delete', 'Home', 'End', 'Space',
]);

const HUD_LABELS = {
  Enter: '⏎',
  Escape: '⎋',
  Backspace: '⌫',
  Space: '␣',
  Tab: '⇥',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
};

function parseArgs(argv) {
  const options = {
    url: 'http://localhost:5173',
    tab: '',
    keys: '',
    out: 'test-results/citadel-demo.gif',
    width: 960,
    fps: 15,
    quality: 90,
    keyDelayMs: 420,
    charDelayMs: 170,
    viewportWidth: 1100,
    viewportHeight: 700,
    crop: 'panel', // 'panel' crops to the Citadel panel; 'viewport' keeps the whole page
    speed: 1,
    rootFontPx: 0, // bump the document root font-size; Citadel's type is rem-based
  };
  for (let i = 0; i < argv.length; i += 2) {
    const [flag, value] = [argv[i], argv[i + 1]];
    if (value === undefined) throw new Error(`Missing value for ${flag}`);
    switch (flag) {
      case '--url': options.url = value; break;
      case '--tab': options.tab = value; break;
      case '--keys': options.keys = value; break;
      case '--out': options.out = value; break;
      case '--width': options.width = Number(value); break;
      case '--fps': options.fps = Number(value); break;
      case '--quality': options.quality = Number(value); break;
      case '--key-delay': options.keyDelayMs = Number(value); break;
      case '--viewport-width': options.viewportWidth = Number(value); break;
      case '--viewport-height': options.viewportHeight = Number(value); break;
      case '--crop': options.crop = value; break;
      case '--speed': options.speed = Number(value); break;
      case '--root-font': options.rootFontPx = Number(value); break;
      default: throw new Error(`Unknown flag: ${flag}`);
    }
  }
  if (!options.keys) throw new Error('--keys is required');
  return options;
}

// KeyCastr-style HUD: one translucent dark pill centered in the capture
// area; keystrokes accumulate into a run and the pill fades after a pause.
async function installHud(page, clip) {
  await page.evaluate(({ x, y, width, height }) => {
    const pill = document.createElement('div');
    pill.id = '__citadel_hud__';
    Object.assign(pill.style, {
      position: 'fixed',
      left: `${x + width / 2}px`,
      top: `${y + height / 2}px`,
      transform: 'translate(-50%, -50%)',
      padding: '10px 22px',
      borderRadius: '14px',
      background: 'rgb(10 10 12 / 0.72)',
      color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
      fontSize: '34px',
      fontWeight: '700',
      letterSpacing: '4px',
      whiteSpace: 'nowrap',
      zIndex: '2147483647',
      pointerEvents: 'none',
      boxShadow: '0 6px 24px rgb(0 0 0 / 0.45)',
      opacity: '0',
      transition: 'opacity 250ms ease',
    });
    document.body.appendChild(pill);

    let run = '';
    let fadeTimer;
    let clearTimer;
    window.__showKey = (label) => {
      clearTimeout(fadeTimer);
      clearTimeout(clearTimer);
      // If the pill already faded out, start a fresh run.
      if (pill.style.opacity === '0') run = '';
      run = (run + label).slice(-14);
      pill.textContent = run;
      pill.style.opacity = '1';
      fadeTimer = setTimeout(() => {
        pill.style.opacity = '0';
        clearTimer = setTimeout(() => { run = ''; pill.textContent = ''; }, 300);
      }, 1000);
    };
  }, clip);
}

async function pressWithHud(page, key, label) {
  await page.evaluate((text) => window.__showKey?.(text), label ?? HUD_LABELS[key] ?? key);
  await page.keyboard.press(key === 'Space' ? 'Space' : key);
}

async function runKeys(page, keys, options, onStep) {
  for (const token of keys.trim().split(/\s+/)) {
    if (token.startsWith('wait:')) {
      await page.waitForTimeout(Number(token.slice(5)));
      await onStep?.();
      continue;
    }
    if (SPECIAL_KEYS.has(token)) {
      await pressWithHud(page, token);
      await page.waitForTimeout(options.keyDelayMs);
      await onStep?.();
      continue;
    }
    for (const char of token) {
      await pressWithHud(page, char, char);
      await page.waitForTimeout(options.charDelayMs);
    }
    await onStep?.();
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  await mkdir(path.dirname(options.out), { recursive: true });
  const workDir = await mkdtemp(path.join(os.tmpdir(), 'citadel-gif-'));

  const viewport = { width: options.viewportWidth, height: options.viewportHeight };
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport,
    // The demo follows prefers-color-scheme; pin dark so renders stay
    // deterministic (Playwright's default is light).
    colorScheme: 'dark',
    recordVideo: { dir: workDir, size: viewport },
  });
  const recordingStart = Date.now();
  const page = await context.newPage();

  let clip;
  let trimSeconds = 0;
  try {
    await page.goto(options.url, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('body');

    const applyRootFont = async () => {
      if (!options.rootFontPx) return;
      await page.evaluate((px) => {
        document.documentElement.style.fontSize = `${px}px`;
      }, options.rootFontPx);
    };

    if (options.tab) {
      await page.getByRole('button', { name: new RegExp(options.tab, 'i') }).first().click();
      await page.waitForTimeout(200);
      // Drop focus from the tab button so the open key reaches the document.
      await page.evaluate(() => document.activeElement?.blur());
    }
    await applyRootFont();

    if (options.crop === 'viewport') {
      // Full-page framing: the whole app stays in frame, so no panel
      // measurement is needed.
      clip = { x: 0, y: 0, width: viewport.width, height: viewport.height };
    } else {
      // The panel grows upward as output accumulates, so a single measurement
      // against the empty panel under-crops. Dry-run the whole sequence first,
      // sampling the panel's bounding box after every step, and crop to the
      // union. Then reload for a clean slate and record for real.
      // The visible panel is a fixed-position element inside the shadow root;
      // the citadel-element host's own box does not track it as it grows.
      const sampleClip = async () => {
        const box = await page.evaluate(() => {
          const shadow = document.querySelector('citadel-element')?.shadowRoot;
          const el = shadow?.querySelector('.panelContainer, .inlineContainer');
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { x: r.x, y: r.y, width: r.width, height: r.height };
        }).catch(() => null);
        if (!box || box.width === 0) return;
        if (!clip) { clip = { ...box }; return; }
        const bottom = Math.max(clip.y + clip.height, box.y + box.height);
        clip.x = Math.min(clip.x, box.x);
        clip.y = Math.min(clip.y, box.y);
        clip.width = Math.max(clip.width, box.width);
        clip.height = bottom - clip.y;
      };
      await runKeys(page, options.keys, options, sampleClip);
      if (!clip) throw new Error('Could not measure citadel-element bounding box');

      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForSelector('body');
      await applyRootFont(); // the reload reset it
      await page.waitForTimeout(600);
    }

    await installHud(page, clip);
    await page.waitForTimeout(400);
    // Everything up to here (navigation, tab click, geometry measurement) is
    // pre-roll; trim it out of the final GIF.
    trimSeconds = (Date.now() - recordingStart) / 1000;
    await runKeys(page, options.keys, options);
  } finally {
    await context.close(); // flushes the video file
    await browser.close();
  }

  const video = execFileSync('ls', [workDir]).toString().trim().split('\n')
    .find((f) => f.endsWith('.webm'));
  if (!video) throw new Error('No video file produced');
  const videoPath = path.join(workDir, video);

  // Crop to the citadel panel (video is 1x even with deviceScaleFactor 2),
  // resample to a steady fps, scale, and emit PNG frames for gifski.
  const cropFilter = `crop=${Math.round(clip.width)}:${Math.round(clip.height)}:${Math.round(clip.x)}:${Math.round(clip.y)}`;
  const speedFilter = options.speed !== 1 ? `setpts=PTS/${options.speed},` : '';
  const framesDir = path.join(workDir, 'frames');
  await mkdir(framesDir);
  execFileSync('ffmpeg', [
    '-ss', trimSeconds.toFixed(2),
    '-i', videoPath,
    '-vf', `${speedFilter}${cropFilter},fps=${options.fps},scale=${options.width}:-1:flags=lanczos`,
    path.join(framesDir, 'frame%04d.png'),
  ], { stdio: 'pipe' });

  execFileSync('gifski', [
    '--fps', String(options.fps),
    '--quality', String(options.quality),
    '-o', options.out,
    ...execFileSync('ls', [framesDir]).toString().trim().split('\n')
      .map((f) => path.join(framesDir, f)),
  ], { stdio: 'pipe' });

  await rm(workDir, { recursive: true, force: true });
  console.log(`Saved GIF: ${options.out}`);
}

main().catch((err) => {
  console.error(`[record_citadel_gif] ${err.message}`);
  process.exit(1);
});
