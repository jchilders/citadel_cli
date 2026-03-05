import React, { useMemo, useRef } from 'react';

import { useCitadelConfig } from '../config/hooks';
import { useCitadelState } from '../hooks/useCitadelState';
import { CitadelTty } from '../components/CitadelTty';

const OUTPUT_PANE_HIDDEN_MIN_HEIGHT = '128px';

const toCssLength = (value?: string): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return /^\d+(\.\d+)?$/.test(trimmed) ? `${trimmed}px` : trimmed;
};

export const InlineController: React.FC = () => {
  const { state, actions } = useCitadelState();
  const config = useCitadelConfig();
  const showOutputPane = config.showOutputPane ?? true;
  const outputRef = useRef<HTMLDivElement>(null);
  const inlineStyle = useMemo(
    () => ({
      height: showOutputPane ? toCssLength(config.initialHeight) : OUTPUT_PANE_HIDDEN_MIN_HEIGHT,
      maxHeight: showOutputPane ? toCssLength(config.maxHeight) : OUTPUT_PANE_HIDDEN_MIN_HEIGHT,
      minHeight: showOutputPane ? toCssLength(config.minHeight) : OUTPUT_PANE_HIDDEN_MIN_HEIGHT
    }),
    [config.initialHeight, config.maxHeight, config.minHeight, showOutputPane]
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
