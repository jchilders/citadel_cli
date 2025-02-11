import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { AvailableCommands } from '../AvailableCommands';
import { CitadelConfigProvider } from '../../config/CitadelConfigContext';
import { CommandRegistry } from '../../types/command-registry';
import { createMockSegment } from '../../../../__test-utils__/factories';

describe('AvailableCommands', () => {
  let cmdRegistry: CommandRegistry;

  const defaultConfig = {
    includeHelpCommand: false,
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
      cmdRegistry.addCommand(
        [createMockSegment('word', 'help')],
        'Help command'
      );
    });

    it('renders available commands when not entering arguments', () => {
      const { container } = renderWithConfig();
      expect(container.textContent).toContain('test');
      expect(container.textContent).toContain('help');
    });

    it('handles help command placement based on config', () => {
      const { container } = renderWithConfig();
      const content = container.textContent || '';
      const helpIndex = content.indexOf('help');
      const testIndex = content.indexOf('test');
      expect(helpIndex).toBeGreaterThan(testIndex);
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
});
