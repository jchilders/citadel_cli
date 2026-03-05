import { render, act } from '@testing-library/react';
import React from 'react';
import { CitadelTty } from '../components/CitadelTty';
import { CitadelConfigProvider } from '../config/CitadelConfigContext';
import { CommandRegistry } from '../types/command-registry';
import { createMockCitadelActions, createMockCitadelState } from '../../../__test-utils__/factories';
import { defaultConfig } from '../config/defaults';

describe('CitadelTty', () => {
  const renderTty = async (config = defaultConfig) => {
    const state = createMockCitadelState();
    const actions = createMockCitadelActions();
    const outputRef = React.createRef<HTMLDivElement>();

    let result: ReturnType<typeof render>;
    await act(async () => {
      result = render(
        <CitadelConfigProvider config={config} commandRegistry={new CommandRegistry()}>
          <CitadelTty state={state} actions={actions} outputRef={outputRef} />
        </CitadelConfigProvider>
      );
    });
    return result!;
  };

  it('renders the command input and available commands list', async () => {
    const { getByTestId } = await renderTty();

    expect(getByTestId('citadel-command-input')).toBeTruthy();
    expect(getByTestId('available-commands')).toBeTruthy();
  });

  it('clips output pane overflow in inline mode', async () => {
    const { getByTestId } = await renderTty({
      ...defaultConfig,
      displayMode: 'inline',
      maxHeight: '320px'
    });

    const pane = getByTestId('citadel-output-pane') as HTMLDivElement;
    expect(pane.style.overflow).toBe('hidden');
  });

  it('does not render output pane when showOutputPane is false', async () => {
    const { queryByTestId } = await renderTty({
      ...defaultConfig,
      showOutputPane: false
    });

    expect(queryByTestId('citadel-output-pane')).toBeNull();
  });
});
