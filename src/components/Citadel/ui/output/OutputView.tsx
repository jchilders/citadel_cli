import * as React from 'react';
import { OutputViewProps } from '../types';
import {
  TextCommandResult,
  JsonCommandResult,
  ImageCommandResult,
  TableCommandResult,
  MarkdownCommandResult,
  HtmlCommandResult,
} from '../../types/command-results';
import './OutputView.css';

const LoadingSpinner: React.FC = () => (
  <div className="output-loading">
    <div className="spinner" />
    <span>Executing command...</span>
  </div>
);

const ErrorView: React.FC<{ error: Error }> = ({ error }) => (
  <div className="output-error">
    <span className="error-icon">⚠️</span>
    <span className="error-message">{error.message}</span>
  </div>
);

export const OutputView: React.FC<OutputViewProps> = ({
  result,
  error,
  loading,
}) => {
  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorView error={error} />;
  }

  if (!result) {
    return null;
  }

  const renderResult = () => {
    if (result instanceof TextCommandResult) {
      return <pre className="output-text">{result.value}</pre>;
    }

    if (result instanceof JsonCommandResult) {
      return (
        <pre className="output-json">
          {JSON.stringify(result.value, null, 2)}
        </pre>
      );
    }

    if (result instanceof ImageCommandResult) {
      const { src, alt } = result.value;
      return (
        <img
          src={src}
          alt={alt || 'Command output'}
          className="output-image"
        />
      );
    }

    if (result instanceof TableCommandResult) {
      return (
        <div className="output-table-wrapper">
          <table className="output-table">
            <thead>
              <tr>
                {result.value.headers.map((col, i) => (
                  <th key={i}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.value.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (result instanceof MarkdownCommandResult) {
      return (
        <div
          className="output-markdown"
          dangerouslySetInnerHTML={{ __html: result.value }}
        />
      );
    }

    if (result instanceof HtmlCommandResult) {
      return (
        <div
          className="output-html"
          dangerouslySetInnerHTML={{ __html: result.value }}
        />
      );
    }

    return <div className="output-unknown">Unsupported result type</div>;
  };

  return <div className="output-view">{renderResult()}</div>;
};
