"use client";

import { BusinessAuthApi } from "@/services/api/auth-api";
import { IStoredBusiness, TokenType, useAuthStore, syncAuthStoreWithCookies } from "@/stores/auth-store";
import { useKybStore } from "@/stores/kyb-store";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export interface VerificationSessionConfig {
  /** Required token type for this verification flow */
  requiredTokenType: TokenType;
  /** Redirect path for users without the required token */
  loginRedirectPath?: string;
  /** Custom error message for invalid sessions */
  invalidSessionMessage?: string;
  /** Custom error message for expired sessions */
  expiredSessionMessage?: string;
  /** Whether to initialize KYB draft ownership (for KYB flows) */
  initializeKybOwnership?: boolean;
  /** Custom session storage key for anonymous sessions */
  sessionStorageKey?: string;
  /** Time in milliseconds to consider a session "fresh" and skip verification */
  freshSessionThresholdMs?: number;
}

/**
 * Generic hook for verification session initialization
 * Handles token verification and draft ownership in a predictable way
 * Can be configured for different verification flows (KYB, OTP, etc.)
 */
export function useVerificationSession(config: VerificationSessionConfig) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const router = useRouter();

  const {
    requiredTokenType,
    loginRedirectPath = "/login",
    invalidSessionMessage = "Please sign in to continue",
    expiredSessionMessage = "Your session has expired. Please sign in again.",
    initializeKybOwnership = false,
    sessionStorageKey = "verification_session_id",
    freshSessionThresholdMs = 60000, // Default 60 seconds
  } = config;

  // Get auth state - these are stable references from Zustand
  const token = useAuthStore((state) => state.token);
  const tokenType = useAuthStore((state) => state.tokenType);
  const business = useAuthStore((state) => state.business);
  const clearSession = useAuthStore((state) => state.actions.clearSession);
  const updateBusiness = useAuthStore((state) => state.actions.updateBusiness);

  // CRITICAL: Check cookies as fallback if store tokenType is null
  const getTokenTypeFromCookies = () => {
    if (typeof document === "undefined") return null;
    const cookies = document.cookie.split(";");
    const tokenTypeCookie = cookies.find((c) =>
      c.trim().startsWith("tokenType="),
    );
    return tokenTypeCookie ? tokenTypeCookie.split("=")[1] : null;
  };

  const isFreshSession = () => {
    if (typeof window === "undefined") return false;
    const sessionStart = sessionStorage.getItem(
      `${requiredTokenType}_session_start`,
    );
    if (!sessionStart) return false;
    const startTime = parseInt(sessionStart, 10);
    const now = Date.now();
    return now - startTime < freshSessionThresholdMs;
  };

  const effectiveTokenType = tokenType || getTokenTypeFromCookies();

  // Skip server verification for ONBOARDING_INVITE tokens
  const shouldVerifyToken =
    !!token &&
    effectiveTokenType !== TokenType.ONBOARDING_INVITE &&
    (effectiveTokenType === requiredTokenType ||
      ((requiredTokenType === TokenType.VERIFY_OTP ||
        requiredTokenType === TokenType.KYB) &&
        effectiveTokenType &&
        effectiveTokenType !== TokenType.AUTHENTICATED)) &&
    !isFreshSession();

  const verifyTokenQuery = BusinessAuthApi.useVerifyTokenQuery(
    Boolean(shouldVerifyToken),
  );

  // Handle redirect scenarios when token/tokenType is invalid
  useEffect(() => {
    if (typeof window === "undefined") return;

    // CRITICAL: Sync cookies with store if they're out of sync
    // This handles the case where temporary tokens (OTP, KYB) aren't persisted to localStorage
    // but are stored in cookies. On page load/navigation, we need to read them from cookies.
    syncAuthStoreWithCookies();

    // For OTP flow, also try to restore business data from sessionStorage if store doesn't have it
    if (requiredTokenType === TokenType.VERIFY_OTP && !business?.id) {
      try {
        const sessionBizData = sessionStorage.getItem("otp_business_data");
        if (sessionBizData) {
          const businessData = JSON.parse(sessionBizData);
          console.log(
            "[useVerificationSession] Restored business data from sessionStorage for OTP",
          );
          // Update the store with the business data
          useAuthStore.setState({ business: businessData });
        }
      } catch (e) {
        console.warn("Failed to restore business data from sessionStorage:", e);
      }
    }

    const effectiveTokenType = tokenType || getTokenTypeFromCookies();

    console.log("[useVerificationSession] Validation check:", {
      requiredTokenType,
      tokenType,
      effectiveTokenType,
      hasToken: !!token,
      hasBusinessId: !!business?.id,
      isInitialized,
      isValid,
    });

    // If already validated successfully, skip re-validation
    if (isInitialized && isValid) {
      console.log("[useVerificationSession] Already validated, skipping");
      return;
    }

    // Special handling for password reset flow
    if (requiredTokenType === TokenType.PASSWORD_RESET) {
      if (!token && !effectiveTokenType) {
        console.log("[useVerificationSession] Password reset flow - allowing");
        setIsInitialized(true);
        setIsValid(true);
        return;
      }
    }

    // Special handling for OTP verification
    if (requiredTokenType === TokenType.VERIFY_OTP) {
      // Allow if we have the OTP token type, even without a token
      // The token will be issued after OTP verification
      if (effectiveTokenType === TokenType.VERIFY_OTP) {
        console.log(
          "[useVerificationSession] OTP flow detected via tokenType - allowing",
          { effectiveTokenType },
        );
        setIsInitialized(true);
        setIsValid(true);
        return;
      }

      // Allow if we have a token with OTP type
      if (
        token &&
        (effectiveTokenType === TokenType.VERIFY_OTP || !effectiveTokenType)
      ) {
        console.log("[useVerificationSession] OTP flow - allowing");
        setIsInitialized(true);
        setIsValid(true);
        return;
      }

      // Allow if we have business email and ID (even without token)
      if (business?.email && business?.id) {
        console.log(
          "[useVerificationSession] OTP flow with business email and ID - allowing",
          { email: business.email, id: business.id },
        );
        setIsInitialized(true);
        setIsValid(true);
        return;
      }

      // Allow if we have any token and business data (handles signup without immediate token)
      if (token && business?.email) {
        console.log(
          "[useVerificationSession] OTP flow with token and business email - allowing",
        );
        setIsInitialized(true);
        setIsValid(true);
        return;
      }
    }

    // For KYB flow, accept both KYB and ONBOARDING_INVITE token types
    if (requiredTokenType === TokenType.KYB) {
      if (
        token &&
        (effectiveTokenType === TokenType.KYB ||
          effectiveTokenType === TokenType.ONBOARDING_INVITE)
      ) {
        console.log("[useVerificationSession] KYB/Onboarding flow - allowing", {
          effectiveTokenType,
        });
        setIsInitialized(true);
        setIsValid(true);
        return;
      }
    }

    // Check if we have the required token type
    if (effectiveTokenType !== requiredTokenType) {
      if (
        token &&
        business?.id &&
        (requiredTokenType === TokenType.KYB ||
          requiredTokenType === TokenType.VERIFY_OTP)
      ) {
        console.log("[useVerificationSession] Lenient check passed - allowing");
        setIsInitialized(true);
        setIsValid(true);
        return;
      }

      console.error(
        "[useVerificationSession] Token type mismatch - redirecting to login",
        {
          expected: requiredTokenType,
          found: effectiveTokenType,
        },
      );
      clearSession();
      toast.error(invalidSessionMessage, {
        description: `Expected ${requiredTokenType} token but found ${effectiveTokenType || "none"}`,
      });
      router.replace(loginRedirectPath);
      setIsInitialized(true);
      setIsValid(false);
      return;
    }

    // Check if we have a token
    if (!token && requiredTokenType !== TokenType.PASSWORD_RESET) {
      console.error("[useVerificationSession] No token - redirecting to login");
      clearSession();
      toast.error(invalidSessionMessage, {
        description: "Authentication token is missing. Please log in again.",
      });
      router.replace(loginRedirectPath);
      setIsInitialized(true);
      setIsValid(false);
      return;
    }

    console.log("[useVerificationSession] Validation passed");
    setIsInitialized(true);
    setIsValid(true);
  }, [
    tokenType,
    token,
    requiredTokenType,
    business?.id,
    business?.email,
    clearSession,
    invalidSessionMessage,
    router,
    loginRedirectPath,
    isInitialized,
    isValid,
  ]);

  // Initialize KYB ownership helper - memoized to avoid unnecessary recreations
  const initializeKybOwnershipIfNeeded = useCallback(() => {
    if (!initializeKybOwnership) return;

    const kybState = useKybStore.getState();
    const currentOwner = kybState.ownerBusinessId;

    const getOwnerKey = () => {
      if (business?.id) return business.id;

      let sessionId = sessionStorage.getItem(sessionStorageKey);
      if (!sessionId) {
        sessionId = `anon-${Math.random().toString(36).slice(2, 10)}`;
        sessionStorage.setItem(sessionStorageKey, sessionId);
      }
      return sessionId;
    };

    const ownerKey = getOwnerKey();

    if (currentOwner && currentOwner !== ownerKey) {
      kybState.resetForm();
    }

    kybState.setOwnerBusinessId(ownerKey);
  }, [initializeKybOwnership, business?.id, sessionStorageKey]);

  // Handle token verification results
  useEffect(() => {
    if (!shouldVerifyToken) {
      initializeKybOwnershipIfNeeded();
      setIsValid(true);
      setIsInitialized(true);
      return;
    }

    if (verifyTokenQuery.isSuccess) {
      const response = verifyTokenQuery.data;
      const tokenIsValid = !!response?.data?.isValid;
      const serverBusiness = response?.data?.business ?? null;

      if (!tokenIsValid) {
        // Lenient handling for temporary token types
        if (
          requiredTokenType === TokenType.PASSWORD_RESET ||
          requiredTokenType === TokenType.VERIFY_OTP ||
          requiredTokenType === TokenType.KYB ||
          requiredTokenType === TokenType.ONBOARDING_INVITE
        ) {
          console.warn(
            "Token verification failed for temporary flow, but allowing continuation",
          );
          toast.warning("Session Warning", {
            description: "Your session may have expired, but you can continue.",
          });
          setIsValid(true);
          setIsInitialized(true);
          return;
        }

        // Invalid token - clear session and redirect
        clearSession();
        toast.error(expiredSessionMessage, {
          description:
            "Your authentication token has expired. Please sign in again.",
        });
        router.replace(loginRedirectPath);
        setIsValid(false);
        setIsInitialized(true);
        return;
      }

      // Update business data if provided by server
      if (serverBusiness) {
        const businessUpdate: Partial<IStoredBusiness> = {
          ...serverBusiness,
          available_categories:
            serverBusiness.available_categories || undefined,
        };
        updateBusiness(businessUpdate);
      }

      initializeKybOwnershipIfNeeded();

      setIsValid(true);
      setIsInitialized(true);
    } else if (verifyTokenQuery.isError) {
      console.warn("Token verification failed:", verifyTokenQuery.error);
      toast.warning("Verification Warning", {
        description:
          "Unable to verify your session. You may continue, but some features might be limited.",
      });

      initializeKybOwnershipIfNeeded();

      setIsValid(true);
      setIsInitialized(true);
    }
  }, [
    shouldVerifyToken,
    verifyTokenQuery.isSuccess,
    verifyTokenQuery.isError,
    verifyTokenQuery.data,
    verifyTokenQuery.error,
    clearSession,
    expiredSessionMessage,
    router,
    loginRedirectPath,
    updateBusiness,
    requiredTokenType,
    business?.id,
    sessionStorageKey,
    initializeKybOwnership,
    initializeKybOwnershipIfNeeded,
  ]);

  return {
    isInitialized,
    isValid,
    isLoading: verifyTokenQuery.isFetching,
  };
}

/**
 * Convenience hook for KYB verification sessions
 */
export function useKybSession() {
  return useVerificationSession({
    requiredTokenType: TokenType.KYB,
    invalidSessionMessage:
      "Please sign in to continue with business verification",
    expiredSessionMessage: "Your session has expired. Please sign in again.",
    initializeKybOwnership: true,
    sessionStorageKey: "kyb_session_id",
    freshSessionThresholdMs: 300000, // 5 minutes
  });
}

/**
 * Convenience hook for OTP verification sessions
 */
export function useOtpSession() {
  return useVerificationSession({
    requiredTokenType: TokenType.VERIFY_OTP,
    loginRedirectPath: "/login",
    invalidSessionMessage: "Please sign in to verify your account",
    expiredSessionMessage:
      "Your verification session has expired. Please sign in again.",
    initializeKybOwnership: false,
    sessionStorageKey: "otp_session_id",
    freshSessionThresholdMs: 150000, // 2.5 minutes
  });
}

/**
 * Convenience hook for password reset sessions
 */
export function usePasswordResetSession() {
  return useVerificationSession({
    requiredTokenType: TokenType.PASSWORD_RESET,
    loginRedirectPath: "/forgot-password",
    invalidSessionMessage: "Please request a new password reset link",
    expiredSessionMessage:
      "Your password reset session has expired. Please request a new one.",
    initializeKybOwnership: false,
    sessionStorageKey: "reset_session_id",
    freshSessionThresholdMs: 900000, // 15 minutes
  });
}
