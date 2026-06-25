import {
  CommandRegistry,
  CommandSegment,
  CommandNode,
  ArgumentSegment,
  NullSegment,
  SegmentStack,
  CommandResult,
  CommandStatus,
  ErrorCommandResult,
  PendingCommandResult,
  getNextExpectedSegment,
  getCommandPrefixLengths,
  reduceInputChange,
  reduceKey,
  type AbstractKey,
  type Effect,
  type InputState,
  type ParserState,
} from '@citadel/core';

/**
 * One entry in the output pane. Mirrors the web's OutputItem lifecycle: created
 * with a PendingCommandResult (status Pending) the moment a command executes,
 * then updated in place when the handler resolves.
 */
export interface CliOutputItem {
  id: number;
  path: string[];
  /** The command as typed (words + argument values). */
  commandLine: string;
  /** When the command was issued (ms epoch), for the output-line timestamp. */
  timestamp: number;
  status: CommandStatus;
  result: CommandResult;
}

export interface CliSessionOptions {
  /** Called once per command when it resolves (used by the scripted line mode). */
  onExecute?: (item: CliOutputItem) => void;
  /** Called after every state change, so a TUI can re-render. */
  onChange?: () => void;
  /** Fail a command that runs longer than this many ms (web parity). 0 disables. */
  commandTimeoutMs?: number;
}

/** A command suggestion with the length of its shortest unambiguous prefix. */
export interface CommandSuggestion {
  name: string;
  /** Number of leading characters that uniquely select this command. */
  prefixLength: number;
}

/**
 * What to show beneath the prompt, mirroring the web's AvailableCommands: a list
 * of next command words (with auto-expand prefixes), or the next argument, or
 * nothing.
 */
export type CompletionView =
  | { kind: 'commands'; items: CommandSuggestion[] }
  | { kind: 'argument'; name: string; optional: boolean; description?: string }
  | { kind: 'none' };

/**
 * Terminal adapter that drives the framework-agnostic @citadel/core engine — the
 * CLI counterpart of the React useCommandParser + useCitadelState hooks. It owns
 * a segment stack, the parser state, and the output history; feeds keystrokes
 * through the same reduceKey / reduceInputChange reducers the web uses; and runs
 * commands with the same pending→resolve output lifecycle. No React, no DOM.
 * Both the scripted (line) mode and the Ink TUI drive one of these. See
 * CORE_EXTRACTION_DESIGN.md.
 */
export class CliSession {
  private readonly stack = new SegmentStack();
  private currentInput = '';
  private inputState: InputState = 'idle';
  private isEnteringArg = false;
  private readonly historyEntries: CommandSegment[][] = [];
  private historyPosition: number | null = null;
  private nextId = 0;

  private readonly onExecute?: (item: CliOutputItem) => void;
  private readonly onChange?: () => void;
  private readonly commandTimeoutMs: number;

  /** The output pane: executed commands (pending or resolved), in issue order. */
  readonly outputs: CliOutputItem[] = [];

  constructor(
    private readonly registry: CommandRegistry,
    options: CliSessionOptions = {},
  ) {
    this.onExecute = options.onExecute;
    this.onChange = options.onChange;
    this.commandTimeoutMs = options.commandTimeoutMs ?? 10_000;
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
    // A committed path always ends in a space, so an auto-expanded word reads as
    // "crew " — ready for the next word or argument — and the in-progress input
    // follows it.
    const prefix = committed.length > 0 ? committed.join(' ') + ' ' : '';
    return prefix + this.currentInput;
  }

  /**
   * What to display beneath the prompt for the current path + input. Mirrors the
   * web's AvailableCommands: matching command words (sorted alphabetically, help
   * last) each tagged with their shortest unambiguous prefix, or the next
   * argument, or nothing. Uses the same core helpers as the web.
   */
  completionView(): CompletionView {
    const path = this.stack.path();
    const input = this.currentInput.trim().toLowerCase();
    const matching = this.registry.getMatchingCompletions(path, input);

    if (matching.length === 0) return { kind: 'none' };

    if (matching.some((segment) => segment.type === 'argument')) {
      const arg = matching[0] as ArgumentSegment;
      return {
        kind: 'argument',
        name: arg.name,
        optional: Boolean(arg.optional),
        description: arg.description,
      };
    }

    const isHelp = (segment: CommandSegment) => segment.name.toLowerCase() === 'help';
    const sorted = [...matching].sort((a, b) => {
      if (isHelp(a) !== isHelp(b)) return isHelp(a) ? 1 : -1; // help last
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });
    const prefixLengths = getCommandPrefixLengths(sorted);

    return {
      kind: 'commands',
      items: sorted.map((segment) => ({
        name: segment.name,
        prefixLength: prefixLengths.get(segment.name) ?? 1,
      })),
    };
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

  private notify(): void {
    this.onChange?.();
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
    let pending: {
      command: CommandNode;
      path: string[];
      commandLine: string;
      argVals: string[];
    } | null = null;

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
    this.notify();

    return pending ? this.runExecution(pending) : undefined;
  }

  private captureExecution(): {
    command: CommandNode;
    path: string[];
    commandLine: string;
    argVals: string[];
  } | null {
    const path = this.stack.path();
    const command = this.registry.getCommand(path);
    if (!command) return null;

    // The command as typed (argument segments show their value), captured before
    // resetInput clears the stack.
    const commandLine = this.stack
      .toArray()
      .map((segment) =>
        segment.type === 'argument' ? (segment as ArgumentSegment).value ?? '' : segment.name,
      )
      .join(' ');

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

    return { command, path, commandLine, argVals };
  }

  /** Race a handler against the command timeout (web parity). 0 disables it. */
  private withTimeout<T>(promise: Promise<T>): Promise<T> {
    if (!this.commandTimeoutMs) return promise;
    let timer: ReturnType<typeof setTimeout>;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('Request timed out')), this.commandTimeoutMs);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
  }

  private async runExecution(pending: {
    command: CommandNode;
    path: string[];
    commandLine: string;
    argVals: string[];
  }): Promise<void> {
    // Append a pending entry immediately so the output pane shows a spinner next
    // to the command echo while the (possibly async) handler runs.
    const item: CliOutputItem = {
      id: this.nextId++,
      path: pending.path,
      commandLine: pending.commandLine,
      timestamp: Date.now(),
      status: CommandStatus.Pending,
      result: new PendingCommandResult(),
    };
    this.outputs.push(item);
    this.notify();

    try {
      const value = await this.withTimeout(pending.command.handler(pending.argVals));
      if (!(value instanceof CommandResult)) {
        throw new Error(
          `The ${pending.path.join('.')} command returned an invalid result type. ` +
            'Commands must return a CommandResult (e.g. text(), json(), bool()).',
        );
      }
      value.markSuccess();
      item.result = value;
      item.status = CommandStatus.Success;
    } catch (error) {
      item.result = new ErrorCommandResult(error instanceof Error ? error.message : 'Unknown error');
      item.status = CommandStatus.Failure;
    }

    this.notify();
    this.onExecute?.(item);
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
        this.notify();
        return;
      }
    }

    const entry = this.historyEntries[this.historyPosition];
    this.stack.clear();
    this.stack.pushAll(entry.map((segment) => segment));
    this.currentInput = '';
    this.syncInputState();
    this.notify();
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
