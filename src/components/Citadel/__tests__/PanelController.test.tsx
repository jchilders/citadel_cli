import { render, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { PanelController } from '../controllers/PanelController';
import { CitadelConfigProvider } from '../config/CitadelConfigContext';
import { CommandRegistry } from '../types/command-registry';
import { defaultConfig } from '../config/defaults';

describe('PanelController', () => {
  const renderPanel = async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(
        <CitadelConfigProvider config={defaultConfig} commandRegistry={new CommandRegistry()}>
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
});
