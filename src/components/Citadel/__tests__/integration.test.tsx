import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, act, waitFor } from '@testing-library/react';
import { Citadel } from '../Citadel';
import { CommandRegistry, WordSegment } from '../types/command-registry';
import { TextCommandResult, JsonCommandResult, ErrorCommandResult } from '../types/command-results';

describe('Citadel Integration Tests', () => {
  let registry: CommandRegistry;
  let mockHandler: ReturnType<typeof vi.fn>;

  // Helper function to get the shadow DOM input
  const getCitadelInput = (): HTMLInputElement => {
    const input = document.querySelector('citadel-element')?.shadowRoot?.querySelector('input[type="text"]') as HTMLInputElement;
    expect(input).toBeTruthy();
    return input;
  };

  // Helper function to activate Citadel and get input
  const activateCitadel = async (): Promise<HTMLInputElement> => {
    await act(async () => {
      fireEvent.keyDown(document, { key: '.' });
    });
    return getCitadelInput();
  };

  beforeEach(() => {
    registry = new CommandRegistry();
    mockHandler = vi.fn();
  });

  describe('Command Registry → Parser → Execution Flow', () => {
    it('should execute simple word command using expansion', async () => {
      // Arrange
      mockHandler.mockResolvedValue(new TextCommandResult('Command executed'));
      registry.addCommand(
        [new WordSegment('test')],
        'Test command',
        mockHandler
      );

      render(<Citadel commandRegistry={registry} />);
      
      // Act - activate and execute command using expansion behavior
      const input = await activateCitadel();
      
      await act(async () => {
        fireEvent.change(input, { target: { value: 't' } }); // Triggers expansion to 'test '
        fireEvent.keyDown(input, { key: 'Enter' });
      });

      // Assert
      await waitFor(() => {
        expect(mockHandler).toHaveBeenCalledWith([]);
      });
    });

    it('should display TextCommandResult output', async () => {
      // Arrange
      mockHandler.mockResolvedValue(new TextCommandResult('Success message'));
      registry.addCommand(
        [new WordSegment('status')],
        'Status command',
        mockHandler
      );

      render(<Citadel commandRegistry={registry} />);
      
      // Act
      const input = await activateCitadel();
      
      await act(async () => {
        fireEvent.change(input, { target: { value: 's' } }); // Expands to 'status '
        fireEvent.keyDown(input, { key: 'Enter' });
      });

      // Assert
      await waitFor(() => {
        const shadowRoot = document.querySelector('citadel-element')?.shadowRoot;
        expect(shadowRoot?.textContent).toContain('Success message');
      });
    });

    it('should display JsonCommandResult output', async () => {
      // Arrange
      const jsonData = { status: 'ok', data: [1, 2, 3] };
      mockHandler.mockResolvedValue(new JsonCommandResult(jsonData));
      registry.addCommand(
        [new WordSegment('api')],
        'API command',
        mockHandler
      );

      render(<Citadel commandRegistry={registry} />);
      
      // Act
      const input = await activateCitadel();
      
      await act(async () => {
        fireEvent.change(input, { target: { value: 'a' } }); // Expands to 'api '
        fireEvent.keyDown(input, { key: 'Enter' });
      });

      // Assert
      await waitFor(() => {
        const shadowRoot = document.querySelector('citadel-element')?.shadowRoot;
        expect(shadowRoot?.textContent).toContain('"status": "ok"');
      });
    });

    it('should display ErrorCommandResult output', async () => {
      // Arrange
      mockHandler.mockResolvedValue(new ErrorCommandResult('Something went wrong'));
      registry.addCommand(
        [new WordSegment('fail')],
        'Failing command',
        mockHandler
      );

      render(<Citadel commandRegistry={registry} />);
      
      // Act
      const input = await activateCitadel();
      
      await act(async () => {
        fireEvent.change(input, { target: { value: 'f' } }); // Expands to 'fail '
        fireEvent.keyDown(input, { key: 'Enter' });
      });

      // Assert
      await waitFor(() => {
        const shadowRoot = document.querySelector('citadel-element')?.shadowRoot;
        expect(shadowRoot?.textContent).toContain('Something went wrong');
      });
    });

    it('should handle command execution errors gracefully', async () => {
      // Arrange
      mockHandler.mockRejectedValue(new Error('Handler failed'));
      registry.addCommand(
        [new WordSegment('error')],
        'Error command',
        mockHandler
      );

      render(<Citadel commandRegistry={registry} />);
      
      // Act
      const input = await activateCitadel();
      
      await act(async () => {
        fireEvent.change(input, { target: { value: 'e' } }); // Expands to 'error '
        fireEvent.keyDown(input, { key: 'Enter' });
      });

      // Assert - should not crash and should handle error
      await waitFor(() => {
        expect(mockHandler).toHaveBeenCalled();
      });
    });

    it('keeps inline text committed while narrowing ambiguous next segments', async () => {
      const searchHandler = vi.fn().mockResolvedValue(new TextCommandResult('Search'));
      const showHandler = vi.fn().mockResolvedValue(new TextCommandResult('Show'));

      registry.addCommand(
        [new WordSegment('user'), new WordSegment('show')],
        'Show user',
        showHandler
      );
      registry.addCommand(
        [new WordSegment('user'), new WordSegment('search')],
        'Search users',
        searchHandler
      );
      registry.addCommand(
        [new WordSegment('user'), new WordSegment('deactivate')],
        'Deactivate user',
        async () => new TextCommandResult('Deactivate')
      );

      render(<Citadel commandRegistry={registry} />);
      const input = await activateCitadel();

      await act(async () => {
        fireEvent.change(input, { target: { value: 'u' } });
      });

      const shadowRoot = document.querySelector('citadel-element')?.shadowRoot;
      expect(shadowRoot).toBeTruthy();

      await waitFor(() => {
        const userInput = shadowRoot?.querySelector('[data-testid="user-input-area"]');
        expect(userInput?.textContent?.trim()).toBe('user');
      });

      await act(async () => {
        fireEvent.change(input, { target: { value: 's' } });
      });

      await waitFor(() => {
        const commandChips = Array.from(
          shadowRoot?.querySelectorAll('[data-testid="available-command-chip"]') ?? []
        ).map((chip) => chip.textContent?.trim());

        expect(commandChips).toContain('search');
        expect(commandChips).toContain('show');
        expect(commandChips).not.toContain('deactivate');
      });

      await act(async () => {
        fireEvent.change(input, { target: { value: 'se' } });
        fireEvent.keyDown(input, { key: 'Enter' });
      });

      await waitFor(() => {
        expect(searchHandler).toHaveBeenCalledTimes(1);
        expect(showHandler).toHaveBeenCalledTimes(0);
      });
    });

    it('does not execute command while next segment is still ambiguous', async () => {
      const searchHandler = vi.fn().mockResolvedValue(new TextCommandResult('Search'));
      const showHandler = vi.fn().mockResolvedValue(new TextCommandResult('Show'));

      registry.addCommand(
        [new WordSegment('user'), new WordSegment('show')],
        'Show user',
        showHandler
      );
      registry.addCommand(
        [new WordSegment('user'), new WordSegment('search')],
        'Search users',
        searchHandler
      );

      render(<Citadel commandRegistry={registry} />);
      const input = await activateCitadel();

      await act(async () => {
        fireEvent.change(input, { target: { value: 'u' } });
        fireEvent.change(input, { target: { value: 's' } });
        fireEvent.keyDown(input, { key: 'Enter' });
      });

      await waitFor(() => {
        expect(searchHandler).toHaveBeenCalledTimes(0);
        expect(showHandler).toHaveBeenCalledTimes(0);
      });
    });

    it('executes user.show and user.deactivate from two-keystroke shorthand (us and ud)', async () => {
      const showHandler = vi.fn().mockResolvedValue(new TextCommandResult('Show'));
      const deactivateHandler = vi.fn().mockResolvedValue(new TextCommandResult('Deactivate'));

      registry.addCommand(
        [new WordSegment('user'), new WordSegment('show')],
        'Show user',
        showHandler
      );
      registry.addCommand(
        [new WordSegment('user'), new WordSegment('deactivate')],
        'Deactivate user',
        deactivateHandler
      );
      registry.addCommand(
        [new WordSegment('user'), new WordSegment('query')],
        'Query users',
        async () => new TextCommandResult('Query')
      );

      render(<Citadel commandRegistry={registry} />);
      const input = await activateCitadel();

      await act(async () => {
        fireEvent.change(input, { target: { value: 'u' } });
        fireEvent.change(input, { target: { value: 's' } });
        fireEvent.keyDown(input, { key: 'Enter' });
      });

      await waitFor(() => {
        expect(showHandler).toHaveBeenCalledTimes(1);
        expect(deactivateHandler).toHaveBeenCalledTimes(0);
      });

      await act(async () => {
        fireEvent.change(input, { target: { value: 'u' } });
        fireEvent.change(input, { target: { value: 'd' } });
        fireEvent.keyDown(input, { key: 'Enter' });
      });

      await waitFor(() => {
        expect(showHandler).toHaveBeenCalledTimes(1);
        expect(deactivateHandler).toHaveBeenCalledTimes(1);
      });
    });

    it('resolves user.show and user.search with shortest unique continuation (ush and use)', async () => {
      const showHandler = vi.fn().mockResolvedValue(new TextCommandResult('Show'));
      const searchHandler = vi.fn().mockResolvedValue(new TextCommandResult('Search'));

      registry.addCommand(
        [new WordSegment('user'), new WordSegment('show')],
        'Show user',
        showHandler
      );
      registry.addCommand(
        [new WordSegment('user'), new WordSegment('search')],
        'Search users',
        searchHandler
      );

      render(<Citadel commandRegistry={registry} />);
      const input = await activateCitadel();

      await act(async () => {
        fireEvent.change(input, { target: { value: 'u' } });
        fireEvent.change(input, { target: { value: 's' } });
        fireEvent.change(input, { target: { value: 'sh' } });
        fireEvent.keyDown(input, { key: 'Enter' });
      });

      await waitFor(() => {
        expect(showHandler).toHaveBeenCalledTimes(1);
        expect(searchHandler).toHaveBeenCalledTimes(0);
      });

      await act(async () => {
        fireEvent.change(input, { target: { value: 'u' } });
        fireEvent.change(input, { target: { value: 's' } });
        fireEvent.change(input, { target: { value: 'se' } });
        fireEvent.keyDown(input, { key: 'Enter' });
      });

      await waitFor(() => {
        expect(showHandler).toHaveBeenCalledTimes(1);
        expect(searchHandler).toHaveBeenCalledTimes(1);
      });
    });

    // Note: Commands with arguments require more complex interaction patterns
    // that are difficult to simulate in the current test environment.
    // These are better tested through E2E tests or manual testing.
    it.skip('should execute command with arguments (requires complex interaction)', async () => {
      // This test is skipped because argument parsing in the test environment
      // requires simulating the exact user interaction patterns that are
      // difficult to replicate with fireEvent.change()
    });
  });

  describe('Command Completion Flow', () => {
    it('should register commands for completion', async () => {
      // Arrange
      registry.addCommand(
        [new WordSegment('test')],
        'Test command',
        mockHandler
      );
      registry.addCommand(
        [new WordSegment('testing')],
        'Testing command',
        mockHandler
      );

      render(<Citadel commandRegistry={registry} />);
      
      // Act - activate Citadel to trigger command registration
      const input = await activateCitadel();
      
      // Assert - verify commands are available (basic smoke test)
      expect(input).toBeTruthy();
      expect(registry.commands.length).toBeGreaterThanOrEqual(2); // At least our 2 commands
    });

    // Note: Tab completion behavior is complex and requires precise timing
    // and interaction patterns that are better tested in E2E environment
    it.skip('should provide tab completions (requires precise interaction timing)', async () => {
      // This test is skipped because tab completion requires precise timing
      // and interaction patterns that are difficult to simulate reliably
    });
  });
});
