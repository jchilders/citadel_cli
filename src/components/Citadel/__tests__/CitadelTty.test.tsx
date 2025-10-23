import { render, act } from '@testing-library/react';
import React from 'react';
import { CitadelTty } from '../components/CitadelTty';
import { CitadelConfigProvider } from '../config/CitadelConfigContext';
import { CommandRegistry } from '../types/command-registry';
import { createMockCitadelActions, createMockCitadelState } from '../../../__test-utils__/factories';

describe('CitadelTty', () => {
  const renderTty = async () => {
    const state = createMockCitadelState();
    const actions = createMockCitadelActions();
    const outputRef = React.createRef<HTMLDivElement>();

    let result: ReturnType<typeof render>;
    await act(async () => {
      result = render(
        <CitadelConfigProvider commandRegistry={new CommandRegistry()}>
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
});
