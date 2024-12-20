/**
 * Example of command usage
 */
export interface CommandExample {
  description: string;
  command: string;
  args: string[];
  output?: string;
}

/**
 * Documentation for a command argument
 */
export interface ArgumentDoc {
  name: string;
  description: string;
  type: string;
  required: boolean;
  defaultValue?: any;
  schema?: unknown; // JSON Schema for validation
}

/**
 * Return type documentation
 */
export interface ReturnDoc {
  type: string;
  description: string;
  schema?: unknown; // JSON Schema for validation
}

/**
 * Complete command documentation
 */
export interface CommandDoc {
  name: string;
  description: string;
  longDescription?: string;
  examples: CommandExample[];
  arguments: ArgumentDoc[];
  returns: ReturnDoc;
  since: string;        // Version when command was added
  deprecated?: string;  // Version when command was deprecated
  category?: string;    // Category path in dot notation
  aliases?: string[];   // Alternative command names
  permissions?: string[]; // Required permissions
  rateLimits?: {
    maxRequests: number;
    timeWindow: number;
  };
  timeout?: number;     // Execution timeout in ms
  seeAlso?: string[];  // Related commands
}

/**
 * Interface for managing command documentation
 */
export interface ICommandDocManager {
  /**
   * Add or update documentation for a command
   */
  addDocs(commandId: string, docs: CommandDoc): void;

  /**
   * Get documentation for a command
   */
  getDocs(commandId: string): CommandDoc | undefined;

  /**
   * Search command documentation
   */
  searchDocs(query: string): CommandDoc[];

  /**
   * Get all commands in a category
   */
  getDocsInCategory(category: string): CommandDoc[];

  /**
   * Get recently added commands
   */
  getRecentCommands(limit?: number): CommandDoc[];

  /**
   * Get deprecated commands
   */
  getDeprecatedCommands(): CommandDoc[];

  /**
   * Generate markdown documentation
   */
  generateMarkdown(commandId: string): string;
}
