"use client";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
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
import { Textarea } from "@/components/ui/textarea";
import FullScreenFlyerPreview from "@/components/events/FullScreenFlyerPreview";
import { ImageGenerationShimmer } from "@/components/events/create-event-modal/components/ImageGenerationShimmer";
import { useAuth } from "@/hooks/use-auth";
import { EventApi } from "@/services/api/business-events-api";
import { AIError } from "@/types/api";
import { Calendar, Clock, Eye, Loader2, Upload, Wand2, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { EventFormValues } from "../../types";
import { calculateDuration, isValidDateTimeRange } from "../../utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimePickerAmPm } from "@/components/ui/time-picker-ampm";

interface DateTimeStepProps {
  form: UseFormReturn<EventFormValues>;
}

export const DateTimeStep = ({ form }: DateTimeStepProps) => {
  const { user: business } = useAuth();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [flyerError, setFlyerError] = useState<string | null>(null);

  const generateFlyerMutation = EventApi.useGenerateFlyer();

  // Watch for changes in the image field and flyer_url to maintain preview state
  const currentImage = form.watch("image");
  const currentFlyerUrl = form.watch("flyer_url");
  const imagePreference = form.watch("image_preference");

  // Initialize image preview on component mount and when form values change
  useEffect(() => {
    if (imagePreference === "upload" && currentImage instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(currentImage);
    } else if (imagePreference === "generate" && currentFlyerUrl) {
      setImagePreview(currentFlyerUrl);
    } else if (!currentImage && !currentFlyerUrl && imagePreference !== "keep") {
      setImagePreview(null);
    }
  }, [currentImage, currentFlyerUrl, imagePreference]);

  // Function to handle AI flyer generation
  const handleGenerateFlyer = async () => {
    setFlyerError(null);
    const currentFlyer = form.getValues("flyer_url");
    if (currentFlyer) {
      toast.info("A flyer has already been generated for this event. Delete it first if you want to generate a new one.");
      return;
    }
    const eventTitle = form.getValues("event_title");
    const location = form.getValues("location");
    const eventDescription = form.getValues("event_description");
    const startDate = form.getValues("start_date");
    const startTime = form.getValues("start_time");
    const endTime = form.getValues("end_time");
    const adultTicketPrice = form.getValues("adult_ticket_price");
    const childTicketPrice = form.getValues("child_ticket_price");
    const attractions = form.getValues("event_attractions");
    const caption = form.getValues("event_caption");
    const catchyPhrase = form.getValues("catchy_phrase");
    const offerText = form.getValues("event_offer_text");
    const duration = form.getValues("duration");
    const gatePassType = form.getValues("event_gate_pass");
    const pricePerIndividual = form.getValues("price_per_individual");
    const logo = form.getValues("flyer_logo");
    const background = form.getValues("flyer_background");
    const themeStyle = form.getValues("flyer_theme_style");
    const imagePrompt = form.getValues("image_prompt"); // Get custom image prompt

    if (!eventTitle || eventTitle.trim().length === 0) {
      toast.error("Please enter an event title before generating a flyer");
      return;
    }

    if (!location || location.trim().length === 0) {
      toast.error("Please enter a location before generating a flyer");
      return;
    }

    if (!eventDescription || eventDescription.trim().length === 0) {
      toast.error("Please enter an event description before generating a flyer");
      return;
    }

    // Build ticketTiers array from adult and child prices (buffet) or price per individual (fine dining)
    const ticketTiers = [];
    if (adultTicketPrice) {
      ticketTiers.push({ name: "Adult", price: adultTicketPrice });
    }
    if (childTicketPrice) {
      ticketTiers.push({ name: "Child", price: childTicketPrice });
    }
    // For fine dining, add price per individual as a ticket tier if no adult/child prices exist
    if (ticketTiers.length === 0 && pricePerIndividual) {
      ticketTiers.push({ name: "Per Individual", price: pricePerIndividual });
    }

    const generatePromise = generateFlyerMutation.mutateAsync({
      prompt: `${eventTitle} - ${eventDescription}`, // Auto-generated prompt from event details
      imagePrompt, // Custom image prompt - takes precedence over background and auto-generated prompts
      eventName: eventTitle,
      eventCaption: eventTitle,
      date: startDate || new Date().toISOString().split('T')[0],
      businessName: business?.business_name || "Event",
      mainCatch: eventTitle,
      aboutMainCatch: eventDescription,
      address: location,
      description: eventDescription,
      startTime: startTime || "00:00",
      endTime: endTime || "23:59",
      gatePass: "standard",
      ticketTiers: ticketTiers.length > 0 ? ticketTiers : undefined,
      attractions,
      caption,
      catchyPhrase,
      offerText,
      duration,
      gatePassType,
      logo,
      background,
      themeStyle,
    });

    toast.promise(generatePromise, {
      loading: "Generating your flyer with MyPal AI...",
      success: (result) => {
        if (result.data?.image_url) {
          form.setValue("flyer_url", result.data.image_url);
          form.setValue("image_preference", "generate");
          setImagePreview(result.data.image_url);
          setFlyerError(null);
          return "Flyer generated successfully!";
        } else {
          throw new Error("Failed to generate flyer. Please try again.");
        }
      },
      error: (error) => {
        const errObj: AIError =
          typeof error === "object" && error !== null ? (error as AIError) : {};
        const message =
          errObj.response?.data?.message ||
          errObj.message ||
          "Failed to generate flyer. Please try again.";
        setFlyerError(message);
        return message;
      },
    });
  };

  // Watch the date and time fields to auto-calculate duration
  const watchStartDate = form.watch("start_date");
  const watchStartTime = form.watch("start_time");
  const watchEndDate = form.watch("end_date");
  const watchEndTime = form.watch("end_time");

  // Auto-calculate duration whenever date/time fields change
  useEffect(() => {
    if (watchStartDate && watchStartTime && watchEndDate && watchEndTime) {
      const calculatedDuration = calculateDuration(
        watchStartDate,
        watchStartTime,
        watchEndDate,
        watchEndTime
      );

      const currentDuration = form.getValues("duration");
      if (calculatedDuration && calculatedDuration !== currentDuration) {
        form.setValue("duration", calculatedDuration, {
          shouldValidate: false,
        });
      }
    }
  }, [watchStartDate, watchStartTime, watchEndDate, watchEndTime, form]);

  // Get current duration for display
  const duration = form.watch("duration");
  const isValidRange =
    watchStartDate && watchStartTime && watchEndDate && watchEndTime
      ? isValidDateTimeRange(watchStartDate, watchStartTime, watchEndDate, watchEndTime)
      : true;

  // If in full preview mode, show only the preview
  if (showFullPreview && imagePreview && form.watch("flyer_url")) {
    return (
      <FullScreenFlyerPreview
        open={showFullPreview}
        onClose={() => setShowFullPreview(false)}
        flyerUrl={imagePreview}
        altText="Generated flyer preview"
        showRequestApproval={false}
        isModal={true}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-1 gap-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date *</FormLabel>
                <FormControl>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                    <Input type="date" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date *</FormLabel>
                <FormControl>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                    <Input type="date" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <div className="w-full space-y-4">
        <FormField
          control={form.control}
          name="event_frequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Frequency (Optional)</FormLabel>
              <Select value={field.value || ""} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="h-11 focus:ring-orange-500/50">
                    <SelectValue placeholder="Select main catch" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent position="popper" sideOffset={4}>
                    <SelectItem value="every sunday">Every Sunday</SelectItem>
                    <SelectItem value="every monday">Every Monday</SelectItem>
                    <SelectItem value="every tuesday">Every Tuesday</SelectItem>
                    <SelectItem value="every wednesday">Every Wednesday</SelectItem>
                    <SelectItem value="every thursday">Every Thursday</SelectItem>
                    <SelectItem value="every friday">Every Friday</SelectItem>
                    <SelectItem value="every saturday">Every Saturday</SelectItem>
                    <SelectItem value="every weekends">Every Weekends</SelectItem>
                  </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-1 gap-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="start_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time * (e.g., 09:00 AM)</FormLabel>
                <FormControl>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                    <TimePickerAmPm
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Select start time"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="end_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time * (e.g., 06:00 PM)</FormLabel>
                <FormControl>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                    <TimePickerAmPm
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Select end time"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Auto-calculated Duration Display */}
      <div className="space-y-2">
        <FormLabel className="text-sm font-medium text-gray-700">
          Duration (Auto-calculated)
        </FormLabel>
        <div className="flex items-center p-3 bg-gray-50 border border-gray-200 rounded-md">
          <Clock className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
          <span className="text-sm text-gray-700">
            {duration || "Select start and end date/time to calculate duration"}
          </span>
        </div>
        {!isValidRange && watchStartDate && watchStartTime && watchEndDate && watchEndTime && (
          <p className="text-sm text-red-600">
            End date/time must be after start date/time
          </p>
        )}
      </div>

      {/* Gate Pass & Access Control Section */}
      {business?.category?.name && (
        business.category.name.toLowerCase().includes("fine") ||
        business.category.name.toLowerCase().includes("restaurant") ||
        business.category.name.toLowerCase().includes("buffet")
      ) && (
        <>
          {/* Buffet Gate Pass & Access Control */}
          {business.category.name.toLowerCase().includes("buffet") && (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-4 pl-0.5">
                Gate Pass & Access Control
              </h3>

              {/* Free Entry / Paid Entry Radio Selection */}
              <FormField
                control={form.control}
                name="gate_pass_type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-sm font-medium">Entry Type</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="free-entry"
                            value="free"
                            checked={field.value === "free"}
                            onChange={(e) => field.onChange(e.target.value)}
                            className="h-4 w-4 cursor-pointer"
                          />
                          <label htmlFor="free-entry" className="text-sm cursor-pointer font-medium">
                            Free Entry
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="paid-entry"
                            value="paid"
                            checked={field.value === "paid"}
                            onChange={(e) => field.onChange(e.target.value)}
                            className="h-4 w-4 cursor-pointer"
                          />
                          <label htmlFor="paid-entry" className="text-sm cursor-pointer font-medium">
                            Paid Entry
                          </label>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Adult Ticket Price */}
              <FormField
                control={form.control}
                name="has_adult_ticket"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="adult-ticket"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 cursor-pointer"
                      />
                      <label htmlFor="adult-ticket" className="text-sm cursor-pointer font-medium">
                        Adult Ticket Price
                      </label>
                    </div>
                    {field.value && (
                      <FormField
                        control={form.control}
                        name="adult_ticket_price"
                        render={({ field: priceField }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Enter adult ticket price"
                                {...priceField}
                                onChange={(e) => {
                                  const value = e.target.value ? parseInt(e.target.value) : undefined;
                                  priceField.onChange(value);
                                }}
                                value={priceField.value || ""}
                                className="h-11 focus-visible:ring-orange-500"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </FormItem>
                )}
              />

              {/* Child Ticket Price */}
              <FormField
                control={form.control}
                name="has_child_ticket"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="child-ticket"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 cursor-pointer"
                      />
                      <label htmlFor="child-ticket" className="text-sm cursor-pointer font-medium">
                        Child Ticket Price
                      </label>
                    </div>
                    {field.value && (
                      <FormField
                        control={form.control}
                        name="child_ticket_price"
                        render={({ field: priceField }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Enter child ticket price"
                                {...priceField}
                                onChange={(e) => {
                                  const value = e.target.value ? parseInt(e.target.value) : undefined;
                                  priceField.onChange(value);
                                }}
                                value={priceField.value || ""}
                                className="h-11 focus-visible:ring-orange-500"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Fine Dining / Restaurant Gate Pass & Access Control */}
          {(business.category.name.toLowerCase().includes("fine") ||
            (business.category.name.toLowerCase().includes("restaurant") && !business.category.name.toLowerCase().includes("buffet"))) && (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-4 pl-0.5">
                Gate Pass & Access Control
              </h3>
              <FormField
                control={form.control}
                name="price_per_individual"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-medium">
                      Price Per Individual
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g N40,000 - N50,000"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value ? parseInt(e.target.value) : undefined;
                          field.onChange(value);
                        }}
                        value={field.value || ""}
                        className="h-11 focus-visible:ring-orange-500"
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-gray-500">
                      Enter the price per individual for this event
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </>
      )}

      {/* Event Flyer / Image Section */}
      <section>
        <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-4 pl-0.5">
          Event Flyer / Image
        </h3>
        <FormField
          control={form.control}
          name="image_preference"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className="text-sm font-medium">
                Select Image Source
              </FormLabel>
              <FormDescription className="text-xs">
                Choose to upload an existing image or generate one using AI
              </FormDescription>
              <FormControl>
                <div className="grid gap-3 sm:grid-cols-1 grid-cols-2">
                  <Button
                    type="button"
                    variant={field.value === "upload" ? "default" : "outline"}
                    className={`h-12 justify-center text-sm font-medium transition-all ${
                      field.value === "upload"
                        ? "bg-orange-600 hover:bg-orange-700"
                        : "border-dashed"
                    }`}
                    onClick={() => field.onChange("upload")}
                  >
                    <Upload className="h-4 w-4 mr-2" /> Upload Event Flyer / Image
                  </Button>
                  <Button
                    type="button"
                    variant={field.value === "generate" ? "default" : "outline"}
                    className={`h-12 justify-center text-sm font-medium transition-all ${
                      field.value === "generate"
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "border-dashed"
                    }`}
                    onClick={() => field.onChange("generate")}
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate flyer using MyPal AI
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Show Alert if there is an error */}
        {flyerError && (
          <Alert variant="destructive" className="my-4">
            <Eye className="h-5 w-5 text-red-600 mt-1 mr-2" />
            <div className="flex-1">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{flyerError}</AlertDescription>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="ml-2 mt-1 text-gray-500 hover:text-gray-700"
              onClick={() => setFlyerError(null)}
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </Button>
          </Alert>
        )}

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
                      <div className="relative w-full max-w-[480px] aspect-video rounded-lg overflow-hidden border bg-black/5 mx-auto">
                        <Image
                          src={imagePreview}
                          alt="Event preview"
                          className="w-full h-full object-cover"
                          fill
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
            {/* Custom Image Prompt - Takes Precedence Over Background Image */}
            <FormField
              control={form.control}
              name="image_prompt"
              render={({ field }) => (
                <FormItem className="space-y-2 mt-4">
                  <FormLabel className="text-sm font-medium flex items-center gap-2 text-orange-600">
                    Custom Image Prompt
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      Optional
                    </span>
                  </FormLabel>
                  <FormDescription className="text-xs">
                    Provide a custom AI prompt for image generation. This will override the flyer prompt and background image if provided.
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., A vibrant beach scene with tropical elements, sunset colors, elegant typography"
                      className="min-h-[100px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Flyer Customization Section */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase text-orange-600">
                Flyer Customization (Optional)
              </h4>
              <FormDescription className="text-xs">
                Add your logo, background image, and theme style to personalize your flyer
              </FormDescription>

              {/* Logo Upload */}
              <FormField
                control={form.control}
                name="flyer_logo"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-medium">
                      Business Logo
                    </FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              onChange(file);
                            }
                          }}
                          {...field}
                        />
                        {value && (
                          <div className="text-xs text-green-600 flex items-center">
                            <span className="mr-1">✓</span> Logo selected
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs">
                      Upload a PNG or JPG logo to overlay on your flyer
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Background Image Upload */}
              <FormField
                control={form.control}
                name="flyer_background"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-medium">
                      Background Image
                    </FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              onChange(file);
                            }
                          }}
                          {...field}
                        />
                        {value && (
                          <div className="text-xs text-green-600 flex items-center">
                            <span className="mr-1">✓</span> Background selected
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs">
                      Upload a background image as the base layer for your flyer
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Theme Style Selection */}
              <FormField
                control={form.control}
                name="flyer_theme_style"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-medium">
                      Theme Style
                    </FormLabel>
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-11 focus:ring-orange-500/50">
                          <SelectValue placeholder="Select a theme style" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent position="popper" sideOffset={4}>
                        <SelectItem value="modern">Modern</SelectItem>
                        <SelectItem value="vintage">Vintage</SelectItem>
                        <SelectItem value="minimalist">Minimalist</SelectItem>
                        <SelectItem value="vibrant">Vibrant</SelectItem>
                        <SelectItem value="elegant">Elegant</SelectItem>
                        <SelectItem value="playful">Playful</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">
                      Choose a thematic style for AI to use when generating the background
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="button"
              className="bg-blue-600 hover:bg-blue-700 w-full"
              onClick={handleGenerateFlyer}
              disabled={
                generateFlyerMutation.isPending ||
                !!currentFlyerUrl
              }
            >
              {generateFlyerMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : currentFlyerUrl ? (
                <>
                  <Wand2 className="mr-2 h-4 w-4 opacity-60" />
                  Generated
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" /> Generate Flyer
                </>
              )}
            </Button>

            {generateFlyerMutation.isPending && (
              <div className="mt-6 space-y-2">
                <FormLabel className="text-sm font-medium">
                  Generating Flyer
                </FormLabel>
                <ImageGenerationShimmer />
              </div>
            )}

            {/* Generated Flyer Preview */}
            {imagePreview &&
              form.watch("flyer_url") &&
              !generateFlyerMutation.isPending && (
                <div className="mt-6 space-y-2 flex flex-col items-start">
                  <FormLabel className="text-sm font-medium">
                    Generated Flyer Preview
                  </FormLabel>
                  <div 
                    className="relative w-full max-w-[480px] aspect-video rounded-xl overflow-hidden border bg-black/5 smx-auto shadow-sm cursor-pointer hover:shadow-md hover:border-orange-500 transition-all duration-200 group"
                    onClick={() => setShowFullPreview(true)}
                  >
                    <Image
                      src={imagePreview}
                      alt="Generated flyer preview"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      fill
                    />
                    {/* centralize the preview button */}
                    <Button
                      type="button"
                      variant="secondary"
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white  bg-[#68798A] hover:bg-gray-500 rounded-[7.27px] py-6 px-3 text-[14.53px] font-semibold leading-[145%] flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowFullPreview(true);
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" /> View in fullscreen
                    </Button>
                  </div>
                  <FormDescription className="text-center text-xs">
                    Click on the flyer to view, download, and share
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
    </div>
  );
};
