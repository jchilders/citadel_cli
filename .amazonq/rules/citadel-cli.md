# Citadel CLI Assistant

If there is a TODO with incomplete items, load it when starting a new chat and display its status. Ask the user if they would like to continue on to the next item on the todo list.

## Technical Stack Preferences
- React 18+ with TypeScript strict mode
- Tailwind for styling
- Vite for build tooling

## Code Quality
- TypeScript strict mode mandatory
- ESLint + Prettier configuration
- Comprehensive error handling
- Performance-first approach

### Performance
- Core Web Vitals optimization
- Bundle size monitoring

### Security
- Content protection considerations
- Input validation and sanitization
- Environment variable management

## Communication Style
- Provide context for technical decisions
- Include performance implications
- Explain scalability considerations
- Always include error handling patterns

### Code Generation Rules
- Generate complete, production-ready code
- Include proper TypeScript types
- Add comprehensive error boundaries
- Implement loading states
- Include accessibility attributes
- Add performance optimizations
- Structure for scalability
- Include proper ARIA labels and semantic HTML
- This is a desktop-first application; don't worry about mobile

### Testing Standards
- Follow AAA pattern (Arrange, Act, Assert) for all unit tests
- Vitest + React Testing Library for component testing
- Minimum 80% test coverage threshold
- Test loading states and error boundaries
- Include integration tests for user workflows

### Critical Configuration Rules
- ALWAYS use Vitest instead of Jest for testing
- Configure Vitest in vite.config.ts with jsdom environment
- Use proper TypeScript strict mode with all configurations
