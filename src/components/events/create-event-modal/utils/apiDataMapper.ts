/**
 * Maps form values to API request format
 * Transforms the internal form structure to match the backend API specification
 *
 * CRITICAL: This mapper sends BOTH old-format and new-format fields for backward
 * compatibility. The backend may expect either format:
 * - OLD format: event_title, about, event_type, event_class, start_date, location (string), tickets[]
 * - NEW format: title, description, eventType, eventCategory, dateDetails{}, location{}, ticketTypes[]
 */

import { EventClass } from "@/types/enums";
import { EventFormValues, CreateEventApiRequest } from "../types";

/**
 * Maps business category or event_group to API-compliant event_group enum
 * API expects: informative, fine_dining, buffet, ticketing, clubbing
 */
function mapEventGroup(categoryOrGroup: string): string {
  if (!categoryOrGroup) return "informative";

  const normalized = categoryOrGroup.toLowerCase().trim();

  // Map common business categories to event groups
  if (normalized.includes("fine dining") || normalized.includes("fine-dining")) {
    return "fine_dining";
  }
  if (normalized.includes("buffet")) {
    return "buffet";
  }
  if (normalized.includes("ticketing") || normalized.includes("ticket")) {
    return "ticketing";
  }
  if (normalized.includes("clubbing") || normalized.includes("club") || normalized.includes("nightlife")) {
    return "clubbing";
  }
  if (normalized.includes("informative") || normalized.includes("info")) {
    return "informative";
  }

  // Default fallback
  return "informative";
}

/**
 * Converts 12-hour time format (hh:mm AM/PM) to 24-hour format (HH:mm)
 */
function convertTo24HourFormat(time12h: string): string {
  if (!time12h) return "";

  try {
    // If it's already in 24-hour format, return as-is
    if (!time12h.includes("AM") && !time12h.includes("PM")) {
      return time12h;
    }

    const [time, period] = time12h.trim().split(" ");
    if (!time || !period) {
      console.warn("⚠️ Invalid time format:", time12h);
      return "";
    }

    const [hoursStr, minutes] = time.split(":");
    if (!hoursStr || !minutes) {
      console.warn("⚠️ Invalid time format (missing hours/minutes):", time12h);
      return "";
    }

    let hours24 = parseInt(hoursStr, 10);

    if (period === "AM" && hours24 === 12) {
      hours24 = 0; // 12 AM = 00:00
    } else if (period === "PM" && hours24 !== 12) {
      hours24 += 12; // Convert PM hours
    }

    return `${String(hours24).padStart(2, "0")}:${minutes}`;
  } catch (error) {
    console.error("❌ Time conversion error for:", time12h, error);
    return "";
  }
}

/**
 * Maps EventType enum to API eventType string
 * eventType values: "Plain Informative", "Exclusive 1", "Exclusive 2"
 */
function mapEventType(eventClass: EventClass): string {
  // Regular events are always "Plain Informative"
  if (eventClass === EventClass.REGULAR) {
    return "Plain Informative";
  }
  // Exclusive events can be "Exclusive 1" or "Exclusive 2"
  return "Exclusive 1";
}

/**
 * Maps EventClass enum to API eventCategory
 */
function mapEventCategory(eventClass: EventClass): "Regular Event" | "Exclusive Event" {
  return eventClass === EventClass.EXCLUSIVE ? "Exclusive Event" : "Regular Event";
}

/**
 * Main mapping function: Form data → API request format
 * Maps form values to the backend API specification
 *
 * DUAL FORMAT: Populates BOTH old-format and new-format fields so the backend
 * can consume whichever field names it expects.
 */
export async function mapFormToApiRequest(
  formData: EventFormValues,
  businessId?: string,
): Promise<Partial<CreateEventApiRequest>> {
  // Log entire form data for debugging
  console.log("🔍 [mapFormToApiRequest] FULL FORM DATA RECEIVED:");
  console.log("  event_title:", formData.event_title);
  console.log("  location:", formData.location);
  console.log("  start_date:", formData.start_date);
  console.log("  end_date:", formData.end_date);
  console.log("  start_time:", formData.start_time);
  console.log("  end_time:", formData.end_time);
  console.log("  businessId param:", businessId);

  // Warn if businessId is missing
  if (!businessId) {
    console.warn("⚠️ WARNING: businessId is missing! User may not be authenticated.");
  }

  // Convert times to 24-hour format
  const startTime = formData.start_time
    ? convertTo24HourFormat(formData.start_time)
    : "";
  const endTime = formData.end_time
    ? convertTo24HourFormat(formData.end_time)
    : "";

  // Determine event group
  const eventGroup = mapEventGroup(formData.business_category || formData.event_group || "");

  // Build the dual-format API request object
  const apiRequest: Partial<CreateEventApiRequest> = {
    // =====================================================
    // NEW FORMAT FIELDS (for new API spec)
    // =====================================================
    businessId,
    businessCategory: formData.business_category || "Nightlife",
    eventCategory: mapEventCategory(formData.event_class),
    event_group: eventGroup,
    eventType: mapEventType(formData.event_class),
    cta: (formData.cta || "None") as "None" | "Reservation" | "Ticketing",
    title: formData.event_title,
    description: formData.about,

    // Location - nested object
    location: {
      address: String(
        formData.location_details?.address ||
        formData.location ||
        formData.business_name ||
        "Event Location"
      ),
      city: formData.location_details?.city ? String(formData.location_details.city) : "Lagos",
      state: formData.location_details?.state || "Lagos",
      country: formData.location_details?.country || "Nigeria",
      latitude: formData.location_details?.latitude ?? undefined,
      longitude: formData.location_details?.longitude ?? undefined,
    },

    // Date/Time details - nested object
    dateDetails: {
      startDate: String(formData.date_details?.startDate || formData.start_date || ""),
      endDate: String(formData.date_details?.endDate || formData.end_date || ""),
      startTime: String(formData.date_details?.startTime || startTime || ""),
      endTime: String(formData.date_details?.endTime || endTime || ""),
      duration: String(formData.date_details?.duration || formData.duration || ""),
    },

    // Images array - Backend requires this as array of strings
    // If flyer_url exists (AI-generated), use it; otherwise use existing images array
    // When a file is uploaded, send empty array — backend will populate from `image` field
    images: formData.flyer_url
      ? [formData.flyer_url]
      : (formData.images && formData.images.length > 0)
        ? formData.images
        : formData.image instanceof File
          ? []
          : undefined,

    // Image file - separate field for raw upload
    image: formData.image instanceof File ? formData.image : undefined,

    // AI Flyer Customization
    logo: formData.flyer_logo instanceof File ? formData.flyer_logo : undefined,
    background: formData.flyer_background instanceof File ? formData.flyer_background : undefined,
    themeStyle: formData.flyer_theme_style || undefined,
    imagePrompt: formData.image_prompt || undefined, // Custom image prompt - takes precedence over background_uri and auto-generated prompts

    // Additional event details
    event_main_catch: formData.main_catch ? formData.main_catch.toUpperCase() : undefined,
    event_about_main_catch: formData.about_main_catch || undefined,
    event_gate_pass: formData.event_gate_pass || undefined,
    event_catchy_phrase: formData.catchy_phrase || undefined,
    event_is_likeable: formData.event_is_likeable ?? undefined,
    event_is_shareable: formData.event_is_shareable ?? undefined,
    event_offer_text: formData.event_offer_text || undefined,
    event_frequency: formData.event_frequency || undefined,
    refine_description: formData.refine_description,

    // Reservation config
    reservation_config: formData.reservation_config ? {
      min_guests: formData.reservation_config.minPartySize || 0,
      max_guests: formData.reservation_config.maxPartySize || 0,
      is_table_booking: formData.reservation_config.tablesAvailable ?? false,
      reservation_fee: 0,
    } : {
      min_guests: 0,
      max_guests: 0,
      is_table_booking: false,
      reservation_fee: 0,
    },

    // Ticket types (new format name)
    ticketTypes: formData.ticket_types && formData.ticket_types.length > 0
      ? formData.ticket_types.map(t => ({ id: t.id, ticket_name: t.ticket_name, price: t.price, total_tickets: t.total_tickets || 0 }))
      : formData.tickets && formData.tickets.length > 0
      ? formData.tickets.map(t => ({ id: t.id, ticket_name: t.ticket_name, price: t.price, total_tickets: t.total_tickets || 0 }))
      : undefined,

    // Benefits
    benefits: formData.benefits && formData.benefits.length > 0 ? formData.benefits : undefined,

    // Agenda (new format name)
    agenda: formData.agendas && formData.agendas.length > 0 ? formData.agendas : undefined,

    // Reservation details
    reservationDetails: formData.price_per_individual
      ? { pricingType: "per_individual", price: formData.price_per_individual, isFree: false }
      : undefined,

    // Adult and child ticket prices (for buffet/restaurant events)
    adult_ticket_price: formData.adult_ticket_price || undefined,
    child_ticket_price: formData.child_ticket_price || undefined,

    // =====================================================
    // OLD FORMAT FIELDS (for backward compatibility)
    // The backend may still expect these flat field names
    // =====================================================
    event_title: formData.event_title,
    about: formData.about,
    event_type: formData.event_type,
    event_class: formData.event_class,
    start_date: String(formData.start_date || ""),
    end_date: String(formData.end_date || ""),
    start_time: String(formData.start_time || ""),
    end_time: String(formData.end_time || ""),
    duration: String(formData.duration || ""),
    businesss_id: businessId,
    flyer_url: formData.flyer_url || undefined,
    image_prompt: formData.image_prompt || undefined, // Custom image prompt - takes precedence
    flyer_cta: formData.flyer_cta || undefined,
    image_preference: formData.image_preference,

    // Old-format flat tickets array (same shape)
    tickets: formData.tickets && formData.tickets.length > 0
      ? formData.tickets.map(t => ({ id: t.id, ticket_name: t.ticket_name, price: t.price, total_tickets: t.total_tickets || 0 }))
      : undefined,

    // Old-format flat agendas array (same shape)
    agendas: formData.agendas && formData.agendas.length > 0
      ? formData.agendas.map(a => ({
          id: a.id,
          title: a.title,
          description: a.description,
          event_id: a.event_id,
          agendaType: a.agendaType,
        }))
      : undefined,
  };

  console.log("📊 API Request - DUAL FORMAT MAPPING:");
  console.log("  NEW FORMAT:");
  console.log("    ✓ businessId:", apiRequest.businessId);
  console.log("    ✓ title:", apiRequest.title);
  console.log("    ✓ description:", apiRequest.description);
  console.log("    ✓ eventType:", apiRequest.eventType);
  console.log("    ✓ eventCategory:", apiRequest.eventCategory);
  console.log("    ✓ event_group:", apiRequest.event_group);
  console.log("    ✓ dateDetails:", apiRequest.dateDetails);
  console.log("    ✓ location:", apiRequest.location);
  console.log("    ✓ ticketTypes:", apiRequest.ticketTypes?.length || 0);
  console.log("    ✓ agenda:", apiRequest.agenda?.length || 0);
  console.log("  OLD FORMAT:");
  console.log("    ✓ event_title:", apiRequest.event_title);
  console.log("    ✓ about:", apiRequest.about);
  console.log("    ✓ event_type:", apiRequest.event_type);
  console.log("    ✓ event_class:", apiRequest.event_class);
  console.log("    ✓ start_date:", apiRequest.start_date);
  console.log("    ✓ end_date:", apiRequest.end_date);
  console.log("    ✓ businesss_id:", apiRequest.businesss_id);
  console.log("    ✓ tickets:", apiRequest.tickets?.length || 0);
  console.log("    ✓ agendas:", apiRequest.agendas?.length || 0);
  console.log("  IMAGE HANDLING:");
  console.log("    ✓ flyer_url:", apiRequest.flyer_url ? "SET (" + apiRequest.flyer_url.substring(0, 50) + "...)" : "NOT SET");
  console.log("    ✓ image:", apiRequest.image ? `File(${(apiRequest.image as File).name || 'unknown'})` : "NOT SET");

  return apiRequest;
}

/**
 * Helper function to display FormData contents in a readable format
 */
function logFormDataContents(formData: FormData, label: string = "FormData"): void {
  console.log(`\n📋 [${label}] - COMPLETE CONTENTS:`);
  console.log("━".repeat(80));

  const entries = Array.from(formData.entries());
  const grouped: { [key: string]: string[] } = {};

  entries.forEach(([key, value]) => {
    const prefix = key.split("[")[0];
    if (!grouped[prefix]) {
      grouped[prefix] = [];
    }

    let displayValue: string;
    if (value instanceof File) {
      displayValue = `File(${value.name}, ${value.size} bytes, type: ${value.type})`;
    } else {
      const strValue = String(value);
      displayValue = strValue.length > 60 ? strValue.substring(0, 60) + "..." : strValue;
    }

    grouped[prefix].push(`  ${key}: ${displayValue}`);
  });

  Object.entries(grouped).forEach(([prefix, values]) => {
    console.log(`\n${prefix}:`);
    values.forEach(v => console.log(v));
  });

  console.log("\n" + "━".repeat(80));
  console.log(`📊 Total entries: ${entries.length}`);
}

/**
 * Helper function to validate that critical FormData fields are present and not empty
 */
function validateFormDataFieldsForFormData(formData: FormData): { valid: boolean; missingFields: string[] } {
  const criticalFields = [
    "businessId",
    "businessCategory",
    "eventCategory",
    "eventType",
    "cta",
    "title",
    "description",
    "location[address]",
    "dateDetails[startDate]",
  ];

  const missingFields: string[] = [];

  console.log(`\n🔐 [FormData Validation] Checking ${criticalFields.length} critical fields...`);

  criticalFields.forEach((field) => {
    const value = formData.get(field);
    if (!value || String(value).trim() === "") {
      missingFields.push(`${field} (value: '${value}')`);
      console.error(`  ❌ ${field}: MISSING or EMPTY`);
    } else {
      const displayValue = String(value).substring(0, 40);
      console.log(`  ✅ ${field}: '${displayValue}${String(value).length > 40 ? '...' : ''}'`);
    }
  });

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Converts mapped API request to FormData for multipart submission
 * Sends BOTH old-format and new-format fields for backward compatibility
 */
export function convertApiRequestToFormDataOriginal(
  apiRequest: Partial<CreateEventApiRequest>,
): FormData {
  const formData = new FormData();

  console.log("🔧 [convertApiRequestToFormData] STARTING - Dual format mode");

  // =====================================================
  // NEW FORMAT FIELDS
  // =====================================================
  if (apiRequest.businessId) {
    formData.append("businessId", apiRequest.businessId);
  }
  formData.append("businessCategory", String(apiRequest.businessCategory || ""));
  formData.append("eventCategory", String(apiRequest.eventCategory || ""));
  formData.append("event_group", String(apiRequest.event_group || "informative"));
  formData.append("eventType", String(apiRequest.eventType || ""));
  formData.append("cta", String(apiRequest.cta || ""));
  formData.append("title", String(apiRequest.title || ""));
  formData.append("description", String(apiRequest.description || ""));
  formData.append("refine_description", String(apiRequest.refine_description || false));

  // Optional new-format fields
  if (apiRequest.event_main_catch) {
    formData.append("event_main_catch", String(apiRequest.event_main_catch));
  }
  if (apiRequest.event_about_main_catch) {
    formData.append("event_about_main_catch", String(apiRequest.event_about_main_catch));
  }
  if (apiRequest.event_gate_pass) {
    formData.append("event_gate_pass", String(apiRequest.event_gate_pass));
  }
  if (apiRequest.event_catchy_phrase) {
    formData.append("event_catchy_phrase", String(apiRequest.event_catchy_phrase));
  }
  if (apiRequest.event_is_likeable !== undefined) {
    formData.append("event_is_likeable", String(apiRequest.event_is_likeable));
  }
  if (apiRequest.event_is_shareable !== undefined) {
    formData.append("event_is_shareable", String(apiRequest.event_is_shareable));
  }
  if (apiRequest.event_offer_text) {
    formData.append("event_offer_text", String(apiRequest.event_offer_text));
  }
  if (apiRequest.event_frequency) {
    formData.append("event_frequency", String(apiRequest.event_frequency));
  }

  // Adult and child ticket prices
  if (apiRequest.adult_ticket_price !== undefined) {
    formData.append("adult_ticket_price", String(apiRequest.adult_ticket_price));
  }
  if (apiRequest.child_ticket_price !== undefined) {
    formData.append("child_ticket_price", String(apiRequest.child_ticket_price));
  }

  // Location (new format - bracket notation)
  if (apiRequest.location) {
    formData.append("location[address]", String(apiRequest.location.address || ""));
    formData.append("location[city]", String(apiRequest.location.city || ""));
    formData.append("location[state]", String(apiRequest.location.state || ""));
    formData.append("location[country]", String(apiRequest.location.country || ""));
    if (apiRequest.location.latitude !== undefined && apiRequest.location.latitude !== null) {
      formData.append("location[latitude]", String(apiRequest.location.latitude));
    }
    if (apiRequest.location.longitude !== undefined && apiRequest.location.longitude !== null) {
      formData.append("location[longitude]", String(apiRequest.location.longitude));
    }
  }

  // DateDetails (new format - bracket notation)
  if (apiRequest.dateDetails) {
    formData.append("dateDetails[startDate]", String(apiRequest.dateDetails.startDate || ""));
    formData.append("dateDetails[endDate]", String(apiRequest.dateDetails.endDate || ""));
    formData.append("dateDetails[startTime]", String(apiRequest.dateDetails.startTime || ""));
    formData.append("dateDetails[endTime]", String(apiRequest.dateDetails.endTime || ""));
    if (apiRequest.dateDetails.duration) {
      formData.append("dateDetails[duration]", String(apiRequest.dateDetails.duration));
    }
  }

  // Images array - Backend requires this as array of strings (bracket notation)
  // ALWAYS send the images field - even as empty array when file is uploaded
  const imagesToSend = Array.isArray(apiRequest.images) ? apiRequest.images : [];
  imagesToSend.forEach((imageUrl, index) => {
    formData.append(`images[${index}]`, String(imageUrl));
  });
  // If no images, send images[0] as empty string to ensure field exists? No, just log
  if (imagesToSend.length === 0) {
    console.log("⚠️ No image URLs in images array - relying on 'image' file upload or flyer_url");
  }

  // Image file (binary upload)
  if (apiRequest.image instanceof File) {
    formData.append("image", apiRequest.image);
  }

  // AI Flyer Customization - Logo file
  if (apiRequest.logo instanceof File) {
    formData.append("logo", apiRequest.logo);
  }

  // AI Flyer Customization - Background file
  if (apiRequest.background instanceof File) {
    formData.append("background", apiRequest.background);
  }

  // AI Flyer Customization - Theme style
  if (apiRequest.themeStyle) {
    formData.append("themeStyle", String(apiRequest.themeStyle));
  }

  // Reservation config (bracket notation) - only for Reservation/Ticketing events
  if (apiRequest.cta && (apiRequest.cta === "Reservation" || apiRequest.cta === "Ticketing") && apiRequest.reservation_config) {
    formData.append("reservation_config[min_guests]", String(apiRequest.reservation_config.min_guests || 0));
    formData.append("reservation_config[max_guests]", String(apiRequest.reservation_config.max_guests || 0));
    formData.append("reservation_config[is_table_booking]", String(apiRequest.reservation_config.is_table_booking || false));
    formData.append("reservation_config[reservation_fee]", String(apiRequest.reservation_config.reservation_fee || 0));
  }

  // Reservation details (bracket notation)
  if (apiRequest.reservationDetails) {
    formData.append("reservationDetails[pricingType]", String(apiRequest.reservationDetails.pricingType || ""));
    formData.append("reservationDetails[price]", String(apiRequest.reservationDetails.price || 0));
    formData.append("reservationDetails[isFree]", String(apiRequest.reservationDetails.isFree || false));
  }

  // Reservation types (bracket notation)
  if (apiRequest.reservationTypes && Array.isArray(apiRequest.reservationTypes) && apiRequest.reservationTypes.length > 0) {
    apiRequest.reservationTypes.forEach((rt, index) => {
      if (rt.total_reservations !== undefined) formData.append(`reservationTypes[${index}][total_reservations]`, String(rt.total_reservations));
      if (rt.total_available !== undefined) formData.append(`reservationTypes[${index}][total_available]`, String(rt.total_available));
      if (rt.price !== undefined) formData.append(`reservationTypes[${index}][price]`, String(rt.price));
      if (rt.tierName) formData.append(`reservationTypes[${index}][tierName]`, rt.tierName);
      if (rt.type) formData.append(`reservationTypes[${index}][type]`, rt.type);
    });
  }

  // Ticket types (new format - bracket notation)
  if (apiRequest.ticketTypes && Array.isArray(apiRequest.ticketTypes) && apiRequest.ticketTypes.length > 0) {
    apiRequest.ticketTypes.forEach((ticket, index) => {
      formData.append(`ticketTypes[${index}][id]`, ticket.id || "");
      formData.append(`ticketTypes[${index}][ticket_name]`, ticket.ticket_name || "");
      formData.append(`ticketTypes[${index}][price]`, String(ticket.price ?? 0));
      formData.append(`ticketTypes[${index}][total_tickets]`, String(ticket.total_tickets ?? 0));
    });
  }

  // Benefits (shared format - bracket notation)
  if (apiRequest.benefits && Array.isArray(apiRequest.benefits) && apiRequest.benefits.length > 0) {
    apiRequest.benefits.forEach((benefit, index) => {
      formData.append(`benefits[${index}][id]`, benefit.id || "");
      formData.append(`benefits[${index}][title]`, benefit.title || "");
      formData.append(`benefits[${index}][description]`, benefit.description || "");
    });
  }

  // Agenda (new format - bracket notation)
  if (apiRequest.agenda && Array.isArray(apiRequest.agenda) && apiRequest.agenda.length > 0) {
    apiRequest.agenda.forEach((item, index) => {
      formData.append(`agenda[${index}][id]`, item.id || "");
      formData.append(`agenda[${index}][time]`, item.title || "");
      formData.append(`agenda[${index}][activity]`, item.description || "");
      formData.append(`agenda[${index}][event_id]`, item.event_id || "");
      formData.append(`agenda[${index}][agendaType]`, item.agendaType || "");
    });
  }

  // =====================================================
  // OLD FORMAT FIELDS (for backward compatibility)
  // =====================================================
  if (apiRequest.event_title) {
    formData.append("event_title", String(apiRequest.event_title));
  }
  if (apiRequest.about) {
    formData.append("about", String(apiRequest.about));
  }
  if (apiRequest.event_type) {
    formData.append("event_type", String(apiRequest.event_type));
  }
  if (apiRequest.event_class) {
    formData.append("event_class", String(apiRequest.event_class));
  }
  if (apiRequest.start_date) {
    formData.append("start_date", String(apiRequest.start_date));
  }
  if (apiRequest.end_date) {
    formData.append("end_date", String(apiRequest.end_date));
  }
  if (apiRequest.start_time) {
    formData.append("start_time", String(apiRequest.start_time));
  }
  if (apiRequest.end_time) {
    formData.append("end_time", String(apiRequest.end_time));
  }
  if (apiRequest.duration) {
    formData.append("duration", String(apiRequest.duration));
  }
  if (apiRequest.businesss_id) {
    formData.append("businesss_id", String(apiRequest.businesss_id));
  }
  if (apiRequest.flyer_url) {
    formData.append("flyer_url", String(apiRequest.flyer_url));
  }
  if (apiRequest.flyer_cta) {
    formData.append("flyer_cta", String(apiRequest.flyer_cta));
  }
  if (apiRequest.image_preference) {
    formData.append("image_preference", String(apiRequest.image_preference));
  }

  // Old format: flat tickets array (bracket notation)
  if (apiRequest.tickets && Array.isArray(apiRequest.tickets) && apiRequest.tickets.length > 0) {
    apiRequest.tickets.forEach((ticket, index) => {
      formData.append(`tickets[${index}][id]`, ticket.id || "");
      formData.append(`tickets[${index}][ticket_name]`, ticket.ticket_name || "");
      formData.append(`tickets[${index}][price]`, String(ticket.price ?? 0));
      formData.append(`tickets[${index}][total_tickets]`, String(ticket.total_tickets ?? 0));
    });
  }

  // Old format: flat agendas array (bracket notation)
  if (apiRequest.agendas && Array.isArray(apiRequest.agendas) && apiRequest.agendas.length > 0) {
    apiRequest.agendas.forEach((item, index) => {
      formData.append(`agendas[${index}][id]`, item.id || "");
      formData.append(`agendas[${index}][title]`, item.title || "");
      formData.append(`agendas[${index}][description]`, item.description || "");
      if (item.event_id) {
        formData.append(`agendas[${index}][event_id]`, item.event_id);
      }
      if (item.agendaType) {
        formData.append(`agendas[${index}][agendaType]`, item.agendaType);
      }
    });
  }

  console.log("🔧 [convertApiRequestToFormData] COMPLETE - Dual format FormData ready");
  logFormDataContents(formData, "Dual-Format Pre-Submission FormData");

  const formDataValidation = validateFormDataFieldsForFormData(formData);
  if (!formDataValidation.valid) {
    console.warn("⚠️  MISSING FORMDATA FIELDS:", formDataValidation.missingFields);
  } else {
    console.log("✅ All critical FormData fields are present and valid");
  }

  return formData;
}

export function validateApiRequest(apiRequest: Partial<CreateEventApiRequest>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  console.log("🔍 [validateApiRequest] Checking API request fields (dual format)...");

  // Required string fields validation (new format)
  const requiredFields: (keyof CreateEventApiRequest)[] = [
    "businessId",
    "businessCategory",
    "eventCategory",
    "eventType",
    "cta",
    "title",
    "description",
  ];

  requiredFields.forEach((field) => {
    const value = apiRequest[field];
    if (!value || String(value).trim() === "") {
      errors.push(`${field} is required (got: '${value}')`);
      console.error(`  ❌ ${field}: MISSING or EMPTY`);
    } else {
      console.log(`  ✅ ${field}: '${String(value).substring(0, 50)}${String(value).length > 50 ? '...' : ''}'`);
    }
  });

  // Also check old-format fields
  if (!apiRequest.event_title || String(apiRequest.event_title).trim() === "") {
    errors.push("event_title (old format) is required");
    console.error("  ❌ event_title: MISSING or EMPTY");
  } else {
    console.log(`  ✅ event_title: '${apiRequest.event_title}'`);
  }

  // Nested object validations
  if (!apiRequest.location?.address || String(apiRequest.location.address).trim() === "") {
    errors.push("Location address is required");
    console.error("  ❌ location.address: MISSING or EMPTY");
  } else {
    console.log(`  ✅ location.address: '${apiRequest.location.address}'`);
  }

  // ISO 8601 date format validation
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}$/;

  if (!apiRequest.dateDetails?.startDate || String(apiRequest.dateDetails.startDate).trim() === "") {
    errors.push("Start date is required");
    console.error("  ❌ dateDetails.startDate: MISSING or EMPTY");
  } else if (!iso8601Regex.test(String(apiRequest.dateDetails.startDate))) {
    errors.push(`Start date must be in ISO 8601 format (YYYY-MM-DD), got: '${apiRequest.dateDetails.startDate}'`);
    console.error(`  ❌ dateDetails.startDate: Invalid format '${apiRequest.dateDetails.startDate}'`);
  } else {
    console.log(`  ✅ dateDetails.startDate: '${apiRequest.dateDetails.startDate}'`);
  }

  if (!apiRequest.dateDetails?.endDate || String(apiRequest.dateDetails.endDate).trim() === "") {
    errors.push("End date is required");
    console.error("  ❌ dateDetails.endDate: MISSING or EMPTY");
  } else if (!iso8601Regex.test(String(apiRequest.dateDetails.endDate))) {
    errors.push(`End date must be in ISO 8601 format (YYYY-MM-DD), got: '${apiRequest.dateDetails.endDate}'`);
    console.error(`  ❌ dateDetails.endDate: Invalid format '${apiRequest.dateDetails.endDate}'`);
  } else {
    console.log(`  ✅ dateDetails.endDate: '${apiRequest.dateDetails.endDate}'`);
  }

  // Time format validation
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

  if (!apiRequest.dateDetails?.startTime || String(apiRequest.dateDetails.startTime).trim() === "") {
    errors.push("Start time is required");
    console.error("  ❌ dateDetails.startTime: MISSING or EMPTY");
  } else if (!timeRegex.test(String(apiRequest.dateDetails.startTime))) {
    errors.push(`Start time must be in HH:mm format (24-hour), got: '${apiRequest.dateDetails.startTime}'`);
    console.error(`  ❌ dateDetails.startTime: Invalid format '${apiRequest.dateDetails.startTime}'`);
  } else {
    console.log(`  ✅ dateDetails.startTime: '${apiRequest.dateDetails.startTime}'`);
  }

  if (!apiRequest.dateDetails?.endTime || String(apiRequest.dateDetails.endTime).trim() === "") {
    errors.push("End time is required");
    console.error("  ❌ dateDetails.endTime: MISSING or EMPTY");
  } else if (!timeRegex.test(String(apiRequest.dateDetails.endTime))) {
    errors.push(`End time must be in HH:mm format (24-hour), got: '${apiRequest.dateDetails.endTime}'`);
    console.error(`  ❌ dateDetails.endTime: Invalid format '${apiRequest.dateDetails.endTime}'`);
  } else {
    console.log(`  ✅ dateDetails.endTime: '${apiRequest.dateDetails.endTime}'`);
  }

  if (!apiRequest.dateDetails?.duration || String(apiRequest.dateDetails.duration).trim() === "") {
    errors.push("Duration is required");
    console.error("  ❌ dateDetails.duration: MISSING or EMPTY");
  } else {
    console.log(`  ✅ dateDetails.duration: '${apiRequest.dateDetails.duration}'`);
  }

  // Image validation
  // Backend expects EITHER 'image' (File) for uploads OR 'flyer_url' (string) for AI-generated
  // We don't use an 'images' array - it was causing validation errors
  const hasFlyerUrl = !!apiRequest.flyer_url;
  const hasFile = apiRequest.image instanceof File;
  
  if (!hasFlyerUrl && !hasFile) {
    errors.push("Event image is required (either uploaded file or flyer URL)");
    console.error("  ❌ flyer_url/image: Both missing - need at least one image source");
  } else {
    const sources = [];
    if (hasFlyerUrl) sources.push("flyer_url");
    if (hasFile) sources.push("File upload");
    console.log(`  ✅ Image source(s): ${sources.join(", ")}`);
  }

  console.log(`\n🔍 [validateApiRequest] Final result: ${errors.length === 0 ? '✅ VALID' : `❌ ${errors.length} ERRORS`}`);
  if (errors.length > 0) {
    console.error("❌ Validation errors to address:");
    errors.forEach((err, idx) => console.error(`  ${idx + 1}. ${err}`));
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
