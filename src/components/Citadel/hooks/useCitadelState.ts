import { useReducer, useRef } from 'react';
import { OutputItem, CitadelState, CitadelActions } from '../types';
import { CommandNode } from '../types/command-trie';

type CitadelAction =
  | { type: 'SET_COMMAND_STACK', payload: string[] }
  | { type: 'SET_CURRENT_INPUT', payload: string }
  | { type: 'SET_IS_ENTERING_ARG', payload: boolean }
  | { type: 'SET_CURRENT_NODE', payload: CommandNode | undefined }
  | { type: 'ADD_OUTPUT', payload: OutputItem }
  | { type: 'SET_VALIDATION', payload: { isValid: boolean; message?: string } }
  | { type: 'EXECUTE_COMMAND', payload: { path: string[], args?: string[] } };

const initialState: CitadelState = {
  commandStack: [],
  currentInput: '',
  isEnteringArg: false,
  currentNode: undefined,
  output: [],
  validation: { isValid: true },
};

function citadelReducer(state: CitadelState, action: CitadelAction): CitadelState {
  switch (action.type) {
    case 'SET_COMMAND_STACK':
      return { ...state, commandStack: action.payload };
    case 'SET_CURRENT_INPUT':
      return { ...state, currentInput: action.payload };
    case 'SET_IS_ENTERING_ARG':
      return { ...state, isEnteringArg: action.payload };
    case 'SET_CURRENT_NODE':
      return { ...state, currentNode: action.payload };
    case 'ADD_OUTPUT':
      return { ...state, output: [...state.output, action.payload] };
    case 'SET_VALIDATION':
      return { ...state, validation: action.payload };
    case 'EXECUTE_COMMAND':
      return state;
    default:
      return state;
  }
}

export function useCitadelState() {
  const [state, dispatch] = useReducer(citadelReducer, initialState);
  const outputRef = useRef<HTMLDivElement>(null);

  const actions: CitadelActions = {
    setCommandStack: (stack: string[]) => dispatch({ type: 'SET_COMMAND_STACK', payload: stack }),
    setCurrentInput: (input: string) => dispatch({ type: 'SET_CURRENT_INPUT', payload: input }),
    setIsEnteringArg: (isEntering: boolean) => dispatch({ type: 'SET_IS_ENTERING_ARG', payload: isEntering }),
    setCurrentNode: (node: CommandNode | undefined) => dispatch({ type: 'SET_CURRENT_NODE', payload: node }),
    addOutput: (output: OutputItem) => dispatch({ type: 'ADD_OUTPUT', payload: output }),
    setValidation: (validation: { isValid: boolean; message?: string }) => 
      dispatch({ type: 'SET_VALIDATION', payload: validation }),
    executeCommand: async (path: string[], args?: string[]) => 
      dispatch({ type: 'EXECUTE_COMMAND', payload: { path, args } }),
  };

  return {
    state,
    outputRef,
    actions,
  };
}