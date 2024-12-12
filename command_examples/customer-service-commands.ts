import { JsonCommandResult, TextCommandResult } from '../src/components/Citadel/types/command-results';

const wrapHandler = (handler: (...args: any[]) => Promise<any>) => {
  return async (...args: any[]) => {
    try {
      const result = await handler(...args);
      // If the handler already returns a proper command result, return it
      if (result instanceof JsonCommandResult || result instanceof TextCommandResult) {
        return result;
      }
      // Otherwise wrap it in a JsonCommandResult
      return new JsonCommandResult(result);
    } catch (error) {
      return new JsonCommandResult({
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    }
  };
};

export const commands = {
  'ticket.create': {
    description: 'Create a new support ticket',
    handler: async (args: string[]) => new TextCommandResult(
      `Creating ticket for customer: ${args[0]}`
    ),
    argument: { name: 'customerId', description: 'Customer ID' }
  },

  'ticket.status': {
    description: 'Check ticket status',
    handler: async (args: string[]) => new TextCommandResult(
      `Retrieving status for ticket: ${args[0]}`
    ),
    argument: { name: 'ticketId', description: 'Ticket ID' }
  },

  'customer.info': {
    description: 'View customer information',
    handler: async (args: string[]) => new TextCommandResult(
      `Displaying information for customer: ${args[0]}`
    ),
    argument: { name: 'customerId', description: 'Customer ID' }
  },

  'customer.history': {
    description: 'View customer interaction history',
    handler: async (args: string[]) => new TextCommandResult(
      `Retrieving interaction history for customer: ${args[0]}`
    ),
    argument: { name: 'customerId', description: 'Customer ID' }
  },

  'kb.search': {
    description: 'Search knowledge base articles',
    handler: async (args: string[]) => new TextCommandResult(
      `Searching knowledge base for: ${args[0]}`
    ),
    argument: { name: 'query', description: 'Search terms' }
  }
};
