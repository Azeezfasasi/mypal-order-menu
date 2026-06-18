"use client";

import { ImageGenerationShimmer } from "@/components/events/create-event-modal/components/ImageGenerationShimmer";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { calculateDuration } from "@/lib/duration-calculator";
import { EventApi } from "@/services/api/business-events-api";
import { DealsApi } from "@/services/api/deals-api";
import { BaseError } from "@/types/api";
import { IDealFormData } from "@/types/deal-types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, Loader2, Upload, Wand2, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { TimePicker12Demo } from "../shared/time-picker-12h-demo";
import {
  formatDateTo12HourTime,
  parse12HourTimeToDate,
} from "../ui/time-picker-utils";
import { dealFormSchema, IDealFormDataZod } from "./deal-form-schemas";

interface CreateDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDealCreated?: () => void;
}

export default function CreateDealModal({
  isOpen,
  onClose,
  onDealCreated,
}: CreateDealModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  // Remove local isGeneratingImage state, use generateFlyerMutation.isPending instead
  const [hasGeneratedImage, setHasGeneratedImage] = useState(false);

  const { createDealFormData } = DealsApi.useDealFormData();
  const { mutateAsync: createDeal } = DealsApi.useCreateDeal();

  // Initialize form
  const form = useForm<IDealFormDataZod>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: {
      deal_title: "",
      location: "",
      start_date: new Date().toISOString().split("T")[0],
      end_date: new Date().toISOString().split("T")[0],
      start_time: "09:00 AM",
      end_time: "05:00 PM",
      duration: "",
      about_deal: "",
      price: "",
      is_eighteen_plus: false,
      benefits: [{ description: "" }],
      agendas: [{ title: "" }],
      refine_description: false,
      image_preference: undefined,
      flyer_prompt: "",
      flyer_url: undefined,
    },
  });

  // Use field arrays for benefits and agendas
  const {
    fields: benefitFields,
    append: appendBenefit,
    remove: removeBenefit,
  } = useFieldArray({
    control: form.control,
    name: "benefits",
  });

  const {
    fields: agendaFields,
    append: appendAgenda,
    remove: removeAgenda,
  } = useFieldArray({
    control: form.control,
    name: "agendas",
  });

  // Use the same AI image generation endpoint/hook as events
  const generateFlyerMutation = EventApi.useGenerateFlyer();
  const handleGenerateImage = async () => {
    if (hasGeneratedImage) {
      toast.info("You can only generate an image once per deal.");
      return;
    }
    const prompt = form.getValues("flyer_prompt");
    if (!prompt || prompt.trim().length === 0) {
      toast.error("Please enter a prompt for the AI to generate an image");
      return;
    }
    const generatePromise = generateFlyerMutation.mutateAsync({ prompt });
    toast.promise(generatePromise, {
      loading: "Generating your image with MyPal AI...",
      success: (result) => {
        if (result.data?.image_url) {
          form.setValue("flyer_url", result.data.image_url);
          setImagePreview(result.data.image_url);
          setHasGeneratedImage(true);
          return "Image generated successfully!";
        } else {
          throw new Error("Failed to generate image. Please try again.");
        }
      },
      error: (error) => {
        const errObj = typeof error === "object" && error !== null ? error : {};
        const statusCode = errObj.statusCode ?? errObj.response?.status;
        const message =
          errObj.message ??
          errObj.response?.data?.message ??
          errObj.response?.data?.error;
        if (statusCode === 403) {
          return {
            title:
              message || "You have reached your weekly AI limit of 2 uses.",
            description:
              "Upgrade your plan or wait until next week to generate more images with MyPal AI.",
          };
        } else {
          return message || "Failed to generate image. Please try again.";
        }
      },
    });
  };

  // Handle form submission
  const onSubmit = async (data: IDealFormData) => {
    try {
      setIsSubmitting(true);

      // Only include benefits/agendas if present and valid, and ensure description/title is always a string
      const formattedBenefits =
        data.benefits
          ?.filter(
            (b) =>
              typeof b.description === "string" && b.description.trim() !== ""
          )
          .map((b) => ({ description: b.description ?? "" })) ?? undefined;
      const formattedAgendas =
        data.agendas
          ?.filter((a) => typeof a.title === "string" && a.title.trim() !== "")
          .map((a) => ({ title: a.title ?? "" })) ?? undefined;

      const formattedData = {
        ...data,
        price: parseFloat(data.price),
        start_date: data.start_date,
        end_date: data.end_date,
        image: data.image as File,
        benefits: formattedBenefits,
        agendas: formattedAgendas,
      };

      // Create FormData
      const formData = createDealFormData(formattedData);

      // Submit to API using toast.promise so users see loading / success / error states
      const promise = createDeal(formData);

      toast.promise(promise, {
        loading: "Creating deal...",
        success: "Deal created successfully!",
        error: (error: BaseError) => {
          const apiMessage =
            error?.response?.data?.message ||
            error?.message ||
            "An unknown error occurred while creating the deal.";
          return `Failed to create deal: ${apiMessage}`;
        },
      });

      await promise;

      form.reset();
      setImagePreview(null);
      onClose();

      if (onDealCreated) {
        onDealCreated();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form when modal is closed
  const handleClose = () => {
    form.reset();
    setImagePreview(null);
    onClose();
  };

  // Watch form fields for auto-duration calculation
  const watchedFields = form.watch([
    "start_date",
    "start_time",
    "end_date",
    "end_time",
  ]);

  useEffect(() => {
    const [startDate, startTime, endDate, endTime] = watchedFields;

    // Only calculate if we have the minimum required fields
    if (startDate && startTime && endDate && endTime) {
      const calculatedDuration = calculateDuration(
        startDate, // Start date in YYYY-MM-DD format
        startTime, // Start time in "hh:mm AM/PM" format
        endDate, // End date in YYYY-MM-DD format
        endTime // End time in "hh:mm AM/PM" format
      );

      if (calculatedDuration) {
        form.setValue("duration", calculatedDuration, {
          shouldValidate: false,
        });
      }
    } else {
      // Clear duration if we don't have all required fields
      form.setValue("duration", "", {
        shouldValidate: false,
      });
    }
  }, [watchedFields, form]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[92vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-3 border-b bg-gradient-to-r from-orange-50 to-white">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            Create Deal
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
          {/* Added pb-24 for bottom padding */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* BASIC INFORMATION */}
              <section className="rounded-lg border bg-white/60 backdrop-blur-sm p-5 md:p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-semibold tracking-wider text-gray-600 uppercase">
                  Basic Information
                </h3>
                <div className="grid gap-5 grid-cols-2 md:grid-cols-1">
                  <FormField
                    control={form.control}
                    name="deal_title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">
                          Deal Title
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="h-11"
                            placeholder="Enter deal title"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Location</FormLabel>
                        <FormControl>
                          <Input
                            className="h-11"
                            placeholder="Enter deal location"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-5">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="font-medium">Price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.5"
                            min="0"
                            placeholder="0.00"
                            className="h-11"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="is_eighteen_plus"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center gap-3 rounded-lg border border-orange-300 bg-orange-50 px-4 py-3 md:py-4 md:px-5">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="border-orange-500 data-[state=checked]:bg-orange-600 data-[state=checked]:text-white"
                          />
                        </FormControl>
                        <div className="space-y-0 leading-none">
                          <FormLabel className="font-semibold text-orange-700 text-sm">
                            18+ Event
                          </FormLabel>
                          <p className="text-[11px] text-orange-600/80">
                            Check Box if Applicable
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              {/* SCHEDULE */}
              <section className="rounded-lg border bg-white/60 backdrop-blur-sm p-5 md:p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-semibold tracking-wider text-gray-600 uppercase">
                  Schedule
                </h3>
                <div className="grid gap-5 grid-cols-2 md:grid-cols-1">
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">
                          Start Date
                        </FormLabel>
                        <FormControl>
                          <Input type="date" className="h-11" {...field} />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">End Date</FormLabel>
                        <FormControl>
                          <Input type="date" className="h-11" {...field} />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="space-y-4 md:grid-cols-1">
                  {/* Updated time fields with 12-hour format support */}
                  <FormField
                    control={form.control}
                    name="start_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">
                          Start Time
                        </FormLabel>
                        <FormControl>
                          <TimePicker12Demo
                            date={parse12HourTimeToDate(field.value)}
                            setDate={(date) => {
                              if (date) {
                                const formattedTime =
                                  formatDateTo12HourTime(date);
                                field.onChange(formattedTime);
                              } else {
                                field.onChange("09:00 AM"); // fallback to default
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="end_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">End Time</FormLabel>
                        <FormControl>
                          <TimePicker12Demo
                            date={parse12HourTimeToDate(field.value)}
                            setDate={(date) => {
                              if (date) {
                                const formattedTime =
                                  formatDateTo12HourTime(date);
                                field.onChange(formattedTime);
                              } else {
                                field.onChange("05:00 PM"); // fallback to default
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Duration</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            readOnly
                            placeholder="auto-calculated"
                            className="h-11 bg-gray-50 cursor-not-allowed"
                          />
                        </FormControl>
                        <FormDescription className="text-[11px]">
                          Calculated from selected dates
                        </FormDescription>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              {/* DESCRIPTION / AI */}
              <section className="rounded-lg border bg-white/60 backdrop-blur-sm p-5 md:p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-semibold tracking-wider text-gray-600 uppercase">
                  Description and AI Refinement
                </h3>
                <FormField
                  control={form.control}
                  name="about_deal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">
                        Deal Description
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          rows={4}
                          placeholder="Describe your deal..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="refine_description"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-blue-300 bg-blue-50/60 p-4">
                      <div className="space-y-0.5 pr-4">
                        <FormLabel className="text-sm font-medium">
                          AI Description Refinement
                        </FormLabel>
                        <FormDescription className="text-[11px] leading-snug">
                          Use AI to enhance and refine the deal description
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-blue-600"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </section>

              {/* BENEFITS */}
              <section className="rounded-lg border bg-white/60 backdrop-blur-sm p-5 md:p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold tracking-wider text-gray-600 uppercase">
                    Benefits (optional)
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendBenefit({ description: "" })}
                    className="hover:border-orange-500 hover:text-orange-600"
                  >
                    Add Benefit
                  </Button>
                </div>
                <div className="space-y-3">
                  {benefitFields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-start">
                      <FormField
                        control={form.control}
                        name={`benefits.${index}.description`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                placeholder="Enter benefit description"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeBenefit(index)}
                        disabled={benefitFields.length <= 1}
                        className="shrink-0"
                        aria-label="Remove benefit"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </section>

              {/* AGENDAS */}
              <section className="rounded-lg border bg-white/60 backdrop-blur-sm p-5 md:p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold tracking-wider text-gray-600 uppercase">
                    Agenda Items (optional)
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendAgenda({ title: "" })}
                    className="hover:border-orange-500 hover:text-orange-600"
                  >
                    Add Agenda
                  </Button>
                </div>
                <div className="space-y-3">
                  {agendaFields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-start">
                      <FormField
                        control={form.control}
                        name={`agendas.${index}.title`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                placeholder="Enter agenda title"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeAgenda(index)}
                        disabled={agendaFields.length <= 1}
                        className="shrink-0"
                        aria-label="Remove agenda"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </section>

              {/* DEAL IMAGE UPLOAD/GENERATION */}
              <section className="rounded-lg border bg-white/60 backdrop-blur-sm p-5 md:p-6 shadow-sm space-y-6">
                <FormField
                  control={form.control}
                  name="image_preference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Deal Image</FormLabel>
                      <FormDescription className="text-xs">
                        Choose to upload an existing image or generate one using
                        AI
                      </FormDescription>
                      <FormControl>
                        <div className="grid gap-3 sm:grid-cols-1 grid-cols-2">
                          <Button
                            type="button"
                            variant={
                              field.value === "upload" ? "default" : "outline"
                            }
                            className={`h-12 justify-center text-sm font-medium transition-all ${
                              field.value === "upload"
                                ? "bg-orange-600 hover:bg-orange-700"
                                : "border-dashed"
                            }`}
                            onClick={() => field.onChange("upload")}
                          >
                            <Upload className="h-4 w-4 mr-2" /> Upload Image
                          </Button>
                          <Button
                            type="button"
                            variant={
                              field.value === "generate" ? "default" : "outline"
                            }
                            className={`h-12 justify-center text-sm font-medium transition-all ${
                              field.value === "generate"
                                ? "bg-orange-600 hover:bg-orange-700"
                                : "border-dashed"
                            }`}
                            onClick={() => field.onChange("generate")}
                          >
                            <Wand2 className="h-4 w-4 mr-2" /> Generate using
                            MyPal AI
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Upload flow */}
                {form.watch("image_preference") === "upload" && (
                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field: { value, onChange, ...field } }) => (
                      <FormItem className="space-y-4 mt-2">
                        <FormLabel className="text-sm font-medium">
                          Upload Your Image
                        </FormLabel>
                        <FormControl>
                          <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                              <Input
                                type="file"
                                accept="image/*"
                                className="flex-1"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    onChange(file);
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setImagePreview(reader.result as string);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                {...field}
                              />
                              {value && (
                                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                                  <Upload className="h-4 w-4" /> Selected
                                </div>
                              )}
                            </div>
                            {imagePreview && (
                              <div className="relative w-full max-w-[320px] aspect-video rounded-md overflow-hidden border bg-gray-50">
                                <Image
                                  src={imagePreview}
                                  alt="Deal preview"
                                  fill
                                  className="object-cover"
                                />
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="absolute top-2 right-2 bg-white/80 hover:bg-white/90"
                                  onClick={() => {
                                    onChange(null);
                                    setImagePreview(null);
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Generate flow */}
                {form.watch("image_preference") === "generate" && (
                  <>
                    <FormField
                      control={form.control}
                      name="flyer_prompt"
                      render={({ field }) => (
                        <FormItem className="space-y-2 mt-2">
                          <FormLabel className="text-sm font-medium">
                            Image Prompt
                          </FormLabel>
                          <FormDescription className="text-xs">
                            Describe how the deal image should look
                          </FormDescription>
                          <FormControl>
                            <div className="space-y-4">
                              <Textarea
                                placeholder="E.g. Summer sale, beach theme, vibrant colors"
                                className="min-h-[120px] resize-y"
                                {...field}
                              />
                              <Button
                                type="button"
                                className="bg-orange-600 hover:bg-orange-700"
                                onClick={handleGenerateImage}
                                disabled={
                                  generateFlyerMutation.isPending ||
                                  !field.value ||
                                  hasGeneratedImage
                                }
                              >
                                {generateFlyerMutation.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                                    Generating...
                                  </>
                                ) : hasGeneratedImage ? (
                                  <>
                                    <Wand2 className="mr-2 h-4 w-4 opacity-60" />{" "}
                                    Generated
                                  </>
                                ) : (
                                  <>
                                    <Wand2 className="mr-2 h-4 w-4" /> Generate
                                    Image
                                  </>
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {generateFlyerMutation.isPending && (
                      <div className="mt-6 space-y-2">
                        <FormLabel className="text-sm font-medium">
                          Generating Image
                        </FormLabel>
                        <ImageGenerationShimmer />
                      </div>
                    )}

                    {imagePreview &&
                      form.watch("flyer_url") &&
                      !generateFlyerMutation.isPending && (
                        <div className="mt-6 space-y-2">
                          <FormLabel className="text-sm font-medium">
                            Generated Image Preview
                          </FormLabel>
                          <div className="relative w-full max-w-[320px] aspect-video rounded-xl overflow-hidden border bg-black/5 mx-auto shadow-sm">
                            <Image
                              src={imagePreview}
                              alt="Generated deal image preview"
                              className="w-full h-full object-cover"
                              fill
                            />
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/90 hover:bg-white text-gray-800 shadow-md"
                              onClick={() =>
                                window.open(imagePreview, "_blank")
                              }
                            >
                              <Eye className="mr-2 h-4 w-4" /> View image
                            </Button>
                          </div>
                          <FormDescription className="text-center text-xs">
                            Your AI-generated image will be attached to this
                            deal
                          </FormDescription>
                        </div>
                      )}

                    <FormField
                      control={form.control}
                      name="flyer_url"
                      render={({ field }) => <input type="hidden" {...field} />}
                    />
                  </>
                )}
              </section>

              {/* Extra spacing at the bottom to ensure last section is accessible */}
              {/* <div className="h-8" /> */}
            </form>
          </Form>
        </div>

        {/* Fixed action buttons at bottom */}
        <div className="sticky top-0 left-0 right-0 bg-white/95 backdrop-blur-sm supports-[backdrop-filter]:bg-white/80 border-t px-6 py-4 flex justify-end gap-3 shadow-lg">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
            className="bg-orange-600 hover:bg-orange-700 text-white shadow"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Deal"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
