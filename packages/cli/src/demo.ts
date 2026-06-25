import { runCli } from './run';
import { demoRegistry } from './demo-registry';

// The default demo (a small coffee bar). For a richer, documented example see
// examples/dungeon-console.ts. Run: `npm run coffee-bar`.
runCli(demoRegistry(), {
  welcome: '☕ Welcome to Barstucks Coffee Bar — what can we brew for you?',
});
