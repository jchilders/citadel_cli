import { describe, it, expect, beforeEach } from 'vitest';
import { CommandRegistry } from '../CommandRegistry';
import { BaseCommand } from '../../types/command-registry';
import { TextCommandResult } from '../../types/command-results';
import { CommandValidationError } from '../../validation/command-validation';

class TestCommand extends BaseCommand {
  constructor(id: string, description: string) {
    super(id, description);
  }

  async execute(args: string[]): Promise<TextCommandResult> {
    return new TextCommandResult(args.join(' '));
  }
}

describe('CommandRegistry', () => {
  let registry: CommandRegistry;

  beforeEach(() => {
    registry = new CommandRegistry();
  });

  describe('registration', () => {
    it('should register valid commands', () => {
      const cmd = new TestCommand('test.echo', 'Echo command');
      expect(() => registry.register(cmd)).not.toThrow();
      expect(registry.get('test.echo')).toBeDefined();
    });

    it('should reject invalid command IDs', () => {
      const cmd = new TestCommand('💥invalid💥', 'Invalid command');
      expect(() => registry.register(cmd)).toThrow(CommandValidationError);
    });

    it('should store metadata', () => {
      const cmd = new TestCommand('test.echo', 'Echo command');
      const metadata = {
        permissions: ['test.basic'],
        timeout: 1000
      };

      registry.register(cmd, metadata);
      expect(registry.getMetadata('test.echo')).toEqual(metadata);
    });
  });

  describe('querying', () => {
    beforeEach(() => {
      // Add some test commands
      registry.register(new TestCommand('test.echo', 'Echo command'));
      registry.register(new TestCommand('test.add', 'Add numbers'));
      registry.register(new TestCommand('system.echo', 'System echo'));
    });

    it('should list all commands', () => {
      const commands = registry.list();
      expect(commands).toHaveLength(3);
      expect(commands.map(c => c.id)).toContain('test.echo');
    });

    it('should find commands by name', () => {
      const commands = registry.findByName('echo');
      expect(commands).toHaveLength(2);
      expect(commands.map(c => c.id)).toContain('test.echo');
      expect(commands.map(c => c.id)).toContain('system.echo');
    });

    it('should find commands by permission', () => {
      const cmd = new TestCommand('admin.action', 'Admin action');
      registry.register(cmd, { permissions: ['admin'] });

      const commands = registry.findByPermission('admin');
      expect(commands).toHaveLength(1);
      expect(commands[0].id).toBe('admin.action');
    });
  });

  describe('metadata', () => {
    it('should update metadata', () => {
      const cmd = new TestCommand('test.echo', 'Echo command');
      const initial = { permissions: ['test'], timeout: 1000 };
      registry.register(cmd, initial);

      const update = { timeout: 2000 };
      registry.updateMetadata('test.echo', update);

      const final = registry.getMetadata('test.echo');
      expect(final?.timeout).toBe(2000);
      expect(final?.permissions).toEqual(['test']);
    });

    it('should handle permission updates', () => {
      const cmd = new TestCommand('test.echo', 'Echo command');
      registry.register(cmd, { permissions: ['old'] });

      registry.updateMetadata('test.echo', { permissions: ['new'] });

      expect(registry.findByPermission('old')).toHaveLength(0);
      expect(registry.findByPermission('new')).toHaveLength(1);
    });
  });

  describe('command execution', () => {
    it('should execute commands', async () => {
      const cmd = new TestCommand('test.echo', 'Echo command');
      registry.register(cmd);

      const registered = registry.get('test.echo');
      expect(registered).toBeDefined();

      if (registered) {
        const result = await registered.execute(['hello', 'world']);
        expect(result.value).toBe('hello world');
      }
    });
  });
});
