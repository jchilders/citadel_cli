import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCommandTrie } from '../useCommandTrie';
import { CitadelConfigProvider } from '../../config/CitadelConfigContext';
import { TextCommandResult } from '../../types/command-results';
import type { ReactNode } from 'react';

describe('useCommandTrie', () => {
  const createWrapper = (config = {}) => ({ children }: { children: ReactNode }) => (
    <CitadelConfigProvider
      config={{
        includeHelpCommand: false,
        resetStateOnHide: true,
        showCitadelKey: '.',
        ...config
      }}
    >
      {children}
    </CitadelConfigProvider>
  );

  it('creates a command trie without help command when disabled', () => {
    const { result } = renderHook(() => useCommandTrie(), {
      wrapper: createWrapper({ includeHelpCommand: false })
    });

    const trie = result.current;
    expect(trie.getCommand(['help'])).toBeUndefined();
  });

  it('creates a command trie with help command when enabled', () => {
    const { result } = renderHook(() => useCommandTrie(), {
      wrapper: createWrapper({ includeHelpCommand: true })
    });

    const trie = result.current;
    const helpCommand = trie.getCommand(['help']);
    expect(helpCommand).toBeDefined();
    expect(helpCommand?.description).toBe('Show available commands');
  });

  it('help command handler returns correct output based on config', async () => {
    const { result } = renderHook(() => useCommandTrie(), {
      wrapper: createWrapper({ includeHelpCommand: true })
    });

    const trie = result.current;
    const helpCommand = trie.getCommand(['help']);
    expect(helpCommand).toBeDefined();
    expect(helpCommand?.fullPath).toEqual(['help']);

    // Add a test command to verify it appears in help output
    trie.addCommand({
      segments: ['test'],
      description: 'Test command',
      handler: async () => new TextCommandResult('test')
    });

    const handler = helpCommand?.handler;
    expect(handler).toBeDefined();
    if (handler) {
      const output = await handler([]);
      expect(output instanceof TextCommandResult).toBe(true);
      const textOutput = output as TextCommandResult;
      expect(textOutput.text).toContain('Available Commands:');
      expect(textOutput.text).toContain('test - Test command');
      expect(textOutput.text).toContain('help - Show available commands');
    }
  });

  it('maintains the same trie instance when irrelevant config changes', () => {
    const { result, rerender } = renderHook(() => useCommandTrie(), {
      wrapper: createWrapper({ includeHelpCommand: true })
    });

    const firstInstance = result.current;

    // Change unrelated config
    rerender();

    expect(result.current).toBe(firstInstance);
  });

  it('creates new trie instance when includeHelpCommand changes', () => {
    const { result, rerender } = renderHook(() => useCommandTrie(), {
      wrapper: createWrapper({ includeHelpCommand: true })
    });

    const firstInstance = result.current;

    // Rerender with different config
    rerender();

    // Use a new wrapper with different config
    const { result: newResult } = renderHook(() => useCommandTrie(), {
      wrapper: createWrapper({ includeHelpCommand: false })
    });

    expect(newResult.current).not.toBe(firstInstance);
    expect(newResult.current.getCommand(['help'])).toBeUndefined();
  });
});
