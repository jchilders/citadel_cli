# Contributing to Citadel CLI

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/jchilders/citadel_cli.git
   cd citadel_cli
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the test suites**
   ```bash
   npm run test
   npm run test:e2e
   ```

3. **Run the linter**
   ```bash
   npm run lint
   ```

4. **Optional: build the package**
   ```bash
   npm run build
   ```

If you want to link the package into another project while developing locally:

```bash
npm link
# inside the consuming project
npm unlink citadel_cli && npm link citadel_cli
```

Press <kbd>.</kbd> in your app to toggle the console.

## Development Workflow

1. Create a feature branch:
   ```bash
   git checkout -b feature/my-change
   ```
2. Make your changes and add or update tests as needed.
3. Run the linter and unit tests:
   ```bash
   npm run lint
   npm test
   ```
4. Commit with a descriptive message and open a pull request.

### Pull Request Guidelines

- Keep PRs focused; use separate branches/PRs for unrelated changes.
- Include tests for new functionality or bug fixes.
- Update documentation when behavior changes.
- Ensure `npm run lint` and `npm test` pass locally.
- Describe what changed and why in the PR description.

### Code Style

- Follow the existing TypeScript + React patterns.
- Prefer clear, descriptive naming and small, focused functions.
- Add comments for non-obvious logic.
- Formatting is enforced by ESLint/Prettier (`npm run lint`).

## Releasing

Releases are tag-driven and published automatically to npm when a version tag is pushed.

1. Make sure `main` has everything you want to ship and that tests pass.
2. Update version/changelog as needed, then bump the version:
   ```bash
   npm version <patch|minor|major>
   ```
   This updates `package.json`, `package-lock.json`, and creates a git tag.
3. Push commits and tags:
   ```bash
   git push
   git push --tags
   ```
4. GitHub Actions will run tests/builds and publish the package to npm using the version from `package.json`. The workflow expects tags shaped like `v1.2.3`.

That’s it—no manual `npm publish` is required as long as the tag/version match.
