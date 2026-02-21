/* c8 ignore start */
import { CommandRegistry } from '../components/Citadel/types/command-registry'
import { command, createCommandRegistry, image, json, text } from '../components/Citadel/types/command-dsl'

/**
 * Build a fresh registry populated with the basic sample commands.
 * Used by the demo app and example bundles.
 */
export function createBasicCommandRegistry(): CommandRegistry {
  return createCommandRegistry([
    command('user.show')
      .describe('Show user details')
      .arg('userId', (arg) => arg.describe('Enter user ID'))
      .handle(async ({ namedArgs }) => {
        await new Promise((resolve) => setTimeout(resolve, 2000))

        return json({
          id: namedArgs.userId,
          name: 'John Doe',
          email: 'john@example.com',
          status: 'active',
        })
      }),

    command('user.deactivate')
      .describe('Deactivate user account')
      .arg('userId', (arg) => arg.describe('Enter user ID'))
      .handle(async ({ namedArgs }) =>
        json({
          id: namedArgs.userId,
          status: 'deactivated',
        }),
      ),

    command('user.query.firstname')
      .describe('Search by first name')
      .arg('firstName', (arg) => arg.describe('Enter first name'))
      .handle(async ({ namedArgs }) =>
        json({
          users: [
            { id: 1, name: `${namedArgs.firstName} Smith` },
            { id: 2, name: `${namedArgs.firstName} Jones` },
          ],
        }),
      ),

    command('user.query.lastname')
      .describe('Search by last name')
      .arg('lastName', (arg) => arg.describe('Enter last name'))
      .handle(async ({ namedArgs }) =>
        json({
          users: [
            { id: 1, name: `John ${namedArgs.lastName}` },
            { id: 2, name: `Jane ${namedArgs.lastName}` },
          ],
        }),
      ),

    command('error.timeout')
      .describe('This command intentionally times out after 11 seconds')
      .handle(async () => {
        await new Promise((resolve) => setTimeout(resolve, 11000))
        return json({ status: 'done' })
      }),

    command('error.raise')
      .describe('This command intentionally raises an error')
      .handle(async () => {
        throw new Error('This is an intentional error')
      }),

    command('error.returnval')
      .describe('This command returns an invalid type')
      .handle(async () => {
        // Intentionally wrong shape to demonstrate runtime invalid-return handling.
        return 'whoops' as unknown as ReturnType<typeof text>
      }),

    command('image.random.picsum')
      .describe('Get a random image from Picsum Photos')
      .handle(async () => {
        const width = 400
        const height = 300
        const url = `https://picsum.photos/${width}/${height}`
        return image(url)
      }),

    command('image.random.dog')
      .describe('Get a random dog image')
      .handle(async () => {
        const response = await fetch('https://dog.ceo/api/breeds/image/random')
        const data = await response.json()
        return image(data.message)
      }),

    command('image.random.cat')
      .describe('Get a random cat image')
      .handle(async () => {
        const response = await fetch('https://api.thecatapi.com/v1/images/search')
        const data = await response.json()
        return image(data[0].url)
      }),

    command('cowsay')
      .describe('Make a cow say something')
      .arg('message', (arg) => arg.describe('What should the cow say?'))
      .handle(async ({ namedArgs }) => {
        const message = namedArgs.message || 'Moo!'
        const bubbleWidth = message.length + 2
        const bubble = [
          ` ${'_'.repeat(bubbleWidth)} `,
          `< ${message} >`,
          ` ${'-'.repeat(bubbleWidth)} `,
        ].join('\n')
        const cow = `
     \\   ^__^
      \\  (oo)\\_______
         (__)\\       )\\/\\
             ||----w |
             ||     ||`
        return text(bubble + cow)
      }),
  ])
}
/* c8 ignore stop */
