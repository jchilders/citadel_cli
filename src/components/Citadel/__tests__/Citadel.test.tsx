import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { Citadel } from '../Citadel';
import userEvent from '@testing-library/user-event';
import styles from '../Citadel.module.css';

describe('Citadel', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders without crashing', () => {
    const { container } = render(<Citadel />);
    expect(container).toBeTruthy();
  });

  it('adds component to DOM when trigger key is pressed', async () => {
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

  it('accepts input and updates the command input', async () => {
    const user = userEvent.setup();
    render(<Citadel />);
    
    // Make Citadel visible
    await user.keyboard('.');
    
    // Wait for animation to complete and find the input element
    const input = await waitFor(() => {
      const element = screen.getByTestId('citadel-root');
      expect(element).toBeTruthy();
      const inputElement = screen.getByTestId('citadel-command-input');
      expect(inputElement).toBeTruthy();
      return inputElement;
    }, { timeout: 1000 });
    
    // Type into the input
    await user.type(input, 'help');
    
    // Wait for state update to complete
    await waitFor(() => {
      const updatedInput = screen.getByTestId('citadel-command-input') as HTMLInputElement;
      expect(updatedInput.value).toBe('help');
    }, { timeout: 1000 });
  });

  it('closes when Escape is pressed', async () => {
    const user = userEvent.setup();
    render(<Citadel />);
    
    // Make Citadel visible
    await user.keyboard('.');
    
    // Wait for it to become visible
    await waitFor(() => {
      const element = screen.getByTestId('citadel-root');
      expect(element.style.opacity).toBe('1');
    }, { timeout: 1000 });
    
    // Press Escape
    await user.keyboard('{esc}');
    
    // First check that the closing animation starts
    await waitFor(() => {
      const element = screen.getByTestId('citadel-root');
      expect(element.classList.contains(styles.slideDown)).toBe(true);
    }, { timeout: 1000 });

    // Then wait for the element to be removed after animation
    await waitFor(() => {
      expect(screen.queryByTestId('citadel-root')).toBeNull();
    }, { timeout: 2000 });
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
    
    // Type partial command
    await user.type(input, 'h');
    
    // Wait for available commands to update
    await waitFor(() => {
      const availableCommands = screen.getByTestId('available-commands');
      expect(availableCommands).toBeTruthy();
      expect(availableCommands.textContent).toContain('help');
    }, { timeout: 1000 });
  });
});
