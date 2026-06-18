"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";
import { useKybStore } from "@/stores/kyb-store";
import { AlertTriangle, Clock, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { IBusiness } from "@/types/auth-types";
import { VerificationStatus } from "@/types/enums";

export default function KYBStatusPage() {
  const router = useRouter();
  const business = useAuthStore((state) => state.business);
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus | null>(null);
  const [verificationNotes, setVerificationNotes] = useState<string | null>(
    null,
  );
  const [verificationRequirements, setVerificationRequirements] = useState<{
    notes: string;
    requiredFields: string[];
  } | null>(null);

  useEffect(() => {
    // Get verification status from business data
    const fullBusiness = business as unknown as IBusiness;

    const status =
      (fullBusiness?.is_verified || fullBusiness?.verification_status) ?? null;
    const notes = fullBusiness?.verification_notes || null;
    const requirements = fullBusiness?.verification_requirements || null;

    console.log("Status page useEffect:", {
      status,
      notes,
      requirements,
      hasBusiness: !!business,
    });

    setVerificationStatus(status);
    setVerificationNotes(notes);
    setVerificationRequirements(requirements);

    // If no business data or already verified, redirect appropriately
    if (!business) {
      router.replace("/login");
    } else if (status === VerificationStatus.ACCEPTED) {
      router.replace("/");
    }
  }, [business, router]);

  const getStatusConfig = () => {
    switch (verificationStatus) {
      case VerificationStatus.PENDING:
        return {
          icon: Clock,
          iconColor: "text-yellow-600",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          title: "KYB Under Review",
          message:
            "Your business verification documents have been submitted and are currently under review by our team.",
          description:
            "This process typically takes 1-3 business days. We will notify you via email once the review is complete.",
          showReturnButton: false,
        };
      case VerificationStatus.DENIED:
        return {
          icon: XCircle,
          iconColor: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          title: "Verification Denied",
          message:
            "Unfortunately, your business verification could not be approved at this time.",
          description:
            verificationNotes ||
            "Please review the feedback below and update your documents accordingly.",
          showReturnButton: true,
        };
      case VerificationStatus.REQUEST:
        return {
          icon: AlertTriangle,
          iconColor: "text-orange-600",
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200",
          title: "Updates Required",
          message:
            "Our team has reviewed your submission and requires updates to specific fields.",
          description:
            verificationRequirements?.notes ||
            verificationNotes ||
            "Please update the requested fields and resubmit your documents.",
          showReturnButton: true,
        };
      case VerificationStatus.ACCEPTED:
        return {
          icon: Clock,
          iconColor: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          title: "Verified",
          message: "Your business verification has been approved.",
          description: "You now have full access to the dashboard.",
          showReturnButton: false,
        };

      default:
        return {
          icon: AlertTriangle,
          iconColor: "text-orange-600",
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200",
          title: "Verification Status Unknown",
          message:
            "We couldn't determine your verification status. Please contact support.",
          description:
            "If you believe this is an error, please reach out to our support team.",
          showReturnButton: true,
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  const applyAndGo = () => {
    // Get the raw business object from store without type assertions
    const rawBusiness = business;

    console.log("applyAndGo called - raw business object:", rawBusiness);

    // Extract verification_requirements from raw business (it may be stored differently)
    const reqs = rawBusiness?.verification_requirements;

    console.log("Extracted reqs:", reqs);

    if (rawBusiness && reqs && reqs.requiredFields) {
      try {
        const payload = {
          business: rawBusiness,
          requiredFields: reqs.requiredFields,
          ts: Date.now(),
        };
        // Persist to sessionStorage so the KYB entry can recover after navigation/reload
        console.log("Saving to sessionStorage:", payload);
        sessionStorage.setItem("kyb_prefill", JSON.stringify(payload));
      } catch (e) {
        console.error("sessionStorage save error", e);
      }

      // Also apply immediately to the in-memory kyb store for SPA navigation
      console.log(
        "Applying prefill to kyb store with required fields:",
        reqs.requiredFields,
      );
      useKybStore
        .getState()
        .applyPrefillFromBusiness(rawBusiness, reqs.requiredFields);
    } else {
      console.warn("Missing business or requirements for prefill", {
        hasRawBusiness: !!rawBusiness,
        hasReqs: !!reqs,
        hasRequiredFields: !!reqs?.requiredFields,
        reqs,
      });
    }

    router.push("/kyb");
  };

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <StatusIcon className={`h-6 w-6 ${statusConfig.iconColor}`} />
            {statusConfig.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert
            className={`${statusConfig.bgColor} ${statusConfig.borderColor} border-l-4`}
          >
            <AlertDescription className="text-gray-800">
              {statusConfig.message}
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <p className="text-gray-700">{statusConfig.description}</p>

            {verificationNotes &&
              (verificationStatus === "Denied" ||
                verificationStatus === "Request") && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <h3 className="mb-2 font-semibold text-gray-900">
                    Feedback from Review Team:
                  </h3>
                  <p className="text-sm text-gray-700">{verificationNotes}</p>
                </div>
              )}

            {verificationRequirements && verificationStatus === "Request" && (
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                <h3 className="mb-2 font-semibold text-orange-900">
                  Required Fields to Update:
                </h3>
                <ul className="list-inside list-disc space-y-1 text-sm text-orange-800">
                  {verificationRequirements.requiredFields.map((field) => (
                    <li key={field} className="capitalize">
                      {field.replace(/_/g, " ")}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {verificationStatus === "Pending" && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <h3 className="mb-2 font-semibold text-blue-900">
                  What happens next?
                </h3>
                <ul className="list-inside list-disc space-y-1 text-sm text-blue-800">
                  <li>Our team will review your submitted documents</li>
                  <li>
                    You will receive an email with the verification result
                  </li>
                  <li>
                    Once approved, you&apos;ll have full access to the dashboard
                  </li>
                </ul>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {statusConfig.showReturnButton && (
              <Button
                onClick={applyAndGo}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                Update KYB Information
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => router.push("/login")}
              className="flex-1"
            >
              Return to Login
            </Button>
          </div>

          {verificationStatus === "Pending" && (
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Need help?{" "}
                <a
                  href="mailto:helpdesk@mypal-inc.com"
                  className="text-primary hover:underline"
                >
                  Contact Support
                </a>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
