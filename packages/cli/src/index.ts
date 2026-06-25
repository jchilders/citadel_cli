/**
 * @citadel/cli — terminal front-end for the @citadel/core command engine.
 *
 * Hand a command registry (built with the @citadel/core DSL) to `runCli` for a
 * readline REPL, or drive a `CliSession` directly. See the README and
 * examples/dungeon-console.ts.
 */
export { runCli } from './run';
export { runRepl, type ReplOptions } from './repl';
export { CliSession, type ExecutedCommand } from './session';
export { renderResult } from './render-result';
