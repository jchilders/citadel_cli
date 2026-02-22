import React, { useMemo, useRef } from 'react';

import { useCitadelConfig } from '../config/hooks';
import { useCitadelState } from '../hooks/useCitadelState';
import { CitadelTty } from '../components/CitadelTty';

const toCssLength = (value?: string): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return /^\d+(\.\d+)?$/.test(trimmed) ? `${trimmed}px` : trimmed;
};

export const InlineController: React.FC = () => {
  const { state, actions } = useCitadelState();
  const config = useCitadelConfig();
  const outputRef = useRef<HTMLDivElement>(null);
  const inlineStyle = useMemo(
    () => ({
      height: toCssLength(config.initialHeight),
      maxHeight: toCssLength(config.maxHeight),
      minHeight: toCssLength(config.minHeight)
    }),
    [config.initialHeight, config.maxHeight, config.minHeight]
  );

  return (
    <div
      className="inlineContainer"
      data-testid="citadel-inline-container"
      style={inlineStyle}
    >
      <CitadelTty
        state={state}
        actions={actions}
        outputRef={outputRef}
      />
    </div>
  );
};
