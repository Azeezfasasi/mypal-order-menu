"use client";

import { FileUploader } from "@/components/kyb/file-uploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useKybStore } from "@/stores/kyb-store";
import { IOnboardingTokenData } from "@/types/onboarding-types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const documentsSchema = z.object({
  directors_address: z.string().optional(),
  shareholders_address: z.string().optional(),
});

type DocumentsFormValues = z.infer<typeof documentsSchema>;

interface OnboardingDocumentsUploadProps {
  businessData: IOnboardingTokenData;
  isSubmitting: boolean;
  onSubmit: () => Promise<void>;
  onPrevious: () => void;
}

export default function OnboardingDocumentsUpload({
  businessData,
  isSubmitting,
  onSubmit,
  onPrevious,
}: OnboardingDocumentsUploadProps) {
  const { businessProfile, businessDocuments, updateBusinessDocuments } =
    useKybStore();

  // Determine business type from onboarding - default to "Sole Proprietor" if not provided
  const businessType = businessProfile.business_type || "Sole Proprietor";
  const isIncorporated = businessType === "Incorporated";
  const isRegistered = businessType === "Registered" || isIncorporated;

  const form = useForm<DocumentsFormValues>({
    resolver: zodResolver(documentsSchema),
    defaultValues: {
      directors_address: businessDocuments.directors_address || "",
      shareholders_address: businessDocuments.shareholders_address || "",
    },
  });

  // Track files separately from the form
  const [businessImage, setBusinessImage] = useState<File | null>(
    businessDocuments.image || null,
  );
  const [cacDocument, setCacDocument] = useState<File | null>(
    businessDocuments.cac_document || null,
  );
  const [mematDocument, setMematDocument] = useState<File | null>(
    businessDocuments.memat || null,
  );
  const [directorIdentity, setDirectorIdentity] = useState<File | null>(
    businessDocuments.director_identity || null,
  );

  function validateFormAndFiles() {
    // CAC document required only for registered and incorporated
    const isCacDocumentValid = !isRegistered || !!cacDocument;
    // Director identity required only for incorporated
    const isDirectorIdentityValid = !isIncorporated || !!directorIdentity;

    return isCacDocumentValid && isDirectorIdentityValid;
  }

  async function handleSubmit(values: DocumentsFormValues) {
    if (!validateFormAndFiles()) {
      return;
    }

    updateBusinessDocuments({
      ...businessDocuments,
      directors_address: values.directors_address || "",
      shareholders_address: values.shareholders_address || "",
      image: businessImage || undefined,
      cac_document: cacDocument || undefined,
      memat: mematDocument || undefined,
      director_identity: directorIdentity || undefined,
    });

    await onSubmit();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Business Info Summary Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base text-blue-900">
              Business Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-xs font-medium text-blue-800">Business Name</p>
              <p className="text-sm text-blue-900">
                {businessData.business_name}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-blue-800">Category</p>
              <p className="text-sm text-blue-900">
                {businessData.category?.name || "Not specified"}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Upload Documents</h3>
            <p className="text-sm text-gray-600 mb-6">
              Please upload the required documents to complete your onboarding.
            </p>
          </div>

          {/* Business Logo/Image */}
          <div className="space-y-2">
            <FormLabel>
              Business Logo/Image <span className="text-destructive">*</span>
            </FormLabel>
            <FileUploader
              value={businessImage?.name || ""}
              onValueChange={setBusinessImage}
              placeholder="Click here to upload business logo"
              accept="image/*,.pdf"
            />
            <FormDescription>Recommended: PNG, JPG (max 5MB)</FormDescription>
          </div>

          {/* CAC Document - Required for registered/incorporated */}
          {isRegistered && (
            <div className="space-y-2">
              <FormLabel>
                C.A.C. Document <span className="text-destructive">*</span>
              </FormLabel>
              <FileUploader
                value={cacDocument?.name || ""}
                onValueChange={setCacDocument}
                placeholder="Click here to upload C.A.C. Document"
                accept=".pdf,.jpg,.jpeg,.png"
              />
              {!cacDocument && (
                <p className="text-sm text-destructive">
                  CAC document is required for registered businesses
                </p>
              )}
            </div>
          )}

          {/* MEMAT Document - For incorporated */}
          {isIncorporated && (
            <div className="space-y-2">
              <FormLabel>
                M.E.M.A.T. or Articles of Association (optional)
              </FormLabel>
              <FileUploader
                value={mematDocument?.name || ""}
                onValueChange={setMematDocument}
                placeholder="Click here to upload M.E.M.A.T."
                accept=".pdf,.jpg,.jpeg,.png"
              />
            </div>
          )}

          {/* Director Identity - For incorporated */}
          {isIncorporated && (
            <div className="space-y-2">
              <FormLabel>
                Director&apos;s Proof of Identification{" "}
                <span className="text-destructive">*</span>
              </FormLabel>
              <FileUploader
                value={directorIdentity?.name || ""}
                onValueChange={setDirectorIdentity}
                placeholder="Click here to upload a proof of identification"
                accept=".pdf,.jpg,.jpeg,.png"
              />
              {!directorIdentity && (
                <p className="text-sm text-destructive">
                  Director&apos;s ID proof is required
                </p>
              )}
            </div>
          )}

          {/* Director Address - For incorporated */}
          {isIncorporated && (
            <FormField
              control={form.control}
              name="directors_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Director&apos;s Address (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter director's address"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Shareholder Address - For incorporated */}
          {isIncorporated && (
            <FormField
              control={form.control}
              name="shareholders_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shareholder&apos;s Address (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter shareholder's address"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Help Text */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800">
              <span className="font-medium">Need Help?</span> Ensure all
              documents are clear, readable, and in supported formats. If you
              encounter any issues, please contact support.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onPrevious}
            disabled={isSubmitting}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !validateFormAndFiles()}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? "Submitting Documents..." : "Review & Submit"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
