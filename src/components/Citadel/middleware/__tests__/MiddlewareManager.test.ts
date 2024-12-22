import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MiddlewareManager } from '../MiddlewareManager';
import {
  CommandMiddleware,
  CommandContext,
  CommandExecutionResult
} from '../../types/command-middleware';
import { TextCommandResult } from '../../types/command-results';

describe('MiddlewareManager', () => {
  let manager: MiddlewareManager;
  let context: CommandContext;

  beforeEach(() => {
    manager = new MiddlewareManager();
    context = {
      command: {
        id: 'test',
        execute: async () => new TextCommandResult('test'),
        getName: () => 'test'
      },
      args: [],
      startTime: new Date(),
      metadata: {}
    };
  });

  describe('middleware management', () => {
    it('should add and remove middleware', () => {
      const middleware: CommandMiddleware = {};
      
      manager.use(middleware);
      expect(manager.getMiddleware()).toContain(middleware);

      manager.remove(middleware);
      expect(manager.getMiddleware()).not.toContain(middleware);
    });

    it('should clear all middleware', () => {
      manager.use({});
      manager.use({});
      manager.clear();
      
      expect(manager.getMiddleware()).toHaveLength(0);
    });

    it('should create pipeline with middleware', () => {
      const m1: CommandMiddleware = {};
      const m2: CommandMiddleware = {};
      
      const pipeline = MiddlewareManager.createPipeline(m1, m2);
      expect(pipeline.getMiddleware()).toEqual([m1, m2]);
    });
  });

  describe('middleware execution', () => {
    it('should execute pre-middleware in order', async () => {
      const order: number[] = [];
      const m1: CommandMiddleware = {
        pre: async () => { order.push(1); }
      };
      const m2: CommandMiddleware = {
        pre: async () => { order.push(2); }
      };

      manager.use(m1);
      manager.use(m2);

      await manager.execute(context, async () => new TextCommandResult('test'));
      expect(order).toEqual([1, 2]);
    });

    it('should execute post-middleware in reverse order', async () => {
      const order: number[] = [];
      const m1: CommandMiddleware = {
        post: async () => { order.push(1); }
      };
      const m2: CommandMiddleware = {
        post: async () => { order.push(2); }
      };

      manager.use(m1);
      manager.use(m2);

      await manager.execute(context, async () => new TextCommandResult('test'));
      expect(order).toEqual([2, 1]);
    });

    it('should handle pre-middleware errors', async () => {
      const error = new Error('Pre error');
      const errorHandler = vi.fn();

      manager.use({
        pre: async () => { throw error; },
        error: errorHandler
      });

      await expect(
        manager.execute(context, async () => new TextCommandResult('test'))
      ).rejects.toThrow(error);

      expect(errorHandler).toHaveBeenCalledWith(error, context);
    });

    it('should handle command errors', async () => {
      const error = new Error('Command error');
      const errorHandler = vi.fn();

      manager.use({
        error: errorHandler
      });

      await expect(
        manager.execute(context, async () => { throw error; })
      ).rejects.toThrow(error);

      expect(errorHandler).toHaveBeenCalledWith(error, context);
    });

    it('should handle post-middleware errors', async () => {
      const error = new Error('Post error');
      const errorHandler = vi.fn();

      manager.use({
        post: async () => { throw error; },
        error: errorHandler
      });

      await expect(
        manager.execute(context, async () => new TextCommandResult('test'))
      ).rejects.toThrow(error);

      expect(errorHandler).toHaveBeenCalledWith(error, context);
    });

    it('should continue error chain if error handler fails', async () => {
      const commandError = new Error('Command error');
      const handlerError = new Error('Handler error');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      manager.use({
        error: async () => { throw handlerError; }
      });

      await expect(
        manager.execute(context, async () => { throw commandError; })
      ).rejects.toThrow(commandError);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in error middleware:',
        handlerError
      );
    });
  });

  describe('execution context', () => {
    it('should provide execution duration', async () => {
      let duration: number | undefined;
      
      manager.use({
        post: async (result: CommandExecutionResult) => {
          duration = result.duration;
        }
      });

      await manager.execute(context, async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return new TextCommandResult('test');
      });

      expect(duration).toBeGreaterThanOrEqual(10);
    });

    it('should allow middleware to modify context', async () => {
      manager.use({
        pre: async (ctx: CommandContext) => {
          ctx.metadata.modified = true;
        }
      });

      await manager.execute(context, async () => new TextCommandResult('test'));
      expect(context.metadata.modified).toBe(true);
    });

    it('should maintain execution chain with async operations', async () => {
      const order: number[] = [];
      
      manager.use({
        pre: async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          order.push(1);
        },
        post: async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          order.push(3);
        }
      });

      await manager.execute(context, async () => {
        order.push(2);
        return new TextCommandResult('test');
      });

      expect(order).toEqual([1, 2, 3]);
    });
  });
});
