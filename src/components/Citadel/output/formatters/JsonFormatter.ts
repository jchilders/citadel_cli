import { BaseFormatter } from './BaseFormatter';
import { BaseCommandResult } from '../../types/command-results';

/**
 * JSON output formatter
 */
export class JsonFormatter extends BaseFormatter {
  constructor() {
    super('json');
  }

  format(result: BaseCommandResult): string {
    return JSON.stringify(result.value, null, 2);
  }
}
