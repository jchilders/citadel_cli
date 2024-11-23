const config = {
  update: {
    description: "Update the things",
    args: [{ thingId: { description: 'The ID for the thing' }}],
    handler: async (args) => ({
      id: args[0],
      name: `${args[0]} Thing updated`
    })
  },
  unit: {
    description: 'Unit management',
    subcommands: {
      build: {
        description: "Build it",
        args: [{ name: 'unitId', description: 'Enter unit ID'}],
        handler: async (args) => ({
          unitId: args[0],
          name: "La Boca Vista",
          result: "Construction completed"
        })
      },
      demolish: {
        description: "Raze it to the ground",
        args: [{ name: 'unitId', description: 'Enter unit ID'}],
        handler: async (args) => ({
          unitId: args[0],
          name: "La Boca Vista",
          result: "💣 🧨 💥💥💥"
        })
      }
    }
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
              matches: [
                { id: 1234, name: `${args[0]} Jones` },
                { id: 4321, name: `${args[0]} Smith` }]
            })
          },
          lastname: {
            description: 'Search by last name',
            args: [{ name: 'lastName', description: 'Enter last name' }],
            handler: async (args) => ({
              matches: [
                { id: 1234, name: `John ${args[0]}` },
                { id: 4321, name: `Jane ${args[0]}` }]
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
}
