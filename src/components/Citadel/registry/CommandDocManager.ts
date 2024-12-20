import { CommandDoc, ICommandDocManager } from '../types/command-docs';

/**
 * Manages command documentation and discovery
 */
export class CommandDocManager implements ICommandDocManager {
  private docs: Map<string, CommandDoc>;
  private addedDates: Map<string, Date>;

  constructor() {
    this.docs = new Map();
    this.addedDates = new Map();
  }

  addDocs(commandId: string, docs: CommandDoc): void {
    this.docs.set(commandId, docs);
    if (!this.addedDates.has(commandId)) {
      this.addedDates.set(commandId, new Date());
    }
  }

  getDocs(commandId: string): CommandDoc | undefined {
    return this.docs.get(commandId);
  }

  searchDocs(query: string): CommandDoc[] {
    const normalizedQuery = query.toLowerCase();
    const results: Array<[CommandDoc, number]> = [];

    for (const doc of this.docs.values()) {
      let score = 0;

      // Search in name and description
      if (doc.name.toLowerCase().includes(normalizedQuery)) {
        score += 3;
      }
      if (doc.description.toLowerCase().includes(normalizedQuery)) {
        score += 2;
      }
      if (doc.longDescription?.toLowerCase().includes(normalizedQuery)) {
        score += 1;
      }

      // Search in examples
      for (const example of doc.examples) {
        if (example.description.toLowerCase().includes(normalizedQuery)) {
          score += 1;
        }
        if (example.command.toLowerCase().includes(normalizedQuery)) {
          score += 1;
        }
      }

      // Search in arguments
      for (const arg of doc.arguments) {
        if (arg.name.toLowerCase().includes(normalizedQuery)) {
          score += 1;
        }
        if (arg.description.toLowerCase().includes(normalizedQuery)) {
          score += 1;
        }
      }

      if (score > 0) {
        results.push([doc, score]);
      }
    }

    // Sort by score descending
    return results
      .sort((a, b) => b[1] - a[1])
      .map(([doc]) => doc);
  }

  getDocsInCategory(category: string): CommandDoc[] {
    return Array.from(this.docs.values())
      .filter(doc => doc.category === category)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  getRecentCommands(limit = 10): CommandDoc[] {
    return Array.from(this.addedDates.entries())
      .sort((a, b) => b[1].getTime() - a[1].getTime())
      .slice(0, limit)
      .map(([id]) => this.docs.get(id)!)
      .filter(Boolean);
  }

  getDeprecatedCommands(): CommandDoc[] {
    return Array.from(this.docs.values())
      .filter(doc => doc.deprecated)
      .sort((a, b) => {
        // Sort by deprecation version
        const vA = this.versionToNumber(a.deprecated!);
        const vB = this.versionToNumber(b.deprecated!);
        return vB - vA;
      });
  }

  generateMarkdown(commandId: string): string {
    const doc = this.docs.get(commandId);
    if (!doc) return '';

    const lines: string[] = [];

    // Header
    lines.push(`# ${doc.name}`);
    lines.push('');
    lines.push(doc.description);
    lines.push('');

    // Long description
    if (doc.longDescription) {
      lines.push(doc.longDescription);
      lines.push('');
    }

    // Version info
    lines.push(`**Since:** ${doc.since}`);
    if (doc.deprecated) {
      lines.push(`**Deprecated:** ${doc.deprecated}`);
    }
    lines.push('');

    // Category
    if (doc.category) {
      lines.push(`**Category:** ${doc.category}`);
      lines.push('');
    }

    // Permissions
    if (doc.permissions?.length) {
      lines.push('## Permissions');
      lines.push('');
      for (const perm of doc.permissions) {
        lines.push(`- \`${perm}\``);
      }
      lines.push('');
    }

    // Arguments
    if (doc.arguments.length) {
      lines.push('## Arguments');
      lines.push('');
      for (const arg of doc.arguments) {
        lines.push(`### ${arg.name}`);
        lines.push('');
        lines.push(arg.description);
        lines.push('');
        lines.push(`- **Type:** ${arg.type}`);
        lines.push(`- **Required:** ${arg.required}`);
        if (arg.defaultValue !== undefined) {
          lines.push(`- **Default:** ${JSON.stringify(arg.defaultValue)}`);
        }
        lines.push('');
      }
    }

    // Return type
    lines.push('## Returns');
    lines.push('');
    lines.push(doc.returns.description);
    lines.push(`**Type:** ${doc.returns.type}`);
    lines.push('');

    // Examples
    if (doc.examples.length) {
      lines.push('## Examples');
      lines.push('');
      for (const example of doc.examples) {
        lines.push(`### ${example.description}`);
        lines.push('');
        lines.push('```');
        lines.push(`${example.command} ${example.args.join(' ')}`);
        if (example.output) {
          lines.push(example.output);
        }
        lines.push('```');
        lines.push('');
      }
    }

    // Rate limits
    if (doc.rateLimits) {
      lines.push('## Rate Limits');
      lines.push('');
      lines.push(
        `${doc.rateLimits.maxRequests} requests per ${doc.rateLimits.timeWindow}ms`
      );
      lines.push('');
    }

    // See also
    if (doc.seeAlso?.length) {
      lines.push('## See Also');
      lines.push('');
      for (const related of doc.seeAlso) {
        const relatedDoc = this.docs.get(related);
        if (relatedDoc) {
          lines.push(`- [${relatedDoc.name}](${related}): ${relatedDoc.description}`);
        }
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Convert version string to number for comparison
   * e.g., "1.2.3" -> 1002003
   */
  private versionToNumber(version: string): number {
    const parts = version.split('.').map(Number);
    return parts[0] * 1000000 + (parts[1] || 0) * 1000 + (parts[2] || 0);
  }
}
