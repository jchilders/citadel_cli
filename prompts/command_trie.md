Ok. I think we need to do a serious refactoring. The command hierarchy is too brittle, and there is no easy way to retrieve Commands. I would like to do a broad refactoring so that the commands are stored internally as a prefix tree (trie).

The first step is to create the interface and class for this trie. The top level of the hierarchy will be one or more Commands. Each Command can have zero or more Commands under it. If a Command is a leaf then it may have zero or one Arguments. Each leaf is required to have exactly one Handler.

The Handler is a function that will be executed later and return an object of an appropriately named result class. Initially this will be object will be a simple wrapper around JSON, but it is expected that this will be be extended so that it can handle e.g. text.

Commands and Arguments all have "name" and "description" attributes. The combination of names must be unique across the hierarchy. I.e.: you couldn't have two top level Commands named "user" with no children. It is also invalid to have two leaf Commands with the same name and the same parent Command.

This class should have methods for:

- Adding Commands. An attempt to add a duplicate command is an error.
- Retrieving individual Commands
- A method to validate the trie, similar to the `valid?` method in Rails' ActiveRecord.
- Any other common functions needed for a trie that you can think of.

For now, just create the class for this trie. Do not make any other modifications other than creating the TypeScript interface and class for the Command hierarchy, including the function definitions mentioned above.

