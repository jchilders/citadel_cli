import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CommandRegistry } from '../components/Citadel/types/command-registry';
import { createCommandRegistry } from '../components/Citadel/types/command-dsl';
import {
  PageControlRole,
  PageControlSortField,
  PageTheme,
  createPageControlCommandDefinitions,
} from './pageControlCommands';

export interface PageControlUser {
  id: number;
  name: string;
  role: PageControlRole;
  status: 'active' | 'away' | 'offline';
}

const TEAM: PageControlUser[] = [
  { id: 1, name: 'Ada Lovelace', role: 'admin', status: 'active' },
  { id: 2, name: 'Grace Hopper', role: 'admin', status: 'away' },
  { id: 3, name: 'Alan Turing', role: 'editor', status: 'active' },
  { id: 4, name: 'Katherine Johnson', role: 'editor', status: 'offline' },
  { id: 5, name: 'Margaret Hamilton', role: 'editor', status: 'active' },
  { id: 6, name: 'Claude Shannon', role: 'viewer', status: 'away' },
  { id: 7, name: 'Barbara Liskov', role: 'viewer', status: 'active' },
];

const TOAST_DURATION_MS = 4000;

interface UsePageControlDemoResult {
  commandRegistry: CommandRegistry;
  users: PageControlUser[];
  totalUsers: number;
  roleFilter: PageControlRole | null;
  sortField: PageControlSortField | null;
  theme: PageTheme;
  toast: string | null;
}

export const usePageControlDemo = (): UsePageControlDemoResult => {
  const [theme, setTheme] = useState<PageTheme>('dark');
  const [roleFilter, setRoleFilter] = useState<PageControlRole | null>(null);
  const [sortField, setSortField] = useState<PageControlSortField | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
    };
  }, []);

  const notify = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    toastTimer.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }, []);

  const filterByRole = useCallback((role: PageControlRole) => {
    setRoleFilter(role);
    return {
      shown: TEAM.filter((user) => user.role === role).length,
      total: TEAM.length,
    };
  }, []);

  const sortBy = useCallback((field: PageControlSortField) => {
    setSortField(field);
  }, []);

  const resetTable = useCallback(() => {
    setRoleFilter(null);
    setSortField(null);
    return { total: TEAM.length };
  }, []);

  const commandRegistry = useMemo(
    () =>
      createCommandRegistry(
        createPageControlCommandDefinitions({
          setTheme,
          filterByRole,
          sortBy,
          resetTable,
          notify,
        })
      ),
    [filterByRole, sortBy, resetTable, notify]
  );

  const users = useMemo(() => {
    const visible = roleFilter ? TEAM.filter((user) => user.role === roleFilter) : [...TEAM];
    if (sortField) {
      visible.sort((a, b) => a[sortField].localeCompare(b[sortField]));
    }
    return visible;
  }, [roleFilter, sortField]);

  return {
    commandRegistry,
    users,
    totalUsers: TEAM.length,
    roleFilter,
    sortField,
    theme,
    toast,
  };
};
