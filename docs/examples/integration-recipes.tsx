import { useMemo, useState } from 'react';
import {
  Citadel,
  bool,
  command,
  createCommandRegistry,
  error,
  image,
  json,
  text,
} from 'citadel_cli';

const apiRegistry = createCommandRegistry([
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

const booleanRegistry = createCommandRegistry([
  command('feature.enabled')
    .describe('Check whether a feature flag is on')
    .handle(async () => bool(true, 'enabled', 'disabled')),
]);

const imageRegistry = createCommandRegistry([
  command('avatar.show')
    .describe('Render a profile image')
    .arg('userId', (arg) => arg.describe('The user id to load'))
    .handle(async ({ namedArgs }) =>
      image(`/api/users/${namedArgs.userId}/avatar`, `Avatar for ${namedArgs.userId}`),
    ),
]);

export function ApiRecipeExample() {
  return <Citadel commandRegistry={apiRegistry} />;
}

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

export function BooleanRecipeExample() {
  return <Citadel commandRegistry={booleanRegistry} />;
}

export function ImageRecipeExample() {
  return <Citadel commandRegistry={imageRegistry} />;
}
