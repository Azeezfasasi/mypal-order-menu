"use client";

import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { BusinessCategoriesApi } from "@/services/api/business-categories-api";
import { useKybStore, type BusinessType } from "@/stores/kyb-store";
import {
  RequiredFieldsBanner,
  RequiredFieldBadge,
  isFieldRequired,
} from "@/components/kyb/required-fields-indicator";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";

const createFormSchema = z
  .object({
    business_name: z.string().min(1, {
      message: "Business name is required.",
    }),
    business_number: z
      .string()
      .min(1, { message: "Business number is required." })
      .regex(/^(?:\+234|0)[789]\d{9}$/, {
        message: "Enter a valid Nigerian phone number",
      }),
    tax_identification_number: z.string().optional(),
    description: z.string().min(1, {
      message: "Business description is required.",
    }),
    address: z.string().min(1, {
      message: "Business address is required.",
    }),
    category: z.string().min(1, {
      message: "Business category is required.",
    }),
    business_type: z.enum(["Unregistered", "Registered", "Incorporated"]),
    business_start_date: z.date({
      required_error: "Business start date is required.",
    }),
  })
  .superRefine((data, ctx) => {
    // Conditional validation for Tax Identification Number
    if (
      data.business_type === "Registered" ||
      data.business_type === "Incorporated"
    ) {
      if (
        !data.tax_identification_number ||
        data.tax_identification_number.trim() === ""
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Tax identification number is required for registered/incorporated businesses.",
          path: ["tax_identification_number"],
        });
      } else {
        // Add regex validation only if the field is required and provided
        const tinRegex = /^\d{8}-\d{4}$/;
        if (!tinRegex.test(data.tax_identification_number)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "T.I.N must follow the format 24354635-0001 (8 digits - 4 digits).",
            path: ["tax_identification_number"],
          });
        }
      }
    }
  });

export interface KybBusinessDetailsStepProps {
  onNext: () => void;
  onPrevious: () => void;
  onComplete: () => void;
  currentStep: number;
  totalSteps: number;
  isSubmitting?: boolean;
  isFromOnboarding?: boolean;
}

export default function KybBusinessDetailsStep({
  onNext,
  onPrevious,
  isSubmitting,
  isFromOnboarding,
}: KybBusinessDetailsStepProps) {
  const { businessProfile, updateBusinessProfile, requiredUpdates } =
    useKybStore();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Fetch categories from API
  const { data: categoriesData, isLoading: isCategoriesLoading } =
    BusinessCategoriesApi.useGetAllCategories();

  // Extract business categories from API response and filter out any empty strings
  const businessCategories =
    categoriesData?.data
      ?.map((category) => category.business_type)
      ?.filter((category) => category && category.trim() !== "") || [];

  const form = useForm<z.infer<typeof createFormSchema>>({
    resolver: zodResolver(createFormSchema),
    defaultValues: {
      business_name: businessProfile.business_name || "",
      business_number: businessProfile.business_number || "",
      tax_identification_number:
        businessProfile.tax_identification_number || "",
      description: businessProfile.description || "",
      address: businessProfile.address || "",
      category: businessProfile.category || "",
      business_type: businessProfile.business_type || "Unregistered",
      business_start_date: businessProfile.business_start_date
        ? new Date(businessProfile.business_start_date)
        : undefined,
    },
  });

  // Watch business_type to conditionally render fields
  const watchedBusinessType = useWatch({
    control: form.control,
    name: "business_type",
  });

  function onSubmit(values: z.infer<typeof createFormSchema>) {
    updateBusinessProfile({
      ...values,
      business_start_date: values.business_start_date.toISOString(),
      business_type: values.business_type as BusinessType,
      // Ensure TIN is stored as string or null/undefined if not required/provided
      tax_identification_number: values.tax_identification_number || undefined,
    });
    onNext();
  }

  // Get business type label
  // const getBusinessTypeLabel = (value: string) => {
  //   const types = {
  //     unregistered: "Unregistered Business",
  //     registered: "Registered Business",
  //     incorporated: "Incorporated Company",
  //   };
  //   return types[value as keyof typeof types] || value;
  // };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Company profile</h1>
          <p className="mt-2 text-lg font-medium text-primary">
            Business Details
          </p>
          <p className="mt-1 text-gray-600">
            Please provide accurate information about your business
          </p>
        </div>

        {/* Required Fields Banner */}
        {requiredUpdates && requiredUpdates.length > 0 && (
          <RequiredFieldsBanner requiredFields={requiredUpdates} showBanner />
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="business_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business type</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select business type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Registered">
                            Registered Business
                          </SelectItem>
                          <SelectItem value="Incorporated">
                            Incorporated Company
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="business_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel
                      className={cn(
                        "flex items-center gap-2",
                        isFieldRequired("business_name", requiredUpdates)
                          ? "text-orange-600"
                          : undefined,
                      )}
                    >
                      Business name
                      {isFieldRequired("business_name", requiredUpdates) && (
                        <RequiredFieldBadge />
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your business name"
                        {...field}
                        disabled={isFromOnboarding}
                        className={cn(
                          "h-12",
                          isFieldRequired("business_name", requiredUpdates)
                            ? "border-orange-300 ring-2 ring-orange-300"
                            : undefined,
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel
                      className={cn(
                        "flex items-center gap-2",
                        isFieldRequired("category", requiredUpdates)
                          ? "text-orange-600"
                          : undefined,
                      )}
                    >
                      Business category
                      {isFieldRequired("category", requiredUpdates) && (
                        <RequiredFieldBadge />
                      )}
                    </FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger
                          className={cn(
                            "h-12",
                            isFieldRequired("category", requiredUpdates)
                              ? "border-orange-300 ring-2 ring-orange-300"
                              : undefined,
                          )}
                          disabled={isCategoriesLoading}
                        >
                          <SelectValue
                            placeholder={
                              isCategoriesLoading
                                ? "Loading categories..."
                                : "Select business category"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {businessCategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="business_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel
                      className={cn(
                        "flex items-center gap-2",
                        isFieldRequired("business_number", requiredUpdates)
                          ? "text-orange-600"
                          : undefined,
                      )}
                    >
                      Business contact number
                      {isFieldRequired("business_number", requiredUpdates) && (
                        <RequiredFieldBadge />
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter contact number (+23481463783763)"
                        type="tel"
                        maxLength={14}
                        {...field}
                        className={cn(
                          "h-12",
                          isFieldRequired("business_number", requiredUpdates)
                            ? "border-orange-300 ring-2 ring-orange-300"
                            : undefined,
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(watchedBusinessType === "Registered" ||
                watchedBusinessType === "Incorporated") && (
                <FormField
                  control={form.control}
                  name="tax_identification_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel
                        className={cn(
                          "flex items-center gap-2",
                          isFieldRequired(
                            "tax_identification_number",
                            requiredUpdates,
                          )
                            ? "text-orange-600"
                            : undefined,
                        )}
                      >
                        Tax Identification Number
                        {isFieldRequired(
                          "tax_identification_number",
                          requiredUpdates,
                        ) && <RequiredFieldBadge />}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter T.I.N (e.g 24354635-0001)"
                          {...field}
                          className={cn(
                            "h-12",
                            isFieldRequired(
                              "tax_identification_number",
                              requiredUpdates,
                            )
                              ? "border-orange-300 ring-2 ring-orange-300"
                              : undefined,
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="business_start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>
                      Business start date
                      {isFieldRequired("business_start_date", requiredUpdates) && (
                        <RequiredFieldBadge />
                      )}
                    </FormLabel>
                    <Popover
                      open={isCalendarOpen}
                      onOpenChange={setIsCalendarOpen}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "h-12 w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                              isFieldRequired("business_start_date", requiredUpdates)
                                ? "border-orange-300 ring-2 ring-orange-300"
                                : undefined,
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <Calendar className="h-5 w-5 text-gray-500" />
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Select business start date</span>
                              )}
                            </div>
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <div className="flex flex-col">
                          <CalendarComponent
                            mode="single"
                            captionLayout="dropdown"
                            selected={field.value}
                            onSelect={(date) => {
                              field.onChange(date);
                              // Optionally close immediately when a date is selected
                              // setIsCalendarOpen(false);
                            }}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            autoFocus
                            footer={
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  className="w-full"
                                  onClick={() => {
                                    field.onChange(undefined);
                                    setIsCalendarOpen(false);
                                  }}
                                >
                                  Clear date
                                </Button>
                                <Button
                                  variant="default"
                                  className="w-full"
                                  disabled={!field.value}
                                  onClick={() => {
                                    setIsCalendarOpen(false);
                                  }}
                                >
                                  OK
                                </Button>
                              </div>
                            }
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel
                      className={cn(
                        "flex items-center gap-2",
                        isFieldRequired("address", requiredUpdates)
                          ? "text-orange-600"
                          : undefined,
                      )}
                    >
                      Business address
                      {isFieldRequired("address", requiredUpdates) && (
                        <RequiredFieldBadge />
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter business address"
                        {...field}
                        className={cn(
                          "h-12",
                          isFieldRequired("address", requiredUpdates)
                            ? "border-orange-300 ring-2 ring-orange-300"
                            : undefined,
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel
                      className={cn(
                        "flex items-center gap-2",
                        isFieldRequired("description", requiredUpdates)
                          ? "text-orange-600"
                          : undefined,
                      )}
                    >
                      Business description
                      {isFieldRequired("description", requiredUpdates) && (
                        <RequiredFieldBadge />
                      )}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your business"
                        {...field}
                        className={cn(
                          isFieldRequired("description", requiredUpdates)
                            ? "border-orange-300 ring-2 ring-orange-300 min-h-[120px]"
                            : "min-h-[120px]",
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                disabled={isSubmitting || isCategoriesLoading}
              >
                Proceed
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </>
  );
}
