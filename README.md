# Citadel CLI

A keyboard-first command console for the power users of your web apps.

# Use Cases

- **API Testing & Debugging**: Execute REST calls, inspect responses, and manipulate cookies/localStorage without leaving your
application context
- **Power User Workflows**: Transform repetitive click-through sequences into fast keyboard commands for advanced users
- **DevOps Integration**: Add command-line control to CI/CD dashboards and deployment tools for rapid operations
- **Internal Tool Enhancement**: Give your team's web applications the speed and efficiency of terminal interfaces
- Perform (multiple) REST API calls & view results, view/modify cookies/localstorage. Do JavaScript things without affecting the application.

![Animated screenshot of Citadel CLI](https://github.com/user-attachments/assets/b64da0f7-a4a0-4f76-bc03-c0e40c0e14e5)

# Installation

```bash
npm i citadel_cli
```

## "Hello world" Example

A core concept in Citadel are commands. Commands are things like "user add 1234"
or "qa1 deploy my_feature_branch". To initialize and add commands:

1. Create a `CommandRegistry` instance
2. Add one or more commands to that registry
3. Pass the registry to `Citadel`

```typescript
import {
  Citadel,
  CommandRegistry,
  TextCommandResult,
} from "citadel_cli";

// 1. Create the registry
const registry = new CommandRegistry();

// 2. Add commands
registry.addCommand(
  [
    { type: "word", name: "greet" },
    { type: "argument", name: "name", description: "Who are we greeting?" },
  ],
  "Say hello to someone", // Description used by the built-in `help` command
  async (args: string[]) => new TextCommandResult(`Hello ${args[0]} world!`)
);

// 3. Pass the registry to the component
function App() {
  return <Citadel commandRegistry={registry} />;
}
```

![screenshot_greeting_cmd](https://github.com/user-attachments/assets/a3c1acad-69b3-4079-87af-0425aea3980a)

## Command Expansion

Citadel CLI uses **auto-expansion** to make entering commands as fast as
possible. When you type the first letter of a command it automatically expands
to the full word. For the above example, typing <kbd>g</kbd> would expand
in-place to `greet ` (with a trailing space) whereupon you can enter in a value
for the `name` argument.

## `addCommand` Details

The `addCommand` method has the following signature:

```typescript
addCommand(segments: CommandSegment[], description: string, handler: CommandHandler): void
```

`segments[]` - Each `CommandSegment` in this array consists of a `type` (one of
"word" or "argument"), a `name`, and an optional `description`

`description` - Description of the command itself. Used by the built-in help
command

`handler` - What gets executed when <kbd>Enter</kbd> is pressed. The handler
must return one of the following:

- `TextCommandResult`
- `JsonCommandResult`
- `ImageCommandResult`
- `ErrorCommandResult`

### Arguments

1. Each command can have zero or more arguments
2. Argument values are passed to the handler as a `String[]`
3. Arguments can be single- or double-quoted

### Example Handlers

Clearing localstorage:

```
  async () => {
    localStorage.clear();
    return new TextCommandResult('localStorage cleared!');
  }
```

Make an HTTP POST with a body containing a given `name`:

```
async (args: string[]) => {
  const response = await fetch('https://api.example.com/endpoint', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: args[0] }),
  });
  return new JsonCommandResult(await response.json());
}
```


## Configuration

Certain configuration options can be passed to the Citadel component. These are
given below, along with their default values.

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
  cursorType: 'blink', // 'blink', 'spin', 'solid', or 'bbs'
  cursorSpeed: 530,
  storage: {
    type: 'localStorage',
    maxCommands: 100
  }
};
```

Then to make the component aware of them:

```
<Citadel commandRegistry={cmdRegistry} config={config} />
```

## Contributing

Contributions are welcome.

1. Clone the repository:
```bash
git clone https://github.com/jchilders/citadel_cli.git
cd citadel_cli
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
npm unlink citadel_cli && npm link citadel_cli
# ... your normal dev process ...
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
   npm run test
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
