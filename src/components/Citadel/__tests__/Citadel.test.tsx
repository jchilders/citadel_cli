import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, waitFor, act, fireEvent } from '@testing-library/react';
import { Citadel, CitadelElement } from '../Citadel';
import userEvent from '@testing-library/user-event';
import type { UserEvent } from '@testing-library/user-event';
import { StorageType } from '../types/storage';
import { CommandRegistry, WordSegment } from '../types/command-registry';
import { TextCommandResult } from '../types/command-results';
import { defaultConfig } from '../config/defaults'

describe('Citadel', () => {
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
    
    // Now it should be there - check shadow DOM
    await waitFor(() => {
      const citadelElement = document.querySelector('citadel-element') as HTMLElement & { shadowRoot: ShadowRoot };
      expect(citadelElement).toBeTruthy();
      expect(citadelElement.shadowRoot).toBeTruthy();
      const shadowRoot = citadelElement.shadowRoot;
      const element = shadowRoot.getElementById('citadel-root');
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
      const citadelElement = document.querySelector('citadel-element') as HTMLElement & { shadowRoot: ShadowRoot };
      expect(citadelElement).toBeTruthy();
      const shadowRoot = citadelElement.shadowRoot;
      expect(shadowRoot.getElementById('citadel-root')).toBeTruthy();
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
      const citadelElement = document.querySelector('citadel-element') as HTMLElement & { shadowRoot: ShadowRoot };
      expect(citadelElement).toBeTruthy();
      const shadowRoot = citadelElement.shadowRoot;
      expect(shadowRoot.getElementById('citadel-root')).toBeTruthy();
    });

    // Verify help command is available when enabled
    await waitFor(() => {
      const citadelElement = document.querySelector('citadel-element') as HTMLElement & { shadowRoot: ShadowRoot };
      const shadowRoot = citadelElement.shadowRoot;
      const availableCommands = shadowRoot.querySelector('[data-testid="available-commands"]');
      expect(availableCommands).toBeTruthy();
      expect(availableCommands?.textContent).toContain('help');
    });
  });

  it('displays and executes help command correctly', async () => {
    await act(async () => {
      render(<Citadel />);
    });
    
    // Open Citadel
    await act(async () => {
      await user.keyboard(defaultConfig.showCitadelKey || '.');
    });
    
    // Verify help command is available in the command palette
    await waitFor(() => {
      const citadelElement = document.querySelector('citadel-element') as HTMLElement & { shadowRoot: ShadowRoot };
      const shadowRoot = citadelElement.shadowRoot;
      const availableCommands = shadowRoot.querySelector('[data-testid="available-commands"]');
      expect(availableCommands).toBeTruthy();
      expect(availableCommands?.textContent).toContain('help');
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
      const citadelElement = document.querySelector('citadel-element') as HTMLElement & { shadowRoot: ShadowRoot };
      const shadowRoot = citadelElement.shadowRoot;
      
      const inputElement = shadowRoot.querySelector('[data-testid="citadel-command-input"]');
      expect(inputElement).toBeTruthy();
      
      const availableCommands = shadowRoot.querySelector('[data-testid="available-commands"]');
      expect(availableCommands).toBeTruthy();
      expect(availableCommands?.textContent).toContain('help');
    }, { timeout: 2000 });
  });

  it('renders inline mode immediately inside specified container', async () => {
    const mount = document.createElement('div');
    mount.id = 'inline-mount';
    document.body.appendChild(mount);

    await act(async () => {
      render(
        <Citadel
          containerId="inline-mount"
          config={{ displayMode: 'inline' }}
        />
      );
    });

    const citadelElement = mount.querySelector('citadel-element');
    expect(citadelElement).toBeTruthy();
    if (!citadelElement) {
      throw new Error('citadel-element not found');
    }
    expect(citadelElement.getAttribute('data-display-mode')).toBe('inline');

    await waitFor(() => {
      const host = citadelElement as HTMLElement & { shadowRoot: ShadowRoot | null };
      const inlineContainer = host.shadowRoot?.querySelector('[data-testid="citadel-inline-container"]');
      expect(inlineContainer).toBeTruthy();
    });
  });

  it('renders inline mode into a local host when no containerId is provided', async () => {
    await act(async () => {
      render(<Citadel config={{ displayMode: 'inline' }} />);
    });

    await waitFor(() => {
      const citadelElement = document.querySelector('citadel-element') as HTMLElement & { shadowRoot: ShadowRoot };
      expect(citadelElement).toBeTruthy();
      expect(citadelElement.parentElement).not.toBe(document.body);
      const inlineContainer = citadelElement.shadowRoot?.querySelector('[data-testid="citadel-inline-container"]');
      expect(inlineContainer).toBeTruthy();
    });
  });

  it('unmounts root and clears shadow content on disconnect', async () => {
    const element = new CitadelElement(new CommandRegistry());
    document.body.appendChild(element);

    await waitFor(() => {
      expect(element.shadowRoot?.getElementById('citadel-root')).toBeTruthy();
    });

    document.body.removeChild(element);

    await waitFor(() => {
      expect(element.shadowRoot?.childElementCount).toBe(0);
      expect(element.shadowRoot?.getElementById('citadel-root')).toBeNull();
    });
  });

  it('isolates command execution between multiple instances', async () => {
    const mountA = document.createElement('div');
    mountA.id = 'inline-mount-a';
    const mountB = document.createElement('div');
    mountB.id = 'inline-mount-b';
    document.body.appendChild(mountA);
    document.body.appendChild(mountB);

    const registryA = new CommandRegistry();
    const registryB = new CommandRegistry();
    const handlerA = vi.fn().mockResolvedValue(new TextCommandResult('A'));
    const handlerB = vi.fn().mockResolvedValue(new TextCommandResult('B'));

    registryA.addCommand([new WordSegment('alpha')], 'Alpha command', handlerA);
    registryB.addCommand([new WordSegment('beta')], 'Beta command', handlerB);

    await act(async () => {
      render(
        <>
          <Citadel
            containerId="inline-mount-a"
            commandRegistry={registryA}
            config={{ displayMode: 'inline' }}
          />
          <Citadel
            containerId="inline-mount-b"
            commandRegistry={registryB}
            config={{ displayMode: 'inline' }}
          />
        </>
      );
    });

    const citadelA = mountA.querySelector('citadel-element') as HTMLElement & { shadowRoot: ShadowRoot | null };
    const citadelB = mountB.querySelector('citadel-element') as HTMLElement & { shadowRoot: ShadowRoot | null };
    expect(citadelA).toBeTruthy();
    expect(citadelB).toBeTruthy();

    const inputA = citadelA.shadowRoot?.querySelector('[data-testid="citadel-command-input"]') as HTMLInputElement;
    expect(inputA).toBeTruthy();

    await act(async () => {
      fireEvent.change(inputA, { target: { value: 'a' } });
      fireEvent.keyDown(inputA, { key: 'Enter' });
    });

    await waitFor(() => {
      expect(handlerA).toHaveBeenCalledTimes(1);
      expect(handlerB).toHaveBeenCalledTimes(0);
    });

    const textB = citadelB.shadowRoot?.textContent ?? '';
    expect(textB).toContain('beta');
    expect(textB).not.toContain('alpha');
  });
});
