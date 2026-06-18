# Session Validation Improvements

## Overview

The `validateSessionWithServer` function has been improved to provide better separation of concerns and avoid React Hook usage in utility functions.

## Key Changes

### ✅ **Fixed Implementation Issues**

**Before:**

```typescript
// Incorrect - trying to use React Hooks in utility function
// const { data } = await BusinessAuthApi.useVerifyToken().mutateAsync();
```

**After:**

```typescript
// Correct - accepts verification function as parameter
export async function validateSessionWithServer(
  tokenType: string | null,
  business: IBusiness | IStoredBusiness | null,
  currentPath: string,
  verifyTokenFn?: () => Promise<{
    data?: { isValid: boolean; business?: IBusiness };
  }>,
);
```

### ✅ **Better Separation of Concerns**

- **Utility Function**: Pure logic, no React dependencies
- **React Hook**: Handles React-specific concerns (state, effects, mutations)
- **Examples**: Show proper usage patterns for different contexts

## Usage Patterns

### 1. **React Components** (Recommended)

Use the `useKybSession` hook for React components:

```tsx
function KybVerificationFlow() {
  const { isInitialized, isValid, isLoading } = useKybSession();

  if (!isInitialized || isLoading) return <LoadingSpinner />;
  if (!isValid) return null; // Hook handles redirects

  return <YourComponent />;
}
```

### 2. **Server-Side/API Routes**

Use `validateSessionWithServer` with a custom verification function:

```tsx
async function validateServerSession(currentPath: string) {
  const { tokenType, business } = getAuthFromRequest(); // Your server logic

  const verifyTokenFn = async () => {
    const response = await fetch("/api/auth/verify-token", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  };

  return validateSessionWithServer(
    tokenType,
    business,
    currentPath,
    verifyTokenFn,
  );
}
```

### 3. **Client-Side Utilities**

Use without server validation for simple client checks:

```tsx
async function validateClientSession(currentPath: string) {
  const { tokenType, business } = useAuthStore.getState();

  // Client-only validation (no server call)
  return validateSessionWithServer(tokenType, business, currentPath);
}
```

## Why This Pattern is Better

### ✅ **No React Hook Violations**

- Utility functions don't use React Hooks
- Server-side code can use the validation logic
- Pure functions are easier to test

### ✅ **Flexible Server Validation**

- Can be used in API routes, middleware, server components
- Accepts custom verification functions
- Graceful fallback when server validation fails

### ✅ **Consistent Validation Logic**

- Same validation rules across client and server
- Single source of truth for session validation
- Predictable error handling

### ✅ **Better for Testing**

- Pure functions are easier to unit test
- Can mock verification functions
- No React dependencies to mock

## Migration Guide

### Old Pattern (Avoid)

```typescript
// ❌ Don't use React Hooks in utility functions
export async function validateSession() {
  const mutation = BusinessAuthApi.useVerifyToken(); // Wrong!
  // ...
}
```

### New Pattern (Recommended)

```typescript
// ✅ Accept verification function as parameter
export async function validateSession(verifyFn?: () => Promise<any>) {
  if (verifyFn) {
    const result = await verifyFn();
    // Process result...
  }
  // ...
}
```

## Deprecation Notice

The original incomplete `validateSessionWithServer` implementation has been marked as deprecated for React components. Use `useKybSession` hook instead for new React components.

The improved version is still available for:

- Server-side validation
- API routes and middleware
- Non-React utility functions
- Legacy code that can't be migrated to hooks

This provides a clear upgrade path while maintaining backward compatibility.
