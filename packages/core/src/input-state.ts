/**
 * Framework-agnostic input-mode state machine.
 *
 * Part of the Citadel core: pure logic with no React or DOM dependency, shared
 * between the web (React) and terminal (CLI) front-ends. See
 * CORE_EXTRACTION_DESIGN.md.
 */
import { Logger } from './logger';

export type InputState = 'idle' | 'entering_command' | 'entering_argument';

export type InputStateAction = {
  type: 'set';
  state: InputState;
};

export function inputStateReducer(state: InputState, action: InputStateAction): InputState {
  switch (action.type) {
    case 'set':
      Logger.debug(`[inputStateReducer] InputState changing from ${state} to ${action.state}`);
      return action.state;
    default:
      return state;
  }
}
