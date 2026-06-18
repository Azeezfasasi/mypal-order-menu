"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { EventType } from "@/types/enums";
import { EVENT_MAIN_CATCH_OPTIONS } from "@/types/event-main-catch";
import { Plus } from "lucide-react";
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { EventFormValues } from "../../types";

interface BasicInformationStepProps {
  form: UseFormReturn<EventFormValues>;
}

export const BasicInformationStep = ({ form }: BasicInformationStepProps) => {
  const [eventTypeOpen, setEventTypeOpen] = useState(false);
  const [attractionDialogOpen, setAttractionDialogOpen] = useState(false);
  const [attractionInput, setAttractionInput] = useState("");

  const handleAddAttraction = (onFieldChange: (value: string[]) => void) => {
    if (attractionInput && attractionInput.trim()) {
      const currentAttractions = form.getValues("event_attractions") || [];
      onFieldChange([...currentAttractions, attractionInput.trim()]);
      setAttractionInput("");
      setAttractionDialogOpen(false);
    }
  };

  // Regular form view
  return (
    <div className="space-y-10 max-w-4xl mx-auto">
      {/* Basic Details */}
      <section>
        <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-4 pl-0.5">
          Basic Details
        </h3>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-1 grid-cols-2">
            {/* Event Title */}
            <FormField
              control={form.control}
              name="event_title"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium">
                    Event Title <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="h-11 focus-visible:ring-orange-500"
                      placeholder="Enter event title"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Business Name */}
            <FormField
              control={form.control}
              name="business_name"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium">
                    Business Name <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="h-11 focus-visible:ring-orange-500"
                      placeholder="Enter business name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-1 grid-cols-2">
            {/* Event Type */}
            <FormField
              control={form.control}
              name="event_type"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium">
                    Event Type <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      setEventTypeOpen(false);
                    }}
                    open={eventTypeOpen}
                    onOpenChange={setEventTypeOpen}
                  >
                    <FormControl>
                      <SelectTrigger className="capitalize h-11 focus:ring-orange-500/50">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent
                      position="popper"
                      sideOffset={4}
                      onCloseAutoFocus={(e) => e.preventDefault()}
                      className="max-h-64"
                    >
                      {Object.values(EventType).map((type) => (
                        <SelectItem
                          key={type}
                          value={type}
                          className="capitalize"
                          textValue={type}
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

            {/* Main Catch */}
            <FormField
              control={form.control}
              name="main_catch"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium">
                    Main Catch
                  </FormLabel>
                  <FormDescription className="text-xs">
                    Event highlight category
                  </FormDescription>
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="h-11 focus:ring-orange-500/50">
                        <SelectValue placeholder="Select main catch" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent position="popper" sideOffset={4}>
                      {EVENT_MAIN_CATCH_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            {/* About Main Catch */}
            <FormField
              control={form.control}
              name="about_main_catch"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium">
                    About Main Catch
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="h-11 focus-visible:ring-orange-500"
                      placeholder="e.g E.g Unlimited cocktails..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Event Caption */}
            <FormField
              control={form.control}
              name="event_caption"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium">
                    Event Caption
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="h-11 focus-visible:ring-orange-500"
                      placeholder="Enter event caption"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Event Description */}
            <FormField
              control={form.control}
              name="event_description"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium">
                    Event description
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the event..."
                      className="min-h-[100px] resize-y"
                      maxLength={300}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-gray-500">
                    Not more than 60 words
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Catchy Phrase */}
            <FormField
              control={form.control}
              name="catchy_phrase"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium">
                    Catchy Phrase
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="h-11 focus-visible:ring-orange-500"
                      placeholder="Enter a short catchy phrase"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* About (Event Summary - Required) */}
            <FormField
              control={form.control}
              name="about"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium">
                    Event Summary <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide a brief summary of the event (minimum 10 characters)"
                      className="min-h-[80px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-gray-500">
                    This will be used as the main event description
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </section>

      {/* Location and Event Attractions */}
      <section>
        <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-4 pl-0.5">
          Location & Attractions
        </h3>
        <div className="space-y-4">
          {/* Location */}
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-medium">
                  Location (Address) <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    className="h-11 focus-visible:ring-orange-500"
                    placeholder="Enter event location..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Event Attractions */}
          <FormField
            control={form.control}
            name="event_attractions"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-medium">
                  Event attractions
                </FormLabel>
                <FormControl>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {field.value && Array.isArray(field.value) && field.value.length > 0 ? (
                        field.value.map((attraction, index) => (
                          <div
                            key={index}
                            className="bg-gray-100 px-3 py-1.5 rounded-full text-sm flex items-center gap-2"
                          >
                            <span>{attraction}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const currentValue = field.value || [];
                                const newAttractions = currentValue.filter(
                                  (_, i) => i !== index
                                );
                                field.onChange(newAttractions);
                              }}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              ✕
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-400">
                          No attractions added yet
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => setAttractionDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />

                {/* Attraction Dialog Modal */}
                <Dialog open={attractionDialogOpen} onOpenChange={setAttractionDialogOpen}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add Attraction</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Enter attraction name:</label>
                        <Input
                          placeholder="Enter attraction name"
                          value={attractionInput}
                          onChange={(e) => setAttractionInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleAddAttraction(field.onChange);
                            }
                          }}
                          autoFocus
                          className="focus-visible:ring-orange-500"
                        />
                      </div>
                    </div>
                    <DialogFooter className="gap-3 sm:gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setAttractionInput("");
                          setAttractionDialogOpen(false);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          handleAddAttraction(field.onChange);
                        }}
                        className="bg-orange-700 hover:bg-orange-800"
                      >
                        OK
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </FormItem>
            )}
          />
        </div>
      </section>

      {/* Additional Settings */}
      <section>
        <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-4 pl-0.5">
          Additional Settings
        </h3>
        <div className="grid gap-4 md:grid-cols-1 grid-cols-2">
          <FormField
            control={form.control}
            name="refine_description"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border border-orange-300 bg-white/40 dark:bg-white/5 backdrop-blur-sm p-4 gap-4 shadow-sm hover:shadow transition-shadow">
                <div className="space-y-1.5">
                  <FormLabel className="text-sm font-semibold">
                    AI Description Refinement
                  </FormLabel>
                  <FormDescription className="text-xs leading-relaxed">
                    Use AI to generate a description
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_eighten_plus"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border border-blue-300 bg-white/40 dark:bg-white/5 backdrop-blur-sm p-4 gap-4 shadow-sm hover:shadow transition-shadow">
                <div className="space-y-1.5">
                  <FormLabel className="text-sm font-semibold">
                    Adult Content (18+)
                  </FormLabel>
                  <FormDescription className="text-xs leading-relaxed">
                    Enable if this event is for adults only
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="drink_responsibly"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-start rounded-lg bg-white/40 dark:bg-white/5 backdrop-blur-sm p-4 gap-4">
                <div className="space-y-0 mt-1">
                  <FormLabel className="text-sm font-semibold">
                    Drink Responsibly
                  </FormLabel>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </section>
    </div>
  );
};

