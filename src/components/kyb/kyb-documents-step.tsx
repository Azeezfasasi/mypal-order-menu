"use client";

import { FileUploader } from "@/components/kyb/file-uploader";
import {
  RequiredFieldBadge,
  RequiredFieldsBanner,
  isFieldRequired,
} from "@/components/kyb/required-fields-indicator";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import { useKybStore } from "@/stores/kyb-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Create a custom file schema for zod
export const fileSchema = z.any().optional();

const formSchema = (isIncorporated: boolean) =>
  z.object({
    directors_address: isIncorporated
      ? z.string().optional()
      : z.string().optional(),
    shareholders_address: isIncorporated
      ? z.string().optional()
      : z.string().optional(),
  });

export interface KybDocumentsStepProps {
  onNext: () => void;
  onPrevious: () => void;
  onComplete: () => void;
  currentStep: number;
  totalSteps: number;
  isSubmitting?: boolean;
  isFromOnboarding?: boolean;
}

export default function KybDocumentsStep({
  onNext,
  onPrevious,
  onComplete,
  currentStep,
  totalSteps,
  isSubmitting,
}: KybDocumentsStepProps) {
  const {
    businessProfile,
    businessDocuments,
    updateBusinessDocuments,
    businessDocumentsPreviewUrls,
    requiredUpdates,
  } = useKybStore();
  const isLastStep = currentStep === totalSteps;

  const isIncorporated = businessProfile.business_type === "Incorporated";
  const isRegistered =
    businessProfile.business_type === "Registered" || isIncorporated;

  const form = useForm<z.infer<ReturnType<typeof formSchema>>>({
    resolver: zodResolver(formSchema(isIncorporated)),
    defaultValues: {
      directors_address: businessDocuments.directors_address || "",
      shareholders_address: businessDocuments.shareholders_address || "",
    },
  });

  // Track files separately from the form
  const extractNameFromUrl = (url?: string | null) => {
    if (!url) return "";
    try {
      return url.split("/").pop() || url;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      return url;
    }
  };

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

  const businessImagePlaceholder =
    businessImage?.name ||
    extractNameFromUrl(businessDocumentsPreviewUrls?.image);
  const cacDocumentPlaceholder =
    cacDocument?.name ||
    extractNameFromUrl(businessDocumentsPreviewUrls?.cac_document);
  const mematDocumentPlaceholder =
    mematDocument?.name ||
    extractNameFromUrl(businessDocumentsPreviewUrls?.memat);
  const directorIdentityPlaceholder =
    directorIdentity?.name ||
    extractNameFromUrl(businessDocumentsPreviewUrls?.director_identity);

  // Update form when business type changes
  useEffect(() => {
    form.reset({
      directors_address: businessDocuments.directors_address || "",
      shareholders_address: businessDocuments.shareholders_address || "",
    });
  }, [businessProfile.business_type, form, businessDocuments]);

  function validateFormAndFiles() {
    // Director identity is required for all business types
    const isDirectorIdentityValid = !!directorIdentity;

    // CAC document required only for registered and incorporated
    const isCacDocumentValid = !isRegistered || !!cacDocument;

    return isDirectorIdentityValid && isCacDocumentValid;
  }

  function onSubmit(values: z.infer<ReturnType<typeof formSchema>>) {
    // Combine form values with file state
    updateBusinessDocuments({
      ...values,
      image: businessImage as File,
      cac_document: cacDocument as File,
      memat: mematDocument as File,
      director_identity: directorIdentity as File,
    });

    if (isLastStep) {
      onComplete();
    } else {
      onNext();
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Company profile</h1>
          <p className="mt-2 text-lg font-medium text-primary">
            Required Documents
          </p>
          <p className="mt-1 text-gray-600">
            Please upload the required documents for your business verification
          </p>
        </div>

        {/* Required Fields Banner */}
        {requiredUpdates && requiredUpdates.length > 0 && (
          <RequiredFieldsBanner requiredFields={requiredUpdates} showBanner />
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <FormLabel>
                  Business Logo/Image (optional)
                  {isFieldRequired("image", requiredUpdates) && (
                    <RequiredFieldBadge />
                  )}
                </FormLabel>
                <FileUploader
                  value={businessImagePlaceholder}
                  onValueChange={setBusinessImage}
                  placeholder="Click here to upload business logo/image"
                  accept="image/*"
                  className={cn(
                    isFieldRequired("image", requiredUpdates)
                      ? "ring-2 ring-orange-300 border-orange-300"
                      : undefined,
                  )}
                />
                <FormDescription>
                  Upload a logo or representative image for your business
                </FormDescription>
              </div>

              {isRegistered && (
                <div className="space-y-2">
                  <FormLabel>
                    C.A.C. Document for registration
                    {isFieldRequired("cac_document", requiredUpdates) && (
                      <RequiredFieldBadge />
                    )}
                  </FormLabel>
                  <FileUploader
                    value={cacDocumentPlaceholder}
                    onValueChange={setCacDocument}
                    placeholder="Click here to upload C.A.C. Document"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className={cn(
                      isFieldRequired("cac_document", requiredUpdates)
                        ? "ring-2 ring-orange-300 border-orange-300"
                        : undefined,
                    )}
                  />
                  {!cacDocument && (
                    <p className="text-sm text-destructive">
                      CAC document is required for registered businesses
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <FormLabel>
                  Director&#39;s proof of identification
                  {isFieldRequired("director_identity", requiredUpdates) && (
                    <RequiredFieldBadge />
                  )}
                </FormLabel>
                <FileUploader
                  value={directorIdentityPlaceholder}
                  onValueChange={setDirectorIdentity}
                  placeholder="Click here to upload a proof of identification"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className={cn(
                    isFieldRequired("director_identity", requiredUpdates)
                      ? "ring-2 ring-orange-300 border-orange-300"
                      : undefined,
                  )}
                />
                {!directorIdentity && (
                  <p className="text-sm text-destructive">
                    Director&#39;s ID proof is required
                  </p>
                )}
              </div>

              {isIncorporated && (
                <>
                  <div className="space-y-2">
                    <FormLabel>
                      M.E.M.A.T. or Articles of association (optional)
                      {isFieldRequired("memat", requiredUpdates) && (
                        <RequiredFieldBadge />
                      )}
                    </FormLabel>
                    <FileUploader
                      value={mematDocumentPlaceholder}
                      onValueChange={setMematDocument}
                      placeholder="Click here to upload M.E.M.A.T."
                      accept=".pdf,.jpg,.jpeg,.png"
                      className={cn(
                        isFieldRequired("memat", requiredUpdates)
                          ? "ring-2 ring-orange-300 border-orange-300"
                          : undefined,
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="directors_address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Director&#39;s address(optional)
                          {isFieldRequired(
                            "directors_address",
                            requiredUpdates,
                          ) && <RequiredFieldBadge />}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter director's address"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {isIncorporated && (
                <FormField
                  control={form.control}
                  name="shareholders_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Shareholder&#39;s address (optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter shareholder's address"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
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
                type="submit"
                className="flex-1 bg-primary hover:bg-primary/90"
                disabled={isSubmitting || !validateFormAndFiles()}
              >
                {isLastStep ? "Submit for Verification" : "Proceed"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </>
  );
}
