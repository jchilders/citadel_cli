import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { Citadel } from '../Citadel';
import userEvent from '@testing-library/user-event';
import type { UserEvent } from '@testing-library/user-event';
import { StorageType } from '../types/storage';
import { defaultConfig } from '../config/defaults'

describe.skip('Citadel', () => {
  let user: UserEvent;

  beforeEach(() => {
    document.body.innerHTML = '';
    user = userEvent.setup();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('renders without crashing', async () => {
    await act(async () => {
      render(<Citadel />);
    });
    expect(document.body).toBeTruthy();
  });

  it('adds component to DOM when showCitadelKey is pressed', async () => {
    await act(async () => {
      render(<Citadel />);
    });
    
    // It should not exist in DOM on page load
    expect(document.getElementById('citadel-root')).toBeNull();
    
    // Activate Citadel
    await act(async () => {
      await user.keyboard(defaultConfig.showCitadelKey || '.');
    });
    
    // Now it should be there
    await waitFor(() => {
      const element = document.getElementById('citadel-root');
      expect(element).toBeTruthy();
    });
  });

  it('respects custom showCitadelKey configuration', async () => {
    await act(async () => {
      render(<Citadel config={{ showCitadelKey: '/' }} />);
    });
    
    // Default key should not trigger
    await act(async () => {
      await user.keyboard(defaultConfig.showCitadelKey || '.');
    });
    expect(document.getElementById('citadel-root')).toBeNull();
    
    // Custom key should trigger
    await act(async () => {
      await user.keyboard('/');
    });
    await waitFor(() => {
      expect(document.getElementById('citadel-root')).toBeTruthy();
    });
  });

  it('applies custom configuration options correctly', async () => {
    const customConfig = {
      showCitadelKey: '/',
      storage: { type: 'memory' as StorageType, maxCommands: 50 },
      includeHelpCommand: true,
      resetStateOnHide: true
    };
    
    await act(async () => {
      render(<Citadel config={customConfig} />);
    });
    
    // Verify custom key works
    await act(async () => {
      await user.keyboard('/');
    });
    
    await waitFor(() => {
      expect(document.getElementById('citadel-root')).toBeTruthy();
    });

    // Verify help command is available when enabled
    const availableCommands = screen.getByTestId('available-commands');
    expect(availableCommands.textContent).toContain('help');
  });

  it('displays and executes help command correctly', async () => {
    await act(async () => {
      render(<Citadel />);
    });
    
    // Open Citadel
    await act(async () => {
      await user.keyboard(defaultConfig.showCitadelKey || '.');
    });
    
    // Type and execute help command
    await act(async () => {
      await user.keyboard('help');
      await user.keyboard('{Enter}');
    });
    
    // Verify help command output
    await waitFor(() => {
      const helpText = screen.getByText((content) => {
        return content.toLowerCase().includes('help') && 
               content.toLowerCase().includes('show available commands');
      });
      expect(helpText).toBeTruthy();
    }, { timeout: 2000 });
  });

  it('displays available commands in command palette', async () => {
    await act(async () => {
      render(<Citadel />);
    });
    
    // Open Citadel
    await act(async () => {
      await user.keyboard(defaultConfig.showCitadelKey || '.');
    });
    
    // Verify command input and available commands are shown
    await waitFor(() => {
      const inputElement = screen.getByTestId('citadel-command-input');
      expect(inputElement).toBeTruthy();
      
      const availableCommands = screen.getByTestId('available-commands');
      expect(availableCommands).toBeTruthy();
      expect(availableCommands.textContent).toContain('help');
    }, { timeout: 2000 });
  });
});
