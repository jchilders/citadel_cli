/**
 * Base class for command execution results
 */
export abstract class BaseCommandResult {
  constructor(public readonly type: string) {}
}

/**
 * Result containing text output
 */
export class TextCommandResult extends BaseCommandResult {
  constructor(public readonly text: string) {
    super('text');
  }
}

/**
 * Result containing JSON data
 */
export class JsonCommandResult<T = any> extends BaseCommandResult {
  constructor(public readonly data: T) {
    super('json');
  }
}
