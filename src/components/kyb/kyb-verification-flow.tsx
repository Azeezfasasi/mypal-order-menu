"use client";

import KybBusinessDetailsStep from "@/components/kyb/kyb-business-details-step";
import KybBusinessTypeStep from "@/components/kyb/kyb-business-type-step";
import KybDocumentsStep from "@/components/kyb/kyb-documents-step";
import KybReviewStep from "@/components/kyb/kyb-review-step";
import KybSuccessMessage from "@/components/kyb/kyb-success-message";
import { useKybSession } from "@/hooks/useVerificationSession";
import { BusinessAuthApi } from "@/services/api/auth-api";
import { IStoredBusiness, useAuthStore } from "@/stores/auth-store";
import { useKybStore } from "@/stores/kyb-store";
import { IBusiness } from "@/types/auth-types";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function KybVerificationFlow() {
  const searchParams = useSearchParams();
  const isFromOnboarding = searchParams.get("source") === "onboarding";

  const [currentStep, setCurrentStep] = useState(0);
  const { getUpdatePayload } = useKybStore();
  const updateBusinessMutation = BusinessAuthApi.useUpdateBusiness();

  // Get business from auth store (for logged-in users returning to complete KYB)
  const authBusiness = useAuthStore((state) => state.business);
  const tokenType = useAuthStore((state) => state.tokenType);

  // Use simplified session hook
  // We use useKybSession() (convenience wrapper) instead of useVerificationSession() directly
  // because it provides cleaner, more semantic API with pre-configured KYB settings
  const { isInitialized, isValid, isLoading } = useKybSession();

  // Apply prefill from sessionStorage if present (coming from /kyb/status)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("kyb_prefill");
      console.log("Checking sessionStorage for kyb_prefill:", !!raw);
      if (!raw) return;

      const parsed = JSON.parse(raw) as {
        business?: IBusiness | IStoredBusiness;
        requiredFields?: string[];
        ts?: number;
      };

      console.log("Parsed kyb_prefill:", {
        hasBusiness: !!parsed?.business,
        requiredFields: parsed?.requiredFields,
      });

      const kybState = useKybStore.getState();

      // Only apply if we don't already have an ownerBusinessId set
      if (!kybState.ownerBusinessId && parsed?.business) {
        console.log("Applying prefill from sessionStorage");
        kybState.applyPrefillFromBusiness(
          parsed.business,
          parsed.requiredFields || null,
        );
      } else {
        console.log(
          "Skipping prefill - ownerBusinessId already set or no business",
        );
      }

      // cleanup persisted prefill after applying
      sessionStorage.removeItem("kyb_prefill");
    } catch (e) {
      // ignore parse errors
      console.warn("kyb prefill parse error", e);
    }
  }, []);

  // Apply prefill for authenticated users returning to complete KYB
  // This handles the case where a business was invited, set password, but didn't complete KYB
  // When they log in later with email/password, they get redirected here with authenticated token
  useEffect(() => {
    // Only run this for authenticated users (not onboarding_invite or other temp tokens)
    if (tokenType !== "authenticated" || !authBusiness?.id) {
      return;
    }

    const kybState = useKybStore.getState();

    // If we already have a KYB draft for this business, don't overwrite
    if (kybState.ownerBusinessId === authBusiness.id) {
      console.log("KYB prefill already applied for business:", authBusiness.id);
      return;
    }

    // Apply prefill from the authenticated business data
    console.log(
      "Applying KYB prefill for authenticated business:",
      authBusiness.id,
    );
    kybState.applyPrefillFromBusiness(authBusiness, null);
  }, [tokenType, authBusiness]);

  // Show loading state while initializing
  if (!isInitialized || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Initializing verification flow...</p>
        </div>
      </div>
    );
  }

  // If session is invalid, the hook will handle redirects
  if (!isValid) {
    return null;
  }

  const steps = [
    { id: 0, component: KybBusinessTypeStep },
    { id: 1, component: KybBusinessDetailsStep },
    { id: 2, component: KybDocumentsStep },
    // { id: 3, component: KybBankingDetailsStep }, // Disabled
    { id: 3, component: KybReviewStep },
    { id: 4, component: KybSuccessMessage },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleComplete = async () => {
    try {
      // Get the combined payload from the store
      const payload = getUpdatePayload();

      // Submit the data using the business update endpoint
      await updateBusinessMutation.mutateAsync(payload);

      // Move to success step
      setCurrentStep(steps.length - 1);
    } catch (error) {
      toast.error("Failed to submit business verification");
      console.error("Business verification error:", error);
    }
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <CurrentStepComponent
        onNext={handleNext}
        onPrevious={handlePrevious}
        onComplete={handleComplete}
        currentStep={currentStep}
        totalSteps={steps.length - 2} // Exclude success and review step from count
        isSubmitting={updateBusinessMutation.isPending}
        isFromOnboarding={isFromOnboarding}
      />
    </div>
  );
}
