import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { CommandRegistry } from './components/Citadel/types/command-registry';
import { defaultConfig } from './components/Citadel/config/defaults';
import { CitadelConfig } from './components/Citadel/config/types';

const mockCitadel = vi.fn();
const mockCreateBasicCommandRegistry = vi.fn();
const mockCreateLocalDevCommandRegistry = vi.fn();
const mockCreateDevOpsCommandRegistry = vi.fn();
const mockUseRuntimeConfigDemo = vi.fn();
const mockUseSpreadsheetDemo = vi.fn();
const mockUseHackingSimDemo = vi.fn();
const mockUseStarshipDemo = vi.fn();

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

vi.mock('./examples/localDevCommands', () => ({
  createLocalDevCommandRegistry: () => mockCreateLocalDevCommandRegistry()
}));

vi.mock('./examples/runtimeConfigDemo', () => ({
  useRuntimeConfigDemo: () => mockUseRuntimeConfigDemo()
}));

vi.mock('./examples/spreadsheetDemo', () => ({
  useSpreadsheetDemo: () => mockUseSpreadsheetDemo()
}));

vi.mock('./examples/hackingSimDemo', () => ({
  useHackingSimDemo: () => mockUseHackingSimDemo()
}));

vi.mock('./examples/starshipDemo', () => ({
  useStarshipDemo: () => mockUseStarshipDemo()
}));

const buildStarshipDemo = (registry: CommandRegistry) => ({
  commandRegistry: registry,
  snapshot: {
    systems: [
      { id: 'reactor', label: 'Reactor', online: true, integrity: 100, powered: false, powerDraw: 0 },
      { id: 'shields', label: 'Shields', online: true, integrity: 100, powered: true, powerDraw: 2 },
      { id: 'engines', label: 'Engines', online: true, integrity: 100, powered: false, powerDraw: 3 },
      { id: 'life', label: 'Life Support', online: true, integrity: 100, powered: true, powerDraw: 2 }
    ],
    reactorOutput: 6,
    powerUsed: 4,
    hull: 100,
    alert: 'green',
    shieldsRaised: false,
    jumpCharge: 0,
    cycle: 0,
    ejectArmed: false,
    status: 'active',
    lastEvent: 'Hostiles inbound.'
  }
});

const buildSpreadsheetDemo = (registry: CommandRegistry) => ({
  commandRegistry: registry,
  users: [
    { id: 1, name: 'Ada Lovelace', role: 'admin', status: 'active' },
    { id: 2, name: 'Claude Shannon', role: 'viewer', status: 'away' }
  ],
  totalUsers: 2,
  roleFilter: null,
  sortField: null,
  sortDirection: null
});

describe('App', () => {
  beforeEach(() => {
    mockCitadel.mockClear();
    mockCreateBasicCommandRegistry.mockReset();
    mockCreateLocalDevCommandRegistry.mockReset();
    mockCreateDevOpsCommandRegistry.mockReset();
    mockUseRuntimeConfigDemo.mockReset();
    mockUseSpreadsheetDemo.mockReset();
    mockUseHackingSimDemo.mockReset();
    mockUseHackingSimDemo.mockReturnValue({
      commandRegistry: new CommandRegistry(),
      snapshot: { hosts: [], loot: [], scanned: false, won: false }
    });
    mockUseStarshipDemo.mockReset();
    mockUseStarshipDemo.mockReturnValue(buildStarshipDemo(new CommandRegistry()));
    window.localStorage.clear();
  });

  it('defaults to basic example and passes default config to Citadel', () => {
    const basicRegistry = new CommandRegistry();
    const localDevRegistry = new CommandRegistry();
    const devopsRegistry = new CommandRegistry();
    const runtimeRegistry = new CommandRegistry();
    const runtimeConfig: CitadelConfig = { displayMode: 'inline' };
    mockCreateBasicCommandRegistry.mockReturnValue(basicRegistry);
    mockCreateLocalDevCommandRegistry.mockReturnValue(localDevRegistry);
    mockCreateDevOpsCommandRegistry.mockReturnValue(devopsRegistry);
    mockUseRuntimeConfigDemo.mockReturnValue({
      commandRegistry: runtimeRegistry,
      config: runtimeConfig,
      mode: 'inline'
    });
    mockUseSpreadsheetDemo.mockReturnValue(buildSpreadsheetDemo(new CommandRegistry()));

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
    expect(screen.getByRole('button', { name: /Basic/i })).toBeTruthy();
  });

  it('switches to runtime example via UI and uses runtime config', () => {
    const basicRegistry = new CommandRegistry();
    const localDevRegistry = new CommandRegistry();
    const devopsRegistry = new CommandRegistry();
    const runtimeRegistry = new CommandRegistry();
    const runtimeConfig: CitadelConfig = { displayMode: 'inline' };
    mockCreateBasicCommandRegistry.mockReturnValue(basicRegistry);
    mockCreateLocalDevCommandRegistry.mockReturnValue(localDevRegistry);
    mockCreateDevOpsCommandRegistry.mockReturnValue(devopsRegistry);
    mockUseRuntimeConfigDemo.mockReturnValue({
      commandRegistry: runtimeRegistry,
      config: runtimeConfig,
      mode: 'inline'
    });
    mockUseSpreadsheetDemo.mockReturnValue(buildSpreadsheetDemo(new CommandRegistry()));

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /Runtime Config/i }));

    const calls = mockCitadel.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const props = calls[calls.length - 1][0] as {
      commandRegistry: CommandRegistry;
      config: CitadelConfig;
    };

    expect(props.config).toEqual(runtimeConfig);
    expect(window.localStorage.getItem('citadel-demo-example')).toBe('runtime');
  });

  it('switches to spreadsheet example and renders the team table', () => {
    const spreadsheetRegistry = new CommandRegistry();
    mockCreateBasicCommandRegistry.mockReturnValue(new CommandRegistry());
    mockCreateLocalDevCommandRegistry.mockReturnValue(new CommandRegistry());
    mockCreateDevOpsCommandRegistry.mockReturnValue(new CommandRegistry());
    mockUseRuntimeConfigDemo.mockReturnValue({
      commandRegistry: new CommandRegistry(),
      config: { displayMode: 'inline' },
      mode: 'inline'
    });
    mockUseSpreadsheetDemo.mockReturnValue(buildSpreadsheetDemo(spreadsheetRegistry));

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /Spreadsheet/i }));

    expect(screen.getByText('Team directory')).toBeTruthy();
    expect(screen.getByText('Ada Lovelace')).toBeTruthy();

    const calls = mockCitadel.mock.calls;
    const props = calls[calls.length - 1][0] as {
      commandRegistry: CommandRegistry;
      config: CitadelConfig;
    };
    expect(props.commandRegistry).toBe(spreadsheetRegistry);
    expect(props.config.displayMode).toBe('inline');
    expect(props.config.showOutputPane).toBe(false);
    expect(window.localStorage.getItem('citadel-demo-example')).toBe('spreadsheet');
  });

  it('switches to starship example and renders the bridge dashboard', () => {
    const starshipRegistry = new CommandRegistry();
    mockCreateBasicCommandRegistry.mockReturnValue(new CommandRegistry());
    mockCreateLocalDevCommandRegistry.mockReturnValue(new CommandRegistry());
    mockCreateDevOpsCommandRegistry.mockReturnValue(new CommandRegistry());
    mockUseRuntimeConfigDemo.mockReturnValue({
      commandRegistry: new CommandRegistry(),
      config: { displayMode: 'inline' },
      mode: 'inline'
    });
    mockUseSpreadsheetDemo.mockReturnValue(buildSpreadsheetDemo(new CommandRegistry()));
    mockUseStarshipDemo.mockReturnValue(buildStarshipDemo(starshipRegistry));

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /Starship/i }));

    expect(screen.getByText('Bridge status')).toBeTruthy();
    expect(screen.getByText('Life Support')).toBeTruthy();

    const calls = mockCitadel.mock.calls;
    const props = calls[calls.length - 1][0] as {
      commandRegistry: CommandRegistry;
      config: CitadelConfig;
    };
    expect(props.commandRegistry).toBe(starshipRegistry);
    expect(props.config.displayMode).toBe('inline');
    expect(props.config.showOutputPane).toBe(true);
    expect(window.localStorage.getItem('citadel-demo-example')).toBe('starship');
  });
});
