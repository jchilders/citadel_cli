import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommandErrorHandler } from '../CommandErrorHandler';
import {
  CommandError,
  CommandErrorCode,
  CommandNotFoundError,
  InvalidArgumentsError,
  PermissionDeniedError,
  RateLimitExceededError,
  ExecutionError,
  CommandCancelledError,
  CommandTimeoutError,
  InvalidStateError
} from '../../types/command-errors';

describe('CommandErrorHandler', () => {
  let handler: CommandErrorHandler;
  let consoleSpy: any;

  beforeEach(() => {
    handler = new CommandErrorHandler();
    consoleSpy = {
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {})
    };
  });

  describe('error handling', () => {
    it('should handle command not found', () => {
      const error = new CommandNotFoundError('test.command');
      handler.handleError(error);
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Command not found:',
        'test.command'
      );
    });

    it('should handle invalid arguments', () => {
      const error = new InvalidArgumentsError('Invalid args', [
        { field: 'name', error: 'Required' }
      ]);
      handler.handleError(error);
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Invalid arguments:',
        'Invalid args'
      );
    });

    it('should handle permission denied', () => {
      const error = new PermissionDeniedError('test.command', ['admin']);
      handler.handleError(error);
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Permission denied:',
        'Permission denied for command: test.command'
      );
    });

    it('should handle rate limit exceeded', () => {
      const error = new RateLimitExceededError('test.command', 10, 1000);
      handler.handleError(error);
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Rate limit exceeded:',
        'Rate limit exceeded for command: test.command'
      );
    });

    it('should handle execution error', () => {
      const cause = new Error('Internal error');
      const error = new ExecutionError('Failed to execute', cause);
      handler.handleError(error);
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Execution failed:',
        'Failed to execute'
      );
    });

    it('should handle cancelled command', () => {
      const error = new CommandCancelledError('test.command');
      handler.handleError(error);
      
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        'Command cancelled:',
        'test.command'
      );
    });

    it('should handle timeout', () => {
      const error = new CommandTimeoutError('test.command', 5000);
      handler.handleError(error);
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Command timed out:',
        'test.command',
        'after 5000ms'
      );
    });

    it('should handle invalid state', () => {
      const error = new InvalidStateError(
        'Invalid state transition',
        'ready',
        'running'
      );
      handler.handleError(error);
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Invalid state:',
        'Invalid state transition'
      );
    });
  });

  describe('custom handlers', () => {
    it('should support custom error handlers', () => {
      const customHandler = vi.fn();
      handler.registerHandler('CUSTOM_ERROR', customHandler);

      const error = new CommandError('Custom error', 'CUSTOM_ERROR');
      handler.handleError(error);

      expect(customHandler).toHaveBeenCalledWith(error);
    });
  });

  describe('error logging', () => {
    it('should maintain error log', () => {
      const error1 = new CommandNotFoundError('cmd1');
      const error2 = new CommandNotFoundError('cmd2');

      handler.handleError(error1);
      handler.handleError(error2);

      const log = handler.getErrorLog();
      expect(log).toHaveLength(2);
      expect(log[0]).toBe(error2); // Most recent first
      expect(log[1]).toBe(error1);
    });

    it('should limit error log size', () => {
      // Add more errors than max size
      for (let i = 0; i < 150; i++) {
        handler.handleError(new CommandNotFoundError(`cmd${i}`));
      }

      const log = handler.getErrorLog();
      expect(log).toHaveLength(100); // Default max size
      expect(log[0].details?.commandId).toBe('cmd149'); // Most recent
    });

    it('should clear error log', () => {
      handler.handleError(new CommandNotFoundError('test'));
      handler.clearErrorLog();
      
      expect(handler.getErrorLog()).toHaveLength(0);
    });
  });

  describe('error formatting', () => {
    it('should format error details', () => {
      const error = new CommandNotFoundError('test.command');
      const details = handler.getErrorDetails(error);

      expect(details).toEqual({
        code: CommandErrorCode.NotFound,
        message: 'Command not found: test.command',
        details: { commandId: 'test.command' },
        timestamp: expect.any(String)
      });
    });

    it('should format error for display', () => {
      const error = new CommandNotFoundError('test.command');
      const formatted = handler.formatError(error);

      expect(formatted).toContain('Error [COMMAND_NOT_FOUND]');
      expect(formatted).toContain('Command not found: test.command');
      expect(formatted).toContain('"commandId": "test.command"');
    });
  });
});
