import { render, act } from '@testing-library/react';
import { InlineController } from '../controllers/InlineController';
import { CitadelConfigProvider } from '../config/CitadelConfigContext';
import { CommandRegistry } from '@citadel_cli/core';
import { defaultConfig } from '../config/defaults';

describe('InlineController', () => {
  const renderInline = async (configOverrides = {}) => {
    let result: ReturnType<typeof render>;
    await act(async () => {
      result = render(
        <CitadelConfigProvider
          config={{ 
            ...defaultConfig, 
            displayMode: 'inline',
            initialHeight: '123px',
            maxHeight: '456px',
            ...configOverrides
          }}
          commandRegistry={new CommandRegistry()}
        >
          <InlineController />
        </CitadelConfigProvider>
      );
    });
    return result!;
  };

  it('renders the TTY immediately', async () => {
    const { getByTestId } = await renderInline();

    expect(getByTestId('citadel-inline-container')).toBeTruthy();
    expect(getByTestId('citadel-command-input')).toBeTruthy();
    const container = getByTestId('citadel-inline-container') as HTMLDivElement;
    expect(container.className).toContain('inlineContainer');
    expect(container.style.height).toBe('123px');
    expect(container.style.maxHeight).toBe('456px');
    expect(container.style.minHeight).toBe('200px');

    const inner = container.querySelector('.innerContainer');
    expect(inner).toBeTruthy();
  });

  it('collapses to compact height when output pane is hidden', async () => {
    const { getByTestId } = await renderInline({ showOutputPane: false });

    const container = getByTestId('citadel-inline-container') as HTMLDivElement;
    expect(container.style.height).toBe('128px');
    expect(container.style.maxHeight).toBe('128px');
    expect(container.style.minHeight).toBe('128px');
  });

  it('focuses the console when the activation key is pressed', async () => {
    const { getByTestId } = await renderInline();
    const input = getByTestId('citadel-command-input') as HTMLInputElement;

    input.blur();
    expect(document.activeElement).not.toBe(input);

    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: '.', bubbles: true }));
    });

    expect(document.activeElement).toBe(input);
  });

  it('honors a configured activation key', async () => {
    const { getByTestId } = await renderInline({ showCitadelKey: '/' });
    const input = getByTestId('citadel-command-input') as HTMLInputElement;

    input.blur();
    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: '/', bubbles: true }));
    });

    expect(document.activeElement).toBe(input);
  });

  it('does not steal focus from another focused field on the page', async () => {
    const { getByTestId } = await renderInline();
    getByTestId('citadel-command-input');

    const other = document.createElement('input');
    document.body.appendChild(other);
    other.focus();
    expect(document.activeElement).toBe(other);

    await act(async () => {
      other.dispatchEvent(new KeyboardEvent('keydown', { key: '.', bubbles: true }));
    });

    expect(document.activeElement).toBe(other);
    other.remove();
  });
});
