/**
 * useGooglePlaces Hook
 * Custom hook for Google Places Autocomplete integration
 * Handles autocomplete suggestions and place details retrieval
 */

import { LocationService } from "@/services/api/location-api";
import type { LocationPlace, PlacesResponse } from "@/types/location-types";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

interface UseGooglePlacesOptions {
  debounceMs?: number;
  enabled?: boolean;
}

interface UseGooglePlacesReturn {
  // State
  query: string;
  predictions: PlacesResponse[];
  selectedPlace: LocationPlace | null;
  isLoadingPredictions: boolean;
  isLoadingDetails: boolean;
  isLoadingAutoComplete: boolean;

  // Methods
  setQuery: (query: string) => void;
  selectPlace: (place: PlacesResponse) => Promise<void>;
  clearPredictions: () => void;
  clearSelection: () => void;
  reset: () => void;
}

/**
 * Hook for managing Google Places Autocomplete
 * Provides autocomplete suggestions and place detail retrieval
 */
export const useGooglePlaces = (
  options: UseGooglePlacesOptions = {},
): UseGooglePlacesReturn => {
  const { debounceMs = 300, enabled = true } = options;

  const [query, setQueryState] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");
  const [predictions, setPredictions] = useState<PlacesResponse[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<LocationPlace | null>(
    null,
  );
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  // Debounce query input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Fetch autocomplete predictions
  const {
    data: autocompleteData,
    isLoading: isLoadingAutoComplete,
    error: autocompleteError,
  } = useQuery({
    queryKey: ["googlePlacesAutocomplete", debouncedQuery],
    queryFn: () => LocationService.getPlacesAutoComplete(debouncedQuery),
    enabled: enabled && debouncedQuery.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  // Fetch place details
  const { isLoading: isLoadingDetails, data: detailsData } = useQuery({
    queryKey: ["googlePlacesDetails", selectedPlaceId],
    queryFn: () =>
      selectedPlaceId ? LocationService.getPlacesDetail(selectedPlaceId) : null,
    enabled: enabled && selectedPlaceId !== null,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour (formerly cacheTime)
  });

  // Update predictions when autocomplete data changes
  useEffect(() => {
    if (autocompleteData) {
      setPredictions(autocompleteData);
    }
  }, [autocompleteData]);

  // Update selected place when details are fetched
  useEffect(() => {
    if (detailsData) {
      const result = detailsData.result;
      setSelectedPlace({
        placeId: selectedPlaceId || "",
        description: result.formatted_address || "",
        mainText: result.name || "",
        secondaryText: "",
        formattedAddress: result.formatted_address,
        coordinates: result.geometry?.location,
      });
    }
  }, [detailsData, selectedPlaceId]);

  // Handle place selection
  const selectPlace = useCallback(async (place: PlacesResponse) => {
    setSelectedPlaceId(place.place_id);
    setQueryState(place.description);
    setPredictions([]);
  }, []);

  // Clear predictions
  const clearPredictions = useCallback(() => {
    setPredictions([]);
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedPlace(null);
    setSelectedPlaceId(null);
    clearPredictions();
  }, [clearPredictions]);

  // Reset all state
  const reset = useCallback(() => {
    setQueryState("");
    setDebouncedQuery("");
    clearPredictions();
    clearSelection();
  }, [clearPredictions, clearSelection]);

  // Set query
  const setQuery = useCallback(
    (newQuery: string) => {
      setQueryState(newQuery);
      if (newQuery === "") {
        clearPredictions();
        clearSelection();
      }
    },
    [clearPredictions, clearSelection],
  );

  // Log errors in development
  useEffect(() => {
    if (autocompleteError) {
      console.error("Places autocomplete error:", autocompleteError);
    }
  }, [autocompleteError]);

  return {
    query,
    predictions,
    selectedPlace,
    isLoadingPredictions: isLoadingAutoComplete,
    isLoadingDetails,
    isLoadingAutoComplete,
    setQuery,
    selectPlace,
    clearPredictions,
    clearSelection,
    reset,
  };
};
