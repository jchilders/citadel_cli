# Defining commands

Citadel commands are hierarchical. In the DSL, you write a dot-delimited path such as `user.show`. In the UI, Citadel expands short, unambiguous prefixes into the full command path. For `user.show`, the user can type `us` and Citadel expands it to `user show`.

## Start with the DSL

The main authoring API is the command DSL:

```tsx
import {
  Citadel,
  bool,
  command,
  createCommandRegistry,
  image,
  json,
  text,
} from 'citadel_cli';

const commandRegistry = createCommandRegistry([
  command('user.show')
    .describe('Show one user record')
    .arg('userId', (arg) => arg.describe('The user id to load'))
    .handle(async ({ namedArgs }) =>
      json({
        id: namedArgs.userId,
        name: 'Ada Lovelace',
      }),
    ),

  command('note.add')
    .describe('Create a note')
    .arg('title', (arg) => arg.describe('Short title'))
    .arg('body', (arg) => arg.describe('Longer note body'))
    .handle(async ({ namedArgs, rawArgs, commandPath }) =>
      text(
        `Saved ${commandPath} with title "${namedArgs.title}" and ${rawArgs.length} arguments.`,
      ),
    ),

  command('system.status')
    .describe('Check whether the system is healthy')
    .handle(async () => bool(true, 'healthy', 'unhealthy')),

  command('avatar.random')
    .describe('Show a placeholder image')
    .handle(async () => image('https://picsum.photos/160')),
]);

export function CommandExamples() {
  return <Citadel commandRegistry={commandRegistry} />;
}
```

When users run those commands, they usually enter prefixes rather than the full
expanded command text. For example:

- `user.show` can be entered as `us`
- `note.add` can be entered as `na`
- `system.status` can be entered as `ss`

## Command paths

A path is a sequence of literal words.

- `command('hello')` becomes `hello`
- `command('user.show')` becomes `user show`
- `command('team.member.remove')` becomes `team member remove`

Use short, specific words. Auto-expansion works best when sibling commands diverge early.

## How users enter commands

Users usually do not type the full command text.

- For `hello`, typing `h` expands to `hello`
- For `user.show`, typing `us` expands to `user show`
- For `team.member.remove`, the user types the shortest unambiguous prefix for each segment

Think of the DSL path as the canonical command definition. In the UI, the user typically enters the shortest prefix that uniquely identifies that path.

## Arguments

Add arguments with `.arg(name)`.

```tsx
command('user.show')
  .arg('userId', (arg) => arg.describe('The user id to load'))
  .handle(async ({ namedArgs }) => json({ id: namedArgs.userId }));
```

The argument description is shown in help output.

Arguments can be quoted when they contain spaces. These examples show the fully expanded command text after Citadel has resolved the command prefix:

- `note add "Sprint retro" "Capture follow-up items"`
- `note add 'Sprint retro' 'Capture follow-up items'`

## Handler context

Each handler receives one object:

- `rawArgs`: positional arguments in order
- `namedArgs`: argument values keyed by the names you declared
- `commandPath`: the original dot-delimited path string

Example:

```tsx
command('note.add')
  .arg('title')
  .arg('body')
  .handle(async ({ rawArgs, namedArgs, commandPath }) =>
    text(`${commandPath}: ${namedArgs.title} (${rawArgs.length} args)`),
  );
```

## Result helpers

Handlers should return one of Citadel's result types. These are what is used to determine what is shown in the output console when the handler is done executing. Each `handle` must return one of these:

- `text(value)`
- `json(value)`
- `image(url, altText?)`
- `error(message)`
- `bool(value, trueText?, falseText?)`

Example:

```tsx
command('deploy.check')
  .handle(async () => bool(true, 'ready', 'blocked'));
```

## Default Help Command

By default, Citadel injects a built-in `help` command into the registry. It lists available commands and argument descriptions.

If you want to disable the default help command, set `config.includeHelpCommand` to `false`. See [Configuring Citadel and command history](./04-configuring-citadel-and-command-history.md).

---

Previous: [Installing Citadel in an existing React app](./01-installing-citadel-in-an-existing-react-app.md)

Next: [Embedding Citadel and choosing a display mode](./03-embedding-and-display-modes.md)
