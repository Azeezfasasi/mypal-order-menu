# Invited Business Onboarding Flow - UX & Security Analysis

## Overview

This document outlines the **optimal UX and security flow** for invited businesses that receive an onboarding link with pre-assigned business information.

---

## Current System Analysis

### Existing Authentication Flows

Your system has established:

1. **Standard Signup** → OTP Verification → KYB Completion → Dashboard
2. **Login** → State Check → Appropriate Redirect
3. **Password Reset** → Token Verification → Reset Password → State Check
4. **KYB Verification** → Multi-step form → Document Upload → Review → Submission

### Available Endpoints for Onboarding

1. `GET /v1/businesses/onboarding/{token}` - Validate token & return pre-assigned business info
2. `POST /v1/businesses/onboarding/{token}/password` - Set password before uploading documents

---

## Recommended Onboarding Flow

### **Phase 1: Token Validation & Information Display (Public/Unauthenticated)**

```
Entry Point: https://mypal-business-admin.onrender.com/onboarding?token=dbc3cc9758c4b74704f038ac3fff4fc2388ae149093792ad
```

**Step 1: Validate Token**

- Extract token from URL query parameter
- Call endpoint: `GET /v1/businesses/onboarding/{token}`
- **Success Response**: Return pre-assigned business data
  ```json
  {
    "business_name": "Sunshine Hotel",
    "business_email": "contact@sunshinehotel.com",
    "business_phone_number": "+234 123 456 7890",
    "category_id": "string",
    "city": "Lagos",
    "state": "Lagos State",
    "country": "Nigeria"
  }
  ```
- **Failure**: Show error with options to request new link

**UX Considerations:**

- Display read-only preview of pre-filled information
- Show professional welcome message from internal admin
- Display progress indicator (Step 1/3: Review → Step 2/3: Set Password → Step 3/3: Upload Documents)

---

### **Phase 2: Password Setup (Still Unauthenticated)**

**Step 2: Set Password**

- Display password setup form with:
  - Password input with strength indicator
  - Confirm password field
  - Clear requirements display
- Call endpoint: `POST /v1/businesses/onboarding/{token}/password`
- **Success Response**: Should return auth tokens (similar to signup)
  ```json
  {
    "access_token": "...",
    "business": { ... },
    "message": "Password set successfully"
  }
  ```

```

**UX Considerations:**
- Make business info visible (read-only card) to provide context
- Show password requirements clearly
- Button text: "Set Password & Continue"

---

### **Phase 3: Document Upload (Authenticated)**
**Step 3: Upload KYB Documents**
- After successful password setup, set session and authenticate user
- Initialize KYB store with pre-filled business data from onboarding token
- **Skip** business type and business details steps (already provided)
- **Show only** documents upload step from existing KYB flow:
  - Business Image
  - CAC Document (if applicable)
  - MEMAT/Articles (if applicable)
  - Director's Identity
  - Address fields

**UX Considerations:**
- Show business details in sidebar (read-only)
- Simplified single-step process (no multi-step wizard)
- Clear instructions on which documents are required vs optional
- Option to save and continue later (draft functionality)

---

## Complete Flow Diagram

```

┌─────────────────────────────────────┐
│ Receive Email with Onboarding Link │
│ ?token=xxxxx │
└────────────┬────────────────────────┘
│
▼
┌─────────────────────────────────────┐
│ /onboarding - Validate Token │
│ GET /v1/businesses/onboarding/{token}
│ │
│ ✓ Display Pre-filled Business Info │
│ ✓ Read-only Preview Card │
│ ✓ Progress: 1/3 │
└────────────┬────────────────────────┘
│ (Token Valid)
▼
┌─────────────────────────────────────┐
│ Set Password │
│ POST /v1/businesses/onboarding/{token}/password
│ │
│ ✓ Password Requirements │
│ ✓ Strength Indicator │
│ ✓ Confirm Password │
│ ✓ Progress: 2/3 │
│ Returns: access_token + business │
└────────────┬────────────────────────┘
│ (Password Set)
▼
┌─────────────────────────────────────┐
│ ✓ Set Session/Authentication │
│ ✓ Initialize KYB Store │
└────────────┬────────────────────────┘
│
▼
┌─────────────────────────────────────┐
│ Upload KYB Documents │
│ (Simplified to Documents Only) │
│ │
│ ✓ Business Image │
│ ✓ Required Documents │
│ ✓ Optional Documents │
│ ✓ Address Fields (if needed) │
│ ✓ Progress: 3/3 │
│ ✓ Review Summary │
└────────────┬────────────────────────┘
│ (Documents Submitted)
▼
┌─────────────────────────────────────┐
│ ✓ Success & Redirect to Dashboard │
└─────────────────────────────────────┘

```

---

## Security Considerations

### 1. **Token Security**
- **Single-use tokens**: Tokens should expire after first successful use
- **Time-based expiration**: Tokens valid for 24-48 hours
- **Rate limiting**: Limit validation attempts to prevent brute force
- **Server-side validation**: Always validate token server-side on each endpoint

### 2. **Session Management**
- **No session before password set**: Don't set auth tokens until password is confirmed
- **Clear token in URL**: Don't store sensitive token data in session storage
- **Re-authentication for documents**: Could require verification before document submission (optional, depends on risk tolerance)

### 3. **Data Protection**
- **HTTPS only**: All endpoints must use HTTPS
- **CORS restrictions**: Whitelist only your domain
- **CSRF protection**: Include CSRF tokens for state-changing operations
- **Input validation**: Validate all fields server-side

### 4. **Audit Trail**
- Log all onboarding attempts (success & failure)
- Log who initiated the invitation (which admin user)
- Log all document uploads
- Store IP addresses for fraud detection

---

## Implementation Architecture

### **New Route Structure**
```

/onboarding/ # Main onboarding page
├── layout.tsx # Onboarding layout (no auth guard)
├── page.tsx # Main onboarding component
└── schema/
└── onboarding-types.ts # Types for onboarding flow

/src/components/onboarding/
├── onboarding-token-validator.tsx # Token validation & display
├── onboarding-password-setup.tsx # Password setup form
├── onboarding-documents-upload.tsx # Documents upload (reuse KYB logic)
├── onboarding-flow.tsx # Main orchestrator component
└── onboarding-progress.tsx # Progress indicator

/src/hooks/
└── useOnboardingSession.ts # Session hook for onboarding flow

/src/lib/
└── onboarding-flow-utils.ts # Helper functions for onboarding

```

---

## Implementation Steps

### **Step 1: Create Onboarding Routes & Components**
1. Create `/onboarding` route with layout (no auth guard)
2. Build token validator component
3. Build password setup component
4. Build documents upload component (wrapper around existing KYB logic)

### **Step 2: Extend KYB Store**
1. Add flag to indicate "invited business" mode
2. Populate pre-filled data from token validation
3. Skip unnecessary steps in wizard

### **Step 3: Create Session Hook**
1. Create `useOnboardingSession` hook (similar to `useOtpSession`)
2. Handle token validation & session initialization
3. Manage redirect logic

### **Step 4: API Integration**
1. Add endpoints to `auth-api.ts`:
   - `useValidateOnboardingToken()`
   - `useSetOnboardingPassword()`
2. Handle token in URL vs session storage

### **Step 5: Error Handling & Recovery**
1. Expired token → Show error with "Request new link" option
2. Invalid token → Show error page
3. Failed password set → Show error, allow retry
4. Network error → Offline mode or retry

---

## UX Flow Details

### **Screen 1: Token Validation & Business Info Preview**
```

┌────────────────────────────────────────┐
│ MyPal - Business Onboarding │
│ Step 1 of 3: Review Your Information │
├────────────────────────────────────────┤
│ │
│ Welcome! You've been invited by │
│ MyPal Admin to join our platform. │
│ │
│ ╔════════════════════════════════╗ │
│ ║ Business Information ║ │
│ ║ (Pre-filled - Review for ║ │
│ ║ accuracy) ║ │
│ ║ ║ │
│ ║ Business Name: ║ │
│ ║ Sunshine Hotel ║ │
│ ║ ║ │
│ ║ Email: ║ │
│ ║ contact@sunshinehotel.com ║ │
│ ║ ║ │
│ ║ Phone: +234 123 456 7890 ║ │
│ ║ Category: Hotels ║ │
│ ║ City: Lagos, Lagos State ║ │
│ ║ Country: Nigeria ║ │
│ ╚════════════════════════════════╝ │
│ │
│ ⓘ Information incorrect? Contact us │
│ │
│ [← Back] [Next →] │
└────────────────────────────────────────┘

```

### **Screen 2: Set Password**
```

┌────────────────────────────────────────┐
│ MyPal - Business Onboarding │
│ Step 2 of 3: Set Your Password │
├────────────────────────────────────────┤
│ │
│ Create a secure password to access │
│ your MyPal Business Admin account. │
│ │
│ ╔════════════════════════════════╗ │
│ ║ Business: Sunshine Hotel ║ │
│ ║ Email: contact@...com ║ │
│ ╚════════════════════════════════╝ │
│ │
│ Password │
│ [████████████████] ✓ Strong │
│ │
│ Confirm Password │
│ [████████████████] │
│ │
│ Requirements: │
│ ✓ At least 8 characters │
│ ✓ One uppercase letter │
│ ✓ One lowercase letter │
│ ✓ One number │
│ ✓ One special character │
│ │
│ [← Back] [Set Password & Continue] │
└────────────────────────────────────────┘

```

### **Screen 3: Upload Documents**
```

┌────────────────────────────────────────┐
│ MyPal - Business Onboarding │
│ Step 3 of 3: Upload Documents │
├────────────────────────────────────────┤
│ │
│ ╔════════════════════════════════╗ │
│ ║ Business: Sunshine Hotel ║ │
│ ║ Category: Hotels ║ │
│ ╚════════════════════════════════╝ │
│ │
│ Required Documents: │
│ │
│ □ Business Logo/Image │
│ [Browse Files] │
│ │
│ □ CAC Document (PDF/Image) │
│ [Browse Files] │
│ │
│ Optional Documents: │
│ │
│ □ M.E.M.A.T./Articles of Association │
│ [Browse Files] │
│ │
│ □ Director's Proof of ID │
│ [Browse Files] │
│ │
│ [← Back] [Review & Submit] │
└────────────────────────────────────────┘

```

---

## Edge Cases & Error Handling

| Scenario | Action |
|----------|--------|
| **Invalid/Expired Token** | Show error page with "Request New Link" button → Contact Support |
| **Token Already Used** | Show error, suggest login if business has account |
| **Session Timeout** | Save form state, redirect to login |
| **Failed Document Upload** | Show error, allow retry, save draft |
| **Browser Back Button** | Warn user they'll lose progress, confirm action |
| **Multiple Tab/Window** | Handle gracefully, sync if possible |
| **Mobile Network Interruption** | Queue documents for retry, show offline state |

---

## Security Best Practices Checklist

- [ ] Tokens are single-use and time-limited
- [ ] All validations happen server-side
- [ ] No sensitive data in URL/localStorage (only sessionStorage)
- [ ] CSRF protection on password endpoint
- [ ] Rate limiting on token validation
- [ ] Audit logging for all onboarding attempts
- [ ] Email verification confirmation after account creation
- [ ] Optional: Re-authentication before document upload
- [ ] HTTPS only, no mixed content
- [ ] Secure headers (CSP, X-Frame-Options, etc.)

---

## Alternative Approaches

### **Approach A: Skip Password (Pre-set by Admin)** ❌
- **Pros**: Faster onboarding, less user friction
- **Cons**: Security risk, no password ownership, support burden
- **Verdict**: NOT RECOMMENDED

### **Approach B: Send Pre-set Password in Email** ❌
- **Pros**: Simpler implementation
- **Cons**: Passwords in emails are insecure, users have to change anyway
- **Verdict**: NOT RECOMMENDED

### **Approach C: OTP-Based Setup (No Password)** ⚠️
- **Pros**: Faster, email-based verification
- **Cons**: Different from normal signup, maintenance overhead
- **Verdict**: Optional for future iteration

### **Approach D: Recommended - Password + Email Verification** ✅
- **Pros**: Consistent with existing signup, secure, familiar UX
- **Cons**: Slightly more steps
- **Verdict**: **RECOMMENDED** (Best balance of security & UX)

---

## Summary

**Recommended Flow: 3-Step Onboarding**

1. **Validate Token & Review Info** (Unauthenticated)
   - Display pre-assigned business data
   - Allow user to confirm accuracy
   - Token validation with error handling

2. **Set Password** (Unauthenticated)
   - Secure password creation with requirements
   - Session tokens issued upon success
   - User is now authenticated

3. **Upload Documents** (Authenticated)
   - Simplified KYB form (skip business type/details)
   - Upload required & optional documents
   - Review and submit

**Key Benefits:**
- ✅ **Security**: Token-based, server-validated, password-protected
- ✅ **UX**: Clear flow, minimal steps, progress indicator
- ✅ **Consistency**: Aligns with existing auth system architecture
- ✅ **Flexibility**: Easy to extend with additional validations
- ✅ **Maintainability**: Reuses existing KYB components & patterns

```
