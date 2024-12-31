import { JsonCommandResult, ImageCommandResult, TextCommandResult } from '../src/components/Citadel/types/command-results';

export const commands = {
  'user.show': {
    description: 'Show user details',
    handler: async (args: string[]) => {
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
  'error.timeout': {
    description: 'This command intentionally times out after 11 seconds',
    handler: async (_args: string[]) => {
      // Fake a long-running operation to demo the spinner
      await new Promise(resolve => setTimeout(resolve, 11000));
      return new JsonCommandResult({ });
    }
  },
  'error.raise': {
    description: 'This command intentionally raises an error',
    handler: async (_args: string[]) => {
      throw new Error('This is an intentionally raised error for testing purposes');
    }
  },

  'image.random.picsum': {
    description: 'Get a random image from Picsum Photos',
    handler: async () => {
      return new ImageCommandResult(
        'https://picsum.photos/800/600',
        'Random image from Picsum Photos'
      );
    }
  },
  'image.random.dog': {
    description: 'Get a random dog image',
    handler: async () => {
      const response = await fetch('https://dog.ceo/api/breeds/image/random');
      const data = await response.json();
      return new ImageCommandResult(
        data.message,
        'Random dog image'
      );
    }
  },
  'image.random.cat': {
    description: 'Get a random cat image',
    handler: async () => {
      const response = await fetch('https://api.thecatapi.com/v1/images/search');
      const data = await response.json();
      return new ImageCommandResult(
        data[0].url,
        'Random cat image'
      );
    }
  },
  'cowsay': {
    description: 'Get a cow to say something using cowsay API',
    handler: async (args: string[]) => {
      try {
        const message = args[0];
        const response = await fetch(`/api/cowsay?message=${encodeURIComponent(message)}&format=text`, {
          headers: {
            'Accept': 'text/plain'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('text/plain')) {
          console.error('Unexpected content type:', contentType);
        }
        
        const text = await response.text();
        return new TextCommandResult(text);
      } catch (error) {
        console.error('Cowsay error:', error);
        throw error;
      }
    },
    argument: { name: 'message', description: 'Enter the message for the cow to say' }
  }
};
