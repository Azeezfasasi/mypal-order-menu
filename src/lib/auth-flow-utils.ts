import { IBusinessCategory } from "@/services/api/business-categories-api";
import { IStoredBusiness, TokenType } from "@/stores/auth-store";
import { IBusiness } from "@/types/auth-types";
import {
  OnboardingSource,
  OnboardingStatus,
  VerificationStatus,
} from "@/types/enums";
import { z } from "zod";

// Define the business authentication states
export enum BusinessAuthState {
  NEEDS_OTP_VERIFICATION = "needs_otp_verification",
  NEEDS_KYB_COMPLETION = "needs_kyb_completion",
  AWAITING_VERIFICATION = "awaiting_verification",
  FULLY_AUTHENTICATED = "fully_authenticated",
  INVALID_CREDENTIALS = "invalid_credentials",
}

/**
 * =============================================================================
 * BUSINESS AUTHENTICATION STATE MACHINE
 * =============================================================================
 *
 * This module implements a deterministic, race-free state machine for business
 * authentication, onboarding, and verification flows.
 *
 * DESIGN PRINCIPLES:
 * ──────────────────
 * 1. Authentication ≠ Authorization
 * 2. Verification > Onboarding > Field Presence
 * 3. Explicit State > Inferred State
 * 4. One-Way Transitions Only
 * 5. Backend is the Final Authority
 *
 * STATE DIMENSIONS (Orthogonal):
 * ───────────────────────────────
 * • Authentication: Token presence and type
 * • Activation: is_active (OTP completion for direct signup)
 * • Onboarding: businessOnboardingStatus (invited flows)
 * • Verification: is_verified (admin KYB review)
 * • Completeness: KYB field presence and validity
 *
 * SUPPORTED FLOWS:
 * ────────────────
 *
 * 1. DIRECT_SIGNUP:
 *    Signup → OTP → KYB → Verification → Dashboard
 *
 * 2. ADMIN_INVITE:
 *    Invite → Password → KYB → Verification → Dashboard
 *
 * 3. SELF_SERVICE:
 *    Request → Invite → Password → KYB → Verification → Dashboard
 *
 * VERIFICATION STATES:
 * ────────────────────
 * • Pending:  Submitted, awaiting admin review
 * • Request:  Admin requested field updates
 * • Denied:   Rejected, must resubmit
 * • Accepted: Approved, full access granted
 *
 * AUTH STATES (Mutually Exclusive):
 * ──────────────────────────────────
 * • NEEDS_OTP_VERIFICATION:  Must verify email (direct signup only)
 * • NEEDS_KYB_COMPLETION:    Must complete business profile
 * • AWAITING_VERIFICATION:   Submitted, awaiting admin review
 * • FULLY_AUTHENTICATED:     Full dashboard access
 * • INVALID_CREDENTIALS:     Not authenticated
 *
 * CRITICAL PRECEDENCE ORDER:
 * ──────────────────────────
 * 1. Authentication validity (token/business exists)
 * 2. OTP activation (direct signup only)
 * 3. Verification status ← HIGHEST AUTHORITY
 * 4. Explicit onboarding status (invited flows)
 * 5. KYB field completeness
 * 6. Legacy fallback (minimal use)
 *
 * RACE CONDITION PREVENTION:
 * ──────────────────────────
 * • Verification check happens BEFORE onboarding status
 * • No field-based inference overrides verification
 * • Token type enforces state boundaries
 * • All guards are deterministic and order-independent
 *
 * =============================================================================
 */

/**
 * ONBOARDING FLOW ARCHITECTURE
 * ============================
 *
 * We support three onboarding paths:
 *
 * 1. DIRECT SIGNUP (legacy traditional flow):
 *    - User signs up directly on website → OTP verification → KYB completion
 *    - Fields are initially empty or partially filled during signup
 *    - onboarding_source: "DirectSignup"
 *    - businessOnboardingStatus: null → "Completed"
 *    - Validation: is_active: false → true (OTP), then check KYB fields
 * 
 * 2. ADMIN INVITE (BusinessOnboardingSource.ADMIN_INVITE):
 *    - Admin creates business account via admin panel
 *    - System generates invite link and sends to business email
 *    - User clicks link → Validates token → Sets password → Completes KYB
 *    - Pre-filled by admin: business_name, email, category, is_active: true
 *    - onboarding_source: "AdminInvite"
 *    - businessOnboardingStatus: "Invited" → "PasswordSet" → "Completed"
 *    - Validation: Skip OTP (already active), check additional KYB fields
 * 
 * 3. SELF SERVICE INVITE (BusinessOnboardingSource.SELF_SERVICE):
 *    - Business requests invite via self-service portal
 *    - System generates invite link and sends to business email  
 *    - User clicks link → Validates token → Sets password → Completes KYB
 *    - May have some pre-filled fields depending on self-service form
 *    - onboarding_source: "SelfService"
 *    - businessOnboardingStatus: "Invited" → "PasswordSet" → "Completed"
 *    - Validation: Skip OTP (already active), check additional KYB fields
 * 
 * VALIDATION STRATEGY:
 * Uses combination of 4 factors for accurate state determination:
 * 1. onboarding_source (identifies flow type: DirectSignup/AdminInvite/SelfService)
 * 2. businessOnboardingStatus (tracks invited flow progress: Invited/PasswordSet/Completed)
 * 3. is_active (OTP verification status - only for DirectSignup)
 * 4. KYB fields presence (completion check)
 * 
 * Key Insight:
 * - businessOnboardingStatus only applies to INVITED flows (AdminInvite/SelfService)
 * - DirectSignup uses onboarding_source for identification, status can be null until completed
 * 
 * Status Transitions:
 * - DirectSignup: source=DirectSignup, status=null -> is_active:true -> fields filled -> status=Completed
 * - AdminInvite: source=AdminInvite, status=Invited -> PasswordSet -> Completed
 * - SelfService: source=SelfService, status=Invited -> PasswordSet -> Completed
 * - Legacy: source=null, status=null (fallback to field-based validation)

/**
 * Validate that a category object is non-empty and contains meaningful values.
 * This guards against cases where the API returns an object with empty strings
 * or missing keys (e.g. { id: "", business_type: "" }).
 */
export const CategorySchema = z.object({
  id: z.string().min(1),
  business_type: z.string().min(1),
  image_url: z.string().nullable().optional(),
});

export function isValidCategory(
  category: IBusinessCategory | null | undefined,
): boolean {
  if (!category) return false;
  const parsed = CategorySchema.safeParse(category);
  return parsed.success;
}

/**
 * =============================================================================
 * STATE MACHINE HELPERS - ORTHOGONAL STATE DIMENSIONS
 * =============================================================================
 * These functions check individual state dimensions independently.
 * They must NOT make assumptions about other dimensions.
 */

/**
 * Check if user is from an invited flow (Admin or Self-Service)
 */
function isInvitedFlow(business: IBusiness | IStoredBusiness): boolean {
  const source = (business as IStoredBusiness).onboarding_source;
  const status = (business as IStoredBusiness).businessOnboardingStatus;

  // CRITICAL: DirectSignup should NEVER be treated as invited flow,
  // even if they somehow have PASSWORD_SET status (data inconsistency)
  if (source === OnboardingSource.DIRECT_SIGNUP) {
    return false;
  }

  // Source-based detection (most reliable)
  if (
    source === OnboardingSource.ADMIN_INVITE ||
    source === OnboardingSource.SELF_SERVICE
  ) {
    return true;
  }

  // Status-based detection (for legacy or edge cases)
  // Only trust status if source is not DirectSignup
  return (
    status === OnboardingStatus.INVITED ||
    status === OnboardingStatus.PASSWORD_SET
  );
}

/**
 * Check if user is from direct signup flow
 */
function isDirectSignupFlow(business: IBusiness | IStoredBusiness): boolean {
  const source = (business as IStoredBusiness).onboarding_source;
  // Direct signup if explicitly marked OR legacy data (no source)
  return source === OnboardingSource.DIRECT_SIGNUP || !source;
}

/**
 * Get verification status (normalized from multiple possible fields)
 */
function getVerificationStatus(
  business: IBusiness | IStoredBusiness,
): VerificationStatus | null {
  const fullBusiness = business as IBusiness;
  return (
    (fullBusiness.is_verified as VerificationStatus) ||
    (fullBusiness.verification_status as VerificationStatus) ||
    null
  );
}

/**
 * Check if KYB required fields are present and valid
 */
function hasValidKYBFields(business: IBusiness | IStoredBusiness): boolean {
  return Boolean(
    business.business_name &&
      business.business_start_date &&
      business.email &&
      isValidCategory(business.category),
  );
}

/**
 * =============================================================================
 * DETERMINISTIC STATE MACHINE - STRICT PRECEDENCE ORDER
 * =============================================================================
 *
 * This function implements a deterministic, race-free state machine.
 *
 * CRITICAL RULES:
 * 1. Checks are ordered by PRIORITY (high → low)
 * 2. Each check is MUTUALLY EXCLUSIVE
 * 3. VERIFICATION status has highest authority (after authentication/OTP)
 * 4. NO lower-priority check can override a higher-priority result
 * 5. Field presence is LAST RESORT only
 *
 * PRECEDENCE ORDER:
 * ┌─────────────────────────────────────────────────────────────┐
 * │ 1. Authentication Validity (token exists, business exists)  │
 * │ 2. OTP Activation (Direct Signup only)                      │
 * │ 3. Verification Status (HIGHEST AUTHORITY)                  │
 * │ 4. Explicit Onboarding Status (invited flows)               │
 * │ 5. KYB Field Completeness                                   │
 * │ 6. Legacy Fallback (minimal use)                            │
 * └─────────────────────────────────────────────────────────────┘
 */
export function getBusinessAuthState(
  business: IBusiness | IStoredBusiness | null,
): BusinessAuthState {
  // ==========================================
  // PRIORITY 1: Authentication Validity
  // ==========================================
  if (!business) {
    return BusinessAuthState.INVALID_CREDENTIALS;
  }

  // Pre-calculate all state dimensions at the top to avoid redeclaration
  const isInvited = isInvitedFlow(business);
  const isDirectSignup = isDirectSignupFlow(business);
  const verificationStatus = getVerificationStatus(business);
  const onboardingStatus = (business as IStoredBusiness)
    .businessOnboardingStatus;

  // ==========================================
  // PRIORITY 2: OTP Verification (Direct Signup ONLY)
  // ==========================================
  // Only Direct Signup users need OTP. Invited users skip this.
  // CRITICAL: Check OTP BEFORE verification status to prevent data inconsistencies
  // where is_verified="Accepted" but is_active=false (shouldn't happen but defensive)

  if (isDirectSignup && business.is_active === false) {
    return BusinessAuthState.NEEDS_OTP_VERIFICATION;
  }

  // ==========================================
  // PRIORITY 3: Verification Status (HIGHEST AUTHORITY)
  // ==========================================
  // Verification status overrides ALL other checks except authentication/OTP.
  // This prevents race conditions where users bypass verification gates.

  // User has submitted KYB and is awaiting admin review
  // CRITICAL: Only consider them awaiting if KYB fields are actually completed!
  // Backend may set Pending as default value before KYB submission.
  if (verificationStatus === VerificationStatus.PENDING) {
    const hasValidFields = hasValidKYBFields(business);

    if (hasValidFields) {
      // KYB completed and submitted, truly awaiting review
      return BusinessAuthState.AWAITING_VERIFICATION;
    } else {
      // Pending is default value, but KYB not actually submitted yet
      // Fall through to check onboarding status and field completeness
    }
  }

  // Admin requested updates to specific fields
  if (verificationStatus === VerificationStatus.REQUEST) {
    return BusinessAuthState.NEEDS_KYB_COMPLETION;
  }

  // Verification was explicitly denied
  if (verificationStatus === VerificationStatus.DENIED) {
    return BusinessAuthState.NEEDS_KYB_COMPLETION;
  }

  // Verification accepted - user may proceed if other conditions met
  if (verificationStatus === VerificationStatus.ACCEPTED) {
    // STRICT GATE: Even with accepted verification, we enforce ALL conditions
    // for dashboard access to prevent any race conditions or data integrity issues

    // 1. Must be active (OTP completed for direct signup, or pre-activated for invites)
    if (business.is_active !== true) {
      console.warn(
        "Data integrity warning: Accepted verification but not active",
        business.id,
      );
      // Invited users should always be active, direct signups need OTP
      return isDirectSignup
        ? BusinessAuthState.NEEDS_OTP_VERIFICATION
        : BusinessAuthState.INVALID_CREDENTIALS;
    }

    // 2. Must have valid KYB fields
    if (!hasValidKYBFields(business)) {
      // This is a data integrity error, but we handle it gracefully
      console.warn(
        "Data integrity warning: Accepted verification but missing KYB fields",
        business.id,
      );
      return BusinessAuthState.NEEDS_KYB_COMPLETION;
    }

    // 3. ALL CONDITIONS MET - Grant full access
    return BusinessAuthState.FULLY_AUTHENTICATED;
  }

  // ==========================================
  // PRIORITY 4: Explicit Onboarding Status (Invited Flows)
  // ==========================================
  // Only applies to ADMIN_INVITE and SELF_SERVICE flows.
  // These have explicit progress tracking via businessOnboardingStatus.
  // CRITICAL: Skip this section entirely for DirectSignup flow!

  // Only process onboarding status for invited flows
  if (isInvited && !isDirectSignup) {
    // Onboarding explicitly marked as complete
    if (onboardingStatus === OnboardingStatus.COMPLETED) {
      // Verify fields are actually present (data integrity check)
      if (!hasValidKYBFields(business)) {
        return BusinessAuthState.NEEDS_KYB_COMPLETION;
      }

      // If completed but no verification status, they're awaiting review
      if (!verificationStatus) {
        return BusinessAuthState.AWAITING_VERIFICATION;
      }

      // Completed with Accepted verification
      return BusinessAuthState.FULLY_AUTHENTICATED;
    }

    // User is in middle of invited onboarding flow
    if (
      onboardingStatus === OnboardingStatus.INVITED ||
      onboardingStatus === OnboardingStatus.PASSWORD_SET
    ) {
      return BusinessAuthState.NEEDS_KYB_COMPLETION;
    }

    // Check backend computed flag as additional safety
    // If backend says needs_onboarding=true, enforce KYB completion
    if ((business as IBusiness).needs_onboarding === true) {
      return BusinessAuthState.NEEDS_KYB_COMPLETION;
    }
  }

  // ==========================================
  // PRIORITY 5: KYB Field Completeness
  // ==========================================
  // For Direct Signup and legacy users without explicit onboarding status.

  if (business.is_active === true) {
    const hasValidFields = hasValidKYBFields(business);

    // Missing required KYB fields
    if (!hasValidFields) {
      return BusinessAuthState.NEEDS_KYB_COMPLETION;
    }

    // Has valid fields but no verification status recorded
    // This likely means they've submitted but haven't been reviewed yet
    if (!verificationStatus) {
      return BusinessAuthState.AWAITING_VERIFICATION;
    }
  }

  // ==========================================
  // PRIORITY 6: Fallback (Should Rarely Trigger)
  // ==========================================
  // If we reach here, something is wrong with the data state.
  console.warn("Fallback state reached - possible data integrity issue", {
    id: business.id,
    is_active: business.is_active,
    onboarding_source: (business as IStoredBusiness).onboarding_source,
    onboarding_status: onboardingStatus,
    verification_status: verificationStatus,
  });

  // Safe default: require KYB completion
  return BusinessAuthState.NEEDS_KYB_COMPLETION;
}

/**
 * Gets the appropriate redirect path based on business auth state
 */
export function getRedirectPath(authState: BusinessAuthState): string {
  switch (authState) {
    case BusinessAuthState.NEEDS_OTP_VERIFICATION:
      return "/verify";
    case BusinessAuthState.NEEDS_KYB_COMPLETION:
      return "/delegate";
    case BusinessAuthState.AWAITING_VERIFICATION:
      // Redirect to KYB status page to show verification status
      return "/kyb/status";
    case BusinessAuthState.FULLY_AUTHENTICATED:
      return "/"; // dashboard
    case BusinessAuthState.INVALID_CREDENTIALS:
    default:
      return "/login";
  }
}

/**
 * Gets the appropriate token type based on business auth state
 *
 * CRITICAL: Only FULLY_AUTHENTICATED users get AUTHENTICATED token.
 * All other states are restricted from dashboard access.
 */
export function getTokenType(
  authState: BusinessAuthState,
  business?: IBusiness | IStoredBusiness | null,
): TokenType {
  switch (authState) {
    case BusinessAuthState.NEEDS_OTP_VERIFICATION:
      return TokenType.VERIFY_OTP; // Using VERIFY_OTP for OTP flow

    case BusinessAuthState.NEEDS_KYB_COMPLETION:
      // If this is part of an invited onboarding flow, return the onboarding token
      if (business && isInvitedFlow(business)) {
        return TokenType.ONBOARDING_INVITE;
      }
      return TokenType.KYB;

    case BusinessAuthState.AWAITING_VERIFICATION:
      // Awaiting verification users CANNOT access dashboard
      // They are restricted to viewing their verification status only
      return TokenType.KYB; // Restricts to KYB-related routes only

    case BusinessAuthState.FULLY_AUTHENTICATED:
      // ONLY fully authenticated users with Accepted verification get dashboard access
      return TokenType.AUTHENTICATED;

    case BusinessAuthState.INVALID_CREDENTIALS:
    default:
      return TokenType.VERIFY_OTP; // Default fallback - most likely scenario for unauthenticated users
  }
}

/**
 * Complete business authentication flow - determines state and returns redirect info
 *
 * STATE MACHINE DIAGRAM:
 * ═════════════════════════════════════════════════════════════════════════
 *
 *                         ┌──────────────────┐
 *                         │   SIGNUP/LOGIN   │
 *                         └────────┬─────────┘
 *                                  │
 *                                  ▼
 *                      ┌───────────────────────┐
 *                      │ Authenticated (Token) │
 *                      └───────────┬───────────┘
 *                                  │
 *                    ┌─────────────┴──────────────┐
 *                    │                            │
 *              Direct Signup                 Invited Flow
 *                    │                            │
 *                    ▼                            ▼
 *        ┌──────────────────────┐     ┌──────────────────┐
 *        │ is_active == false?  │     │ Password Set?    │
 *        └──────────┬───────────┘     └────────┬─────────┘
 *                   │ YES                       │ YES
 *                   ▼                           ▼
 *        ┌──────────────────────┐     ┌──────────────────┐
 *        │ NEEDS_OTP_VERIFICATION│     │ Continue Below   │
 *        └──────────────────────┘     └────────┬─────────┘
 *                   │ NO                        │
 *                   └───────────────────────────┘
 *                                  │
 *                                  ▼
 *                  ┌────────────────────────────────┐
 *                  │ Check Verification Status      │
 *                  │ (HIGHEST PRIORITY)             │
 *                  └────┬───────────────────────────┘
 *                       │
 *           ┌───────────┼───────────┬──────────────┐
 *           │           │           │              │
 *      Pending      Request      Denied       Accepted
 *           │           │           │              │
 *           ▼           ▼           ▼              ▼
 *   ┌──────────────┐ ┌────────────────┐  ┌──────────────────┐
 *   │  AWAITING    │ │ NEEDS_KYB      │  │ Check Fields     │
 *   │ VERIFICATION │ │  COMPLETION    │  │                  │
 *   └──────────────┘ └────────────────┘  └────────┬─────────┘
 *                                                  │
 *                                        ┌─────────┴─────────┐
 *                                        │                   │
 *                                   Valid Fields      Missing Fields
 *                                        │                   │
 *                                        ▼                   ▼
 *                              ┌──────────────────┐  ┌──────────────┐
 *                              │     FULLY        │  │  NEEDS_KYB   │
 *                              │  AUTHENTICATED   │  │  COMPLETION  │
 *                              └──────────────────┘  └──────────────┘
 *                                        │
 *                                        ▼
 *                              ┌──────────────────┐
 *                              │    DASHBOARD     │
 *                              │   (Full Access)  │
 *                              └──────────────────┘
 *
 * ═════════════════════════════════════════════════════════════════════════
 */
export function processBusinessAuth(
  business: IBusiness | null,
  access_token: string,
) {
  const authState = getBusinessAuthState(business);
  let redirectPath = getRedirectPath(authState);
  const tokenType = getTokenType(authState, business);

  // Special-case: if admin requested updates (VerificationStatus.REQUEST),
  // show the KYB status page rather than sending them straight into the form.
  const verificationStatus = business ? getVerificationStatus(business) : null;
  if (
    authState === BusinessAuthState.NEEDS_KYB_COMPLETION &&
    verificationStatus === VerificationStatus.REQUEST
  ) {
    redirectPath = "/kyb/status";
  }

  return {
    authState,
    redirectPath,
    tokenType,
    shouldSetSession: Boolean(access_token && business),
    message: getStateMessage(authState, business),
  };
}

/**
 * Gets user-friendly messages for each auth state
 */
function getStateMessage(
  authState: BusinessAuthState,
  business?: IBusiness | IStoredBusiness | null,
): string {
  const verificationStatus = business ? getVerificationStatus(business) : null;

  switch (authState) {
    case BusinessAuthState.NEEDS_OTP_VERIFICATION:
      return "Please verify your account to continue";

    case BusinessAuthState.NEEDS_KYB_COMPLETION:
      if (verificationStatus === VerificationStatus.REQUEST) {
        // Admin requested specific updates
        const notes =
          (business as IBusiness | null)?.verification_requirements?.notes ||
          (business as IBusiness | null)?.verification_notes ||
          "Please update the requested fields and resubmit your documents.";
        return `Updates required: ${notes}`;
      }
      return "Please complete your business profile";

    case BusinessAuthState.AWAITING_VERIFICATION:
      return "Your KYB has been submitted and is under review. We will notify you when verification is complete.";

    case BusinessAuthState.FULLY_AUTHENTICATED:
      return "Welcome back!";

    case BusinessAuthState.INVALID_CREDENTIALS:
    default:
      return "Please check your credentials and try again";
  }
}

/**
 * Check if a business has completed the full signup flow
 */
export function hasCompletedFullSignupFlow(
  business: IBusiness | IStoredBusiness | null,
): boolean {
  return (
    getBusinessAuthState(business) === BusinessAuthState.FULLY_AUTHENTICATED
  );
}

/**
 * Check if a business needs to complete KYB
 */
export function needsKYBCompletion(
  business: IBusiness | IStoredBusiness | null,
): boolean {
  return (
    getBusinessAuthState(business) === BusinessAuthState.NEEDS_KYB_COMPLETION
  );
}

/**
 * Check if a business needs OTP verification
 */
export function needsOTPVerification(
  business: IBusiness | IStoredBusiness | null,
): boolean {
  return (
    getBusinessAuthState(business) === BusinessAuthState.NEEDS_OTP_VERIFICATION
  );
}

/**
 * Check if a business is from an onboarding invite flow
 * Both AdminInvite and SelfService are considered invite flows
 */
export function isOnboardingInvite(
  business: IBusiness | IStoredBusiness | null,
): boolean {
  if (!business) return false;
  return isInvitedFlow(business);
}

/**
 * Check if a business is using direct signup flow
 */
export function isDirectSignup(
  business: IBusiness | IStoredBusiness | null,
): boolean {
  if (!business) return false;
  return isDirectSignupFlow(business);
}

/**
 * Get onboarding completion status
 */
export function getOnboardingStatus(
  business: IBusiness | IStoredBusiness | null,
): OnboardingStatus | null {
  return (business as IStoredBusiness)?.businessOnboardingStatus ?? null;
}

/**
 * Handle password reset success - determines where to redirect after password reset
 * If business data is available, check their auth state; otherwise go to login
 */
export function handlePasswordResetSuccess(
  business?: IBusiness | null,
  access_token?: string,
) {
  // If we have business data and token from the reset response, check their auth state
  if (business && access_token) {
    return processBusinessAuth(business, access_token);
  }

  // Otherwise, redirect to login page
  return {
    authState: BusinessAuthState.INVALID_CREDENTIALS,
    redirectPath: "/login",
    tokenType: TokenType.VERIFY_OTP,
    shouldSetSession: false,
    message: "Password reset successful. Please log in with your new password.",
  };
}

/**
 * Validate and recover from stale intermediate auth sessions
 * This handles cases where users return after browser close, token expiration, etc.
 */
export interface SessionValidationResult {
  isValid: boolean;
  shouldClearSession: boolean;
  redirectPath: string;
  message: string;
}

export function validateIntermediateSession(
  tokenType: string | null,
  business: IBusiness | IStoredBusiness | null,
  currentPath: string,
  serverValidation?: { isValid: boolean; business?: IBusiness },
): SessionValidationResult {
  // If no business data, session is likely corrupted
  if (!business) {
    return {
      isValid: false,
      shouldClearSession: true,
      redirectPath: "/login",
      message: "Session expired. Please log in again.",
    };
  }

  // If server validation was provided and token is invalid on server
  if (serverValidation && !serverValidation.isValid) {
    return {
      isValid: false,
      shouldClearSession: true,
      redirectPath: "/login",
      message: "Your session has expired. Please log in again.",
    };
  }

  // If server provided updated business data, use it for more accurate validation
  const businessToValidate = serverValidation?.business || business;

  // For OTP tokens, verify user still needs OTP verification
  if (tokenType === "otp") {
    const authState = getBusinessAuthState(businessToValidate);

    if (authState !== BusinessAuthState.NEEDS_OTP_VERIFICATION) {
      // Business state has changed, redirect appropriately
      return {
        isValid: false,
        shouldClearSession: false, // Don't clear, let normal flow handle it
        redirectPath: getRedirectPath(authState),
        message: getStateMessage(authState),
      };
    }

    // Verify business email exists for OTP sending
    if (!businessToValidate.email) {
      return {
        isValid: false,
        shouldClearSession: true,
        redirectPath: "/signup",
        message: "Account information incomplete. Please sign up again.",
      };
    }
  }

  // For KYB and onboarding_invite tokens, verify user still needs KYB completion
  // Both token types grant access to KYB pages
  if (tokenType === "kyb" || tokenType === "onboarding_invite") {
    const authState = getBusinessAuthState(businessToValidate);

    if (authState !== BusinessAuthState.NEEDS_KYB_COMPLETION) {
      // Business state has changed, redirect appropriately
      return {
        isValid: false,
        shouldClearSession: false,
        redirectPath: getRedirectPath(authState),
        message: getStateMessage(authState),
      };
    }
  }

  // Session appears valid for current state
  return {
    isValid: true,
    shouldClearSession: false,
    redirectPath: currentPath,
    message: "Welcome back! Please continue where you left off.",
  };
}

/**
 * Enhanced session validation that can optionally use server-side validation
 * This is useful for critical auth flows where client-side validation isn't sufficient
 *
 * @param tokenType - Current token type from auth store
 * @param business - Current business data from auth store
 * @param currentPath - Current page path for validation context
 * @param verifyTokenFn - Optional server verification function (for non-React contexts)
 * @returns Promise resolving to validation result
 */
export async function validateSessionWithServer(
  tokenType: string | null,
  business: IBusiness | IStoredBusiness | null,
  currentPath: string,
  verifyTokenFn?: () => Promise<{
    data?: { isValid: boolean; business?: IBusiness };
  }>,
): Promise<SessionValidationResult> {
  // Always perform client-side validation first
  const clientValidation = validateIntermediateSession(
    tokenType,
    business,
    currentPath,
  );

  // If client validation failed or server validation function not provided, return client result
  if (!clientValidation.isValid || !verifyTokenFn) {
    return clientValidation;
  }

  try {
    // Perform server-side validation
    const response = await verifyTokenFn();
    const serverData = response?.data;

    if (!serverData?.isValid) {
      return {
        isValid: false,
        shouldClearSession: true,
        redirectPath: "/login",
        message: "Your session has expired. Please log in again.",
      };
    }

    // Re-validate with server business data if provided
    return validateIntermediateSession(
      tokenType,
      business,
      currentPath,
      serverData,
    );
  } catch (error) {
    // If server validation fails, fall back to client validation
    console.warn(
      "Server token validation failed, using client validation:",
      error,
    );
    return clientValidation;
  }
}

/**
 * @deprecated Use useVerificationSession or useKybSession hooks for React components instead.
 * This function is kept for backward compatibility and non-React contexts.
 *
 * For React components, prefer:
 * ```tsx
 * // Generic verification session
 * const { isInitialized, isValid } = useVerificationSession(config);
 *
 * // Or use pre-configured convenience hooks
 * const { isInitialized, isValid } = useKybSession();
 * const { isInitialized, isValid } = useOtpSession();
 * ```
 */
