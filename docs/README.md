# Citadel docs

These pages cover the current public API for `citadel_cli`.

One important concept up front: Citadel is prefix-driven. Users usually do not
type full command names. They type the shortest unambiguous prefix and Citadel
expands it into the full command path.

Read them in order:

1. [Installing Citadel in an existing React app](./01-installing-citadel-in-an-existing-react-app.md)
2. [Defining commands](./02-defining-commands.md)
3. [Embedding Citadel and choosing a display mode](./03-embedding-and-display-modes.md)
4. [Configuring Citadel and command history](./04-configuring-citadel-and-command-history.md)
5. [Using integration recipes](./05-using-integration-recipes.md)

Notes:

- Citadel is a React component library, so the examples assume an existing React app.
- Citadel mounts into a shadow DOM, so its UI styles stay isolated from the host app.
- The code samples in these docs are backed by type-checked examples in `docs/examples/`.
