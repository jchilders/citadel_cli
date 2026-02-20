import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';
import { CommandRegistry } from './components/Citadel/types/command-registry';
import { defaultConfig } from './components/Citadel/config/defaults';

const mockCitadel = vi.fn();
const mockCreateDevOpsCommandRegistry = vi.fn();

vi.mock('./index', () => ({
  Citadel: (props: unknown) => {
    mockCitadel(props);
    return <div data-testid="citadel-mock" />;
  }
}));

vi.mock('./examples/devopsCommands', () => ({
  createDevOpsCommandRegistry: () => mockCreateDevOpsCommandRegistry()
}));

describe('App', () => {
  beforeEach(() => {
    mockCitadel.mockClear();
    mockCreateDevOpsCommandRegistry.mockReset();
  });

  it('passes devops command registry and default config to Citadel', () => {
    const commandRegistry = new CommandRegistry();
    mockCreateDevOpsCommandRegistry.mockReturnValue(commandRegistry);

    render(<App />);

    const calls = mockCitadel.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const props = calls[calls.length - 1][0] as {
      commandRegistry: CommandRegistry;
      config: typeof defaultConfig;
    };

    expect(props.commandRegistry).toBe(commandRegistry);
    expect(props.config).toBe(defaultConfig);
    expect(screen.getByTestId('citadel-mock')).toBeTruthy();
  });
});
