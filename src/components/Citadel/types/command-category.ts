import { Command } from './command-registry';

/**
 * Represents a category of related commands
 */
export interface CommandCategory {
  name: string;          // Category name (e.g., 'system', 'math')
  description: string;   // Category description
  commands: Command[];   // Commands in this category
  subcategories: CommandCategory[];  // Nested categories
  path: string[];       // Full path to this category (e.g., ['system', 'network'])
}

/**
 * Extended command interface with category support
 */
export interface CategoryCommand extends Command {
  aliases?: string[];   // Alternative names for the command
  category: string;     // Category path in dot notation
}

/**
 * Interface for managing command categories
 */
export interface ICategoryManager {
  /**
   * Get all root categories
   */
  getRootCategories(): CommandCategory[];

  /**
   * Get a category by its path
   */
  getCategory(path: string[]): CommandCategory | undefined;

  /**
   * Add a command to a category
   */
  addCommand(command: CategoryCommand): void;

  /**
   * Create a new category
   */
  createCategory(params: {
    path: string[];
    description: string;
  }): CommandCategory;

  /**
   * Get commands in a category (including subcategories)
   */
  getCategoryCommands(path: string[]): Command[];

  /**
   * Find commands by alias
   */
  findByAlias(alias: string): Command[];

  /**
   * Get the full category tree
   */
  getCategoryTree(): CommandCategory[];
}
