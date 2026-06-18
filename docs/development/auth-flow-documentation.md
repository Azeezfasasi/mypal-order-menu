# Business Authentication Flow Documentation

## Overview

The business authentication system follows a specific flow that ensures businesses complete all required steps before accessing the dashboard:

**Main Flow:** Signup → Verify OTP → Complete KYB → Dashboard Access

**Password Reset Flow:** Forgot Password → Reset Password → Check Business State → Appropriate Redirect

**Login Flow:** Login → Check Business State → Appropriate Redirect

The system uses **verification session hooks** for consistent session validation, token verification, and user experience across all auth flows. These hooks automatically handle:

- Server-side token validation
- Session recovery after browser close
- Appropriate redirects for invalid/expired sessions
- KYB draft ownership management
- Loading states and error handling

For different validation scenarios, the system provides multiple approaches:

- **Verification Session Hooks**: Primary validation for active verification flows
- **Legacy Session Validation**: Recovery validation for returned users
- **Server-Side Validation**: Programmatic validation for API routes and utilities

## Authentication States

The system uses centralized logic in `/src/lib/auth-flow-utils.ts` to determine business authentication states:

### 1. `NEEDS_OTP_VERIFICATION`

- **Condition**: `business.is_active === false`
- **Redirect**: `/verify`
- **Token Type**: `VERIFY_OTP`
- **Description**: Business has signed up but hasn't verified their email via OTP

### 2. `NEEDS_KYB_COMPLETION`

- **Condition**: `business.is_active === true` BUT missing required KYB fields
- **Required Fields**: `business_type` and `category`
- **Redirect**: `/kyb`
- **Token Type**: `KYB`
- **Description**: Business has verified OTP but hasn't completed Know Your Business requirements

### 3. `FULLY_AUTHENTICATED`

- **Condition**: `business.is_active === true` AND has all required KYB fields
- **Redirect**: `/` (dashboard)
- **Token Type**: `AUTHENTICATED`
- **Description**: Business has completed all steps and can access the dashboard

### 4. `INVALID_CREDENTIALS`

- **Condition**: Missing business data or authentication failure
- **Redirect**: `/login`
- **Token Type**: `VERIFY_OTP`
- **Description**: Fallback state for authentication errors

## Key Business Properties

### `is_active` (boolean)

- `false`: Business has not completed OTP verification
- `true`: Business has completed OTP verification

### `is_verified` (string: "Pending" | "Accepted" | "Denied")

- **Note**: Currently not actively used in the flow logic
- This is set by internal admin after manual verification
- The KYB completion status is determined by the presence of required fields

### Required KYB Fields

- `business_type`: Type of business
- `category`: Business category (IBusinessCategory)
- Additional fields can be added to `KYBRequiredFields` interface

## Usage

### Login Flow

```typescript
// In login page
const authFlow = processBusinessAuth(business, access_token);

// Set session with appropriate token type
setSession(access_token, authFlow.tokenType, minimal);

// Show user-friendly message
toast.info(authFlow.message);

// Redirect to appropriate page
router.replace(authFlow.redirectPath);
```

### Signup Flow

```typescript
// After successful signup, always redirect to verify
setSession(token, TokenType.PASSWORD_RESET, businessData);
router.push("/verify");
```

### OTP Verification Flow

```typescript
// After successful OTP verification, determine next step
const authFlow = processBusinessAuth(business, access_token);
actions.setSession(access_token, authFlow.tokenType, business);
router.push(authFlow.redirectPath); // Usually /kyb
```

### Password Reset Flow

```typescript
// After successful password reset, check business state
const resetFlow = handlePasswordResetSuccess(business, access_token);

// Set session if we have valid token and business data
if (resetFlow.shouldSetSession && access_token) {
  setSession(access_token, resetFlow.tokenType, business);
}

// Show success message and redirect
toast.success("Password reset successful", { description: resetFlow.message });
router.push(resetFlow.redirectPath);
```

## Utility Functions

### `getBusinessAuthState(business)`

Determines the current authentication state of a business.

### `getRedirectPath(authState)`

Returns the appropriate redirect path for each state.

### `getTokenType(authState)`

Returns the appropriate token type for the auth store.

### `processBusinessAuth(business, access_token)`

Complete function that processes business authentication and returns:

- `authState`: Current authentication state
- `redirectPath`: Where to redirect the user
- `tokenType`: Token type for the store
- `shouldSetSession`: Whether to set the session
- `message`: User-friendly message

### Helper Functions

- `hasCompletedFullSignupFlow(business)`: Check if fully authenticated
- `needsKYBCompletion(business)`: Check if needs KYB
- `needsOTPVerification(business)`: Check if needs OTP
- `handlePasswordResetSuccess(business?, access_token?)`: Handle password reset flow and determine appropriate redirect

## Benefits of Centralized Logic

1. **Consistency**: All auth pages use the same logic for state determination
2. **Maintainability**: Changes to auth flow requirements only need to be made in one place
3. **Readability**: Complex conditional logic is abstracted into clear, named functions
4. **Type Safety**: TypeScript interfaces ensure proper data handling
5. **Testing**: Centralized logic is easier to unit test
6. **Documentation**: Single source of truth for auth flow logic
7. **Session Management**: Verification session hooks provide consistent session validation across flows
8. **Error Handling**: Standardized error messages and redirect logic
9. **Security**: Server-side token validation prevents unauthorized access
10. **User Experience**: Automatic session recovery and appropriate redirects

## Adding New Requirements

To add new KYB requirements:

1. Update `KYBRequiredFields` interface in `auth-flow-utils.ts`
2. Update the `getBusinessAuthState` function to check for new fields
3. The flow will automatically handle the new requirements

Example:

```typescript
// Add new required field
export interface KYBRequiredFields {
  business_type: string | null;
  category: IBusinessCategory | null;
  business_name: string | null; // New requirement
  tax_identification_number: string | null; // New requirement
}

// Update the check in getBusinessAuthState
const hasRequiredKYBFields = Boolean(
  business.business_type &&
    business.category &&
    business.business_name && // Check new field
    business.tax_identification_number, // Check new field
);
```

## Session Validation and Recovery

The system includes sophisticated session validation for handling edge cases like browser close/token expiration:

### Verification Session Hooks

The system now uses specialized verification session hooks for different auth flows. These hooks provide consistent session validation, token verification, and draft ownership management:

#### Available Hooks

- **`useKybSession()`**: For KYB verification flows
- **`useOtpSession()`**: For OTP verification flows
- **`usePasswordResetSession()`**: For password reset flows
- **`useVerificationSession(config)`**: Generic hook for custom verification flows

#### Hook API

```typescript
const { isInitialized, isValid, isLoading } = useKybSession();

// Returns:
// - isInitialized: boolean - Whether session check is complete
// - isValid: boolean - Whether user has valid session for this flow
// - isLoading: boolean - Whether token verification is in progress
```

#### Usage in Auth Pages

```typescript
// KYB Verification Flow
function KybVerificationFlow() {
  const { isInitialized, isValid, isLoading } = useKybSession();

  if (!isInitialized || isLoading) {
    return <LoadingSpinner />;
  }

  if (!isValid) {
    return null; // Hook handles redirects automatically
  }

  return <KybSteps />;
}

// OTP Verification Flow
function VerifyOtpPage() {
  const { isInitialized, isValid, isLoading } = useOtpSession();

  if (!isInitialized || isLoading) {
    return <LoadingSpinner />;
  }

  if (!isValid) {
    return null; // Hook handles redirects automatically
  }

  return <OtpForm />;
}
```

#### Custom Verification Flows

For custom verification flows, use the generic `useVerificationSession` hook:

```typescript
const { isInitialized, isValid, isLoading } = useVerificationSession({
  requiredTokenType: TokenType.CUSTOM,
  loginRedirectPath: "/custom-login",
  invalidSessionMessage: "Please sign in to continue custom flow",
  expiredSessionMessage: "Your custom session has expired",
  initializeKybOwnership: false,
  sessionStorageKey: "custom_session_id",
});
```

### Legacy Session Validation Hook

The `useSessionValidation()` hook is now deprecated for new implementations. Use the verification session hooks instead:

```typescript
// ❌ Deprecated - Don't use for new code
useSessionValidation("/verify");

// ✅ Recommended - Use specific verification hooks
const { isInitialized, isValid, isLoading } = useOtpSession();
```

## Token Verification Endpoint

The system includes a `/v1/verifyToken` endpoint for server-side token validation, now integrated with the verification session hooks:

### API Integration

```typescript
// verifyToken API method used by verification session hooks
useVerifyToken: () =>
  useSafeMutation<BaseApiResponse<{ isValid: boolean; business?: IBusiness }>>({
    mutationFn: async () => {
      const response = await apiClient.get(
        ENDPOINTS.BUSINESS_AUTH.VERIFY_TOKEN,
      );
      return response.data;
    },
    // Used internally by verification session hooks
  });
```

### Integration with Verification Hooks

The verification session hooks automatically use this endpoint for server-side validation:

1. **Automatic Verification**: Hooks verify tokens on mount
2. **Session Recovery**: Validates stored tokens when users return
3. **State Synchronization**: Updates business data from server
4. **Draft Ownership**: Manages KYB draft ownership for authenticated sessions

### Use Cases

1. **Session Recovery**: Validate stored tokens when users return after browser close
2. **Middleware Checks**: Server-side token validation for protected routes
3. **Background Validation**: Periodic token health checks for long-running sessions
4. **Security**: Ensure tokens haven't been compromised or expired on the server
5. **Data Freshness**: Get latest business data from server during validation

### Server-Enhanced Session Validation

The verification hooks use the `validateSessionWithServer` utility for enhanced validation:

```typescript
// Used internally by verification session hooks
const validation = await validateSessionWithServer(
  tokenType,
  business,
  currentPath,
  verifyTokenFn, // Server verification function
);

if (!validation.isValid) {
  // Handle invalid session with appropriate redirects and messages
  clearSession();
  router.push(validation.redirectPath);
  toast.error(validation.message);
}
```

## Verification Session Hooks Architecture

The verification session hooks provide a unified approach to handling different verification flows with consistent behavior and error handling.

### Hook Architecture

#### Generic Hook: `useVerificationSession(config)`

The foundation hook that can be configured for any verification flow:

```typescript
interface VerificationSessionConfig {
  requiredTokenType: TokenType; // Required token type for this flow
  loginRedirectPath?: string; // Redirect path for invalid sessions
  invalidSessionMessage?: string; // Error message for invalid sessions
  expiredSessionMessage?: string; // Error message for expired sessions
  initializeKybOwnership?: boolean; // Whether to manage KYB draft ownership
  sessionStorageKey?: string; // Session storage key for anonymous sessions
}
```

#### Pre-configured Convenience Hooks

- **`useKybSession()`**: Configured for KYB verification flows
- **`useOtpSession()`**: Configured for OTP verification flows
- **`usePasswordResetSession()`**: Configured for password reset flows

### Validation Process

The verification session hooks handle validation automatically:

1. **Mount**: Hook initializes and checks current session state
2. **Server Verification**: Validates token with `/v1/verifyToken` endpoint
3. **State Check**: Ensures token type matches required flow (OTP, KYB, etc.)
4. **Data Sync**: Updates business data from server response
5. **Draft Management**: Initializes KYB draft ownership for authenticated sessions
6. **Result**: Returns validation state for component rendering

### Legacy Validation Process (Deprecated)

The old `useSessionValidation()` hook followed this process:

1. **Trigger**: When middleware detects an intermediate token and adds `?validate=true` parameter
2. **Check**: `validateIntermediateSession()` verifies token validity and business state consistency
3. **Action**: Invalid sessions are cleared and users redirected appropriately
4. **Recovery**: Valid sessions show "Welcome back" message and allow continuation

### Hook Lifecycle

1. **Initialization**: Hook mounts and checks current session state
2. **Token Validation**: Verifies token with server using `useVerifyToken`
3. **State Update**: Updates business data from server response
4. **Draft Management**: Initializes KYB draft ownership if enabled
5. **Result**: Returns validation state for component rendering

### Error Handling Strategy

- **Network Failures**: Allow user to continue with client-side validation
- **Invalid Tokens**: Clear session and redirect to appropriate login page
- **Expired Sessions**: Show appropriate error messages and redirect
- **State Mismatches**: Redirect to correct step in auth flow

### Session Storage Management

For flows that support anonymous sessions (like KYB), the hooks manage session storage:

```typescript
// Generate unique session ID for anonymous users
const sessionId = `anon-${Math.random().toString(36).slice(2, 10)}`;
sessionStorage.setItem(sessionStorageKey, sessionId);
```

### Integration with Auth Store

The hooks integrate seamlessly with the auth store:

- **Token Type Checking**: Validates current token matches required type
- **Business Data Access**: Gets current business data from store
- **Session Management**: Uses store actions for clearing sessions
- **Data Updates**: Updates business data from server validation

### Migration from Legacy Hooks

#### Before (Legacy)

```typescript
// Multiple useEffect hooks with complex logic
useEffect(() => {
  // 80+ lines of session validation logic
  // Manual token verification
  // Complex error handling
}, [tokenType, router, verifyTokenMutation]);

// Plus separate useSessionValidation hook
useSessionValidation("/verify");
```

#### After (Modern)

```typescript
// Single hook call with consistent behavior
const { isInitialized, isValid, isLoading } = useOtpSession();

if (!isInitialized || isLoading) return <LoadingSpinner />;
if (!isValid) return null; // Hook handles everything automatically
```

## Session Validation Approaches

The system provides multiple session validation approaches for different use cases. Choose the right tool for your specific scenario:

### 1. **Verification Session Hooks** (Recommended for Primary Flows)

**Use Case**: Primary validation for active verification flows (KYB, OTP, password reset)

**Available Hooks**:

- `useKybSession()` - KYB verification flows
- `useOtpSession()` - OTP verification flows
- `usePasswordResetSession()` - Password reset flows

**Best for:**

- ✅ Building new verification flows
- ✅ Active user verification journeys
- ✅ Flows requiring KYB draft ownership
- ✅ Automatic session recovery after browser close

```typescript
// Example: KYB verification component
const KybVerificationFlow = () => {
  const { session, isLoading, error } = useKybSession();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return <VerificationSteps session={session} />;
};
```

#### Legacy Session Validation (`useSessionValidation`)

Use this hook for **recovery validation** when users return to auth pages after being away:

**Best for:**

- ✅ Recovery validation when users return to auth pages
- ✅ Checking if existing sessions are still valid
- ✅ Non-primary verification flows

```typescript
// Example: Auth page recovery
const AuthPage = () => {
  const { isValid, isLoading } = useSessionValidation();

  if (isLoading) return <LoadingSpinner />;
  if (!isValid) return <RedirectToLogin />;

  return <AuthForm />;
};
```

#### Server-Side Validation (`validateSessionWithServer`)

Use this utility for **programmatic validation** in API routes, middleware, or utilities:

**Best for:**

- ✅ Server-side validation in API routes
- ✅ Middleware token checking
- ✅ Programmatic session validation

```typescript
// Example: API route validation
export async function GET(request: NextRequest) {
  const validation = await validateSessionWithServer(request);

  if (!validation.isValid) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  return NextResponse.json({ data: "Protected data" });
}
```

### Decision Tree

```mermaid
New verification flow?
├── YES → Use verification session hooks (useKybSession, useOtpSession, etc.)
│   └── Handles: Auto-validation, draft ownership, loading states
│
└── NO → Recovery/validation check?
    ├── YES → Use useSessionValidation
    │   └── Handles: Existing session validation, recovery scenarios
    │
    └── NO → Server-side/API validation?
        └── YES → Use validateSessionWithServer
            └── Handles: Programmatic validation, middleware
```

### Quick Reference

| Scenario              | Hook/Utility                  | Purpose                               |
| --------------------- | ----------------------------- | ------------------------------------- |
| KYB verification flow | `useKybSession()`             | Primary KYB flow with draft ownership |
| OTP verification      | `useOtpSession()`             | Primary OTP flow                      |
| Password reset        | `usePasswordResetSession()`   | Primary password reset flow           |
| Auth page recovery    | `useSessionValidation()`      | Check existing session validity       |
| API route protection  | `validateSessionWithServer()` | Server-side token validation          |

#### From `useSessionValidation` to Verification Hooks

```typescript
// Before: Manual validation with useEffect
const MyComponent = () => {
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    validateSessionWithServer().then(result => {
      setIsValid(result.isValid);
      setLoading(false);
    });
  }, []);

  if (loading) return <Spinner />;
  if (!isValid) return <Redirect />;

  return <Content />;
};

// After: Automatic validation with hooks
const MyComponent = () => {
  const { session, isLoading, error } = useKybSession();

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;

  return <Content session={session} />;
};
```

#### Benefits of Migration

- ✅ **80% less code** in components
- ✅ **Automatic session recovery** after browser close
- ✅ **Built-in loading states** and error handling
- ✅ **KYB draft ownership** management
- ✅ **Consistent UX** across all verification flows
