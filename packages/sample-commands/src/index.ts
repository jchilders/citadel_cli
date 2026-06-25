/**
 * @citadel/sample-commands — shared sample command registries.
 *
 * These are framework-agnostic: they build a CommandRegistry with the
 * @citadel/core DSL and nothing else, so the *same* definition file drives both
 * the web demo (`<Citadel>`) and the terminal CLI (`runCli`). Registries that
 * touch the DOM/browser (e.g. localStorage) or React stay in the React package.
 */
export { createBasicCommandRegistry } from './basicCommands';
