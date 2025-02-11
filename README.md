# Citadel CLI

A hierarchical command-line interface (CLI) for web applications.

Use cases:

- Developers: Perform (multiple) REST API calls & view results, view/modify
  cookies/localstorage. Do JavaScript things without affecting the application.
- "Poor man's Postman": execute API calls within the context of your application
- Devops: Improve how you interface with your existing CI/CD web app
- Power users: Provide a hook for advanced users of your internal or external
  applications to quickly perform complex actions

![Animated screenshot of Citadel CLI](https://github.com/user-attachments/assets/b64da0f7-a4a0-4f76-bc03-c0e40c0e14e5)

# Installation

```bash
npm install citadel_cli
```

## Quick Start

In your application:

```typescript

import { Citadel } from "citadel_cli";

function App() {
  return (
    <>
      <Citadel />
    </>
  );
}
```

Press <kbd>.</kbd> (period) to activate Citadel.

Now this doesn't do much, yet: it just shows the "help" command. You can
execute it by pressing <kbd>h[Enter]</kbd>. If you do then you should see the
following:

![screenshot_help_cmd](https://github.com/user-attachments/assets/1cc6fd58-7591-45f1-980a-46da15a1843a)

When you execute a command the result is displayed in the output area. It shows
the command that was executed, a timestamp, whether the command succesfully
executed, and the command's output.

Adding your own commands is pretty straightforward. There are three steps to doing so.

1. Create a `CommandRegistry`
2. Add commands to the registry
3. Pass the registry to the `Citadel` component

Let's add a simple `greet` command to demonstrate this. 

```
import { Citadel, CommandRegistry, TextCommandResult } from "citadel_cli";

// 1. Create the registry where your commands will be stored
const cmdRegistry = new CommandRegistry();

// 2. Add a command to the registry. This can be called as many times as you like.
cmdRegistry.addCommand(
  [
    { type: 'word', name: 'greet' },
    { type: 'argument', name: 'name', description: 'Enter your name' }
  ],
  'Say hello to the world', // The description of this command. Used by "help".

  // Next comes the "handler", which is what will get called when the user hits enter.
  // The return type for this handler is `TextCommandResult`. There are other
  // types of command result that we'll cover later.
  async (args: string[]) => new TextCommandResult(`Hello, ${args[0]}!`) 
);
```
The first argument to the `addCommand` function is an array of "command
segments". There are two types of command segments: `word`s and `argument`s.
Here we are defining a command with two segments named `greet` and `name`.
`greet` being a `word` segment and `name` being an `argument`. 

Word segments are autocompleted, whereas argument segments are used to store
user-entered values. 

A few notes on arguments:

1. You can have zero or more arguments in a command, and they can appear in any
   order.
2. The arguments the user enters will be passed to the handler as an array of
   strings.
3. Arguments can be single- or double-quoted. This allows users to enter in
   values that have spaces or other special characters.

Continuing on with our `greet` example, after the segments are defined is a
description ("Say hello..."). This is the text that will be shown by the help
command.

The final argument to `addCommand` is the *handler*. Let's go over that:

```
  async (args: string[]) => new TextCommandResult(`Hello, ${args[0]}!`)
```

As mentioned before this is what will be called after the user hits Enter. The
values for the arguments entered by the user (if any) are passed in to the
handler as `args: string[]`. What you do inside the handler is completely up to
your imagination. For example, say you wanted to clear the localstorage:

```
  async (_args: string[]) => {
    localStorage.clear();
    return new TextCommandResult('localStorage cleared!');
  }
```

Or perhaps make an HTTP POST and return the result as JSON:

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

At the time of this writing the following command result types are available:

- `ErrorCommandResult`
- `ImageCommandResult`
- `JsonCommandResult`
- `TextCommandResult`

Back to our `greeting` command. The final code for it (without comments) should
now look like this:

```
import { CommandRegistry, TextCommandResult } from "citadel_cli";

const cmdRegistry = new CommandRegistry();

cmdRegistry.addCommand(
  [
    { type: 'word', name: 'greet' },
    { type: 'argument', name: 'name', description: 'Enter your name' }
  ],
  'Say hello to the world',
  async (args: string[]) => new TextCommandResult(`Hello, ${args[0]}!`) 
);
```
Now that the command has been added all that is left is to pass the registry to
the `Citadel` component:

```
<Citadel commandRegistry={cmdRegistry} />
```

The result of this should look like this:

![screenshot_greeting_cmd](https://github.com/user-attachments/assets/a3c1acad-69b3-4079-87af-0425aea3980a)

Go forth and make your application experience better!

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
  cursorType: 'bbs', // 'blink', 'spin', 'solid', or 'bbs'
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

