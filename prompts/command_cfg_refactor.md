Currently the configuration for commands looks like this: command_examples/basic_commands.ts

Using the `user.*` commands as examples:

```
  'user.deactivate': {
    description: 'Deactivate user account',
    handler: async (args: string[]) => new JsonCommandResult({
      id: args[0],
      status: "deactivated"
    }),
    argument: { name: 'userId', description: 'Enter user ID' }
  },

  'user.query.firstname': {
    description: 'Search by first name',
    handler: async (args: string[]) => new JsonCommandResult({
      users: [
        { id: 1, name: `${args[0]} Smith` },
        { id: 2, name: `${args[0]} Jones` }
      ]
    }),
    argument: { name: 'firstName', description: 'Enter first name' }
  },
```

I would like to change this to be more hierarchical:
```
user: {
  deactivate: {
     description: ...,
     handler: ...,
     argument: ...
  },
  query: {
     firstname: {
        description: ...,
        handler: ...,
        argument: ...
     }
  }
}
```

Where the structure of the new file is more hierarchical rather than flat like the old one. 

The core files in play are:
- src/components/Citadel/Citadel.tsx - commands are given to this root component from e.g.: App.tsx
- src/components/Citadel/types/command-trie.ts
- src/components/Citadel/config/CitadelConfigContext.tsx - This is where I believe the translation from the new format will need to happen so that it will work with the existing, flat structure. 

Internally it's fine if there is duplication, and that the data is "flat". For example, if you look at src/components/Citadel/types/storage.ts and the StoredCommand interface, the `path` attribute is currently `string[]`. That's fine, and in fact that must *not* be changed. We are only worried about how that command configuration file is loaded, and nothing else. Core functionality MUST remain unchanged, except insofar as what is directly related to loading the command configuration. 

