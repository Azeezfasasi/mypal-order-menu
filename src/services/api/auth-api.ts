import { TokenType, getAuthActions, useAuthStore } from "@/stores/auth-store";
import { useMutation, useQuery } from "@tanstack/react-query";

import { useSafeMutation } from "@/hooks/useEnhancedMutation";
import { createFlatFormDataV2 } from "@/lib/api-helpers";
import { pickBusiness } from "@/lib/utils";
import type { BaseApiResponse } from "@/types/api";
import type {
  IBusiness,
  IBusinessChangePasswordData,
  IBusinessChangePasswordResponse,
  IBusinessForgotPasswordData,
  IBusinessForgotPasswordResponse,
  IBusinessLoginResponse,
  IBusinessResetPasswordData,
  IBusinessResetPasswordResponse,
  IBusinessSigninData,
  IBusinessSignupData,
  IBusinessSignupResponse,
  IBusinessUpdateData,
  IBusinessUpdateResponse,
  IBusinessVerifyOtpData,
  IBusinessVerifyOtpResponse,
  IOnboardingDelegationDTO,
} from "@/types/auth-types";
import type {
  IOnboardingTokenData,
  ISetOnboardingPasswordResponse,
} from "@/types/onboarding-types";
import { toast } from "sonner";
import { apiClient } from "./api-client";
import { ENDPOINTS } from "./endpoints";

export const createBusinessAuthApi = () => {
  return {
    useSignin: () =>
      useSafeMutation<
        BaseApiResponse<IBusinessLoginResponse>,
        IBusinessSigninData
      >({
        // Do not retry signin automatically to avoid duplicate side-effects
        maxRetries: 0,
        mutationFn: async (data) => {
          // Use axios but opt out of automatic auth header injection and cookie sending
          const response = await apiClient.post<
            BaseApiResponse<IBusinessLoginResponse>
          >(
            ENDPOINTS.BUSINESS_AUTH.SIGNIN,
            {
              email: data.email,
              password: data.password,
            },
            {
              withCredentials: false,
              headers: {
                // Instruct request interceptor to skip injecting Authorization
                "X-Skip-Auth": "1",
                // Ensure API key is present (apiClient already sets this globally)
              },
            },
          );

          if (!response.data?.data?.access_token) {
            throw new Error(
              response.data?.message || "Invalid token received from server",
            );
          }

          return response.data;
        },
        onSuccess: async (data) => {
          console.log("Signin success:", { data });
          // Do NOT set session here. The caller should decide the correct tokenType
          // and call setSession after applying auth flow logic (e.g. processBusinessAuth).
        },
        onError: (error) => {
          toast.error("Sign In failed", {
            description: error.response?.data?.message,
          });

          console.error("Signin error:", error);
        },
      }),

    useSignup: () =>
      useSafeMutation<
        BaseApiResponse<IBusinessSignupResponse>,
        IBusinessSignupData
      >({
        // Signup creates a new account — do not automatically retry
        maxRetries: 0,
        mutationFn: async (data) => {
          // Use axios for signup but ensure no cookies/auth headers are sent
          const response = await apiClient.post<
            BaseApiResponse<IBusinessSignupResponse>
          >(
            ENDPOINTS.BUSINESS_AUTH.SIGNUP,
            {
              email: data.email,
              password: data.password,
            },
            {
              withCredentials: false,
              headers: {
                "X-Skip-Auth": "1",
              },
            },
          );

          return response.data;
        },
        onSuccess: (data) => {
          console.log("Signup success:", { data });
          toast.success(data.message);
        },
        onError: (error) => {
          toast.error("Signup failed", {
            description: error.response.data.message,
          });
          console.error("Signup error:", error);
        },
      }),

    useLogout: () =>
      useMutation({
        retry: 0,
        mutationFn: async () => {
          await apiClient.post(ENDPOINTS.BUSINESS_AUTH.LOGOUT);
          // Use the new auth store clear session action
          useAuthStore.getState().actions.clearSession();
        },
        onSuccess: () => {
          toast.success("Logged out successfully");
        },
        onError: (error) => {
          toast.error("Logout failed");
          console.error("Logout error:", error);
        },
      }),

    useForgotPassword: () =>
      useSafeMutation<
        BaseApiResponse<IBusinessForgotPasswordResponse>,
        IBusinessForgotPasswordData
      >({
        // Forgot password is a user-initiated action; avoid automatic retries.
        maxRetries: 0,
        mutationFn: async (data) => {
          const response = await apiClient.post<
            BaseApiResponse<IBusinessForgotPasswordResponse>
          >(ENDPOINTS.BUSINESS_AUTH.FORGET_PASSWORD, { email: data.email });

          return response.data;
        },
        onSuccess: (data) => {
          console.log("Forgot password request success:", { data });
          toast.success(data.message);
        },
        onError: (error) => {
          toast.error("Forgot password request failed", {
            description: error.response?.data?.message || "Please try again.",
          });
          console.error("Forgot password error:", error);
        },
      }),

    useVerifyOtp: () =>
      useSafeMutation<
        BaseApiResponse<IBusinessVerifyOtpResponse>,
        IBusinessVerifyOtpData
      >({
        // OTP verification should not auto-retry to avoid double submissions
        maxRetries: 0,
        mutationFn: async (data) => {
          const response = await apiClient.post<
            BaseApiResponse<IBusinessVerifyOtpResponse>
          >(ENDPOINTS.BUSINESS_AUTH.VERIFY_OTP, {
            user_id: data.user_id,
            code: data.code,
          });

          return response.data;
        },
        onSuccess: (data) => {
          console.log("OTP verification success:", { data });
          toast.success(data.message);

          // Do NOT set session here. Caller should determine tokenType and set session after processing auth flow.
        },
        onError: (error) => {
          toast.error("OTP verification failed", {
            description: error.response?.data?.message || "Please try again.",
          });
          console.error("OTP verification error:", error);
        },
      }),

    useResendOtp: () =>
      useSafeMutation({
        // Resend OTP should not auto-retry
        maxRetries: 0,
        mutationFn: async (email: string) => {
          const response = await apiClient.post(
            ENDPOINTS.BUSINESS_AUTH.RESEND_OTP,
            { email },
          );

          return response.data;
        },
        onSuccess: (data) => {
          console.log("OTP resend success:", { data });
          toast.success("OTP resent successfully");
        },
        onError: (error) => {
          toast.error("OTP resend failed");
          console.error("OTP resend error:", error);
        },
      }),

    useResetPassword: () =>
      useSafeMutation<
        BaseApiResponse<IBusinessResetPasswordResponse>,
        IBusinessResetPasswordData
      >({
        // Reset password is state-changing — no automatic retries
        maxRetries: 0,
        mutationFn: async (data) => {
          const response = await apiClient.patch<
            BaseApiResponse<IBusinessResetPasswordResponse>
          >(ENDPOINTS.BUSINESS_AUTH.RESET_PASSWORD, {
            ...data,
          });

          return response.data;
        },
        onSuccess: (data) => {
          console.log("Password reset success:", { data });
          toast.success(data.message);

          // Do NOT set session here. Caller (reset password page) will set session if required based on auth flow logic.
        },
        onError: (error) => {
          toast.error("Password reset failed", {
            description: error.response?.data?.message || "Please try again.",
          });
          console.error("Password reset error:", error);
        },
      }),

    useChangePassword: () =>
      useSafeMutation<
        BaseApiResponse<IBusinessChangePasswordResponse>,
        IBusinessChangePasswordData
      >({
        // Changing password should not auto-retry
        maxRetries: 0,
        mutationFn: async (data) => {
          const response = await apiClient.patch<
            BaseApiResponse<IBusinessChangePasswordResponse>
          >(ENDPOINTS.BUSINESS_AUTH.CHANGE_PASSWORD, {
            ...data,
          });

          return response.data;
        },
        onSuccess: (data) => {
          console.log("Password change success:", { data });
          toast.success(data.message);
        },
        onError: (error) => {
          toast.error("Password change failed", {
            description: error.response?.data?.message || "Please try again.",
          });
          console.error("Password change error:", error);
        },
      }),

    useUpdateBusiness: () =>
      useSafeMutation<
        BaseApiResponse<IBusinessUpdateResponse>,
        IBusinessUpdateData
      >({
        // Updates to business data should not be retried automatically
        maxRetries: 0,
        mutationFn: async (data) => {

          // Validate that we have a token before making the request
          const currentToken = useAuthStore.getState().token;
          if (!currentToken) {
            console.error("🔐 [UPDATE_BUSINESS] No token available in auth store");
            throw new Error(
              "Authentication token not found. Please verify your session and try again.",
            );
          }

          console.log("🔐 [UPDATE_BUSINESS] Making request with token present");
          console.log("📝 [UPDATE_BUSINESS] Input data:", {
            address: data.address,
            latitude: data.latitude,
            longitude: data.longitude,
          });

          // Use the refined utility that mimics the manual logic
          const formData = createFlatFormDataV2(data);

          // Log FormData contents for debugging
          console.log("📝 [UPDATE_BUSINESS] FormData entries:");
          for (const [key, value] of formData.entries()) {
            console.log(`  ${key}:`, value, `(${typeof value})`);
          }

          // NOTE: When using FormData, axios will automatically set the correct
          // Content-Type header with the boundary. Do NOT explicitly set it,
          // as this can override the Authorization header set by the interceptor.
          // Axios handles FormData headers correctly when you don't specify them.
          const response = await apiClient.patch<
            BaseApiResponse<IBusinessUpdateResponse>
          >(ENDPOINTS.BUSINESS_AUTH.UPDATE_BUSINESS, formData);

          return response.data;
        },
        onSuccess: (data) => {
          console.log("Business update success:", { data });
          toast.success(data.message);

          const { setSession } = getAuthActions();

          // Update the business data in the store
          if (data.data?.business) {
            setSession(
              data.data?.access_token,
              TokenType.AUTHENTICATED,
              pickBusiness(data.data?.business, data.data?.access_token),
            );
            // useAuthStore.getState().actions.updateBusiness(data.data.business);
          }
        },
        onError: (error) => {
          // Add more detailed error logging
          console.error(
            "Business update error:",
            error.response?.data || error,
          );
          toast.error("Business update failed", {
            description:
              error.response?.data?.message || "An unexpected error occurred",
          });
        },
      }),

    useDeleteBusiness: () =>
      useSafeMutation({
        // Deletions are destructive; never auto-retry
        maxRetries: 0,
        mutationFn: async () => {
          const response = await apiClient.delete(
            ENDPOINTS.BUSINESS_AUTH.DELETE_BUSINESS,
          );

          return response.data;
        },
        onSuccess: (data) => {
          console.log("Business deletion success:", { data });
          toast.success("Business account deleted successfully");
          // Use the new auth store clear session action
          useAuthStore.getState().actions.clearSession();
        },
        onError: (error) => {
          toast.error("Business deletion failed");
          console.error("Business deletion error:", error);
        },
      }),

    /**
     * Verify if the current token is valid
     * Used for session validation and recovery scenarios
     * Does not show toast notifications to avoid disrupting user experience
     */
    useVerifyToken: () =>
      useSafeMutation<
        BaseApiResponse<{
          isValid: boolean;
          business?: IBusiness;
          expiresInSeconds?: number;
          expiresAt?: number;
        }>,
        void
      >({
        // VerifyToken is read-only and safe to retry once on transient failures
        maxRetries: 1,
        mutationFn: async () => {
          const response = await apiClient.get<
            BaseApiResponse<{
              isValid: boolean;
              business?: IBusiness;
              expiresInSeconds?: number;
              expiresAt?: number;
            }>
          >(ENDPOINTS.BUSINESS_AUTH.VERIFY_TOKEN, { timeout: 30000 });

          return response.data;
        },
        // No onSuccess/onError toast notifications - this is used internally
        // for session validation and should not disrupt user experience
        onSuccess: (data) => {
          console.log("Token verification success:", {
            isValid: data.data?.isValid,
            hasBusiness: !!data.data?.business,
            expiresInSeconds: data.data?.expiresInSeconds,
            expiresAt: data.data?.expiresAt,
          });
        },
        onError: (error) => {
          console.log("Token verification failed:", {
            status: error.response?.status,
            message: error.response?.data?.message,
          });
        },
      }),

    /**
     * Query version of verify token - for conditional fetching
     */
    useVerifyTokenQuery: (enabled: boolean = false) =>
      useQuery({
        queryKey: ["verifyToken"],
        queryFn: async () => {
          const response = await apiClient.get<
            BaseApiResponse<{
              isValid: boolean;
              business?: IBusiness;
              expiresInSeconds?: number;
              expiresAt?: number;
            }>
          >(ENDPOINTS.BUSINESS_AUTH.VERIFY_TOKEN, { timeout: 30000 });

          return response.data;
        },
        enabled, // Controlled by caller
        retry: 1,
        staleTime: 5 * 60 * 1000, // 5 minutes
        // No onSuccess/onError toasts - handled by caller
      }),

    // Onboarding API endpoints
    useValidateOnboardingToken: (token: string, enabled: boolean = true) =>
      useQuery<BaseApiResponse<IOnboardingTokenData>>({
        queryKey: ["validate-onboarding-token", token],
        queryFn: async () => {
          const response = await apiClient.get<
            BaseApiResponse<IOnboardingTokenData>
          >(ENDPOINTS.BUSINESS_AUTH.ONBOARDING_VALIDATE(token), {
            withCredentials: false,
            headers: {
              "X-Skip-Auth": "1",
            },
          });

          if (!response.data?.data) {
            throw new Error(
              response.data?.message || "Failed to validate onboarding token",
            );
          }

          return response.data;
        },
        enabled: enabled && !!token, // Only run if enabled and token exists
        retry: false,
        staleTime: Infinity, // Token validation result never goes stale
        gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
      }),

    useDelegateOnboarding: () =>
      useSafeMutation<
        BaseApiResponse<any>,
        IOnboardingDelegationDTO
      >({

        mutationFn: async (data) => {

          // Validate that we have a token before making the request
          const currentToken = useAuthStore.getState().token;
          if (!currentToken) {
            console.error("🔐 [UPDATE_BUSINESS] No token available in auth store");
            throw new Error(
              "Authentication token not found. Please verify your session and try again.",
            );
          }

          const response = await apiClient.post<
            BaseApiResponse<any>
          >(ENDPOINTS.BUSINESS_AUTH.ONBOARDING_DELEGATE, data);

          return response.data;
        },
        onError: () => {
          toast.error('Failed to create team members')
        },
      }),


    useSetOnboardingPassword: () =>
      useSafeMutation<
        BaseApiResponse<ISetOnboardingPasswordResponse>,
        { token: string; password: string }
      >({
        maxRetries: 0,
        mutationFn: async (data) => {
          const response = await apiClient.post<
            BaseApiResponse<ISetOnboardingPasswordResponse>
          >(
            ENDPOINTS.BUSINESS_AUTH.ONBOARDING_SET_PASSWORD(data.token),
            {
              password: data.password,
            },
            {
              withCredentials: false,
              headers: {
                "X-Skip-Auth": "1",
              },
            },
          );

          if (!response.data?.data?.access_token) {
            throw new Error(
              response.data?.message || "Failed to set onboarding password",
            );
          }

          return response.data;
        },
        onSuccess: (data) => {
          console.log("Onboarding password set successfully:", data);
          toast.success(
            "Password set successfully. Proceeding to document upload...",
          );
        },
        onError: (error) => {
          toast.error("Failed to set password", {
            description: error.response?.data?.message || "Please try again",
          });
          console.error("Onboarding password error:", error);
        },
      }),
  };
};

// Usage:
export const BusinessAuthApi = createBusinessAuthApi();