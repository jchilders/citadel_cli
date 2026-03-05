import { CommandRegistry } from '../components/Citadel/types/command-registry';
import { CommandDefinition, command, registerCommands, text } from '../components/Citadel/types/command-dsl';
import { CursorType, DEFAULT_CURSOR_CONFIGS } from '../components/Citadel/types/cursor';
import { defaultConfig } from '../components/Citadel/config/defaults';

export type DisplayMode = 'panel' | 'inline';

export const RUNTIME_CONFIG_CURSOR_TYPES: readonly CursorType[] = ['blink', 'spin', 'solid', 'bbs'] as const;

export interface RuntimeConfigControls {
  setCursorType: (type: CursorType) => void;
  setCursorColor: (color: string) => void;
  setDisplayMode: (mode: DisplayMode) => void;
  setIncludeHelpCommand: (enabled: boolean) => void;
  toggleOutputPane: () => void;
  setMaxHeight: (value: string) => void;
  resetConfig: () => void;
}

const normalizeCssLength = (rawValue: string | undefined): string | null => {
  const value = rawValue?.trim();
  if (!value) {
    return null;
  }

  if (/^\d+(\.\d+)?$/.test(value)) {
    return `${value}px`;
  }

  return value;
};

export function registerRuntimeConfigCommands(
  registry: CommandRegistry,
  controls: RuntimeConfigControls
): void {
  registerCommands(registry, createRuntimeConfigCommandDefinitions(controls));
}

export function createRuntimeConfigCommandDefinitions(
  controls: RuntimeConfigControls
): CommandDefinition[] {
  const definitions = RUNTIME_CONFIG_CURSOR_TYPES.map((type) =>
    command(`cursor.type.${type}`)
      .describe(`Set the cursor animation style to ${type}`)
      .handle(async () => {
        controls.setCursorType(type);
        const defaults = DEFAULT_CURSOR_CONFIGS[type];
        return text(`Cursor type updated to "${type}". Default speed ${defaults.speed}ms.`);
      })
  ) as CommandDefinition[];

  definitions.push(
    command('cursor.color')
      .describe('Set the cursor color')
      .arg('value', (arg) =>
        arg.describe('CSS color value (e.g., #ff00ff, rgb(255,0,0), or aqua)')
      )
      .handle(async ({ namedArgs }) => {
        const rawColor = namedArgs.value;
        const color = rawColor?.trim();

        if (!color) {
          throw new Error('Cursor color requires a value, such as "#ff00ff" or "aqua".');
        }

        controls.setCursorColor(color);
        return text(`Cursor color updated to "${color}".`);
      }) as CommandDefinition,

    command('display.mode.panel')
      .describe('Switch Citadel to panel mode')
      .handle(async () => {
        controls.setDisplayMode('panel');
        return text('Display mode set to "panel".');
      }) as CommandDefinition,

    command('display.mode.inline')
      .describe('Switch Citadel to inline mode')
      .handle(async () => {
        controls.setDisplayMode('inline');
        return text('Display mode set to "inline".');
      }) as CommandDefinition,

    command('config.help.enable')
      .describe('Enable the built-in help command')
      .handle(async () => {
        controls.setIncludeHelpCommand(true);
        return text('Help command enabled.');
      }) as CommandDefinition,

    command('config.help.disable')
      .describe('Disable the built-in help command')
      .handle(async () => {
        controls.setIncludeHelpCommand(false);
        return text('Help command disabled.');
      }) as CommandDefinition,

    command('outputPane.toggle')
      .describe('Toggle the output pane visibility')
      .handle(async () => {
        controls.toggleOutputPane();
        return text('Output pane visibility toggled.');
      }) as CommandDefinition,

    command('config.maxHeight')
      .describe('Set the maximum Citadel height')
      .arg('value', (arg) =>
        arg.describe('CSS size (e.g., 360px, 70vh, or 360)')
      )
      .handle(async ({ namedArgs }) => {
        const normalizedValue = normalizeCssLength(namedArgs.value);
        if (!normalizedValue) {
          throw new Error('Max height requires a value, such as "360px" or "70vh".');
        }

        controls.setMaxHeight(normalizedValue);
        return text(`Max height updated to "${normalizedValue}".`);
      }) as CommandDefinition,

    command('reset')
      .describe('Reset configuration values back to their defaults')
      .handle(async () => {
        controls.resetConfig();
        const baseCursorType = (defaultConfig.cursorType ?? 'blink') as CursorType;
        const defaults = DEFAULT_CURSOR_CONFIGS[baseCursorType];
        const defaultMode = (defaultConfig.displayMode === 'inline' ? 'inline' : 'panel') as DisplayMode;
        const includeHelp = defaultConfig.includeHelpCommand ?? true;
        const showOutputPane = defaultConfig.showOutputPane ?? true;
        const defaultMaxHeight = defaultConfig.maxHeight ?? '80vh';
        return text(
          `Configuration reset. Cursor type "${baseCursorType}" with color "${defaultConfig.cursorColor ?? defaults.color}". ` +
          `Display mode "${defaultMode}". Max height "${defaultMaxHeight}". ` +
          `Help command ${includeHelp ? 'enabled' : 'disabled'}. ` +
          `Output pane ${showOutputPane ? 'enabled' : 'disabled'}.`
        );
      }) as CommandDefinition
  );

  return definitions;
}
