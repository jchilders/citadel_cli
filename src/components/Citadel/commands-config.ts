import { Command } from './types/command';

export const defaultCommandConfig: Command[] = [
  {
    name: "update",
    description: "Update the things",
    args: [{ name: 'thingId', description: 'The ID for the thing' }],
    handler: async (args) => ({
      id: args[0],
      name: `${args[0]} Thing updated`
    })
  },
  {
    name: "unit",
    description: 'Unit management',
    subcommands: [{
      name: "build",
      description: "Build it",
      args: [{ name: 'unitId', description: 'Enter unit ID' }],
      handler: async (args) => ({
        unitId: args[0],
        name: "La Boca Vista",
        result: "Construction completed"
      })
    }, {
      name: "demolish",
      description: "Raze it to the ground",
      args: [{ name: 'unitId', description: 'Enter unit ID' }],
      handler: async (args) => ({
        unitId: args[0],
        name: "La Boca Vista",
        result: "💣 🧨 💥💥💥"
      })
    }]
  }, {
    name: "user",
    description: 'User management',
    subcommands: [{
      name: "show",
      description: 'Show user details',
      args: [{ name: 'userId', description: 'Enter user ID' }],
      handler: async (args) => ({
        id: args[0],
        name: "John Doe",
        email: "john@example.com",
        status: "active"
      })
    }, {
      name: "deactivate",
      description: 'Deactivate user account',
      args: [{ name: 'userId', description: 'Enter user ID' }],
      handler: async (args) => ({
        status: "deactivated",
        userId: args[0]
      })
    }, {
      name: "query",
      description: 'Search for users',
      subcommands: [{
        name: "firstname",
        description: 'Search by first name',
        args: [{ name: 'firstName', description: 'Enter first name' }],
        handler: async (args) => ({
          matches: [
            { id: 1234, name: `${args[0]} Jones` },
            { id: 4321, name: `${args[0]} Smith` }]
        })
      }, {
        name: "lastname",
        description: 'Search by last name',
        args: [{ name: 'lastName', description: 'Enter last name' }],
        handler: async (args) => ({
          matches: [
            { id: 1234, name: `John ${args[0]}` },
            { id: 4321, name: `Jane ${args[0]}` }]
        })
      }]
    }]
  }, {
    name: "order",
    description: 'Order management',
    subcommands: [{
      name: "show",
      description: 'Show order details',
      args: [{ name: 'orderId', description: 'Enter order ID' }],
      handler: async (args) => ({
        id: args[0],
        status: "processing",
        total: "$99.99"
      })
    }, {
      name: "close",
      description: 'Close order',
      args: [{ name: 'orderId', description: 'Enter order ID' }],
      handler: async (args) => ({
        status: "closed",
        orderId: args[0]
      })
    }]
  },
  {
    name: "help",
    description: 'Show help information',
    handler: async () => ({
      message: "Available commands: update, user, order"
    })
  }
];
