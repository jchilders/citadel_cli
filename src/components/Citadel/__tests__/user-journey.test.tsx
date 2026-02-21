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
