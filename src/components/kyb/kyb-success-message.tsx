"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";

interface KybSuccessMessageProps {
  onNext: () => void;
  onPrevious: () => void;
  onComplete: () => void;
  currentStep: number;
  totalSteps: number;
  isFromOnboarding?: boolean;
}

export default function KybSuccessMessage({
  isFromOnboarding,
}: KybSuccessMessageProps) {
  const searchParams = useSearchParams();
  const isFromOnboardingQuery = searchParams.get("source") === "onboarding";
  const fromOnboarding = isFromOnboarding || isFromOnboardingQuery;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-green-100 p-3">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
        </div>

        <h1 className="mb-2 text-2xl font-bold">Verification Submitted</h1>

        <p className="mb-6 text-gray-600">
          Thank You for Completing Your Onboarding! Your submission has been
          successfully received 🎉.
          <br />
          Our team is currently reviewing your details to ensure everything is
          in order. Once verified, you’ll receive a confirmation email including
          next steps to begin showcasing your offerings on MyPal. If additional
          information is required, our onboarding team will reach out to you
          directly. Welcome to MyPal, where your business meets real
          experiences.
        </p>

        <Button
          onClick={() =>
            (window.location.href = fromOnboarding ? "/dashboard" : "/")
          }
          className="w-full bg-primary hover:bg-primary/90"
        >
          {fromOnboarding ? "Continue to Dashboard" : "Continue to login"}
        </Button>
      </div>
    </div>
  );
}
