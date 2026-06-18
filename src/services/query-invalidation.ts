// src/services/api/utils/query-invalidation.ts

import { QueryClient } from "@tanstack/react-query";

// Define invalidation key prefixes as constants to avoid typos
const EVENT_INVALIDATION_KEYS = {
  BUSINESS_LIST: ["events", "business", "list"] as const,
  BUSINESS_UPCOMING: ["events", "business", "upcoming"] as const,
  GENERAL_LIST: ["events", "list"] as const,
  UPCOMING: ["events", "upcoming"] as const,
  DETAIL: ["events", "detail"] as const,
  TICKETS: ["events", "tickets"] as const,
} as const;

// Type for available invalidation operations
type EventInvalidationOptions = {
  /** Remove specific event from cache (for delete operations) */
  removeEvent?: string;
  /** Invalidate specific event detail (for update operations) */
  invalidateEvent?: string;
  /** Whether to invalidate business-related queries */
  business?: boolean;
  /** Whether to invalidate general public queries */
  general?: boolean;
  /** Whether to invalidate upcoming event queries */
  upcoming?: boolean;
  /** Whether to invalidate ticket queries */
  tickets?: boolean;
};

/**
 * Utility function to invalidate event-related queries
 * @param queryClient - React Query client instance
 * @param options - Configuration for what to invalidate
 */
export const invalidateEventQueries = (
  queryClient: QueryClient,
  options: EventInvalidationOptions = {}
) => {
  const {
    removeEvent,
    invalidateEvent,
    business = true,
    general = true,
    upcoming = true,
    tickets = false,
  } = options;

  // Remove specific event from cache (for deletions)
  if (removeEvent) {
    queryClient.removeQueries({
      queryKey: [...EVENT_INVALIDATION_KEYS.DETAIL, removeEvent],
    });
  }

  // Invalidate specific event detail (for updates)
  if (invalidateEvent) {
    queryClient.invalidateQueries({
      queryKey: [...EVENT_INVALIDATION_KEYS.DETAIL, invalidateEvent],
    });
  }

  // Invalidate business-related queries
  if (business) {
    queryClient.invalidateQueries({
      queryKey: EVENT_INVALIDATION_KEYS.BUSINESS_LIST,
      exact: false,
    });

    if (upcoming) {
      queryClient.invalidateQueries({
        queryKey: EVENT_INVALIDATION_KEYS.BUSINESS_UPCOMING,
        exact: false,
      });
    }
  }

  // Invalidate general public queries
  if (general) {
    queryClient.invalidateQueries({
      queryKey: EVENT_INVALIDATION_KEYS.GENERAL_LIST,
      exact: false,
    });

    if (upcoming) {
      queryClient.invalidateQueries({
        queryKey: EVENT_INVALIDATION_KEYS.UPCOMING,
        exact: false,
      });
    }
  }

  // Invalidate ticket queries if needed
  if (tickets) {
    queryClient.invalidateQueries({
      queryKey: EVENT_INVALIDATION_KEYS.TICKETS,
      exact: false,
    });
  }
};

/**
 * Preset invalidation configurations for common operations
 */
export const EventInvalidationPresets = {
  /** For when a new event is created */
  CREATE: {
    business: true,
    general: true,
    upcoming: true,
  } as EventInvalidationOptions,

  /** For when an event is updated */
  UPDATE: (eventId: string) =>
    ({
      invalidateEvent: eventId,
      business: true,
      general: true,
      upcoming: true,
    } as EventInvalidationOptions),

  /** For when an event is deleted */
  DELETE: (eventId: string) =>
    ({
      removeEvent: eventId,
      business: true,
      general: true,
      upcoming: true,
    } as EventInvalidationOptions),

  /** For ticket-related operations */
  TICKETS: (eventId?: string) =>
    ({
      invalidateEvent: eventId,
      tickets: true,
      business: false,
      general: false,
      upcoming: false,
    } as EventInvalidationOptions),
} as const;

// Export the keys for reference/debugging
export { EVENT_INVALIDATION_KEYS };

// usage

// // How to Use invalidateEventQueries

//    onSuccess: (data, eventId) => {
//           toast.success(data.message || "Event deleted successfully.");

//           // Use the utility function with DELETE preset
//           invalidateEventQueries(queryClient, EventInvalidationPresets.DELETE(eventId));
//         },

// 1. Basic Usage with Presets (Recommended)
// typescript// For create operations
// invalidateEventQueries(queryClient, EventInvalidationPresets.CREATE);

// // For update operations
// invalidateEventQueries(queryClient, EventInvalidationPresets.UPDATE(eventId));

// // For delete operations
// invalidateEventQueries(queryClient, EventInvalidationPresets.DELETE(eventId));
// 2. Custom Configuration
// typescript// Only invalidate business queries
// invalidateEventQueries(queryClient, {
//   business: true,
//   general: false,
//   upcoming: false,
// });

// // Only invalidate tickets for a specific event
// invalidateEventQueries(queryClient, {
//   invalidateEvent: eventId,
//   tickets: true,
//   business: false,
//   general: false,
//   upcoming: false,
// });

// // Minimal invalidation for minor updates
// invalidateEventQueries(queryClient, {
//   invalidateEvent: eventId, // Only refresh the specific event
// });
// 3. Available Keys Reference
// You can import and inspect the available keys:
// typescriptimport { EVENT_INVALIDATION_KEYS } from './utils/query-invalidation';

// console.log(EVENT_INVALIDATION_KEYS);
// // {
// //   BUSINESS_LIST: ["events", "business", "list"],
// //   BUSINESS_UPCOMING: ["events", "business", "upcoming"],
// //   GENERAL_LIST: ["events", "list"],
// //   UPCOMING: ["events", "upcoming"],
// //   DETAIL: ["events", "detail"],
// //   TICKETS: ["events", "tickets"]
// // }
