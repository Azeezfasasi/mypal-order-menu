"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CancellationPolicy } from "@/services/api/cancellation-policy-api";
import {
  CancellationPolicyApi,
  type CreateCancellationPolicyDto,
} from "@/services/api/cancellation-policy-api";
import type { BaseApiResponse } from "@/types/api";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import RulesEditor from "../fine-dinings-offerings/RulesEditor";

export default function CancellationPolicySection() {
  const [showPolicyDialog, setShowPolicyDialog] = useState(false);
  const [policyId, setPolicyId] = useState<string | null>(null);

  const {
    data: policiesData,
    isLoading: policiesLoading,
    error: policiesError,
  } = CancellationPolicyApi.useGetBusinessCancellationPolicies();
  const createPolicy = CancellationPolicyApi.useCreateCancellationPolicy();
  const updatePolicy = CancellationPolicyApi.useUpdateCancellationPolicy();

  const policyForm = useForm<CreateCancellationPolicyDto>({
    defaultValues: { title: "", description: "", rules: [] },
  });
  const {
    register: registerPolicy,
    handleSubmit: handlePolicySubmit,
    reset: resetPolicy,
    control: policyControl,
  } = policyForm;

  useEffect(() => {
    const fetched = policiesData?.data;
    if (Array.isArray(fetched) && fetched.length > 0) {
      const first = fetched[0];
      setPolicyId(first.id);
      resetPolicy({
        title: first.title || "",
        description: first.description || "",
        rules: first.rules || [],
      });
    }
  }, [policiesData, resetPolicy]);

  const handleSavePolicy = (values: CreateCancellationPolicyDto) => {
    const rules = (values.rules || []).map((r, idx) => ({
      ...r,
      sortOrder: r.sortOrder ?? idx + 1,
    }));
    const payload: CreateCancellationPolicyDto = { ...values, rules };

    const onSuccess = (data: BaseApiResponse<CancellationPolicy>) => {
      const created = data?.data;
      if (created?.id) setPolicyId(created.id);
      resetPolicy({
        title: created?.title || payload.title || "",
        description: created?.description || payload.description || "",
        rules: created?.rules || payload.rules || [],
      });
      setShowPolicyDialog(false);
    };

    if (policyId)
      updatePolicy.mutate({ id: policyId, data: payload }, { onSuccess });
    else createPolicy.mutate(payload, { onSuccess });
  };

  const hasPolicy =
    Array.isArray(policiesData?.data) && policiesData!.data.length > 0;
  const currentPolicy = hasPolicy ? policiesData!.data[0] : null;

  return (
    <div>
      <Card>
        <CardHeader className="flex flex-row md:flex-col items-center justify-between">
          <CardTitle className="text-2xl self-start font-semibold text-primary-600 md:text-lg">
            Cancellation Policy
          </CardTitle>
          <Button
            size="sm"
            className="bg-orange-600 hover:bg-orange-700 text-white"
            onClick={() => {
              if (!hasPolicy)
                resetPolicy({ title: "", description: "", rules: [] });
              setShowPolicyDialog(true);
            }}
            disabled={createPolicy.isPending || updatePolicy.isPending}
          >
            {createPolicy.isPending || updatePolicy.isPending
              ? "Saving..."
              : hasPolicy
                ? "Edit Policy"
                : "+ Add Policy"}
          </Button>
        </CardHeader>
        <CardContent>
          {policiesLoading ? (
            <div className="py-6">Loading...</div>
          ) : policiesError ? (
            <div>Error</div>
          ) : hasPolicy ? (
            <div className="rounded-md border p-3 bg-gray-50 text-sm text-gray-700 whitespace-pre-wrap">
              {currentPolicy?.description || ""}
            </div>
          ) : (
            <div className="rounded-md border p-6 bg-gray-50 text-sm text-gray-700">
              <p className="text-gray-700">
                No cancellation policy defined yet.
              </p>
              <p className="text-gray-500 mt-2">
                Add a policy to tell customers your refund and cancellation
                rules.
              </p>
              <div className="mt-4">
                <Button
                  size="sm"
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                  onClick={() => {
                    resetPolicy({ title: "", description: "", rules: [] });
                    setShowPolicyDialog(true);
                  }}
                >
                  + Add Policy
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showPolicyDialog} onOpenChange={setShowPolicyDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle>Edit cancellation policy</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePolicySubmit(handleSavePolicy)}>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold text-gray-700">
                  Title
                </Label>
                <div className="mt-2">
                  <Input
                    {...registerPolicy("title", {
                      required: "Title is required",
                    })}
                    placeholder="Policy title"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold text-gray-700">
                  Description
                </Label>
                <div className="mt-2">
                  <Textarea
                    placeholder="Our standard cancellation policy for most services"
                    {...registerPolicy("description")}
                    rows={3}
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold text-gray-700">
                  Rules
                </Label>
                <div className="mt-2">
                  <RulesEditor
                    control={policyControl}
                    register={registerPolicy}
                  />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm py-3 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPolicyDialog(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
