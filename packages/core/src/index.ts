/**
 * @citadel_cli/core — the framework-agnostic command engine.
 *
 * Pure command parsing, completion, the input controller, the command DSL and
 * result types, with no React or DOM dependency. Consumed by the React library
 * (the root `@citadel_cli/react` package) and by the terminal CLI. See
 * CORE_EXTRACTION_DESIGN.md.
 */
export * from './logger';
export * from './command-registry';
export * from './command-prefix';
export * from './segment-stack';
export * from './storage';
export * from './cursor';
export * from './results';
export * from './command-dsl';
export * from './help-command';
export * from './input-state';
export * from './parse-input';
export * from './completion';
export * from './controller';
