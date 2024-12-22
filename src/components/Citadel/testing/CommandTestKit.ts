import {
  Command
} from '../types/command-registry';
import {
  BaseCommandResult,
  TextCommandResult
} from '../types/command-results';
import {
  CommandTestKit as ICommandTestKit,
  MockCommand,
  ResultMatcher,
  TestContext,
  CommandMetrics
} from './command-test-kit';
import { MockCommandRegistry } from './MockCommandRegistry';

/**
 * Implementation of a mock command
 */
class MockCommandImpl implements MockCommand {
  private callHistory: { args: string[]; context?: TestContext }[] = [];
  private mockFn?: (args: string[]) => Promise<BaseCommandResult>;
  private mockResult?: BaseCommandResult;
  private mockError?: Error;

  constructor(
    public readonly id: string,
    public readonly description: string = 'Mock command'
  ) {}

  async execute(args: string[], context?: TestContext): Promise<BaseCommandResult> {
    this.callHistory.push({ args, context });

    if (this.mockError) {
      throw this.mockError;
    }

    if (this.mockFn) {
      return this.mockFn(args);
    }

    return this.mockResult || new TextCommandResult('Mock result');
  }

  getName(): string {
    return this.id;
  }

  mockImplementation(fn: (args: string[]) => Promise<BaseCommandResult>): void {
    this.mockFn = fn;
    this.mockResult = undefined;
    this.mockError = undefined;
  }

  mockReturnValue(result: BaseCommandResult): void {
    this.mockResult = result;
    this.mockFn = undefined;
    this.mockError = undefined;
  }

  mockRejectedValue(error: Error): void {
    this.mockError = error;
    this.mockFn = undefined;
    this.mockResult = undefined;
  }

  getCallHistory() {
    return [...this.callHistory];
  }

  clearCallHistory(): void {
    this.callHistory = [];
  }
}

/**
 * Implementation of result matcher
 */
class ResultMatcherImpl implements ResultMatcher {
  constructor(private readonly expected: any) {}

  matches(actual: BaseCommandResult): boolean {
    if (this.expected instanceof BaseCommandResult) {
      // Compare string representations for now
      return this.expected.toString() === actual.toString();
    }

    if (actual instanceof TextCommandResult) {
      return actual.text === this.expected;
    }

    return JSON.stringify(actual) === JSON.stringify(this.expected);
  }

  describe(): string {
    if (this.expected instanceof BaseCommandResult) {
      return `Result matching ${this.expected.toString()}`;
    }
    return `Result equal to ${JSON.stringify(this.expected)}`;
  }
}

/**
 * Implementation of command test kit
 */
export class CommandTestKit implements ICommandTestKit {
  private metrics: Map<string, CommandMetrics> = new Map();
  private registry: MockCommandRegistry;

  constructor(registry?: MockCommandRegistry) {
    this.registry = registry || new MockCommandRegistry();
  }

  mockCommand(id: string, description?: string): MockCommand {
    const command = new MockCommandImpl(id, description);
    this.registry.register(command);
    this.metrics.set(id, {
      executionTime: 0,
      memoryUsage: 0,
      callCount: 0
    });
    return command;
  }

  createTestContext(overrides: Partial<TestContext> = {}): TestContext {
    return {
      environment: {},
      startTime: new Date(),
      metadata: {},
      mocks: {},
      config: {},
      ...overrides
    };
  }

  async executeCommand(
    command: Command,
    args: string[],
    context?: Partial<TestContext>
  ): Promise<BaseCommandResult> {
    const startTime = process.hrtime();
    const startMemory = process.memoryUsage().heapUsed;

    const testContext = this.createTestContext(context);
    const result = await command.execute(args, testContext);

    // Update metrics
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const executionTime = seconds * 1000 + nanoseconds / 1000000;
    const memoryUsage = process.memoryUsage().heapUsed - startMemory;

    const metrics = this.metrics.get(command.getName()) || {
      executionTime: 0,
      memoryUsage: 0,
      callCount: 0
    };

    metrics.executionTime += executionTime;
    metrics.memoryUsage += memoryUsage;
    metrics.callCount += 1;

    this.metrics.set(command.getName(), metrics);

    return result;
  }

  resultMatches(expected: any): ResultMatcher {
    return new ResultMatcherImpl(expected);
  }

  assertCommandOutput(result: BaseCommandResult, expected: any): void {
    const matcher = this.resultMatches(expected);
    if (!matcher.matches(result)) {
      throw new Error(
        `Expected ${matcher.describe()}, but got ${result.toString()}`
      );
    }
  }

  getMetrics(commandId: string): CommandMetrics {
    const metrics = this.metrics.get(commandId);
    if (!metrics) {
      throw new Error(`No metrics found for command: ${commandId}`);
    }
    return { ...metrics };
  }

  reset(): void {
    // Clear metrics
    this.metrics.clear();

    // Get all commands before clearing registry
    const commands = this.registry.getAllCommands();

    // Clear registry
    this.registry.clear();

    // Clear all mock call histories
    commands.forEach(command => {
      if (command instanceof MockCommandImpl) {
        command.clearCallHistory();
      }
    });
  }
}
