import { describe, expect, it, vi } from 'vitest';
import { TextCommandResult } from '../../components/Citadel/types/command-results';
import {
  createRuntimeConfigCommandDefinitions,
  RuntimeConfigControls
} from '../runtimeConfigCommands';

const createControls = (): RuntimeConfigControls => ({
  setCursorType: vi.fn(),
  setCursorColor: vi.fn(),
  setDisplayMode: vi.fn(),
  setIncludeHelpCommand: vi.fn(),
  toggleOutputPane: vi.fn(),
  setMaxHeight: vi.fn(),
  resetConfig: vi.fn()
});

const getDefinition = (path: string, controls: RuntimeConfigControls) => {
  const definition = createRuntimeConfigCommandDefinitions(controls).find((cmd) => cmd.path === path);
  if (!definition) {
    throw new Error(`Missing command definition for "${path}"`);
  }

  return definition;
};

describe('runtimeConfigCommands', () => {
  it('defines config.maxHeight with an argument', () => {
    const controls = createControls();
    const command = getDefinition('config.maxHeight', controls);

    expect(command.description).toBe('Set the maximum Citadel height');
    expect(command.segments.map((segment) => segment.name)).toEqual(['config', 'maxHeight', 'value']);
  });

  it('normalizes numeric maxHeight input to px', async () => {
    const controls = createControls();
    const command = getDefinition('config.maxHeight', controls);

    const result = await command.handler({
      rawArgs: ['360'],
      namedArgs: { value: '360' },
      commandPath: 'config.maxHeight'
    });

    expect(controls.setMaxHeight).toHaveBeenCalledWith('360px');
    expect(result).toBeInstanceOf(TextCommandResult);
    expect((result as TextCommandResult).text).toContain('360px');
  });

  it('accepts unit-qualified maxHeight input unchanged', async () => {
    const controls = createControls();
    const command = getDefinition('config.maxHeight', controls);

    await command.handler({
      rawArgs: ['70vh'],
      namedArgs: { value: '70vh' },
      commandPath: 'config.maxHeight'
    });

    expect(controls.setMaxHeight).toHaveBeenCalledWith('70vh');
  });

  it('rejects empty maxHeight input', async () => {
    const controls = createControls();
    const command = getDefinition('config.maxHeight', controls);

    await expect(
      command.handler({
        rawArgs: ['   '],
        namedArgs: { value: '   ' },
        commandPath: 'config.maxHeight'
      })
    ).rejects.toThrow('Max height requires a value');
  });

  it('toggles output pane visibility', async () => {
    const controls = createControls();
    const command = getDefinition('outputPane.toggle', controls);

    const result = await command.handler({
      rawArgs: [],
      namedArgs: {},
      commandPath: 'outputPane.toggle'
    });

    expect(controls.toggleOutputPane).toHaveBeenCalledTimes(1);
    expect(result).toBeInstanceOf(TextCommandResult);
    expect((result as TextCommandResult).text).toContain('toggled');
  });
});
