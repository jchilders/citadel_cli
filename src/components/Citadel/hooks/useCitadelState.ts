import { useReducer, useRef } from 'react';
import { CommandArg, Command, OutputItem } from '../types';

interface CitadelState {
  isOpen: boolean;
  isClosing: boolean;
  commandStack: string[];
  currentArg: CommandArg | null;
  input: string;
  available: Command[];
  output: OutputItem[];
  isLoading: boolean;
  inputValidation: {
    isValid: boolean;
    message?: string;
  };
}

type CitadelAction =
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'SET_CLOSING', payload: boolean }
  | { type: 'SET_COMMAND_STACK', payload: string[] }
  | { type: 'SET_CURRENT_ARG', payload: CommandArg | null }
  | { type: 'SET_INPUT', payload: string }
  | { type: 'SET_AVAILABLE', payload: Command[] }
  | { type: 'ADD_OUTPUT', payload: OutputItem }
  | { type: 'CLEAR_OUTPUT' }
  | { type: 'SET_LOADING', payload: boolean }
  | { type: 'SET_INPUT_VALIDATION', payload: { isValid: boolean; message?: string } }
  | { type: 'RESET' };

const initialState: CitadelState = {
  isOpen: false,
  isClosing: false,
  commandStack: [],
  currentArg: null,
  input: '',
  available: [],
  output: [],
  isLoading: false,
  inputValidation: { isValid: true },
};

function citadelReducer(state: CitadelState, action: CitadelAction): CitadelState {
  switch (action.type) {
    case 'OPEN':
      return { ...state, isOpen: true, isClosing: false };
    case 'CLOSE':
      return { ...state, isOpen: false, isClosing: false };
    case 'SET_CLOSING':
      return { ...state, isClosing: action.payload };
    case 'SET_COMMAND_STACK':
      return { ...state, commandStack: action.payload };
    case 'SET_CURRENT_ARG':
      return { ...state, currentArg: action.payload };
    case 'SET_INPUT':
      return { ...state, input: action.payload };
    case 'SET_AVAILABLE':
      return { ...state, available: action.payload };
    case 'ADD_OUTPUT':
      return { ...state, output: [...state.output, action.payload] };
    case 'CLEAR_OUTPUT':
      return { ...state, output: [] };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_INPUT_VALIDATION':
      return { ...state, inputValidation: action.payload };
    case 'RESET':
      return {
        ...state,
        commandStack: [],
        input: '',
        currentArg: null,
        available: [],
      };
    default:
      return state;
  }
}

export function useCitadelState() {
  const [state, dispatch] = useReducer(citadelReducer, initialState);
  const outputRef = useRef<HTMLDivElement>(null);

  return {
    state,
    outputRef,
    actions: {
      open: () => dispatch({ type: 'OPEN' }),
      close: () => dispatch({ type: 'CLOSE' }),
      setClosing: (isClosing: boolean) => dispatch({ type: 'SET_CLOSING', payload: isClosing }),
      setCommandStack: (stack: string[]) => dispatch({ type: 'SET_COMMAND_STACK', payload: stack }),
      setCurrentArg: (arg: CommandArg | null) => dispatch({ type: 'SET_CURRENT_ARG', payload: arg }),
      setInput: (input: string) => dispatch({ type: 'SET_INPUT', payload: input }),
      setAvailable: (available: Command[]) => dispatch({ type: 'SET_AVAILABLE', payload: available }),
      addOutput: (output: OutputItem) => dispatch({ type: 'ADD_OUTPUT', payload: output }),
      clearOutput: () => dispatch({ type: 'CLEAR_OUTPUT' }),
      setLoading: (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading }),
      setInputValidation: (validation: { isValid: boolean; message?: string }) => 
        dispatch({ type: 'SET_INPUT_VALIDATION', payload: validation }),
      reset: () => dispatch({ type: 'RESET' }),
    },
  };
}