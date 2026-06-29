import { ArgumentSegment, CommandRegistry, CommandSegment } from './command-registry';
import {
  BooleanCommandResult,
  CommandResult,
  ErrorCommandResult,
  ImageCommandResult,
  JsonCommandResult,
  StreamCommandResult,
  TextCommandResult,
  type StreamOptions,
  type StreamProducer,
} from './results';

export interface CommandExecutionContext<ArgName extends string = string> {
  rawArgs: string[];
  namedArgs: Record<ArgName, string | undefined>;
  commandPath: string;
}

export type DslCommandHandler<ArgName extends string = string> = (
  context: CommandExecutionContext<ArgName>
) => CommandResult | Promise<CommandResult>;

export interface CommandDefinition<ArgName extends string = string> {
  path: string;
  description: string;
  details?: string;
  segments: CommandSegment[];
  handler: DslCommandHandler<ArgName>;
}

export interface OptionalArgumentOptions {
  /** Value the handler receives when the argument is omitted. */
  default?: string;
}

export interface ArgumentBuilderApi {
  describe(description: string): this;
  /**
   * Marks the argument as optional: the command can be executed without it.
   * When omitted, the handler receives `options.default` if provided, or
   * `undefined` otherwise. Optional arguments must come after all required
   * ones.
   */
  optional(options?: OptionalArgumentOptions): this;
}

export interface CommandBuilderApi<ArgName extends string = never> {
  describe(description: string): this;
  details(details: string): this;
  arg<Name extends string>(
    name: Name,
    configure?: (argument: ArgumentBuilderApi) => ArgumentBuilderApi | void
  ): CommandBuilderApi<ArgName | Name>;
  handle(handler: DslCommandHandler<ArgName>): CommandDefinition<ArgName>;
}

interface MutableCommandDefinition {
  path: string;
  description: string;
  details?: string;
  segments: CommandSegment[];
}

class ArgumentBuilder implements ArgumentBuilderApi {
  private _description?: string;
  private _optional = false;
  private _defaultValue?: string;

  describe(description: string): this {
    this._description = description;
    return this;
  }

  optional(options?: OptionalArgumentOptions): this {
    this._optional = true;
    this._defaultValue = options?.default;
    return this;
  }

  get description(): string | undefined {
    return this._description;
  }

  get isOptional(): boolean {
    return this._optional;
  }

  get defaultValue(): string | undefined {
    return this._defaultValue;
  }
}

class CommandBuilder<ArgName extends string = never> implements CommandBuilderApi<ArgName> {
  private readonly state: MutableCommandDefinition;

  constructor(path: string) {
    this.state = {
      path,
      description: '',
      segments: parsePathToWordSegments(path),
    };
  }

  describe(description: string): this {
    this.state.description = description;
    return this;
  }

  details(details: string): this {
    this.state.details = details;
    return this;
  }

  arg<Name extends string>(
    name: Name,
    configure?: (argument: ArgumentBuilderApi) => ArgumentBuilderApi | void
  ): CommandBuilderApi<ArgName | Name> {
    const argumentBuilder = new ArgumentBuilder();
    configure?.(argumentBuilder);

    const lastSegment = this.state.segments[this.state.segments.length - 1];
    if (
      !argumentBuilder.isOptional &&
      lastSegment?.type === 'argument' &&
      (lastSegment as ArgumentSegment).optional
    ) {
      throw new Error(
        `Invalid command "${this.state.path}": required argument "${name}" cannot follow an optional argument.`
      );
    }

    this.state.segments.push({
      type: 'argument',
      name,
      description: argumentBuilder.description,
      optional: argumentBuilder.isOptional || undefined,
      defaultValue: argumentBuilder.defaultValue,
    });

    return this as unknown as CommandBuilder<ArgName | Name>;
  }

  handle(handler: DslCommandHandler<ArgName>): CommandDefinition<ArgName> {
    return {
      path: this.state.path,
      description: this.state.description,
      details: this.state.details,
      segments: [...this.state.segments],
      handler,
    };
  }
}

function parsePathToWordSegments(path: string): CommandSegment[] {
  const cleanedPath = path.trim();
  if (!cleanedPath) {
    throw new Error('Command path cannot be empty');
  }

  const pathParts = cleanedPath.split('.');
  if (pathParts.some((part) => part.trim() === '')) {
    throw new Error(`Invalid command path "${path}". Empty segments are not allowed.`);
  }

  if (pathParts.some((part) => part.includes(' '))) {
    throw new Error(
      `Invalid command path "${path}". Use dot-delimited words (e.g. "user.show").`
    );
  }

  return pathParts.map((segment) => ({
    type: 'word' as const,
    name: segment,
  }));
}

function getArgumentNames(segments: CommandSegment[]): string[] {
  return segments.flatMap((segment) => (segment.type === 'argument' ? [segment.name] : []));
}

function toRegistryHandler<ArgName extends string>(
  definition: CommandDefinition<ArgName>
): (args: string[]) => Promise<CommandResult> {
  const argumentNames = getArgumentNames(definition.segments);

  return async (rawArgs: string[]) => {
    const namedArgs = argumentNames.reduce((acc, argName, index) => {
      acc[argName as ArgName] = rawArgs[index];
      return acc;
    }, {} as Record<ArgName, string | undefined>);

    return Promise.resolve(
      definition.handler({
        rawArgs,
        namedArgs,
        commandPath: definition.path,
      })
    );
  };
}

export function command(path: string): CommandBuilderApi {
  return new CommandBuilder(path);
}

export function registerCommand(
  registry: CommandRegistry,
  definition: CommandDefinition
): void {
  registry.addCommand(
    definition.segments,
    definition.description,
    toRegistryHandler(definition)
  );
}

export function registerCommands(
  registry: CommandRegistry,
  definitions: CommandDefinition[]
): CommandRegistry {
  definitions.forEach((definition) => registerCommand(registry, definition));
  return registry;
}

export function createCommandRegistry(definitions: CommandDefinition[]): CommandRegistry {
  const registry = new CommandRegistry();
  return registerCommands(registry, definitions);
}

export function text(value: string): TextCommandResult {
  return new TextCommandResult(value);
}

export function bool(value: boolean, trueText = 'true', falseText = 'false'): BooleanCommandResult {
  return new BooleanCommandResult(value, trueText, falseText);
}

export function json(value: unknown): JsonCommandResult {
  return new JsonCommandResult(value);
}

export function image(url: string, altText = ''): ImageCommandResult {
  return new ImageCommandResult(url, altText);
}

export function error(value: string): ErrorCommandResult {
  return new ErrorCommandResult(value);
}

/**
 * A live, append-only text stream (`tail -f`). The producer receives a handle to
 * `push` lines over time and `close`/`fail` when done, and may return a cleanup
 * function (e.g. `clearInterval`) run when the stream is cancelled or closed:
 *
 * ```ts
 * command('logs.tail').describe('Stream logs').handle(() =>
 *   stream((s) => {
 *     const id = setInterval(() => s.push(nextLogLine()), 600);
 *     return () => clearInterval(id);
 *   })
 * )
 * ```
 */
export function stream(producer: StreamProducer, options?: StreamOptions): StreamCommandResult {
  return new StreamCommandResult(producer, options);
}
