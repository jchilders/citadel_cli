Add `SegmentStack`. This will store the segments that the user has entered.

+----------------+
+  SegmentStack  +
+----------------+
+
+ clear()
+ push(CommandSegment)
+ pop(): CommandSegment
+ peek(): CommandSegment
+ size(): number
+ isEmpty(): boolean
+ hasArguments: boolean
+ getArguments: ArgumentSegment[]
+ path(): string[]
+ toArray(): CommandSegment[]
+----------------+

I would prefer to avoid having any functions return `undefined`. For the stack-related functions this means the introduction of a "null object" CommandSegment type (`NullSegment`?) to facilitate this.

Because a node on the tree can EITHER be a command OR an argument, that means we can push the argument segment onto the stack, and then use `peek()` to get the description for the placeholder text in `CommandInput`. Pseudocode:
```
if (segmentStack.peek().type === 'argument') {
  placeholderText = segmentStack.peek().description;
}
```

For the placeholder text, `segmentStack.peek()` will only work for ArgumentSegments: WordSegments are either about to be entered or already have been, so we can't add it "before". Also, and more importantly, there CAN be multiple WordSegments at the same level, whereas having multiple different ArgumentSegments at the same level is not accepted/valid.

Add `nextSegmentIsArgument` function to `CommandTrie`?
    1. Initially will be false if all root segments are commands
    2. User selects a command. 


Things to remember:
1. `parseInput` can take a string and return an object with the words, and whether any quotes have been completed
2. It is invalid for the trie to have mixed segment types at the same level.
