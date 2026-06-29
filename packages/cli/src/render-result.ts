import {
  CommandResult,
  TextCommandResult,
  JsonCommandResult,
  BooleanCommandResult,
  ErrorCommandResult,
  ImageCommandResult,
  PendingCommandResult,
  StreamCommandResult,
} from '@citadel_cli/core';

/**
 * Terminal adapter for command results — the CLI counterpart of the web's
 * `renderResult`. Renders a framework-agnostic {@link CommandResult} to a
 * string for stdout. Custom result subclasses fall back to their own `render()`.
 */
export function renderResult(result: CommandResult): string {
  if (result instanceof TextCommandResult) return result.text;
  if (result instanceof JsonCommandResult) return JSON.stringify(result.data, null, 2);
  if (result instanceof BooleanCommandResult) {
    return result.value ? result.trueText : result.falseText;
  }
  if (result instanceof ErrorCommandResult) return `Error: ${result.error}`;
  if (result instanceof ImageCommandResult) {
    return `[image: ${result.imageUrl}${result.altText ? ` — ${result.altText}` : ''}]`;
  }
  if (result instanceof StreamCommandResult) {
    const body = result.lines.join('\n');
    if (result.droppedCount > 0) {
      return `\x1b[2m… ${result.droppedCount} earlier line(s) hidden\x1b[0m\n${body}`;
    }
    return body;
  }
  if (result instanceof PendingCommandResult) return '…';

  // Extension seam: custom result subclasses provide their own render().
  const maybe = result as { render?: () => unknown };
  if (typeof maybe.render === 'function') return String(maybe.render());
  return '';
}
