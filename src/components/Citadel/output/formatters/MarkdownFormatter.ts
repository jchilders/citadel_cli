import { BaseFormatter } from './BaseFormatter';
import { BaseCommandResult } from '../../types/command-results';

/**
 * Markdown output formatter
 */
export class MarkdownFormatter extends BaseFormatter {
  constructor(private template?: string) {
    super('markdown');
  }

  format(result: BaseCommandResult): string {
    if (this.template) {
      return this.formatTemplate(result);
    }
    return this.formatDefault(result);
  }

  private formatTemplate(result: BaseCommandResult): string {
    return this.template!.replace(/\{\{(.*?)\}\}/g, (_, key) => {
      const value = key.split('.').reduce((obj: any, k: string) => {
        return obj?.[k.trim()];
      }, result.value);
      return this.stringify(value);
    });
  }

  private formatDefault(result: BaseCommandResult): string {
    const value = result.value;

    if (Array.isArray(value)) {
      return this.formatList(value);
    }

    if (typeof value === 'object' && value !== null) {
      return this.formatObject(value);
    }

    return this.stringify(value);
  }

  private formatList(items: any[]): string {
    return items.map(item => `- ${this.stringify(item)}`).join('\n');
  }

  private formatObject(obj: Record<string, any>): string {
    const lines = [];
    
    if (obj.title) {
      lines.push(`# ${obj.title}`);
    }

    if (obj.description) {
      lines.push('');
      lines.push(obj.description);
    }

    if (obj.items) {
      if (lines.length > 0) lines.push('');
      lines.push(this.formatList(obj.items));
    }

    if (lines.length === 0) {
      // Default object formatting
      for (const [key, value] of Object.entries(obj)) {
        if (Array.isArray(value)) {
          lines.push(`### ${key}`);
          lines.push(this.formatList(value));
        } else {
          lines.push(`**${key}**: ${this.stringify(value)}`);
        }
      }
    }

    return lines.join('\n');
  }
}
