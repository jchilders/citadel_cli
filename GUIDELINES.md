# General Development Rules

You should do task-based development. For every task, you should write the tests, implement the code, and run the tests to make sure everything works.

When the tests pass:
* Update the TODO list to reflect the task being completed
* Update the memory file to reflect the current state of the project
* Fix any warnings or errors in the code
* Commit the changes to the repository with a descriptive commit message
* Update the development guidelines to reflect anything that you've learned while working on the project
* Stop and we will open a new chat for the next task

# Version Compatibility

All code must be compatible with TypeScript as configured in the project. When generating or modifying code, ensure it adheres to:
- TypeScript strict mode and type checking
- Modern ES Web Component patterns

Method arguments should conform to the types expected by that function. The goal here is to avoid TypeScript errors of the form "Argument of type 'ClassName | undefined' is not assignable to parameter of type 'ClassName'.
  Type 'undefined' is not assignable to type 'ClassName'." Check the function signature before adding arguments!

Check `package.json` for the specific versions of dependencies if needed.

# Error Messages

When adding or updating error messages:
- Include the name and value that is causing the error, when possible. 
- Offer a suggestion on how to fix the error, where possible

Example of a good error message: say there was an error due to an invalid value of 1000 for the `param1` argument: "param1 was invalid. param1: 1000. You may want to prevent the user from entering invalid values in the UI."

# Testing

All tests use vitest. See `package.json` for details.

To run one or more individual tests use `npx vitest --run <test_file1> <test_file2>`

To run a single test case within a test file use `npx vitest --run <test_file> --testNamePattern 'individual test name'`. For example: if the following test exists in "thing.test.ts":

```
it("does the thing", () => {
  // test code
});
```

Then this invididual test could be run with `npx vitest --run thing_test.ts" --testNamePattern 'does the thing'`.

To run ALL tests use `npm test`.

When creating or modifying mock objects, check to see if one already exists in `src/__test-utils__/factories.ts`, and use that mock if so.

# Test Coverage

To get code coverage for a single test file use `npx vitest --coverage <test_file>`

# Building

To build the project use `npm run build`