"use client";

import OnboardingLayout from "@/components/onboarding/onboarding-layout";
import OnboardingPasswordSetup from "@/components/onboarding/onboarding-password-setup";
import OnboardingTokenValidator from "@/components/onboarding/onboarding-token-validator";
import { Button } from "@/components/ui/button";
import { BusinessAuthApi } from "@/services/api/auth-api";
import { TokenType, getAuthActions } from "@/stores/auth-store";
import { useKybStore } from "@/stores/kyb-store";
import { OnboardingSource, OnboardingStatus } from "@/types/enums";
import { IOnboardingTokenData } from "@/types/onboarding-types";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type OnboardingStep = "validate" | "password";

interface OnboardingFlowState {
  currentStep: OnboardingStep;
  businessData: IOnboardingTokenData | null;
  token: string;
  isLoading: boolean;
  error: string | null;
}

export default function OnboardingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [flowState, setFlowState] = useState<OnboardingFlowState>({
    currentStep: "validate",
    businessData: null,
    token: token || "",
    isLoading: true,
    error: null,
  });

  const { setSession } = getAuthActions();
  const { updateBusinessProfile } = useKybStore();

  // Use React Query with enabled prop - proper pattern for data fetching on mount
  const {
    data: tokenValidationData,
    isLoading: isValidatingToken,
    error: tokenValidationError,
  } = BusinessAuthApi.useValidateOnboardingToken(token || "", !!token);

  const { mutate: setPassword } = BusinessAuthApi.useSetOnboardingPassword();

  // Sync React Query state to local flow state and handle side effects
  useEffect(() => {
    if (!token) {
      setFlowState((prev) => ({
        ...prev,
        isLoading: false,
        error: "No onboarding token provided. Please check your email link.",
      }));
      return;
    }

    if (isValidatingToken) {
      setFlowState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));
    } else if (tokenValidationError) {
      let errorMessage =
        "Failed to validate onboarding token. Please request a new link.";

      if (
        tokenValidationError instanceof Error &&
        "response" in tokenValidationError
      ) {
        const apiError = tokenValidationError as unknown as Record<
          string,
          unknown
        >;
        if (apiError.response && typeof apiError.response === "object") {
          const response = apiError.response as Record<string, unknown>;
          if (response.data && typeof response.data === "object") {
            const data = response.data as Record<string, unknown>;
            if (data.message && typeof data.message === "string") {
              errorMessage = data.message;
            }
          }
        }
      }

      setFlowState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      toast.error("Token Validation Failed", {
        description: errorMessage,
      });
    } else if (tokenValidationData) {
      setFlowState((prev) => ({
        ...prev,
        businessData: tokenValidationData.data,
        currentStep: "validate",
        isLoading: false,
        error: null,
      }));

      // Pre-fill KYB store with business data
      updateBusinessProfile({
        business_name: tokenValidationData.data.business_name,
        address: `${tokenValidationData.data.city}, ${tokenValidationData.data.state}, ${tokenValidationData.data.country}`,
        business_number: "",
        tax_identification_number: "",
        description: "",
        business_type: "Registered",
        business_start_date: "",
      });
    }
  }, [
    token,
    isValidatingToken,
    tokenValidationError,
    tokenValidationData,
    updateBusinessProfile,
  ]);

  const handlePasswordSetup = (password: string) => {
    if (!flowState.token) {
      toast.error("Error", {
        description: "Onboarding token is missing.",
      });
      return;
    }

    setPassword(
      { token: flowState.token, password },
      {
        onSuccess: (data) => {
          // Set authentication session with onboarding metadata
          if (data.data?.access_token && data.data?.business) {
            // Determine source from token data or default to ADMIN_INVITE
            const tokenSource = flowState.businessData?.source;
            const onboardingSource =
              tokenSource === "SelfService"
                ? OnboardingSource.SELF_SERVICE
                : OnboardingSource.ADMIN_INVITE;

            // Mark business as having set password, ready for KYB completion
            const businessWithOnboardingMeta = {
              ...data.data.business,
              onboarding_source: onboardingSource,
              businessOnboardingStatus: OnboardingStatus.PASSWORD_SET,
            };

            setSession(
              data.data.access_token,
              TokenType.ONBOARDING_INVITE,
              businessWithOnboardingMeta,
            );

            // Prefill KYB store with onboarding data
            updateBusinessProfile({
              business_name: flowState.businessData?.business_name || "",
              address: `${flowState.businessData?.city}, ${flowState.businessData?.state}, ${flowState.businessData?.country}`,
              business_number: "",
              tax_identification_number: "",
              description: "",
              business_type: "Registered",
              business_start_date: "",
            });

            toast.success("Password Set Successfully", {
              description: "Proceeding to complete your business details...",
            });

            // Redirect to KYB flow with onboarding source flag
            router.push("/kyb?source=onboarding&step=0");
          }
        },
        onError: (error: unknown) => {
          let errorMessage = "Failed to set password. Please try again.";

          if (error instanceof Error && "response" in error) {
            const apiError = error as Record<string, unknown>;
            if (apiError.response && typeof apiError.response === "object") {
              const response = apiError.response as Record<string, unknown>;
              if (response.data && typeof response.data === "object") {
                const data = response.data as Record<string, unknown>;
                if (data.message && typeof data.message === "string") {
                  errorMessage = data.message;
                }
              }
            }
          }

          toast.error("Error", {
            description: errorMessage,
          });
        },
      },
    );
  };

  const handleCancel = () => {
    router.push("/login");
  };

  const renderStep = () => {
    switch (flowState.currentStep) {
      case "validate":
        return (
          <OnboardingTokenValidator
            businessData={flowState.businessData!}
            isLoading={flowState.isLoading}
            error={flowState.error}
            onNext={() => {
              setFlowState((prev) => ({ ...prev, currentStep: "password" }));
            }}
          />
        );

      case "password":
        if (!flowState.businessData) return null;
        return (
          <OnboardingPasswordSetup
            businessData={flowState.businessData}
            isSubmitting={false}
            onSubmit={async (password) => handlePasswordSetup(password)}
            onCancel={handleCancel}
          />
        );

      default:
        return null;
    }
  };

  return (
    <OnboardingLayout>
      <div className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Business Onboarding
          </h1>
          <p className="text-gray-600">
            Welcome to MyPal. Complete your onboarding to get started.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">
              Step{" "}
              {flowState.currentStep === "validate"
                ? 1
                : flowState.currentStep === "password"
                  ? 2
                  : 2}{" "}
              of 2
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{
                width: flowState.currentStep === "validate" ? "50%" : "100%",
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8 border border-gray-200">
          {flowState.error && flowState.currentStep === "validate" ? (
            <div className="space-y-4">
              {renderStep()}
              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => router.push("/login")}
                  className="flex-1"
                >
                  Back to Login
                </Button>
                <Button
                  onClick={() =>
                    (window.location.href = "mailto:helpdesk@mypal-inc.com")
                  }
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  Contact Support
                </Button>
              </div>
            </div>
          ) : (
            renderStep()
          )}
        </div>

        {/* Footer Note */}
        <div className="text-center text-xs text-gray-500">
          <p>Need help? Contact us at helpdesk@mypal-inc.com</p>
        </div>
      </div>
    </OnboardingLayout>
  );
}
