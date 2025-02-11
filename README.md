# Citadel CLI

A hierarchical command-line interface (CLI) for web applications.

Use cases:

- Developers: Perform (multiple) REST API calls & view results, view/modify
  application state at runtime
- Devops: Improve how you interface existing CI/CD web app
- Power users: Provide a hook for advanced users of your internal or external
  apps to quickly perform complex actions

TODO: A gif here showing the CLI in action

A demo is available on [GitHub pages](https://codesandbox.io/p/sandbox/m32qkc).

# Installation

```bash
npm install citadel_cli
```

## Quick Start

In your application:

```typescript

import { Citadel } from "citadel_cli";

const commands = {
  user: {
    show: {
      description: 'Show user details',
      argument: { name: 'userId', description: 'Enter user ID' },
      handler: async (args: string[]) => {
        // Pause to simulate a long request
        await new Promise(resolve => setTimeout(resolve, 2000));

        return new JsonCommandResult({
          id: args[0],
          name: "John Doe",
          email: "john@example.com",
          status: "active"
        });
      },
    },
  }
};

function App() {
  return (
    <>
      <Citadel commands={commands} />
    </>
  );
}
```

Press <kbd>.</kbd> (period) to activate Citadel. The command as defined would render the following:

![Demo of Citadel CLI](https://github.com/user-attachments/assets/b64da0f7-a4a0-4f76-bc03-c0e40c0e14e5)

Note that the exact keys pressed to perform the above were <kbd>us123</kbd>: you only have to press the first letter of each word to advance to the next. 

Each command is composed of:
1. `description`
2. `argument` Optional. One or more arguments, each with a `name` and a `description`
3. A `handler`. Required. The `handler` is what gets executed when you hit Enter, and can be any valid JavaScript. The only requirement is that it must return a `CommandResult` class. At the time of this writing they are `JsonCommandResult`, `TextCommandResult`, `ImageCommandResult`, and `ErrorCommandResult`.

## Configuration

Certain configuration options can be passed to the Citadel component. These are given below along with their default values.

```
const config = {
  commandTimeoutMs: 10000,
  includeHelpCommand: true,
  maxHeight: '80vh',
  initialHeight: '40vh',
  minHeight: '200',
  outputFontSize: '0.875rem',
  resetStateOnHide: false,
  showCitadelKey: '.',
  cursorType: 'bbs', // 'blink', 'spin', 'solid', or 'bbs'
  cursorSpeed: 530,
  storage: {
    type: 'localStorage',
    maxCommands: 100
  }
};
```

Then when you render the component:

```
<Citadel commands={commands} config={config} />
```

## Contributing

Contributions are welcome.

1. Clone the repository:
```bash
git clone https://github.com/jchilders/citadel_cli.git
cd citadel_react
```

2. Install dependencies:
```bash
npm install
```

3. Build the package:
```bash
npm run build
```

4. (Optional but recommended) Link citadel so you can import it into a parallel project
```bash
npm link
```

5. (Optional) From the directory of the project you want to import Citadel into:
```bash
npm link @jchilders/citadel_cli
# ... your normal build/run steps ...
```

Load your appliation and press <kbd>.</kbd>

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
