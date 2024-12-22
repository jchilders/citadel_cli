import {
  IOutputManager,
  IOutputStream,
  IOutputFormatter,
  OutputFormat,
  OutputOptions
} from '../types/command-output';
import { BaseCommandResult } from '../types/command-results';
import { OutputStream } from './OutputStream';
import { TextFormatter } from './formatters/TextFormatter';
import { JsonFormatter } from './formatters/JsonFormatter';
import { TableFormatter } from './formatters/TableFormatter';
import { MarkdownFormatter } from './formatters/MarkdownFormatter';
import { HtmlFormatter } from './formatters/HtmlFormatter';

/**
 * Default output manager implementation
 */
export class OutputManager implements IOutputManager {
  private outputStream: IOutputStream;
  private formatters = new Map<OutputFormat, IOutputFormatter>();

  constructor(outputStream?: IOutputStream, options?: OutputOptions) {
    this.outputStream = outputStream || new OutputStream();

    // Register default formatters
    this.registerFormatter(new TextFormatter());
    this.registerFormatter(new JsonFormatter());
    this.registerFormatter(new TableFormatter(options?.columns || []));
    this.registerFormatter(new MarkdownFormatter(options?.template));
    this.registerFormatter(new HtmlFormatter(options?.template));
  }

  getOutputStream(): IOutputStream {
    return this.outputStream;
  }

  getFormatter(format: OutputFormat): IOutputFormatter {
    const formatter = this.formatters.get(format);
    if (!formatter) {
      throw new Error(`No formatter registered for format: ${format}`);
    }
    return formatter;
  }

  registerFormatter(formatter: IOutputFormatter): void {
    this.formatters.set(formatter.getFormat(), formatter);
  }

  writeResult(result: BaseCommandResult, options?: OutputOptions): void {
    const format = options?.format || this.outputStream.getOptions().format || 'text';

    // Create new formatter if options provided
    let formatter: IOutputFormatter;
    if (options) {
      switch (format) {
        case 'table':
          formatter = new TableFormatter(options.columns || []);
          break;
        case 'markdown':
          formatter = new MarkdownFormatter(options.template);
          break;
        case 'html':
          formatter = new HtmlFormatter(options.template);
          break;
        default:
          formatter = this.getFormatter(format);
      }
    } else {
      formatter = this.getFormatter(format);
    }

    // Update output stream options
    if (options) {
      this.outputStream.setOptions(options);
    }

    // Format and write result
    const output = formatter.format(result);
    this.outputStream.writeLine(output);
  }
}
