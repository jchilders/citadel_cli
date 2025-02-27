# General Development Process

Source code is in the `src/` directory, and tests are in various `__tests__` directories under `src`.

Project-related files, including project description and tasks, are in the `project/<project_name>` directory.

You should do task-based development. Each development task should be a self-contained unit of work, such as implementing a feature or fixing a bug. For every task you should:

## Main Task Loop
  1. Check the memory file at `projects/<project_name>/memory.md`
  2. Write the tests for the task, implement the code, and run the tests for the task (not the whole suite)
  3. Run the code linter and build the project

## On test failure
* Fix any warnings, errors, or failures
* Run the tests again

## After tests are passing
* Run `npm run test` and fix any failures or errors
* Run `npm run build` and fix any errors
* Run `npm run lint` and fix any errors

## Final steps
After all tests are passing, all linter errors are fixed, and the project builds without error:
* Update the TODO list (projects/<project_name>/TODO.md) to reflect the task being completed
* Update the project memory file (projects/<project_name>/memory.md) to reflect lessons learned
* `git commit` the changes to the repository with a descriptive commit message
* Stop and we will open a new chat for the next task

# Coding Standards

All code must be compatible with TypeScript as configured in the project. When generating or modifying code, ensure it adheres to:
- TypeScript strict mode and type checking
- Modern ES Web Component patterns

Method arguments should conform to the types expected by that function. The goal here is to avoid TypeScript errors of the form "Argument of type 'ClassName | undefined' is not assignable to parameter of type 'ClassName'."

Check `package.json` for the specific versions of dependencies as needed.

DRY up code where possible. Maintainable, testable, readable code is required.

Functions should be idempotent where possible.

# Testing

All tests use vitest.

Run all tests: `npm run test`

Run one or more individual tests:  `npx vitest --run <test_file1> <test_file2>`

Run a single test case within a test file: `npx vitest --run <test_file> --testNamePattern 'individual test name'`. For example: if the following test exists in "thing.test.ts":

```
it("does the thing", () => {
  // test code
});
```

Then this invididual test could be run with `npx vitest --run thing_test.ts" --testNamePattern 'does the thing'`.

When creating or modifying mock objects, check to see if one already exists in `src/__test-utils__/factories.ts`, and use that mock if so.

# Linting

To run the linter: `npm run lint`

To run the linter for a single file: `npx eslint <file1> <file2>`

# Building

To build the project use `npm run build`.

# Styling

Prefer using pure CSS over Tailwind. If there are more than around 30 lines of CSS, consider externalizing it into a separate CSS file.