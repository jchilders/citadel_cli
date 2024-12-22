import { Command } from '../types/command-registry';
import { BaseCommandResult } from '../types/command-results';
import { CommandContext } from '../types/command-state';

/**
 * Mock command for testing
 */
export interface MockCommand extends Command {
  /**
   * Mock implementation
   */
  mockImplementation(fn: (args: string[]) => Promise<BaseCommandResult>): void;

  /**
   * Mock return value
   */
  mockReturnValue(result: BaseCommandResult): void;

  /**
   * Mock rejection
   */
  mockRejectedValue(error: Error): void;

  /**
   * Get call history
   */
  getCallHistory(): { args: string[]; context?: CommandContext }[];

  /**
   * Clear call history
   */
  clearCallHistory(): void;
}

/**
 * Result matcher for assertions
 */
export interface ResultMatcher {
  /**
   * Check if result matches expected value
   */
  matches(actual: BaseCommandResult): boolean;

  /**
   * Get description of expected result
   */
  describe(): string;
}

/**
 * Performance metrics for command execution
 */
export interface CommandMetrics {
  executionTime: number;
  memoryUsage: number;
  callCount: number;
}

/**
 * Test context for command execution
 */
export interface TestContext extends CommandContext {
  /**
   * Mock data for testing
   */
  mocks: {
    [key: string]: any;
  };

  /**
   * Test-specific configuration
   */
  config: {
    timeout?: number;
    retries?: number;
  };
}

/**
 * Interface for command testing utilities
 */
export interface CommandTestKit {
  /**
   * Create a mock command
   */
  mockCommand(id: string, description?: string): MockCommand;

  /**
   * Create a test context
   */
  createTestContext(overrides?: Partial<TestContext>): TestContext;

  /**
   * Execute a command in test environment
   */
  executeCommand(
    command: Command,
    args: string[],
    context?: Partial<TestContext>
  ): Promise<BaseCommandResult>;

  /**
   * Create a result matcher
   */
  resultMatches(expected: any): ResultMatcher;

  /**
   * Assert command output
   */
  assertCommandOutput(
    result: BaseCommandResult,
    expected: any
  ): void;

  /**
   * Get command performance metrics
   */
  getMetrics(commandId: string): CommandMetrics;

  /**
   * Reset all mocks and metrics
   */
  reset(): void;
}
