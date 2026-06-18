# VerifyToken Endpoint Integration Guide

## Overview

The `/v1/verifyToken` endpoint has been successfully integrated into the auth system without disrupting existing API calls. This guide explains how to use it effectively.

## Token Expiry Note

- Temp tokens (short-lived): 15 minutes — used for OTP verification, KYB in-progress, and password reset flows.
- Normal (authenticated) tokens: 30 days — used for fully authenticated, initialized businesses.

## API Integration

### New Method Added

```typescript
// In BusinessAuthApi
useVerifyToken: () =>
  useSafeMutation<
    BaseApiResponse<{ isValid: boolean; business?: IBusiness }>,
    void
  >({
    mutationFn: async () => {
      const response = await apiClient.get(
        ENDPOINTS.BUSINESS_AUTH.VERIFY_TOKEN,
      );
      return response.data;
    },
    // Silent operation - no toast notifications to avoid UX disruption
  });
```

### Endpoint Configuration

```typescript
// In endpoints.ts
BUSINESS_AUTH: {
  VERIFY_TOKEN: "/verifyToken", // Already configured
  // ... other endpoints
}
```

## Use Cases & Implementation

### 1. Session Recovery (Recommended)

**When to use**: User returns after browser close with intermediate tokens

```typescript
// In session validation logic
const { mutateAsync: verifyToken } = BusinessAuthApi.useVerifyToken();

try {
  const result = await verifyToken();

  if (result.data.isValid) {
    // Token is valid, continue with current flow
    const updatedBusiness = result.data.business || storedBusiness;
    // Use updated business data for more accurate state validation
  } else {
    // Token invalid on server, clear session
    clearSession();
    router.push("/login");
  }
} catch (error) {
  // Server error, fall back to client-side validation
  console.warn("Server validation failed, using client validation");
}
```

### 2. Critical Auth Checkpoints

**When to use**: Before sensitive operations or after long idle periods

```typescript
// Before important business operations
const validateBeforeAction = async () => {
  const { mutateAsync: verifyToken } = BusinessAuthApi.useVerifyToken();

  try {
    const validation = await verifyToken();
    if (!validation.data.isValid) {
      toast.error("Session expired. Please log in again.");
      clearSession();
      return false;
    }
    return true;
  } catch {
    // Continue with operation if server check fails
    return true;
  }
};

// Usage
if (await validateBeforeAction()) {
  // Proceed with sensitive operation
}
```

### 3. Background Health Checks

**When to use**: Periodic validation for long-running sessions

```typescript
// Optional: Background token validation (use sparingly)
const useTokenHealthCheck = () => {
  const { mutateAsync: verifyToken } = BusinessAuthApi.useVerifyToken();

  useEffect(() => {
    const checkInterval = setInterval(
      async () => {
        try {
          const result = await verifyToken();
          if (!result.data.isValid) {
            // Silently refresh or redirect to login
            clearSession();
            router.push("/login");
          }
        } catch {
          // Ignore errors for background checks
        }
      },
      15 * 60 * 1000,
    ); // Check every 15 minutes

    return () => clearInterval(checkInterval);
  }, []);
};
```

## Enhanced Session Validation

The `validateIntermediateSession` function now accepts optional server validation data:

```typescript
// Client-side validation only (current default)
const validation = validateIntermediateSession(
  tokenType,
  business,
  currentPath,
);

// Enhanced with server validation
const serverResult = await BusinessAuthApi.useVerifyToken().mutateAsync();
const validation = validateIntermediateSession(
  tokenType,
  business,
  currentPath,
  serverResult.data, // Server validation result
);
```

## Best Practices

### ✅ DO

1. **Use for session recovery**: Perfect for handling browser close scenarios
2. **Silent operation**: No toast notifications to avoid UX disruption
3. **Graceful fallback**: Always have client-side validation as backup
4. **Updated business data**: Use server-provided business data when available
5. **Strategic timing**: Use during natural transition points (page loads, form submissions)
6. **Respect token expiry**: Design flows assuming temp tokens expire in 15 minutes and authenticated tokens last 30 days — refresh or re-authenticate when appropriate.

### ❌ DON'T

1. **Overuse**: Don't call on every user interaction
2. **Block UI**: Don't make users wait for server validation in normal flows
3. **Replace client validation**: Always do client-side checks first
4. **Show errors**: Don't toast server validation errors - handle silently
5. **Frequent polling**: Avoid aggressive background checking

## Integration Timeline

### Phase 1: Session Recovery (Current)

- ✅ API method implemented
- ✅ Enhanced validation logic
- ✅ Documentation updated
- ✅ Build verification complete

### Phase 2: Strategic Implementation (Recommended)

```typescript
// Example implementation in useSessionValidation hook
const validateWithServer = async () => {
  try {
    const serverResult = await verifyToken();
    return validateIntermediateSession(
      tokenType,
      business,
      currentPath,
      serverResult.data,
    );
  } catch {
    // Fall back to client validation
    return validateIntermediateSession(tokenType, business, currentPath);
  }
};
```

### Phase 3: Advanced Features (Future)

- Token refresh integration
- Concurrent session management
- Security anomaly detection

## Error Handling

```typescript
const handleTokenVerification = async () => {
  try {
    const result = await BusinessAuthApi.useVerifyToken().mutateAsync();
    return result.data;
  } catch (error) {
    // Different error scenarios
    if (error.response?.status === 401) {
      // Token expired/invalid
      return { isValid: false };
    } else if (error.response?.status >= 500) {
      // Server error - assume token is valid to avoid disruption
      console.warn("Server validation failed, assuming valid token");
      return { isValid: true };
    } else {
      // Network or other errors
      console.warn("Token verification failed, using fallback");
      return { isValid: true };
    }
  }
};
```

## Performance Considerations

- **Lightweight**: GET request with minimal payload
- **Non-blocking**: Don't await in render cycles
- **Cached**: Consider implementing response caching for repeated calls
- **Strategic**: Use only when truly beneficial (session recovery, critical operations)

## Security Benefits

1. **Server-side validation**: Ensures token hasn't been tampered with
2. **Fresh business data**: Gets latest business state from server
3. **Compromise detection**: Identifies manipulated or stolen tokens
4. **Consistency**: Synchronizes client state with server state

This integration provides a robust foundation for token validation while maintaining the existing user experience and API stability.
