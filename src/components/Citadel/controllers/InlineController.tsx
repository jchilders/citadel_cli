import React, { useRef } from 'react';

import { useCitadelState } from '../hooks/useCitadelState';
import { CitadelTty } from '../components/CitadelTty';

export const InlineController: React.FC = () => {
  const { state, actions } = useCitadelState();
  const outputRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="inlineContainer"
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
