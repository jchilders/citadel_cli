import { JsonCommandResult } from '../src/components/Citadel/types/command-results';

export const commands = {
  ticket: {
    create: {
      description: 'Create a new support ticket',
      handler: async (args: string[]) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return new JsonCommandResult({
          ticketId: Math.floor(Math.random() * 10000),
          customerId: args[0],
          status: 'created',
          timestamp: new Date().toISOString()
        });
      },
      argument: { name: 'customerId', description: 'Customer ID' }
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

  kb: {
    search: {
      description: 'Search knowledge base articles',
      handler: async (args: string[]) => {
        await new Promise(resolve => setTimeout(resolve, 900));
        return new JsonCommandResult({
          query: args[0],
          results: [
            { id: 'KB001', title: 'Getting Started Guide', relevance: 0.95 },
            { id: 'KB015', title: 'Troubleshooting Common Issues', relevance: 0.82 },
            { id: 'KB032', title: 'Advanced Features', relevance: 0.75 }
          ]
        });
      },
      argument: { name: 'query', description: 'Search terms' }
    }
  }
};
