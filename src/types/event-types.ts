// src/types/event-types.ts

import { IBusiness } from "./auth-types";
import { ContextType, EventClass, EventType } from "./enums";
import { IEventReservation } from "./event-reservation-types";

// ==================================
// Base Interfaces
// ==================================

export interface LocationDetails {
  address: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export interface IEventTicketBenefit {
  id: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEventTicket {
  id: string;
  ticket_name: string;
  price: number;
  benefits: IEventTicketBenefit[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IEventBenefit {
  id: string;
  title?: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEventAgenda {
  id: string;
  title: string;
  description?: string;
  agendaType: ContextType;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEvent {
  id: string;
  event_title: string;
  location: string | LocationDetails;
  event_type: EventType;
  event_class: EventClass;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  duration: string;
  about: string;
  flyer_url: string;
  is_eighten_plus: boolean;
  is_verified: boolean;
  business: IBusiness;
  tickets: IEventTicket[];
  benefits: IEventBenefit[];
  agendas: IEventAgenda[];
  eventreservations: IEventReservation[]; // Define proper type based on your EventReservation entity
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// Simplified version for list views
export interface IEventListItem {
  id: string;
  event_title: string;
  location: string | LocationDetails;
  event_type: EventType;
  event_class: EventClass;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  duration: string;
  about: string;
  flyer_url: string;
  is_eighten_plus: boolean;
  is_verified: boolean;
  business: IBusiness;
  tickets: IEventTicket[];
  benefits: IEventBenefit[];
  eventreservations: IEventReservation[]; // Define proper type based on your EventReservation entity
  agendas: IEventAgenda[];
  createdAt: Date;
  updatedAt: Date;
}

// ==================================
// DTO Interfaces (for API requests)
// ==================================

export interface ICreateEventTicketDto {
  id?: string; // Optional for updates
  ticket_name: string;
  price: number;
  benefits?: ICreateEventTicketBenefitDto[];
}

export interface ICreateEventTicketBenefitDto {
  id?: string; // Optional for updates
  description: string;
}

export interface ICreateEventBenefitDto {
  id?: string; // Optional for updates
  title?: string;
  description: string;
}

export interface ICreateEventAgendaDto {
  id?: string; // Optional for updates
  title: string;
  description?: string;
  event_id: string;
}

export interface ICreateEventDto {
  event_title: string;
  location: string;
  event_type: EventType;
  event_class: EventClass;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  duration: string;
  about: string;
  refine_description: boolean;
  is_eighten_plus: boolean;
  image?: File; // Now optional because we can use either image or flyer_url
  businesss_id?: string; // Optional for admin
  tickets?: ICreateEventTicketDto[];
  benefits?: ICreateEventBenefitDto[];
  agendas?: ICreateEventAgendaDto[];
  // New fields for AI flyer generation
  image_preference?: "upload" | "generate" | "keep"; // User's preference for uploading, generating image, or keeping existing
  flyer_prompt?: string; // Prompt used to generate the flyer
  flyer_cta?: string; // Call-to-action button for flyer
  flyer_url?: string; // URL of the AI-generated flyer
}

export interface IUpdateEventDto {
  event_title?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  duration?: string;
  about?: string;
  refine_description?: boolean;
  is_eighten_plus?: boolean;
  image?: File;
  tickets?: ICreateEventTicketDto[];
  benefits?: ICreateEventBenefitDto[];
  agendas?: ICreateEventAgendaDto[];
  // New fields for AI flyer generation
  image_preference?: "upload" | "generate" | "keep";
  flyer_prompt?: string;
  flyer_cta?: string;
  flyer_url?: string;
}

// ==================================
// API Response Interfaces
// ==================================

export interface IPaginationOptions {
  page?: number;
  limit?: number;
}

// ==================================
// Filter/Query Interfaces
// ==================================

export interface IEventFilters {
  type?: EventType;
  class?: EventClass;
  location?: string;
  startDate?: string;
  endDate?: string;
  isEighteenPlus?: boolean;
  isVerified?: boolean;
}

export interface IEventQueryOptions extends IPaginationOptions {
  filters?: IEventFilters;
  sortBy?: "start_date" | "end_date" | "createdAt" | "event_title";
  sortOrder?: "ASC" | "DESC";
}

// ==================================
// Form Interfaces (for UI components)
// ==================================

export interface IEventFormData {
  event_title: string;
  location: string;
  event_type: EventType;
  event_class: EventClass;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  duration: string;
  about: string;
  is_eighten_plus: boolean;
  image?: File | null;
  tickets: IEventTicketFormData[];
  benefits: IEventBenefitFormData[];
  agendas: IEventAgendaFormData[];
}

export interface IEventTicketFormData {
  id?: string;
  ticket_name: string;
  price: string; // String for form input
  benefits: IEventTicketBenefitFormData[];
}

export interface IEventTicketBenefitFormData {
  id?: string;
  description: string;
}

export interface IEventBenefitFormData {
  id?: string;
  title: string;
  description: string;
}

export interface IEventAgendaFormData {
  id?: string;
  title: string;
  description: string;
}

// ==================================
// Utility Types
// ==================================

export type EventStatus = "upcoming" | "ongoing" | "completed" | "cancelled";

export interface IEventWithStatus extends IEvent {
  status: EventStatus;
  daysUntilEvent?: number;
}

export interface IEventStats {
  totalEvents: number;
  upcomingEvents: number;
  ticketEvents: number;
  reservationEvents: number;
  informativeEvents: number;
  exclusiveEvents: number;
  regularEvents: number;
}

// ==================================
// Component Props Types
// ==================================

export interface IEventCardProps {
  event: IEventListItem;
  onView?: (eventId: string) => void;
  onEdit?: (eventId: string) => void;
  onDelete?: (eventId: string) => void;
  showActions?: boolean;
  variant?: "default" | "compact" | "detailed";
}

export interface IEventListProps {
  events: IEventListItem[];
  loading?: boolean;
  error?: string;
  onEventClick?: (eventId: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  emptyMessage?: string;
}

export interface IEventFormProps {
  initialData?: IEvent;
  onSubmit: (data: ICreateEventDto | IUpdateEventDto) => void;
  onCancel: () => void;
  loading?: boolean;
  mode: "create" | "edit";
}
