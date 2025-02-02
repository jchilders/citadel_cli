import { ArgumentSegment, CommandTrie } from '../src/components/Citadel/types/command-trie';
import { JsonCommandResult, ImageCommandResult, TextCommandResult } from '../src/components/Citadel/types/command-results';

export function registerBasicCommands() {
  const trie = new CommandTrie();

  // User commands
  trie.addCommand(
    [
      { type: 'word', name: 'user' },
      { type: 'word', name: 'show' },
      { type: 'argument', name: 'userId', description: 'Enter user ID', required: true }
    ],
    'Show user details',
    async (args: ArgumentSegment[]) => {
      // Simulate a slow API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      return new JsonCommandResult({
        id: args[0],
        name: "John Doe",
        email: "john@example.com",
        status: "active"
      });
    }
  );

  trie.addCommand(
    [
      { type: 'word', name: 'user' },
      { type: 'word', name: 'deactivate' },
      { type: 'argument', name: 'userId', description: 'Enter user ID', required: true }
    ],
    'Deactivate user account',
    async (args: ArgumentSegment[]) => new JsonCommandResult({
      id: args[0],
      status: "deactivated"
    })
  );

  trie.addCommand(
    [
      { type: 'word', name: 'user' },
      { type: 'word', name: 'query' },
      { type: 'word', name: 'firstname' },
      { type: 'argument', name: 'firstName', description: 'Enter first name', required: true }
    ],
    'Search by first name',
    async (args: ArgumentSegment[]) => new JsonCommandResult({
      users: [
        { id: 1, name: `${args[0]} Smith` },
        { id: 2, name: `${args[0]} Jones` }
      ]
    })
  );

  trie.addCommand(
    [
      { type: 'word', name: 'user' },
      { type: 'word', name: 'query' },
      { type: 'word', name: 'lastname' },
      { type: 'argument', name: 'lastName', description: 'Enter last name', required: true }
    ],
    'Search by last name',
    async (args: ArgumentSegment[]) => new JsonCommandResult({
      users: [
        { id: 1, name: `John ${args[0]}` },
        { id: 2, name: `Jane ${args[0]}` }
      ]
    })
  );

  // Error commands
  trie.addCommand(
    [
      { type: 'word', name: 'error' },
      { type: 'word', name: 'timeout' }
    ],
    'This command intentionally times out after 11 seconds',
    async (_args: ArgumentSegment[]) => {
      await new Promise(resolve => setTimeout(resolve, 11000));
      return new JsonCommandResult({ status: 'done' });
    }
  );

  trie.addCommand(
    [
      { type: 'word', name: 'error' },
      { type: 'word', name: 'raise' }
    ],
    'This command intentionally raises an error',
    async (_args: ArgumentSegment[]) => {
      throw new Error('This is an intentional error');
    }
  );

  // Image commands
  trie.addCommand(
    [
      { type: 'word', name: 'image' },
      { type: 'word', name: 'random' },
      { type: 'word', name: 'picsum' }
    ],
    'Get a random image from Picsum Photos',
    async (_args: ArgumentSegment[]) => {
      const width = 400;
      const height = 300;
      const url = `https://picsum.photos/${width}/${height}`;
      return new ImageCommandResult(url);
    }
  );

  trie.addCommand(
    [
      { type: 'word', name: 'image' },
      { type: 'word', name: 'random' },
      { type: 'word', name: 'dog' }
    ],
    'Get a random dog image',
    async (_args: ArgumentSegment[]) => {
      const response = await fetch('https://dog.ceo/api/breeds/image/random');
      const data = await response.json();
      return new ImageCommandResult(data.message);
    }
  );

  trie.addCommand(
    [
      { type: 'word', name: 'image' },
      { type: 'word', name: 'random' },
      { type: 'word', name: 'cat' }
    ],
    'Get a random cat image',
    async (_args: ArgumentSegment[]) => {
      const response = await fetch('https://api.thecatapi.com/v1/images/search');
      const data = await response.json();
      return new ImageCommandResult(data[0].url);
    }
  );

  // Cowsay command
  trie.addCommand(
    [
      { type: 'word', name: 'cowsay' },
      { type: 'argument', name: 'message', description: 'What should the cow say?', required: true }
    ],
    'Make a cow say something',
    async (args: ArgumentSegment[]) => {
      const message = args[0] || 'Moo!';
      const bubbleWidth = message.value.length + 2;
      const bubble = [
        ` ${'_'.repeat(bubbleWidth)} `,
        `< ${message} >`,
        ` ${'-'.repeat(bubbleWidth)} `
      ].join('\n');
      const cow = `
     \\   ^__^
      \\  (oo)\\_______
         (__)\\       )\\/\\
             ||----w |
             ||     ||`;
      return new TextCommandResult(bubble + cow);
    }
  );

  // LocalStorage commands
  trie.addCommand(
    [
      { type: 'word', name: 'localstorage' },
      { type: 'word', name: 'show' }
    ],
    'Show all items in localStorage',
    async (_args: ArgumentSegment[]) => {
      const storage: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          storage[key] = localStorage.getItem(key) || '';
        }
      }
      return new JsonCommandResult(storage);
    }
  );

  trie.addCommand(
    [
      { type: 'word', name: 'localstorage' },
      { type: 'word', name: 'clear' }
    ],
    'Clear all items from localStorage',
    async (_args: ArgumentSegment[]) => {
      localStorage.clear();
      return new TextCommandResult('localStorage cleared');
    }
  );

  return trie;
}
