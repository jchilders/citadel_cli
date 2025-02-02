Ok. So one of the major refactorings that has occured is that now each CommandNode has 1 or more segments. The segments correspond to user entry, either a `WordSegment` (such as "user") or a `ArgumentSegment` (such as "userId"). For example, consider the test "prevents input at leaf nodes without handlers or arguments": since the refactoring, there's not really a concept of "leaf nodes", just final segments for a node. CommandInput needs to be reworked to account for these changes.

Consider the following commands:
1. user/:userId/show
2. user/:userId/deactivate
3. help

1. When the CommandInput is empty, the user should be able to press either 'u' or 'h', which will then autocomplete to "user" or "help", respectively. All other input is invalid.
2. After the user selects a command it will autocomplete respectively. In our case, if they hit 'u' then it would autocomplete to 'user ' (with a space). 
3. If the next segment is an argument the user then enters into the `isEnteringArg` state. In our example case, this would happen after they hit 'u'. They are now then able to enter in the argument. All of the following are valid values for the argument, and all should be considered a single value for that argument:
- 1234
- '1234'
- "1234"
- '1234 abcd'
- 'the quick brown fox'
- "something else"
- 道理

In other words: an argument is a string of characters. If an argument contains a space it must be surrounded by single or double quotes. The `isEnteringArg` state is exited when (a) the user enters a space (for unquoted arguments), or (b) the user enters a matching closing quote (for quoted arguments). In other words, for the string `"do you `, the `isEnteringArg` state would be true because there is no closing double quote.

4. Once the user has completed entering in an argument then the value for that argument will need to be stored somewhere for later execution; I do not believe that this is currently being done. The `ArgumentSegment` interface has a `value` attribute that is currently unused; that may be helpful here.

5. The next segment will now be active. In our example above that means they can now enter either 's' or 'd', which would be autocompleted to "show" or "deactivate" respectively. 

6. Once all command node segments are filled (such as "user 12341 show"), then the user may press the Enter key to execute the command. This will result in executing the handler for that node (see `executeCommand` in useCommandParser.ts), and passing it the values for any arguments entered.

This is very different from how CommandInput used to work. Please update it with the above requiremets, taking into account the changes made to CommandTrie, CommandNode, and the various states provided by CitadelState.
