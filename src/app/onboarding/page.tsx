import OnboardingFlow from "@/components/onboarding/onboarding-flow";
import Loader from "@/components/shared/loading-spinner";
import { Suspense } from "react";

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <Loader message="Getting you ready...." />
          </div>
        </div>
      }
    >
      <OnboardingFlow />
    </Suspense>
  );
}
