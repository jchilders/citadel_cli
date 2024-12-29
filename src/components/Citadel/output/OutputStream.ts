import { IOutputStream, OutputOptions, OutputFormat } from '../types/command-output';

/**
 * Default output stream implementation
 */
export class OutputStream implements IOutputStream {
  private options: OutputOptions = {
    format: 'text' as OutputFormat,
    color: {
      enabled: true,
      theme: {
        success: 'green',
        error: 'red',
        warning: 'yellow',
        info: 'blue',
        highlight: 'cyan',
        verbose: 'magenta',
        debug: 'gray'
      }
    },
    style: {
      indent: 2,
      maxWidth: 80,
      wordWrap: true
    }
  };

  constructor(private writeFunc: (output: string) => void = console.log) {}

  write(output: string): void {
    this.writeFunc(this.applyStyle(output));
  }

  writeLine(output: string): void {
    this.writeFunc(this.applyStyle(output) + '\n');
  }

  clear(): void {
    // Implementation depends on the environment
    console.clear();
  }

  getOptions(): OutputOptions {
    return { ...this.options };
  }

  setOptions(options: OutputOptions): void {
    this.options = {
      ...this.options,
      ...options,
      color: { ...this.options.color, ...options.color },
      style: { ...this.options.style, ...options.style }
    };
  }

  private applyStyle(output: string): string {
    let result = output;

    const { style } = this.options;
    if (!style) return result;

    // Apply indentation
    if (style.indent) {
      const indent = ' '.repeat(style.indent);
      result = result.split('\n').map(line => indent + line).join('\n');
    }

    // Apply word wrap
    if (style.wordWrap && style.maxWidth) {
      result = this.wordWrap(result, style.maxWidth);
    }

    // Apply truncation
    if (style.truncate && style.maxWidth) {
      result = this.truncate(result, style.maxWidth);
    }

    return result;
  }

  private wordWrap(text: string, width: number): string {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if (currentLine.length + word.length + 1 <= width) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.join('\n');
  }

  private truncate(text: string, width: number): string {
    if (text.length <= width) return text;
    return text.slice(0, width - 3) + '...';
  }
}

export interface ColorTheme {
  success: string;
  error: string;
  warning: string;
  info: string;
  highlight: string;
  verbose: string;
  debug: string;
}

export interface ColorOptions {
  enabled: boolean;
  theme: ColorTheme;
}

export interface StyleOptions {
  indent?: number;
  maxWidth?: number;
  wordWrap?: boolean;
  truncate?: boolean;
}

export interface StreamOptions {
  format: string;
  color: ColorOptions;
  style: StyleOptions;
}
