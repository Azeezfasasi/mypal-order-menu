import { ContextType, EventClass, EventType } from "@/types/enums";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { EventFormValues } from "../types";
import { calculateDuration } from "../utils";
import { getDefaultFormValues, stepNavigationSchema } from "../validation";

export const useCreateEventForm = (
  eventType: EventType | null,
  eventClass: EventClass | null,
) => {
  const defaultValues = getDefaultFormValues(eventType, eventClass);

  // Calculate initial duration from default values
  const initialDuration = calculateDuration(
    defaultValues.start_date,
    defaultValues.start_time,
    defaultValues.end_date,
    defaultValues.end_time,
  );

  const form = useForm<EventFormValues>({
    // Use a dynamic resolver that updates based on form values
    resolver: (values, context, options) => {
      // Use current form values for event type and class, not the initial props
      const currentEventType =
        values.event_type || eventType || EventType.INFORMATIVE;
      const currentEventClass =
        values.event_class || eventClass || EventClass.REGULAR;

      console.log("🔍 Form resolver called with:", {
        currentEventType,
        currentEventClass,
        initialEventType: eventType,
        initialEventClass: eventClass,
      });

      // Use stepNavigationSchema for validation during navigation
      return zodResolver(stepNavigationSchema)(values, context, options);
    },
    mode: "onSubmit", // Only validate on form submission (Next/Submit button)
    criteriaMode: "all", // Show all errors, not just first
    defaultValues: {
      ...defaultValues,
      duration: initialDuration || defaultValues.duration,
    },
  });

  // Watch event type and class to conditionally show steps
  const watchEventType = form.watch("event_type");
  const watchEventClass = form.watch("event_class");

  // Sync form values with props when they change
  useEffect(() => {
    if (eventType && eventType !== form.getValues("event_type")) {
      form.setValue("event_type", eventType);
    }

    // When event class changes, handle special cases
    if (eventClass && eventClass !== form.getValues("event_class")) {
      console.log("⚙️ Event class changed to:", eventClass);
      form.setValue("event_class", eventClass);

      // Initialize benefits and agendas for EXCLUSIVE events
      if (eventClass === EventClass.EXCLUSIVE) {
        console.log("⚙️ Initializing benefits and agendas for EXCLUSIVE event");
        // Only add if arrays are empty - don't overwrite existing data
        const benefits = form.getValues("benefits");
        const agendas = form.getValues("agendas");

        if (!benefits || benefits.length === 0) {
          console.log("⚙️ Adding default benefit");
          form.setValue("benefits", [{ title: "", description: "" }]);
        } else {
          console.log("⚙️ Benefits already exist, not overwriting:", benefits);
        }

        if (!agendas || agendas.length === 0) {
          console.log("⚙️ Adding default agenda");
          form.setValue("agendas", [
            {
              title: "",
              description: "",
              event_id: "",
              agendaType: ContextType.EVENT,
            },
          ]);
        } else {
          console.log("⚙️ Agendas already exist, not overwriting:", agendas);
        }
      } else {
        // If switching away from EXCLUSIVE, clear the arrays
        form.setValue("benefits", []);
        form.setValue("agendas", []);
      }
    }
  }, [eventType, eventClass, form]);

  return {
    form,
    watchEventType,
    watchEventClass,
  };
};
