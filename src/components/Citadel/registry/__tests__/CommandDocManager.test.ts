import { describe, it, expect, beforeEach } from 'vitest';
import { CommandDocManager } from '../CommandDocManager';
import { CommandDoc } from '../../types/command-docs';

describe('CommandDocManager', () => {
  let manager: CommandDocManager;

  const createDoc = (overrides: Partial<CommandDoc> = {}): CommandDoc => ({
    name: 'test',
    description: 'Test command',
    examples: [],
    arguments: [],
    returns: {
      type: 'void',
      description: 'No return value'
    },
    since: '1.0.0',
    ...overrides
  });

  beforeEach(() => {
    manager = new CommandDocManager();
  });

  describe('basic operations', () => {
    it('should add and retrieve docs', () => {
      const doc = createDoc();
      manager.addDocs('test.command', doc);
      expect(manager.getDocs('test.command')).toBe(doc);
    });

    it('should update existing docs', () => {
      const doc1 = createDoc({ description: 'Original' });
      const doc2 = createDoc({ description: 'Updated' });

      manager.addDocs('test.command', doc1);
      manager.addDocs('test.command', doc2);

      expect(manager.getDocs('test.command')).toBe(doc2);
    });
  });

  describe('search', () => {
    beforeEach(() => {
      manager.addDocs('test.echo', createDoc({
        name: 'echo',
        description: 'Echo a message',
        examples: [{
          description: 'Basic echo example',
          command: 'test.echo',
          args: ['hello']
        }],
        arguments: [{
          name: 'message',
          description: 'Message to echo',
          type: 'string',
          required: true
        }]
      }));

      manager.addDocs('math.add', createDoc({
        name: 'add',
        description: 'Add numbers together',
        category: 'math'
      }));
    });

    it('should find commands by name', () => {
      const results = manager.searchDocs('echo');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('echo');
    });

    it('should find commands by description', () => {
      const results = manager.searchDocs('message');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('echo');
    });

    it('should find commands by example', () => {
      const results = manager.searchDocs('basic echo');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('echo');
    });

    it('should find commands by argument', () => {
      const results = manager.searchDocs('message');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('echo');
    });

    it('should be case insensitive', () => {
      const results = manager.searchDocs('ECHO');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('echo');
    });
  });

  describe('category operations', () => {
    beforeEach(() => {
      manager.addDocs('math.add', createDoc({
        name: 'add',
        category: 'math'
      }));
      manager.addDocs('math.subtract', createDoc({
        name: 'subtract',
        category: 'math'
      }));
      manager.addDocs('system.echo', createDoc({
        name: 'echo',
        category: 'system'
      }));
    });

    it('should get commands in category', () => {
      const results = manager.getDocsInCategory('math');
      expect(results).toHaveLength(2);
      expect(results.map(d => d.name)).toEqual(['add', 'subtract']);
    });

    it('should return empty array for unknown category', () => {
      const results = manager.getDocsInCategory('unknown');
      expect(results).toHaveLength(0);
    });
  });

  describe('recent commands', () => {
    it('should get recent commands', async () => {
      // Add commands with a small delay to ensure different timestamps
      manager.addDocs('cmd1', createDoc({ name: 'cmd1' }));
      await new Promise(resolve => setTimeout(resolve, 10));
      
      manager.addDocs('cmd2', createDoc({ name: 'cmd2' }));
      await new Promise(resolve => setTimeout(resolve, 10));
      
      manager.addDocs('cmd3', createDoc({ name: 'cmd3' }));

      const recent = manager.getRecentCommands(2);
      expect(recent).toHaveLength(2);
      expect(recent[0].name).toBe('cmd3');
      expect(recent[1].name).toBe('cmd2');
    });
  });

  describe('deprecated commands', () => {
    it('should get deprecated commands', () => {
      manager.addDocs('cmd1', createDoc({
        name: 'cmd1',
        deprecated: '1.2.0'
      }));
      manager.addDocs('cmd2', createDoc({
        name: 'cmd2',
        deprecated: '1.1.0'
      }));
      manager.addDocs('cmd3', createDoc({
        name: 'cmd3'
      }));

      const deprecated = manager.getDeprecatedCommands();
      expect(deprecated).toHaveLength(2);
      expect(deprecated[0].name).toBe('cmd1'); // More recently deprecated
      expect(deprecated[1].name).toBe('cmd2');
    });
  });

  describe('markdown generation', () => {
    it('should generate markdown documentation', () => {
      const doc: CommandDoc = {
        name: 'echo',
        description: 'Echo a message',
        longDescription: 'A longer description of the echo command',
        examples: [{
          description: 'Basic echo',
          command: 'test.echo',
          args: ['hello'],
          output: 'hello'
        }],
        arguments: [{
          name: 'message',
          description: 'Message to echo',
          type: 'string',
          required: true
        }],
        returns: {
          type: 'string',
          description: 'The echoed message'
        },
        since: '1.0.0',
        category: 'system',
        permissions: ['user.basic'],
        rateLimits: {
          maxRequests: 10,
          timeWindow: 1000
        }
      };

      manager.addDocs('test.echo', doc);
      const markdown = manager.generateMarkdown('test.echo');

      expect(markdown).toContain('# echo');
      expect(markdown).toContain('Echo a message');
      expect(markdown).toContain('A longer description');
      expect(markdown).toContain('## Arguments');
      expect(markdown).toContain('### message');
      expect(markdown).toContain('## Examples');
      expect(markdown).toContain('## Permissions');
      expect(markdown).toContain('## Rate Limits');
    });
  });
});
