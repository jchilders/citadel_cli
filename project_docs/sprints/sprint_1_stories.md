Story S1.1: Implement Basic Command History Storage
As a user, I want my previously entered commands to be stored so that I can access them later.

Acceptance Criteria:
- Commands are stored when executed
- Command arguments are stored along with their commands
- Storage mechanism can be configured between localStorage and memory
- Default storage mechanism is localStorage
- Graceful fallback to memory storage if localStorage is unavailable
- Storage limit is implemented to prevent excessive memory usage

Dependencies: None

Developer Notes:
- Consider implementing a history storage service interface
- Implement both localStorage and memory storage providers
- Add configuration option to CitadelConfig interface

Technical Rationale: This foundational story establishes the core storage functionality needed for command history.

---

Story S1.2: Implement Command History Navigation
As a user, I want to navigate through my command history using up and down arrow keys so that I can quickly access previous commands.

Acceptance Criteria:
- Pressing up arrow shows the previous command in history
- Pressing down arrow shows the next command in history
- Current command input is preserved when starting to navigate history
- Navigation stops at the oldest entry when pressing up
- When pressing down, if already at newest history entry, clear the input field
- Command and its arguments are both displayed when navigating
- Empty prompt is shown when navigating past the newest entry

Dependencies: S1.1

Developer Notes:
- Extend CommandInput component to handle arrow key events
- Integrate with CitadelState to manage history navigation state
- Consider UX for partial command inputs when navigating

Technical Rationale: This story implements the user interaction layer for accessing stored command history.

---

Story S1.3: Add History State Management
As a user, I want my command history state to be properly managed so that navigation feels natural and predictable.

Acceptance Criteria:
- History position is tracked correctly during navigation
- Current input is preserved when entering history navigation
- History state is reset when executing a new command
- History state is maintained separately for each session
- Command history is preserved across page refreshes (when using localStorage)

Dependencies: S1.1, S1.2

Developer Notes:
- Add history navigation state to CitadelState
- Implement proper state reset conditions
- Consider edge cases like empty history

Technical Rationale: This story ensures robust state management for command history functionality.
