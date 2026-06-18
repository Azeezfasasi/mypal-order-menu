"use client";

import { ContractPreviewModal } from "@/components/dialogs/contract-preview-modal";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { createBusinessContractApi } from "@/services/api/business-contract-api";
import type { BaseError } from "@/types/api";
import type { IBusinessContract } from "@/types/contract-types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Zod schema for business contract
const contractSchema = z.object({
  business_name: z.string().min(1, "Business name is required"),
  business_designation: z.string().optional(),
  business_signature: z.string().optional(),
  business_phone: z.string().optional(),
  business_email: z
    .string()
    .email("Invalid email")
    .optional()
    .or(z.literal("")),
  business_witness_signature: z.string().optional(),
  business_witness_phone: z.string().optional(),
  business_witness_email: z
    .string()
    .email("Invalid email")
    .optional()
    .or(z.literal("")),
});

type ContractFormValues = z.infer<typeof contractSchema>;

export default function ContractSetupTab() {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Get current authenticated business
  const { user: currentBusiness } = useAuth();

  // Get the contract API hooks
  const {
    useGetMyContract,
    useGetContractTemplate,
    useCreateOrUpdateContract,
    useSubmitContract,
  } = createBusinessContractApi();

  const { data: contractData, isLoading } = useGetMyContract();
  const { data: templateData, isLoading: isLoadingTemplate } =
    useGetContractTemplate();
  const createOrUpdateMutation = useCreateOrUpdateContract();
  const submitMutation = useSubmitContract();

  const contract = contractData?.data as IBusinessContract | undefined;
  const template = templateData?.data;

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      business_name: "",
      business_designation: "",
      business_signature: "",
      business_phone: "",
      business_email: "",
      business_witness_signature: "",
      business_witness_phone: "",
      business_witness_email: "",
    },
  });

  // Update form when contract data is loaded
  useEffect(() => {
    if (contract) {
      form.reset({
        business_name: contract.business_name || "",
        business_designation: contract.business_designation || "",
        business_signature: contract.business_signature || "",
        business_phone: contract.business_phone || "",
        business_email: contract.business_email || "",
        business_witness_signature: contract.business_witness_signature || "",
        business_witness_phone: contract.business_witness_phone || "",
        business_witness_email: contract.business_witness_email || "",
      });
      
      // Switch to accepted tab if contract is approved
      if (contract.status?.toUpperCase() === "APPROVED") {
        setActiveTab("accepted");
      }
    }
  }, [contract, form]);

  // Handle mutation errors
  useEffect(() => {
    if (createOrUpdateMutation.isError) {
      const error = createOrUpdateMutation.error as BaseError;
      const errorMsg = error?.response?.data?.message || error?.message || "Failed to save contract";
      setErrorMessage(errorMsg);
      setSuccessMessage(null);
    }
  }, [createOrUpdateMutation.isError, createOrUpdateMutation.error]);

  useEffect(() => {
    if (submitMutation.isError) {
      const error = submitMutation.error as BaseError;
      const errorMsg = error?.response?.data?.message || error?.message || "Failed to submit contract";
      setErrorMessage(errorMsg);
      setSuccessMessage(null);
    }
  }, [submitMutation.isError, submitMutation.error]);

  // Handle mutation success
  useEffect(() => {
    if (createOrUpdateMutation.isSuccess) {
      setSuccessMessage("Contract information saved successfully!");
      setErrorMessage(null);
      // Clear success message after 5 seconds
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [createOrUpdateMutation.isSuccess]);

  useEffect(() => {
    if (submitMutation.isSuccess) {
      setSuccessMessage("Contract submitted successfully for review!");
      setErrorMessage(null);
      // Clear success message after 5 seconds
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [submitMutation.isSuccess]);

  const handleSaveContract = (values: ContractFormValues) => {
    createOrUpdateMutation.mutate(values);
  };

  const handleSignContract = () => {
    submitMutation.mutate();
    setPreviewOpen(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case "SENT":
        return (
          <span className="px-3 py-1 rounded text-sm bg-purple-100 text-purple-800">
            Awaiting Action
          </span>
        );
      case "PENDING":
        return (
          <span className="px-3 py-1 rounded text-sm bg-yellow-100 text-yellow-800">
            In Progress
          </span>
        );
      case "PROCESSING":
        return (
          <span className="px-3 py-1 rounded text-sm bg-blue-100 text-blue-800">
            Under Review
          </span>
        );
      case "APPROVED":
        return (
          <span className="px-3 py-1 rounded text-sm bg-green-100 text-green-800">
            Approved
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded text-sm bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="mx-auto">
      <h1 className="text-2xl md:text-xl font-bold mb-6">Contract Setup</h1>

      {/* Error Alert */}
      {errorMessage && (
        <div className="border border-red-200 rounded p-4 mb-6 bg-red-50">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 mb-1">
                {errorMessage.includes("commission") ? "Contract Setup Required" : "Error Setting Up Contract"}
              </p>
              <p className="text-sm text-red-700">{errorMessage}</p>
              {errorMessage.includes("commission") && (
                <div className="text-xs text-red-600 mt-2 space-y-1">
                  <p>
                    <strong>What this means:</strong> Your Mypal account manager needs to configure the contract commission settings in the admin portal before you can submit this contract.
                  </p>
                  <p>
                    <strong>Next step:</strong> Please contact your account manager or our support team to complete this setup. Once configured, you will be able to submit your contract.
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-700 hover:text-red-900 font-medium text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Success Alert */}
      {successMessage && (
        <div className="border border-green-200 rounded p-4 mb-6 bg-green-50">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">
                ✓ {successMessage}
              </p>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-green-700 hover:text-green-900 font-medium text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Contract Agreement Information Section */}
      {isLoadingTemplate ? (
        <div className="border rounded p-4 mb-6 bg-blue-50">
          <p className="text-sm text-gray-600">Loading contract agreement...</p>
        </div>
      ) : template ? (
        <div className="border rounded p-6 md:p-4 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-start justify-between gap-4 md:flex-col">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 md:flex-col md:items-start">
                <h3 className="text-lg md:text-base font-semibold text-gray-900">
                  {template.title}
                </h3>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Agreement
                </span>
              </div>
              <div className="flex gap-4 text-sm text-gray-600 mb-3 md:flex-col md:gap-2">
                <div>
                  <span className="font-medium">Category:</span>{" "}
                  {template.category.name}
                </div>
                <div>
                  <span className="font-medium">Business Type:</span>{" "}
                  {template.category.business_type}
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Last updated:{" "}
                {new Date(template.updated_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p className="text-sm text-gray-700 italic">
                This is a pre-defined contract agreement for your business
                category. Please review the terms carefully before signing.
              </p>
            </div>
            <div className="ml-4 md:ml-0 md:w-full">
              <Button
                variant="default"
                size="sm"
                onClick={() => setPreviewOpen(true)}
                className="whitespace-nowrap md:w-full"
              >
                View Agreement
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="w-full overflow-y-auto">
          <TabsList>
            <TabsTrigger value="pending">Agreement requests</TabsTrigger>
            <TabsTrigger value="accepted">Accepted agreement</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="pending" className="space-y-6">
          {isLoading ? (
            <div className="border rounded p-8 text-center text-gray-500">
              Loading contract details...
            </div>
          ) : contract && contract.status?.toUpperCase() !== "APPROVED" ? (
            <>
              {/* Contract Status Header */}
              <div className="border rounded p-4 md:p-3 mb-4 bg-[#FFF7F5]">
                <div className="flex items-center justify-between md:flex-col md:items-start md:gap-3">
                  <h2 className="text-lg md:text-base text-[#031826] font-semibold">
                    Mypal Inc Business Agreement
                  </h2>
                  <div className="flex gap-2 items-center md:w-full">
                    {getStatusBadge(contract.status)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewOpen(true)}
                    >
                      View
                    </Button>
                  </div>
                </div>
              </div>

              {/* SENT Status - Awaiting business action */}
              {contract.status?.toUpperCase() === "SENT" && (
                <div className="border border-purple-200 rounded p-6 md:p-4 bg-purple-50">
                  <h3 className="text-md font-semibold mb-3 text-purple-900">
                    Contract Sent for Signature
                  </h3>
                  <p className="text-sm text-purple-800 mb-4">
                    Your contract has been prepared and sent by our team. Please review the agreement and fill in your business information below to proceed with signing.
                  </p>
                  <div className="bg-white rounded p-4 border border-purple-200">
                    <p className="text-sm text-gray-700">
                      <strong>Status:</strong> Awaiting your review and signature
                    </p>
                  </div>
                </div>
              )}

              {/* Form for SENT and PENDING states */}
              {["SENT", "PENDING"].includes(contract.status?.toUpperCase() || "") && (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSaveContract)}>
                    <div className="border rounded p-6 md:p-4 space-y-6">
                      <div className="mb-4">
                        <h3 className="text-md font-semibold mb-2">
                          {contract.status?.toUpperCase() === "SENT" ? "Fill in Your Details" : "Sign Contract Agreement"}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Fill in your business information below to sign the contract agreement. Make sure to review the contract above before submitting.
                        </p>
                      </div>

                      <h4 className="text-sm font-semibold text-gray-700 pt-2">
                        Business Information
                      </h4>

                      <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
                        <FormField
                          control={form.control}
                          name="business_name"
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormLabel>Name *</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Enter your name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="business_designation"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Designation</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="e.g., CEO, Director"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="business_signature"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Signature</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Your signature"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="business_phone"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="+234..." />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="business_email"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  {...field}
                                  placeholder="email@example.com"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <h4 className="text-sm font-semibold text-gray-700 pt-4">
                        Witness Information
                      </h4>

                      <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
                        <FormField
                          control={form.control}
                          name="business_witness_signature"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Witness Signature</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Witness signature"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="business_witness_phone"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Witness Phone</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="+234..." />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="business_witness_email"
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormLabel>Witness Email</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  {...field}
                                  placeholder="witness@example.com"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex gap-2 mt-6 md:flex-col">
                        <Button
                          type="submit"
                          disabled={createOrUpdateMutation.isPending}
                          className="md:w-full"
                        >
                          {createOrUpdateMutation.isPending
                            ? "Saving..."
                            : "Save Information"}
                        </Button>
                        <Button
                          variant="outline"
                          type="button"
                          onClick={() => setPreviewOpen(true)}
                          className="md:w-full"
                        >
                          View Agreement
                        </Button>
                      </div>
                    </div>
                  </form>
                </Form>
              )}

              {/* Success Alert */}
              {successMessage && (
                <div className="border border-green-200 rounded p-4 mb-6 bg-green-50">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800">
                        ✓ {successMessage}
                      </p>
                    </div>
                    <button
                      onClick={() => setSuccessMessage(null)}
                      className="text-green-700 hover:text-green-900 font-medium text-sm"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {/* Ready to Submit section */}
              {contract.business_name && ["SENT", "PENDING"].includes(contract.status?.toUpperCase() || "") && (
                <div className={`border rounded p-6 md:p-4 ${errorMessage?.includes("commission") ? "bg-red-50 border-red-200" : "bg-gray-50"}`}>
                  <div className="flex items-center justify-between md:flex-col md:gap-3">
                    <div className="flex-1">
                      <h3 className="text-md font-semibold mb-1">Ready to Submit?</h3>
                      <p className="text-sm text-gray-600">
                        Please review the agreement and your information above before submitting.
                      </p>
                      {errorMessage?.includes("commission") && (
                        <p className="text-xs text-red-600 mt-2 font-medium">
                          ⚠️ Commission setup is required before submission. Please contact your account manager.
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={handleSignContract}
                      disabled={submitMutation.isPending || errorMessage?.includes("commission")}
                      className="md:w-full"
                      size="sm"
                      title={errorMessage?.includes("commission") ? "Commission must be configured by admin before submission" : ""}
                    >
                      {submitMutation.isPending ? "Submitting..." : "Submit for Review"}
                    </Button>
                  </div>
                </div>
              )}

              {/* PROCESSING Status - Under review */}
              {contract.status?.toUpperCase() === "PROCESSING" && (
                <div className="border border-blue-200 rounded p-6 bg-blue-50">
                  <h3 className="text-md font-semibold mb-3 text-blue-900">
                    Contract Under Review
                  </h3>
                  <p className="text-sm text-blue-800">
                    Your contract has been submitted and is currently being reviewed by our team. You will be notified once it has been approved.
                  </p>
                </div>
              )}

            </>
          ) : (
            <div className="border rounded p-8 text-center">
              <p className="text-gray-600">
                Awaiting contract to be sent by the team. You will see the signing form once a contract has been sent to you.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="accepted">
          {isLoading ? (
            <div className="border rounded p-8 text-center text-gray-500">
              Loading contract details...
            </div>
          ) : contract && contract.status?.toUpperCase() === "APPROVED" ? (
            <>
              {/* Contract Status Header */}
              <div className="border rounded p-4 md:p-3 mb-4 bg-[#FFF7F5]">
                <div className="flex items-center justify-between md:flex-col md:items-start md:gap-3">
                  <h2 className="text-lg md:text-base text-[#031826] font-semibold">
                    Mypal Inc Business Agreement
                  </h2>
                  <div className="flex gap-2 items-center md:w-full">
                    {getStatusBadge(contract.status)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewOpen(true)}
                    >
                      View
                    </Button>
                  </div>
                </div>
              </div>

              {/* APPROVED Status - Complete */}
              <div className="border border-green-200 rounded p-6 bg-green-50">
                <h3 className="text-md font-semibold mb-3 text-green-900">
                  Contract Approved
                </h3>
                <p className="text-sm text-green-800">
                  Your contract has been successfully approved and signed. You can view the final agreement below.
                </p>
              </div>

              {/* Contract Details for Reference */}
              <div className="border rounded p-6 md:p-4 space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-4">
                    Business Information
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Name</p>
                      <p className="text-sm font-medium text-gray-900">
                        {contract.business_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Designation</p>
                      <p className="text-sm font-medium text-gray-900">
                        {contract.business_designation || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Email</p>
                      <p className="text-sm font-medium text-gray-900">
                        {contract.business_email || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Phone</p>
                      <p className="text-sm font-medium text-gray-900">
                        {contract.business_phone || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="border rounded p-8 text-center text-gray-500">
              No accepted agreements yet.
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Contract Preview Modal */}
      <ContractPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        contract={contract || null}
        template={template || null}
        currentBusiness={currentBusiness || null}
        onSign={handleSignContract}
        isSubmitting={submitMutation.isPending}
      />
    </div>
  );
}
