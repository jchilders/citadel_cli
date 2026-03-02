import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const distDir = resolve(root, 'dist');

const cssSource = resolve(root, 'src/styles/citadel.css');
const cssTarget = resolve(distDir, 'citadel.css');
const umdSource = resolve(distDir, 'citadel.umd.js');
const umdTarget = resolve(distDir, 'citadel.umd.cjs');

if (!existsSync(cssSource)) {
  throw new Error(`Missing source css at ${cssSource}`);
}

if (!existsSync(umdSource)) {
  throw new Error(`Missing UMD build output at ${umdSource}. Run vite build first.`);
}

copyFileSync(cssSource, cssTarget);
copyFileSync(umdSource, umdTarget);

console.log(`[sync-package-artifacts] wrote ${cssTarget}`);
console.log(`[sync-package-artifacts] wrote ${umdTarget}`);
