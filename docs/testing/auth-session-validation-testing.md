# Testing Guide for Auth Session Validation Fix

## Overview

This guide helps verify that the auth session validation fixes prevent users from being kicked out unnecessarily.

## Test Scenarios

### 1. Password Reset Flow (Critical Fix)

#### Test Case: Email Link Access

- **Before Fix**: Users redirected away from reset page
- **After Fix**: Users can access reset page and enter code

**Steps to Test:**

1. Go to `/forgot-password`
2. Enter email and submit
3. Navigate to `/reset-password` directly (simulating email link)
4. **Expected**: Page loads without redirect
5. Enter invalid code first → should show error but stay on page
6. Enter valid code + new password → should process successfully

#### Test Case: Session Recovery

- **Before Fix**: Strict session validation caused redirects
- **After Fix**: More lenient validation allows continuation

**Steps to Test:**

1. Start forgot password flow
2. Close browser tab
3. Reopen and go to `/reset-password`
4. **Expected**: Can still access page and complete reset

### 2. OTP Verification Flow (Critical Fix)

#### Test Case: Post-Signup OTP

- **Before Fix**: Token type mismatches caused redirects
- **After Fix**: More flexible token validation

**Steps to Test:**

1. Complete signup flow
2. **Expected**: Redirected to `/verify` page successfully
3. Page loads without session validation errors
4. Enter invalid OTP → should show error but stay on page
5. Enter valid OTP → should redirect based on business state

#### Test Case: Session Continuation

- **Before Fix**: Strict business data requirements
- **After Fix**: Allows access with basic email + token

**Steps to Test:**

1. Start signup → OTP flow
2. Simulate browser refresh on OTP page
3. **Expected**: Page reloads successfully (doesn't redirect to login)
4. OTP functionality works normally

### 3. Token Verification Failures (General Fix)

#### Test Case: Network Issues

- **Before Fix**: Hard redirects on verification failures
- **After Fix**: Graceful warnings, allow continuation

**Steps to Test:**

1. Access any auth page (OTP, KYB, reset-password)
2. Simulate network disconnection during token verification
3. **Expected**: Warning toast appears but page doesn't redirect
4. User can continue with their flow

#### Test Case: Expired Sessions

- **Before Fix**: Immediate redirects
- **After Fix**: Different handling for temporary vs permanent tokens

**Steps to Test:**

1. Start OTP or password reset flow
2. Wait for token to expire (or manually expire in browser dev tools)
3. **Expected**: Warning message but can still continue
4. For KYB/authenticated flows: May redirect but with better messaging

### 4. Edge Cases

#### Test Case: Partial Business Data

- **Before Fix**: Required complete business object
- **After Fix**: More lenient requirements

**Steps to Test:**

1. Signup with minimal data
2. Check that OTP flow works even with incomplete business object
3. **Expected**: Flow continues as long as email and basic data present

#### Test Case: Token Type Mismatches

- **Before Fix**: Strict token type matching
- **After Fix**: Flexible matching for temporary flows

**Steps to Test:**

1. Complete signup (should set VERIFY_OTP token)
2. Navigate between pages
3. **Expected**: No unexpected redirects due to token type issues

## Success Criteria

### ✅ Users Should NOT Be Kicked Out When:

- Accessing reset-password page from email links
- Refreshing OTP verification page after signup
- Experiencing temporary network issues during token verification
- Having slight token type mismatches in temporary flows
- Missing some non-essential business data fields

### ✅ Users SHOULD Still Be Redirected When:

- No token exists for authenticated-only areas
- Token is completely invalid for critical operations
- Business state requires different flow (e.g., needs KYB completion)

### ✅ Expected Behavior Changes:

- **More Warning Toasts**: Instead of silent redirects
- **Better Error Messages**: Clear explanations of what happened
- **Graceful Degradation**: Partial functionality rather than complete blocking
- **Flexible Validation**: Focus on essential data rather than perfect matches

## Common Issues to Watch For

1. **Infinite Redirect Loops**: Should not occur with new validation
2. **Session Loss**: Users should maintain progress through flows
3. **Error Messages**: Should be helpful, not confusing
4. **Mobile/Slow Networks**: Should handle delayed API responses better

## Developer Testing Commands

```bash
# Check for compilation errors
npm run build

# Run type checking
npm run type-check

# Test in development
npm run dev

# Clear browser storage between tests
localStorage.clear(); sessionStorage.clear();
```

## Rollback Plan

If issues occur, revert these files:

- `src/hooks/useVerificationSession.ts`
- `src/app/(auth)/signup/page.tsx`
- `src/app/(auth)/reset-password/page.tsx`

The changes are backward compatible but can be reverted cleanly if needed.
