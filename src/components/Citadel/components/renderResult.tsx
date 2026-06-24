import React from 'react';
import {
  CommandResult,
  JsonCommandResult,
  TextCommandResult,
  BooleanCommandResult,
  ErrorCommandResult,
  PendingCommandResult,
  ImageCommandResult,
} from '../types/command-results';

/**
 * Web adapter: renders a framework-agnostic {@link CommandResult} to React
 * nodes. Built-in result types are rendered by type here (rendering used to
 * live on each class as a `render()` method). Custom result subclasses may
 * still supply their own `render()`, which we call as an extension seam — this
 * preserves the public "return a custom CommandResult" authoring path.
 */
export function renderResult(result: CommandResult): React.ReactNode {
  if (result instanceof JsonCommandResult) {
    return (
      <pre className="citadel-result-json">
        {JSON.stringify(result.data, null, 2)}
      </pre>
    );
  }

  if (result instanceof TextCommandResult) {
    return <div className="citadel-result-text">{result.text}</div>;
  }

  if (result instanceof BooleanCommandResult) {
    return (
      <div className="citadel-result-text citadel-result-boolean">
        {result.value ? result.trueText : result.falseText}
      </div>
    );
  }

  if (result instanceof ErrorCommandResult) {
    return <div className="citadel-result-error">{result.error}</div>;
  }

  if (result instanceof PendingCommandResult) {
    return <div className="citadel-result-pending">...</div>;
  }

  if (result instanceof ImageCommandResult) {
    return (
      <div className="citadel-result-image-wrap">
        <img
          src={result.imageUrl}
          alt={result.altText}
          className="citadel-result-image"
        />
      </div>
    );
  }

  // Extension seam: custom result subclasses provide their own render().
  if (hasRenderMethod(result)) {
    return result.render();
  }

  return null;
}

function hasRenderMethod(
  result: unknown
): result is { render(): React.ReactNode } {
  return typeof (result as { render?: unknown }).render === 'function';
}
