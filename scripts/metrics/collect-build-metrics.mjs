#!/usr/bin/env node
import { gzipSync } from 'node:zlib';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);

function getArg(name, fallback) {
  const idx = args.indexOf(name);
  if (idx === -1 || idx === args.length - 1) return fallback;
  return args[idx + 1];
}

function formatTimestampForName(value) {
  return value.replace(/[:.]/g, '-');
}

function runCommand(cmd, commandArgs) {
  const result = spawnSync(cmd, commandArgs, { encoding: 'utf8' });
  if (result.error || result.status !== 0) return null;
  return result.stdout.trim();
}

function countLines(content) {
  if (!content) return 0;
  return content.split(/\r?\n/).length;
}

function getTrackedFiles() {
  const output = runCommand('git', ['ls-files']);
  if (!output) return [];
  return output.split('\n').filter(Boolean);
}

async function collectLoc(files) {
  let totalLines = 0;
  let totalFiles = 0;
  const extBreakdown = {};
  const includeRegex = /\.(ts|tsx|js|jsx|css|html|json|md)$/;

  for (const file of files) {
    if (!includeRegex.test(file)) continue;
    if (
      file.startsWith('dist/') ||
      file.startsWith('node_modules/') ||
      file.startsWith('coverage/') ||
      file.startsWith('playwright-report/') ||
      file.startsWith('test-results/')
    ) {
      continue;
    }

    try {
      const content = await readFile(file, 'utf8');
      const lines = countLines(content);
      const ext = file.split('.').pop() ?? 'unknown';
      totalLines += lines;
      totalFiles += 1;
      extBreakdown[ext] = (extBreakdown[ext] ?? 0) + lines;
    } catch {
      // Ignore files that disappear mid-run.
    }
  }

  return { totalFiles, totalLines, extBreakdown };
}

async function readArtifact(path) {
  if (!existsSync(path)) return null;
  const content = await readFile(path);
  const rawBytes = content.byteLength;
  const gzipBytes = gzipSync(content).byteLength;
  return { rawBytes, gzipBytes };
}

function getDependencyPresence() {
  const output = runCommand('npm', ['ls', 'tailwindcss', 'postcss', 'autoprefixer', '--depth=0', '--json']);
  if (!output) return { tailwindcss: false, postcss: false, autoprefixer: false };

  try {
    const parsed = JSON.parse(output);
    const deps = parsed.dependencies ?? {};
    return {
      tailwindcss: Boolean(deps.tailwindcss),
      postcss: Boolean(deps.postcss),
      autoprefixer: Boolean(deps.autoprefixer),
    };
  } catch {
    return { tailwindcss: false, postcss: false, autoprefixer: false };
  }
}

function getNodeModulesKb() {
  const output = runCommand('du', ['-sk', 'node_modules']);
  if (!output) return null;
  const [value] = output.split(/\s+/);
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function main() {
  const timestamp = new Date().toISOString();
  const label = getArg('--label', 'snapshot');
  const defaultOut = join(
    'test-results',
    'metrics',
    `build-${label}-${formatTimestampForName(timestamp)}.json`
  );
  const outPath = getArg('--out', defaultOut);

  const commit = runCommand('git', ['rev-parse', '--short', 'HEAD']) ?? 'unknown';
  const files = getTrackedFiles();
  const loc = await collectLoc(files);
  const dependencyPresence = getDependencyPresence();
  const nodeModulesKb = getNodeModulesKb();

  const artifacts = {
    citadelEs: await readArtifact('dist/citadel.es.js'),
    citadelUmd: await readArtifact('dist/citadel.umd.cjs'),
    citadelCss: await readArtifact('dist/citadel.css'),
  };

  const payload = {
    type: 'build-metrics',
    label,
    timestamp,
    commit,
    loc,
    dependencyPresence,
    nodeModulesKb,
    artifacts,
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
