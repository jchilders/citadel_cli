import { Command } from '../types/command-registry';
import { CommandCategory, CategoryCommand, ICategoryManager } from '../types/command-category';

/**
 * Manages command categories and provides category-based operations
 */
export class CategoryManager implements ICategoryManager {
  private readonly categories: Map<string, CommandCategory>;
  private readonly aliasIndex: Map<string, Command[]>;

  constructor() {
    this.categories = new Map();
    this.aliasIndex = new Map();
  }

  getRootCategories(): CommandCategory[] {
    return Array.from(this.categories.values())
      .filter(cat => cat.path.length === 1);
  }

  getCategory(path: string[]): CommandCategory | undefined {
    return this.categories.get(path.join('.'));
  }

  addCommand(command: CategoryCommand): void {
    // Get or create the category
    const categoryPath = command.category.split('.');
    let category = this.getCategory(categoryPath);
    
    if (!category) {
      category = this.createCategory({
        path: categoryPath,
        description: `Commands for ${categoryPath.join('.')}`
      });
    }

    // Add command to category
    category.commands.push(command);

    // Index aliases
    if (command.aliases) {
      for (const alias of command.aliases) {
        const commands = this.aliasIndex.get(alias) || [];
        commands.push(command);
        this.aliasIndex.set(alias, commands);
      }
    }
  }

  createCategory(params: { path: string[]; description: string; }): CommandCategory {
    const { path, description } = params;
    const name = path[path.length - 1];

    // Create parent categories if they don't exist
    if (path.length > 1) {
      const parentPath = path.slice(0, -1);
      let parent = this.getCategory(parentPath);
      
      if (!parent) {
        parent = this.createCategory({
          path: parentPath,
          description: `Parent category for ${parentPath.join('.')}`
        });
      }
    }

    // Create the category
    const category: CommandCategory = {
      name,
      description,
      commands: [],
      subcategories: [],
      path
    };

    // Add to parent's subcategories
    if (path.length > 1) {
      const parentPath = path.slice(0, -1);
      const parent = this.getCategory(parentPath);
      if (parent) {
        parent.subcategories.push(category);
      }
    }

    // Store in map
    this.categories.set(path.join('.'), category);
    return category;
  }

  getCategoryCommands(path: string[]): Command[] {
    const category = this.getCategory(path);
    if (!category) return [];

    // Get commands from this category and all subcategories
    const commands: Command[] = [...category.commands];
    const queue = [...category.subcategories];

    while (queue.length > 0) {
      const current = queue.shift()!;
      commands.push(...current.commands);
      queue.push(...current.subcategories);
    }

    return commands;
  }

  findByAlias(alias: string): Command[] {
    return this.aliasIndex.get(alias) || [];
  }

  getCategoryTree(): CommandCategory[] {
    return this.getRootCategories();
  }
}
