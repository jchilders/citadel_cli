import { describe, it, expect, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { AvailableCommands } from '../AvailableCommands';
import { CitadelConfigProvider } from '../../config/CitadelConfigContext';
import { CommandRegistry } from '../../types/command-registry';
import { createMockSegment } from '../../../../__test-utils__/factories';

describe('AvailableCommands', () => {
  let cmdRegistry: CommandRegistry;

  const defaultConfig = {
    includeHelpCommand: true,
    resetStateOnHide: true,
    showCitadelKey: '.'
  };

  const renderWithConfig = (config = defaultConfig) => {
    return render(
      <CitadelConfigProvider 
        config={config}
        commandRegistry={cmdRegistry}
      >
        <AvailableCommands />
      </CitadelConfigProvider>
    );
  };

  beforeEach(() => {
    cmdRegistry = new CommandRegistry();
  });

  describe('command display', () => {
    beforeEach(() => {
      cmdRegistry.addCommand(
        [createMockSegment('word', 'test')],
        'Test command'
      );
    });

    it('renders available commands when not entering arguments', async () => {
      const { container } = renderWithConfig();
      await waitFor(() => {
        const content = container.textContent || '';
        expect(content).toContain('test');
        expect(content).toContain('help');
      });
    });

    it('handles help command placement based on config', async () => {
      const { container } = renderWithConfig();
      await waitFor(() => {
        const content = container.textContent || '';
        const helpIndex = content.indexOf('help');
        const testIndex = content.indexOf('test');
        expect(helpIndex).toBeGreaterThan(testIndex);
      });
    });

    it.skip('renders without help command when disabled in config', () => {
      const { container } = renderWithConfig({
        ...defaultConfig,
        includeHelpCommand: false
      });
      expect(container.textContent).not.toContain('help');
      expect(container.textContent).toContain('test');
    });
  });

  describe.skip('argument handling', () => {
    beforeEach(() => {
      cmdRegistry.addCommand(
        [
          createMockSegment('word', 'user'),
          createMockSegment('argument', 'id', 'User ID')
        ],
        'User command'
      );
    });

    it('renders argument description', () => {
      const { container } = renderWithConfig();
      const content = container.textContent || '';
      expect(content).toContain('id');
      expect(content).toContain('User ID');
    });
  });

  describe('command completion', () => {
    beforeEach(() => {
      cmdRegistry.addCommand(
        [
          createMockSegment('word', 'test'),
          createMockSegment('word', 'sub')
        ],
        'Test subcommand'
      );
      cmdRegistry.addCommand(
        [
          createMockSegment('word', 'test'),
          createMockSegment('word', 'other')
        ],
        'Test other subcommand'
      );
    });

    it('shows common prefix highlighting', () => {
      const { container } = renderWithConfig();
      const elements = container.getElementsByClassName('underline');
      expect(elements.length).toBeGreaterThan(0);
      expect(elements[0].textContent).toBeTruthy();
    });
  });

  describe('command sorting', () => {
    it('sorts commands alphabetically and keeps help last when included', async () => {
      cmdRegistry.addCommand(
        [createMockSegment('word', 'zeta')],
        'Zeta command'
      );
      cmdRegistry.addCommand(
        [createMockSegment('word', 'alpha')],
        'Alpha command'
      );
      cmdRegistry.addCommand(
        [createMockSegment('word', 'eta')],
        'Eta command'
      );

      const { container } = renderWithConfig({
        ...defaultConfig,
        includeHelpCommand: true
      });

      await waitFor(() => {
        const commandChips = Array.from(container.querySelectorAll('.font-mono'));
        const commandNames = commandChips.map((node) => node.textContent?.trim());
        expect(commandNames).toEqual(['alpha', 'eta', 'zeta', 'help']);
      });
    });

    it('omits help and sorts alphabetically when help is excluded', async () => {
      cmdRegistry.addCommand(
        [createMockSegment('word', 'gamma')],
        'Gamma command'
      );
      cmdRegistry.addCommand(
        [createMockSegment('word', 'beta')],
        'Beta command'
      );

      const { container } = renderWithConfig({
        ...defaultConfig,
        includeHelpCommand: false
      });

      await waitFor(() => {
        const commandChips = Array.from(container.querySelectorAll('.font-mono'));
        const commandNames = commandChips.map((node) => node.textContent?.trim());
        expect(commandNames).toEqual(['beta', 'gamma']);
      });
    });
  });
});
