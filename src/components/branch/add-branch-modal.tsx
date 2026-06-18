"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { BranchesApi, ICreateBranchPayload, IBranch } from "@/services/api/branches-api";

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const branchFormSchema = z.object({
  branch_name: z.string().min(2, "Branch name is required"),
  whatsapp_number: z.string().min(10, "Valid WhatsApp number required"),
  street_address: z.string().min(3, "Street address is required"),
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
  clone_from_branch: z.string().optional(),
  start_with_blank: z.boolean().optional(),
});

type BranchFormValues = z.infer<typeof branchFormSchema>;

interface AddBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  branches?: IBranch[];
  managers?: Array<{ id: string; name: string }>;
}

export function AddBranchModal({
  isOpen,
  onClose,
  branches = [],
  managers = [],
}: AddBranchModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const { mutate: createBranch, isPending } = BranchesApi.useCreateBranch();

  const defaultOpeningHours = {
    Mon: { opens: "07:00", closes: "17:00", is_open: true },
    Tue: { opens: "07:00", closes: "17:00", is_open: true },
    Wed: { opens: "07:00", closes: "17:00", is_open: true },
    Thu: { opens: "07:00", closes: "17:00", is_open: true },
    Fri: { opens: "07:00", closes: "17:00", is_open: true },
    Sat: { opens: "07:00", closes: "17:00", is_open: true },
    Sun: { opens: "07:00", closes: "17:00", is_open: false },
  };

  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchFormSchema),
    defaultValues: {
      branch_name: "",
      whatsapp_number: "",
      street_address: "",
      city: "",
      state: "",
      opening_hours: defaultOpeningHours,
      clone_from_branch: undefined,
      start_with_blank: true,
    },
  });

  const onSubmit = (data: BranchFormValues) => {
    const payload: ICreateBranchPayload = {
      name: data.branch_name,
      address: data.street_address,
      city: data.city,
      state: data.state,
      whatsapp_number: data.whatsapp_number,
      manager_id: data.manager_id,
      opening_hours: data.opening_hours,
    };

    if (data.clone_from_branch) {
      payload.clone_from_branch = data.clone_from_branch;
    }

    createBranch(payload, {
      onSuccess: () => {
        form.reset();
        setCurrentStep(1);
        onClose();
      },
    });
  };

  const handleNext = async () => {
    let isValid = false;

    if (currentStep === 1) {
      isValid = await form.trigger([
        "branch_name",
        "whatsapp_number",
        "street_address",
        "city",
        "state",
        "manager_id",
      ]);
    } else if (currentStep === 2) {
      isValid = await form.trigger("opening_hours");
    } else if (currentStep === 3) {
      isValid = true; // Menu setup is optional
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
          <DialogTitle className="text-left mb-2">Add new branch</DialogTitle>
        </DialogHeader>

        <div className="mb-0 bg-[#FEF2EE] p-4">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
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
                {step < 3 && (
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
            <span className={currentStep === 3 ? "text-orange-500 font-medium" : ""}>
              Menu setup
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
                  name="branch_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Branch name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g Ballroom" {...field} className="rounded-[6px] p-6" />
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
                        <FormLabel className="text-base">Whatsapp business number *</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g 08012345678" {...field} className="rounded-[6px] p-6" />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                   />

                  <FormField
                    control={form.control}
                    name="street_address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Street address *</FormLabel>
                        <FormControl>
                          <Input placeholder="Your branch address" {...field} className="rounded-[6px] p-6" />
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
                                <Input placeholder="e.g Lagos" {...field} className="rounded-[6px] p-6" />
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
                            <Input placeholder="e.g Lagos" {...field} className="rounded-[6px] p-6" />
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
                              <SelectValue placeholder="Tunde Adyemi" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {managers.map((manager) => (
                              <SelectItem key={manager.id} value={manager.id}>
                                {manager.name}
                              </SelectItem>
                            ))}
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
                  Set the opening hours for this specific branch.
                </p>
                {daysOfWeek.map((day) => (
                  <div key={day} className="flex md:flex-col justify-center items-center md:gap-2 gap-4 pb-4 border-b">
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

            {/* Step 3: Menu Setup */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-6">
                  How would you like to populate this branch&apos;s menu?
                </p>

                <FormField
                  control={form.control}
                  name="clone_from_branch"
                  render={({ field }) => (
                    <FormItem className="border rounded-lg p-4 cursor-pointer hover:bg-blue-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          id="clone"
                          checked={!!field.value}
                          onChange={() => {
                            if (branches.length > 0) {
                              field.onChange(branches[0].id);
                              form.setValue("start_with_blank", false);
                            }
                          }}
                          className="mt-1"
                          disabled={branches.length === 0}
                        />
                        <div className="flex-1">
                          <label htmlFor="clone" className="font-medium cursor-pointer">
                            Clone existing menu
                          </label>
                          <p className="text-sm text-gray-600 mt-1">
                            Copy all categories, items, and modifiers from another branch. Prices can
                            be adjusted independently.
                          </p>
                          {!!field.value && branches.length > 0 && (
                            <Select value={field.value || ""} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger className="mt-3 rounded-[6px] p-6">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {branches.map((branch) => (
                                  <SelectItem key={branch.id} value={branch.id}>
                                    {branch.name} ({branch.menu_items_count} items)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          {branches.length === 0 && (
                            <p className="text-sm text-gray-500 mt-3">
                              No existing branch menus are available to clone from yet.
                            </p>
                          )}
                        </div>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="start_with_blank"
                  render={({ field }) => (
                    <FormItem className="border rounded-lg p-4 cursor-pointer hover:bg-blue-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          id="blank"
                          checked={field.value}
                          onChange={() => {
                            field.onChange(true);
                            form.setValue("clone_from_branch", "");
                          }}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <label htmlFor="blank" className="font-medium cursor-pointer">
                            Start with a blank menu
                          </label>
                          <p className="text-sm text-gray-600 mt-1">
                            Build the catalog from scratch. Best for branches with a completely
                            different offering.
                          </p>
                        </div>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="bg-orange-50 border border-orange-200 rounded p-3 mt-4">
                  <p className="text-sm text-orange-800">
                    ⚠ After cloning, each branch&apos;s menu is independent. Price changes at one
                    branch won&apos;t affect another unless you use Sync All.
                  </p>
                </div>
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
                Cancel
              </Button>

              <div className="flex gap-3">
                {currentStep < 3 && (
                  <Button
                    type="button"
                    variant="default"
                    onClick={handleNext}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    Continue
                  </Button>
                )}

                {currentStep === 3 && (
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    {isPending ? "Creating..." : "Continue"}
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
