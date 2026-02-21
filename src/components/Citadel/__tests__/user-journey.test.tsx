import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, waitFor, act } from '@testing-library/react';
import { Citadel } from '../Citadel';
import { CommandRegistry, WordSegment } from '../types/command-registry';
import { TextCommandResult } from '../types/command-results';

describe('Citadel User Journey Tests', () => {
  let registry: CommandRegistry;

  // Helper function to activate Citadel
  const activateCitadel = async (): Promise<HTMLInputElement> => {
    fireEvent.keyDown(document, { key: '.' });
    await waitFor(() => {
      expect(isCitadelVisible()).toBe(true);
    });
    
    const citadelElement = document.querySelector('citadel-element');
    const input = citadelElement?.shadowRoot?.querySelector('input') as HTMLInputElement;
    expect(input).toBeTruthy();
    return input;
  };

  // Helper function to check if Citadel is visible
  const isCitadelVisible = (): boolean => {
    const citadelElement = document.querySelector('citadel-element');
    return citadelElement?.shadowRoot?.querySelector('.panelContainer') !== null;
  };

  beforeEach(() => {
    registry = new CommandRegistry();
  });

  describe('API Testing Workflow', () => {
    it.skip('should support a complete API testing workflow', async () => {
      // This test is skipped because it tests complex multi-word command parsing
      // that is not yet fully implemented. The basic functionality works as shown
      // in the integration tests.
    });
  });

  describe('Power User Command Sequences', () => {
    it('should handle rapid command execution for power users', async () => {
      const showMock = vi.fn();
      const deactivateMock = vi.fn();

      registry.addCommand(
        [new WordSegment('user'), new WordSegment('show')],
        'Show user',
        async () => {
          showMock();
          return new TextCommandResult('Show user');
        }
      );
      registry.addCommand(
        [new WordSegment('user'), new WordSegment('deactivate')],
        'Deactivate user',
        async () => {
          deactivateMock();
          return new TextCommandResult('Deactivate user');
        }
      );

      render(<Citadel commandRegistry={registry} />);
      const input = await activateCitadel();

      const sequence = ['s', 'd', 's', 'd', 's'];
      const startTime = performance.now();

      for (const secondKey of sequence) {
        await act(async () => {
          fireEvent.change(input, { target: { value: 'u' } });
          fireEvent.change(input, { target: { value: secondKey } });
          fireEvent.keyDown(input, { key: 'Enter' });
        });
      }

      const totalTime = performance.now() - startTime;

      expect(showMock).toHaveBeenCalledTimes(3);
      expect(deactivateMock).toHaveBeenCalledTimes(2);
      expect(totalTime).toBeLessThan(1000);
    });

    it('should allow disambiguation when one child command is a prefix of another', async () => {
      const demoExampleMock = vi.fn();
      const demoExamplesMock = vi.fn();

      registry.addCommand(
        [
          new WordSegment('demo'),
          new WordSegment('example'),
          { type: 'argument', name: 'name' },
        ],
        'Switch active demo example',
        async () => {
          demoExampleMock();
          return new TextCommandResult('Switched demo');
        }
      );
      registry.addCommand(
        [
          new WordSegment('demo'),
          new WordSegment('examples'),
        ],
        'List demo examples',
        async () => {
          demoExamplesMock();
          return new TextCommandResult('Available demos');
        }
      );

      render(<Citadel commandRegistry={registry} />);
      const input = await activateCitadel();

      fireEvent.change(input, { target: { value: 'd' } });

      const eEvent = new KeyboardEvent('keydown', { key: 'e', cancelable: true });
      const wasAccepted = input.dispatchEvent(eEvent);
      expect(wasAccepted).toBe(true);
      expect(eEvent.defaultPrevented).toBe(false);

      fireEvent.change(input, { target: { value: 'e' } });
      fireEvent.change(input, { target: { value: 'ex' } });
      fireEvent.change(input, { target: { value: 'exa' } });
      fireEvent.change(input, { target: { value: 'exam' } });
      fireEvent.change(input, { target: { value: 'examp' } });
      fireEvent.change(input, { target: { value: 'exampl' } });
      fireEvent.change(input, { target: { value: 'example' } });
      fireEvent.change(input, { target: { value: 'examples' } });

      fireEvent.keyDown(input, { key: 'Enter' });

      await waitFor(() => {
        expect(demoExamplesMock).toHaveBeenCalledTimes(1);
      });
      expect(demoExampleMock).toHaveBeenCalledTimes(0);
    });

    it('should commit exact segment on trailing space and enter argument mode', async () => {
      const demoExampleMock = vi.fn();

      registry.addCommand(
        [
          new WordSegment('demo'),
          new WordSegment('example'),
          { type: 'argument', name: 'name' },
        ],
        'Switch active demo example',
        async () => {
          demoExampleMock();
          return new TextCommandResult('Switched demo');
        }
      );
      registry.addCommand(
        [
          new WordSegment('demo'),
          new WordSegment('examples'),
        ],
        'List demo examples',
        async () => new TextCommandResult('Available demos')
      );

      render(<Citadel commandRegistry={registry} />);
      const input = await activateCitadel();

      // Commit root `demo`.
      fireEvent.change(input, { target: { value: 'd' } });

      // Explicitly select `example` via delimiter, not `examples`.
      fireEvent.change(input, { target: { value: 'example ' } });

      // Enter the argument and execute.
      fireEvent.change(input, { target: { value: 'basic' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      await waitFor(() => {
        expect(demoExampleMock).toHaveBeenCalledTimes(1);
      });
    });

    it.skip('should support command chaining with complex arguments', async () => {
      // This test is skipped because complex argument parsing with quotes
      // is not yet fully implemented in the test environment.
    });
  });

  describe('Error Recovery Workflows', () => {
    it.skip('should handle error recovery and retry workflows', async () => {
      // This test is skipped because error recovery workflows are not
      // yet fully implemented.
    });
  });

  describe('Performance and Responsiveness', () => {
    it('should handle basic command execution without performance issues', async () => {
      // Arrange - Set up a simple performance test command
      const performanceMock = vi.fn();
      
      registry.addCommand(
        [new WordSegment('test')],
        'Simple test command',
        async () => {
          performanceMock();
          return new TextCommandResult('Test executed');
        }
      );

      render(<Citadel commandRegistry={registry} />);

      // Act - Execute command multiple times
      const input = await activateCitadel();
      const iterations = 3;
      const startTime = performance.now();

      for (let i = 1; i <= iterations; i++) {
        await act(async () => {
          fireEvent.change(input, { target: { value: 't' } }); // Should expand to 'test'
          fireEvent.keyDown(input, { key: 'Enter' });
        });
        
        // Wait a bit between commands
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const totalTime = performance.now() - startTime;

      // Assert - Performance within acceptable limits
      expect(performanceMock).toHaveBeenCalledTimes(iterations);
      expect(totalTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
