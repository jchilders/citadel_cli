import {
  CommandRegistry,
  CommandSegment,
  CommandNode,
  ArgumentSegment,
  NullSegment,
  SegmentStack,
  CommandResult,
  ErrorCommandResult,
  getNextExpectedSegment,
  reduceInputChange,
  reduceKey,
  type AbstractKey,
  type Effect,
  type InputState,
  type ParserState,
} from '@citadel/core';

export interface ExecutedCommand {
  path: string[];
  result: CommandResult;
}

/**
 * Terminal adapter that drives the framework-agnostic @citadel/core engine — the
 * CLI counterpart of the React `useCommandParser` hook. It owns a segment stack
 * and the parser state, feeds keystrokes through the same `reduceKey` /
 * `reduceInputChange` reducers the web uses, and interprets the returned
 * effects against in-memory state. No React, no DOM. See
 * CORE_EXTRACTION_DESIGN.md.
 */
export class CliSession {
  private readonly stack = new SegmentStack();
  private currentInput = '';
  private inputState: InputState = 'idle';
  private isEnteringArg = false;
  private readonly historyEntries: CommandSegment[][] = [];
  private historyPosition: number | null = null;

  /** Commands executed so far, most recent last. */
  readonly outputs: ExecutedCommand[] = [];

  constructor(
    private readonly registry: CommandRegistry,
    private readonly onExecute?: (executed: ExecutedCommand) => void,
  ) {
    this.syncInputState();
  }

  /** The committed command path entered so far (segment names). */
  path(): string[] {
    return this.stack.path();
  }

  /** The text currently being typed (not yet committed to the stack). */
  get input(): string {
    return this.currentInput;
  }

  /**
   * The prompt as it would appear: committed segments + the in-progress input.
   * Argument segments render their value.
   */
  renderPrompt(): string {
    const committed = this.stack.toArray().map((segment) =>
      segment.type === 'argument' ? (segment as ArgumentSegment).value ?? '' : segment.name,
    );
    return [...committed, this.currentInput].filter((part) => part !== '').join(' ');
  }

  /**
   * The next segment names reachable from the current path — command words and,
   * when an argument is expected, the argument name. For suggestion display.
   */
  suggestions(): string[] {
    return this.registry.getCompletionNames(this.stack.path());
  }

  private snapshot(): ParserState {
    return {
      stack: this.stack.toArray(),
      currentInput: this.currentInput,
      inputState: this.inputState,
      isEnteringArg: this.isEnteringArg,
      historyPosition: this.historyPosition,
    };
  }

  /**
   * Feed a single printable character. Returns false if the engine rejects it
   * (invalid command input) — the caller may ring the bell.
   */
  typeChar(ch: string): boolean | Promise<boolean> {
    const decision = reduceKey(this.snapshot(), { name: 'char', char: ch }, this.registry);
    if (!decision.valid) return false;

    const newValue = this.currentInput + ch;
    const applied = this.applyEffects(reduceInputChange(this.snapshot(), newValue, this.registry));
    return applied instanceof Promise ? applied.then(() => true) : true;
  }

  /** Feed a non-character key (Enter, Backspace, ArrowUp/ArrowDown). */
  press(key: AbstractKey): void | Promise<void> {
    // Backspace with text present edits the buffer (the engine only pops the
    // stack on an empty buffer), mirroring the web input field.
    if (key.name === 'Backspace' && this.currentInput !== '') {
      const newValue = this.currentInput.slice(0, -1);
      return this.applyEffects(reduceInputChange(this.snapshot(), newValue, this.registry));
    }

    const decision = reduceKey(this.snapshot(), key, this.registry);

    const navEffect = decision.effects.find((effect) => effect.kind === 'historyNav');
    if (navEffect && navEffect.kind === 'historyNav') {
      this.navigate(navEffect.dir);
      return;
    }

    return this.applyEffects(decision.effects);
  }

  private applyEffects(effects: Effect[]): void | Promise<void> {
    let pending: { command: CommandNode; path: string[]; argVals: string[] } | null = null;

    for (const effect of effects) {
      switch (effect.kind) {
        case 'setInput':
          this.currentInput = effect.value;
          break;
        case 'setInputState':
          this.inputState = effect.state;
          break;
        case 'commitArgument': {
          const next = getNextExpectedSegment(this.registry, this.stack.path(), new NullSegment());
          if (next instanceof ArgumentSegment) {
            next.value = effect.value;
            this.stack.push(next);
          }
          break;
        }
        case 'pushSegment':
          this.stack.push(effect.segment);
          break;
        case 'popSegment':
          if (this.stack.size() > 0) this.stack.pop();
          break;
        case 'execute':
          // Capture the command + args before resetInput clears the stack.
          pending = this.captureExecution();
          break;
        case 'addHistory':
          this.historyEntries.push(this.stack.toArray());
          break;
        case 'resetInput':
          this.currentInput = '';
          this.isEnteringArg = false;
          this.stack.clear();
          this.inputState = 'idle';
          break;
        case 'historyNav':
          // Handled by press(); ignored here.
          break;
      }
    }

    this.historyPosition = null;
    this.syncInputState();

    return pending ? this.runExecution(pending) : undefined;
  }

  private captureExecution(): { command: CommandNode; path: string[]; argVals: string[] } | null {
    const path = this.stack.path();
    const command = this.registry.getCommand(path);
    if (!command) return null;

    const argVals = this.stack.arguments.map((argument) => argument.value || '');
    // Fill declared defaults for omitted trailing optional arguments.
    const declaredArgs = command.segments.filter(
      (segment): segment is ArgumentSegment => segment.type === 'argument',
    );
    for (let i = argVals.length; i < declaredArgs.length; i++) {
      const { defaultValue } = declaredArgs[i];
      if (defaultValue === undefined) break;
      argVals.push(defaultValue);
    }

    return { command, path, argVals };
  }

  private async runExecution(pending: { command: CommandNode; path: string[]; argVals: string[] }): Promise<void> {
    let result: CommandResult;
    try {
      const value = await pending.command.handler(pending.argVals);
      if (!(value instanceof CommandResult)) {
        throw new Error(
          `The ${pending.path.join('.')} command returned an invalid result type. ` +
            'Commands must return a CommandResult (e.g. text(), json(), bool()).',
        );
      }
      value.markSuccess();
      result = value;
    } catch (error) {
      result = new ErrorCommandResult(error instanceof Error ? error.message : 'Unknown error');
    }

    const executed: ExecutedCommand = { path: pending.path, result };
    this.outputs.push(executed);
    this.onExecute?.(executed);
  }

  private navigate(dir: 'up' | 'down'): void {
    if (this.historyEntries.length === 0) return;

    if (dir === 'up') {
      this.historyPosition =
        this.historyPosition === null
          ? this.historyEntries.length - 1
          : Math.max(0, this.historyPosition - 1);
    } else {
      if (this.historyPosition === null) return;
      this.historyPosition += 1;
      if (this.historyPosition >= this.historyEntries.length) {
        this.historyPosition = null;
        this.stack.clear();
        this.currentInput = '';
        this.syncInputState();
        return;
      }
    }

    const entry = this.historyEntries[this.historyPosition];
    this.stack.clear();
    this.stack.pushAll(entry.map((segment) => segment));
    this.currentInput = '';
    this.syncInputState();
  }

  /**
   * Recompute the input mode from the next expected segment — the CLI
   * counterpart of CommandInput's segment-stack effect. Drives whether typed
   * text is treated as a command word or an argument value.
   */
  private syncInputState(): void {
    if (this.inputState !== 'idle') return;

    const next = getNextExpectedSegment(this.registry, this.stack.path(), new NullSegment());
    if (next.type === 'word') {
      this.inputState = 'entering_command';
      this.isEnteringArg = false;
    } else if (next.type === 'argument') {
      this.inputState = 'entering_argument';
      this.isEnteringArg = true;
    }
  }
}
