import { CommandDefinition, command, text } from '../components/Citadel/types/command-dsl';

export const SPREADSHEET_ROLES = ['admin', 'editor', 'viewer'] as const;
export type SpreadsheetRole = (typeof SPREADSHEET_ROLES)[number];

export const SPREADSHEET_SORT_FIELDS = ['name', 'role', 'status'] as const;
export type SpreadsheetSortField = (typeof SPREADSHEET_SORT_FIELDS)[number];

export const SPREADSHEET_SORT_DIRECTIONS = ['asc', 'desc'] as const;
export type SpreadsheetSortDirection = (typeof SPREADSHEET_SORT_DIRECTIONS)[number];

export interface SpreadsheetActions {
  filterByRole: (role: SpreadsheetRole) => { shown: number; total: number; cleared: boolean };
  sortBy: (field: SpreadsheetSortField, direction: SpreadsheetSortDirection) => void;
  resetTable: () => { total: number };
}

export function createSpreadsheetCommandDefinitions(
  actions: SpreadsheetActions
): CommandDefinition[] {
  // Roles, sort fields, and directions are word segments (not arguments) so
  // they auto-expand: "f a" becomes filter.admin, "s n d" becomes
  // sort.name.desc.
  const definitions = SPREADSHEET_ROLES.map((role) =>
    command(`filter.${role}`)
      .describe(`Show only teammates with the ${role} role (run again to clear)`)
      .handle(async () => {
        const { shown, total, cleared } = actions.filterByRole(role);
        if (cleared) {
          return text(`Cleared the "${role}" filter. Showing all ${total} teammates.`);
        }
        return text(`Showing ${shown} of ${total} teammates with role "${role}".`);
      })
  ) as CommandDefinition[];

  definitions.push(
    ...SPREADSHEET_SORT_FIELDS.flatMap((field) =>
      SPREADSHEET_SORT_DIRECTIONS.map(
        (direction) =>
          command(`sort.${field}.${direction}`)
            .describe(
              `Sort the team table by ${field}, ${direction === 'asc' ? 'ascending' : 'descending'}`
            )
            .handle(async () => {
              actions.sortBy(field, direction);
              return text(`Team table sorted by ${field} (${direction}).`);
            }) as CommandDefinition
      )
    ),

    command('reset')
      .describe('Clear the team table filter and sort')
      .handle(async () => {
        const { total } = actions.resetTable();
        return text(`Showing all ${total} teammates.`);
      }) as CommandDefinition
  );

  return definitions;
}
