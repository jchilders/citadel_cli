import { BaseFormatter } from './BaseFormatter';
import { BaseCommandResult } from '../../types/command-results';
import { TableColumn } from '../../types/command-output';

/**
 * Table output formatter
 */
export class TableFormatter extends BaseFormatter {
  constructor(private columns: TableColumn[]) {
    super('table');
  }

  format(result: BaseCommandResult): string {
    const data = Array.isArray(result.value) ? result.value : [result.value];
    if (data.length === 0) return '';

    // Calculate column widths
    const widths = this.columns.map(col => {
      const headerWidth = col.header.length;
      const maxDataWidth = Math.max(
        ...data.map(row => this.stringify(row[col.field]).length)
      );
      return col.width || Math.max(headerWidth, maxDataWidth);
    });

    // Build header
    const header = this.columns.map((col, i) => {
      const text = col.header.padEnd(widths[i]);
      return text;
    }).join(' | ');

    // Build separator
    const separator = widths.map(w => '-'.repeat(w)).join('-|-');

    // Build rows
    const rows = data.map(row => {
      return this.columns.map((col, i) => {
        const value = this.formatCell(row[col.field], col);
        return this.alignText(value, widths[i], col.align);
      }).join(' | ');
    });

    // Combine all parts
    return [header, separator, ...rows].join('\n');
  }

  private formatCell(value: any, column: TableColumn): string {
    if (column.format) {
      return this.stringify(column.format(value));
    }
    return this.stringify(value);
  }

  private alignText(text: string, width: number, align?: 'left' | 'center' | 'right'): string {
    const spaces = width - text.length;
    if (spaces <= 0) return text;

    switch (align) {
      case 'right':
        return ' '.repeat(spaces) + text;
      case 'center':
        const left = Math.floor(spaces / 2);
        const right = spaces - left;
        return ' '.repeat(left) + text + ' '.repeat(right);
      default: // left
        return text + ' '.repeat(spaces);
    }
  }
}
