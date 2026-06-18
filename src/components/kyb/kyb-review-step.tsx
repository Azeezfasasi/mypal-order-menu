"use client";

import { Button } from "@/components/ui/button";
import { useKybStore } from "@/stores/kyb-store";
import { format } from "date-fns";
import { CheckCircle, FileText } from "lucide-react";

export interface KybReviewStepProps {
  onNext: () => void;
  onPrevious: () => void;
  onComplete: () => void;
  currentStep: number;
  totalSteps: number;
  isSubmitting?: boolean;
  isFromOnboarding?: boolean;
}

export default function KybReviewStep({
  onPrevious,
  onComplete,
  isSubmitting,
  // isFromOnboarding,
}: KybReviewStepProps) {
  const { businessProfile, bankingDetails, businessDocuments } = useKybStore();

  // Get business type label
  const getBusinessTypeLabel = (value: string) => {
    const types = {
      unregistered: "Unregistered Business",
      registered: "Registered Business",
      incorporated: "Incorporated Company",
    };
    return types[value as keyof typeof types] || value;
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "PPP");
    } catch (error) {
      console.log({ error });

      return "Invalid date";
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Company profile</h1>
          <p className="mt-2 text-lg font-medium text-primary">
            Review your information
          </p>
          <p className="mt-1 text-gray-600">
            Please review the information you&lsquo;ve provided before final
            submission.
          </p>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border p-4">
            <h2 className="mb-4 text-lg font-medium">Business Information</h2>
            <div className="space-y-2">
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Business Type:</span>
                <span>
                  {getBusinessTypeLabel(businessProfile.business_type)}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Business Name:</span>
                <span>{businessProfile.business_name}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Business Number:</span>
                <span>{businessProfile.business_number}</span>
              </div>
              {businessProfile.tax_identification_number && (
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Tax ID:</span>
                  <span>{businessProfile.tax_identification_number}</span>
                </div>
              )}
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Business Start Date:</span>
                <span>{formatDate(businessProfile.business_start_date)}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Category:</span>
                <span>{businessProfile.category}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Address:</span>
                <span>{businessProfile.address}</span>
              </div>
            </div>
          </div>

          {/* <!-- Only display the canvas if there is banking info --> */}
          {(bankingDetails.business_bank_name ||
            bankingDetails.business_acc_name ||
            bankingDetails.business_acc_number) && (
            <div className="rounded-lg border p-4">
              <h2 className="mb-4 text-lg font-medium">Banking Information</h2>

              <div className="space-y-2">
                {bankingDetails.business_bank_name && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="font-medium">Bank Name:</span>
                    <span>{bankingDetails.business_bank_name}</span>
                  </div>
                )}

                {bankingDetails.business_acc_name && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="font-medium">Account Name:</span>
                    <span>{bankingDetails.business_acc_name}</span>
                  </div>
                )}

                {bankingDetails.business_acc_number && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="font-medium">Account Number:</span>
                    <span>{bankingDetails.business_acc_number}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="rounded-lg border p-4">
            <h2 className="mb-4 text-lg font-medium">Uploaded Documents</h2>
            <div className="space-y-3">
              {businessDocuments.image && (
                <DocumentItem
                  label="Business Logo/Image"
                  filename={businessDocuments.image.name}
                />
              )}
              {businessDocuments.cac_document && (
                <DocumentItem
                  label="C.A.C. Document"
                  filename={businessDocuments.cac_document.name}
                />
              )}
              {businessDocuments.memat && (
                <DocumentItem
                  label="M.E.M.A.T. Document"
                  filename={businessDocuments.memat.name}
                />
              )}
              {businessDocuments.director_identity && (
                <DocumentItem
                  label="Director's ID Proof"
                  filename={businessDocuments.director_identity.name}
                />
              )}
              {businessDocuments.directors_address && (
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Director&lsquo;s Address:</span>
                  <span>{businessDocuments.directors_address}</span>
                </div>
              )}
              {businessDocuments.shareholders_address && (
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">
                    Shareholder&lsquo;s Address:
                  </span>
                  <span>{businessDocuments.shareholders_address}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onPrevious}
            className="flex-1"
            disabled={isSubmitting}
          >
            Back
          </Button>
          <Button
            type="button"
            onClick={onComplete}
            className="flex-1 bg-primary hover:bg-primary/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit for Verification"}
          </Button>
        </div>
      </div>
    </>
  );
}

interface DocumentItemProps {
  label: string;
  filename: string | undefined;
}

function DocumentItem({ label, filename }: DocumentItemProps) {
  if (!filename) return null;

  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-gray-500" />
        <span className="font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span className="max-w-[150px] truncate">{filename}</span>
        <CheckCircle className="h-4 w-4 text-green-500" />
      </div>
    </div>
  );
}
