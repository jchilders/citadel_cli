import { render, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { PanelController } from '../controllers/PanelController';
import { CitadelConfigProvider } from '../config/CitadelConfigContext';
import { CommandRegistry } from '../types/command-registry';
import { defaultConfig } from '../config/defaults';
import { PANEL_CLOSE_DURATION_MS } from '../hooks/useSlideAnimation';

describe('PanelController', () => {
  const renderPanel = async (configOverrides = {}) => {
    const user = userEvent.setup();
    await act(async () => {
      render(
        <CitadelConfigProvider
          config={{ ...defaultConfig, ...configOverrides }}
          commandRegistry={new CommandRegistry()}
        >
          <PanelController />
        </CitadelConfigProvider>
      );
    });
    return user;
  };

  it('is hidden by default and appears after pressing the activation key', async () => {
    const user = await renderPanel();

    expect(document.querySelector('.panelContainer')).toBeNull();

    await user.keyboard(defaultConfig.showCitadelKey || '.');

    await waitFor(() => {
      expect(document.querySelector('.panelContainer')).not.toBeNull();
    });
  });

  it('starts close animation on Escape and hides after close duration', async () => {
    await act(async () => {
      render(
        <CitadelConfigProvider config={defaultConfig} commandRegistry={new CommandRegistry()}>
          <PanelController />
        </CitadelConfigProvider>
      );
    });

    fireEvent.keyDown(document, { key: defaultConfig.showCitadelKey || '.' });

    await waitFor(() => {
      expect(document.querySelector('.panelContainer')).not.toBeNull();
    });

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      const panel = document.querySelector('.panelContainer');
      expect(panel?.className).toContain('citadel_slideDown');
      expect(panel?.className).not.toContain('citadel_slideUp');
    });

    await new Promise(resolve => setTimeout(resolve, PANEL_CLOSE_DURATION_MS - 40));
    expect(document.querySelector('.panelContainer')).not.toBeNull();

    await waitFor(() => {
      expect(document.querySelector('.panelContainer')).toBeNull();
    });
  });

  it('hides immediately on Escape when prefers-reduced-motion is enabled', async () => {
    const originalMatchMedia = window.matchMedia;
    try {
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      await act(async () => {
        render(
          <CitadelConfigProvider config={defaultConfig} commandRegistry={new CommandRegistry()}>
            <PanelController />
          </CitadelConfigProvider>
        );
      });

      fireEvent.keyDown(document, { key: defaultConfig.showCitadelKey || '.' });
      await waitFor(() => {
        expect(document.querySelector('.panelContainer')).not.toBeNull();
      });

      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(document.querySelector('.panelContainer')).toBeNull();
      });
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });

  it('starts visible when showOnLoad is true', async () => {
    await renderPanel({ showOnLoad: true });

    await waitFor(() => {
      expect(document.querySelector('.panelContainer')).not.toBeNull();
    });
  });

  it('does not close on Escape when closeOnEscape is false', async () => {
    await renderPanel({ showOnLoad: true, closeOnEscape: false });

    await waitFor(() => {
      expect(document.querySelector('.panelContainer')).not.toBeNull();
    });

    fireEvent.keyDown(document, { key: 'Escape' });

    await new Promise(resolve => setTimeout(resolve, PANEL_CLOSE_DURATION_MS + 40));
    const panel = document.querySelector('.panelContainer');
    expect(panel).not.toBeNull();
    expect(panel?.className).not.toContain('citadel_slideDown');
  });
});
