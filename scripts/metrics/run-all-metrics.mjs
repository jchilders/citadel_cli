#!/usr/bin/env node
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);

function getArg(name, fallback) {
  const idx = args.indexOf(name);
  if (idx === -1 || idx === args.length - 1) return fallback;
  return args[idx + 1];
}

function run(cmd, commandArgs) {
  const result = spawnSync(cmd, commandArgs, { stdio: 'inherit', encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(`Command failed: ${cmd} ${commandArgs.join(' ')}`);
  }
}

async function latestFile(prefix) {
  const dir = join('test-results', 'metrics');
  const files = await readdir(dir);
  const matches = files
    .filter((file) => file.startsWith(prefix) && file.endsWith('.json'))
    .sort();
  if (!matches.length) return null;
  return join(dir, matches[matches.length - 1]);
}

async function main() {
  const label = getArg('--label', 'snapshot');
  const skipBuild = args.includes('--skip-build');
  const skipRuntime = args.includes('--skip-runtime');
  const skipReport = args.includes('--skip-report');

  await mkdir(join('test-results', 'metrics'), { recursive: true });

  if (!skipBuild) {
    run('npm', ['run', 'build']);
    run('npm', ['run', 'metrics:build', '--', '--label', label]);
  }

  if (!skipRuntime) {
    run('npm', ['run', 'metrics:runtime', '--', '--label', label]);
  }

  if (!skipReport) {
    const beforeBuild = getArg('--before-build', null);
    const beforeRuntime = getArg('--before-runtime', null);
    const afterBuild = await latestFile(`build-${label}-`);
    const afterRuntime = await latestFile(`runtime-${label}-`);

    const reportLines = [];
    reportLines.push(`# Metrics Run (${label})`);
    reportLines.push('');
    reportLines.push(`- Build snapshot: ${afterBuild ? basename(afterBuild) : 'n/a'}`);
    reportLines.push(`- Runtime snapshot: ${afterRuntime ? basename(afterRuntime) : 'n/a'}`);
    reportLines.push('');

    const buildReportOut = join('test-results', 'metrics', `compare-build-${label}.md`);
    if (beforeBuild && afterBuild) {
      run('npm', ['run', 'metrics:compare', '--', '--before', beforeBuild, '--after', afterBuild, '--out', buildReportOut]);
      reportLines.push(`- Build comparison: ${basename(buildReportOut)}`);
    } else {
      reportLines.push('- Build comparison: skipped (missing --before-build)');
    }

    const runtimeReportOut = join('test-results', 'metrics', `compare-runtime-${label}.md`);
    if (beforeRuntime && afterRuntime) {
      run('npm', ['run', 'metrics:compare', '--', '--before', beforeRuntime, '--after', afterRuntime, '--out', runtimeReportOut]);
      reportLines.push(`- Runtime comparison: ${basename(runtimeReportOut)}`);
    } else {
      reportLines.push('- Runtime comparison: skipped (missing --before-runtime)');
    }

    const indexPath = join('test-results', 'metrics', `run-${label}.md`);
    await writeFile(indexPath, `${reportLines.join('\n')}\n`, 'utf8');
    console.log(indexPath);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
