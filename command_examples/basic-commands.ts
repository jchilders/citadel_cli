import { JsonCommandResult } from '../src/components/Citadel/types/command-results';

export const commands = {
  'user.show': {
    // This one is intended to show what happens when a command times out
    description: 'Show user details (will intentionally timeout)',
    handler: async (args: string[]) => {
      await new Promise(resolve => setTimeout(resolve, 11000));
      return new JsonCommandResult({
        id: args[0],
        name: "John Doe",
        email: "john@example.com",
        status: "active"
      });
    },
    argument: { name: 'userId', description: 'Enter user ID' }
  },

  'error.timeout': {
    description: 'A command which will intentionally timeout',
    handler: async (_args: string[]) => {
      await new Promise(resolve => setTimeout(resolve, 11000));
      return new JsonCommandResult({ });
    }
  },

  'user.deactivate': {
    description: 'Deactivate user account',
    handler: async (args: string[]) => new JsonCommandResult({
      id: args[0],
      status: "deactivated"
    }),
    argument: { name: 'userId', description: 'Enter user ID' }
  },

  'user.query.firstname': {
    description: 'Search by first name',
    handler: async (args: string[]) => new JsonCommandResult({
      users: [
        { id: 1, name: `${args[0]} Smith` },
        { id: 2, name: `${args[0]} Jones` }
      ]
    }),
    argument: { name: 'firstName', description: 'Enter first name' }
  },
  'user.query.lastname': {
    description: 'Search by last name',
    handler: async (args: string[]) => new JsonCommandResult({
      users: [
        { id: 1, name: `John ${args[0]}` },
        { id: 2, name: `Jane ${args[0]}` }
      ]
    }),
    argument: { name: 'lastName', description: 'Enter last name' }
  },
  'unit.build': {
    description: 'Build a new unit',
    handler: async (args: string[]) => new JsonCommandResult({
      unitId: args[0],
      name: "La Boca Vista",
      result: "Construction completed"
    }),
    argument: { name: 'unitId', description: 'Enter unit ID' }
  },
  'unit.demolish': {
    description: 'Demolish a unit',
    handler: async (args: string[]) => new JsonCommandResult({
      unitId: args[0],
      name: "La Boca Vista",
      result: "💣 🧨 💥💥💥"
    }),
    argument: { name: 'unitId', description: 'Enter unit ID' }
  },
  'order.create': {
    description: 'Create new order',
    handler: async (args: string[]) => new JsonCommandResult({
      orderId: args[0],
      status: "created"
    }),
    argument: { name: 'orderId', description: 'Enter order ID' }
  },
  'order.close': {
    description: 'Close order',
    handler: async (args: string[]) => new JsonCommandResult({
      orderId: args[0],
      status: "closed"
    }),
    argument: { name: 'orderId', description: 'Enter order ID' }
  }
};
