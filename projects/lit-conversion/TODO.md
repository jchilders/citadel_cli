# Lit Conversion TODO List

## Phase 1: Context System

### Activation Behavior Refactoring ✓
- [x] Keep show/hide as internal component state
- [x] Get showCitadelKey from CitadelConfig
- [x] Update ActivationController to handle visibility state
- [x] Update tests to reflect new approach

### Package and Component Setup
- [ ] Rename CitadelElement to CitadelCli
- [ ] Update custom element name to citadel-cli
- [ ] Create src/index.ts entry point
- [ ] Update import paths and type declarations
- [ ] Test npm package usage pattern

### Activation Key Context
- [x] Create activation context definition
- [x] Create ActivationController
- [x] Implement keyboard event handling
- [x] Test activation through Shadow DOM
- [x] Create basic Lit component with activation
- [ ] Verify show/hide functionality

### Testing
- [x] Create unit tests for ActivationController
- [x] Test keyboard event handling
- [x] Test Shadow DOM event propagation
- [x] Test activation state management

### Validation
- [ ] Verify activation key works through Shadow DOM
- [ ] Verify escape key closes Citadel
- [ ] Verify input elements don't trigger activation
- [ ] Document activation context pattern

### Next Steps Planning
- [ ] Document lessons learned from activation implementation
- [ ] Plan next context conversion based on activation experience
- [ ] Identify any Shadow DOM-specific challenges
