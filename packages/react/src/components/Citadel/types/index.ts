// React-side type barrel. `state` is the React app-state shape; the command
// engine (registry, DSL, result types, cursor, segments, controller…) now lives
// in @citadel_cli/core and is re-exported here so existing `../types` imports — and
// the public library surface (src/index.ts) — keep resolving. See
// CORE_EXTRACTION_DESIGN.md.
export * from './state';
export * from '@citadel_cli/core';
