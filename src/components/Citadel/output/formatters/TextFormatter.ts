import { BaseFormatter } from './BaseFormatter';
import { BaseCommandResult } from '../../types/command-results';
import { OutputOptions } from '../../types/command-output';

/**
 * Text output formatter
 */
export class TextFormatter extends BaseFormatter {
  constructor(private options: OutputOptions = {}) {
    super('text');
  }

  format(result: BaseCommandResult): string {
    let text = this.stringify(result.value).trim();

    if (this.options.style?.maxWidth) {
      const maxWidth = this.options.style.maxWidth;
      if (text.length > maxWidth) {
        if (this.options.style?.truncate) {
          text = text.slice(0, maxWidth - 4) + ' ...';
        } else {
          // Word wrap
          const words = text.split(' ');
          const lines = [];
          let currentLine = '';

          for (const word of words) {
            if (currentLine.length + word.length + 1 <= maxWidth) {
              currentLine += (currentLine ? ' ' : '') + word;
            } else {
              lines.push(currentLine);
              currentLine = word;
            }
          }

          if (currentLine) {
            lines.push(currentLine);
          }

          text = lines.join('\n');
        }
      }
    }

    if (this.options.style?.indent) {
      const indent = ' '.repeat(this.options.style.indent);
      text = text.split('\n').map(line => indent + line).join('\n');
    }

    return text;
  }
}
