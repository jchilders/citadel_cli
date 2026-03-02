import { execSync } from 'node:child_process';

const required = [
  'dist/citadel.css',
  'dist/citadel.es.js',
  'dist/citadel.umd.cjs',
  'dist/index.d.ts'
];

const raw = execSync('npm pack --json --dry-run', {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'inherit']
});

const parsed = JSON.parse(raw);
const first = Array.isArray(parsed) ? parsed[0] : parsed;
const files = (first?.files ?? []).map((entry) => entry.path);

const missing = required.filter((path) => !files.includes(path));

if (missing.length > 0) {
  console.error('[verify-package-artifacts] Missing required files in npm pack --dry-run output:');
  for (const path of missing) {
    console.error(` - ${path}`);
  }
  process.exit(1);
}

console.log('[verify-package-artifacts] All required package files are present.');
