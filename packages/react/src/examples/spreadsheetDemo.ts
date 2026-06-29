import { useCallback, useMemo, useRef, useState } from 'react';
import { CommandRegistry } from '@citadel_cli/core';
import { createCommandRegistry } from '@citadel_cli/core';
import {
  SpreadsheetRole,
  SpreadsheetSortDirection,
  SpreadsheetSortField,
  createSpreadsheetCommandDefinitions,
} from './spreadsheetCommands';

export interface SpreadsheetUser {
  id: number;
  name: string;
  role: SpreadsheetRole;
  status: 'active' | 'away' | 'offline';
}

const TEAM: SpreadsheetUser[] = [
  { id: 1, name: 'Ada Lovelace', role: 'admin', status: 'active' },
  { id: 2, name: 'Grace Hopper', role: 'admin', status: 'away' },
  { id: 3, name: 'Alan Turing', role: 'editor', status: 'active' },
  { id: 4, name: 'Katherine Johnson', role: 'editor', status: 'offline' },
  { id: 5, name: 'Margaret Hamilton', role: 'editor', status: 'active' },
  { id: 6, name: 'Claude Shannon', role: 'viewer', status: 'away' },
  { id: 7, name: 'Barbara Liskov', role: 'viewer', status: 'active' },
];

interface TableSort {
  field: SpreadsheetSortField;
  direction: SpreadsheetSortDirection;
}

interface UseSpreadsheetDemoResult {
  commandRegistry: CommandRegistry;
  users: SpreadsheetUser[];
  totalUsers: number;
  roleFilter: SpreadsheetRole | null;
  sortField: SpreadsheetSortField | null;
  sortDirection: SpreadsheetSortDirection | null;
}

export const useSpreadsheetDemo = (): UseSpreadsheetDemoResult => {
  const [roleFilter, setRoleFilter] = useState<SpreadsheetRole | null>(null);
  const [sort, setSort] = useState<TableSort | null>(null);

  // Read the current filter synchronously so re-applying the same role can
  // toggle it off, without making the callback (and thus the registry) churn.
  const roleFilterRef = useRef<SpreadsheetRole | null>(roleFilter);
  roleFilterRef.current = roleFilter;

  const filterByRole = useCallback((role: SpreadsheetRole) => {
    const cleared = roleFilterRef.current === role;
    setRoleFilter(cleared ? null : role);
    const total = TEAM.length;
    return {
      shown: cleared ? total : TEAM.filter((user) => user.role === role).length,
      total,
      cleared,
    };
  }, []);

  const sortBy = useCallback(
    (field: SpreadsheetSortField, direction: SpreadsheetSortDirection) => {
      setSort({ field, direction });
    },
    []
  );

  const resetTable = useCallback(() => {
    setRoleFilter(null);
    setSort(null);
    return { total: TEAM.length };
  }, []);

  const commandRegistry = useMemo(
    () =>
      createCommandRegistry(
        createSpreadsheetCommandDefinitions({
          filterByRole,
          sortBy,
          resetTable,
        })
      ),
    [filterByRole, sortBy, resetTable]
  );

  const users = useMemo(() => {
    const visible = roleFilter ? TEAM.filter((user) => user.role === roleFilter) : [...TEAM];
    if (sort) {
      visible.sort((a, b) => a[sort.field].localeCompare(b[sort.field]));
      if (sort.direction === 'desc') {
        visible.reverse();
      }
    }
    return visible;
  }, [roleFilter, sort]);

  return {
    commandRegistry,
    users,
    totalUsers: TEAM.length,
    roleFilter,
    sortField: sort?.field ?? null,
    sortDirection: sort?.direction ?? null,
  };
};
