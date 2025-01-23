In regards to commands, arguments, and their configuration, the current architecture works with the specific case of having one or more "command words" followed up a single argument (userId). What I would like to do is look at the funadmentals of this and rework them.

Here are the new requirements:

1. Commands are composed of a word, followed up by zero or more arguments, and/or zero or more other words. Some examples, where example arguments are of the form "argX":
  help
  cowsay arg1
  user show arg1
  user comment arg1 arg2
  deploy arg1 branch arg2
  - Ex: `deploy prod1 branch main`, where "prod1" and "main" are explicitly typed in by the user
  deploy arg1 status arg2
  - Ex: `deploy prod1 status db1`, where "prod1" and "db1" are explicitly typed in by the user

Children of a command can be EITHER subcommands OR arguments, but not a mixture of both. So for example, the following is INVALID:

```
  parentCommand
  |- arg1
  |- childCommand1
     |- childCommandArg1
```

The following, on the other hand, is VALID:
```
  parentCommand
  |- arg1
    |- childCommand1
       |- childCommand1Arg1
    |- childCommand2
       |- childCommand2Arg1
```

2. Arguments can either be single words/values, or quote separated strings, but are always treated as strings. The following are thus all equivalent:

```
> user comment 1234 "A comment about this user..."
> user comment 1234 'A comment about this user...'
> user comment '1234' 'A comment about this user...'
> user comment "1234" "A comment about this user..."
> user comment "1234" 'A comment about this user...'
> user comment '1234' "A comment about this user..."
```

It is expected that the way commands are added to the trie will be changed, as well as the `CommandNode` object within the trie. Currently commands are given to Citadel.tsx as `Record<string, any>` which are subsequently translated into `CommandDefinition`s ; this will likely need to be adjusted.

```
commandTrie.addCommand({
   path: [
     'user', // CommandWord
     new CommandArgument({ name: 'userId', description: 'User ID' }),
     'deduct', // CommandWord
     new CommandArgument({ name: 'amount', description: 'Amount to deduct' })
   ],
   handler: async (args: string[]) => {
     // 
   },
   description: "This is the text that will show when `help` is executed"
 });
```

3. Existing functionality must be wholly maintained, and it is forbidden to introduce errors. 

4. 
