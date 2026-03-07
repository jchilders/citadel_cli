# Using integration recipes

These patterns cover common ways to use Citadel in a real app.

## Call an API and render JSON

```tsx
import { Citadel, command, createCommandRegistry, error, json } from 'citadel_cli';

const commandRegistry = createCommandRegistry([
  command('user.lookup')
    .describe('Load one user from the API')
    .arg('userId', (arg) => arg.describe('The user id to request'))
    .handle(async ({ namedArgs }) => {
      const response = await fetch(`/api/users/${namedArgs.userId}`);

      if (!response.ok) {
        return error(`Request failed with status ${response.status}`);
      }

      return json(await response.json());
    }),
]);

export function ApiRecipeExample() {
  return <Citadel commandRegistry={commandRegistry} />;
}
```

Use this pattern when Citadel acts as a fast in-app API client.

## Trigger app state instead of showing output

Some commands should change the host app instead of rendering a result pane.

```tsx
import { useMemo, useState } from 'react';
import { Citadel, command, createCommandRegistry, text } from 'citadel_cli';

export function ActionOnlyRecipeExample() {
  const [environment, setEnvironment] = useState('staging');

  const commandRegistry = useMemo(
    () =>
      createCommandRegistry([
        command('env.use')
          .describe('Switch the active environment')
          .arg('name', (arg) => arg.describe('The environment name'))
          .handle(async ({ namedArgs }) => {
            setEnvironment(namedArgs.name ?? 'staging');
            return text(`Environment switched to ${namedArgs.name ?? 'staging'}`);
          }),
      ]),
    [],
  );

  return (
    <section>
      <p>Active environment: {environment}</p>
      <Citadel
        commandRegistry={commandRegistry}
        config={{ showOutputPane: false, storage: { type: 'memory', maxCommands: 10 } }}
      />
    </section>
  );
}
```

When you hide the output pane, Citadel still runs the command. It simply stops rendering the history panel.

## Return a quick boolean status

```tsx
import { Citadel, bool, command, createCommandRegistry } from 'citadel_cli';

const commandRegistry = createCommandRegistry([
  command('feature.enabled')
    .describe('Check whether a feature flag is on')
    .handle(async () => bool(true, 'enabled', 'disabled')),
]);

export function BooleanRecipeExample() {
  return <Citadel commandRegistry={commandRegistry} />;
}
```

Boolean results work well for health checks, feature flags, and other yes-or-no checks.

## Rendering an image

```tsx
import { Citadel, command, createCommandRegistry, image } from 'citadel_cli';

const commandRegistry = createCommandRegistry([
  command('avatar.show')
    .describe('Render a profile image')
    .arg('userId', (arg) => arg.describe('The user id to load'))
    .handle(async ({ namedArgs }) =>
      image(`/api/users/${namedArgs.userId}/avatar`, `Avatar for ${namedArgs.userId}`),
    ),
]);

export function ImageRecipeExample() {
  return <Citadel commandRegistry={commandRegistry} />;
}
```

Use image results when the command should render a URL directly in the Citadel output pane.

## General advice

Keep Citadel commands small and composable.

Good uses:

- inspect data that already exists in your app or API
- trigger internal actions that already have a safe implementation
- expose support and operations workflows without adding more page chrome

Avoid putting large business workflows into one command handler. If an operation is complex, keep the command thin and delegate to the same application service your UI already uses.

---

Previous: [Configuring Citadel and command history](./04-configuring-citadel-and-command-history.md)
