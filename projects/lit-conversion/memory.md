# Lit Conversion Project Memory

## Phase 1: Context System

### Activation System Implementation
- ActivationController manages internal visibility state
- Component responds to controller's state changes
- Keyboard events handled directly by controller
- Clean separation between configuration and state

### Activation Behavior Refactoring

#### Key Decisions
1. Moved visibility state into ActivationController
   - Simplified component state management
   - Better separation of concerns
   - Controller now fully responsible for show/hide behavior

2. Removed CitadelActivation context
   - Eliminated unnecessary abstraction
   - Reduced code complexity
   - Direct use of CitadelConfig for activation key

#### Lessons Learned
1. Lit controllers are powerful for managing component state
   - Can handle both internal state and external events
   - Provide clean lifecycle hooks
   - Enable better component organization

2. Keep configuration simple
   - Only expose what's truly needed (showCitadelKey)
   - Internal state doesn't need to be in configuration
   - Clearer component boundaries

3. Test improvements
   - Focus on testing behavior, not implementation
   - Use controller's public API in tests
   - Verify state changes through observable attributes

### Key Implementation Details
1. Activation Controller:
   - Manages keyboard event handling (/ to open, Escape to close)
   - Prevents activation in input elements
   - Uses context provider for state sharing
   - Updates host element when state changes

2. CitadelElement:
   - Uses CSS transitions for smooth show/hide
   - Manages visible attribute for state
   - Uses requestAnimationFrame for DOM updates
   - Provides container with transform animations

### Testing Approach
- Unit tests cover:
  - Keyboard event handling
  - Input element prevention
  - State management
  - Context updates
  - Host element updates

### Shadow DOM Notes
- Events properly bubble through shadow boundaries
- CSS transitions work well with shadow DOM
- Context provider works across shadow boundaries

### Best Practices Identified
1. Use requestAnimationFrame for DOM updates
2. Separate state management into controllers
3. Use CSS transitions for smooth animations
4. Provide getters for controlled state
5. Update host element when state changes

### Lessons Learned from Activation Implementation

#### State Management
1. Order of Operations:
   - Element state should be updated before controller state
   - Use requestUpdate() before updateComplete to ensure proper rendering
   - Wait for microtasks and animation frames in tests

#### Context System
1. Controller Design:
   - Keep controllers focused on single responsibility
   - Use TypeScript interfaces for context types
   - Initialize context with default values
   - Provide methods to update context safely

#### Testing Considerations
1. Component Testing:
   - Import components explicitly to ensure registration
   - Wait for both updateComplete and animation frames
   - Test both attribute changes and state updates
   - Use proper async/await patterns

2. Event Handling:
   - Test event prevention (e.preventDefault)
   - Verify event bubbling through shadow DOM
   - Test input element exclusions
   - Ensure proper cleanup in afterEach

#### Shadow DOM Integration
1. Context Propagation:
   - @lit/context works well across shadow boundaries
   - No special handling needed for context updates
   - State changes reflect properly in shadow DOM

2. Performance:
   - CSS transitions perform better than JS animations
   - Use transform for smooth animations
   - Batch DOM updates with requestAnimationFrame

#### Migration Strategy
1. Incremental Approach:
   - Start with self-contained features
   - Validate patterns before wider adoption
   - Keep React and Lit implementations separate
   - Use interfaces to ensure type safety

#### TypeScript Integration
1. Custom Elements:
   - Declare custom element types in .d.ts files
   - Add JSX.IntrinsicElements declarations for React integration
   - Include custom element types in HTMLElementTagNameMap

2. Controller Types:
   - Use specific element types instead of generic ReactiveControllerHost
   - Consider protected vs private for test accessibility
   - Ensure proper type imports in test files

3. Build System:
   - Verify TypeScript strict mode compatibility
   - Handle JSX type declarations for custom elements
   - Maintain proper module resolution

#### Future Considerations
1. Next Steps:
   - Apply learned patterns to other contexts
   - Consider creating base controller class
   - Document controller lifecycle patterns
   - Create testing utilities for common patterns
   - Create reusable type utilities for custom elements
