The core data structure for this project is a trie. The top level of the hierarchy will be one or more Commands. Each Command can have zero or more Commands under it. If a Command is a leaf then it may have zero or one Arguments. Each leaf is required to have exactly one Handler.

The Handler is a function that will be executed later and return an object of a type which extends from the CommandResult interface, such as JsonCommandResult, TextCommandResult, ImageCommandResult, and so forth.

Commands and Arguments each have required "name" and "description" attributes. The combination of names must be unique across the hierarchy. I.e.: you couldn't have two top level Commands named "user" with no children. It is also invalid to have two leaf Commands with the same name and the same parent Command.

This class should have methods for:

- Adding Commands. An attempt to add a duplicate command is an error.
- Retrieving individual Commands
- A method to validate the trie, similar to the `valid?` method in Rails' ActiveRecord.
- Any other common functions needed for a trie that you can think of.

For now, just create the class for this trie. Do not make any other modifications other than creating the TypeScript interface and class for the Command hierarchy, including the function definitions mentioned above.


Possible new command definition format:

Say wanted a command like this: `user 1234 deduct 123.50`:
```
commandTrie.addCommand({
   path: [
     'user',
     new ParameterNode({ name: 'userId', description: 'User ID' }),
     'deduct',
     new ParameterNode({ name: 'amount', description: 'Amount to deduct' })
   ],
   handler: async (args) => {
     // ...
   }
 });
 ```

Signature to history entry
```
u@d@ -> u~>1234<~d~>123.50<~
```

I would like to add a `set signature` function to the `CommandNode` class in command-trie.ts. It should take a CommandTrie as a parameter and generate (and set) the signature for that command. Example signatures: for the command "user 123 deduct 1234.45" -> "u@d@". Each argument in will be replaced by an @ symbol. Note that this might mean that signatures need to be recalculate as new commands are entered. The subsequent signature for "user 123 draft 1234.45" would be "u@dr@", and the "deduct" signature would become "u@de@".
