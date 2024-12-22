import { JsonCommandResult, ImageCommandResult, TextCommandResult, ErrorCommandResult } from '../src/components/Citadel/types/command-results';

export const commands = {
  'user.show': {
    description: 'Show user details',
    execute: async (args: string[]) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return new JsonCommandResult({
        id: args[0],
        name: "John Doe",
        email: "john@example.com",
        status: "active"
      });
    },
    argument: { name: 'userId', description: 'Enter user ID' }
  },

  'user.deactivate': {
    description: 'Deactivate user account',
    execute: async (args: string[]) => new JsonCommandResult({
      id: args[0],
      status: "deactivated"
    }),
    argument: { name: 'userId', description: 'Enter user ID' }
  },

  'user.query.firstname': {
    description: 'Search by first name',
    execute: async (args: string[]) => new JsonCommandResult({
      users: [
        { id: 1, name: `${args[0]} Smith` },
        { id: 2, name: `${args[0]} Jones` }
      ]
    }),
    argument: { name: 'firstName', description: 'Enter first name' }
  },

  'user.query.lastname': {
    description: 'Search by last name',
    execute: async (args: string[]) => new JsonCommandResult({
      users: [
        { id: 1, name: `John ${args[0]}` },
        { id: 2, name: `Jane ${args[0]}` }
      ]
    }),
    argument: { name: 'lastName', description: 'Enter last name' }
  },

  'error.timeout': {
    description: 'This command intentionally times out after 11 seconds',
    execute: async (_args: string[]) => {
      // Just wait for longer than the service timeout
      await new Promise(resolve => setTimeout(resolve, 11000));
      return new TextCommandResult('This should never be seen');
    }
  },

  'error.raise': {
    description: 'This command intentionally raises an error',
    execute: async (_args: string[]) => {
      throw new ErrorCommandResult('This is an intentional error');
    }
  },

  'image.random.picsum': {
    description: 'Get a random image from Picsum Photos',
    execute: async () => {
      const width = 400;
      const height = 300;
      const url = `https://picsum.photos/${width}/${height}`;
      return new ImageCommandResult({ src: url, alt: 'Random image from Picsum Photos' });
    }
  },

  'image.random.dog': {
    description: 'Get a random dog image',
    execute: async () => {
      const response = await fetch('https://dog.ceo/api/breeds/image/random');
      const data = await response.json();
      return new ImageCommandResult({
        src: data.message,
        alt: 'Random dog image'
      });
    }
  },

  'image.random.cat': {
    description: 'Get a random cat image',
    execute: async () => {
      const response = await fetch('https://api.thecatapi.com/v1/images/search');
      const data = await response.json();
      return new ImageCommandResult({
        src: data[0].url,
        alt: 'Random cat image'
      });
    }
  },

  'cowsay': {
    description: 'Get a cow to say something using cowsay API',
    execute: async (args: string[]) => {
      const message = args.join(' ');
      const response = await fetch('https://cowsay.morecode.org/say', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          format: 'text'
        })
      });

      if (!response.ok) {
        throw new ErrorCommandResult('Failed to get cow response');
      }

      const text = await response.text();
      return new TextCommandResult(text);
    },
    argument: { name: 'message', description: 'Enter the message for the cow to say' }
  }
};
