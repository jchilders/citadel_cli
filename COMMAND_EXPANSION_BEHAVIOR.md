# Citadel CLI Command Expansion Behavior

## Key Behavior
Commands are expanded based on the first letter(s) typed by the user.

## How Command Expansion Works

### 1. Single Letter Expansion
When user types the first letter of a command, it expands in-place:
- Example: User types "g" → expands to "greet " (with trailing space)
- Example: User types "h" → expands to "help " (with trailing space)

### 2. Ready for Arguments
After expansion, the cursor is positioned after the space, ready for argument input:
- User can immediately type arguments: "greet World"
- For commands without arguments, user can press Enter immediately

### 3. Execution
User presses Enter to execute the expanded command:
- "h<Enter>" executes the help command
- "g World<Enter>" executes "greet World"

## Testing Implications

### ❌ Incorrect Test Pattern (simulates full typing)
```javascript
fireEvent.change(input, { target: { value: 'greet World' } });
```

### ✅ Correct Test Pattern (simulates actual user behavior)
```javascript
// Type first letter to trigger expansion
fireEvent.change(input, { target: { value: 'g' } });
// Then add argument after expansion
fireEvent.change(input, { target: { value: 'greet World' } });
```

### ✅ For help command
```javascript
// Just type 'h' and press Enter
fireEvent.change(input, { target: { value: 'h' } });
fireEvent.keyDown(input, { key: 'Enter' });
```

## Important Note
This expansion behavior is fundamental to Citadel's user experience and should be reflected in all integration and E2E tests. Tests that don't follow this pattern may not accurately represent real user interactions and may fail unexpectedly.
