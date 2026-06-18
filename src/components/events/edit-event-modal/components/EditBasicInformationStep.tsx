"use client";

import FullScreenFlyerPreview from "@/components/events/FullScreenFlyerPreview";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { EventApi } from "@/services/api/business-events-api";
import { AIError } from "@/types/api";
import { BusinessCategoryType, EventClass, EventType } from "@/types/enums";
import { IEvent } from "@/types/event-types";
import { Eye, Loader2, Upload, Wand2, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { ImageGenerationShimmer } from "../../create-event-modal/components/ImageGenerationShimmer";
import { EventFormValues } from "../../create-event-modal/types";

interface EditBasicInformationStepProps {
  form: UseFormReturn<EventFormValues>;
  event: IEvent;
}

export const EditBasicInformationStep = ({
  form,
  event,
}: EditBasicInformationStepProps) => {
  const { user: business } = useAuth();
  const [imagePreview, setImagePreview] = useState<string | null>(
    event.flyer_url || null,
  );
  const [eventTypeOpen, setEventTypeOpen] = useState(false);
  const [eventClassOpen, setEventClassOpen] = useState(false);
  const [isGeneratingFlyer, setIsGeneratingFlyer] = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);

  const generateFlyerMutation = EventApi.useGenerateFlyer();

  // Watch for changes in form fields to maintain preview state
  const currentImage = form.watch("image");
  const currentFlyerUrl = form.watch("flyer_url");
  const imagePreference = form.watch("image_preference");

  // Check if business can create exclusive events
  const canCreateExclusiveEvents =
    business?.category?.business_type === BusinessCategoryType.BEACHESRESORTS ||
    business?.category?.business_type === BusinessCategoryType.PARKSRECREATION;

  // Set default image_preference to "keep" when there's an existing image
  useEffect(() => {
    // If there's an existing flyer_url and no image preference has been selected yet
    if (event.flyer_url && !form.watch("image_preference")) {
      // Set image_preference to "keep" by default
      form.setValue("image_preference", "keep");
      console.log(
        "🔄 Setting default image_preference to 'keep' for existing image",
      );
    }
  }, [event.flyer_url, form]);

  // Initialize image preview and sync with form state
  useEffect(() => {
    console.log("📸 Edit Image preview sync:", {
      imagePreference,
      currentImage: currentImage instanceof File ? "File object" : currentImage,
      currentFlyerUrl,
      eventFlyerUrl: event.flyer_url,
    });

    if (imagePreference === "upload" && currentImage instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log("📸 Setting preview from uploaded file");
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(currentImage);
    } else if (imagePreference === "generate" && currentFlyerUrl) {
      console.log("📸 Setting preview from new flyer URL:", currentFlyerUrl);
      setImagePreview(currentFlyerUrl);
    } else if (imagePreference === "keep" && event.flyer_url) {
      console.log(
        "📸 Using existing event flyer URL for keep option:",
        event.flyer_url,
      );
      setImagePreview(event.flyer_url);
    } else if (!currentImage && !currentFlyerUrl && event.flyer_url) {
      console.log("📸 Using existing event flyer URL:", event.flyer_url);
      setImagePreview(event.flyer_url);
    } else if (!currentImage && !currentFlyerUrl && !event.flyer_url) {
      console.log("📸 Clearing image preview");
      setImagePreview(null);
    }
  }, [currentImage, currentFlyerUrl, imagePreference, event.flyer_url]);

  // Function to handle AI flyer generation
  const handleGenerateFlyer = async () => {
    const prompt = form.getValues("flyer_prompt");

    if (!prompt || prompt.trim().length === 0) {
      toast.error("Please enter a prompt for the AI to generate a flyer");
      return;
    }

    try {
      setIsGeneratingFlyer(true);
      const result = await generateFlyerMutation.mutateAsync({
        prompt,
      });

      if (result.data?.image_url) {
        form.setValue("flyer_url", result.data.image_url);
        setImagePreview(result.data.image_url);
        toast.success("Flyer generated successfully!");
      } else {
        toast.error("Failed to generate flyer. Please try again.");
      }
    } catch (error) {
      console.error("Error generating flyer:", error);
      setIsGeneratingFlyer(false);

      const errObj: AIError =
        typeof error === "object" && error !== null ? (error as AIError) : {};
      const statusCode = errObj.statusCode ?? errObj.response?.status;
      const message = errObj.response?.data?.message;

      console.error("Error generating flyer:", {
        message,
        statusCode,
        error: errObj,
      });

      if (statusCode === 403) {
        toast.error(
          message || "You have reached your weekly AI limit of 2 uses.",
          {
            description:
              "Upgrade your plan or wait until next week to generate more flyers with MyPal AI.",
          },
        );
      } else {
        toast.error("Failed to generate flyer. Please try again.");
      }
    } finally {
      setIsGeneratingFlyer(false);
    }
  };

  // If in full preview mode, show only the preview
  if (
    showFullPreview &&
    imagePreview &&
    (form.watch("flyer_url") || event.flyer_url)
  ) {
    return (
      <FullScreenFlyerPreview
        open={showFullPreview}
        onClose={() => setShowFullPreview(false)}
        flyerUrl={imagePreview}
        altText="Event flyer preview"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
        <FormField
          control={form.control}
          name="event_title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Event Title <span className="text-red-300">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter event title"
                  {...field}
                  className="capitalize h-11"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Location <span className="text-red-300">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter event location"
                  {...field}
                  className="capitalize h-11"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
        <FormField
          control={form.control}
          name="event_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Event Type <span className="text-red-300">*</span>
              </FormLabel>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  setEventTypeOpen(false);
                }}
                disabled
                open={eventTypeOpen}
                onOpenChange={setEventTypeOpen}
              >
                <FormControl>
                  <SelectTrigger
                    aria-label="Event type"
                    className="capitalize h-11"
                  >
                    <SelectValue
                      placeholder="Select event type"
                      className="capitalize h-11"
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent
                  position="popper"
                  sideOffset={4}
                  onCloseAutoFocus={(e) => e.preventDefault()}
                >
                  {Object.values(EventType).map((type) => (
                    <SelectItem
                      key={type}
                      value={type}
                      className="capitalize"
                      textValue={type}
                      disabled
                    >
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="event_class"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Event Class <span className="text-red-300">*</span>
              </FormLabel>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  setEventClassOpen(false);
                }}
                disabled
                open={eventClassOpen}
                onOpenChange={setEventClassOpen}
              >
                <FormControl>
                  <SelectTrigger
                    aria-label="Event class"
                    className="capitalize h-11"
                  >
                    <SelectValue placeholder="Select event class" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent
                  position="popper"
                  sideOffset={4}
                  className="capitalize"
                  onCloseAutoFocus={(e) => e.preventDefault()}
                >
                  {Object.values(EventClass)
                    .filter((classType) => {
                      // Only show exclusive option for beaches & resort businesses
                      if (classType === EventClass.EXCLUSIVE) {
                        return canCreateExclusiveEvents;
                      }
                      return true; // Always show regular events
                    })
                    .map((classType) => (
                      <SelectItem
                        key={classType}
                        value={classType}
                        className="capitalize"
                        disabled
                      >
                        {classType}
                      </SelectItem>
                    ))}
                  {!canCreateExclusiveEvents && (
                    <div className="px-2 py-1 text-xs text-gray-500 border-t">
                      Exclusive events are only available for Outdoor businesses
                    </div>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="about"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              About <span className="text-red-300">*</span>
            </FormLabel>
            <FormControl>
              <Textarea
                placeholder="Enter event description"
                className="min-h-[100px]"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="refine_description"
        render={({ field }) => (
          <FormItem className="flex flex-row border-blue-600 bg-blue-400/10 items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base md:text-sm">
                AI Description Refinement
              </FormLabel>
              <FormDescription className="md:text-xs text-sm">
                Use AI to enhance and refine the event description
              </FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="is_eighten_plus"
        render={({ field }) => (
          <FormItem className="flex flex-row border-primary-600 bg-primary-400/10 items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base md:text-sm">
                Adult Content (18+)
              </FormLabel>
              <FormDescription className="md:text-xs text-sm">
                Enable if this event is for adults only
              </FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="image_preference"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Event Image <span className="text-red-300">*</span>
            </FormLabel>
            <FormDescription>
              {event.flyer_url
                ? "Keep existing image, upload a new one, or generate a new flyer with MyPal AI"
                : "Upload an image or generate a flyer using AI"}
            </FormDescription>
            <FormControl>
              <div className="space-y-4">
                <div className="flex flex-row gap-4">
                  {event.flyer_url && (
                    <Button
                      type="button"
                      className={`flex-1 ${
                        field.value === "keep"
                          ? "bg-blue-600 hover:bg-blue-700"
                          : "bg-white text-blue-600 border border-blue-300 hover:bg-blue-50"
                      }`}
                      onClick={() => field.onChange("keep")}
                    >
                      Keep existing
                    </Button>
                  )}
                  <Button
                    type="button"
                    className={`flex-1 ${
                      field.value === "upload"
                        ? "bg-orange-600 hover:bg-orange-700"
                        : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    }`}
                    onClick={() => field.onChange("upload")}
                  >
                    <Upload className="h-4 w-4 mr-2" /> Upload new
                  </Button>
                  <Button
                    type="button"
                    className={`flex-1 ${
                      field.value === "generate"
                        ? "bg-orange-600 hover:bg-orange-700"
                        : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    }`}
                    onClick={() => field.onChange("generate")}
                  >
                    {field.value === "generate"
                      ? "Keep Current Image"
                      : "Generate using MyPal AI"}
                  </Button>
                </div>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {form.watch("image_preference") === "upload" && (
        <FormField
          control={form.control}
          name="image"
          rules={{
            validate: (value) => {
              // Always valid if there's an existing flyer_url
              if (event.flyer_url) {
                return true;
              }
              // For new images, require a File object
              if (!value) {
                return "Event image is required";
              }
              return true;
            },
          }}
          render={({ field: { value, onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Upload Your Image</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  <div className="flex flex-row sm:flex-col items-center sm:items-start gap-4">
                    <Input
                      type="file"
                      accept="image/*"
                      className="flex-1"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          onChange(file);
                          // Clear any AI-generated data
                          form.setValue("flyer_url", undefined);
                          form.setValue("flyer_prompt", "");
                          form.setValue("flyer_cta", undefined);
                        }
                      }}
                      {...field}
                    />
                    {value && (
                      <div className="flex items-center gap-2">
                        <Upload className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600">
                          New image selected
                        </span>
                      </div>
                    )}
                  </div>
                  {imagePreview && (
                    <div className="relative w-full max-w-[400px] sm:max-w-[300px] aspect-video rounded-lg overflow-hidden mx-0 sm:mx-auto">
                      <Image
                        src={imagePreview}
                        alt="Event preview"
                        className="w-full h-full object-cover"
                        fill
                      />
                      {value && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 bg-white/80 hover:bg-white/90"
                          onClick={() => {
                            onChange(null);
                            setImagePreview(event.flyer_url || null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      {!value && event.flyer_url && (
                        <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                          Current Image
                        </div>
                      )}
                      {value && (
                        <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                          New Image
                        </div>
                      )}
                    </div>
                  )}
                  {!imagePreview && (
                    <div className="text-sm text-gray-500 italic">
                      No image currently set. Please upload an image.
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {form.watch("image_preference") === "generate" && (
        <>
          <FormField
            control={form.control}
            name="flyer_prompt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Flyer Prompt</FormLabel>
                <FormDescription>
                  Input details of how the flyer should look like
                </FormDescription>
                <FormControl>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="e.g. Design a flyer for 'Summer Music Festival' at Grand Ballroom, Hilton Hotel. Include palm trees, beach vibes, and vibrant colors. Add a 'Buy tickets' button."
                      className="min-h-[100px]"
                      {...field}
                    />
                    <Button
                      type="button"
                      className="bg-orange-600 hover:bg-orange-700"
                      onClick={handleGenerateFlyer}
                      disabled={isGeneratingFlyer || !field.value}
                    >
                      {isGeneratingFlyer ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating Flyer...
                        </>
                      ) : (
                        <>
                          <Wand2 className="mr-2 h-4 w-4" /> Generate Flyer
                        </>
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* <div className="mt-6">
            <p className="text-sm font-medium mb-3">
              Choose your preferred call-to-action button to be displayed on
              your flyer within the mobile application.
            </p>
            <FormField
              control={form.control}
              name="flyer_cta"
              render={({ field }) => (
                <FormControl>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className={`flex-1 border-2 ${
                        field.value === "place_order"
                          ? "bg-orange-100 border-orange-600"
                          : "hover:bg-accent/20"
                      }`}
                      onClick={() => field.onChange("place_order")}
                    >
                      Place order
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className={`flex-1 border-2 ${
                        field.value === "make_reservation"
                          ? "bg-orange-100 border-orange-600"
                          : "hover:bg-accent/20"
                      }`}
                      onClick={() => field.onChange("make_reservation")}
                    >
                      Make reservation
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className={`flex-1 border-2 ${
                        field.value === "buy_tickets"
                          ? "bg-orange-100 border-orange-600"
                          : "hover:bg-accent/20"
                      }`}
                      onClick={() => field.onChange("buy_tickets")}
                    >
                      Buy tickets
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className={`flex-1 border-2 ${
                        field.value === "plain_informative"
                          ? "bg-orange-100 border-orange-600"
                          : "hover:bg-accent/20"
                      }`}
                      onClick={() => field.onChange("plain_informative")}
                    >
                      Plain (Informative)
                    </Button>
                  </div>
                </FormControl>
              )}
            />
          </div> */}

          {/* Show shimmer while generating */}
          {isGeneratingFlyer && (
            <div className="mt-4">
              <FormLabel>Generating Flyer</FormLabel>
              <ImageGenerationShimmer />
            </div>
          )}

          {/* Display generated flyer preview */}
          {imagePreview && form.watch("flyer_url") && !isGeneratingFlyer && (
            <div className="mt-4">
              <FormLabel>Generated Flyer Preview</FormLabel>
              <div className="relative w-full max-w-[400px] sm:max-w-[300px] aspect-video rounded-lg overflow-hidden mx-0 sm:mx-auto">
                <Image
                  src={imagePreview}
                  alt="Generated flyer preview"
                  className="w-full h-full object-cover"
                  fill
                />
                {/* View image button - now triggers full preview mode */}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-white/90 hover:bg-white text-gray-800 shadow-md"
                  onClick={() => setShowFullPreview(true)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View image
                </Button>
              </div>
              <FormDescription className="mt-2 text-center">
                Your AI-generated flyer has been created and will be used for
                this event
              </FormDescription>
            </div>
          )}

          {/* Hidden field to store the flyer URL */}
          <FormField
            control={form.control}
            name="flyer_url"
            render={({ field }) => <input type="hidden" {...field} />}
          />
        </>
      )}

      {/* Show existing image when "keep" is selected */}
      {form.watch("image_preference") === "keep" && event.flyer_url && (
        <div className="mt-4">
          <FormLabel>Current Event Image</FormLabel>
          <div className="relative w-full max-w-[400px] sm:max-w-[300px] aspect-video rounded-lg overflow-hidden mx-0 sm:mx-auto">
            <Image
              src={event.flyer_url}
              alt="Current event image"
              className="w-full h-full object-cover"
              fill
            />
            <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
              Keeping Existing Image
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-white/90 hover:bg-white text-gray-800 shadow-md"
              onClick={() => setShowFullPreview(true)}
            >
              <Eye className="mr-2 h-4 w-4" />
              View image
            </Button>
          </div>
          <FormDescription className="mt-2 text-center">
            You will keep the current image for this event
          </FormDescription>
        </div>
      )}

      {/* Show existing image when no preference is selected (fallback) */}
      {!form.watch("image_preference") && event.flyer_url && (
        <div className="mt-4">
          <FormLabel>Current Event Image</FormLabel>
          <div className="relative w-full max-w-[400px] sm:max-w-[300px] aspect-video rounded-lg overflow-hidden mx-0 sm:mx-auto">
            <Image
              src={event.flyer_url}
              alt="Current event image"
              className="w-full h-full object-cover"
              fill
            />
            <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
              Current Image
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-white/90 hover:bg-white text-gray-800 shadow-md"
              onClick={() => setShowFullPreview(true)}
            >
              <Eye className="mr-2 h-4 w-4" />
              View image
            </Button>
          </div>
          <FormDescription className="mt-2 text-center">
            Select an option above to update or keep this image
          </FormDescription>
        </div>
      )}
    </div>
  );
};
