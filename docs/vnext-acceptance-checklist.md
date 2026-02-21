# Citadel vNext Tightened Acceptance Checklist

This checklist converts current test-backed behavior and agreed vNext UX rules into implementation gates.

## Why This Project Exists

Citadel exists to make common actions in a web app dramatically faster for experienced users. The core promise is:

- reach frequent actions in a few keystrokes,
- stay on keyboard without context switching,
- get predictable behavior under speed.

The redesign effort is about reducing surprises that cost time:

- ambiguous input should never silently do the wrong thing,
- inline text should reflect only what the system has actually committed,
- help and suggestions should make next actions obvious without slowing the user down.
- command creation should be faster and clearer through a typed DSL instead of low-level segment arrays.

In short: optimize for high-frequency, high-confidence command entry.

Example DSL direction:

```ts
command("user.show")
  .describe("Show user details")
  .arg("userId", (a) => a.describe("Enter user ID"))
  .handle(async ({ namedArgs }) => {
    return text(`Showing user ${namedArgs.userId}`);
  });
```

## How vNext Works (Broad Strokes)

At a high level, vNext is an expansion-first state machine with deterministic matching:

1. Define commands with typed metadata
- Command path (for example `user.show`)
- Command description (help summary)
- Argument definitions + argument descriptions
- Handler implementation

2. Parse input as incremental intent
- Resolve command segments from compact input
- Commit inline text only when a segment is uniquely identified
- Keep ambiguity in suggestion chips until uniquely resolved

3. Disambiguate by shortest unique continuation
- If two commands share a prefix, require additional letters
- Stop as soon as one command is uniquely identified
- Never auto-pick a candidate by registration order

4. Transition to argument-entry mode after command resolution
- Accept quoted and unquoted values
- Validate required args before execution
- Execute handler with deterministic argument mapping

5. Render results and preserve flow
- Record outputs/history for quick repetition
- Surface errors explicitly without crashing interaction
- Keep panel/inline behavior and focus stable

## Design Principles

- Speed first: few keystrokes for common operations.
- Determinism over magic: no hidden auto-selection on ambiguity.
- Progressive disclosure: suggestions guide next input without noise.
- Colocation: command behavior and help text live together.
- Backed by tests: behavior changes require explicit coverage.

## 1. Command Entry and Expansion

- [ ] Typing a unique root initial commits in place (example: `u` renders `user` inline).
- [ ] Full-word command entry is not required for normal flow; fast abbreviated entry remains primary.
- [ ] Inline input only shows committed segments.
- [ ] Ambiguous partial next segments do not commit inline.
- [ ] Ambiguity is shown via narrowed suggestion chips (not inline partial tokens).
- [ ] Command matching is case-insensitive.
- [ ] Invalid command-path keystrokes are rejected when not entering arguments.

## 2. Disambiguation Semantics

- [ ] Shared prefixes require additional keystrokes until unique.
- [ ] Disambiguation uses shortest unique continuation.
- [ ] `user.show` vs `user.search` resolves as `ush` and `use`.
- [ ] Ambiguous commands are never auto-selected by priority/order.

## 3. Suggestion Row Behavior

- [ ] After committing a segment, the suggestion row lists valid next choices.
- [ ] Suggestion chips are sorted alphabetically.
- [ ] Built-in `help` appears last when included.
- [ ] Nested `help` suggestions remain visible when built-in `help` is disabled.

## 4. Help System Behavior

- [ ] Command-level help text is stored and rendered separately from argument-level help text.
- [ ] Help list format includes command signature and command summary.
- [ ] Argument placeholders render as `<argName>` in help output.
- [ ] Built-in `help` is added only once when enabled.
- [ ] Built-in `help` is removed when disabled.

## 5. Argument Entry and Execution

- [ ] Arguments are accepted only after a command path is uniquely resolved.
- [ ] Quoted and unquoted arguments are both supported.
- [ ] Unclosed quotes prevent execution.
- [ ] Enter executes only when required arguments are present.
- [ ] Handler receives deterministic argument mapping (no ambiguity across argument positions).

## 6. Panel/Inline and Visibility

- [ ] Panel mode is hidden by default.
- [ ] Panel mode opens via configured activation key.
- [ ] Inline mode renders command input and suggestions immediately.
- [ ] Focus remains stable across command stack/input updates.

## 7. History and Persistence

- [ ] Executed commands are added to history with timestamp.
- [ ] Arrow-up navigates to most recent stored command.
- [ ] Arrow-down from newest history position returns empty input state (`[]` semantics).
- [ ] Clear history removes persisted and in-memory entries.
- [ ] Storage initialization succeeds with configured backend (`memory` or `localStorage`).

## 8. Error and Result Handling

- [ ] Successful handler results render correctly for text and JSON payloads.
- [ ] Thrown handler errors render as error output, without crashing the TTY.
- [ ] Invalid handler return types produce explicit error results.
- [ ] Output entries have unique IDs even when timestamps are identical.

## 9. Multi-Instance and Lifecycle Safety

- [ ] Multiple Citadel instances do not leak command state across instances.
- [ ] Built-in command injection does not duplicate across rerenders.
- [ ] Config-driven behavior changes are predictable across rerenders/remounts.

## 10. Migration and Test Coverage Gates

- [ ] Existing non-skipped unit/integration tests pass.
- [ ] New tests cover ambiguous inline rendering (committed-only input rule).
- [ ] New tests cover `ush`/`use` disambiguation behavior.
- [ ] New tests cover help metadata coexistence (command + argument descriptions).
- [ ] Previously skipped journey scenarios are either implemented or explicitly re-scoped with rationale.
