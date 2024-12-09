import { CommandTrie } from '../types/command-trie';

export const createCustomerServiceCommands = () => {
  const commandTrie = new CommandTrie();

  // Ticket Management Commands
  commandTrie.addCommand({
    path: ['ticket', 'create'],
    description: 'Create a new support ticket',
    handler: async (args) => ({
      text: `Creating ticket for customer: ${args[0]}`
    }),
    argument: { name: 'customerId', description: 'Customer ID' }
  });

  commandTrie.addCommand({
    path: ['ticket', 'status'],
    description: 'Check ticket status',
    handler: async (args) => ({
      text: `Retrieving status for ticket: ${args[0]}`
    }),
    argument: { name: 'ticketId', description: 'Ticket ID' }
  });

  // Customer Management Commands
  commandTrie.addCommand({
    path: ['customer', 'info'],
    description: 'View customer information',
    handler: async (args) => ({
      text: `Displaying information for customer: ${args[0]}`
    }),
    argument: { name: 'customerId', description: 'Customer ID' }
  });

  commandTrie.addCommand({
    path: ['customer', 'history'],
    description: 'View customer interaction history',
    handler: async (args) => ({
      text: `Retrieving interaction history for customer: ${args[0]}`
    }),
    argument: { name: 'customerId', description: 'Customer ID' }
  });

  // Knowledge Base Commands
  commandTrie.addCommand({
    path: ['kb', 'search'],
    description: 'Search knowledge base articles',
    handler: async (args) => ({
      text: `Searching knowledge base for: ${args[0]}`
    }),
    argument: { name: 'query', description: 'Search terms' }
  });

  return commandTrie;
};
