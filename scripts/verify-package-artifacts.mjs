import { execSync } from 'node:child_process';

const required = [
  'dist/citadel.es.js',
  'dist/citadel.umd.cjs',
  'dist/index.d.ts'
];

// Build/test debris that must never ship to npm
const forbidden = [
  /^dist\/citadel\.umd\.js$/,
  /^dist\/\.vite\//,
  /^dist\/__test-utils__\//,
  /\/__tests__\//,
  /\.test\.d\.ts$/,
  /^dist\/App\.d\.ts$/,
  /^dist\/main\.d\.ts$/,
  /^dist\/examples\//,
  /^dist\/test\//,
  /^dist\/dist\//,
  /\.css$/
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

const debris = files.filter((path) => forbidden.some((pattern) => pattern.test(path)));

if (debris.length > 0) {
  console.error('[verify-package-artifacts] Forbidden build/test debris found in npm pack --dry-run output:');
  for (const path of debris) {
    console.error(` - ${path}`);
  }
  console.error('Run a clean build (npm run build) and check vite.config.ts dts excludes.');
  process.exit(1);
}

console.log(`[verify-package-artifacts] All required package files are present (${files.length} files, no debris).`);
