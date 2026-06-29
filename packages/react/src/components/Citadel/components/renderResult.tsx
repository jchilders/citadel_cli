import React from 'react';
import {
  CommandResult,
  CommandStatus,
  JsonCommandResult,
  TextCommandResult,
  BooleanCommandResult,
  ErrorCommandResult,
  PendingCommandResult,
  ImageCommandResult,
  StreamCommandResult,
} from '@citadel_cli/core';

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

  if (result instanceof StreamCommandResult) {
    const streaming = result.status === CommandStatus.Streaming;
    return (
      <div className="citadel-result-stream-wrap">
        {result.droppedCount > 0 && (
          <div className="citadel-result-stream-dropped">
            … {result.droppedCount} earlier line(s) hidden
          </div>
        )}
        <pre className="citadel-result-stream">{result.lines.join('\n')}</pre>
        {streaming ? (
          <button type="button" className="citadel-stream-stop" onClick={result.cancel}>
            ⏹ Stop
          </button>
        ) : (
          <div className="citadel-result-stream-ended">— stream ended —</div>
        )}
      </div>
    );
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
