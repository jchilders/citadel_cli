#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const HELP_TEXT = `
Usage:
  node skills/citadel-browser-screenshots/scripts/capture_citadel_screenshot.mjs --out /tmp/citadel.png [options]

Options:
  --url <url>           App URL (default: http://127.0.0.1:5173)
  --out <path>          Output image path (required)
  --tab <label>         Click demo tab by button label before typing
  --open-key <key>      Key that opens Citadel (default: .)
  --keys "<tokens>"     Space-separated key tokens (example: "u s 1234 Enter")
  --delay-ms <n>        Delay between key tokens (default: 90)
  --after-ms <n>        Delay before screenshot (default: 250)
  --full-page           Capture full page instead of viewport
  --clip-citadel        Capture citadel-element only
  --help                Show this help

Token rules for --keys:
  - Plain token: typed as text (example: 1234)
  - Special keys: Enter Escape Tab ArrowUp ArrowDown ArrowLeft ArrowRight Space Backspace
  - Wait token: wait:500 (milliseconds)
`;

function parseArgs(argv) {
  const options = {
    url: 'http://127.0.0.1:5173',
    out: '',
    tab: '',
    openKey: '.',
    keys: '',
    delayMs: 90,
    afterMs: 250,
    fullPage: false,
    clipCitadel: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      console.log(HELP_TEXT.trim());
      process.exit(0);
    }
    if (arg === '--full-page') {
      options.fullPage = true;
      continue;
    }
    if (arg === '--clip-citadel') {
      options.clipCitadel = true;
      continue;
    }

    const next = argv[i + 1];
    if (next === undefined) {
      throw new Error(`Missing value for ${arg}`);
    }

    if (arg === '--url') {
      options.url = next;
      i += 1;
      continue;
    }
    if (arg === '--out') {
      options.out = next;
      i += 1;
      continue;
    }
    if (arg === '--tab') {
      options.tab = next;
      i += 1;
      continue;
    }
    if (arg === '--open-key') {
      options.openKey = next;
      i += 1;
      continue;
    }
    if (arg === '--keys') {
      options.keys = next;
      i += 1;
      continue;
    }
    if (arg === '--delay-ms') {
      options.delayMs = Number(next);
      i += 1;
      continue;
    }
    if (arg === '--after-ms') {
      options.afterMs = Number(next);
      i += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!options.out) {
    throw new Error('--out is required');
  }

  if (!Number.isFinite(options.delayMs) || options.delayMs < 0) {
    throw new Error('--delay-ms must be a non-negative number');
  }
  if (!Number.isFinite(options.afterMs) || options.afterMs < 0) {
    throw new Error('--after-ms must be a non-negative number');
  }

  return options;
}

const SPECIAL_KEYS = new Set([
  'Enter',
  'Escape',
  'Tab',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Backspace',
  'Delete',
  'Home',
  'End',
  'Space',
]);

async function runKeys(page, keys, delayMs) {
  const tokens = keys.trim() ? keys.trim().split(/\s+/) : [];
  for (const token of tokens) {
    if (token.startsWith('wait:')) {
      const waitMs = Number(token.slice('wait:'.length));
      if (!Number.isFinite(waitMs) || waitMs < 0) {
        throw new Error(`Invalid wait token: ${token}`);
      }
      await page.waitForTimeout(waitMs);
      continue;
    }

    if (SPECIAL_KEYS.has(token)) {
      if (token === 'Space') {
        await page.keyboard.press('Space');
      } else {
        await page.keyboard.press(token);
      }
    } else {
      await page.keyboard.type(token);
    }

    if (delayMs > 0) {
      await page.waitForTimeout(delayMs);
    }
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  await fs.mkdir(path.dirname(options.out), { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  try {
    await page.goto(options.url, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('body');

    if (options.tab) {
      await page.getByRole('button', { name: new RegExp(options.tab, 'i') }).first().click();
      await page.waitForTimeout(120);
    }

    if (options.openKey.toLowerCase() !== 'none') {
      await page.keyboard.press(options.openKey);
      await page.waitForSelector('input[data-testid="citadel-command-input"]', { timeout: 5000 });
      await page.locator('input[data-testid="citadel-command-input"]').first().click();
    }

    await runKeys(page, options.keys, options.delayMs);

    if (options.afterMs > 0) {
      await page.waitForTimeout(options.afterMs);
    }

    if (options.clipCitadel) {
      const citadel = page.locator('citadel-element').first();
      await citadel.waitFor({ state: 'visible' });
      await citadel.screenshot({ path: options.out });
    } else {
      await page.screenshot({ path: options.out, fullPage: options.fullPage });
    }

    console.log(`Saved screenshot: ${options.out}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(`[capture_citadel_screenshot] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
