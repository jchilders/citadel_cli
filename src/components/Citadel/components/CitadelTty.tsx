import React from 'react';
import { CommandOutput } from './CommandOutput';
import { CommandInput } from './CommandInput';
import { AvailableCommands } from './AvailableCommands';
import { CitadelState, CitadelActions } from '../types/state';
import { useCitadelConfig } from '../config/hooks';

interface CitadelTtyProps {
  state: CitadelState;
  actions: CitadelActions;
  outputRef: React.RefObject<HTMLDivElement>;
}

export const CitadelTty: React.FC<CitadelTtyProps> = ({
  state,
  actions,
  outputRef
}) => {
  const config = useCitadelConfig();
  const isInline = config.displayMode === 'inline';
  const showOutputPane = config.showOutputPane ?? true;
  const outputPaneStyle = React.useMemo(
    () => (showOutputPane && isInline ? { overflow: 'hidden' } : undefined),
    [isInline, showOutputPane]
  );

  return (
    <div className="innerContainer citadel-tty">
      {showOutputPane ? (
        <div
          className="citadel-tty-output-pane"
          data-testid="citadel-output-pane"
          style={outputPaneStyle}
        >
          <CommandOutput output={state.output} outputRef={outputRef} />
        </div>
      ) : null}
      <div className="citadel-tty-input-region">
        <CommandInput state={state} actions={actions} />
        <AvailableCommands currentInput={state.isEnteringArg ? '' : state.currentInput} />
      </div>
    </div>
  );
};
