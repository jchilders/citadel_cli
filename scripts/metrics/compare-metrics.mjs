#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';

const args = process.argv.slice(2);

function getArg(name, fallback) {
  const idx = args.indexOf(name);
  if (idx === -1 || idx === args.length - 1) return fallback;
  return args[idx + 1];
}

function flattenNumbers(obj, prefix = '', out = {}) {
  if (obj === null || obj === undefined) return out;
  if (typeof obj === 'number' && Number.isFinite(obj)) {
    out[prefix] = obj;
    return out;
  }
  if (typeof obj !== 'object') return out;

  for (const [key, value] of Object.entries(obj)) {
    const next = prefix ? `${prefix}.${key}` : key;
    flattenNumbers(value, next, out);
  }
  return out;
}

function fmt(value) {
  if (value === null || value === undefined) return 'n/a';
  if (Math.abs(value) >= 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return value.toFixed(2);
}

async function main() {
  const beforePath = getArg('--before', null);
  const afterPath = getArg('--after', null);
  const outPath = getArg('--out', null);

  if (!beforePath || !afterPath) {
    console.error('Usage: node scripts/metrics/compare-metrics.mjs --before <file.json> --after <file.json> [--out <file.md>]');
    process.exit(1);
  }

  const before = JSON.parse(await readFile(beforePath, 'utf8'));
  const after = JSON.parse(await readFile(afterPath, 'utf8'));
  const beforeNumbers = flattenNumbers(before);
  const afterNumbers = flattenNumbers(after);
  const keys = Object.keys(afterNumbers).filter((key) => Object.hasOwn(beforeNumbers, key)).sort();

  const lines = [];
  lines.push(`Comparing: ${beforePath} -> ${afterPath}`);
  lines.push('');
  lines.push('| Metric | Before | After | Delta | Delta % |');
  lines.push('|---|---:|---:|---:|---:|');

  for (const key of keys) {
    const beforeValue = beforeNumbers[key];
    const afterValue = afterNumbers[key];
    const delta = afterValue - beforeValue;
    const deltaPct = beforeValue === 0 ? null : (delta / beforeValue) * 100;
    const deltaPctText = deltaPct === null ? 'n/a' : `${deltaPct.toFixed(2)}%`;
    lines.push(`| ${key} | ${fmt(beforeValue)} | ${fmt(afterValue)} | ${fmt(delta)} | ${deltaPctText} |`);
  }

  const report = `${lines.join('\n')}\n`;
  console.log(report);
  if (outPath) await writeFile(outPath, report, 'utf8');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
