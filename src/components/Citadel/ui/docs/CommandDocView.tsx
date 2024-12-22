import React, { useEffect, useState } from 'react';
import { CommandDocViewProps } from '../types';
import { CommandDoc } from '../../types/command-docs';
import './CommandDocView.css';

interface ExampleProps {
  command: string;
  description: string;
  onSelect: (command: string) => void;
}

const Example: React.FC<ExampleProps> = ({ command, description, onSelect }) => (
  <div className="doc-example" onClick={() => onSelect(command)}>
    <pre className="doc-example-command">{command}</pre>
    <p className="doc-example-description">{description}</p>
  </div>
);

interface ArgumentProps {
  name: string;
  description: string;
  type: string;
  required: boolean;
}

const Argument: React.FC<ArgumentProps> = ({ name, type, description, required }) => (
  <div className="doc-argument">
    <div className="doc-argument-header">
      <code className="doc-argument-name">{name}</code>
      <span className="doc-argument-type">{type}</span>
      {required && <span className="doc-argument-required">Required</span>}
    </div>
    <p className="doc-argument-description">{description}</p>
  </div>
);

export const CommandDocView: React.FC<CommandDocViewProps> = ({
  commandId,
  onClose,
  onExampleSelect,
  docs,
}) => {
  const [activeDoc, setActiveDoc] = useState<CommandDoc | null>(null);

  useEffect(() => {
    if (commandId && docs) {
      const doc = docs.find(d => d.name === commandId);
      setActiveDoc(doc || null);
    } else {
      setActiveDoc(null);
    }
  }, [commandId, docs]);

  if (!activeDoc) {
    return (
      <div className="doc-view doc-empty">
        <p>Select a command to view its documentation</p>
      </div>
    );
  }

  const handleExampleSelect = (command: string) => {
    onExampleSelect?.(command);
  };

  return (
    <div className="doc-view">
      <div className="doc-header">
        <div>
          <h2 className="doc-title">{activeDoc.name}</h2>
          {activeDoc.deprecated && (
            <span className="doc-deprecated">
              ⚠️ Deprecated: {activeDoc.deprecated}
            </span>
          )}
        </div>
        <button className="doc-close" onClick={onClose}>×</button>
      </div>

      <div className="doc-content">
        <section className="doc-section">
          <p className="doc-description">{activeDoc.description}</p>
          {activeDoc.longDescription && (
            <p className="doc-long-description">{activeDoc.longDescription}</p>
          )}
        </section>

        {activeDoc.arguments?.length > 0 && (
          <section className="doc-section">
            <h3>Arguments</h3>
            <div className="doc-arguments">
              {activeDoc.arguments.map(arg => (
                <Argument
                  key={arg.name}
                  name={arg.name}
                  type={arg.type}
                  description={arg.description}
                  required={arg.required}
                />
              ))}
            </div>
          </section>
        )}

        {activeDoc.examples?.length > 0 && (
          <section className="doc-section">
            <h3>Examples</h3>
            <div className="doc-examples">
              {activeDoc.examples.map((example, index) => (
                <Example
                  key={index}
                  command={example.command}
                  description={example.description}
                  onSelect={handleExampleSelect}
                />
              ))}
            </div>
          </section>
        )}

        <section className="doc-section doc-metadata">
          <p className="doc-since">Available since: {activeDoc.since}</p>
          {activeDoc.returns && (
            <p className="doc-returns">Returns: {activeDoc.returns}</p>
          )}
        </section>
      </div>
    </div>
  );
};
