"use client";

import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { getRandomDummyEvent } from "@/data/event-dummy-data";
import { useAuth } from "@/hooks/use-auth";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { __DEV__ } from "@/lib/utils";
import { EventApi } from "@/services/api/business-events-api";
import {
  BusinessCategoryType,
  ContextType,
  EventClass,
  EventType,
} from "@/types/enums";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Clock, Minus, Plus, Upload, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { ErrorSummary } from ".";
import { Badge } from "../ui/badge";

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventType: EventType | null;
  eventClass: EventClass | null;
}

interface StepErrors {
  [stepName: string]: {
    [fieldName: string]: string;
  };
}

const createEventFormSchema = (
  eventType: EventType,
  eventClass: EventClass,
  currentStep: Step,
  isSubmitting: boolean = false,
) => {
  // Base schema with all fields but minimal validation
  const baseSchema = z.object({
    // Step 1: Basic Information
    event_title: z.string().min(3, "Title must be at least 3 characters"),
    location: z.string().min(3, "Location must be at least 3 characters"),
    event_type: z.nativeEnum(EventType),
    event_class: z.nativeEnum(EventClass),
    about: z.string().min(10, "Description must be at least 10 characters"),
    is_eighten_plus: z.boolean(),
    image: z.instanceof(File),
    refine_description: z.boolean().default(false),

    // Step 2: Date and Time
    start_date: z.string(),
    end_date: z.string(),
    start_time: z
      .string()
      .regex(
        /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/,
        "Time must be in hh:mm AM/PM format",
      ),
    end_time: z
      .string()
      .regex(
        /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/,
        "Time must be in hh:mm AM/PM format",
      ),
    duration: z.string(),

    // Step 3: Tickets (basic validation, conditional validation applied later)
    tickets: z
      .array(
        z.object({
          ticket_name: z.string().min(1, "Ticket name is required"),
          price: z.number().min(0, "Price must be 0 or greater"),
          benefits: z
            .array(
              z.object({
                description: z
                  .string()
                  .min(1, "Benefit description is required"),
              }),
            )
            .default([]),
        }),
      )
      .default([]),

    // Step 4: Additional Details (basic validation, conditional validation applied later)
    benefits: z
      .array(
        z.object({
          description: z.string().min(1, "Benefit description is required"),
        }),
      )
      .default([]),
    agendas: z
      .array(
        z.object({
          title: z.string().min(1, "Agenda title is required"),
          event_id: z.string().optional(),
          agendaType: z.nativeEnum(ContextType),
        }),
      )
      .default([]),
  });

  // Apply step-specific and conditional validation
  // Only apply ticket validation when on tickets step or final submission
  if (currentStep === "tickets" && eventType === EventType.TICKET) {
    return baseSchema.refine((data) => data.tickets.length > 0, {
      message: "At least one ticket is required for ticket events",
      path: ["tickets"],
    });
  }

  // Only apply exclusive event validation when on additional step or final submission
  if (currentStep === "additional" && eventClass === EventClass.EXCLUSIVE) {
    return baseSchema
      .refine((data) => data.benefits.length > 0, {
        message: "At least one benefit is required for exclusive events",
        path: ["benefits"],
      })
      .refine((data) => data.agendas.length > 0, {
        message: "At least one agenda item is required for exclusive events",
        path: ["agendas"],
      });
  }

  // For final submission (isSubmitting), apply all necessary validations
  if (isSubmitting) {
    if (eventType === EventType.TICKET && eventClass === EventClass.EXCLUSIVE) {
      // Both ticket and exclusive validations
      return baseSchema
        .refine((data) => data.tickets.length > 0, {
          message: "At least one ticket is required for ticket events",
          path: ["tickets"],
        })
        .refine((data) => data.benefits.length > 0, {
          message: "At least one benefit is required for exclusive events",
          path: ["benefits"],
        })
        .refine((data) => data.agendas.length > 0, {
          message: "At least one agenda item is required for exclusive events",
          path: ["agendas"],
        });
    } else if (eventType === EventType.TICKET) {
      // Only ticket validation
      return baseSchema.refine((data) => data.tickets.length > 0, {
        message: "At least one ticket is required for ticket events",
        path: ["tickets"],
      });
    } else if (eventClass === EventClass.EXCLUSIVE) {
      // Only exclusive validation
      return baseSchema
        .refine((data) => data.benefits.length > 0, {
          message: "At least one benefit is required for exclusive events",
          path: ["benefits"],
        })
        .refine((data) => data.agendas.length > 0, {
          message: "At least one agenda item is required for exclusive events",
          path: ["agendas"],
        });
    }
  }

  return baseSchema;
};

type Step = "basic" | "datetime" | "tickets" | "additional";
type EventFormValues = z.infer<ReturnType<typeof createEventFormSchema>>;

// Custom hook for step error tracking
const useStepErrors = (
  form: ReturnType<typeof useForm<EventFormValues>>,
  availableSteps: Step[],
) => {
  const [stepErrors, setStepErrors] = useState<StepErrors>({});

  const validateAllSteps = useCallback(
    async (data: EventFormValues) => {
      const errors: StepErrors = {};

      // Map fields to their respective steps
      const stepFieldMap: { [key in Step]: string[] } = {
        basic: [
          "event_title",
          "location",
          "event_type",
          "event_class",
          "about",
          "is_eighten_plus",
          "image",
        ],
        datetime: [
          "start_date",
          "end_date",
          "start_time",
          "end_time",
          "duration",
        ],
        tickets: ["tickets"],
        additional: ["benefits", "agendas"],
      };

      // Create comprehensive validation schema
      const fullValidationSchema = createEventFormSchema(
        data.event_type,
        data.event_class,
        "additional", // Use the most comprehensive step
        true, // Final submission validation
      );

      try {
        await fullValidationSchema.parseAsync(data);
        setStepErrors({});
        return {};
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          validationError.errors.forEach((error) => {
            const fieldPath = error.path.join(".");

            // Determine which step this error belongs to
            let errorStep: Step | null = null;

            for (const [step, fields] of Object.entries(stepFieldMap)) {
              if (fields.some((field) => fieldPath.startsWith(field))) {
                errorStep = step as Step;
                break;
              }
            }

            if (errorStep && availableSteps.includes(errorStep)) {
              if (!errors[errorStep]) {
                errors[errorStep] = {};
              }
              errors[errorStep][fieldPath] = error.message;
            }
          });
        }

        setStepErrors(errors);
        return errors;
      }
    },
    [availableSteps],
  );

  const clearStepErrors = useCallback(() => {
    setStepErrors({});
  }, []);

  const getStepErrorCount = useCallback(
    (step: Step) => {
      return stepErrors[step] ? Object.keys(stepErrors[step]).length : 0;
    },
    [stepErrors],
  );

  const setFormErrorsFromStepErrors = useCallback(() => {
    // Set form errors to highlight fields with validation issues
    Object.entries(stepErrors).forEach(([, stepErrorsObj]) => {
      Object.entries(stepErrorsObj).forEach(([fieldPath, errorMessage]) => {
        // Type assertion is necessary here because react-hook-form's FieldPath type is complex
        form.setError(fieldPath as keyof EventFormValues, {
          type: "validation",
          message: errorMessage,
        });
      });
    });
  }, [stepErrors, form]);

  return {
    stepErrors,
    validateAllSteps,
    clearStepErrors,
    getStepErrorCount,
    setFormErrorsFromStepErrors,
  };
};

export default function CreateEventModal({
  isOpen,
  onClose,
  eventType,
  eventClass,
}: CreateEventModalProps) {
  const { user: business } = useAuth();
  const createEventMutation = EventApi.useCreateEvent();
  const { createEventFormData } = EventApi.useCreateEventFormData();
  const [currentStep, setCurrentStep] = useState<Step>("basic");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [eventTypeOpen, setEventTypeOpen] = useState(false);
  const [eventClassOpen, setEventClassOpen] = useState(false);
  const [agendaTypeOpen, setAgendaTypeOpen] = useState<{
    [key: number]: boolean;
  }>({});

  // Check if business can create exclusive events
  const canCreateExclusiveEvents =
    business?.category?.business_type === BusinessCategoryType.BEACHESRESORTS ||
    business?.category?.business_type === BusinessCategoryType.PARKSRECREATION;

  // Use focus trap
  const focusRef = useFocusTrap(isOpen);

  const form = useForm<EventFormValues>({
    resolver: (values, context, options) => {
      const schema = createEventFormSchema(
        values.event_type as EventType,
        values.event_class as EventClass,
        currentStep,
        false, // Not submitting during regular validation
      );
      return zodResolver(schema)(values, context, options);
    },
    mode: "onSubmit", // Only validate on form submission (Next/Submit button)
    criteriaMode: "all", // Show all errors, not just first
    defaultValues: {
      event_title: "",
      location: "",
      event_type: eventType || EventType.INFORMATIVE,
      event_class: eventClass || EventClass.REGULAR,
      start_date: new Date().toISOString().split("T")[0],
      end_date: new Date().toISOString().split("T")[0],
      start_time: "09:00 AM",
      end_time: "06:00 PM",
      duration: "1 Day",
      about: "",
      is_eighten_plus: false,
      image: undefined,
      tickets: [],
      benefits: [],
      agendas: [],
    },
  });

  // Watch event type to conditionally show ticket step
  const watchEventType = form.watch("event_type");
  const watchEventClass = form.watch("event_class");

  // Sync form values with props when they change
  useEffect(() => {
    if (eventType && eventType !== form.getValues("event_type")) {
      form.setValue("event_type", eventType);
    }
    if (eventClass && eventClass !== form.getValues("event_class")) {
      form.setValue("event_class", eventClass);
    }
  }, [eventType, eventClass, form]);

  const getAvailableSteps = useCallback(() => {
    const steps: Step[] = ["basic", "datetime"];

    // Ticket step is based on event type only
    if (watchEventType === EventType.TICKET) {
      steps.push("tickets");
    }

    // Additional step is based on event class only
    if (watchEventClass === EventClass.EXCLUSIVE) {
      steps.push("additional");
    }

    console.log("Step configuration:", {
      steps,
      eventType: watchEventType,
      eventClass: watchEventClass,
      currentStep,
    });

    return steps;
  }, [watchEventType, watchEventClass, currentStep]);

  // Initialize step error tracking
  const availableSteps = getAvailableSteps();
  const {
    stepErrors,
    validateAllSteps,
    clearStepErrors,
    getStepErrorCount,
    setFormErrorsFromStepErrors,
  } = useStepErrors(form, availableSteps);

  const nextStep = () => {
    const steps = getAvailableSteps();
    const currentIndex = steps.indexOf(currentStep);
    console.log("Attempting to move to next step:", {
      currentStep,
      currentIndex,
      nextStep: steps[currentIndex + 1],
      allSteps: steps,
    });
    if (currentIndex < steps.length - 1) {
      const nextStep = steps[currentIndex + 1];
      console.log("Moving to step:", nextStep);
      setCurrentStep(nextStep);
    }
  };

  const previousStep = () => {
    const steps = getAvailableSteps();
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  // Use useCallback to prevent unnecessary re-renders and fix button freeze
  const addTicket = useCallback(() => {
    const currentTickets = form.getValues("tickets");
    const newTickets = [
      ...currentTickets,
      {
        ticket_name: "",
        price: 0,
        benefits: [],
      },
    ];
    form.setValue("tickets", newTickets);
  }, [form]);

  const removeTicket = useCallback(
    (index: number) => {
      const currentTickets = form.getValues("tickets");
      const newTickets = currentTickets.filter((_, i) => i !== index);
      form.setValue("tickets", newTickets);
    },
    [form],
  );

  const addTicketBenefit = useCallback(
    (ticketIndex: number) => {
      const currentTickets = form.getValues("tickets");
      const newTickets = [...currentTickets];
      if (!newTickets[ticketIndex].benefits) {
        newTickets[ticketIndex].benefits = [];
      }
      newTickets[ticketIndex].benefits.push({ description: "" });
      form.setValue("tickets", newTickets);
    },
    [form],
  );

  const removeTicketBenefit = useCallback(
    (ticketIndex: number, benefitIndex: number) => {
      const currentTickets = form.getValues("tickets");
      const newTickets = [...currentTickets];
      newTickets[ticketIndex].benefits.splice(benefitIndex, 1);
      form.setValue("tickets", newTickets);
    },
    [form],
  );

  const addBenefit = useCallback(() => {
    const currentBenefits = form.getValues("benefits");
    const newBenefits = [...currentBenefits, { description: "" }];
    form.setValue("benefits", newBenefits);
  }, [form]);

  const removeBenefit = useCallback(
    (index: number) => {
      const currentBenefits = form.getValues("benefits");
      const newBenefits = currentBenefits.filter(
        (_: unknown, i: number) => i !== index,
      );
      form.setValue("benefits", newBenefits);
    },
    [form],
  );

  const addAgenda = useCallback(() => {
    const currentAgendas = form.getValues("agendas");
    const newAgendas = [
      ...currentAgendas,
      { title: "", agendaType: ContextType.EVENT },
    ];
    form.setValue("agendas", newAgendas);
  }, [form]);

  const removeAgenda = useCallback(
    (index: number) => {
      const currentAgendas = form.getValues("agendas");
      const newAgendas = currentAgendas.filter(
        (_: unknown, i: number) => i !== index,
      );
      form.setValue("agendas", newAgendas);
    },
    [form],
  );

  const onSubmit = async (data: EventFormValues) => {
    try {
      const availableSteps = getAvailableSteps();
      const currentStepIndex = availableSteps.indexOf(currentStep);
      const isLastStep = currentStepIndex === availableSteps.length - 1;

      // Step-specific validation for navigation
      let canProceed = true;
      let validationMessage = "";

      switch (currentStep) {
        case "basic":
          canProceed = !!(
            data.event_title &&
            data.location &&
            data.about &&
            data.image
          );
          validationMessage = "Please fill in all required basic information";
          break;

        case "datetime":
          canProceed = !!(
            data.start_date &&
            data.end_date &&
            data.start_time &&
            data.end_time &&
            data.duration
          );
          validationMessage = "Please fill in all date and time fields";
          break;

        case "tickets":
          if (data.event_type === EventType.TICKET) {
            canProceed =
              data.tickets.length > 0 &&
              data.tickets.every(
                (ticket) => ticket.ticket_name && ticket.price >= 0,
              );
            validationMessage =
              "Please add at least one ticket with name and price";
          } else {
            canProceed = true; // No tickets required for non-ticket events
          }
          break;

        case "additional":
          if (data.event_class === EventClass.EXCLUSIVE) {
            const hasBenefits =
              data.benefits &&
              data.benefits.length > 0 &&
              data.benefits.every(
                (b) => b.description && b.description.trim().length > 0,
              );
            const hasAgendas =
              data.agendas &&
              data.agendas.length > 0 &&
              data.agendas.every((a) => a.title && a.title.trim().length > 0);
            canProceed = !!(hasBenefits && hasAgendas);
            validationMessage =
              "Please add at least one benefit and one agenda item";
          } else {
            canProceed = true; // No additional fields required for non-exclusive events
          }
          break;
      }

      console.log("Form validation:", {
        currentStep,
        isLastStep,
        canProceed,
        eventType: data.event_type,
        eventClass: data.event_class,
        availableSteps,
        formData: data,
        benefits: data.benefits,
        agendas: data.agendas,
      });

      if (!canProceed) {
        toast.error(validationMessage);
        return;
      }

      if (!isLastStep) {
        // Clear any previous step errors when navigating
        clearStepErrors();
        nextStep();
        return;
      }

      // Final submission - perform comprehensive validation
      const errors = await validateAllSteps(data);

      if (Object.keys(errors).length > 0) {
        // Set form errors to highlight problematic fields
        setFormErrorsFromStepErrors();
        // There are validation errors - don't proceed with submission
        toast.error("Please fix all errors before submitting");
        return;
      }

      // Final validation using submission schema
      const submissionSchema = createEventFormSchema(
        data.event_type,
        data.event_class,
        currentStep,
        true, // This is final submission
      );

      try {
        const validatedData = submissionSchema.parse(data);

        if (!validatedData.image) {
          throw new Error("Event image is required");
        }

        // Prepare data for submission
        const eventData = {
          ...validatedData,
          refine_description: validatedData.refine_description, // Add the missing property
          agendas: validatedData.agendas.map(
            (agenda: {
              title: string;
              agendaType: ContextType;
              event_id?: string;
            }) => ({
              ...agenda,
              event_id: "", // Ensure event_id is always a string
            }),
          ),
        };

        // Create form data using the utility function from the hook
        console.log("🚀 Final event data before FormData creation:", eventData);
        console.log("🎫 Tickets data:", eventData.tickets);
        eventData.tickets?.forEach((ticket, index) => {
          console.log(`🎟️ Ticket ${index + 1}:`, ticket);
          console.log(`  - Benefits:`, ticket.benefits);
        });

        const formData = createEventFormData(eventData);

        // Log the FormData entries to see what's actually being sent
        console.log("📋 FormData entries:");
        for (const [key, value] of formData.entries()) {
          console.log(`  ${key}:`, value);
        }

        await createEventMutation.mutateAsync(formData);
        toast.success("Event created successfully");
        clearStepErrors(); // Clear errors on successful submission
        onClose();
      } catch (validationError) {
        console.error("Final validation failed:", validationError);
        toast.error("Please fill in all required fields before submitting");
        return;
      }
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("Failed to create event. Please try again.");
    }
  };

  if (!eventType || !eventClass) return null;

  const renderBasicStep = () => (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="event_title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Event Title *</FormLabel>
            <FormControl>
              <Input placeholder="Enter event title" {...field} />
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
            <FormLabel>Location *</FormLabel>
            <FormControl>
              <Input placeholder="Enter event location" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="event_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Type *</FormLabel>
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
                  <SelectTrigger aria-label="Event type">
                    <SelectValue placeholder="Select event type" />
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
              <FormLabel>Event Class *</FormLabel>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  setEventClassOpen(false);
                }}
                open={eventClassOpen}
                onOpenChange={setEventClassOpen}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event class" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent
                  position="popper"
                  sideOffset={4}
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
            <FormLabel>About *</FormLabel>
            <FormControl>
              <Textarea
                placeholder='Enter Event description. For example, "Welcome back opening party", "Bonfire night at the beach" etc.'
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
        name="is_eighten_plus"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Adult Content (18+)</FormLabel>
              <FormDescription>
                Enable if this event is for adults only
              </FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="image"
        render={({ field: { value, onChange, ...field } }) => (
          <FormItem>
            <FormLabel>Event Image *</FormLabel>
            <FormControl>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept="image/*"
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
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">
                        Image selected
                      </span>
                    </div>
                  )}
                </div>
                {imagePreview && (
                  <div className="relative w-full max-w-[300px] aspect-video rounded-lg overflow-hidden">
                    <Image
                      src={imagePreview}
                      alt="Event preview"
                      className="w-full h-full object-cover"
                      fill
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
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
    </div>
  );

  const renderDateTimeStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date *</FormLabel>
                <FormControl>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    <Input
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="start_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time * (e.g., 09:00 AM)</FormLabel>
                <FormControl>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-gray-500" />
                    <Input type="text" placeholder="09:00 AM" {...field} />
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
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    <Input
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="end_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time * (e.g., 06:00 PM)</FormLabel>
                <FormControl>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-gray-500" />
                    <Input type="text" placeholder="06:00 PM" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <FormField
        control={form.control}
        name="duration"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Duration *</FormLabel>
            <FormControl>
              <Input placeholder="e.g., 2 Days" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  const renderTicketsStep = () => (
    <div className="space-y-6">
      {form.watch("tickets").map((_, index) => (
        <div key={index} className="space-y-4 p-4 border rounded-lg">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Ticket {index + 1}</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeTicket(index)}
            >
              <Minus className="h-4 w-4" />
            </Button>
          </div>

          <FormField
            control={form.control}
            name={`tickets.${index}.ticket_name`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ticket Name *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Early Bird" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`tickets.${index}.price`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseFloat(e.target.value) || 0)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <FormLabel>Benefits</FormLabel>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => addTicketBenefit(index)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {form.watch(`tickets.${index}.benefits`)?.map((_, benefitIndex) => (
              <div key={benefitIndex} className="flex gap-2">
                <FormField
                  control={form.control}
                  name={`tickets.${index}.benefits.${benefitIndex}.description`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder="Enter benefit" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTicketBenefit(index, benefitIndex)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" onClick={addTicket}>
        <Plus className="h-4 w-4 mr-2" />
        Add Ticket
      </Button>
    </div>
  );

  const renderAdditionalStep = () => (
    <div className="space-y-6">
      {/* Event Benefits */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-medium">Event Benefits</h3>
          <Button type="button" variant="ghost" size="sm" onClick={addBenefit}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {form.watch("benefits").map((_, index) => (
          <div key={index} className="flex gap-2">
            <FormField
              control={form.control}
              name={`benefits.${index}.description`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input placeholder="Enter benefit" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeBenefit(index)}
            >
              <Minus className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Event Agenda */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-medium">Event Agenda</h3>
          <Button type="button" variant="ghost" size="sm" onClick={addAgenda}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {form.watch("agendas").map((_, index) => (
          <div key={index} className="space-y-4 p-4 border rounded-lg">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Agenda Item {index + 1}</h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeAgenda(index)}
              >
                <Minus className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name={`agendas.${index}.title`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter agenda title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`agendas.${index}.agendaType`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        setAgendaTypeOpen({
                          ...agendaTypeOpen,
                          [index]: false,
                        });
                      }}
                      open={agendaTypeOpen[index]}
                      onOpenChange={(open) =>
                        setAgendaTypeOpen({ ...agendaTypeOpen, [index]: open })
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent
                        position="popper"
                        sideOffset={4}
                        onCloseAutoFocus={(e) => e.preventDefault()}
                      >
                        {Object.values(ContextType).map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
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
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal>
      <DialogContent
        ref={focusRef}
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        onOpenAutoFocus={(event: Event) => {
          event.preventDefault();
          // Find the first focusable input and focus it
          const firstInput = document.querySelector(
            'input:not([type="hidden"]), select, textarea',
          );
          if (firstInput instanceof HTMLElement) {
            firstInput.focus();
          }
        }}
      >
        <DialogHeader className="space-y-4">
          <DialogTitle asChild>
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-1 flex gap-2 items-center">
                <h2 className="text-2xl font-semibold">Create New Event</h2>
                <Badge className="capitalize">{eventClass}</Badge>
              </div>
              <div className="flex items-center gap-2">
                {__DEV__ && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const dummyData = getRandomDummyEvent();
                      // Fill all form fields except image
                      Object.entries(dummyData).forEach(([key, value]) => {
                        if (key !== "image") {
                          form.setValue(key as keyof EventFormValues, value);
                        }
                      });
                      toast.success("Form filled with demo data!");
                    }}
                  >
                    Fill Demo Data
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  aria-label="Close dialog"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogTitle>
          <div className="mb-8">
            <div className="relative">
              <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-gray-200" />
              <div
                className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-orange-600 transition-all duration-300"
                style={{
                  width: `${
                    ((getAvailableSteps().indexOf(currentStep) + 1) /
                      getAvailableSteps().length) *
                    100
                  }%`,
                }}
              />
              <div className="relative z-10 flex justify-between">
                {getAvailableSteps().map((step, index) => {
                  const isActive = currentStep === step;
                  const isCompleted =
                    getAvailableSteps().indexOf(currentStep) >= index;
                  const errorCount = getStepErrorCount(step);
                  const hasErrors = errorCount > 0;

                  return (
                    <div key={step} className="flex flex-col items-center">
                      <div className="relative">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                            isCompleted
                              ? "bg-orange-600 text-white"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {index + 1}
                        </div>
                        {hasErrors && (
                          <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                            {errorCount}
                          </div>
                        )}
                      </div>
                      <span
                        className={`mt-2 text-sm ${
                          isActive
                            ? "font-medium text-orange-600"
                            : hasErrors
                              ? "font-medium text-red-600"
                              : "text-gray-600"
                        }`}
                      >
                        {step === "basic"
                          ? "Basic Info"
                          : step === "datetime"
                            ? "Date & Time"
                            : step === "tickets"
                              ? "Tickets"
                              : "Additional"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <ErrorSummary
              stepErrors={stepErrors}
              onStepClick={setCurrentStep}
              availableSteps={availableSteps}
            />

            {currentStep === "basic" && renderBasicStep()}
            {currentStep === "datetime" && renderDateTimeStep()}
            {currentStep === "tickets" && renderTicketsStep()}
            {currentStep === "additional" && renderAdditionalStep()}

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={previousStep}
                disabled={currentStep === "basic"}
              >
                Previous
              </Button>
              <Button
                type="submit"
                className="bg-orange-600 hover:bg-orange-700"
                disabled={createEventMutation.isPending}
              >
                {getAvailableSteps().indexOf(currentStep) ===
                getAvailableSteps().length - 1
                  ? createEventMutation.isPending
                    ? "Creating..."
                    : "Create Event"
                  : "Next"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
