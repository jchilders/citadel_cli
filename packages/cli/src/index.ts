/**
 * @citadel/cli — terminal front-end for the @citadel/core command engine.
 *
 * Hand a command registry (built with the @citadel/core DSL) to `runCli` for an
 * interactive Ink TUI (output pane + command line + suggestions), or drive a
 * `CliSession` directly. See the README and examples/dungeon-console.ts.
 */
export { runCli } from './run';
export { runTui, type CliOptions } from './tui';
export {
  CliSession,
  type CliOutputItem,
  type CliSessionOptions,
  type CompletionView,
} from './session';
export { renderResult } from './render-result';
