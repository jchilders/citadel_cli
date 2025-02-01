import { render, act } from '@testing-library/react';
import { CitadelConfigProvider, useCitadelCommands, useCitadelConfig, useCitadelStorage } from '../CitadelConfigContext';
import { CommandTrie } from '../../types/command-trie';
import { StorageFactory } from '../../storage/StorageFactory';
import { defaultConfig } from '../defaults';
import { CitadelElement } from '../../Citadel';

describe('CitadelConfigContext', () => {
  describe('command handling', () => {
    const TestComponent = () => {
      const commands = useCitadelCommands();
      return <div data-testid="commands">{JSON.stringify(commands)}</div>;
    };

    it('should never return undefined commands', () => {
      const { getByTestId } = render(
        <CitadelConfigProvider>
          <TestComponent />
        </CitadelConfigProvider>
      );

      const commandsElement = getByTestId('commands');
      expect(commandsElement.textContent).not.toBe('');
      expect(JSON.parse(commandsElement.textContent || '{}')).toEqual(expect.any(Object));
    });

    it('should handle undefined commands', () => {
      const { getByTestId } = render(
        <CitadelConfigProvider>
          <TestComponent />
        </CitadelConfigProvider>
      );

      const commandsElement = getByTestId('commands');
      const parsedCommands = JSON.parse(commandsElement.textContent || '{}');
      expect(parsedCommands).toEqual({ _commands: [] });
    });

    it('should provide and persist commands when passed', () => {
      const testTrie = new CommandTrie();
      testTrie.addCommand(
        [{ type: 'word', name: 'test-command' }],
        'Test command'
      );

      const { getByTestId, rerender } = render(
        <CitadelConfigProvider commands={testTrie}>
          <TestComponent />
        </CitadelConfigProvider>
      );

      const initialCommandsText = getByTestId('commands').textContent;
      expect(initialCommandsText).toContain('test-command');

      // Modify the trie
      testTrie.addCommand(
        [{ type: 'word', name: 'another-command' }],
        'Another command'
      );

      // Rerender with same trie
      rerender(
        <CitadelConfigProvider commands={testTrie}>
          <TestComponent />
        </CitadelConfigProvider>
      );

      const updatedCommandsText = getByTestId('commands').textContent;
      expect(updatedCommandsText).toContain('another-command');
    });

    describe('command persistence in shadow DOM', () => {
      it('should maintain command trie across shadow DOM renders', () => {
        // Mock CSS modules
        vi.mock('../../../Citadel.module.css', () => ({
          default: {
            container: 'container',
            innerContainer: 'innerContainer',
            resizeHandle: 'resizeHandle'
          }
        }));

        const testTrie = new CommandTrie();
        testTrie.addCommand(
          [{ type: 'word', name: 'test' }],
          'Test command'
        );

        // Create CitadelElement with mocked styles
        const citadelElement = new CitadelElement(testTrie);
        
        // Verify the command trie is maintained
        expect(citadelElement['commands']).toBe(testTrie);
        
        // Clean up
        vi.resetModules();
      });
    });
  });

  describe('config merging', () => {
    const ConfigTestComponent = () => {
      const config = useCitadelConfig();
      return <div data-testid="config">{JSON.stringify(config)}</div>;
    };

    it('should use default config when none provided', () => {
      const { getByTestId } = render(
        <CitadelConfigProvider>
          <ConfigTestComponent />
        </CitadelConfigProvider>
      );

      const configElement = getByTestId('config');
      const parsedConfig = JSON.parse(configElement.textContent || '{}');
      expect(parsedConfig).toEqual(defaultConfig);
    });

    it('should merge custom config with defaults', () => {
      const customConfig = {
        cursorType: 'blink' as const,
        cursorColor: '#ff0000'
      };

      const { getByTestId } = render(
        <CitadelConfigProvider config={customConfig}>
          <ConfigTestComponent />
        </CitadelConfigProvider>
      );

      const configElement = getByTestId('config');
      const parsedConfig = JSON.parse(configElement.textContent || '{}');
      expect(parsedConfig.cursorType).toBe('blink');
      expect(parsedConfig.cursorColor).toBe('#ff0000');
      expect(parsedConfig.storage).toBeDefined();
    });
  });

  describe('storage initialization', () => {
    const StorageTestComponent = () => {
      const storage = useCitadelStorage();
      return <div data-testid="storage">{storage ? 'initialized' : 'not-initialized'}</div>;
    };

    beforeEach(() => {
      // Reset StorageFactory singleton between tests
      (StorageFactory as any)['instance'] = undefined;
    });

    it('should initialize storage', async () => {
      const { getByTestId } = render(
        <CitadelConfigProvider>
          <StorageTestComponent />
        </CitadelConfigProvider>
      );

      // Wait for storage initialization
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const storageElement = getByTestId('storage');
      expect(storageElement.textContent).toBe('initialized');
    });

    it('should use custom storage config', async () => {
      const customConfig = {
        storage: {
          type: 'memory' as const,
          maxItems: 50
        }
      };

      const { getByTestId } = render(
        <CitadelConfigProvider config={customConfig}>
          <StorageTestComponent />
        </CitadelConfigProvider>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const storageElement = getByTestId('storage');
      expect(storageElement.textContent).toBe('initialized');
    });
  });
});
