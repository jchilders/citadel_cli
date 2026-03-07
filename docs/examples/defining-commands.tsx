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
