import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Citadel } from './index';
import { createBasicCommandRegistry } from './examples/basicCommands.ts';
import { createDevOpsCommandRegistry } from './examples/devopsCommands';
import { createLocalDevCommandRegistry } from './examples/localDevCommands';
import { defaultConfig } from './components/Citadel/config/defaults';
import { CitadelConfig } from './components/Citadel/config/types';
import { useRuntimeConfigDemo } from './examples/runtimeConfigDemo';
import { useSpreadsheetDemo } from './examples/spreadsheetDemo';
import { useHackingSimDemo } from './examples/hackingSimDemo';
import { useStarshipDemo } from './examples/starshipDemo';
import './App.css';

type ExampleId = 'basic' | 'localdev' | 'devops' | 'spreadsheet' | 'runtime' | 'hacking' | 'starship';

type PageTheme = 'dark' | 'light';

const LIGHT_SCHEME_QUERY = '(prefers-color-scheme: light)';

const getPreferredTheme = (): PageTheme =>
  typeof window !== 'undefined' && window.matchMedia?.(LIGHT_SCHEME_QUERY).matches
    ? 'light'
    : 'dark';

// The demo page follows the OS color-scheme preference.
const usePreferredTheme = (): PageTheme => {
  const [theme, setTheme] = useState<PageTheme>(getPreferredTheme);

  useEffect(() => {
    const mediaQuery = window.matchMedia?.(LIGHT_SCHEME_QUERY);
    if (!mediaQuery?.addEventListener) {
      return;
    }

    const onChange = (event: MediaQueryListEvent) => {
      setTheme(event.matches ? 'light' : 'dark');
    };
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);

  return theme;
};

const EXAMPLE_STORAGE_KEY = 'citadel-demo-example';
const EXAMPLE_LABELS: Record<ExampleId, string> = {
  basic: 'Basic',
  localdev: 'Local Full-Stack',
  devops: 'DevOps',
  spreadsheet: 'Spreadsheet',
  runtime: 'Runtime Config',
  hacking: 'Hacking Sim',
  starship: 'Starship',
};
const EXAMPLE_DESCRIPTIONS: Record<ExampleId, string> = {
  basic: 'A broad starter setup with user operations, error handling, and media output.',
  spreadsheet: 'Commands that drive the team directory on this page — sort it, filter it, reset it. Notice that this tab is configured with the output pane hidden: the table itself is the feedback.',
  localdev: 'A local development setup for API checks, quick DB queries, seeding, and full-stack log inspection.',
  devops: 'An operations-flavored setup focused on deploy, logs, metrics, and infrastructure actions.',
  runtime: 'A live configuration setup that changes Citadel behavior while you use it.',
  hacking: 'A tiny hacking-sim game where the command set grows as you explore the network: scan to find hosts, connect to open a session, exploit to root them and capture loot that unlocks the next target.',
  starship: 'A starship engineering console game. Hostiles are chasing you — balance a limited power budget between shields and the jump drive, repair damage, and charge to 100% to escape before the hull fails. The available commands track the ship’s situation.',
};
const EXAMPLE_HINTS: Record<ExampleId, string> = {
  basic: 'Great first stop to understand command structure and result types.',
  spreadsheet: 'This is the core use case: Citadel as a keyboard-driven control surface for your own app state.',
  localdev: 'The dev-overlay story: ship this in development builds as a quake-style debug console.',
  devops: 'The internal-tools story: operational commands a support or ops team runs all day.',
  runtime: 'Shows Citadel acting as a control surface, not just a command runner.',
  hacking: 'Mostly here to be fun — pop the mainframe and see what happens. (It also quietly shows commands appearing and disappearing as the game state changes.)',
  starship: 'The fullest demo: a live status dashboard the console drives, a real resource-management game loop, and commands that appear and vanish with the ship’s state.',
};
const EXAMPLE_TRY_COMMAND: Record<ExampleId, string> = {
  basic: 'user.show 1234',
  spreadsheet: 'filter.admin',
  localdev: 'localstorage.list',
  devops: 'monitor.metrics',
  runtime: 'display.mode.inline',
  hacking: 'scan',
  starship: 'shields.raise',
};
const EXAMPLE_TRY_KEYS: Record<ExampleId, string> = {
  basic: 'u s 1234',
  spreadsheet: 'f a',
  localdev: 'loc l',
  devops: 'm m',
  runtime: 'd m i',
  hacking: 's',
  starship: 's r',
};
// Render a space-separated key sequence (e.g. "p c l") as individual <kbd> keys,
// matching how the headline try-keys are rendered.
const keySeq = (seq: string): ReactNode =>
  seq.split(' ').map((k, i, arr) => (
    <span key={i}>
      <kbd>{k}</kbd>
      {i < arr.length - 1 && ' '}
    </span>
  ));

const EXAMPLE_TRY_EXPLANATION: Record<ExampleId, ReactNode> = {
  basic: 'Shows a single user result.',
  spreadsheet: (
    <>
      Filters the team table on this page. Then try sort.name.desc ({keySeq('s n d')})
      or reset ({keySeq('r')}).
    </>
  ),
  localdev: 'Lists your browser’s real localStorage — these commands run against live page state.',
  devops: 'Shows a live-style metrics payload.',
  runtime: 'Switches Citadel into inline mode in the page.',
  hacking: (
    <>
      Discovers the DMZ hosts and unlocks a connect.* command for each. Then try
      connect.gateway ({keySeq('c g')}), exploit.gateway ({keySeq('e g')}), and info ({keySeq('i')}).
    </>
  ),
  starship: (
    <>
      Raises shields (damage drops). Then free power with {keySeq('p c l')} (cut
      life support) and route it to engines with {keySeq('p r e')} to charge the
      drive; {keySeq('h')} to ride out cycles, and engage with {keySeq('j e')}{' '}
      once the drive hits 100%.
    </>
  ),
};
const EXAMPLE_SOURCE_URL: Record<ExampleId, string> = {
  basic: 'https://github.com/jchilders/citadel_cli/blob/main/src/examples/basicCommands.ts',
  spreadsheet: 'https://github.com/jchilders/citadel_cli/blob/main/src/examples/spreadsheetCommands.ts',
  localdev: 'https://github.com/jchilders/citadel_cli/blob/main/src/examples/localDevCommands.ts',
  devops: 'https://github.com/jchilders/citadel_cli/blob/main/src/examples/devopsCommands.ts',
  runtime: 'https://github.com/jchilders/citadel_cli/blob/main/src/examples/runtimeConfigDemo.ts',
  hacking: 'https://github.com/jchilders/citadel_cli/blob/main/src/examples/hackingSimDemo.ts',
  starship: 'https://github.com/jchilders/citadel_cli/blob/main/src/examples/starshipDemo.ts',
};

const VALID_EXAMPLE_IDS: ExampleId[] = ['basic', 'localdev', 'devops', 'spreadsheet', 'runtime', 'hacking', 'starship'];

// The spreadsheet tab embeds Citadel inline next to the team table so both
// stay visible while commands run. The output pane is hidden — the table
// itself shows what each command did.
const SPREADSHEET_CONFIG: CitadelConfig = {
  ...defaultConfig,
  displayMode: 'inline',
  showOutputPane: false,
  initialHeight: '120px',
  maxHeight: '120px',
};

// The starship tab also embeds Citadel inline next to its bridge dashboard, but
// keeps the output pane visible — the command narration and the win/lose
// animations are part of the show.
const STARSHIP_CONFIG: CitadelConfig = {
  ...defaultConfig,
  displayMode: 'inline',
  showOutputPane: true,
  initialHeight: '340px',
  maxHeight: '340px',
  // Disable the built-in `help` so it doesn't collide with `hold` on the "h"
  // prefix — the bridge chips and the in-world `info` command cover discovery.
  includeHelpCommand: false,
};

const isExampleId = (value: string): value is ExampleId =>
  VALID_EXAMPLE_IDS.includes(value as ExampleId);

const getInitialExample = (): ExampleId => {
  if (typeof window === 'undefined') {
    return 'basic';
  }

  const stored = window.localStorage.getItem(EXAMPLE_STORAGE_KEY);
  if (stored && isExampleId(stored)) {
    return stored;
  }

  return 'basic';
};

function App() {
  const [selectedExample, setSelectedExample] = useState<ExampleId>(getInitialExample);
  const basicRegistry = useMemo(() => createBasicCommandRegistry(), []);
  const localDevRegistry = useMemo(() => createLocalDevCommandRegistry(), []);
  const devopsRegistry = useMemo(() => createDevOpsCommandRegistry(), []);
  const runtimeDemo = useRuntimeConfigDemo();
  const spreadsheetDemo = useSpreadsheetDemo();
  const hackingDemo = useHackingSimDemo();
  const starshipDemo = useStarshipDemo();
  const theme = usePreferredTheme();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(EXAMPLE_STORAGE_KEY, selectedExample);
    }
  }, [selectedExample]);

  // When the Runtime Config tab switches Citadel to inline mode, the console
  // mounts at the bottom of a page that just grew taller than the viewport —
  // scroll it into view so its input and command chips aren't below the fold.
  const runtimeDisplayMode = runtimeDemo.config.displayMode;
  useEffect(() => {
    if (selectedExample !== 'runtime' || runtimeDisplayMode !== 'inline') {
      return;
    }

    // The custom element mounts and sizes itself asynchronously; give it a
    // beat before scrolling.
    const timer = setTimeout(() => {
      document.querySelector('citadel-element')?.scrollIntoView?.({
        block: 'end',
        behavior: 'smooth',
      });
    }, 120);
    return () => clearTimeout(timer);
  }, [selectedExample, runtimeDisplayMode]);

  const activeBaseRegistry = useMemo(() => {
    if (selectedExample === 'devops') {
      return devopsRegistry;
    }

    if (selectedExample === 'localdev') {
      return localDevRegistry;
    }

    if (selectedExample === 'runtime') {
      return runtimeDemo.commandRegistry;
    }

    if (selectedExample === 'hacking') {
      return hackingDemo.commandRegistry;
    }

    return basicRegistry;
  }, [basicRegistry, localDevRegistry, devopsRegistry, runtimeDemo.commandRegistry, hackingDemo.commandRegistry, selectedExample]);

  const activeConfig = selectedExample === 'runtime' ? runtimeDemo.config : defaultConfig;

  return (
    <div className="demo-page" data-theme={theme}>
      <div className="demo-corner-links">
        <a
          className="demo-docs-link"
          href="https://jchilders.github.io/citadel_cli/docs/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Docs
        </a>
        <a
          className="demo-github-link"
          href="https://github.com/jchilders/citadel_cli"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View citadel_cli on GitHub"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path
              fill="currentColor"
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"
            />
          </svg>
        </a>
      </div>
      <div className="demo-shell">
        <header className="demo-header">
          <div className="demo-brand-wrap">
            <span className="demo-brand">&gt; citadel</span>
          </div>
          <h1 className="demo-title">
            Keyboard-driven command console
            <br />
            <span className="demo-title-sub">for your web app</span>
          </h1>
          <p className="demo-description">
            Built for internal tools, admin panels, and dev overlays: turn
            repetitive operations into a few keystrokes, with results rendered
            inline. Press <kbd>.</kbd> to open it. Each tab is a different
            command registry setup.
          </p>
        </header>

        <main className="demo-card">
          <nav className="demo-tabbar" aria-label="Examples">
            {VALID_EXAMPLE_IDS.map((exampleId) => {
              const isActive = selectedExample === exampleId;
              return (
                <button
                  key={exampleId}
                  type="button"
                  onClick={() => setSelectedExample(exampleId)}
                  className={`demo-tab ${isActive ? 'is-active' : ''}`}
                >
                  {EXAMPLE_LABELS[exampleId]}
                </button>
              );
            })}
          </nav>

          <section className="demo-content">
            <div className="demo-example-info">
              <div className="demo-example-indicator" aria-hidden="true" />
              <div>
                <div className="demo-example-title-row">
                  <p className="demo-example-title">{EXAMPLE_LABELS[selectedExample]}</p>
                  <a
                    href={EXAMPLE_SOURCE_URL[selectedExample]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="demo-source-link"
                  >
                    view source
                  </a>
                </div>
                <p className="demo-example-description">{EXAMPLE_DESCRIPTIONS[selectedExample]}</p>
                <p className="demo-example-hint">{EXAMPLE_HINTS[selectedExample]}</p>
              </div>
            </div>

            <div className="demo-try-box">
              <p className="demo-try-title">
                <span className="demo-try-prefix">&gt;</span> Try it now
              </p>
              <p className="demo-try-copy">
                {selectedExample === 'spreadsheet' || selectedExample === 'starship' ? (
                  <>Click the console below, then type </>
                ) : (
                  <>Press <kbd>.</kbd> to open Citadel, then type </>
                )}
                {keySeq(EXAMPLE_TRY_KEYS[selectedExample])}
                {' '}to auto-expand into{' '}
                <code className="demo-command-code">
                  {EXAMPLE_TRY_COMMAND[selectedExample]}
                </code>
                . {EXAMPLE_TRY_EXPLANATION[selectedExample]}
              </p>
            </div>

            {selectedExample === 'spreadsheet' && (
              <div className="demo-spreadsheet-layout">
                <div className="demo-widget">
                  <div className="demo-widget-header">
                    <p className="demo-widget-title">Team directory</p>
                    <p className="demo-widget-meta">
                      {spreadsheetDemo.users.length} of {spreadsheetDemo.totalUsers} shown
                      {spreadsheetDemo.roleFilter && ` · role: ${spreadsheetDemo.roleFilter}`}
                      {spreadsheetDemo.sortField &&
                        ` · sorted by ${spreadsheetDemo.sortField} ${
                          spreadsheetDemo.sortDirection === 'desc' ? '↓' : '↑'
                        }`}
                    </p>
                  </div>
                  <table className="demo-user-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Role</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {spreadsheetDemo.users.map((user) => (
                        <tr key={user.id}>
                          <td>{user.name}</td>
                          <td>{user.role}</td>
                          <td>
                            <span className={`demo-status demo-status-${user.status}`}>
                              {user.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="demo-inline-host">
                  <Citadel
                    key="spreadsheet"
                    commandRegistry={spreadsheetDemo.commandRegistry}
                    config={SPREADSHEET_CONFIG}
                  />
                </div>
              </div>
            )}

            {selectedExample === 'starship' && (
              <div className="demo-spreadsheet-layout">
                <div className="demo-widget">
                  <div className="demo-widget-header">
                    <p className="demo-widget-title">Bridge status</p>
                    <span className={`bridge-alert bridge-alert-${starshipDemo.snapshot.alert}`}>
                      {starshipDemo.snapshot.alert} alert
                    </span>
                  </div>
                  <div className="bridge-meters">
                    {[
                      {
                        label: 'Hull',
                        value: `${starshipDemo.snapshot.hull}%`,
                        fillClass: `bridge-fill-hull ${starshipDemo.snapshot.hull > 30 ? 'is-ok' : ''}`,
                        pct: starshipDemo.snapshot.hull,
                      },
                      {
                        label: 'Jump drive',
                        value: `${starshipDemo.snapshot.jumpCharge}%`,
                        fillClass: 'bridge-fill-jump',
                        pct: starshipDemo.snapshot.jumpCharge,
                      },
                      {
                        label: 'Power',
                        value: `${starshipDemo.snapshot.powerUsed}/${starshipDemo.snapshot.reactorOutput}`,
                        fillClass: 'bridge-fill-power',
                        pct: starshipDemo.snapshot.reactorOutput
                          ? (starshipDemo.snapshot.powerUsed / starshipDemo.snapshot.reactorOutput) * 100
                          : 0,
                      },
                    ].map((meter) => (
                      <div key={meter.label}>
                        <div className="bridge-meter-label">
                          <span>{meter.label}</span>
                          <span>{meter.value}</span>
                        </div>
                        <div className="bridge-track">
                          <div
                            className={`bridge-fill ${meter.fillClass}`}
                            style={{ width: `${meter.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bridge-grid">
                    {starshipDemo.snapshot.systems.map((sys) => (
                      <div
                        key={sys.id}
                        className={`bridge-system ${sys.online ? '' : 'is-offline'}`}
                      >
                        <div className="bridge-system-head">
                          <span className="bridge-system-name">{sys.label}</span>
                          <span
                            className={`bridge-system-state ${
                              !sys.online ? 'is-offline' : sys.powered ? 'is-powered' : ''
                            }`}
                          >
                            {sys.online ? (sys.powered ? 'powered' : 'standby') : 'offline'}
                          </span>
                        </div>
                        <div className="bridge-track">
                          <div
                            className={`bridge-fill bridge-fill-hull ${
                              sys.integrity > 40 ? 'is-ok' : ''
                            }`}
                            style={{ width: `${sys.integrity}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="bridge-event">
                    cycle {starshipDemo.snapshot.cycle} · {starshipDemo.snapshot.lastEvent}
                  </p>
                </div>
                <div className="demo-inline-host">
                  <Citadel
                    key="starship"
                    commandRegistry={starshipDemo.commandRegistry}
                    config={STARSHIP_CONFIG}
                  />
                </div>
              </div>
            )}
          </section>
        </main>

        <p className="demo-footer-note">
          citadel_cli - a keyboard-driven command surface for React apps
        </p>

        {selectedExample !== 'spreadsheet' && selectedExample !== 'starship' && (
          <Citadel
            key={selectedExample}
            commandRegistry={activeBaseRegistry}
            config={activeConfig}
          />
        )}
      </div>
    </div>
  );
}

export default App;
