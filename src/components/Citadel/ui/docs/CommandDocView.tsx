import React from 'react';
import { CommandDoc } from '../../types/command-docs';

interface CommandDocViewProps {
  doc: CommandDoc;
  onExampleSelect?: (command: string) => void;
}

export const CommandDocView: React.FC<CommandDocViewProps> = ({
  doc: activeDoc,
  onExampleSelect
}) => {
  const handleExampleClick = (command: string) => {
    onExampleSelect?.(command);
  };

  const renderReturnValue = (doc: CommandDoc) => {
    if (!doc.returns) return null;
    
    return (
      <div className="command-doc-section">
        <h3>Returns</h3>
        <div>{doc.returns}</div>
      </div>
    );
  };

  return (
    <div className="doc-view">
      <div className="doc-header">
        <h2>{activeDoc.name}</h2>
        {activeDoc.description && <p>{activeDoc.description}</p>}
      </div>

      <div className="doc-content">
        {activeDoc.arguments?.length > 0 && (
          <section className="doc-section">
            <h3>Arguments</h3>
            <ul>
              {activeDoc.arguments.map((arg: { name: string; description: string; type?: string; optional?: boolean }, index: number) => (
                <li key={index}>
                  <code>{arg.name}</code>: {arg.description}
                  {arg.type && <span className="type"> ({arg.type})</span>}
                  {arg.optional && <span className="optional"> (optional)</span>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {activeDoc.examples?.length > 0 && (
          <section className="doc-section">
            <h3>Examples</h3>
            <ul>
              {activeDoc.examples.map((example: { command: string; description?: string }, index: number) => (
                <li key={index} onClick={() => handleExampleClick(example.command)}>
                  <code>{example.command}</code>
                  {example.description && (
                    <p className="example-description">{example.description}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {activeDoc.returns && (
          <section className="doc-section">
            {renderReturnValue(activeDoc)}
          </section>
        )}
      </div>
    </div>
  );
};
