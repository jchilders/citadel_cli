import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MiddlewarePipeline } from '../MiddlewarePipeline';
import { CommandMiddleware, CommonMiddleware } from '../../types/command-middleware';
import { Command } from '../../types/command-registry';
import { TextCommandResult } from '../../types/command-results';

describe('MiddlewarePipeline', () => {
  let pipeline: MiddlewarePipeline;
  let testCommand: Command;

  beforeEach(() => {
    pipeline = new MiddlewarePipeline();
    testCommand = {
      id: 'test.command',
      description: 'Test command',
      execute: async (args: string[]) => new TextCommandResult(args.join(' ')),
      getName: () => 'command'
    };
  });

  describe('middleware execution', () => {
    it('should execute middleware in order', async () => {
      const order: string[] = [];
      const middleware1: CommandMiddleware = {
        pre: async () => { order.push('pre1'); },
        post: async () => { order.push('post1'); }
      };
      const middleware2: CommandMiddleware = {
        pre: async () => { order.push('pre2'); },
        post: async () => { order.push('post2'); }
      };

      pipeline.use(middleware1);
      pipeline.use(middleware2);

      await pipeline.execute(testCommand, ['test']);

      expect(order).toEqual(['pre1', 'pre2', 'post2', 'post1']);
    });

    it('should handle errors in middleware', async () => {
      const error = new Error('Test error');
      const errorHandler = vi.fn();

      const middleware: CommandMiddleware = {
        pre: async () => { throw error; },
        error: errorHandler
      };

      pipeline.use(middleware);

      await expect(pipeline.execute(testCommand, ['test']))
        .rejects.toThrow('Test error');
      
      expect(errorHandler).toHaveBeenCalledWith(error, expect.any(Object));
    });
  });

  describe('common middleware', () => {
    describe('permission check', () => {
      it('should allow users with required permissions', async () => {
        pipeline.use(CommonMiddleware.permissionCheck(['test.permission']));

        const user = {
          id: 'user1',
          permissions: ['test.permission']
        };

        const result = await pipeline.execute(testCommand, ['test'], user);
        expect(result.result.text).toBe('test');
      });

      it('should block users without required permissions', async () => {
        pipeline.use(CommonMiddleware.permissionCheck(['test.permission']));

        const user = {
          id: 'user1',
          permissions: ['other.permission']
        };

        await expect(pipeline.execute(testCommand, ['test'], user))
          .rejects.toThrow('Missing required permissions');
      });
    });

    describe('rate limiting', () => {
      it('should enforce rate limits', async () => {
        pipeline.use(CommonMiddleware.rateLimit(2, 1000));

        const user = { id: 'user1', permissions: [] };

        // First two requests should succeed
        await pipeline.execute(testCommand, ['test'], user);
        await pipeline.execute(testCommand, ['test'], user);

        // Third request should fail
        await expect(pipeline.execute(testCommand, ['test'], user))
          .rejects.toThrow('Rate limit exceeded');
      });

      it('should not rate limit different users', async () => {
        pipeline.use(CommonMiddleware.rateLimit(1, 1000));

        const user1 = { id: 'user1', permissions: [] };
        const user2 = { id: 'user2', permissions: [] };

        // Both requests should succeed
        await pipeline.execute(testCommand, ['test'], user1);
        await pipeline.execute(testCommand, ['test'], user2);
      });
    });

    describe('timing', () => {
      it('should track execution time', async () => {
        const slowCommand: Command = {
          ...testCommand,
          execute: async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
            return new TextCommandResult('done');
          }
        };

        pipeline.use(CommonMiddleware.timing());
        const result = await pipeline.execute(slowCommand, []);
        expect(result.duration).toBeGreaterThanOrEqual(50);
      });
    });

    describe('logging', () => {
      it('should log command execution', async () => {
        const consoleSpy = vi.spyOn(console, 'log');
        pipeline.use(CommonMiddleware.logging());

        await pipeline.execute(testCommand, ['test']);

        expect(consoleSpy).toHaveBeenCalledWith(
          'Executing test.command with args:',
          ['test']
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Completed test.command in')
        );
      });

      it('should log errors', async () => {
        const consoleSpy = vi.spyOn(console, 'error');
        pipeline.use(CommonMiddleware.logging());

        const errorCommand: Command = {
          ...testCommand,
          execute: async () => { throw new Error('Test error'); }
        };

        await expect(pipeline.execute(errorCommand, ['test']))
          .rejects.toThrow('Test error');

        expect(consoleSpy).toHaveBeenCalledWith(
          'Error executing test.command:',
          expect.any(Error)
        );
      });
    });
  });
});
