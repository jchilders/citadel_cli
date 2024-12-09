# Citadel

A command line for your webapp.

## Purpose

Citadel aims to simplify the way users interact with web applications by providing a centralized command interface. This interface allows users to quickly access functionality, reducing the need for navigation and improving overall user experience.

## Features

- Quick command interface with real-time suggestions
- Hierarchical command structure with subcommands
- Customizable configuration and theming
- TypeScript support for type safety
- Easy integration with existing React applications
- Built on Vite for fast development and optimal production builds

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/citadel.git
cd citadel
```

2. Install dependencies:
```bash
npm install
```

## Getting Started

To run Citadel locally in development mode:

```bash
npm run dev
```

This will start the development server at `http://localhost:5173`. The app supports hot module replacement (HMR) for quick development iterations.

For production builds:

```bash
npm run build
npm run preview
```

## Customization

### Themes
Citadel supports custom themes through CSS variables. To modify the appearance:

1. Create a new theme file in `src/styles/themes/`
2. Import and apply your theme in `src/styles/main.css`
3. Update theme variables as needed:

```css
:root {
  --primary-color: #your-color;
  --background-color: #your-color;
  --text-color: #your-color;
}
```

### Components
You can customize existing components or add new ones in the `src/components/` directory. Each component should be typed using TypeScript interfaces.

## Configuration

### Basic Configuration

Citadel can be customized through its configuration options. The main configuration options are:

```typescript
{
  resetStateOnEscape: boolean; // Whether to reset the command state when Escape is pressed
  toggleKey: string;          // The key that toggles the Citadel interface (default: '.')
}
```

To customize these options, pass a configuration object when initializing Citadel:

```typescript
import { Citadel } from 'citadel';

<Citadel config={{
  resetStateOnEscape: true,
  toggleKey: '/'
}} />
```

### Command Configuration

Commands in Citadel are organized using a command trie structure, which allows for efficient command lookup and hierarchical organization. Commands are added using the `CommandTrie` class.

Here's how to configure commands:

```typescript
const commandTrie = new CommandTrie();

// Basic command structure:
commandTrie.addCommand(
  ['command', 'subcommand'],  // Command path as array
  'Command description',      // Description shown in UI
  async (args) => {          // Handler function
    // Command implementation
    return {
      json: {                // Return data to display
        // your data here
      }
    };
  },
  { name: 'argName', description: 'Argument description' }  // Command argument (optional)
);
```

#### Command Structure

1. **Command Path**
   - Commands are defined as an array of strings representing the command hierarchy
   - For example, `['user', 'show']` creates a command accessible as "user show"
   - Nested commands like `['user', 'query', 'firstname']` create deeper command structures

2. **Command Description**
   - A string describing what the command does
   - Displayed in the UI to help users understand the command's purpose

3. **Handler Function**
   - An async function that receives command arguments
   - Should return an object with a `json` property containing the data to display
   - The returned data will be rendered in the UI

4. **Command Arguments**
   - Optional argument configuration
   - Specifies the name and description of the argument
   - Arguments are passed to the handler function in order

Example configuration:

```typescript
// User management commands
commandTrie.addCommand(
  ['user', 'show'],
  'Show user details',
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

// Nested command example
commandTrie.addCommand(
  ['user', 'query', 'firstname'],
  'Search by first name',
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
```

## Development

### Project Structure
```
citadel/
├── src/
│   ├── components/    # React components
│   ├── styles/        # CSS and theme files
│   ├── types/         # TypeScript definitions
│   └── utils/         # Utility functions
├── public/            # Static assets
└── vite.config.ts     # Vite configuration
```

### Contributing

We welcome contributions to Citadel! Here's how you can help:

### Bug Reports and Feature Requests

- Use the GitHub Issues section to report bugs or suggest features
- Before creating a new issue, please check if a similar issue already exists
- Provide as much detail as possible in bug reports:
  - Steps to reproduce the issue
  - Expected behavior
  - Actual behavior
  - Browser/environment information
  - Error messages or screenshots if applicable

### Development Process

1. Fork the repository
2. Create a new branch for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bugfix-name
   ```
3. Make your changes
4. Write or update tests as needed
5. Run the test suite to ensure everything passes:
   ```bash
   npm test
   ```
6. Commit your changes with a clear and descriptive commit message
7. Push to your fork and submit a pull request

### Pull Request Guidelines

- Keep your changes focused. Submit separate pull requests for separate features/fixes
- Follow the existing code style and conventions
- Include tests for new functionality
- Update documentation as needed
- Ensure all tests pass
- Describe your changes in detail in the pull request description

### Code Style

- Follow TypeScript best practices
- Use meaningful variable and function names
- Comment complex logic or non-obvious code
- Keep functions focused and modular
- Use consistent formatting (the project uses ESLint and Prettier)

## License

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Citadel is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

This means you can use Citadel in your own projects (commercial or non-commercial) as long as you include the original copyright notice and license terms. The MIT License is simple and permissive, allowing you to:

- Use the code commercially
- Modify the code
- Distribute the code
- Use in private/closed-source projects

All we ask is that you include the original license and copyright notice in any copy or substantial portion of the software.
