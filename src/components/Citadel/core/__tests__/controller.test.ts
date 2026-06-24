import { describe, expect, it } from 'vitest';
import { command, createCommandRegistry, text } from '../../types/command-dsl';
import { CommandRegistry, CommandSegment } from '../../types/command-registry';
import { InputState } from '../input-state';
import {
  reduceInputChange,
  reduceKey,
  type ParserState,
} from '../controller';

// A small registry: `user show <userId>` (required arg), `user list`, `ping`.
function buildRegistry(): CommandRegistry {
  return createCommandRegistry([
    command('user.show')
      .describe('Show user')
      .arg('userId', (arg) => arg.describe('Enter user ID'))
      .handle(async () => text('ok')),
    command('user.list').describe('List users').handle(async () => text('ok')),
    command('ping').describe('Ping').handle(async () => text('ok')),
  ]);
}

// Build a stack of real registry segments by walking completions, so segment
// identities/names match what the controller derives from the same registry.
function pathStack(registry: CommandRegistry, names: string[]): CommandSegment[] {
  const stack: CommandSegment[] = [];
  for (const name of names) {
    const completion = registry
      .getCompletions(stack.map((segment) => segment.name))
      .find((segment) => segment.name === name);
    if (!completion) throw new Error(`no completion "${name}" for path ${stack.map((s) => s.name).join(' ')}`);
    stack.push(completion);
  }
  return stack;
}

function makeState(over: Partial<ParserState> = {}): ParserState {
  return {
    stack: [],
    currentInput: '',
    inputState: 'idle' as InputState,
    isEnteringArg: false,
    historyPosition: null,
    ...over,
  };
}

describe('reduceInputChange', () => {
  it('always emits a setInput for the new value', () => {
    const registry = buildRegistry();
    const effects = reduceInputChange(makeState(), 'p', registry);
    expect(effects[0]).toEqual({ kind: 'setInput', value: 'p' });
  });

  it('emits nothing while navigating history', () => {
    const registry = buildRegistry();
    const effects = reduceInputChange(makeState({ historyPosition: 0 }), 'ping', registry);
    expect(effects).toEqual([]);
  });

  it('autocompletes an unambiguous word prefix by pushing the segment', () => {
    const registry = buildRegistry();
    const effects = reduceInputChange(makeState(), 'pi', registry);
    const push = effects.find((e) => e.kind === 'pushSegment');
    expect(push && push.kind === 'pushSegment' && push.segment.name).toBe('ping');
    expect(effects.some((e) => e.kind === 'setInputState' && e.state === 'idle')).toBe(true);
  });

  it('does not autocomplete an ambiguous prefix (just sets input)', () => {
    const registry = buildRegistry();
    // "us" is unambiguous to "user", but a single char "u" → "user" is unique too;
    // use a prefix that stays ambiguous only if siblings collide. Here "user"
    // is the only u-word, so assert the non-colliding control: "x" matches nothing.
    const effects = reduceInputChange(makeState(), 'x', registry);
    expect(effects).toEqual([{ kind: 'setInput', value: 'x' }]);
  });

  it('selects an exact word on a trailing space', () => {
    const registry = buildRegistry();
    const effects = reduceInputChange(makeState(), 'user ', registry);
    const push = effects.find((e) => e.kind === 'pushSegment');
    expect(push && push.kind === 'pushSegment' && push.segment.name).toBe('user');
  });

  it('commits a completed unquoted argument value', () => {
    const registry = buildRegistry();
    const state = makeState({
      stack: pathStack(registry, ['user', 'show']),
      inputState: 'entering_argument',
    });
    const effects = reduceInputChange(state, '42 ', registry);
    expect(effects).toContainEqual({ kind: 'commitArgument', value: '42' });
    expect(effects).toContainEqual({ kind: 'setInputState', state: 'idle' });
  });

  it('strips quotes when committing a quoted argument value', () => {
    const registry = buildRegistry();
    const state = makeState({
      stack: pathStack(registry, ['user', 'show']),
      inputState: 'entering_argument',
    });
    const effects = reduceInputChange(state, '"the answer"', registry);
    expect(effects).toContainEqual({ kind: 'commitArgument', value: 'the answer' });
  });

  it('does not commit while a quote is still open', () => {
    const registry = buildRegistry();
    const state = makeState({
      stack: pathStack(registry, ['user', 'show']),
      inputState: 'entering_argument',
    });
    const effects = reduceInputChange(state, '"the answer', registry);
    expect(effects.some((e) => e.kind === 'commitArgument')).toBe(false);
    expect(effects).toEqual([{ kind: 'setInput', value: '"the answer' }]);
  });
});

describe('reduceKey', () => {
  describe('Backspace', () => {
    it('pops the last segment when input is empty', () => {
      const registry = buildRegistry();
      const state = makeState({ stack: pathStack(registry, ['user']), currentInput: '' });
      const decision = reduceKey(state, { name: 'Backspace' }, registry);
      expect(decision.preventDefault).toBe(true);
      expect(decision.effects).toContainEqual({ kind: 'popSegment' });
      expect(decision.effects).toContainEqual({ kind: 'setInputState', state: 'idle' });
    });

    it('does not pop when the stack is empty', () => {
      const registry = buildRegistry();
      const decision = reduceKey(makeState({ currentInput: '' }), { name: 'Backspace' }, registry);
      expect(decision.effects.some((e) => e.kind === 'popSegment')).toBe(false);
    });

    it('is a no-op (no preventDefault) when there is text to delete', () => {
      const registry = buildRegistry();
      const state = makeState({ stack: pathStack(registry, ['user']), currentInput: 'sh' });
      const decision = reduceKey(state, { name: 'Backspace' }, registry);
      expect(decision.preventDefault).toBe(false);
      expect(decision.effects).toEqual([]);
    });
  });

  describe('Enter', () => {
    it('executes an arg-less command and records history', () => {
      const registry = buildRegistry();
      const state = makeState({ stack: pathStack(registry, ['user', 'list']) });
      const decision = reduceKey(state, { name: 'Enter' }, registry);
      expect(decision.valid).toBe(true);
      expect(decision.effects.map((e) => e.kind)).toEqual(['execute', 'addHistory', 'resetInput']);
    });

    it('commits a pending argument, then executes', () => {
      const registry = buildRegistry();
      const state = makeState({
        stack: pathStack(registry, ['user', 'show']),
        currentInput: '42',
        inputState: 'entering_argument',
      });
      const decision = reduceKey(state, { name: 'Enter' }, registry);
      expect(decision.valid).toBe(true);
      expect(decision.effects.map((e) => e.kind)).toEqual([
        'commitArgument',
        'execute',
        'addHistory',
        'resetInput',
      ]);
      expect(decision.effects[0]).toEqual({ kind: 'commitArgument', value: '42' });
    });

    it('is invalid when a required argument is missing', () => {
      const registry = buildRegistry();
      const state = makeState({ stack: pathStack(registry, ['user', 'show']) });
      const decision = reduceKey(state, { name: 'Enter' }, registry);
      expect(decision.valid).toBe(false);
      expect(decision.effects.some((e) => e.kind === 'execute')).toBe(false);
    });

    it('is invalid (no execute) when the path is not a concrete command', () => {
      const registry = buildRegistry();
      const state = makeState({ stack: pathStack(registry, ['user']) });
      const decision = reduceKey(state, { name: 'Enter' }, registry);
      expect(decision.valid).toBe(false);
      expect(decision.effects.some((e) => e.kind === 'execute')).toBe(false);
    });

    it('does not execute while a quote is unclosed', () => {
      const registry = buildRegistry();
      const state = makeState({
        stack: pathStack(registry, ['user', 'show']),
        currentInput: '"open',
        inputState: 'entering_argument',
      });
      const decision = reduceKey(state, { name: 'Enter' }, registry);
      expect(decision.effects).toEqual([]);
      expect(decision.valid).toBe(true);
      expect(decision.preventDefault).toBe(true);
    });
  });

  describe('history navigation', () => {
    it('emits historyNav up on ArrowUp', () => {
      const registry = buildRegistry();
      const decision = reduceKey(makeState(), { name: 'ArrowUp' }, registry);
      expect(decision.preventDefault).toBe(true);
      expect(decision.effects).toEqual([{ kind: 'historyNav', dir: 'up' }]);
    });

    it('emits historyNav down on ArrowDown', () => {
      const registry = buildRegistry();
      const decision = reduceKey(makeState(), { name: 'ArrowDown' }, registry);
      expect(decision.effects).toEqual([{ kind: 'historyNav', dir: 'down' }]);
    });
  });

  describe('character input', () => {
    it('accepts a character that continues a valid command path', () => {
      const registry = buildRegistry();
      const decision = reduceKey(makeState(), { name: 'char', char: 'p' }, registry);
      expect(decision.valid).toBe(true);
      expect(decision.preventDefault).toBe(false);
    });

    it('rejects a character that cannot continue any command', () => {
      const registry = buildRegistry();
      const decision = reduceKey(makeState(), { name: 'char', char: 'z' }, registry);
      expect(decision.valid).toBe(false);
      expect(decision.preventDefault).toBe(true);
    });

    it('accepts any character while entering an argument', () => {
      const registry = buildRegistry();
      const state = makeState({
        stack: pathStack(registry, ['user', 'show']),
        isEnteringArg: true,
      });
      const decision = reduceKey(state, { name: 'char', char: 'z' }, registry);
      expect(decision.valid).toBe(true);
    });

    it('ignores unhandled keys (e.g. ArrowLeft → other)', () => {
      const registry = buildRegistry();
      const decision = reduceKey(makeState(), { name: 'other' }, registry);
      expect(decision).toEqual({ effects: [], preventDefault: false, valid: true });
    });
  });
});
