import { CommandDefinition, command, text } from '../components/Citadel/types/command-dsl';

export type PageTheme = 'dark' | 'light';

export const PAGE_CONTROL_ROLES = ['admin', 'editor', 'viewer'] as const;
export type PageControlRole = (typeof PAGE_CONTROL_ROLES)[number];

export const PAGE_CONTROL_SORT_FIELDS = ['name', 'role', 'status'] as const;
export type PageControlSortField = (typeof PAGE_CONTROL_SORT_FIELDS)[number];

export interface PageControlActions {
  setTheme: (theme: PageTheme) => void;
  filterByRole: (role: PageControlRole) => { shown: number; total: number };
  sortBy: (field: PageControlSortField) => void;
  resetTable: () => { total: number };
  notify: (message: string) => void;
}

export function createPageControlCommandDefinitions(
  actions: PageControlActions
): CommandDefinition[] {
  // Roles and sort fields are word segments (not arguments) so they
  // auto-expand: "u f a" becomes users.filter.admin.
  const definitions = PAGE_CONTROL_ROLES.map((role) =>
    command(`users.filter.${role}`)
      .describe(`Show only teammates with the ${role} role`)
      .handle(async () => {
        const { shown, total } = actions.filterByRole(role);
        return text(`Showing ${shown} of ${total} teammates with role "${role}".`);
      })
  ) as CommandDefinition[];

  definitions.push(
    ...PAGE_CONTROL_SORT_FIELDS.map(
      (field) =>
        command(`users.sort.${field}`)
          .describe(`Sort the team table by ${field}`)
          .handle(async () => {
            actions.sortBy(field);
            return text(`Team table sorted by ${field}.`);
          }) as CommandDefinition
    ),

    command('users.reset')
      .describe('Clear the team table filter and sort')
      .handle(async () => {
        const { total } = actions.resetTable();
        return text(`Showing all ${total} teammates.`);
      }) as CommandDefinition,

    command('theme.light')
      .describe('Switch the demo page to the light theme')
      .handle(async () => {
        actions.setTheme('light');
        return text('Page theme set to "light".');
      }) as CommandDefinition,

    command('theme.dark')
      .describe('Switch the demo page to the dark theme')
      .handle(async () => {
        actions.setTheme('dark');
        return text('Page theme set to "dark".');
      }) as CommandDefinition,

    command('notify')
      .describe('Pop a toast notification on the page')
      .arg('message', (arg) => arg.describe('Text to show in the toast'))
      .handle(async ({ namedArgs }) => {
        const message = (namedArgs.message || '').trim();
        if (!message) {
          throw new Error('Please provide a message, for example "Build finished".');
        }

        actions.notify(message);
        return text('Notification sent.');
      }) as CommandDefinition
  );

  return definitions;
}
