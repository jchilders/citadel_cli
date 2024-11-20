import { CommandConfig } from './types';

export const defaultCommandConfig: CommandConfig = {
  update: {
    description: "Update the things",
    args: [{ name: 'thingId', description: 'The ID for the thing'}],
    handler: async (args) => ({
      id: args[0],
      name: `${args[0]} Thing updated`
    })
  },
  user: {
    description: 'User management',
    subcommands: {
      show: {
        description: 'Show user details',
        args: [{ name: 'userId', description: 'Enter user ID' }],
        handler: async (args) => ({
          id: args[0],
          name: "John Doe",
          email: "john@example.com",
          status: "active"
        })
      },
      deactivate: {
        description: 'Deactivate user account',
        args: [{ name: 'userId', description: 'Enter user ID' }],
        handler: async (args) => ({
          status: "deactivated",
          userId: args[0]
        })
      },
      query: {
        description: 'Search for users',
        subcommands: {
          firstname: {
            description: 'Search by first name',
            args: [{ name: 'firstName', description: 'Enter first name' }],
            handler: async (args) => ({
              matches: [`${args[0]} Smith`, `${args[0]} Jones`]
            })
          },
          lastname: {
            description: 'Search by last name',
            args: [{ name: 'lastName', description: 'Enter last name' }],
            handler: async (args) => ({
              matches: [`John ${args[0]}`, `Jane ${args[0]}`]
            })
          }
        }
      }
    }
  },
  order: {
    description: 'Order management',
    subcommands: {
      show: {
        description: 'Show order details',
        args: [{ name: 'orderId', description: 'Enter order ID' }],
        handler: async (args) => ({
          id: args[0],
          status: "processing",
          total: "$99.99"
        })
      },
      close: {
        description: 'Close order',
        args: [{ name: 'orderId', description: 'Enter order ID' }],
        handler: async (args) => ({
          status: "closed",
          orderId: args[0]
        })
      }
    }
  },
  help: {
    description: 'Show help information',
    handler: async () => ({
      message: "Available commands: update, user, order"
    })
  }
};
