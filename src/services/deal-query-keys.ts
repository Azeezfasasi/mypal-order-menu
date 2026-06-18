// src/services/deal-query-keys.ts
// UNIFIED SYSTEM: Same keys used for both queries AND invalidation

/**
 * Centralized Deal Query Keys
 * These EXACT keys are used for both:
 * 1. Query hook queryKey
 * 2. Query invalidation
 */
export const DEAL_QUERY_KEYS = {
  // Base deal key
  all: () => ["deals"] as const,

  // ===== LIST QUERIES =====
  // General deal lists
  lists: () => [...DEAL_QUERY_KEYS.all(), "list"] as const,
  list: (options?: { page?: number; limit?: number }) =>
    [...DEAL_QUERY_KEYS.lists(), { options }] as const,

  // Business deal lists
  businessLists: () => [...DEAL_QUERY_KEYS.all(), "business", "list"] as const,
  businessList: (options?: { page?: number; limit?: number }) =>
    [...DEAL_QUERY_KEYS.businessLists(), { options }] as const,

  // ===== UPCOMING QUERIES =====
  // General upcoming deals
  upcomingLists: () => [...DEAL_QUERY_KEYS.all(), "upcoming"] as const,
  upcoming: () => [...DEAL_QUERY_KEYS.upcomingLists()] as const,

  // Business upcoming deals
  businessUpcomingLists: () =>
    [...DEAL_QUERY_KEYS.all(), "business", "upcoming"] as const,
  businessUpcoming: (options?: { page?: number; limit?: number }) =>
    [...DEAL_QUERY_KEYS.businessUpcomingLists(), { options }] as const,

  // ===== DETAIL QUERIES =====
  details: () => [...DEAL_QUERY_KEYS.all(), "detail"] as const,
  detail: (id: string) => [...DEAL_QUERY_KEYS.details(), id] as const,
} as const;

/**
 * Query Key Extractors
 * These functions extract the base keys for invalidation
 * They ensure invalidation targets the EXACT same key structure as queries
 */
export const DEAL_INVALIDATION_KEYS = {
  // Extract base keys for invalidation (without parameters)
  ALL_LISTS: () => DEAL_QUERY_KEYS.lists(),
  ALL_BUSINESS_LISTS: () => DEAL_QUERY_KEYS.businessLists(),
  ALL_UPCOMING: () => DEAL_QUERY_KEYS.upcomingLists(),
  ALL_BUSINESS_UPCOMING: () => DEAL_QUERY_KEYS.businessUpcomingLists(),
  ALL_DETAILS: () => DEAL_QUERY_KEYS.details(),

  // Specific invalidation keys
  SPECIFIC_DETAIL: (id: string) => DEAL_QUERY_KEYS.detail(id),
} as const;

/**
 * Type-safe invalidation utility
 * Uses the EXACT same key functions as queries
 */
import { QueryClient } from "@tanstack/react-query";

export const invalidateDealQueries = (
  queryClient: QueryClient,
  options: {
    /** Invalidate all general deal lists */
    lists?: boolean;
    /** Invalidate all business deal lists */
    businessLists?: boolean;
    /** Invalidate all upcoming deals */
    upcoming?: boolean;
    /** Invalidate all business upcoming deals */
    businessUpcoming?: boolean;
    /** Invalidate specific deal detail */
    dealDetail?: string;
    /** Remove specific deal detail (for delete) */
    removeDealDetail?: string;
  }
) => {
  const {
    lists,
    businessLists,
    upcoming,
    businessUpcoming,
    dealDetail,
    removeDealDetail,
  } = options;

  // Invalidate general lists
  if (lists) {
    queryClient.invalidateQueries({
      queryKey: DEAL_INVALIDATION_KEYS.ALL_LISTS(),
      exact: false, // This catches all variations with parameters
    });
  }

  // Invalidate business lists
  if (businessLists) {
    queryClient.invalidateQueries({
      queryKey: DEAL_INVALIDATION_KEYS.ALL_BUSINESS_LISTS(),
      exact: false,
    });
  }

  // Invalidate upcoming deals
  if (upcoming) {
    queryClient.invalidateQueries({
      queryKey: DEAL_INVALIDATION_KEYS.ALL_UPCOMING(),
      exact: false,
    });
  }

  // Invalidate business upcoming deals
  if (businessUpcoming) {
    queryClient.invalidateQueries({
      queryKey: DEAL_INVALIDATION_KEYS.ALL_BUSINESS_UPCOMING(),
      exact: false,
    });
  }

  // Invalidate specific deal detail
  if (dealDetail) {
    queryClient.invalidateQueries({
      queryKey: DEAL_INVALIDATION_KEYS.SPECIFIC_DETAIL(dealDetail),
    });
  }

  // Remove specific deal detail (for delete)
  if (removeDealDetail) {
    queryClient.removeQueries({
      queryKey: DEAL_INVALIDATION_KEYS.SPECIFIC_DETAIL(removeDealDetail),
    });
  }
};

/**
 * Pre-configured invalidation presets
 * These use the same key functions to guarantee consistency
 */
export const DealInvalidationPresets = {
  CREATE: {
    lists: true,
    businessLists: true,
    upcoming: true,
    businessUpcoming: true,
  },

  UPDATE: (dealId: string) => ({
    dealDetail: dealId,
    lists: true,
    businessLists: true,
    upcoming: true,
    businessUpcoming: true,
  }),

  DELETE: (dealId: string) => ({
    removeDealDetail: dealId,
    lists: true,
    businessLists: true,
    upcoming: true,
    businessUpcoming: true,
  }),
} as const;
