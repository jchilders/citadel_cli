import { CommandTrie } from './types/command-trie';

// Initialize and configure the command trie
const commandTrie = new CommandTrie();

// User Management Commands
commandTrie.addCommand(['user', 'show'], 'Show user details', 
  async (args) => ({
    json: {
      id: args[0],
      name: "John Doe",
      email: "john@example.com",
      status: "active"
    }
  }), 
  { name: 'userId', description: 'Enter user ID' }
);

commandTrie.addCommand(['user', 'deactivate'], 'Deactivate user account',
  async (args) => ({
    json: {
      id: args[0],
      status: "deactivated"
    }
  }),
  { name: 'userId', description: 'Enter user ID' }
);

commandTrie.addCommand(['user', 'query', 'firstname'], 'Search by first name',
  async (args) => ({
    json: {
      users: [
        { id: 1, name: `${args[0]} Smith` },
        { id: 2, name: `${args[0]} Jones` }
      ]
    }
  }),
  { name: 'firstName', description: 'Enter first name' }
);

commandTrie.addCommand(['user', 'query', 'lastname'], 'Search by last name',
  async (args) => ({
    json: {
      users: [
        { id: 1, name: `John ${args[0]}` },
        { id: 2, name: `Jane ${args[0]}` }
      ]
    }
  }),
  { name: 'lastName', description: 'Enter last name' }
);

// Unit Management Commands
commandTrie.addCommand(['unit', 'build'], 'Build a new unit',
  async (args) => ({
    json: {
      unitId: args[0],
      name: "La Boca Vista",
      result: "Construction completed"
    }
  }),
  { name: 'unitId', description: 'Enter unit ID' }
);

commandTrie.addCommand(['unit', 'demolish'], 'Demolish a unit',
  async (args) => ({
    json: {
      unitId: args[0],
      name: "La Boca Vista",
      result: "💣 🧨 💥💥💥"
    }
  }),
  { name: 'unitId', description: 'Enter unit ID' }
);

// Order Management Commands
commandTrie.addCommand(['order', 'create'], 'Create new order',
  async (args) => ({
    json: {
      orderId: args[0],
      status: "created"
    }
  }),
  { name: 'orderId', description: 'Enter order ID' }
);

commandTrie.addCommand(['order', 'close'], 'Close order',
  async (args) => ({
    json: {
      orderId: args[0],
      status: "closed"
    }
  }),
  { name: 'orderId', description: 'Enter order ID' }
);

// Help Command
commandTrie.addCommand(['help'], 'Show help information',
  async () => ({
    text: 'Available commands:\n' +
          commandTrie.getAllCommands()
            .map(path => `  ${path.join(' ')}`)
            .join('\n')
  })
);

// Validate the command trie
const validation = commandTrie.validate();
if (!validation.isValid) {
  throw new Error(`Invalid command trie configuration:\n${validation.errors.join('\n')}`);
}

export { commandTrie };
