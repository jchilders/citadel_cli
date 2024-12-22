import React from 'react';
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
      return <pre className="output-text">{result.text}</pre>;
    }

    if (result instanceof JsonCommandResult) {
      return (
        <pre className="output-json">
          {JSON.stringify(result.data, null, 2)}
        </pre>
      );
    }

    if (result instanceof ImageCommandResult) {
      return (
        <img
          src={result.url}
          alt={result.alt || 'Command output'}
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
                {result.columns.map((col, i) => (
                  <th key={i}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, i) => (
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
          dangerouslySetInnerHTML={{ __html: result.html }}
        />
      );
    }

    if (result instanceof HtmlCommandResult) {
      return (
        <div
          className="output-html"
          dangerouslySetInnerHTML={{ __html: result.html }}
        />
      );
    }

    return <div className="output-unknown">Unsupported result type</div>;
  };

  return <div className="output-view">{renderResult()}</div>;
};
