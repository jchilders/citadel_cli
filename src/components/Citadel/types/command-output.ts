import { BaseCommandResult } from './command-results';

/**
 * Output format options
 */
export type OutputFormat = 'text' | 'json' | 'table' | 'markdown' | 'html';

/**
 * Base interface for output formatters
 */
export interface IOutputFormatter {
  /**
   * Format command result for output
   */
  format(result: BaseCommandResult): string;

  /**
   * Get the output format
   */
  getFormat(): OutputFormat;
}

/**
 * Output color options
 */
export interface ColorOptions {
  /**
   * Enable/disable colors
   */
  enabled: boolean;

  /**
   * Theme colors
   */
  theme?: {
    success: string;
    error: string;
    warning: string;
    info: string;
    highlight: string;
  };
}

/**
 * Output style options
 */
export interface StyleOptions {
  /**
   * Indentation spaces
   */
  indent?: number;

  /**
   * Maximum width
   */
  maxWidth?: number;

  /**
   * Truncate long lines
   */
  truncate?: boolean;

  /**
   * Word wrap
   */
  wordWrap?: boolean;
}

/**
 * Table column definition
 */
export interface TableColumn {
  /**
   * Column header
   */
  header: string;

  /**
   * Field to display
   */
  field: string;

  /**
   * Column width
   */
  width?: number;

  /**
   * Text alignment
   */
  align?: 'left' | 'center' | 'right';

  /**
   * Format function
   */
  format?: (value: any) => string;
}

/**
 * Output options
 */
export interface OutputOptions {
  /**
   * Output format
   */
  format?: OutputFormat;

  /**
   * Color options
   */
  color?: ColorOptions;

  /**
   * Style options
   */
  style?: StyleOptions;

  /**
   * Table columns (for table format)
   */
  columns?: TableColumn[];

  /**
   * Custom template (for markdown/html)
   */
  template?: string;
}

/**
 * Output stream interface
 */
export interface IOutputStream {
  /**
   * Write output
   */
  write(output: string): void;

  /**
   * Write line
   */
  writeLine(output: string): void;

  /**
   * Clear output
   */
  clear(): void;

  /**
   * Get output options
   */
  getOptions(): OutputOptions;

  /**
   * Set output options
   */
  setOptions(options: OutputOptions): void;
}

/**
 * Output manager interface
 */
export interface IOutputManager {
  /**
   * Get output stream
   */
  getOutputStream(): IOutputStream;

  /**
   * Get formatter for format
   */
  getFormatter(format: OutputFormat): IOutputFormatter;

  /**
   * Register custom formatter
   */
  registerFormatter(formatter: IOutputFormatter): void;

  /**
   * Format and write result
   */
  writeResult(result: BaseCommandResult, options?: OutputOptions): void;
}
