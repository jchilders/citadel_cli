import { JsonCommandResult } from '../src/components/Citadel/types/command-results';

export const commands = {
  ticket: {
    close: {
      description: 'Close ticket',
      handler: async (args: string[]) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return new JsonCommandResult({
          ticketId: args[0],
          status: 'closed',
          closed_by: 'John C. Agent',
          timestamp: new Date().toISOString()
        });
      },
      argument: { name: 'ticketId', description: 'Ticket ID' }
    },

    status: {
      description: 'Check ticket status',
      handler: async (args: string[]) => {
        await new Promise(resolve => setTimeout(resolve, 800));
        return new JsonCommandResult({
          ticketId: args[0],
          status: 'in_progress',
          assignedTo: 'John Smith',
          lastUpdated: new Date().toISOString()
        });
      },
      argument: { name: 'ticketId', description: 'Ticket ID' }
    },
  },

  customer: {
    info: {
      description: 'View customer information',
      handler: async (args: string[]) => {
        await new Promise(resolve => setTimeout(resolve, 1200));
        return new JsonCommandResult({
          customerId: args[0],
          name: 'Jane Doe',
          email: 'jane.doe@example.com',
          accountType: 'premium',
          joinDate: '2023-01-15'
        });
      },
      argument: { name: 'customerId', description: 'Customer ID' }
    },

    history: {
      description: 'View customer interaction history',
      handler: async (args: string[]) => {
        await new Promise(resolve => setTimeout(resolve, 1500));
        return new JsonCommandResult({
          customerId: args[0],
          interactions: [
            { date: '2024-01-10', type: 'support_call', duration: '15m' },
            { date: '2023-12-28', type: 'email', status: 'resolved' },
            { date: '2023-12-15', type: 'chat', duration: '22m' }
          ]
        });
      },
      argument: { name: 'customerId', description: 'Customer ID' }
    },
  },
};
