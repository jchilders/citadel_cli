import { CommandRegistry } from '../components/Citadel/types/command-registry';
import { TextCommandResult } from '../components/Citadel/types/command-results';
import { CursorType, DEFAULT_CURSOR_CONFIGS } from '../components/Citadel/types/cursor';
import { defaultConfig } from '../components/Citadel/config/defaults';

export type DisplayMode = 'panel' | 'inline';

export const RUNTIME_CONFIG_CURSOR_TYPES: readonly CursorType[] = ['blink', 'spin', 'solid', 'bbs'] as const;

export interface RuntimeConfigControls {
  setCursorType: (type: CursorType) => void;
  setCursorColor: (color: string) => void;
  setDisplayMode: (mode: DisplayMode) => void;
  setIncludeHelpCommand: (enabled: boolean) => void;
  resetConfig: () => void;
}

export function registerRuntimeConfigCommands(
  registry: CommandRegistry,
  controls: RuntimeConfigControls
): void {
  RUNTIME_CONFIG_CURSOR_TYPES.forEach((type) => {
    registry.addCommand(
      [
        { type: 'word', name: 'cursor' },
        { type: 'word', name: 'type' },
        { type: 'word', name: type }
      ],
      `Set the cursor animation style to ${type}`,
      async () => {
        controls.setCursorType(type);
        const defaults = DEFAULT_CURSOR_CONFIGS[type];
        return new TextCommandResult(
          `Cursor type updated to "${type}". Default speed ${defaults.speed}ms.`
        );
      }
    );
  });

  registry.addCommand(
    [
      { type: 'word', name: 'cursor' },
      { type: 'word', name: 'color' },
      {
        type: 'argument',
        name: 'value',
        description: 'CSS color value (e.g., #ff00ff, rgb(255,0,0), or aqua)'
      }
    ],
    'Set the cursor color',
    async (args: string[]) => {
      const [rawColor] = args;
      const color = rawColor?.trim();

      if (!color) {
        throw new Error('Cursor color requires a value, such as "#ff00ff" or "aqua".');
      }

      controls.setCursorColor(color);
      return new TextCommandResult(`Cursor color updated to "${color}".`);
    }
  );

  registry.addCommand(
    [
      { type: 'word', name: 'display', description: "Set the display mode to 'panel' or 'inline'" },
      { type: 'word', name: 'mode' },
      { type: 'word', name: 'panel' }
    ],
    'Switch Citadel to panel mode',
    async () => {
      controls.setDisplayMode('panel');
      return new TextCommandResult('Display mode set to "panel".');
    }
  );

  registry.addCommand(
    [
      { type: 'word', name: 'display', description: "Set the display mode to 'panel' or 'inline'" },
      { type: 'word', name: 'mode' },
      { type: 'word', name: 'inline' }
    ],
    'Switch Citadel to inline mode',
    async () => {
      controls.setDisplayMode('inline');
      return new TextCommandResult('Display mode set to "inline".');
    }
  );

  registry.addCommand(
    [
      { type: 'word', name: 'config' },
      { type: 'word', name: 'help' },
      { type: 'word', name: 'enable' }
    ],
    'Enable the built-in help command',
    async () => {
      controls.setIncludeHelpCommand(true);
      return new TextCommandResult('Help command enabled.');
    }
  );

  registry.addCommand(
    [
      { type: 'word', name: 'config' },
      { type: 'word', name: 'help' },
      { type: 'word', name: 'disable' }
    ],
    'Disable the built-in help command',
    async () => {
      controls.setIncludeHelpCommand(false);
      return new TextCommandResult('Help command disabled.');
    }
  );

  registry.addCommand(
    [{ type: 'word', name: 'reset' }],
    'Reset configuration values back to their defaults',
    async () => {
      controls.resetConfig();
      const baseCursorType = (defaultConfig.cursorType ?? 'blink') as CursorType;
      const defaults = DEFAULT_CURSOR_CONFIGS[baseCursorType];
      const defaultMode = (defaultConfig.displayMode === 'inline' ? 'inline' : 'panel') as DisplayMode;
      const includeHelp = defaultConfig.includeHelpCommand ?? true;
      return new TextCommandResult(
        `Configuration reset. Cursor type "${baseCursorType}" with color "${defaultConfig.cursorColor ?? defaults.color}". ` +
        `Display mode "${defaultMode}". Help command ${includeHelp ? 'enabled' : 'disabled'}.`
      );
    }
  );
}
