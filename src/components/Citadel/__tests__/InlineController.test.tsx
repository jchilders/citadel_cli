import { render, act } from '@testing-library/react';
import { InlineController } from '../controllers/InlineController';
import { CitadelConfigProvider } from '../config/CitadelConfigContext';
import { CommandRegistry } from '../types/command-registry';
import { defaultConfig } from '../config/defaults';

describe('InlineController', () => {
  const renderInline = async () => {
    let result: ReturnType<typeof render>;
    await act(async () => {
      result = render(
        <CitadelConfigProvider
          config={{ 
            ...defaultConfig, 
            displayMode: 'inline',
            initialHeight: '123px',
            maxHeight: '456px'
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
    expect(container.style.height).toBe('');
    expect(container.style.maxHeight).toBe('');

    const inner = container.querySelector('.innerContainer');
    expect(inner).toBeTruthy();
  });
});
