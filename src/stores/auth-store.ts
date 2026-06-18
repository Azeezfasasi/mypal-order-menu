"use client";

import { localStorageAdapter } from "@/lib/storage";
import { deleteCookie, setCookie } from "cookies-next";
import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
// import { IBusiness } from "@/types/auth-types";
import { IBusinessCategory } from "@/services/api/business-categories-api";
import {
  OnboardingSource,
  OnboardingStatus,
  VerificationStatus,
} from "@/types/enums";
// import { pickBusiness } from "@/lib/utils";
// import { IBusiness } from "@/types/auth-types";
import { useKybStore } from "@/stores/kyb-store";

// Backend enums for onboarding
export interface IStoredBusiness {
  current_token: string;
  id: string;
  role: string;
  email: string;
  business_name: string | null;
  image_url: string | null;
  category?: IBusinessCategory;
  business_type?: string | null;
  business_start_date?: string | null;
  is_active?: boolean;
  is_verified?: VerificationStatus;
  wallet?: number;
  verification_notes?: string | null;
  verification_requirements?: {
    notes: string;
    requiredFields: string[];
  } | null;
  business_number?: string | null;
  tax_identification_number?: string | null;
  description?: string | null;
  address?: string | null;
  long?: string | null;
  lat?: string | null;
  business_bank_name?: string | null;
  business_acc_name?: string | null;
  business_acc_number?: string | null;
  cac_document?: string | null;
  memat?: string | null;
  director_identity?: string | null;
  directors_address?: string | null;
  shareholders_address?: string | null;
  businessOnboardingStatus?: OnboardingStatus | null;
  onboarding_source?: OnboardingSource | null;
  available_categories?: Array<{
    id: string;
    name: string;
    image_url?: string | null;
    business_type?: string | null;
  }>;
  linkedBusinesses?: Array<{
    id: string;
    business_name: string;
    image_url?: string | null;
    category: { id: string; name: string };
    is_primary: boolean;
  }>;
}

// Define token types to clarify different auth states
export enum TokenType {
  AUTHENTICATED = "authenticated", // Fully logged in user
  PASSWORD_RESET = "password_reset", // Forgot password flow
  VERIFY_OTP = "otp", // Forgot password flow
  KYB = "kyb", // Know Your Business flow
  ONBOARDING_INVITE = "onboarding_invite",
  // Add other token types as needed
}

// Temporary token types (short-lived): used during OTP verification, KYB, password reset
export const TEMPORARY_TOKEN_TYPES: TokenType[] = [
  TokenType.VERIFY_OTP,
  TokenType.KYB,
  TokenType.PASSWORD_RESET,
  TokenType.ONBOARDING_INVITE,
];

export function isTemporaryTokenType(tokenType?: TokenType | null) {
  return !!tokenType && TEMPORARY_TOKEN_TYPES.includes(tokenType as TokenType);
}

interface AuthState {
  token: string | null;
  tokenType: TokenType | null;
  business: IStoredBusiness | null;
  isLoading: boolean;
  actions: {
    setSession: (
      token: string,
      tokenType: TokenType,
      business?: IStoredBusiness | null,
    ) => void;
    clearSession: () => void;
    updateBusiness: (businessData: Partial<IStoredBusiness>) => void;
    setHydrated: () => void;
    getToken: () => string | null;
  };
}

// Create the store with persist middleware
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      tokenType: null,
      business: null,
      isLoading: true,
      actions: {
        setSession: (token: string, tokenType: TokenType, business = null) => {
          // Set cookie and update state atomically
          // Determine cookie expiry: authenticated = 30 days, temporary flows = 15 minutes
          const expirySeconds = isTemporaryTokenType(tokenType)
            ? 60 * 15 // 15 minutes for temp tokens
            : 60 * 60 * 24 * 30; // 30 days for authenticated tokens

          setCookie("token", token, {
            path: "/",
            maxAge: expirySeconds,
          });
          // Store token type in a separate cookie for SSR access
          setCookie("tokenType", tokenType, {
            path: "/",
            maxAge: expirySeconds,
          });

          // Convert full IBusiness to IStoredBusiness via picker
          // const storedBiz: IStoredBusiness | null =
          //   business && "id" in business
          //     ? pickBusiness(business as IBusiness, token)
          //     : (business as IStoredBusiness) ?? null;

          // set({ token, tokenType, business: storedBiz });

          set({ token, tokenType, business });

          // Record session start time for fresh session detection
          if (typeof sessionStorage !== "undefined") {
            sessionStorage.setItem(
              `${tokenType}_session_start`,
              Date.now().toString(),
            );

            // For temporary tokens, also store business data in sessionStorage
            // since localStorage persistence is cleared for these token types
            if (isTemporaryTokenType(tokenType) && business) {
              try {
                sessionStorage.setItem(
                  `${tokenType}_business_data`,
                  JSON.stringify(business),
                );
              } catch (e) {
                console.warn(
                  "Failed to store business data in sessionStorage:",
                  e,
                );
              }
            }
          }

          // If starting a KYB session, bind the KYB draft owner so drafts are associated with this account
          try {
            if (tokenType === TokenType.KYB) {
              const kyb = useKybStore.getState();
              const ownerId = business?.id ?? null;

              if (ownerId) {
                kyb.setOwnerBusinessId(ownerId);
                // ensure any previous ephemeral session key is removed so drafts are tied to the account
                if (typeof sessionStorage !== "undefined") {
                  sessionStorage.removeItem("kyb_session_id");
                }
              }
            }
          } catch (e) {
            // Defensive: avoid breaking session set on any kyb-store errors
            console.warn("Failed to bind KYB owner on setSession:", e);
          }
        },

        clearSession: () => {
          // Reset any KYB draft to prevent leaking sensitive data across accounts
          try {
            const kyb = useKybStore.getState();
            kyb.resetForm();
            if (typeof sessionStorage !== "undefined") {
              sessionStorage.removeItem("kyb_session_id");
            }
          } catch (e) {
            console.warn("Failed to clear KYB draft during clearSession:", e);
          }

          deleteCookie("token");
          deleteCookie("tokenType");
          set({ token: null, tokenType: null, business: null });
        },

        updateBusiness: (businessData: Partial<IStoredBusiness>) => {
          set((state) => ({
            business: state.business
              ? { ...state.business, ...businessData }
              : null,
          }));
        },

        setHydrated: () => {
          set({ isLoading: false });
        },

        getToken: () => get().token,
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorageAdapter),
      // skipHydration: true,
      partialize: (state) => ({
        // Only persist the necessary data, NOT isLoading
        token: isTemporaryTokenType(state.tokenType) ? null : state.token,
        tokenType: isTemporaryTokenType(state.tokenType)
          ? null
          : state.tokenType,
        // Persist only the business id for temporary token types to avoid storing PII/files
        business: state.business
          ? isTemporaryTokenType(state.tokenType)
            ? ({ id: state.business.id } as Partial<IStoredBusiness>)
            : state.business
          : null,
      }),
      // Add onRehydrateStorage for debugging/handling loading state
      onRehydrateStorage: () => {
        console.log("Hydration started");
        return (state, error) => {
          if (error) {
            console.error("An error occurred during hydration", error);
          } else {
            console.log(
              "Hydration finished successfully. State is now applied.",
            );

            // Ensure cookies are in sync with the hydrated state
            const { token, tokenType } = state || {};

            // If token and tokenType exist, sync cookies
            if (token && tokenType) {
              // console.log("Syncing cookies with hydrated state");
              // Ensure cookie expiry matches token type when hydrating
              const expirySeconds = isTemporaryTokenType(tokenType)
                ? 60 * 15
                : 60 * 60 * 24 * 30;

              setCookie("token", token, {
                path: "/",
                maxAge: expirySeconds,
              });
              setCookie("tokenType", tokenType, {
                path: "/",
                maxAge: expirySeconds,
              });

              // If this is a KYB temporary token and we persisted only a business id, bind the KYB draft to that id
              try {
                if (
                  isTemporaryTokenType(tokenType as TokenType) &&
                  tokenType === TokenType.KYB
                ) {
                  const partialState = state as Partial<AuthState> | undefined;
                  const persistedBizId = partialState?.business?.id ?? null;
                  if (persistedBizId) {
                    const kyb = useKybStore.getState();
                    kyb.setOwnerBusinessId(persistedBizId);
                  }
                }
              } catch (e) {
                console.warn("Failed to bind KYB owner during hydration:", e);
              }
            }
          }
        };
      },
    },
  ),
);

/**
 * Helper function to sync cookies with the auth store
 * This is critical for temporary token flows (OTP, KYB) which aren't persisted to localStorage
 * Call this during component initialization to ensure store reflects cookie state
 */
export function syncAuthStoreWithCookies() {
  if (typeof document === "undefined") return; // Server-side, can't read cookies

  const cookies = document.cookie.split(";");
  const tokenCookie = cookies.find((c) => c.trim().startsWith("token="));
  const tokenTypeCookie = cookies.find((c) => c.trim().startsWith("tokenType="));

  const cookieToken = tokenCookie ? decodeURIComponent(tokenCookie.split("=")[1]) : null;
  const cookieTokenType = tokenTypeCookie
    ? decodeURIComponent(tokenTypeCookie.split("=")[1])
    : null;

  const storeToken = useAuthStore.getState().token;
  const storeTokenType = useAuthStore.getState().tokenType;

  // If store doesn't have token/tokenType but cookies do, sync them
  if ((cookieToken || cookieTokenType) && (!storeToken || !storeTokenType)) {
    console.log("[syncAuthStoreWithCookies] Syncing cookies to store:", {
      cookieToken: !!cookieToken,
      cookieTokenType,
    });

    if (cookieToken && cookieTokenType) {
      // Get the business data from the store if available
      let business = useAuthStore.getState().business;

      // For temporary tokens, try to restore business data from sessionStorage
      if (
        isTemporaryTokenType(cookieTokenType as TokenType) &&
        !business &&
        typeof sessionStorage !== "undefined"
      ) {
        try {
          const sessionBusinessData = sessionStorage.getItem(
            `${cookieTokenType}_business_data`,
          );
          if (sessionBusinessData) {
            business = JSON.parse(sessionBusinessData);
            console.log(
              "[syncAuthStoreWithCookies] Restored business data from sessionStorage",
            );
          }
        } catch (e) {
          console.warn(
            "Failed to restore business data from sessionStorage:",
            e,
          );
        }
      }

      // Set the store state with the cookie values
      useAuthStore.setState({
        token: cookieToken,
        tokenType: cookieTokenType as TokenType,
        // Business should already be in store from the initial setSession call
        // but preserve it if it exists, or use restored data from sessionStorage
        business: business || null,
      });
    }
  }
}

// SSR-friendly hydration helper - UPDATED
export function useAuthStoreHydration() {
  // Use state to indicate when this specific hook has confirmed hydration
  const [isHydrated, setIsHydrated] = useState(false);

  // Get the action using the hook, ensures stable reference if actions object changes
  const setHydratedAction = useAuthStore((state) => state.actions.setHydrated);

  // Get the loading state directly
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    let isMounted = true;

    // Zustand's 'persist' middleware sets this flag once hydration is complete
    if (useAuthStore.persist.hasHydrated()) {
      console.log("Store already hydrated on mount.");
      if (isMounted) {
        setHydratedAction(); // Ensure isLoading is false if already hydrated
        setIsHydrated(true);
      }
    } else {
      console.log("Store not hydrated yet, subscribing...");
      // Subscribe to the event that fires AFTER hydration is complete
      const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
        console.log("onFinishHydration event fired.");
        if (isMounted) {
          setHydratedAction(); // Call the action to set isLoading = false in the store
          setIsHydrated(true); // Mark this hook as hydrated
        }
      });

      // Optional: Explicitly trigger rehydration if auto-rehydration isn't working as expected
      // Usually not needed if persist middleware is correctly set up.
      // useAuthStore.persist.rehydrate();

      return () => {
        console.log("Cleaning up hydration listener.", isHydrated);
        isMounted = false;
        unsubscribe(); // Cleanup listener on unmount
      };
    }

    return () => {
      isMounted = false;
    }; // Cleanup for already-hydrated case
  }, [isHydrated, setHydratedAction]); // Depend on the stable action reference

  // Return the store's loading state directly
  // The component consuming this hook can use this to show loading UI
  return isLoading;
  // Or return the hook's specific state if needed: return isHydrated;
}

// Type helpers
export type ExtractState<S> = S extends {
  getState: () => infer T;
}
  ? T
  : never;

// Selectors and helper functions
export const actionsSelector = (state: AuthState) => state.actions;
export const businessSelector = (state: ExtractState<typeof useAuthStore>) =>
  state.business;

export const isAuthenticated = () => {
  const state = useAuthStore.getState();
  return state.token !== null && state.tokenType === TokenType.AUTHENTICATED;
};

export const isPasswordReset = () => {
  const state = useAuthStore.getState();
  return state.token !== null && state.tokenType === TokenType.PASSWORD_RESET;
};

export const isKYBFlow = () => {
  const state = useAuthStore.getState();
  return state.token !== null && state.tokenType === TokenType.KYB;
};

// Getters using getState (use cautiously outside of hooks/actions)
export const getAuthActions = () => actionsSelector(useAuthStore.getState());
export const getBusiness = () => businessSelector(useAuthStore.getState());
// export const getIsAuthenticated = () => isAuthenticated(useAuthStore.getState()); // Example
