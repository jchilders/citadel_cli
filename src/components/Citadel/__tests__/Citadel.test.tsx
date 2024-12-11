import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { Citadel } from '../Citadel';
import userEvent from '@testing-library/user-event';

describe('Citadel', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders without crashing', () => {
    const { container } = render(<Citadel />);
    expect(container).toBeTruthy();
  });

  it('adds component to DOM when showCitadelKey is pressed', async () => {
    const user = userEvent.setup();
    render(<Citadel />);
    
    // It should not exist in DOM on page load
    expect(document.getElementById('citadel-root')).toBeNull();
    
    // Activate Citadel
    await act(async () => {
      await user.keyboard('.');
    });
    
    // Now it should be there
    await waitFor(() => {
      const element = document.getElementById('citadel-root');
      expect(element).toBeTruthy();
    }, { timeout: 1000 });
  });

  it('respects custom showCitadelKey configuration', async () => {
    const user = userEvent.setup();
    render(<Citadel config={{ showCitadelKey: '/' }} />);
    
    // Default key should not trigger
    await act(async () => {
      await user.keyboard('.');
    });
    expect(document.getElementById('citadel-root')).toBeNull();
    
    // Custom key should trigger
    await act(async () => {
      await user.keyboard('/');
    });
    await waitFor(() => {
      expect(document.getElementById('citadel-root')).toBeTruthy();
    }, { timeout: 1000 });
  });

  it('uses custom config when provided', async () => {
    const user = userEvent.setup();
    render(<Citadel config={{ showCitadelKey: 'k', includeHelpCommand: true, resetStateOnHide: true }} />);
    
    // It should not exist in DOM on page load
    expect(document.getElementById('citadel-root')).toBeNull();
    
    // Try default key (should not work)
    await act(async () => {
      await user.keyboard('.');
    });
    expect(document.getElementById('citadel-root')).toBeNull();
    
    // Try custom key
    await act(async () => {
      await user.keyboard('k');
    });
    await waitFor(() => {
      const element = document.getElementById('citadel-root');
      expect(element).toBeTruthy();
    }, { timeout: 1000 });
  });

  it('shows available commands', async () => {
    const user = userEvent.setup();
    render(<Citadel />);
    
    // Make Citadel visible
    await act(async () => {
      await user.keyboard('.');
    });
    
    // Wait for and find the input element
    await waitFor(() => {
      const inputElement = screen.getByTestId('citadel-command-input');
      expect(inputElement).toBeTruthy();
      return inputElement;
    }, { timeout: 1000 });
    
    // Help command should be visible by default
    const availableCommands = screen.getByTestId('available-commands');
    expect(availableCommands.textContent).toContain('help');
  });

  it('respects includeHelpCommand configuration', async () => {
    const user = userEvent.setup();
    render(<Citadel config={{ includeHelpCommand: false }} />);
    
    // Show Citadel
    await act(async () => {
      await user.keyboard('.');
    });
    await waitFor(() => document.getElementById('citadel-root'));
    
    // Help command should not be visible
    const availableCommands = screen.getByTestId('available-commands');
    expect(availableCommands.textContent).not.toContain('help');
  });

  it('executes help command when typed and entered', async () => {
    const user = userEvent.setup();
    render(<Citadel />);
    
    // Show Citadel
    await act(async () => {
      await user.keyboard('.');
    });
    
    // Wait for the input element
    const input = await waitFor(() => {
      const inputElement = screen.getByTestId('citadel-command-input');
      expect(inputElement).toBeTruthy();
      return inputElement;
    }, { timeout: 1000 });
    
    // Type "help" and press enter
    await act(async () => {
      await user.type(input, 'help');
      await user.keyboard('{Enter}');
    });
    
    // Verify help output is displayed
    await waitFor(() => {
      const outputElement = screen.getByText((content) => {
        return content.includes('Available Commands:') && content.includes('help - Show available commands');
      }, { selector: 'pre' });
      expect(outputElement).toBeTruthy();
    }, { timeout: 1000 });
  });
});
