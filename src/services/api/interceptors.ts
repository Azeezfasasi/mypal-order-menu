"use client";

import { apiClient } from "@/services/api/api-client";
import { ENDPOINTS } from "@/services/api/endpoints";
import { getAuthActions, useAuthStore } from "@/stores/auth-store";
import type {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

// Track verification requests in-flight to avoid recursion
let isVerifying = false;

export const requestInterceptor = async (
  config: InternalAxiosRequestConfig,
): Promise<InternalAxiosRequestConfig> => {
  try {
    if (!navigator.onLine) {
      return Promise.reject(new Error("No internet connection"));
    }

    // CRITICAL: If this is a FormData request, remove the default Content-Type header
    // Let axios auto-set it with the correct boundary
    if (config.data instanceof FormData) {
      console.log("🚀 [INTERCEPTOR] FormData detected - removing Content-Type header to let axios set it with boundary");
      delete config.headers["Content-Type"];
    }

    // Add API Key header for backend authentication
    const apiKey = process.env.NEXT_PUBLIC_API_KEY;
    if (apiKey) {
      config.headers["X-API-Key"] = apiKey;
    }

    // Get token directly from the store
    // Allow callers to opt-out of automatic auth header injection
    const skipAuthHeader =
      config.headers &&
      (config.headers["X-Skip-Auth"] === "1" ||
        config.headers["X-Skip-Auth"] === true);

    if (!skipAuthHeader) {
      const token = useAuthStore.getState().token;
      const tokenType = useAuthStore.getState().tokenType;
      console.log("🔐 [INTERCEPTOR] Token from store:", token ? "EXISTS" : "NULL/UNDEFINED");
      console.log("🔐 [INTERCEPTOR] Auth store state:", {
        token: token ? "***SET***" : "NOT_SET",
        tokenType: tokenType || "NOT_SET",
        business: useAuthStore.getState().business?.email || "NO_BUSINESS",
        url: config.url
      });
      
      if (token) {
        // Ensure token is properly formatted (should start with Bearer or be a raw JWT)
        const authValue = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
        config.headers.Authorization = authValue;
        console.log("🔐 [INTERCEPTOR] Authorization header set");
      } else {
        console.warn("🔐 [INTERCEPTOR] No token available for this request");
      }
    } else {
      // Remove the skip header before sending
      try {
        if (config.headers && config.headers["X-Skip-Auth"])
          delete config.headers["X-Skip-Auth"];
      } catch {}
    }

    return config;
  } catch (error) {
    console.error("Error accessing auth store:", error);
    return config;
  }
};

export const responseSuccessInterceptor = (
  response: AxiosResponse,
): AxiosResponse => {
  return response;
};

export const responseErrorInterceptor = async (
  error: AxiosError,
  router?: { push: (path: string) => void },
): Promise<never> => {
  // Skip interceptor for all auth-related endpoints
  const isAuthRequest = error.config?.url?.includes("/auth/");
  const isVerifyRequest =
    error.config?.url === ENDPOINTS.BUSINESS_AUTH.VERIFY_TOKEN ||
    (typeof error.config?.url === "string" &&
      error.config.url.includes("verifyToken"));

  if (error.response?.status === 401 && !isAuthRequest) {
    try {
      // Attempt a server-side token verification before clearing session.
      let shouldClear = true;

      // If the original failing request is the verify endpoint itself,
      // clear session immediately as that's authoritative for token invalidation.
      // Also skip verification if we're already verifying to prevent recursion.
      if (isVerifyRequest || isVerifying) {
        shouldClear = true;
      } else {
        try {
          // Set flag to prevent recursive verification
          isVerifying = true;

          const verifyResp = await apiClient.get(
            ENDPOINTS.BUSINESS_AUTH.VERIFY_TOKEN,
          );
          const serverValid = verifyResp?.data?.data?.isValid;

          if (typeof serverValid === "boolean") {
            shouldClear = serverValid === false;
          } else {
            shouldClear = false;
          }
        } catch (verifyError: unknown) {
          const verifyStatus = (verifyError as AxiosError | undefined)?.response
            ?.status;
          if (verifyStatus === 401) {
            shouldClear = true;
          } else {
            console.warn(
              "Token verify call failed (non-401), skipping immediate logout:",
              verifyError,
            );
            shouldClear = false;
          }
        } finally {
          // Always reset the flag
          isVerifying = false;
        }
      }

      if (shouldClear) {
        // Clear the session and redirect to login
        const { clearSession } = getAuthActions();
        clearSession();
        if (router) {
          router.push("/login");
        } else {
          window.location.href = "/login";
        }
      } else {
        console.warn(
          "401 received but token appears valid on server — session retained",
        );
      }
    } catch (storageError) {
      console.error("Error clearing auth store:", storageError);
      // Reset flag in case of unexpected error
      isVerifying = false;
    }
  }

  return Promise.reject(error);
};
