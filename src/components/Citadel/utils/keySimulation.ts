import { CitadelState, CitadelActions } from '../types/state';

export const simulateKeyPress = (
  key: string, 
  state: CitadelState, 
  actions: CitadelActions
) => {
  const currentInput = state.currentInput;
  const newInput = currentInput + key;
  actions.setCurrentInput(newInput);
};
