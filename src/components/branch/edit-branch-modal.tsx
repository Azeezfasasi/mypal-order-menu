"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { BranchesApi, IBranch } from "@/services/api/branches-api";

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const defaultOpeningHours = {
  Mon: { opens: "07:00", closes: "17:00", is_open: true },
  Tue: { opens: "07:00", closes: "17:00", is_open: true },
  Wed: { opens: "07:00", closes: "17:00", is_open: true },
  Thu: { opens: "07:00", closes: "17:00", is_open: true },
  Fri: { opens: "07:00", closes: "17:00", is_open: true },
  Sat: { opens: "07:00", closes: "17:00", is_open: true },
  Sun: { opens: "07:00", closes: "17:00", is_open: false },
};

const branchFormSchema = z.object({
  name: z.string().min(2, "Branch name is required"),
  whatsapp_number: z.string().min(10, "Valid WhatsApp number required"),
  address: z.string().min(3, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State/Region is required"),
  manager_id: z.string().optional(),
  opening_hours: z.object({
    Mon: z.object({
      opens: z.string(),
      closes: z.string(),
      is_open: z.boolean(),
    }),
    Tue: z.object({
      opens: z.string(),
      closes: z.string(),
      is_open: z.boolean(),
    }),
    Wed: z.object({
      opens: z.string(),
      closes: z.string(),
      is_open: z.boolean(),
    }),
    Thu: z.object({
      opens: z.string(),
      closes: z.string(),
      is_open: z.boolean(),
    }),
    Fri: z.object({
      opens: z.string(),
      closes: z.string(),
      is_open: z.boolean(),
    }),
    Sat: z.object({
      opens: z.string(),
      closes: z.string(),
      is_open: z.boolean(),
    }),
    Sun: z.object({
      opens: z.string(),
      closes: z.string(),
      is_open: z.boolean(),
    }),
  }),
});

type BranchFormValues = z.infer<typeof branchFormSchema>;

interface EditBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  branch: IBranch | null;
}

export function EditBranchModal({
  isOpen,
  onClose,
  branch,
}: EditBranchModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const { mutate: updateBranch, isPending } = BranchesApi.useUpdateBranch(
    branch?.id || ""
  );

  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchFormSchema),
    defaultValues: {
      name: branch?.name || "",
      whatsapp_number: branch?.whatsapp_number || "",
      address: branch?.address || "",
      city: branch?.city || "",
      state: branch?.state || "",
      manager_id: branch?.manager_id || "",
      opening_hours: branch?.opening_hours || defaultOpeningHours,
    },
  });

  React.useEffect(() => {
    if (branch) {
      form.reset({
        name: branch.name,
        whatsapp_number: branch.whatsapp_number || "",
        address: branch.address,
        city: branch.city,
        state: branch.state,
        manager_id: branch.manager_id || "",
        opening_hours: branch.opening_hours || defaultOpeningHours,
      });
    }
  }, [branch, form]);

  const onSubmit = (data: BranchFormValues) => {
    if (!branch) return;

    updateBranch(
      {
        name: data.name,
        address: data.address,
        city: data.city,
        state: data.state,
        whatsapp_number: data.whatsapp_number,
        manager_id: data.manager_id,
        opening_hours: data.opening_hours,
      },
      {
        onSuccess: () => {
          form.reset();
          setCurrentStep(1);
          onClose();
        },
      }
    );
  };

  const handleNext = async () => {
    let isValid = false;

    if (currentStep === 1) {
      isValid = await form.trigger([
        "name",
        "whatsapp_number",
        "address",
        "city",
        "state",
        "manager_id",
      ]);
    } else if (currentStep === 2) {
      isValid = await form.trigger("opening_hours");
    }

    if (isValid) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-4">
          <DialogTitle className="text-left mb-2">Edit branch</DialogTitle>
        </DialogHeader>

        <div className="mb-0 bg-[#FEF2EE] p-4">
          <div className="flex items-center justify-between">
            {[1, 2].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full font-medium text-sm ${
                    step <= currentStep
                      ? "bg-orange-500 text-white"
                      : "bg-transparent border border-gray-600 text-gray-600"
                  }`}
                >
                  {step}
                </div>
                {step < 2 && (
                  <div
                    className={`h-1 w-16 mx-2 ${
                      step < currentStep ? "bg-orange-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3 text-sm">
            <span className={currentStep === 1 ? "text-orange-500 font-medium" : ""}>
              Location
            </span>
            <span className={currentStep === 2 ? "text-orange-500 font-medium" : ""}>
              Hours
            </span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
            {/* Step 1: Location */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Branch name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g Main Branch"
                          {...field}
                          className="rounded-[6px] p-6"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="whatsapp_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">
                          Whatsapp business number *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g 08012345678"
                            {...field}
                            className="rounded-[6px] p-6"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Address *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g 123 Main Street"
                            {...field}
                            className="rounded-[6px] p-6"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">City *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g Lagos"
                            {...field}
                            className="rounded-[6px] p-6"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">State / Region *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g Lagos State"
                            {...field}
                            className="rounded-[6px] p-6"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="manager_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Assign manager</FormLabel>
                        <Select value={field.value || ""} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="rounded-[6px] p-6">
                              <SelectValue placeholder="Select a manager" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {/* Managers will be added here when available */}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Hours */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Set the opening hours for this branch.
                </p>
                {daysOfWeek.map((day) => (
                  <div
                    key={day}
                    className="flex md:flex-col justify-center items-center md:gap-2 gap-4 pb-4 border-b"
                  >
                    <div className="flex md:flex-col justify-center items-center gap-3">
                      <FormField
                        control={form.control}
                        name={`opening_hours.${day as keyof BranchFormValues["opening_hours"]}.is_open`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <div className="font-medium text-sm">{day}</div>
                    </div>

                    <FormField
                      control={form.control}
                      name={`opening_hours.${day as keyof BranchFormValues["opening_hours"]}.opens`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                              className="w-32 rounded-[6px] p-6"
                              disabled={!form.watch(
                                `opening_hours.${day as keyof BranchFormValues["opening_hours"]}.is_open`
                              )}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`opening_hours.${day as keyof BranchFormValues["opening_hours"]}.closes`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                              className="w-32 rounded-[6px] p-6"
                              disabled={!form.watch(
                                `opening_hours.${day as keyof BranchFormValues["opening_hours"]}.is_open`
                              )}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-between pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                Back
              </Button>

              <div className="flex gap-3">
                {currentStep < 2 && (
                  <Button
                    type="button"
                    variant="default"
                    onClick={handleNext}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    Continue
                  </Button>
                )}

                {currentStep === 2 && (
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    {isPending ? "Saving..." : "Save changes"}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
