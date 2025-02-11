I need a function added to the CommandRegistry that will take a partial path and return all "subsegements" for it. Call it 'childrenOfPath(string[])', and it should return `string[]`. It will be used to determine valid next inputs for a given "command level". For example, consider the following menu structure:

user
|-- :userId
      |-- deactivate
      |-- show
help

Given no parameters (or an empty `string[]`) `childrenOfPath` would return `['user', 'help']`, i.e. the "root" parameters of the menu.
Given `['user']` it would return `[':userId']`. 
Given `['user', ':userId']` it would return `['deactivate', 'show']`

We may need/want to add a `isLeaf` method to CommandNode indicating that it has no children. 

childrenOfPath(string[]): string[] {

}
