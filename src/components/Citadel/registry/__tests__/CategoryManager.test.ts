import { describe, it, expect, beforeEach } from 'vitest';
import { CategoryManager } from '../CategoryManager';
import { CategoryCommand } from '../../types/command-category';
import { TextCommandResult } from '../../types/command-results';

describe('CategoryManager', () => {
  let manager: CategoryManager;

  beforeEach(() => {
    manager = new CategoryManager();
  });

  describe('category creation', () => {
    it('should create root categories', () => {
      const category = manager.createCategory({
        path: ['system'],
        description: 'System commands'
      });

      expect(category.name).toBe('system');
      expect(category.path).toEqual(['system']);
      expect(manager.getRootCategories()).toHaveLength(1);
    });

    it('should create nested categories', () => {
      manager.createCategory({
        path: ['system', 'network'],
        description: 'Network commands'
      });

      const root = manager.getCategory(['system']);
      expect(root).toBeDefined();
      expect(root!.subcategories).toHaveLength(1);
      expect(root!.subcategories[0].name).toBe('network');
    });
  });

  describe('command management', () => {
    const createCommand = (id: string, category: string): CategoryCommand => ({
      id,
      description: `Test command ${id}`,
      category,
      aliases: [`${id}_alias`],
      execute: async () => new TextCommandResult('test'),
      getName: () => id.split('.').pop()!
    });

    it('should add commands to categories', () => {
      const cmd = createCommand('system.test', 'system');
      manager.addCommand(cmd);

      const category = manager.getCategory(['system']);
      expect(category).toBeDefined();
      expect(category!.commands).toHaveLength(1);
      expect(category!.commands[0].id).toBe('system.test');
    });

    it('should create missing categories when adding commands', () => {
      const cmd = createCommand('system.network.ping', 'system.network');
      manager.addCommand(cmd);

      const root = manager.getCategory(['system']);
      const sub = manager.getCategory(['system', 'network']);
      
      expect(root).toBeDefined();
      expect(sub).toBeDefined();
      expect(sub!.commands).toHaveLength(1);
    });

    it('should find commands by alias', () => {
      const cmd = createCommand('system.test', 'system');
      manager.addCommand(cmd);

      const found = manager.findByAlias('system.test_alias');
      expect(found).toHaveLength(1);
      expect(found[0].id).toBe('system.test');
    });
  });

  describe('command retrieval', () => {
    beforeEach(() => {
      // Add some test commands
      const commands: CategoryCommand[] = [
        createCommand('system.test1', 'system'),
        createCommand('system.test2', 'system'),
        createCommand('system.network.ping', 'system.network'),
        createCommand('system.network.status', 'system.network')
      ];

      commands.forEach(cmd => manager.addCommand(cmd));
    });

    const createCommand = (id: string, category: string): CategoryCommand => ({
      id,
      description: `Test command ${id}`,
      category,
      execute: async () => new TextCommandResult('test'),
      getName: () => id.split('.').pop()!
    });

    it('should get all commands in a category', () => {
      const commands = manager.getCategoryCommands(['system']);
      expect(commands).toHaveLength(4); // includes subcategory commands
    });

    it('should get commands from specific subcategory', () => {
      const commands = manager.getCategoryCommands(['system', 'network']);
      expect(commands).toHaveLength(2);
    });

    it('should return empty array for unknown category', () => {
      const commands = manager.getCategoryCommands(['unknown']);
      expect(commands).toHaveLength(0);
    });
  });

  describe('category tree', () => {
    beforeEach(() => {
      manager.createCategory({
        path: ['system'],
        description: 'System commands'
      });
      manager.createCategory({
        path: ['system', 'network'],
        description: 'Network commands'
      });
      manager.createCategory({
        path: ['utils'],
        description: 'Utility commands'
      });
    });

    it('should get root categories', () => {
      const roots = manager.getRootCategories();
      expect(roots).toHaveLength(2);
      expect(roots.map(r => r.name)).toContain('system');
      expect(roots.map(r => r.name)).toContain('utils');
    });

    it('should maintain category hierarchy', () => {
      const tree = manager.getCategoryTree();
      const system = tree.find(c => c.name === 'system');
      
      expect(system).toBeDefined();
      expect(system!.subcategories).toHaveLength(1);
      expect(system!.subcategories[0].name).toBe('network');
    });
  });
});
