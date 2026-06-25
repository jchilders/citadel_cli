/**
 * Framework-agnostic input controller.
 *
 * The "brain" of command entry: given a snapshot of parser state, a key (or an
 * input-field change) and the command registry, it decides *what should happen*
 * and returns a list of {@link Effect}s plus, for key events, whether to
 * preventDefault and whether the input was valid. It performs no mutation, no
 * DOM access and no async work — the front-end adapter interprets the effects
 * (web: `useCommandParser`; a CLI adapter will interpret the same effects).
 * See CORE_EXTRACTION_DESIGN.md.
 */
import {
  CommandRegistry,
  CommandSegment,
  ArgumentSegment,
  WordSegment,
  NullSegment,
} from './command-registry';
import { InputState } from './input-state';
import { parseInput, stripSurroundingQuotes } from './parse-input';
import {
  getNextExpectedSegment,
  getAutocompleteSuggestion,
  isValidCommandInput,
} from './completion';

/** Normalized key, decoupled from the DOM `KeyboardEvent`. */
export type AbstractKey =
  | { name: 'Backspace' | 'Enter' | 'ArrowUp' | 'ArrowDown' }
  | { name: 'char'; char: string }
  | { name: 'other' };

/** Snapshot of the parser state the controller reads. */
export interface ParserState {
  /** Current segment-stack contents (the command path entered so far). */
  stack: CommandSegment[];
  /** Text currently in the input field. */
  currentInput: string;
  inputState: InputState;
  isEnteringArg: boolean;
  /** History navigation position, or null when not navigating. */
  historyPosition: number | null;
}

/**
 * An intent for the adapter to apply, in order. The adapter owns the real
 * segment stack, history service and React/terminal state.
 */
export type Effect =
  | { kind: 'setInput'; value: string }
  | { kind: 'setInputState'; state: InputState }
  /** Set the next-expected ArgumentSegment's value and push it onto the stack. */
  | { kind: 'commitArgument'; value: string }
  /** Push an already-resolved word segment onto the stack. */
  | { kind: 'pushSegment'; segment: CommandSegment }
  | { kind: 'popSegment' }
  | { kind: 'execute' }
  | { kind: 'addHistory' }
  /** Clear input + entering-arg flag, clear the stack, return to idle. */
  | { kind: 'resetInput' }
  | { kind: 'historyNav'; dir: 'up' | 'down' };

/** Outcome of a key event. */
export interface KeyDecision {
  effects: Effect[];
  /** Whether the adapter should call `preventDefault()` on the key event. */
  preventDefault: boolean;
  /** False signals invalid input (the web adapter plays a shake animation). */
  valid: boolean;
}

/**
 * Decide the effects of an input-field change (autocompletion of word segments
 * and committing argument values). Mirrors the former `handleInputChange`.
 */
export function reduceInputChange(
  state: ParserState,
  newValue: string,
  registry: CommandRegistry,
): Effect[] {
  // Don't process input changes while navigating history.
  if (state.historyPosition !== null) {
    return [];
  }

  const effects: Effect[] = [{ kind: 'setInput', value: newValue }];
  const pathNames = state.stack.map(segment => segment.name);
  const nextExpected = getNextExpectedSegment(registry, pathNames, new NullSegment());
  const expectingArgument =
    nextExpected.type === 'argument' || state.inputState === 'entering_argument';

  if (expectingArgument) {
    const parsed = parseInput(newValue);

    // A complete argument (closed quote, or a space-terminated/closed value)
    // commits; an in-progress value just updates the input. Quoted and
    // unquoted inputs commit on the same `isComplete` signal.
    if (parsed.isComplete && nextExpected.type === 'argument') {
      effects.push({ kind: 'commitArgument', value: stripSurroundingQuotes(newValue) });
      effects.push({ kind: 'setInput', value: '' });
      effects.push({ kind: 'setInputState', state: 'idle' });
    }
    return effects;
  }

  // If the user typed a delimiter after a word token, treat it as an explicit
  // selection for exact segment names (e.g. "example " should pick `example`
  // even if `examples` also exists).
  if (newValue.endsWith(' ')) {
    const token = newValue.trim().toLowerCase();
    const exactWordMatches = registry
      .getCompletions(pathNames)
      .filter(
        (segment): segment is WordSegment =>
          segment.type === 'word' && segment.name.toLowerCase() === token,
      );

    if (exactWordMatches.length === 1) {
      effects.push({ kind: 'pushSegment', segment: exactWordMatches[0] });
      effects.push({ kind: 'setInput', value: '' });
      effects.push({ kind: 'setInputState', state: 'idle' });
      return effects;
    }
  }

  const suggested = getAutocompleteSuggestion(registry, pathNames, newValue, new NullSegment());
  if (suggested.type === 'word') {
    effects.push({ kind: 'pushSegment', segment: suggested });
    effects.push({ kind: 'setInput', value: '' });
    effects.push({ kind: 'setInputState', state: 'idle' });
  }

  return effects;
}

/**
 * Decide the effects of a key event (Backspace, Enter, history navigation, and
 * command-input validation). Mirrors the former `handleKeyDown`.
 */
export function reduceKey(
  state: ParserState,
  key: AbstractKey,
  registry: CommandRegistry,
): KeyDecision {
  const pathNames = state.stack.map(segment => segment.name);
  const parsed = parseInput(state.currentInput);

  switch (key.name) {
    case 'Backspace': {
      // Only act on an empty input: pop the last committed segment. With text
      // present, let the field handle character deletion.
      if (state.currentInput === '') {
        const effects: Effect[] = [];
        if (state.stack.length > 0) {
          effects.push({ kind: 'popSegment' });
        }
        effects.push({ kind: 'setInputState', state: 'idle' });
        return { effects, preventDefault: true, valid: true };
      }
      return { effects: [], preventDefault: false, valid: true };
    }

    case 'Enter': {
      // Don't execute while a quote is still open.
      if (parsed.isQuoted && !parsed.isComplete) {
        return { effects: [], preventDefault: true, valid: true };
      }

      const effects: Effect[] = [];
      const simStack = [...state.stack];

      // Commit a pending argument value before resolving the command. NB: this
      // happens even if the command turns out to be incomplete below, matching
      // the original behavior (the committed arg stays on the stack).
      if (
        state.inputState === 'entering_argument' ||
        (state.isEnteringArg && state.currentInput.trim())
      ) {
        const nextExpected = getNextExpectedSegment(registry, pathNames, new NullSegment());
        if (nextExpected.type === 'argument') {
          effects.push({ kind: 'commitArgument', value: stripSurroundingQuotes(state.currentInput) });
          simStack.push(nextExpected);
        }
      }

      // Validate that we have a concrete command to execute.
      const simPathNames = simStack.map(segment => segment.name);
      const command = registry.getCommand(simPathNames);
      if (!command) {
        // Command path incomplete; keep stack & input so the user can continue.
        return { effects, preventDefault: true, valid: false };
      }

      // Validate that all required arguments are provided. Arguments fill in
      // order, so trailing optional ones may be omitted.
      const requiredArgs = command.segments.filter(
        segment => segment.type === 'argument' && !(segment as ArgumentSegment).optional,
      );
      const providedArgs = simStack.filter(segment => segment.type === 'argument');
      if (requiredArgs.length > providedArgs.length) {
        return { effects, preventDefault: true, valid: false };
      }

      effects.push({ kind: 'execute' });
      effects.push({ kind: 'addHistory' });
      effects.push({ kind: 'resetInput' });
      return { effects, preventDefault: true, valid: true };
    }

    case 'ArrowUp':
      return { effects: [{ kind: 'historyNav', dir: 'up' }], preventDefault: true, valid: true };

    case 'ArrowDown':
      return { effects: [{ kind: 'historyNav', dir: 'down' }], preventDefault: true, valid: true };

    case 'char': {
      // While entering an argument any character is allowed. Otherwise reject
      // input that can't continue a valid command path.
      if (!state.isEnteringArg) {
        const nextInput = state.currentInput + key.char;
        if (!isValidCommandInput(registry, pathNames, nextInput)) {
          return { effects: [], preventDefault: true, valid: false };
        }
      }
      return { effects: [], preventDefault: false, valid: true };
    }

    default:
      // Keys we don't specifically handle (arrows L/R, Escape, Delete, Home,
      // End, modifiers, function keys): no-op, let the field handle them.
      return { effects: [], preventDefault: false, valid: true };
  }
}
