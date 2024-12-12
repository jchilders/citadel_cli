import { JsonCommandResult, TextCommandResult } from '../src/components/Citadel/types/command-results';

export const commands = {
  'deploy.production': {
    description: 'Deploy to production environment',
    handler: async (args: string[]) => new TextCommandResult(
      `Deploying version ${args[0]} to production...`
    ),
    argument: { name: 'version', description: 'Version to deploy (e.g., 1.2.3)' }
  },

  'deploy.staging': {
    description: 'Deploy to staging environment',
    handler: async (args: string[]) => new TextCommandResult(
      `Deploying version ${args[0]} to staging...`
    ),
    argument: { name: 'version', description: 'Version to deploy (e.g., 1.2.3)' }
  },

  'monitor.logs': {
    description: 'View application logs',
    handler: async () => new TextCommandResult(
      'Fetching latest application logs...'
    )
  },

  'monitor.metrics': {
    description: 'View system metrics',
    handler: async () => new TextCommandResult(
      'Displaying system metrics dashboard...'
    )
  },

  'infra.scale': {
    description: 'Scale infrastructure resources',
    handler: async (args: string[]) => new TextCommandResult(
      `Scaling service to ${args[0]} instances...`
    ),
    argument: { name: 'instances', description: 'Number of instances' }
  }
};
