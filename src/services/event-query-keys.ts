// src/services/api/keys/event-query-keys.ts
// UNIFIED SYSTEM: Same keys used for both queries AND invalidation

import { EventType } from "@/types/enums";
import type { IPaginationOptions } from "@/types/event-types";

/**
 * Centralized Event Query Keys
 * These EXACT keys are used for both:
 * 1. Query hook queryKey
 * 2. Query invalidation
 */
export const EVENT_QUERY_KEYS = {
  // Base event key
  all: () => ["events"] as const,

  // ===== LIST QUERIES =====
  // General event lists
  lists: () => [...EVENT_QUERY_KEYS.all(), "list"] as const,
  list: (options?: { type?: EventType; page?: number; limit?: number }) =>
    [...EVENT_QUERY_KEYS.lists(), { options }] as const,

  // Business event lists
  businessLists: () => [...EVENT_QUERY_KEYS.all(), "business", "list"] as const,
  businessList: (options?: {
    eventType?: EventType;
    page?: number;
    limit?: number;
  }) => [...EVENT_QUERY_KEYS.businessLists(), { options }] as const,

  // ===== UPCOMING QUERIES =====
  // General upcoming events
  upcomingLists: () => [...EVENT_QUERY_KEYS.all(), "upcoming"] as const,
  upcoming: (type?: EventType) =>
    [...EVENT_QUERY_KEYS.upcomingLists(), { type }] as const,

  // Business upcoming events
  businessUpcomingLists: () =>
    [...EVENT_QUERY_KEYS.all(), "business", "upcoming"] as const,
  businessUpcoming: (options?: {
    type?: EventType;
    page?: number;
    limit?: number;
  }) => [...EVENT_QUERY_KEYS.businessUpcomingLists(), { options }] as const,

  // ===== DETAIL QUERIES =====
  details: () => [...EVENT_QUERY_KEYS.all(), "detail"] as const,
  detail: (id: string) => [...EVENT_QUERY_KEYS.details(), id] as const,

  // ===== TICKETS QUERIES =====
  ticketsLists: () => [...EVENT_QUERY_KEYS.all(), "tickets"] as const,
  tickets: (eventId: string, options?: IPaginationOptions) =>
    [...EVENT_QUERY_KEYS.ticketsLists(), eventId, { options }] as const,
} as const;

/**
 * Query Key Extractors
 * These functions extract the base keys for invalidation
 * They ensure invalidation targets the EXACT same key structure as queries
 */
export const EVENT_INVALIDATION_KEYS = {
  // Extract base keys for invalidation (without parameters)
  ALL_LISTS: () => EVENT_QUERY_KEYS.lists(),
  ALL_BUSINESS_LISTS: () => EVENT_QUERY_KEYS.businessLists(),
  ALL_UPCOMING: () => EVENT_QUERY_KEYS.upcomingLists(),
  ALL_BUSINESS_UPCOMING: () => EVENT_QUERY_KEYS.businessUpcomingLists(),
  ALL_DETAILS: () => EVENT_QUERY_KEYS.details(),
  ALL_TICKETS: () => EVENT_QUERY_KEYS.ticketsLists(),

  // Specific invalidation keys
  SPECIFIC_DETAIL: (id: string) => EVENT_QUERY_KEYS.detail(id),
  SPECIFIC_TICKETS: (eventId: string) => EVENT_QUERY_KEYS.tickets(eventId),
} as const;

/**
 * Type-safe invalidation utility
 * Uses the EXACT same key functions as queries
 */
import { QueryClient } from "@tanstack/react-query";

export const invalidateEventQueries = (
  queryClient: QueryClient,
  options: {
    /** Invalidate all general event lists */
    lists?: boolean;
    /** Invalidate all business event lists */
    businessLists?: boolean;
    /** Invalidate all upcoming events */
    upcoming?: boolean;
    /** Invalidate all business upcoming events */
    businessUpcoming?: boolean;
    /** Invalidate specific event detail */
    eventDetail?: string;
    /** Remove specific event detail (for delete) */
    removeEventDetail?: string;
    /** Invalidate tickets for specific event */
    eventTickets?: string;
  }
) => {
  const {
    lists,
    businessLists,
    upcoming,
    businessUpcoming,
    eventDetail,
    removeEventDetail,
    eventTickets,
  } = options;

  // Invalidate general lists
  if (lists) {
    queryClient.invalidateQueries({
      queryKey: EVENT_INVALIDATION_KEYS.ALL_LISTS(),
      exact: false, // This catches all variations with parameters
    });
  }

  // Invalidate business lists
  if (businessLists) {
    queryClient.invalidateQueries({
      queryKey: EVENT_INVALIDATION_KEYS.ALL_BUSINESS_LISTS(),
      exact: false,
    });
  }

  // Invalidate upcoming events
  if (upcoming) {
    queryClient.invalidateQueries({
      queryKey: EVENT_INVALIDATION_KEYS.ALL_UPCOMING(),
      exact: false,
    });
  }

  // Invalidate business upcoming events
  if (businessUpcoming) {
    queryClient.invalidateQueries({
      queryKey: EVENT_INVALIDATION_KEYS.ALL_BUSINESS_UPCOMING(),
      exact: false,
    });
  }

  // Invalidate specific event detail
  if (eventDetail) {
    queryClient.invalidateQueries({
      queryKey: EVENT_INVALIDATION_KEYS.SPECIFIC_DETAIL(eventDetail),
    });
  }

  // Remove specific event detail (for delete)
  if (removeEventDetail) {
    queryClient.removeQueries({
      queryKey: EVENT_INVALIDATION_KEYS.SPECIFIC_DETAIL(removeEventDetail),
    });
  }

  // Invalidate event tickets
  if (eventTickets) {
    queryClient.invalidateQueries({
      queryKey: EVENT_INVALIDATION_KEYS.SPECIFIC_TICKETS(eventTickets),
      exact: false,
    });
  }
};

/**
 * Pre-configured invalidation presets
 * These use the same key functions to guarantee consistency
 */
export const EventInvalidationPresets = {
  CREATE: {
    lists: true,
    businessLists: true,
    upcoming: true,
    businessUpcoming: true,
  },

  UPDATE: (eventId: string) => ({
    eventDetail: eventId,
    lists: true,
    businessLists: true,
    upcoming: true,
    businessUpcoming: true,
  }),

  DELETE: (eventId: string) => ({
    removeEventDetail: eventId,
    lists: true,
    businessLists: true,
    upcoming: true,
    businessUpcoming: true,
  }),

  TICKETS_ONLY: (eventId: string) => ({
    eventDetail: eventId,
    eventTickets: eventId,
  }),
} as const;
