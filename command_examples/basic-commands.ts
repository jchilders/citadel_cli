import { JsonCommandResult, ImageCommandResult, TextCommandResult } from '../src/components/Citadel/types/command-results';

export const commands = {
  user: {
    show: {
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
    deactivate: {
      description: 'Deactivate user account',
      handler: async (args: string[]) => new JsonCommandResult({
        id: args[0],
        status: "deactivated"
      }),
      argument: { name: 'userId', description: 'Enter user ID' }
    },
    query: {
      firstname: {
        description: 'Search by first name',
        handler: async (args: string[]) => new JsonCommandResult({
          users: [
            { id: 1, name: `${args[0]} Smith` },
            { id: 2, name: `${args[0]} Jones` }
          ]
        }),
        argument: { name: 'firstName', description: 'Enter first name' }
      },
      lastname: {
        description: 'Search by last name',
        handler: async (args: string[]) => new JsonCommandResult({
          users: [
            { id: 1, name: `John ${args[0]}` },
            { id: 2, name: `Jane ${args[0]}` }
          ]
        }),
        argument: { name: 'lastName', description: 'Enter last name' }
      },
    }
  },

  error: {
    timeout: {
      description: 'This command intentionally times out after 11 seconds',
      handler: async (_args: string[]) => {
        await new Promise(resolve => setTimeout(resolve, 11000));
        return new JsonCommandResult({ status: 'done' });
      }
    },
    raise: {
      description: 'This command intentionally raises an error',
      handler: async (_args: string[]) => {
        throw new Error('This is an intentional error');
      }
    },
  },

  image: {
    random: {
      picsum: {
        description: 'Get a random image from Picsum Photos',
        handler: async (_args: string[]) => {
          const width = 400;
          const height = 300;
          const url = `https://picsum.photos/${width}/${height}`;
            return new ImageCommandResult(url);
        }
      },
      dog: {
        description: 'Get a random dog image',
        handler: async (_args: string[]) => {
          const response = await fetch('https://dog.ceo/api/breeds/image/random');
          const data = await response.json();
          return new ImageCommandResult(data.message);
        }
      },
      cat: {
        description: 'Get a random cat image',
        handler: async (_args: string[]) => {
          const response = await fetch('https://api.thecatapi.com/v1/images/search');
          const data = await response.json();
          return new ImageCommandResult(data[0].url);
        }
      },
    },
  },

  cowsay: {
    description: 'Make a cow say something',
    handler: async (args: string[]) => {
      const message = args[0] || 'Moo!';
      const bubbleWidth = message.length + 2;
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
    },
    argument: { name: 'message', description: 'What should the cow say?' }
  },
};
