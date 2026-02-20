import { useCallback, useMemo, useState } from 'react';
import { CitadelConfig } from '../components/Citadel/config/types';
import { defaultConfig } from '../components/Citadel/config/defaults';
import { CursorType, DEFAULT_CURSOR_CONFIGS } from '../components/Citadel/types/cursor';
import { CommandRegistry } from '../components/Citadel/types/command-registry';
import { registerRuntimeConfigCommands, type DisplayMode } from './runtimeConfigCommands';

const DEFAULT_CURSOR_TYPE = (defaultConfig.cursorType ?? 'blink') as CursorType;
const DEFAULT_CURSOR_COLOR =
  defaultConfig.cursorColor ?? DEFAULT_CURSOR_CONFIGS[DEFAULT_CURSOR_TYPE].color;
const DEFAULT_MODE: DisplayMode = defaultConfig.displayMode === 'inline' ? 'inline' : 'panel';
const DEFAULT_INCLUDE_HELP = defaultConfig.includeHelpCommand ?? true;

interface UseRuntimeConfigDemoResult {
  commandRegistry: CommandRegistry;
  config: CitadelConfig;
  mode: DisplayMode;
}

export const useRuntimeConfigDemo = (
  options: { initialMode?: DisplayMode; initialIncludeHelp?: boolean } = {}
): UseRuntimeConfigDemoResult => {
  const [mode, setMode] = useState<DisplayMode>(options.initialMode ?? DEFAULT_MODE);
  const [includeHelpCommand, setIncludeHelpCommand] = useState<boolean>(
    options.initialIncludeHelp ?? DEFAULT_INCLUDE_HELP
  );
  const [cursorType, setCursorType] = useState<CursorType>(DEFAULT_CURSOR_TYPE);
  const [cursorColor, setCursorColor] = useState<string>(DEFAULT_CURSOR_COLOR);

  const handleSetCursorType = useCallback((type: CursorType) => {
    setCursorType(type);
  }, []);

  const handleSetCursorColor = useCallback((color: string) => {
    setCursorColor(color);
  }, []);

  const handleSetDisplayMode = useCallback((nextMode: DisplayMode) => {
    setMode(nextMode);
  }, []);

  const handleSetIncludeHelp = useCallback((enabled: boolean) => {
    setIncludeHelpCommand(enabled);
  }, []);

  const resetConfig = useCallback(() => {
    setCursorType(DEFAULT_CURSOR_TYPE);
    setCursorColor(DEFAULT_CURSOR_COLOR);
    setMode(DEFAULT_MODE);
    setIncludeHelpCommand(DEFAULT_INCLUDE_HELP);
  }, []);

  const commandRegistry = useMemo(() => {
    const registry = new CommandRegistry()
    registerRuntimeConfigCommands(registry, {
      setCursorType: handleSetCursorType,
      setCursorColor: handleSetCursorColor,
      setDisplayMode: handleSetDisplayMode,
      setIncludeHelpCommand: handleSetIncludeHelp,
      resetConfig
    });
    return registry;
  }, [
    handleSetCursorType,
    handleSetCursorColor,
    handleSetDisplayMode,
    handleSetIncludeHelp,
    resetConfig
  ]);

  const config = useMemo<CitadelConfig>(() => {
    const defaults = DEFAULT_CURSOR_CONFIGS[cursorType];
    return {
      includeHelpCommand,
      cursorType,
      cursorColor,
      cursorSpeed: defaults.speed,
      displayMode: mode
    };
  }, [cursorColor, cursorType, includeHelpCommand, mode]);

  return {
    commandRegistry,
    config,
    mode
  };
};
