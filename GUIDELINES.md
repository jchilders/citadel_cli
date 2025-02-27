# General Development Rules

Source code is in the `src/` directory, and tests are in various `__tests__` directories under `src`.

Project-related files, including project description and tasks, are in the `project/<project_name>` directory.

You should do task-based development. For every task, you should write the tests, implement the code, and run the tests to make sure everything works. Do NOT update TODO.md or memory.md until the (a) all tests (via `npm run test`) are passing, (b) the project builds without error.

On test failure:
* Fix any warnings or errors in the code
* Run the tests again

After tests are passing (and not before):
* Update the TODO list (projects/<project_name>/TODO.md) to reflect the task being completed
* Update the project memory file (projects/<project_name>/memory.md) to reflect the current state of the project
* `git commit` the changes to the repository with a descriptive commit message
* Update the development guidelines to reflect anything that you've learned while working on the project
* Stop and we will open a new chat for the next task

# Version Compatibility

All code must be compatible with TypeScript as configured in the project. When generating or modifying code, ensure it adheres to:
- TypeScript strict mode and type checking
- Modern ES Web Component patterns

Method arguments should conform to the types expected by that function. The goal here is to avoid TypeScript errors of the form "Argument of type 'ClassName | undefined' is not assignable to parameter of type 'ClassName'."

Check `package.json` for the specific versions of dependencies as needed.

# Building

To build the project use `npm run build`.

# Testing

All tests use vitest. See `package.json` for details.

To run all tests: `npm run test`

To run one or more individual tests use `npx vitest --run <test_file1> <test_file2>`

To run a single test case within a test file use `npx vitest --run <test_file> --testNamePattern 'individual test name'`. For example: if the following test exists in "thing.test.ts":

```
it("does the thing", () => {
  // test code
});
```

Then this invididual test could be run with `npx vitest --run thing_test.ts" --testNamePattern 'does the thing'`.

When creating or modifying mock objects, check to see if one already exists in `src/__test-utils__/factories.ts`, and use that mock if so.

# Styling

Prefer using pure CSS over Tailwind. If there are more than around 30 lines of CSS, consider externalizing it into a separate CSS file.

# Building

To build the project use `npm run build`