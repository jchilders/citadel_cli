/**
 * Back-compat re-export. The result types moved to the framework-agnostic core
 * (`../core/results`) as part of the web/CLI core extraction; rendering now
 * lives in `../components/renderResult`. Existing imports of
 * `./command-results` keep working unchanged. See CORE_EXTRACTION_DESIGN.md.
 */
export * from '../core/results';
