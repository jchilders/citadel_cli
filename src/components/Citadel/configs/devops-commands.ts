import { CommandTrie } from '../types/command-trie';

export const createDevOpsCommands = () => {
  const commandTrie = new CommandTrie();

  // Deployment Commands
  commandTrie.addCommand({
    path: ['deploy', 'production'],
    description: 'Deploy to production environment',
    handler: async (args) => ({
      text: `Deploying version ${args[0]} to production...`
    }),
    argument: { name: 'version', description: 'Version to deploy (e.g., 1.2.3)' }
  });

  commandTrie.addCommand({
    path: ['deploy', 'staging'],
    description: 'Deploy to staging environment',
    handler: async (args) => ({
      text: `Deploying version ${args[0]} to staging...`
    }),
    argument: { name: 'version', description: 'Version to deploy (e.g., 1.2.3)' }
  });

  // Monitoring Commands
  commandTrie.addCommand({
    path: ['monitor', 'logs'],
    description: 'View application logs',
    handler: async () => ({
      text: 'Fetching latest application logs...'
    })
  });

  commandTrie.addCommand({
    path: ['monitor', 'metrics'],
    description: 'View system metrics',
    handler: async () => ({
      text: 'Displaying system metrics dashboard...'
    })
  });

  // Infrastructure Commands
  commandTrie.addCommand({
    path: ['infra', 'scale'],
    description: 'Scale infrastructure resources',
    handler: async (args) => ({
      text: `Scaling service to ${args[0]} instances...`
    }),
    argument: { name: 'instances', description: 'Number of instances' }
  });

  return commandTrie;
};
