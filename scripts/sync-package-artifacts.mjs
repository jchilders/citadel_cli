import { existsSync, renameSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const distDir = resolve(root, 'dist');

const umdSource = resolve(distDir, 'citadel.umd.js');
const umdTarget = resolve(distDir, 'citadel.umd.cjs');

if (!existsSync(umdSource)) {
  throw new Error(`Missing UMD build output at ${umdSource}. Run vite build first.`);
}

// Rename (not copy) so the duplicate citadel.umd.js doesn't ship in the tarball
renameSync(umdSource, umdTarget);

console.log(`[sync-package-artifacts] wrote ${umdTarget}`);
