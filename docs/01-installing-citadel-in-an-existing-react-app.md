# Installing Citadel in an existing React app

This is the smallest useful Citadel setup:

- install the package
- registering commands
- rendering the component with `<Citadel />`
- open it with `.` and run the command

One important detail before you start: users usually do not type full command
names. Citadel expands short, unambiguous prefixes into the complete command.
In this first example, the command is `greet`, but the user only needs to type
`g`.

## 1. Installation

```bash
npm i citadel_cli
```

Citadel expects these peer dependencies to already exist in your app:

- `react`
- `react-dom`

## 2. "Hello, world"

Drop this into your app's main component file, e.g. `App.tsx`. This creates a simple command to print "Hello, world!" to the output pane.

```tsx
import { Citadel, command, createCommandRegistry, text } from 'citadel_cli';

const commandRegistry = createCommandRegistry([
  command('greet')
    .describe('Print a greeting.')
    .handle(async () => text('Hello, world!')),
]);

export default function App() {
  return <Citadel commandRegistry={commandRegistry} />;
}
```

What it does:

- `command('greet')` defines a command path
- `.describe(...)` is the text shown by the `help` command
- `.handle(...)` what gets executed when the user hits Enter. This can return plain text, JSON, images, and more. See [Result Helpers](02-defining-commands.md#result-helpers) for a full list.
- `<Citadel commandRegistry={commandRegistry} />` mounts the panel UI into the page

## 3. Run it

Start your app you normally would (`npm run dev`, etc.). Then:

1. Press `.` (period) to open Citadel
2. Type `g`, not the whole word `greet`
3. Citadel auto-expands that to `greet`
4. Press `Enter` to run the command.

You should see `Hello, world!` in the output pane.

That prefix-first workflow is the normal way to use Citadel.

## 4. Adding arguments

Next, let's make our `greet` command accept a name.

```tsx
import { Citadel, command, createCommandRegistry, text } from 'citadel_cli';

const commandRegistry = createCommandRegistry([
  command('greet')
    .describe('Print a greeting.')
    .arg('name', (arg) => arg.describe('Who should be greeted?'))
    .handle(async ({ namedArgs }) => text(`Hello, ${namedArgs.name}!`)),
]);

export default function App() {
  return <Citadel commandRegistry={commandRegistry} />;
}
```

Now the user still opens Citadel the same way:

1. Press `.` to open Citadel
2. Type `g` to expand the command to `greet`
3. Type the name, such as `Ada`
4. Press `Enter`

Citadel should render `Hello, Ada!`.

If the argument contains spaces, the user can quote it:

- `"Ada Lovelace"`
- `'Ada Lovelace'`

## What this example does not cover

This first example skips the rest of the API:

- JSON, image, boolean, and error results
- inline mode
- custom key bindings and storage settings

Continue to [Defining commands](./02-defining-commands.md) for the next layer.

---

Next: [Defining commands](./02-defining-commands.md)
