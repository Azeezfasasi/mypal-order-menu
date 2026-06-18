/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { QueryClient } from "@tanstack/react-query";

export const queryClientCustom = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (error?.response?.status === 404) {
          return false;
        }
        if (error.message === "No internet connection") {
          return true;
        }
        return failureCount < 3;
      },
      staleTime: 1000 * 60 * 3, // 3 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      enabled: true,
    },
    mutations: {
      retry: 2,
      onError: (error: any) => {
        // TODO: Global error handling for mutations
        console.error("Mutation error:", error);
      },
    },
  },
});

// Handle online/offline state changes
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    queryClientCustom.resumePausedMutations();
  });
}
