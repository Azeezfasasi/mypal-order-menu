import { ContextType, EventClass, EventType } from "@/types/enums";
import { EventMainCatch } from "@/types/event-main-catch";
import * as z from "zod";
import { Step } from "./types";

const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/;

/**
 * Helper function to validate date/time range
 */
const validateDateTimeRange = (data: {
  start_date?: string;
  start_time?: string;
  end_date?: string;
  end_time?: string;
}) => {
  const { start_date, start_time, end_date, end_time } = data;

  if (!start_date || !start_time || !end_date || !end_time) {
    return true; // Skip validation if any field is missing
  }

  // Convert 12-hour time format to 24-hour for parsing
  const convertTo24Hour = (time12h: string): string => {
    const [time, modifier] = time12h.split(" ");
    const [hoursStr, minutes] = time.split(":");
    let hours = hoursStr;

    if (hours === "12") {
      hours = "00";
    }

    if (modifier === "PM") {
      hours = String(parseInt(hours, 10) + 12);
    }

    return `${hours}:${minutes}`;
  };

  try {
    const start24Hour = convertTo24Hour(start_time);
    const end24Hour = convertTo24Hour(end_time);

    const startDateTime = new Date(`${start_date}T${start24Hour}:00`);
    const endDateTime = new Date(`${end_date}T${end24Hour}:00`);

    return (
      !isNaN(startDateTime.getTime()) &&
      !isNaN(endDateTime.getTime()) &&
      endDateTime > startDateTime
    );
  } catch {
    return false;
  }
};

/**
 * Base schema with all fields and their basic validation rules
 */
export const baseEventFormSchema = z
  .object({
    // Step 1: Basic Information
    event_title: z.string().min(3, "Title must be at least 3 characters"),
    business_name: z.string().optional(),
    business_category: z.string().optional(), // API: businessCategory (required in API)
    location: z.string().min(3, "Location must be at least 3 characters"),
    location_details: z
      .object({
        address: z.string(),
        city: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      })
      .optional(),
    event_type: z.nativeEnum(EventType),
    event_class: z.nativeEnum(EventClass),
    event_group: z.string().optional(), // API: event_group (Informative, Fine Dining, etc.)
    cta: z.string().optional(), // API: cta (None, Reservation, Ticketing)
    main_catch: z.enum(
      [
        EventMainCatch.FOOD,
        EventMainCatch.DRINKS,
        EventMainCatch.ACCOMMODATION,
        EventMainCatch.BEACH_VIBE,
        EventMainCatch.CLUB_VIBE,
        EventMainCatch.MUSIC,
        EventMainCatch.BOAT_CRUISES,
        EventMainCatch.LUXURY_NIGHT,
        EventMainCatch.EVENT_NIGHT,
        EventMainCatch.COOL_OFFS,
        EventMainCatch.MOBILITY,
      ]
    ).optional(),
    about_main_catch: z.string().optional(),
    event_caption: z.string().optional(),
    event_description: z.string().optional(),
    catchy_phrase: z.string().optional(),
    event_attractions: z.array(z.string()).optional().default([]),
    event_gate_pass: z.string().optional(),
    event_is_likeable: z.boolean().optional(),
    event_is_shareable: z.boolean().optional(),
    event_offer_text: z.string().optional(),
    about: z.string().min(10, "Description must be at least 10 characters"),
    refine_description: z.boolean().default(false),
    drink_responsibly: z.boolean().optional().default(false),
    image_preference: z.enum(["upload", "generate", "keep"]),
    image: z.instanceof(File).optional(),
    images: z.array(z.string()).optional(),
    image_prompt: z.string().optional(), // Custom AI image prompt (takes precedence over background_uri)
    flyer_cta: z
      .enum([
        "place_order",
        "make_reservation",
        "buy_tickets",
        "plain_informative",
      ])
      .optional(),
    flyer_url: z.string().optional(),
    is_eighten_plus: z.boolean(),

    // Step 2: Date and Time
    start_date: z
      .string()
      .min(1, "Start date is required"),
    end_date: z
      .string()
      .min(1, "End date is required"),
    start_time: z
      .string()
      .regex(timeRegex, "Time must be in hh:mm AM/PM format"),
    end_time: z.string().regex(timeRegex, "Time must be in hh:mm AM/PM format"),
    duration: z.string().optional(),
    date_details: z
      .object({
        startDate: z.string(),
        endDate: z.string(),
        startTime: z.string(),
        endTime: z.string(),
        duration: z.string().optional(),
      })
      .optional(),
    event_frequency: z.string().optional(),

    // Reservation configuration
    reservation_config: z
      .object({
        tablesAvailable: z.boolean().optional(),
        sectionsAvailable: z.boolean().optional(),
        minPartySize: z.number().optional(),
        maxPartySize: z.number().optional(),
      })
      .optional(),

    // Buffet Gate Pass & Access Control
    gate_pass_type: z.enum(["free", "paid"]).optional(),
    has_adult_ticket: z.boolean().optional(),
    adult_ticket_price: z.number().optional(),
    has_child_ticket: z.boolean().optional(),
    child_ticket_price: z.number().optional(),

    // Step 3: Tickets
    tickets: z
      .array(
        z.object({
          id: z.string().optional(),
          ticket_name: z.string().min(1, "Ticket name is required"),
          price: z.number().min(0, "Price must be 0 or greater"),
          total_tickets: z.number().min(1, "Total tickets must be at least 1"),
        }),
      )
      .default([]),
    ticket_types: z.array(z.object({
      id: z.string().optional(),
      ticket_name: z.string(),
      price: z.number(),
      total_tickets: z.number(),
    })).optional(),

    // Step 4: Additional Details
    benefits: z
      .array(
        z.object({
          id: z.string().optional(),
          title: z.string().optional().default(""),
          description: z.string().optional().default(""),
        }),
      )
      .default([]),
    agendas: z
      .array(
        z.object({
          id: z.string().optional(),
          title: z.string().optional().default(""),
          description: z.string().optional().default(""),
          event_id: z.string().optional(),
          agendaType: z
            .nativeEnum(ContextType)
            .optional()
            .default(ContextType.EVENT),
        }),
      )
      .default([]),
  })
  .refine(validateDateTimeRange, {
    message: "End date and time must be after start date and time",
    path: ["end_date"],
  })
  .refine(
    (data) => {
      // API constraint: Regular Events must use CTA: None
      if (data.event_class === EventClass.REGULAR && data.cta && data.cta !== "None") {
        return false;
      }
      return true;
    },
    {
      message: "Regular events must use CTA: None",
      path: ["cta"],
    },
  );

/**
 * Lenient schema for step navigation - only validates basic fields
 * Arrays are optional and can be empty during navigation
 */
export const stepNavigationSchema = z.object({
  // Step 1: Basic Information (always required)
  event_title: z.string().min(3, "Title must be at least 3 characters"),
  business_name: z.string().optional(),
  business_category: z.string().optional(),
  location: z.string().min(3, "Location must be at least 3 characters"),
  location_details: z.object({
    address: z.string(),
    city: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }).optional(),
  event_type: z.nativeEnum(EventType),
  event_class: z.nativeEnum(EventClass),
  event_group: z.string().optional(),
  cta: z.string().optional(),
  main_catch: z.enum(
    [
      EventMainCatch.FOOD,
      EventMainCatch.DRINKS,
      EventMainCatch.ACCOMMODATION,
      EventMainCatch.BEACH_VIBE,
      EventMainCatch.CLUB_VIBE,
      EventMainCatch.MUSIC,
      EventMainCatch.BOAT_CRUISES,
      EventMainCatch.LUXURY_NIGHT,
      EventMainCatch.EVENT_NIGHT,
      EventMainCatch.COOL_OFFS,
      EventMainCatch.MOBILITY,
    ]
  ).optional(),
  about_main_catch: z.string().optional(),
  event_caption: z.string().optional(),
  event_description: z.string().optional(),
  catchy_phrase: z.string().optional(),
  event_attractions: z.array(z.string()).optional().default([]),
  event_gate_pass: z.string().optional(),
  event_is_likeable: z.boolean().optional(),
  event_is_shareable: z.boolean().optional(),
  event_offer_text: z.string().optional(),
  about: z.string().min(10, "Description must be at least 10 characters"),
  refine_description: z.boolean().default(false),
  drink_responsibly: z.boolean().optional().default(false),
  image_preference: z.enum(["upload", "generate", "keep"]),
  image: z.instanceof(File).optional(),
  images: z.array(z.string()).optional(),
  image_prompt: z.string().optional(), // Custom AI image prompt (takes precedence over background_uri)
  flyer_cta: z
    .enum([
      "place_order",
      "make_reservation",
      "buy_tickets",
      "plain_informative",
    ])
    .optional(),
  flyer_url: z.string().optional(),
  is_eighten_plus: z.boolean(),

  // Step 2: Date and Time (optional for navigation)
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  duration: z.string().optional(),
  date_details: z.object({
    startDate: z.string(),
    endDate: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    duration: z.string().optional(),
  }).optional(),

  // Reservation configuration
  reservation_config: z.object({
    tablesAvailable: z.boolean().optional(),
    sectionsAvailable: z.boolean().optional(),
    minPartySize: z.number().optional(),
    maxPartySize: z.number().optional(),
  }).optional(),

  // Buffet Gate Pass & Access Control
  gate_pass_type: z.enum(["free", "paid"]).optional(),
  has_adult_ticket: z.boolean().optional(),
  adult_ticket_price: z.number().optional(),
  has_child_ticket: z.boolean().optional(),
  child_ticket_price: z.number().optional(),

  // Step 3: Tickets (optional for navigation, no minimum length requirement)
  tickets: z
    .array(
      z.object({
        id: z.string().optional(),
        ticket_name: z.string(),
        price: z.number(),
        total_tickets: z.number(),
      }),
    )
    .optional()
    .default([]),
  ticket_types: z.array(z.object({
    id: z.string().optional(),
    ticket_name: z.string(),
    price: z.number(),
    total_tickets: z.number(),
  })).optional(),

  // Step 4: Additional Details (optional for navigation, no minimum length requirement)
  benefits: z
    .array(
      z.object({
        id: z.string().optional(),
        title: z.string(),
        description: z.string(),
      }),
    )
    .optional()
    .default([]),
  agendas: z
    .array(
      z.object({
        id: z.string().optional(),
        title: z.string(),
        description: z.string(),
        event_id: z.string().optional(),
        agendaType: z.nativeEnum(ContextType),
      }),
    )
    .optional()
    .default([]),
});

/**
 * Creates a validation schema based on the current step and submission state
 */
export const createEventFormSchema = (
  eventType: EventType,
  eventClass: EventClass,
  currentStep: Step,
  isSubmitting: boolean = false,
) => {
  console.log("🔧 createEventFormSchema called with:", {
    eventType,
    eventClass,
    currentStep,
    isSubmitting,
  });

  // For step navigation, use the lenient schema
  if (!isSubmitting) {
    return stepNavigationSchema;
  }

  // For submission, build the appropriate schema with refinements
  let schema = baseEventFormSchema;

  // Add future date validation for submission only
  schema = schema
    .refine(
      (data) => !data.start_date || new Date(data.start_date) > new Date(),
      {
        message: "Start date must be in the future",
        path: ["start_date"],
      },
    )
    .refine(
      (data) => !data.end_date || new Date(data.end_date) > new Date(),
      {
        message: "End date must be in the future",
        path: ["end_date"],
      },
    ) as unknown as typeof schema;

  // Apply conditional validation for tickets
  // Check the actual data being validated, not just the parameters
  if (eventType === EventType.TICKET) {
    console.log("🎫 Adding ticket validation refine");
    schema = schema.refine((data) => data.tickets.length > 0, {
      message: "At least one ticket is required for ticket events",
      path: ["tickets"],
    }) as unknown as typeof schema;
  }

  // Apply conditional validation for exclusive events
  // Check the actual data being validated, not just the parameters
  if (eventClass === EventClass.EXCLUSIVE) {
    console.log("⭐ Adding exclusive event validation refine");
    schema = schema.refine((data) => data.benefits.length > 0, {
      message: "At least one benefit is required for exclusive events",
      path: ["benefits"],
    }) as unknown as typeof schema;
  } else {
    console.log(
      "✅ No exclusive event validation (event class is not EXCLUSIVE)",
    );
  }

  // Ensure proper validation for image selection based on preference
  const finalSchema = schema.refine(
    (data) => {
      console.log("🔍 Image validation check:", {
        image_preference: data.image_preference,
        image: data.image ? "File exists" : "No file",
        flyer_url: data.flyer_url,
        flyer_cta: data.flyer_cta,
      });

      // Most lenient: if flyer_url exists, it's valid (regardless of preference)
      if (data.flyer_url && data.flyer_url.trim().length > 0) {
        console.log("🎨 Flyer URL exists - accepting regardless of preference:", data.flyer_url.substring(0, 50));
        return true;
      }

      // Validate image upload
      if (data.image_preference === "upload") {
        const hasImage = data.image instanceof File;
        console.log("📁 Upload validation:", { hasImage });
        return hasImage;
      }
      // Validate image generation with prompt and generated URL
      else if (data.image_preference === "generate") {
        const hasGeneratedFlyer =
          !!data.flyer_url && data.flyer_url.trim().length > 0;

        console.log("🎨 Generate validation:", {
          hasGeneratedFlyer,
          url: data.flyer_url,
          urlLength: data.flyer_url ? data.flyer_url.length : 0,
          urlType: typeof data.flyer_url,
        });

        // If a flyer URL already exists, validation passes
        // We don't need to re-validate the prompt since the flyer is already generated
        return hasGeneratedFlyer;
      }
      // For "keep" preference, it's always valid
      else if (data.image_preference === "keep") {
        console.log("🔄 Using 'keep' preference - keeping existing image");
        return true;
      }
      
      console.warn("⚠️ UNKNOWN image_preference:", data.image_preference);
      return false;
    },
    {
      message:
        "Please upload an image or generate a flyer using the provided prompt before submitting",
      path: ["image"],
    },
  );

  return finalSchema;
};

/**
 * Schema for final submission with all conditional validations
 */
export const createSubmissionSchema = (
  eventType: EventType,
  eventClass: EventClass,
) => {
  return createEventFormSchema(eventType, eventClass, "additional", true);
};

/**
 * Get default form values
 */
export const getDefaultFormValues = (
  eventType?: EventType | null,
  eventClass?: EventClass | null,
) => {
  // Generate tomorrow's date for default event dates
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  return {
  event_title: "",
  business_name: "",
  business_category: "",
  location: "",
  location_details: undefined,
  event_type: eventType || EventType.INFORMATIVE,
  event_class: eventClass || EventClass.REGULAR,
  event_group: "", // Default empty, will be selected by user
  cta: eventClass === EventClass.REGULAR ? "None" : "", // Regular events default to None
  main_catch: "",
  about_main_catch: "",
  event_caption: "",
  event_description: "",
  catchy_phrase: "",
  event_attractions: [],
  event_gate_pass: "",
  event_is_likeable: false,
  event_is_shareable: false,
  event_offer_text: "",
  start_date: tomorrowStr,
  end_date: tomorrowStr,
  start_time: "09:00 AM",
  end_time: "06:00 PM",
  duration: "1 Day",
  event_frequency: "",
  date_details: undefined,
  reservation_config: undefined,
  price_per_individual: undefined,
  gate_pass_type: undefined,
  has_adult_ticket: false,
  adult_ticket_price: undefined,
  has_child_ticket: false,
  child_ticket_price: undefined,
  about: "",
  refine_description: false,
  drink_responsibly: false,
  is_eighten_plus: false,
  image_preference: "upload" as "upload" | "generate",
  image: undefined as File | undefined,
  images: [] as string[],
  flyer_cta: undefined,
  flyer_url: undefined,
  tickets: [],
  ticket_types: undefined,
  benefits: [],
  agendas: [],
  };
};
