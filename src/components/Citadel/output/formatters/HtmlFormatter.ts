import { BaseFormatter } from './BaseFormatter';
import { BaseCommandResult } from '../../types/command-results';

/**
 * HTML output formatter
 */
export class HtmlFormatter extends BaseFormatter {
  constructor(private template?: string) {
    super('html');
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
      return this.escapeHtml(this.stringify(value));
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

    return this.escapeHtml(this.stringify(value));
  }

  private formatList(items: any[]): string {
    const listItems = items
      .map(item => `<li>${this.escapeHtml(this.stringify(item))}</li>`)
      .join('');
    return `<ul>${listItems}</ul>`;
  }

  private formatObject(obj: Record<string, any>): string {
    const rows = [];
    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        rows.push(`<h3>${this.escapeHtml(key)}</h3>`);
        rows.push(this.formatList(value));
      } else if (typeof value === 'object' && value !== null) {
        rows.push(`<h3>${this.escapeHtml(key)}</h3>`);
        rows.push(this.formatObject(value));
      } else {
        rows.push(
          `<p><strong>${this.escapeHtml(key)}</strong>: ${this.escapeHtml(
            this.stringify(value)
          )}</p>`
        );
      }
    }
    return rows.join('\n');
  }

  private escapeHtml(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
