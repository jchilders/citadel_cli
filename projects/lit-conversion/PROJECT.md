# Lit Conversion Project Plan

## Overview
Convert the Citadel command interface from React to Lit to enable proper Shadow DOM support.

## Core Requirements
1. Full Shadow DOM encapsulation
2. Maintain existing functionality
3. Preserve command system architecture
4. Support Tailwind styling within Shadow DOM

## Phase 1: Context System
1. Create core context definitions using @lit/context
   - CitadelConfig context
   - CommandRegistry context
   - Storage context
   - SegmentStack context

2. Create context providers
   - Root provider component for configuration
   - Command system provider
   - Storage provider

## Phase 2: Core Components
1. Convert main Citadel component
   - Shadow DOM setup
   - Event handling
   - Global shortcuts
   - Style encapsulation

2. Create Lit controllers for:
   - Command parsing
   - State management
   - History management
   - Input handling
   - Segment stack management

## Phase 3: UI Components
1. Convert CommandInput
   - Keyboard event handling
   - Auto-completion
   - History navigation

2. Convert CommandOutput
   - Result rendering
   - Scroll management
   - Output history

3. Convert AvailableCommands
   - Command filtering
   - Suggestion display

## Phase 4: Styling
1. Configure Tailwind for Shadow DOM
   - Setup build process
   - Style injection strategy
   - CSS custom properties for theming

2. Convert existing styles
   - Scoped styles per component
   - Global theme variables

## Dependencies
```bash
npm install lit @lit/context
```

## Testing Strategy
1. Convert existing tests to work with Lit components
2. Add new tests for:
   - Shadow DOM interactions
   - Context system
   - Event handling through shadow boundaries

## Migration Steps
1. Create parallel Lit implementation
2. Test feature parity
3. Replace React components one at a time
4. Validate each replacement
5. Remove React dependencies

## Future Considerations
1. Expose customization APIs through Shadow DOM parts
2. Consider creating component library distribution
3. Plan for backward compatibility
