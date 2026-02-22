#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const args = process.argv.slice(2);

function getArg(name, fallback) {
  const idx = args.indexOf(name);
  if (idx === -1 || idx === args.length - 1) return fallback;
  return args[idx + 1];
}

function hasFlag(name) {
  return args.includes(name);
}

function formatTimestampForName(value) {
  return value.replace(/[:.]/g, '-');
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHttp(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // retry
    }
    await sleep(250);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function withDevServer(baseUrl, fn) {
  const parsed = new URL(baseUrl);
  const host = parsed.hostname;
  const port = parsed.port || '4173';
  const child = spawn('npm', ['run', 'dev', '--', '--host', host, '--port', port], {
    stdio: 'inherit',
    env: process.env,
  });

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    child.kill('SIGTERM');
  };

  process.on('exit', close);
  process.on('SIGINT', () => {
    close();
    process.exit(130);
  });

  try {
    await waitForHttp(`${baseUrl}/tests/harness/index.html`, 60_000);
    return await fn();
  } finally {
    close();
  }
}

async function collectPageMetrics(page) {
  await page.goto('/tests/harness/index.html');
  await page.waitForSelector('citadel-element');
  await page.keyboard.press('.');
  await page.getByTestId('citadel-command-input').waitFor();
  await page.getByTestId('citadel-command-input').click();

  const heapUsedBefore = await page.evaluate(() =>
    (performance).memory?.usedJSHeapSize ?? null
  );

  await page.evaluate(() => {
    const state = {
      longTaskDurations: [],
      observer: null,
    };
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            state.longTaskDurations.push(entry.duration);
          }
        });
        observer.observe({ type: 'longtask', buffered: true });
        state.observer = observer;
      } catch {
        // longtask unsupported
      }
    }
    window.__CITADEL_PERF_STATE__ = state;
  });

  const inputLatencyPromise = page.evaluate(() => new Promise((resolve) => {
    const host = document.querySelector('citadel-element');
    const input = host?.shadowRoot?.querySelector('[data-testid="citadel-command-input"]');
    if (!(input instanceof HTMLInputElement)) {
      resolve(null);
      return;
    }

    let keydownAt = 0;
    const onKeydown = (event) => {
      if (event.key === 'x') keydownAt = performance.now();
    };
    const onInput = () => {
      const now = performance.now();
      input.removeEventListener('keydown', onKeydown);
      input.removeEventListener('input', onInput);
      resolve(keydownAt ? now - keydownAt : null);
    };

    input.addEventListener('keydown', onKeydown);
    input.addEventListener('input', onInput);
    input.focus();
  }));

  await page.keyboard.type('x');
  const inputLatencyMs = await inputLatencyPromise;
  await page.keyboard.press('Backspace');

  for (let i = 0; i < 20; i += 1) {
    await page.keyboard.type(` load-${i}-abcdefghijklmnopqrstuvwxyz `, { delay: 0 });
  }

  const fps = await page.evaluate(() => new Promise((resolve) => {
    const durationMs = 2000;
    const start = performance.now();
    let frameCount = 0;
    const tick = () => {
      frameCount += 1;
      const now = performance.now();
      if (now - start >= durationMs) {
        const elapsedSec = (now - start) / 1000;
        resolve(frameCount / elapsedSec);
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }));

  const heapUsedAfter = await page.evaluate(() =>
    (performance).memory?.usedJSHeapSize ?? null
  );

  const longTaskStats = await page.evaluate(() => {
    const state = window.__CITADEL_PERF_STATE__;
    if (!state) return { count: null, totalDurationMs: null, maxDurationMs: null };
    if (state.observer) state.observer.disconnect();

    const durations = Array.isArray(state.longTaskDurations) ? state.longTaskDurations : [];
    if (!durations.length) return { count: 0, totalDurationMs: 0, maxDurationMs: 0 };
    const totalDurationMs = durations.reduce((sum, value) => sum + value, 0);
    const maxDurationMs = Math.max(...durations);
    return { count: durations.length, totalDurationMs, maxDurationMs };
  });

  const domNodeCount = await page.evaluate(() => {
    const host = document.querySelector('citadel-element');
    const shadowCount = host?.shadowRoot?.querySelectorAll('*').length ?? 0;
    return document.querySelectorAll('*').length + shadowCount;
  });

  return {
    inputLatencyMs,
    heapUsedBefore,
    heapUsedAfter,
    heapDelta: (
      typeof heapUsedBefore === 'number' && typeof heapUsedAfter === 'number'
        ? heapUsedAfter - heapUsedBefore
        : null
    ),
    fps,
    longTasks: longTaskStats,
    domNodeCount,
  };
}

async function main() {
  const timestamp = new Date().toISOString();
  const label = getArg('--label', 'snapshot');
  const baseUrl = getArg('--base-url', 'http://127.0.0.1:4173');
  const skipServer = hasFlag('--skip-server');
  const defaultOut = join(
    'test-results',
    'metrics',
    `runtime-${label}-${formatTimestampForName(timestamp)}.json`
  );
  const outPath = getArg('--out', defaultOut);

  const run = async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ baseURL: baseUrl });
    const page = await context.newPage();
    const metrics = await collectPageMetrics(page);
    await browser.close();
    return metrics;
  };

  const metrics = skipServer ? await run() : await withDevServer(baseUrl, run);
  const payload = {
    type: 'runtime-metrics',
    label,
    timestamp,
    baseUrl,
    browser: 'chromium',
    metrics,
  };

  await mkdir(join('test-results', 'metrics'), { recursive: true });
  await writeFile(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(outPath);
  console.log(JSON.stringify(payload, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
