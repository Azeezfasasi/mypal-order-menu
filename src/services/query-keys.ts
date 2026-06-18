// src/services/api/query-keys.ts (or in the api file)

import { EventType } from "@/types/enums";
import {
  OrderQueryParams,
  ReservationQueryParams,
  RevenueQueryParams,
  TransactionQueryParams,
} from "./api/business-overview-and-revenue-api";

import type { IPaginationOptions } from "@/types/event-types";

export const BUSINESS_QUERY_KEYS = {
  all: ["business"] as const,
  // Key for fetching details of the currently authenticated business
  current: () => ["currentBusiness"] as const,
  // Key for specific business details by ID (if needed elsewhere)
  details: () => [...BUSINESS_QUERY_KEYS.all, "detail"] as const,
  detail: (id: string | number) =>
    [...BUSINESS_QUERY_KEYS.details(), id] as const,
};

export const MEDIA_QUERY_KEYS = {
  all: ["media"] as const,
  // Key for the list of media associated with the current business
  businessList: () => ["businessMedia"] as const,
  // Key for specific media details by ID
  details: () => [...MEDIA_QUERY_KEYS.all, "detail"] as const,
  detail: (id: string | number) => [...MEDIA_QUERY_KEYS.details(), id] as const,
};

export const SHARED_ACTIVITY_QUERY_KEYS = {
  all: ["businessActivities"] as const,
  lists: () => [...SHARED_ACTIVITY_QUERY_KEYS.all, "list"] as const,
  likesList: () => [...SHARED_ACTIVITY_QUERY_KEYS.lists(), "likes"] as const,
  sharesList: () => [...SHARED_ACTIVITY_QUERY_KEYS.lists(), "shares"] as const,
  sharedActivityList: () =>
    [...SHARED_ACTIVITY_QUERY_KEYS.lists(), "sharedActivities"] as const,
  // Add detail keys if you ever need to fetch a single activity item by ID
  // detail: (id: string) => [...ACTIVITY_QUERY_KEYS.all, "detail", id] as const,
};

export const BUSINESS_ACTIVITY_QUERY_KEYS = {
  all: ["activities"] as const,
  businessList: () =>
    [...BUSINESS_ACTIVITY_QUERY_KEYS.all, "business-list"] as const,
  detail: (id: string | number) =>
    [...BUSINESS_ACTIVITY_QUERY_KEYS.all, "detail", id] as const,
} as const;

export const FINE_DINING_MENU_QUERY_KEYS = {
  all: ["fineDiningMenus"] as const,
  lists: () => [...FINE_DINING_MENU_QUERY_KEYS.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...FINE_DINING_MENU_QUERY_KEYS.lists(), { filters }] as const,
  details: () => [...FINE_DINING_MENU_QUERY_KEYS.all, "detail"] as const,
  detail: (id: string | number) =>
    [...FINE_DINING_MENU_QUERY_KEYS.details(), id] as const,
  businessMenus: () =>
    [...FINE_DINING_MENU_QUERY_KEYS.all, "business"] as const,
};

// Service Offering Query Keys
export const SERVICE_OFFERING_QUERY_KEYS = {
  all: ["serviceOfferings"] as const,
  // Category keys
  businessMenus: (businessCategory?: string) => [
    ...SERVICE_OFFERING_QUERY_KEYS.all,
    "businessMenus",
    businessCategory,
  ],

  // Service items keys
  serviceItems: () => [...SERVICE_OFFERING_QUERY_KEYS.all, "serviceItems"],
  serviceItem: (itemId: string) => [
    ...SERVICE_OFFERING_QUERY_KEYS.all,
    "serviceItems",
    itemId,
  ],

  // Accommodation keys
  accommodations: () => [...SERVICE_OFFERING_QUERY_KEYS.all, "accommodations"],
  accommodation: (id: string) => [
    ...SERVICE_OFFERING_QUERY_KEYS.all,
    "accommodations",
    id,
  ],
  businessAccommodations: (businessId?: string) => [
    ...SERVICE_OFFERING_QUERY_KEYS.all,
    "businessAccommodations",
    businessId,
  ],

  // Default attractions by business type (e.g., SHORTLET, BEACHESRESORTS, HOTELEXPERIENCE)
  defaultAttractions: (businessType?: string) => [
    ...SERVICE_OFFERING_QUERY_KEYS.all,
    "defaultAttractions",
    businessType,
  ],

  // Attraction keys
  attractions: () => ["serviceOfferings", "attractions"],
  attraction: (id: string) => ["serviceOfferings", "attractions", id],
};

export const TRANSACTION_QUERY_KEYS = {
  all: ["transactions"] as const,
  list: () => [...TRANSACTION_QUERY_KEYS.all, "list"] as const,
  detail: (id: string) =>
    [...TRANSACTION_QUERY_KEYS.all, "detail", id] as const,
  businessCharges: () =>
    [...TRANSACTION_QUERY_KEYS.all, "business-charges"] as const,
};

export const BUSINESS_EXPERIENCE_QUERY_KEYS = {
  all: ["businessExperiences"] as const,
  lists: () => [...BUSINESS_EXPERIENCE_QUERY_KEYS.all, "list"] as const,
  generalLists: () =>
    [...BUSINESS_EXPERIENCE_QUERY_KEYS.all, "general-list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...BUSINESS_EXPERIENCE_QUERY_KEYS.lists(), { filters }] as const,
  details: () => [...BUSINESS_EXPERIENCE_QUERY_KEYS.all, "detail"] as const,
  detail: (id: string | number) =>
    [...BUSINESS_EXPERIENCE_QUERY_KEYS.details(), id] as const,
};

export const BUSINESS_TICKET_QUERY_KEYS = {
  all: ["business-tickets"] as const,
  lists: () => [...BUSINESS_TICKET_QUERY_KEYS.all, "list"] as const,
  list: (filters: string) =>
    [...BUSINESS_TICKET_QUERY_KEYS.lists(), { filters }] as const,
  details: () => [...BUSINESS_TICKET_QUERY_KEYS.all, "detail"] as const,
  detail: (id: string) =>
    [...BUSINESS_TICKET_QUERY_KEYS.details(), id] as const,
};

// ============= QUERY KEYS =============
export const BUSINESS_OVERVIEW_QUERY_KEYS = {
  all: ["business-overview"] as const,

  // Reservations
  reservations: () =>
    [...BUSINESS_OVERVIEW_QUERY_KEYS.all, "reservations"] as const,
  reservationsList: (params?: ReservationQueryParams) =>
    [...BUSINESS_OVERVIEW_QUERY_KEYS.reservations(), "list", params] as const,
  reservationRevenues: (params: RevenueQueryParams) =>
    [
      ...BUSINESS_OVERVIEW_QUERY_KEYS.reservations(),
      "revenues",
      params,
    ] as const,

  // Transactions
  transactions: () =>
    [...BUSINESS_OVERVIEW_QUERY_KEYS.all, "transactions"] as const,
  transactionsList: (params?: TransactionQueryParams) =>
    [...BUSINESS_OVERVIEW_QUERY_KEYS.transactions(), "list", params] as const,
  transactionRevenues: (params: RevenueQueryParams) =>
    [
      ...BUSINESS_OVERVIEW_QUERY_KEYS.transactions(),
      "revenues",
      params,
    ] as const,

  orders: () => [...BUSINESS_OVERVIEW_QUERY_KEYS.all, "orders"] as const,
  ordersList: (params?: OrderQueryParams) =>
    [...BUSINESS_OVERVIEW_QUERY_KEYS.orders(), "list", params] as const,
  orderRevenues: (params?: RevenueQueryParams) =>
    [...BUSINESS_OVERVIEW_QUERY_KEYS.orders(), "revenues", params] as const,
} as const;

// ==================================
// Review Query Keys
// ==================================
export const REVIEWS_QUERY_KEYS = {
  all: ["reviews"] as const,
  businessList: (businessId: string) =>
    ["businessReviews", businessId] as const,
  details: () => [...REVIEWS_QUERY_KEYS.all, "detail"] as const,
  detail: (id: string) => [...REVIEWS_QUERY_KEYS.details(), id] as const,
  comments: (reviewId: string) =>
    [...REVIEWS_QUERY_KEYS.all, "comments", reviewId] as const,
  reactions: (reviewId: string) =>
    [...REVIEWS_QUERY_KEYS.all, "reactions", reviewId] as const,
  averageRating: (businessId: string) => ["averageRating", businessId] as const,
};

// ==================================
// Event Query Keys
// ==================================

export const EVENT_QUERY_KEYS = {
  // Base key
  all: ["events"] as const,

  // List queries
  lists: () => [...EVENT_QUERY_KEYS.all, "list"] as const,
  list: (options?: { type?: EventType; page?: number; limit?: number }) =>
    [...EVENT_QUERY_KEYS.lists(), { options }] as const,

  // Business events
  businessLists: () => [...EVENT_QUERY_KEYS.all, "business", "list"] as const,
  businessList: (options?: {
    eventType?: EventType;
    page?: number;
    limit?: number;
  }) => [...EVENT_QUERY_KEYS.businessLists(), { options }] as const,

  // Upcoming events
  upcomingLists: () => [...EVENT_QUERY_KEYS.all, "upcoming"] as const,
  upcoming: (type?: EventType) =>
    [...EVENT_QUERY_KEYS.upcomingLists(), { type }] as const,

  // Business upcoming events
  businessUpcomingLists: () =>
    [...EVENT_QUERY_KEYS.all, "business", "upcoming"] as const,
  businessUpcoming: (options?: {
    type?: EventType;
    page?: number;
    limit?: number;
  }) => [...EVENT_QUERY_KEYS.businessUpcomingLists(), { options }] as const,

  // Detail queries
  details: () => [...EVENT_QUERY_KEYS.all, "detail"] as const,
  detail: (id: string) => [...EVENT_QUERY_KEYS.details(), id] as const,

  // Tickets
  ticketsLists: () => [...EVENT_QUERY_KEYS.all, "tickets"] as const,
  tickets: (eventId: string, options?: IPaginationOptions) =>
    [...EVENT_QUERY_KEYS.ticketsLists(), eventId, { options }] as const,

  // Stats (if needed)
  stats: () => [...EVENT_QUERY_KEYS.all, "stats"] as const,
  businessStats: () => [...EVENT_QUERY_KEYS.all, "business", "stats"] as const,
} as const;

export const EVENT_RESERVATION_QUERY_KEYS = {
  all: ["eventReservations"] as const,
  list: (eventId: string) =>
    [...EVENT_RESERVATION_QUERY_KEYS.all, "list", eventId] as const,
  detail: (reservationId: string) =>
    [...EVENT_RESERVATION_QUERY_KEYS.all, "detail", reservationId] as const,
};

// ==================================
// Buffet Reservation Query Keys
// ==================================
export const BUFFET_RESERVATION_QUERY_KEYS = {
  all: ["buffetReservations"] as const,
  businessList: (params?: Record<string, unknown>) =>
    [...BUFFET_RESERVATION_QUERY_KEYS.all, "business", "list", params] as const,
  detail: (id: string) =>
    [...BUFFET_RESERVATION_QUERY_KEYS.all, "detail", id] as const,
};

// ==================================
// Buffet Availability Query Keys
// ==================================
export const BUFFET_AVAILABILITY_QUERY_KEYS = {
  // Base key for buffet availability queries
  all: ["buffet-availability-all"] as const,
  // list with optional params
  list: (params?: Record<string, unknown>) =>
    [...BUFFET_AVAILABILITY_QUERY_KEYS.all, params] as const,
};

// ==================================
// Deal Query Keys
// ==================================
export const DEAL_QUERY_KEYS = {
  // Base key
  all: ["deals"] as const,

  // List queries
  lists: () => [...DEAL_QUERY_KEYS.all, "list"] as const,
  list: (options?: { page?: number; limit?: number }) =>
    [...DEAL_QUERY_KEYS.lists(), { options }] as const,

  // Business deals
  businessLists: () => [...DEAL_QUERY_KEYS.all, "business", "list"] as const,
  businessList: (options?: { page?: number; limit?: number }) =>
    [...DEAL_QUERY_KEYS.businessLists(), { options }] as const,

  // Upcoming deals
  upcomingLists: () => [...DEAL_QUERY_KEYS.all, "upcoming"] as const,
  upcoming: () => [...DEAL_QUERY_KEYS.upcomingLists()] as const,

  // Business upcoming deals
  businessUpcomingLists: () =>
    [...DEAL_QUERY_KEYS.all, "business", "upcoming"] as const,
  businessUpcoming: (options?: { page?: number; limit?: number }) =>
    [...DEAL_QUERY_KEYS.businessUpcomingLists(), { options }] as const,

  // Detail queries
  details: () => [...DEAL_QUERY_KEYS.all, "detail"] as const,
  detail: (id: string) => [...DEAL_QUERY_KEYS.details(), id] as const,
} as const;

// Delivery Query Keys
export const DELIVERY_QUERY_KEYS = {
  all: ["delivery"] as const,

  // Zones
  zones: () => [...DELIVERY_QUERY_KEYS.all, "zones"] as const,
  zonesList: () => [...DELIVERY_QUERY_KEYS.zones(), "list"] as const,
  zonesDetail: () => [...DELIVERY_QUERY_KEYS.zones(), "detail"] as const,
  zone: (id: string) => [...DELIVERY_QUERY_KEYS.zonesDetail(), id] as const,

  // Riders
  riders: () => [...DELIVERY_QUERY_KEYS.all, "riders"] as const,
  ridersList: () => [...DELIVERY_QUERY_KEYS.riders(), "list"] as const,
  ridersDetail: () => [...DELIVERY_QUERY_KEYS.riders(), "detail"] as const,
  rider: (id: string) => [...DELIVERY_QUERY_KEYS.ridersDetail(), id] as const,

  // Orders
  orders: () => [...DELIVERY_QUERY_KEYS.all, "orders"] as const,
  ordersList: (filters?: Record<string, unknown>) =>
    [...DELIVERY_QUERY_KEYS.orders(), "list", { filters }] as const,
  ordersDetail: () => [...DELIVERY_QUERY_KEYS.orders(), "detail"] as const,
  order: (id: string) => [...DELIVERY_QUERY_KEYS.ordersDetail(), id] as const,

  // Analytics
  analytics: () => [...DELIVERY_QUERY_KEYS.all, "analytics"] as const,
  analyticsList: () => [...DELIVERY_QUERY_KEYS.analytics(), "list"] as const,
  statsList: () => [...DELIVERY_QUERY_KEYS.analytics(), "stats"] as const,
} as const;
