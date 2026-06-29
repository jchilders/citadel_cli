export { Citadel } from './components/Citadel/Citadel';
export type { CitadelConfig } from './components/Citadel/config/types';
// Re-export the engine directly (one hop from the entry). NodeNext/Node16 does
// not transitively surface a star re-export through an intermediate module's own
// star re-export of an external package, so the two-hop path via
// `./components/Citadel/types` is not enough for those consumers — this direct
// star makes the @citadel_cli/core API (CommandRegistry, the DSL, result types)
// resolvable under every module-resolution mode. Bundlers see it either way.
export * from '@citadel_cli/core';
export * from './components/Citadel/types';
