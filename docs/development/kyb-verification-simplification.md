# KYB Verification Flow Simplification

## Overview

The KYB verification flow has been simplified to prevent infinite loops and make it easier to reason about. The complex verification logic has been extracted into a dedicated hook.

## Key Changes

### 1. Extracted Session Logic into `useKybSession` Hook

- **Before**: Complex `useEffect` with multiple dependencies, refs, and async logic mixed in the component
- **After**: Clean, single-purpose hook that handles all session validation and initialization

### 2. Eliminated Infinite Loop Risks

- **Removed**: `verifyInProgressRef` and complex dependency tracking
- **Removed**: Multiple overlapping `useEffect` hooks
- **Removed**: `useSessionValidation` hook usage (logic consolidated)

### 3. Simplified State Management

- **Before**: Multiple state variables (`isInitialized`, refs, mutation states)
- **After**: Clear separation of concerns with predictable state flow

### 4. Predictable Flow

1. Component mounts
2. `useKybSession` initializes once
3. Token verification happens (if needed)
4. KYB ownership is established
5. Component renders or redirects based on session validity

## Benefits

### ✅ No More Infinite Loops

- Single initialization call on mount
- No reactive dependencies that can trigger re-verification
- Clear separation between initialization and component state

### ✅ Easy to Reason About

```tsx
// Before: Complex logic scattered across component
useEffect(() => {
  // 80+ lines of complex async logic
  // Multiple conditions and state checks
  // Potential for infinite loops
}, [tokenType, router, verifyTokenMutation]);

// After: Simple, clear flow
const { isInitialized, isValid, isLoading } = useKybSession();
```

### ✅ Better Error Handling

- Graceful fallbacks for network issues
- Clear error states and user feedback
- Proper cleanup and session management

### ✅ Testable

- Logic is isolated in a hook
- Predictable inputs and outputs
- No complex side effects in the component

## Hook API: `useKybSession`

```tsx
const { isInitialized, isValid, isLoading } = useKybSession();
```

### Returns

- `isInitialized`: Whether the session has been checked and initialized
- `isValid`: Whether the user has a valid KYB session
- `isLoading`: Whether token verification is in progress

### Handles

- Token validation with server
- Session expiry and redirects
- KYB draft ownership management
- Business data synchronization
- Error handling and user feedback

## Migration Notes

If you need to add additional verification logic:

1. **DO**: Add it to the `useKybSession` hook
2. **DON'T**: Add reactive effects to the component
3. **DO**: Return additional state from the hook if needed
4. **DON'T**: Mix session logic with UI logic

## Example Usage

```tsx
export default function KybVerificationFlow() {
  const { isInitialized, isValid, isLoading } = useKybSession();

  if (!isInitialized || isLoading) {
    return <LoadingSpinner />;
  }

  if (!isValid) {
    return null; // Hook handles redirects
  }

  // Render verification steps...
}
```

This pattern can be applied to other flows that have similar session validation complexity.
