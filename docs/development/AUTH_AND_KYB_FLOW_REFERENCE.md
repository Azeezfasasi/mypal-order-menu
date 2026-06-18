# Authentication & KYB Flow Reference

**Complete guide to authentication states, token types, and screen flows**

---

## Token Types

| Token Type          | Purpose                                    | Lifespan   | Server Verification      | Persisted to LocalStorage |
| ------------------- | ------------------------------------------ | ---------- | ------------------------ | ------------------------- |
| `authenticated`     | Full dashboard access                      | 30 days    | ✅ Yes                   | ✅ Yes                    |
| `otp`               | Email verification in progress             | 15 minutes | ✅ Yes                   | ❌ No (cookies only)      |
| `kyb`               | KYB completion in progress (direct signup) | 15 minutes | ✅ Yes                   | ❌ No (cookies only)      |
| `onboarding_invite` | Invited business onboarding                | 15 minutes | ❌ No (client-side only) | ❌ No (cookies only)      |
| `password_reset`    | Password reset in progress                 | 15 minutes | ✅ Yes                   | ❌ No (cookies only)      |

---

## Business Authentication States

| State                    | Description                             | Next Step         | Token Type                   |
| ------------------------ | --------------------------------------- | ----------------- | ---------------------------- |
| `INVALID_CREDENTIALS`    | No valid session                        | User must log in  | N/A                          |
| `NEEDS_OTP_VERIFICATION` | Email not verified (direct signup only) | Verify OTP code   | `otp`                        |
| `NEEDS_KYB_COMPLETION`   | Business profile incomplete             | Complete KYB form | `kyb` or `onboarding_invite` |
| `AWAITING_VERIFICATION`  | KYB submitted, awaiting admin review    | View status page  | `kyb`                        |
| `FULLY_AUTHENTICATED`    | All requirements met                    | Access dashboard  | `authenticated`              |

---

## Flow 1: Direct Signup (Traditional)

**User signs up directly on the website**

### Step 1: Signup

- **Screen:** `/signup`
- **Action:** User enters email, password, basic info
- **Token Type:** None
- **Backend Response:** Creates business with `is_active: false`, `onboarding_source: "DirectSignup"`

### Step 2: OTP Verification

- **Screen:** `/kyb` → redirected to `/verify`
- **Token Type:** `otp`
- **Validation:**
  - Client: `useOtpSession()` checks for `otp` token
  - Server: Verifies token via `/verifyToken`
- **Action:** User enters OTP code from email
- **Backend Updates:** Sets `is_active: true`

### Step 3: KYB Completion

- **Screen:** `/kyb`
- **Token Type:** `kyb`
- **Validation:**
  - Client: `useKybSession()` checks for `kyb` token
  - Server: Verifies token via `/verifyToken`
- **Action:** User fills out business details, uploads documents
- **Backend Updates:**
  - Sets all KYB fields
  - Sets `onboarding_status: "Completed"`
  - Sets `is_verified: "Pending"`

### Step 4: Awaiting Verification

- **Screen:** `/kyb/status`
- **Token Type:** `kyb`
- **Display:** Shows "Under Review" message
- **Action:** User waits for admin to review

### Step 5: Admin Approval

- **Action:** Admin reviews and approves in admin panel
- **Backend Updates:** Sets `is_verified: "Accepted"`

### Step 6: Full Access

- **Screen:** `/` (Dashboard)
- **Token Type:** `authenticated`
- **Action:** User logs in again after approval
- **Auth State:** `FULLY_AUTHENTICATED`

---

## Flow 2: Admin Invite

**Admin creates business account and sends invite link**

### Step 1: Admin Creates Business

- **Screen:** Admin panel
- **Action:** Admin enters business details and sends invite
- **Backend Creates:**
  - Business with pre-filled fields
  - `is_active: true` (no OTP needed)
  - `onboarding_source: "AdminInvite"`
  - `onboarding_status: "Invited"`
  - `is_verified: "Pending"`
  - Invite token stored in `onboarding_token_hash`

### Step 2: Set Password

- **Screen:** `/onboarding?token=xxx` → Onboarding flow with password setup
- **Token Type:** Special onboarding token from invite link
- **Action:** User clicks invite link, validates token, sets password
- **Backend Updates:**
  - Sets password
  - Sets `onboarding_status: "PasswordSet"`
  - Clears `onboarding_token_hash`
  - Returns access token

### Step 3: Auto-Login After Password Set

- **Action:** System automatically logs user in
- **Backend Response:** Returns business data with `needs_onboarding: true`
- **Auth State:** `NEEDS_KYB_COMPLETION`
- **Token Type:** `onboarding_invite`

### Step 4: KYB Completion

- **Screen:** `/kyb` (redirected automatically)
- **Token Type:** `onboarding_invite`
- **Validation:**
  - Client: `useKybSession()` accepts both `kyb` and `onboarding_invite` tokens
  - Server: **No verification** (onboarding_invite is client-side only)
  - Middleware: Allows access to `/kyb` routes
- **Action:** User fills out additional business details, uploads documents
- **Backend Updates:**
  - Sets all KYB fields
  - Sets `onboarding_status: "Completed"`
  - `is_verified` remains "Pending"

### Step 5: Awaiting Verification

- **Screen:** `/kyb/status`
- **Token Type:** `kyb` (after relogin)
- **Display:** Shows "Under Review" message
- **Action:** User waits for admin to review additional fields

### Step 6: Admin Approval

- **Action:** Admin reviews and approves
- **Backend Updates:** Sets `is_verified: "Accepted"`

### Step 7: Full Access

- **Screen:** `/` (Dashboard)
- **Token Type:** `authenticated`
- **Action:** User logs in again after approval
- **Auth State:** `FULLY_AUTHENTICATED`

---

## Flow 3: Self-Service Invite

**Business requests invite via self-service portal**

### Step 1: Business Requests Invite

- **Screen:** Self-service portal
- **Action:** Business fills out request form
- **Backend Creates:**
  - Business with some pre-filled fields
  - `is_active: true`
  - `onboarding_source: "SelfService"`
  - `onboarding_status: "Invited"`
  - `is_verified: "Pending"`
  - Invite token

### Step 2-7: Same as Admin Invite

- Follows exact same flow as Admin Invite (Steps 2-7)
- Uses `onboarding_invite` token type
- Same screens and validations

---

## Screen-to-Token-Type Mapping

| Screen              | Allowed Token Types        | Validation Hook             | Server Verification                          |
| ------------------- | -------------------------- | --------------------------- | -------------------------------------------- |
| `/login`            | None (public)              | N/A                         | N/A                                          |
| `/signup`           | None (public)              | N/A                         | N/A                                          |
| `/verify`           | `otp`                      | `useOtpSession()`           | ✅ Yes                                       |
| `/kyb`              | `kyb`, `onboarding_invite` | `useKybSession()`           | `kyb`: ✅ Yes<br/>`onboarding_invite`: ❌ No |
| `/kyb/status`       | `kyb`                      | `useKybSession()`           | ✅ Yes                                       |
| `/reset-password`   | `password_reset`           | `usePasswordResetSession()` | ✅ Yes                                       |
| `/` (Dashboard)     | `authenticated`            | `useAuth()`                 | ✅ Yes                                       |
| All other protected | `authenticated`            | `useAuth()`                 | ✅ Yes                                       |

---

## Middleware Token Routing

**File:** `middleware.ts`

```typescript
// No token → Redirect to /login
if (!token) → '/login'

// OTP token → Must be on /verify
if (tokenType === 'otp' && !pathname.startsWith('/verify')) → '/verify'

// KYB or Onboarding Invite → Must be on /kyb
if (tokenType === 'kyb' || tokenType === 'onboarding_invite') {
  if (!pathname.startsWith('/kyb')) → '/kyb'
}

// Password Reset → Must be on /reset-password
if (tokenType === 'password_reset' && !pathname.startsWith('/reset-password')) → '/reset-password'

// Authenticated → Allow all routes
if (tokenType === 'authenticated') → Allow
```

---

## Auth State Decision Logic

**File:** `src/lib/auth-flow-utils.ts` → `getBusinessAuthState()`

### Priority Order (Highest to Lowest):

1. **Authentication Validity**
   - No business → `INVALID_CREDENTIALS`

2. **OTP Verification** (Direct Signup Only)
   - `is_active === false` AND `onboarding_source === "DirectSignup"` → `NEEDS_OTP_VERIFICATION`

3. **Verification Status** (Highest Authority)
   - `is_verified === "Pending"` + valid fields → `AWAITING_VERIFICATION`
   - `is_verified === "Pending"` + missing fields → `NEEDS_KYB_COMPLETION`
   - `is_verified === "Request"` → `NEEDS_KYB_COMPLETION`
   - `is_verified === "Denied"` → `NEEDS_KYB_COMPLETION`
   - `is_verified === "Accepted"` + all valid → `FULLY_AUTHENTICATED`

4. **Explicit Onboarding Status** (Invited Flows Only)
   - `onboarding_status === "Invited"` → `NEEDS_KYB_COMPLETION`
   - `onboarding_status === "PasswordSet"` → `NEEDS_KYB_COMPLETION`
   - `onboarding_status === "Completed"` + missing fields → `NEEDS_KYB_COMPLETION`
   - `onboarding_status === "Completed"` + valid fields → `AWAITING_VERIFICATION`

5. **Field Completeness** (Direct Signup)
   - Missing required fields → `NEEDS_KYB_COMPLETION`
   - Has valid fields + no verification status → `AWAITING_VERIFICATION`

---

## Token Type Assignment Logic

**File:** `src/lib/auth-flow-utils.ts` → `getTokenType()`

```typescript
switch (authState) {
  case NEEDS_OTP_VERIFICATION:
    return "otp";

  case NEEDS_KYB_COMPLETION:
    // Invited flow → onboarding_invite
    if (isInvitedFlow(business)) return "onboarding_invite";
    // Direct signup → kyb
    return "kyb";

  case AWAITING_VERIFICATION:
    return "kyb";

  case FULLY_AUTHENTICATED:
    return "authenticated";

  default:
    return "otp"; // Fallback
}
```

---

## Session Validation Hooks

### `useVerificationSession(config)`

**Generic hook for temporary token flows**

- Validates token type matches required type
- Reads from Zustand store + cookies (fallback)
- Handles server verification (if enabled)
- Initializes KYB draft ownership (if enabled)

### `useOtpSession()`

**Pre-configured for OTP verification**

- Required token: `otp`
- Server verification: ✅ Enabled
- Fresh session threshold: 2.5 minutes

### `useKybSession()`

**Pre-configured for KYB completion**

- Required token: `kyb`
- **Also accepts:** `onboarding_invite`
- Server verification:
  - `kyb` tokens: ✅ Enabled
  - `onboarding_invite` tokens: ❌ Disabled (client-side only)
- Fresh session threshold: 5 minutes
- KYB draft ownership: ✅ Enabled

### `usePasswordResetSession()`

**Pre-configured for password reset**

- Required token: `password_reset`
- Server verification: ✅ Enabled
- Fresh session threshold: 15 minutes

---

## Cookie vs LocalStorage Storage

### Cookies (Always)

- `token` - JWT token (HttpOnly = false for client access)
- `tokenType` - Token type identifier
- **Expiry:**
  - Authenticated tokens: 30 days
  - Temporary tokens: 15 minutes

### LocalStorage (via Zustand persist)

- Full business object
- Token and tokenType
- **Partialized for temporary tokens:**
  - `otp`, `kyb`, `onboarding_invite`, `password_reset` → Only `business.id` persisted
  - `authenticated` → Full business object persisted

### Why This Matters

- Temporary tokens don't persist full data to localStorage for security
- Cookies persist tokenType even when store shows `null`
- Validation hooks read from **cookies as fallback** when store is null

---

## Critical Implementation Notes

### 1. `onboarding_invite` Token Special Handling

**Why it exists:**

- Invited businesses get access token immediately after setting password
- Backend returns `onboarding_status: "PasswordSet"`, `needs_onboarding: true`
- Client needs to grant KYB access without full authentication

**Why it skips server verification:**

- This is a temporary client-side token for invited onboarding flows
- Server `/verifyToken` endpoint returns 401 for these tokens
- Validation is client-side only via business state checks

**Implementation:**

```typescript
// In useVerificationSession.ts
const shouldVerifyToken =
  !!token &&
  effectiveTokenType !== TokenType.ONBOARDING_INVITE && // Skip!
  // ... other conditions
```

### 2. Cookie Fallback Pattern

**Problem:** Temporary tokens don't persist to localStorage
**Solution:** Read from cookies when store returns null

```typescript
const getTokenTypeFromCookies = () => {
  const cookies = document.cookie.split(";");
  const tokenTypeCookie = cookies.find((c) =>
    c.trim().startsWith("tokenType="),
  );
  return tokenTypeCookie ? tokenTypeCookie.split("=")[1] : null;
};

const effectiveTokenType = tokenType || getTokenTypeFromCookies();
```

### 3. Re-validation Prevention

**Problem:** useEffect dependencies can cause multiple validation runs
**Solution:** Skip validation if already validated successfully

```typescript
// If already validated successfully, skip re-validation
if (isInitialized && isValid) {
  console.log("Already validated, skipping");
  return;
}
```

---

## Troubleshooting Guide

### Issue: "Expected kyb token but found none"

**Cause:** Store tokenType is null because temporary tokens don't persist
**Fix:** Cookie fallback implemented (reads from cookies)

### Issue: Redirect loop between /login and /kyb

**Causes:**

1. Middleware not recognizing `onboarding_invite` token → Fixed: Added to allowed list
2. Session validation rejecting `onboarding_invite` → Fixed: Accept in `useKybSession()`
3. Protected route checking `isAuthenticated()` which requires `authenticated` token → Fixed: `/kyb` in `(auth)` group, not `(protected)`

### Issue: 401 Unauthorized on /verifyToken for invited business

**Cause:** Server doesn't recognize `onboarding_invite` tokens
**Fix:** Skip server verification for `onboarding_invite` tokens

---

## File References

| File                                  | Purpose                                                |
| ------------------------------------- | ------------------------------------------------------ |
| `src/lib/auth-flow-utils.ts`          | State machine, token type assignment, auth state logic |
| `src/hooks/useVerificationSession.ts` | Session validation hooks for temporary flows           |
| `src/hooks/use-auth.ts`               | Authentication check for protected routes              |
| `src/stores/auth-store.ts`            | Zustand store for auth state, cookies, localStorage    |
| `middleware.ts`                       | Route protection and token-based redirects             |
| `src/app/(auth)/`                     | Public auth pages (login, signup, verify, kyb)         |
| `src/app/(protected)/`                | Protected dashboard pages                              |
| `src/components/protected-route/`     | Component wrapper for protected routes                 |

---

**Last Updated:** January 16, 2026
**Version:** 1.0
