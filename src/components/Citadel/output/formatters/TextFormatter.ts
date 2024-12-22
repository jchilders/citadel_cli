import { BaseFormatter } from './BaseFormatter';
import { BaseCommandResult } from '../../types/command-results';

/**
 * Text output formatter
 */
export class TextFormatter extends BaseFormatter {
  constructor() {
    super('text');
  }

  format(result: BaseCommandResult): string {
    return this.stringify(result.value);
  }
}
