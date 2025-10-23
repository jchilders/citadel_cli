import React from 'react';
import { CommandOutput } from './CommandOutput';
import { CommandInput } from './CommandInput';
import { AvailableCommands } from './AvailableCommands';
import { CitadelState, CitadelActions } from '../types/state';

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
  return (
    <div className="innerContainer">
      <div className="flex-1 min-h-0 pt-3 px-4">
        <CommandOutput output={state.output} outputRef={outputRef} />
      </div>
      <div>
        <CommandInput state={state} actions={actions} />
        <AvailableCommands />
      </div>
    </div>
  );
};
