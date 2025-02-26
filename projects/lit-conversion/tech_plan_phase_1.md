# Phase 1 Technical Implementation Plan: Context System

## Overview
Convert React's context system to Lit's @lit/context implementation, starting with the activation key functionality to validate the approach.

## 1. Activation Key Context

### 1.1 Create Initial Context
```typescript
// src/components/Citadel/config/contexts.ts
import { createContext } from '@lit/context';

export interface CitadelActivation {
  showCitadelKey: string;
  isVisible: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export const activationContext = createContext<CitadelActivation>('citadel-activation');
```

### 1.2 Create Activation Controller
```typescript
// src/components/Citadel/controllers/ActivationController.ts
import { ReactiveController, ReactiveControllerHost } from 'lit';
import { ContextProvider } from '@lit/context';
import { CitadelActivation, activationContext } from '../config/contexts';

export class ActivationController implements ReactiveController {
  private provider: ContextProvider<typeof activationContext>;
  private keyHandler: (e: KeyboardEvent) => void;

  constructor(
    private host: ReactiveControllerHost,
    private config: CitadelActivation
  ) {
    this.provider = new ContextProvider(this.host, {
      context: activationContext,
      initialValue: config
    });
    
    this.keyHandler = this.handleKeyDown.bind(this);
  }

  hostConnected() {
    document.addEventListener('keydown', this.keyHandler);
  }

  hostDisconnected() {
    document.removeEventListener('keydown', this.keyHandler);
  }

  private handleKeyDown(event: KeyboardEvent) {
    const targetTag = (event.target as HTMLElement)?.tagName?.toLowerCase() || '';
    const isInputElement = ['input', 'textarea'].includes(targetTag);
    
    if (!this.config.isVisible && event.key === this.config.showCitadelKey && !isInputElement) {
      event.preventDefault();
      this.config.onOpen();
    }

    if (this.config.isVisible && event.key === 'Escape') {
      event.preventDefault();
      this.config.onClose();
    }
  }
}
```

### 1.2 Create Context Provider Controller
```typescript
// src/components/Citadel/controllers/CitadelContextController.ts
import { ReactiveController, ReactiveControllerHost } from 'lit';
import { ContextProvider } from '@lit/context';
import { CitadelConfig, CommandRegistry, CommandStorage, SegmentStack } from '../types';
import { 
  citadelConfigContext, 
  commandRegistryContext,
  storageContext,
  segmentStackContext 
} from '../config/contexts';

export class CitadelContextController implements ReactiveController {
  private configProvider: ContextProvider<typeof citadelConfigContext>;
  private commandsProvider: ContextProvider<typeof commandRegistryContext>;
  private storageProvider: ContextProvider<typeof storageContext>;
  private stackProvider: ContextProvider<typeof segmentStackContext>;

  constructor(
    private host: ReactiveControllerHost,
    config: CitadelConfig,
    commands: CommandRegistry,
    storage: CommandStorage,
    stack: SegmentStack
  ) {
    this.configProvider = new ContextProvider(this.host, {
      context: citadelConfigContext,
      initialValue: config
    });
    // Initialize other providers...
  }

  // Implement controller lifecycle methods
  hostConnected() {}
  hostDisconnected() {}
}
```

## 2. Convert State Management

### 2.1 Create State Controller
```typescript
// src/components/Citadel/controllers/CitadelStateController.ts
import { ReactiveController, ReactiveControllerHost } from 'lit';
import { consume } from '@lit/context';
import { CitadelState, CitadelActions } from '../types/state';

export class CitadelStateController implements ReactiveController {
  private state: CitadelState;
  
  constructor(private host: ReactiveControllerHost) {
    // Initialize state...
  }

  // Port state management methods from useCitadelState...
}
```

### 2.2 Create Command History Controller
```typescript
// src/components/Citadel/controllers/CommandHistoryController.ts
import { ReactiveController, ReactiveControllerHost } from 'lit';
import { consume } from '@lit/context';
import { CommandHistory, CommandHistoryActions } from '../types';

export class CommandHistoryController implements ReactiveController {
  // Port functionality from useCommandHistory...
}
```

## 3. Convert Component Structure

### 3.1 Create Base Citadel Component
```typescript
// src/components/Citadel/Citadel.ts
import { LitElement, html } from 'lit';
import { CitadelContextController } from './controllers/CitadelContextController';
import { CitadelStateController } from './controllers/CitadelStateController';

export class CitadelElement extends LitElement {
  private contextController: CitadelContextController;
  private stateController: CitadelStateController;

  constructor() {
    super();
    // Initialize controllers...
  }

  // Implement component lifecycle and rendering...
}
```

## 4. Migration Steps

1. Create new context files and controllers
2. Test context providers in isolation
3. Create state management controllers
4. Test state management
5. Create base Citadel component with Shadow DOM
6. Migrate existing components one at a time to use new context system
7. Remove React context implementation

## 5. Testing Strategy

1. Create unit tests for context controllers
2. Test context propagation through Shadow DOM
3. Verify state management functionality
4. Test history controller in isolation
5. Integration tests for complete context system

## 6. Validation Criteria

- All contexts are properly provided through Shadow DOM
- State management maintains feature parity
- Command history works as before
- Configuration system remains compatible
- No React dependencies in new implementation

## 7. Dependencies

```bash
npm install lit @lit/context
```

## 8. Risks and Mitigations

1. Risk: Shadow DOM context isolation
   - Mitigation: Careful testing of context propagation

2. Risk: State management complexity
   - Mitigation: Break down into smaller controllers

3. Risk: Breaking changes in API
   - Mitigation: Maintain existing interfaces
