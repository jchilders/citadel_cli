import { render, act } from '@testing-library/react';
import { CitadelConfigProvider } from '../CitadelConfigContext';
import { useCitadelCommands, useCitadelConfig, useCitadelStorage } from '../hooks';
import { CommandRegistry } from '../../types/command-registry';
import { StorageFactory } from '../../storage/StorageFactory';
import { defaultConfig } from '../defaults';
import { CitadelElement } from '../../Citadel';
import { createHelpHandler } from '../../types/help-command';

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
      const testCmdRegistry = new CommandRegistry();
      testCmdRegistry.addCommand(
        [{ type: 'word', name: 'test-command' }],
        'Test command'
      );

      const { getByTestId, rerender } = render(
        <CitadelConfigProvider commandRegistry={testCmdRegistry}>
        <TestComponent />
        </CitadelConfigProvider>
      );

      const initialCommandsText = getByTestId('commands').textContent;
      expect(initialCommandsText).toContain('test-command');

      // Modify the registry
      testCmdRegistry.addCommand(
        [{ type: 'word', name: 'another-command' }],
        'Another command'
      );

      // Rerender with same registry
      rerender(
        <CitadelConfigProvider commandRegistry={testCmdRegistry}>
        <TestComponent />
        </CitadelConfigProvider>
      );

      const updatedCommandsText = getByTestId('commands').textContent;
      expect(updatedCommandsText).toContain('another-command');
    });

    describe('command persistence in shadow DOM', () => {
      it('should maintain command regsitry across shadow DOM renders', () => {
        // Mock CSS modules
        vi.mock('../../../Citadel.module.css', () => ({
          default: {
            container: 'container',
            innerContainer: 'innerContainer',
            resizeHandle: 'resizeHandle'
          }
        }));

        const testCmdRegsitry = new CommandRegistry();
        testCmdRegsitry.addCommand(
          [{ type: 'word', name: 'test' }],
          'Test command'
        );

        // Create CitadelElement with mocked styles
        const citadelElement = new CitadelElement(testCmdRegsitry);

        // Verify the command regsitry is maintained
        expect(citadelElement['commandRegistry']).toBe(testCmdRegsitry);

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

    it('should not add help command twice when includeHelpCommand is true', () => {
      const testCmdRegistry = new CommandRegistry();
      const helpHandler = createHelpHandler(testCmdRegistry);

      // Add help command manually first
      testCmdRegistry.addCommand(
        [{ type: 'word', name: 'help' }],
        'Show available commands',
        helpHandler
      );

      const { rerender } = render(
        <CitadelConfigProvider
        config={{ includeHelpCommand: true }}
        commandRegistry={testCmdRegistry}
        >
        <div>Test</div>
        </CitadelConfigProvider>
      );

      // Force re-render to trigger useEffect
      rerender(
        <CitadelConfigProvider
        config={{ includeHelpCommand: true }}
        commandRegistry={testCmdRegistry}
        >
        <div>Test</div>
        </CitadelConfigProvider>
      );

      // Verify help command exists exactly once
      const commands = testCmdRegistry.commands.filter(cmd => 
                                                cmd.segments[0].name === 'help'
                                               );
                                               expect(commands).toHaveLength(1);
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
