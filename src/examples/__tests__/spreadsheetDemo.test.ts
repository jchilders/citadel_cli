import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useSpreadsheetDemo } from '../spreadsheetDemo';
import { CommandRegistry } from '../../components/Citadel/types/command-registry';

const runCommand = (registry: CommandRegistry, path: string[]) =>
  act(async () => {
    await registry.getCommand(path)?.handler([]);
  });

describe('useSpreadsheetDemo role filter', () => {
  it('toggles the filter off when the same role is applied twice', async () => {
    const { result } = renderHook(() => useSpreadsheetDemo());
    const total = result.current.totalUsers;

    expect(result.current.roleFilter).toBeNull();
    expect(result.current.users).toHaveLength(total);

    await runCommand(result.current.commandRegistry, ['filter', 'admin']);
    expect(result.current.roleFilter).toBe('admin');
    expect(result.current.users.every((u) => u.role === 'admin')).toBe(true);

    // Re-applying the same role clears the filter.
    await runCommand(result.current.commandRegistry, ['filter', 'admin']);
    expect(result.current.roleFilter).toBeNull();
    expect(result.current.users).toHaveLength(total);
  });

  it('switches to a new role rather than toggling when a different role is applied', async () => {
    const { result } = renderHook(() => useSpreadsheetDemo());

    await runCommand(result.current.commandRegistry, ['filter', 'admin']);
    expect(result.current.roleFilter).toBe('admin');

    await runCommand(result.current.commandRegistry, ['filter', 'editor']);
    expect(result.current.roleFilter).toBe('editor');
    expect(result.current.users.every((u) => u.role === 'editor')).toBe(true);
  });
});
