import { render, act } from '@testing-library/react';
import React from 'react';
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
          config={{ ...defaultConfig, displayMode: 'inline' }}
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
  });
});
