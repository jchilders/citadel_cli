import { BaseTypedCommand, JsonTypedCommand } from '../types/typed-command';
import { JsonCommandResult } from '../types/command-results';

/**
 * Arguments for the calculator command
 */
interface CalculatorArgs {
  numbers: number[];
  operation: 'add' | 'multiply' | 'subtract' | 'divide';
}

/**
 * Result of the calculator command
 */
interface CalculatorResult {
  operation: string;
  numbers: number[];
  result: number;
}

/**
 * A type-safe calculator command
 */
export class TypedCalculatorCommand extends BaseTypedCommand<CalculatorArgs, JsonCommandResult<CalculatorResult>> {
  constructor() {
    super(
      'math.calculate',
      'Perform arithmetic operations',
      {
        name: 'expression',
        description: 'Operation followed by numbers (e.g., add 1 2 3)',
        schema: {
          type: 'object',
          properties: {
            numbers: {
              type: 'array',
              items: { type: 'number' }
            },
            operation: {
              type: 'string',
              enum: ['add', 'multiply', 'subtract', 'divide']
            }
          },
          required: ['numbers', 'operation']
        }
      }
    );
  }

  async executeTyped(args: CalculatorArgs): Promise<JsonCommandResult<CalculatorResult>> {
    const { numbers, operation } = args;
    let result: number;

    switch (operation) {
      case 'add':
        result = numbers.reduce((a, b) => a + b, 0);
        break;
      case 'multiply':
        result = numbers.reduce((a, b) => a * b, 1);
        break;
      case 'subtract':
        result = numbers.reduce((a, b) => a - b);
        break;
      case 'divide':
        result = numbers.reduce((a, b) => {
          if (b === 0) throw new Error('Division by zero');
          return a / b;
        });
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    return new JsonCommandResult({
      operation,
      numbers,
      result
    });
  }

  validateArgs(args: CalculatorArgs): boolean {
    return (
      Array.isArray(args.numbers) &&
      args.numbers.length > 0 &&
      args.numbers.every(n => typeof n === 'number') &&
      ['add', 'multiply', 'subtract', 'divide'].includes(args.operation)
    );
  }

  parseArgs(args: string[]): CalculatorArgs {
    if (args.length < 2) {
      throw new Error('Expected operation and at least one number');
    }

    const [operation, ...numberStrings] = args;
    const numbers = numberStrings.map(n => {
      const parsed = Number(n);
      if (isNaN(parsed)) {
        throw new Error(`Invalid number: ${n}`);
      }
      return parsed;
    });

    if (!['add', 'multiply', 'subtract', 'divide'].includes(operation)) {
      throw new Error(`Invalid operation: ${operation}`);
    }

    return {
      numbers,
      operation: operation as CalculatorArgs['operation']
    };
  }
}

// Example usage:
// const calc = new TypedCalculatorCommand();
// await calc.execute(['add', '1', '2', '3']); // { operation: 'add', numbers: [1, 2, 3], result: 6 }
// await calc.executeTyped({ operation: 'multiply', numbers: [2, 3, 4] }); // { operation: 'multiply', numbers: [2, 3, 4], result: 24 }
