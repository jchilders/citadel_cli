import { CommandRegistry } from '../components/Citadel/types/command-registry'
import {
  ImageCommandResult,
  JsonCommandResult,
  TextCommandResult,
} from '../components/Citadel/types/command-results'

/**
 * Build a fresh registry populated with the basic sample commands.
 * Used by the demo app and example bundles.
 */
export function createBasicCommandRegistry(): CommandRegistry {
  const cmdRegistry = new CommandRegistry()

  // User commands
  cmdRegistry.addCommand(
    [
      { type: 'word', name: 'user' },
      { type: 'word', name: 'show' },
      { type: 'argument', name: 'userId', description: 'Enter user ID' },
    ],
    'Show user details',
    async (args: string[]) => {
      await new Promise((resolve) => setTimeout(resolve, 2000))

      return new JsonCommandResult({
        id: args[0],
        name: 'John Doe',
        email: 'john@example.com',
        status: 'active',
      })
    },
  )

  cmdRegistry.addCommand(
    [
      { type: 'word', name: 'user' },
      { type: 'word', name: 'deactivate' },
      { type: 'argument', name: 'userId', description: 'Enter user ID' },
    ],
    'Deactivate user account',
    async (args: string[]) =>
      new JsonCommandResult({
        id: args[0],
        status: 'deactivated',
      }),
  )

  cmdRegistry.addCommand(
    [
      { type: 'word', name: 'user' },
      { type: 'word', name: 'query' },
      { type: 'word', name: 'firstname' },
      { type: 'argument', name: 'firstName', description: 'Enter first name' },
    ],
    'Search by first name',
    async (args: string[]) =>
      new JsonCommandResult({
        users: [
          { id: 1, name: `${args[0]} Smith` },
          { id: 2, name: `${args[0]} Jones` },
        ],
      }),
  )

  cmdRegistry.addCommand(
    [
      { type: 'word', name: 'user' },
      { type: 'word', name: 'query' },
      { type: 'word', name: 'lastname' },
      { type: 'argument', name: 'lastName', description: 'Enter last name' },
    ],
    'Search by last name',
    async (args: string[]) =>
      new JsonCommandResult({
        users: [
          { id: 1, name: `John ${args[0]}` },
          { id: 2, name: `Jane ${args[0]}` },
        ],
      }),
  )

  // Error commands
  cmdRegistry.addCommand(
    [
      { type: 'word', name: 'error' },
      { type: 'word', name: 'timeout' },
    ],
    'This command intentionally times out after 11 seconds',
    async (_args: string[]) => {
      await new Promise((resolve) => setTimeout(resolve, 11000))
      return new JsonCommandResult({ status: 'done' })
    },
  )

  cmdRegistry.addCommand(
    [
      { type: 'word', name: 'error' },
      { type: 'word', name: 'raise' },
    ],
    'This command intentionally raises an error',
    async (_args: string[]) => {
      throw new Error('This is an intentional error')
    },
  )

  cmdRegistry.addCommand(
    [
      { type: 'word', name: 'error' },
      { type: 'word', name: 'returnval' },
    ],
    'This command returns an invalid type',
    // @ts-expect-error - intentionally returning invalid type
    async (_args: string[]) => 'whoops',
  )

  // Image commands
  cmdRegistry.addCommand(
    [
      { type: 'word', name: 'image' },
      { type: 'word', name: 'random' },
      { type: 'word', name: 'picsum' },
    ],
    'Get a random image from Picsum Photos',
    async (_args: string[]) => {
      const width = 400
      const height = 300
      const url = `https://picsum.photos/${width}/${height}`
      return new ImageCommandResult(url)
    },
  )

  cmdRegistry.addCommand(
    [
      { type: 'word', name: 'image' },
      { type: 'word', name: 'random' },
      { type: 'word', name: 'dog' },
    ],
    'Get a random dog image',
    async (_args: string[]) => {
      const response = await fetch('https://dog.ceo/api/breeds/image/random')
      const data = await response.json()
      return new ImageCommandResult(data.message)
    },
  )

  cmdRegistry.addCommand(
    [
      { type: 'word', name: 'image' },
      { type: 'word', name: 'random' },
      { type: 'word', name: 'cat' },
    ],
    'Get a random cat image',
    async (_args: string[]) => {
      const response = await fetch('https://api.thecatapi.com/v1/images/search')
      const data = await response.json()
      return new ImageCommandResult(data[0].url)
    },
  )

  // Cowsay command
  cmdRegistry.addCommand(
    [
      { type: 'word', name: 'cowsay' },
      { type: 'argument', name: 'message', description: 'What should the cow say?' },
    ],
    'Make a cow say something',
    async (args: string[]) => {
      const message = args[0] || 'Moo!'
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
      return new TextCommandResult(bubble + cow)
    },
  )

  // LocalStorage commands
  cmdRegistry.addCommand(
    [
      { type: 'word', name: 'localstorage' },
      { type: 'word', name: 'show' },
    ],
    'Show all items in localStorage',
    async (_args: string[]) => {
      const storage: Record<string, string> = {}
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          storage[key] = localStorage.getItem(key) || ''
        }
      }
      return new JsonCommandResult(storage)
    },
  )

  cmdRegistry.addCommand(
    [
      { type: 'word', name: 'localstorage' },
      { type: 'word', name: 'clear' },
    ],
    'Clear all items from localStorage',
    async (_args: string[]) => {
      localStorage.clear()
      return new TextCommandResult('localStorage cleared')
    },
  )

  cmdRegistry.addCommand(
    [
      { type: 'word', name: 'thing fnord' },
      { type: 'argument', name: 'arg1', description: 'Arg 1' },
      { type: 'word', name: 'thing2' },
    ],
    'Test cmd w/ arg in middle',
    async (args: string[]) => {
      return new TextCommandResult(`args[0]: ${args[0]}`)
    },
  )

  // Command to dynamically add new commands
  cmdRegistry.addCommand(
    [
      { type: 'word', name: 'command' },
      { type: 'word', name: 'add' },
      { type: 'argument', name: 'name', description: 'Name of the command to add' },
    ],
    'Dynamically add a new command',
    async (args: string[]) => {
      const newCommandName = args[0]
      cmdRegistry.addCommand(
        [{ type: 'word', name: newCommandName }],
        `Dynamically added command "${newCommandName}"`,
        async () =>
          new TextCommandResult(`Executed dynamic command "${newCommandName}"`),
      )
      return new TextCommandResult(`Successfully added command "${newCommandName}"`)
    },
  )

  return cmdRegistry
}
