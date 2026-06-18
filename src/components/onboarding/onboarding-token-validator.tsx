"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IOnboardingTokenData } from "@/types/onboarding-types";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface OnboardingTokenValidatorProps {
  businessData: IOnboardingTokenData;
  isLoading: boolean;
  error?: string | null;
  onNext: () => void;
}

export default function OnboardingTokenValidator({
  businessData,
  isLoading,
  error,
  onNext,
}: OnboardingTokenValidatorProps) {
  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="font-medium text-destructive">
              Invalid or Expired Token
            </p>
            <p className="text-sm text-destructive/90">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded mb-4" />
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-2/4" />
          </div>
        </div>
      </div>
    );
  }

  const formatLocation = (city: string, state: string, country: string) => {
    const parts = [city, state, country].filter(Boolean);
    return parts.join(", ") || "N/A";
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium text-green-900">
            Token Verified Successfully
          </p>
          <p className="text-sm text-green-800">
            Your business information is ready. Please review and proceed.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>
            The following information has been pre-filled by MyPal Admin. Please
            verify it is correct before proceeding.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Business Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Business Name
            </label>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm font-medium text-gray-900">
                {businessData.business_name}
              </p>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Business Email
            </label>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">{businessData.email}</p>
            </div>
          </div>

          {/* Category */}
          {businessData.category && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Business Category
              </label>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600">
                  {businessData.category.name}
                </p>
              </div>
            </div>
          )}

          {/* Location */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Location
            </label>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">
                {formatLocation(
                  businessData.city,
                  businessData.state,
                  businessData.country,
                )}
              </p>
            </div>
          </div>

          {/* Note */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              ℹ️ Information incorrect? Please contact the MyPal Admin team to
              make corrections before proceeding.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-6">
        <Button
          onClick={onNext}
          className="flex-1 bg-primary hover:bg-primary/90"
        >
          Next: Set Password
        </Button>
      </div>
    </div>
  );
}
