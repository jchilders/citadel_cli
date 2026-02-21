import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { CommandRegistry } from './components/Citadel/types/command-registry';
import { defaultConfig } from './components/Citadel/config/defaults';
import { CitadelConfig } from './components/Citadel/config/types';

const mockCitadel = vi.fn();
const mockCreateBasicCommandRegistry = vi.fn();
const mockCreateDevOpsCommandRegistry = vi.fn();
const mockUseRuntimeConfigDemo = vi.fn();

vi.mock('./index', () => ({
  Citadel: (props: unknown) => {
    mockCitadel(props);
    return <div data-testid="citadel-mock" />;
  }
}));

vi.mock('./examples/basicCommands.ts', () => ({
  createBasicCommandRegistry: () => mockCreateBasicCommandRegistry()
}));

vi.mock('./examples/devopsCommands', () => ({
  createDevOpsCommandRegistry: () => mockCreateDevOpsCommandRegistry()
}));

vi.mock('./examples/runtimeConfigDemo', () => ({
  useRuntimeConfigDemo: () => mockUseRuntimeConfigDemo()
}));

describe('App', () => {
  beforeEach(() => {
    mockCitadel.mockClear();
    mockCreateBasicCommandRegistry.mockReset();
    mockCreateDevOpsCommandRegistry.mockReset();
    mockUseRuntimeConfigDemo.mockReset();
    window.localStorage.clear();
  });

  it('defaults to basic example and passes default config to Citadel', () => {
    const basicRegistry = new CommandRegistry();
    const devopsRegistry = new CommandRegistry();
    const runtimeRegistry = new CommandRegistry();
    const runtimeConfig: CitadelConfig = { displayMode: 'inline' };
    mockCreateBasicCommandRegistry.mockReturnValue(basicRegistry);
    mockCreateDevOpsCommandRegistry.mockReturnValue(devopsRegistry);
    mockUseRuntimeConfigDemo.mockReturnValue({
      commandRegistry: runtimeRegistry,
      config: runtimeConfig,
      mode: 'inline'
    });

    render(<App />);

    const calls = mockCitadel.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const props = calls[calls.length - 1][0] as {
      commandRegistry: CommandRegistry;
      config: typeof defaultConfig;
    };

    expect(props.commandRegistry).not.toBeNull();
    expect(props.config).toBe(defaultConfig);
    expect(screen.getByTestId('citadel-mock')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Basic' })).toBeTruthy();
  });

  it('switches to runtime example via UI and uses runtime config', () => {
    const basicRegistry = new CommandRegistry();
    const devopsRegistry = new CommandRegistry();
    const runtimeRegistry = new CommandRegistry();
    const runtimeConfig: CitadelConfig = { displayMode: 'inline' };
    mockCreateBasicCommandRegistry.mockReturnValue(basicRegistry);
    mockCreateDevOpsCommandRegistry.mockReturnValue(devopsRegistry);
    mockUseRuntimeConfigDemo.mockReturnValue({
      commandRegistry: runtimeRegistry,
      config: runtimeConfig,
      mode: 'inline'
    });

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Runtime Config' }));

    const calls = mockCitadel.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const props = calls[calls.length - 1][0] as {
      commandRegistry: CommandRegistry;
      config: CitadelConfig;
    };

    expect(props.config).toEqual(runtimeConfig);
    expect(window.localStorage.getItem('citadel-demo-example')).toBe('runtime');
  });
});
