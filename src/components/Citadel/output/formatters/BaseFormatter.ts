import { IOutputFormatter, OutputFormat } from '../../types/command-output';
import { BaseCommandResult } from '../../types/command-results';

/**
 * Base class for output formatters
 */
export abstract class BaseFormatter implements IOutputFormatter {
  constructor(protected format: OutputFormat) {}

  abstract format(result: BaseCommandResult): string;

  getFormat(): OutputFormat {
    return this.format;
  }

  protected stringify(value: any): string {
    if (typeof value === 'undefined') return '';
    if (value === null) return 'null';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value.toString();
    if (Array.isArray(value)) return value.map(v => this.stringify(v)).join(', ');
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }
}
