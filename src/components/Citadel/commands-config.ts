import { CommandNode, CommandTrie } from './types/command-trie';

// Initialize and configure the command trie
const commandTrie = new CommandTrie();

// User Management Commands
commandTrie.addCommand({
  path: ['user', 'show'],
  description: 'Show user details',
  handler: async (args) => ({
    json: {
      id: args[0],
      name: "John Doe",
      email: "john@example.com",
      status: "active"
    }
  }),
  argument: { name: 'userId', description: 'Enter user ID' }
});

commandTrie.addCommand({
  path: ['user', 'deactivate'],
  description: 'Deactivate user account',
  handler: async (args) => ({
    json: {
      id: args[0],
      status: "deactivated"
    }
  }),
  argument: { name: 'userId', description: 'Enter user ID' }
});

commandTrie.addCommand({
  path: ['user', 'query', 'firstname'],
  description: 'Search by first name',
  handler: async (args) => ({
    json: {
      users: [
        { id: 1, name: `${args[0]} Smith` },
        { id: 2, name: `${args[0]} Jones` }
      ]
    }
  }),
  argument: { name: 'firstName', description: 'Enter first name' }
});

commandTrie.addCommand({
  path: ['user', 'query', 'lastname'],
  description: 'Search by last name',
  handler: async (args) => ({
    json: {
      users: [
        { id: 1, name: `John ${args[0]}` },
        { id: 2, name: `Jane ${args[0]}` }
      ]
    }
  }),
  argument: { name: 'lastName', description: 'Enter last name' }
});

// Unit Management Commands
commandTrie.addCommand({
  path: ['unit', 'build'],
  description: 'Build a new unit',
  handler: async (args) => ({
    json: {
      unitId: args[0],
      name: "La Boca Vista",
      result: "Construction completed"
    }
  }),
  argument: { name: 'unitId', description: 'Enter unit ID' }
});

commandTrie.addCommand({
  path: ['unit', 'demolish'],
  description: 'Demolish a unit',
  handler: async (args) => ({
    json: {
      unitId: args[0],
      name: "La Boca Vista",
      result: "💣 🧨 💥💥💥"
    }
  }),
  argument: { name: 'unitId', description: 'Enter unit ID' }
});

// Order Management Commands
commandTrie.addCommand({
  path: ['order', 'create'],
  description: 'Create new order',
  handler: async (args) => ({
    json: {
      orderId: args[0],
      status: "created"
    }
  }),
  argument: { name: 'orderId', description: 'Enter order ID' }
});

commandTrie.addCommand({
  path: ['order', 'close'],
  description: 'Close order',
  handler: async (args) => ({
    json: {
      orderId: args[0],
      status: "closed"
    }
  }),
  argument: { name: 'orderId', description: 'Enter order ID' }
});

// Help Command
commandTrie.addCommand({
  path: ['help'],
  description: 'Show help information',
  handler: async () => {
    const helpText = commandTrie.getLeafCommands()
      .map(node => `${node.fullPath.join(' ')} - ${node.description}${
        node.argument ? ` <${node.argument.name}>` : ''
      }`)
      .sort()
      .join('\n');

    return { text: helpText };
  }
});

// Validate the command trie
const validation = commandTrie.validate();
if (!validation.isValid) {
  throw new Error(`Invalid command trie configuration:\n${validation.errors.join('\n')}`);
}

export { commandTrie };
