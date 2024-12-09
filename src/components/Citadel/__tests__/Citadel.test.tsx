import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { Citadel } from '../Citadel';
import userEvent from '@testing-library/user-event';
import styles from '../Citadel.module.css';
import { CommandTrie } from '../types/command-trie';
import { initializeCommands } from '../commands-config';

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
    expect(screen.queryByTestId('citadel-root')).toBeNull();
    
    // Activate Citadel
    await user.keyboard('.');
    
    // Now it should be there
    await waitFor(() => {
      const element = screen.getByTestId('citadel-root');
      expect(element).toBeTruthy();
    }, { timeout: 1000 });
  });

  it('respects custom showCitadelKey configuration', async () => {
    const user = userEvent.setup();
    render(<Citadel config={{ showCitadelKey: '/' }} />);
    
    // Default key should not trigger
    await user.keyboard('.');
    expect(screen.queryByTestId('citadel-root')).toBeNull();
    
    // Custom key should trigger
    await user.keyboard('/');
    await waitFor(() => {
      expect(screen.getByTestId('citadel-root')).toBeTruthy();
    }, { timeout: 1000 });
  });

  it('shows available commands', async () => {
    const user = userEvent.setup();
    render(<Citadel />);
    
    // Make Citadel visible
    await user.keyboard('.');
    
    // Wait for and find the input element
    const input = await waitFor(() => {
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
    await user.keyboard('.');
    await waitFor(() => screen.getByTestId('citadel-root'));
    
    // Help command should not be visible
    const availableCommands = screen.getByTestId('available-commands');
    expect(availableCommands.textContent).not.toContain('help');
  });
});
