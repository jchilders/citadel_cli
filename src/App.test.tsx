import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';
import { CommandRegistry } from './components/Citadel/types/command-registry';

const mockCitadel = vi.fn();
const mockUseRuntimeConfigDemo = vi.fn();

vi.mock('./index', () => ({
  Citadel: (props: unknown) => {
    mockCitadel(props);
    return <div data-testid="citadel-mock" />;
  }
}));

vi.mock('./examples/runtimeConfigDemo', () => ({
  useRuntimeConfigDemo: () => mockUseRuntimeConfigDemo()
}));

describe('App', () => {
  beforeEach(() => {
    mockCitadel.mockClear();
    mockUseRuntimeConfigDemo.mockReset();
  });

  it('passes both command registry and runtime config to Citadel', () => {
    const commandRegistry = new CommandRegistry();
    const config = {
      cursorColor: 'aqua',
      displayMode: 'panel' as const,
      includeHelpCommand: true
    };

    mockUseRuntimeConfigDemo.mockReturnValue({
      commandRegistry,
      config,
      mode: 'panel'
    });

    render(<App />);

    const calls = mockCitadel.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const props = calls[calls.length - 1][0] as {
      commandRegistry: CommandRegistry;
      config: typeof config;
    };

    expect(props.commandRegistry).toBe(commandRegistry);
    expect(props.config).toBe(config);
    expect(screen.getByTestId('citadel-mock')).toBeTruthy();
  });
});
