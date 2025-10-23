import React, { useRef } from 'react';
import { useCitadelConfig } from '../config/hooks';
import { useCitadelState } from '../hooks/useCitadelState';
import { CitadelTty } from '../components/CitadelTty';

export const InlineController: React.FC = () => {
  const { state, actions } = useCitadelState();
  const config = useCitadelConfig();
  const outputRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="inlineContainer"
      style={{
        minHeight: config.minHeight,
        maxHeight: config.maxHeight,
        height: config.initialHeight
      }}
      data-testid="citadel-inline-container"
    >
      <CitadelTty
        state={state}
        actions={actions}
        outputRef={outputRef}
      />
    </div>
  );
};
