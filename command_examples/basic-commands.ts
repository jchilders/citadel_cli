import { JsonCommandResult, ImageCommandResult, TextCommandResult, ErrorCommandResult, TableCommandResult, MarkdownCommandResult, HtmlCommandResult } from '../src/components/Citadel/types/command-results';

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
      const message = encodeURIComponent(args.join(' '));
      const response = await fetch(`/api/cowsay?message=${message}&format=text`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new ErrorCommandResult(`Failed to get cow response (${response.status}) for message: ${message}`);
      }

      const text = await response.text();
      return new TextCommandResult(text);
    },
    argument: { name: 'message', description: 'Enter the message for the cow to say' }
  },
  'display.table': {
    description: 'Display a sample table of user data',
    execute: async () => {
      return new TableCommandResult({
        headers: ['ID', 'Name', 'Email', 'Status'],
        rows: [
          ['1', 'John Doe', 'john@example.com', 'Active'],
          ['2', 'Jane Smith', 'jane@example.com', 'Pending'],
          ['3', 'Bob Wilson', 'bob@example.com', 'Active']
        ]
      });
    }
  },

  'display.markdown': {
    description: 'Display sample markdown content',
    execute: async () => {
      const markdown = `
# Sample Markdown

## Features
- **Bold text** and *italic text*
- Lists and sublists
  - Nested item 1
  - Nested item 2
- [Links](https://example.com)

## Code Example
\`\`\`typescript
const greeting = "Hello, World!";
console.log(greeting);
\`\`\`
`;
      return new MarkdownCommandResult(markdown);
    }
  },

  'display.html': {
    description: 'Display sample HTML content',
    execute: async () => {
      const html = `
<div style="padding: 20px; background-color: #f5f5f5; border-radius: 8px;">
  <h2 style="color: #333;">HTML Example</h2>
  <p style="color: #666;">This is a styled paragraph with custom <span style="color: #007bff;">colors</span> and formatting.</p>
  <button style="padding: 8px 16px; background-color: #28a745; color: white; border: none; border-radius: 4px;">Sample Button</button>
</div>
`;
      return new HtmlCommandResult(html);
    }
  }
};
