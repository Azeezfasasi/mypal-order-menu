import { EventClass, EventType } from "@/types/enums";
import { IEvent } from "@/types/event-types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { EventFormValues } from "../../create-event-modal/types";
import { stepNavigationSchema } from "../../create-event-modal/validation";

// Function to convert event data to form values
const convertEventToFormValues = (event: IEvent): Partial<EventFormValues> => {
  // Handle location as either string or object
  const locationString = typeof event.location === "string" 
    ? event.location 
    : event.location && typeof event.location === "object"
    ? ((event.location as unknown as Record<string, string>).address || "Location not available")
    : "";

  return {
    event_title: event.event_title,
    location: locationString,
    event_type: event.event_type,
    event_class: event.event_class,
    about: event.about,
    refine_description: false, // Default to false for existing events
    is_eighten_plus: event.is_eighten_plus,
    image: undefined, // Will be handled separately for existing image
    image_preference: event.flyer_url ? "keep" : undefined, // Set to "keep" if there's an existing image
    flyer_prompt: "", // Empty for existing events
    flyer_cta: undefined, // Undefined for existing events
    flyer_url: event.flyer_url || undefined, // Use existing flyer URL if available
    start_date: event.start_date,
    end_date: event.end_date,
    start_time: event.start_time,
    end_time: event.end_time,
    duration: event.duration,
    tickets:
      event.tickets?.map((ticket) => ({
        id: ticket.id, // Preserve existing ID
        ticket_name: ticket.ticket_name,
        price: ticket.price,
      })) || [],
    benefits:
      event.benefits?.map((benefit) => ({
        id: benefit.id, // Preserve existing ID
        title: benefit.title || "",
        description: benefit.description,
      })) || [],
    agendas:
      event.agendas?.map((agenda) => ({
        id: agenda.id, // Preserve existing ID
        title: agenda.title,
        description: agenda.description || "",
        event_id: event.id,
        agendaType: agenda.agendaType,
      })) || [],
  };
};

export const useEditEventForm = (existingEvent?: IEvent) => {
  const form = useForm<EventFormValues>({
    resolver: zodResolver(stepNavigationSchema),
    defaultValues: {
      event_title: "",
      location: "",
      event_type: EventType.INFORMATIVE,
      event_class: EventClass.REGULAR,
      start_date: "",
      end_date: "",
      start_time: "",
      end_time: "",
      duration: "",
      about: "",
      refine_description: false,
      is_eighten_plus: false,
      image: undefined as File | undefined,
      image_preference: undefined as "upload" | "generate" | "keep" | undefined,
      flyer_prompt: "",
      flyer_cta: undefined,
      flyer_url: undefined,
      tickets: [],
      benefits: [],
      agendas: [],
    },
    mode: "onChange",
  });

  // Watch form values
  const watchEventType = form.watch("event_type");
  const watchEventClass = form.watch("event_class");

  // Initialize form with existing event data
  useEffect(() => {
    if (existingEvent) {
      const formValues = convertEventToFormValues(existingEvent);
      Object.entries(formValues).forEach(([key, value]) => {
        if (value !== undefined) {
          form.setValue(key as keyof EventFormValues, value);
        }
      });
    }
  }, [existingEvent, form]);

  return {
    form,
    watchEventType,
    watchEventClass,
  };
};
