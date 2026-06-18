import { ContextType, EventClass, EventType } from "@/types/enums";

export type Step = "basic" | "datetime" | "tickets" | "additional";

export interface StepErrors {
  [stepName: string]: {
    [fieldName: string]: string;
  };
}

export interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventType: EventType | null;
  eventClass: EventClass | null;
}

export interface EventFormTicket {
  id?: string; // Optional ID for existing tickets in edit mode.
  ticket_name: string;
  price: number;
  total_tickets: number; // Total number of tickets available
}

export interface EventFormBenefit {
  id?: string; // Optional ID for existing benefits in edit mode
  title: string;
  description: string;
}

export interface EventFormAgenda {
  id?: string; // Optional ID for existing agendas in edit mode
  title: string;
  description: string;
  event_id?: string;
  agendaType: ContextType;
}

export type FlyerCallToAction =
  | "place_order"
  | "make_reservation"
  | "buy_tickets"
  | "plain_informative";

export interface LocationDetails {
  address: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export interface DateDetails {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  duration?: string;
}

export interface ReservationConfig {
  tablesAvailable?: boolean;
  sectionsAvailable?: boolean;
  minPartySize?: number;
  maxPartySize?: number;
}

export interface ReservationDetails {
  pricingType: "per_individual" | "per_table" | "per_section";
  price: number;
  isFree?: boolean;
}

export interface EventFormValues {
  // Step 1: Basic Information
  event_title: string;
  business_name?: string;
  business_category?: string; // API: businessCategory (required)
  location: string; // Internal form use (address string)
  location_details?: LocationDetails; // API: location (object)
  event_type: EventType;
  event_class: EventClass;
  event_group?: string; // API field: "Informative" | "Fine Dining" | "Buffet" | "Ticketing" | "Clubbing"
  cta?: string; // API field: "None" | "Reservation" | "Ticketing" (required)
  
  // Flyer/Marketing fields (maps to API event_* fields)
  main_catch?: string; // Maps to: event_main_catch (from EventMainCatch enum: FOOD, DRINKS, ACCOMMODATION, etc.)
  about_main_catch?: string; // Maps to: event_about_main_catch
  event_caption?: string; // Internal only - clarify usage
  event_description?: string; // Internal only - clarify usage
  catchy_phrase?: string; // Maps to: event_catchy_phrase
  event_attractions: string[]; // Internal only - clarify usage
  event_gate_pass?: string; // Maps to: event_gate_pass (used for flyers)
  event_is_likeable?: boolean; // Maps to: event_is_likeable
  event_is_shareable?: boolean; // Maps to: event_is_shareable
  event_offer_text?: string; // Maps to: event_offer_text
  
  // Description fields
  about: string; // Maps to: description (API required)
  refine_description: boolean; // API field: refine_description
  is_eighten_plus: boolean;
  drink_responsibly: boolean; // Internal toggle for display
  
  // Image/Flyer handling
  image?: File; // Upload preference: raw file
  images?: string[]; // API field: images (array of URLs)
  image_preference: "upload" | "generate" | "keep"; // Internal: user's preference
  image_prompt?: string; // API field: Custom AI image prompt. Sent directly to the image model with no modification. Takes precedence over background_uri and auto-generated prompts.
  flyer_cta?: FlyerCallToAction; // AI flyer CTA
  flyer_url?: string; // AI-generated image URL
  
  // AI Flyer Customization
  flyer_logo?: File; // Optional business logo to overlay on the flyer
  flyer_background?: File; // Optional background image for the flyer base layer
  flyer_theme_style?: string; // Thematic style for background generation (e.g., "modern", "vintage", "minimalist")

  // Step 2: Date and Time (optional for navigation)
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  duration?: string;
  date_details?: DateDetails; // API: dateDetails (structured)
  event_frequency?: string; // Event recurrence frequency
  price_per_individual?: number; // Price per individual for fine dining events (API: reservationDetails.price)

  // Buffet Gate Pass & Access Control
  gate_pass_type?: "free" | "paid"; // Free Entry or Paid Entry
  has_adult_ticket?: boolean; // Whether to include adult ticket pricing
  adult_ticket_price?: number; // Adult ticket price
  has_child_ticket?: boolean; // Whether to include child ticket pricing
  child_ticket_price?: number; // Child ticket price

  // Reservation config (for exclusive events)
  reservation_config?: ReservationConfig;

  // Step 3: Tickets
  tickets: EventFormTicket[];
  ticket_types?: EventFormTicket[]; // Alias for API naming

  // Step 4: Additional Details
  benefits: EventFormBenefit[];
  agendas: EventFormAgenda[];
}

export interface StepConfig {
  id: Step;
  title: string;
  fields: (keyof EventFormValues)[];
}

export interface StepValidationResult {
  canProceed: boolean;
  validationMessage: string;
}

export interface UseStepErrorsReturn {
  stepErrors: StepErrors;
  validateAllSteps: (data: EventFormValues, isSubmitting?: boolean) => Promise<StepErrors>;
  clearStepErrors: () => void;
  clearFormErrors: () => void;
  clearAllErrors: () => void;
  getStepErrorCount: (step: Step) => number;
  setFormErrorsFromStepErrors: () => void;
}

export interface UseStepNavigationReturn {
  currentStep: Step;
  availableSteps: Step[];
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: Step) => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  getStepIndex: (step?: Step) => number;
  getProgress: () => number;
}

export interface UseEventSubmissionReturn {
  onSubmit: (data: EventFormValues) => Promise<void>;
  isSubmitting: boolean;
}

export type FormMode = "create" | "edit";

export interface EventSubmissionOptions {
  mode?: FormMode;
  eventId?: string; // Used in edit mode
}

/**
 * API Request DTO (Data Transfer Object)
 * Represents the exact shape of data sent to the backend API
 */
export interface CreateEventApiRequest {
  businessId?: string;
  businessCategory: string;
  eventCategory: "Regular Event" | "Exclusive Event";
  event_group?: string;
  eventType: string;
  cta: "None" | "Reservation" | "Ticketing";
  title: string;
  description: string;
  images?: string[];
  image?: File;
  dateDetails: DateDetails;
  location: LocationDetails;
  refine_description?: boolean;
  // Additional event details
  event_main_catch?: string;
  event_about_main_catch?: string;
  event_gate_pass?: string;
  event_catchy_phrase?: string;
  event_is_likeable?: boolean;
  event_is_shareable?: boolean;
  event_offer_text?: string;
  event_frequency?: string;
  // Reservation and booking
  reservation_config?: {
    min_guests?: number;
    max_guests?: number;
    is_table_booking?: boolean;
    reservation_fee?: number;
  };
  ticketTypes?: EventFormTicket[];
  benefits?: EventFormBenefit[];
  agenda?: EventFormAgenda[];
  reservationDetails?: ReservationDetails;
  // Adult and child ticket prices for buffet/restaurant events
  adult_ticket_price?: number;
  child_ticket_price?: number;
  reservationTypes?: Array<{
    total_reservations?: number;
    total_available?: number;
    price?: number;
    tierName?: string;
    type?: string;
  }>;

  // =====================================================
  // OLD-FORMAT FIELDS for backward compatibility
  // The backend may still expect these flat field names
  // =====================================================
  event_title?: string;
  about?: string;
  event_type?: string;
  event_class?: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  duration?: string;
  businesss_id?: string;
  flyer_url?: string;
  image_prompt?: string; // Custom AI image prompt - takes precedence over background_uri and auto-generated prompts
  flyer_cta?: string;
  image_preference?: "upload" | "generate" | "keep";
  // Old-format flat tickets array (same shape as ticketTypes)
  tickets?: EventFormTicket[];
  // Old-format flat agendas array (same shape as agenda items)
  agendas?: EventFormAgenda[];
  
  // =====================================================
  // AI FLYER CUSTOMIZATION FIELDS
  // Optional fields for customizing AI-generated flyers
  // =====================================================
  logo?: File | string; // Optional business logo to overlay on flyer (File for upload, string for URL)
  background?: File | string; // Optional background image for flyer (File for upload, string for URL)
  themeStyle?: string; // Thematic style for background generation
  imagePrompt?: string; // Custom AI image prompt - takes precedence over background_uri and auto-generated prompts
}
