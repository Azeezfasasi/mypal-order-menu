/**
 * Google Places API Service
 * Handles location autocomplete, place details, nearby search, and reverse geocoding
 */

import type { BaseApiResponse } from "@/types/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "./api-client";
import { ENDPOINTS } from "./endpoints";

// ==================================
// Types
// ==================================

export interface GooglePlacesAutocompleteResult {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface GooglePlacesAutocompleteParams {
  input: string;
  lat?: number;
  lng?: number;
}

export interface GooglePlacesDetailsResult {
  place_id: string;
  formatted_address: string;
  name: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

export interface GooglePlacesNearbyParams {
  lat: number;
  lng: number;
  radius?: number; // in meters, default 50000
}

export interface GooglePlacesNearbyResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
}

export interface GooglePlacesReverseGeocodeParams {
  lat: number;
  lng: number;
}

export interface GooglePlacesReverseGeocodeResult {
  formatted_address: string;
  place_id: string;
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

// ==================================
// Mapping Helpers
// ==================================

function mapRawAutocompleteItem(
  rawItem: unknown,
): GooglePlacesAutocompleteResult {
  const r = (rawItem as Record<string, unknown>) || {};
  const structured = (r["structuredFormatting"] ??
    r["structured_formatting"]) as Record<string, unknown> | undefined;

  const main_text =
    typeof structured?.["main_text"] === "string"
      ? (structured!["main_text"] as string)
      : typeof structured?.["mainText"] === "string"
        ? (structured!["mainText"] as string)
        : "";

  const secondary_text =
    typeof structured?.["secondary_text"] === "string"
      ? (structured!["secondary_text"] as string)
      : typeof structured?.["secondaryText"] === "string"
        ? (structured!["secondaryText"] as string)
        : "";

  return {
    place_id:
      typeof r["placeId"] === "string"
        ? (r["placeId"] as string)
        : typeof r["place_id"] === "string"
          ? (r["place_id"] as string)
          : "",
    description:
      typeof r["description"] === "string" ? (r["description"] as string) : "",
    structured_formatting: {
      main_text,
      secondary_text,
    },
  };
}

function mapRawPlaceDetails(rawObj: unknown): GooglePlacesDetailsResult {
  const rawRec = (rawObj as Record<string, unknown>) || {};

  const coords = rawRec["coordinates"] as Record<string, unknown> | undefined;
  const coordsArr = Array.isArray(coords?.["coordinates"])
    ? (coords!["coordinates"] as unknown[])
    : undefined;
  const geometry = rawRec["geometry"] as Record<string, unknown> | undefined;
  const loc = geometry?.["location"] as Record<string, unknown> | undefined;

  const latVal =
    typeof rawRec["latitude"] === "number"
      ? (rawRec["latitude"] as number)
      : Array.isArray(coordsArr) && typeof coordsArr[1] === "number"
        ? (coordsArr[1] as number)
        : typeof loc?.["lat"] === "number"
          ? (loc!["lat"] as number)
          : 0;

  const lngVal =
    typeof rawRec["longitude"] === "number"
      ? (rawRec["longitude"] as number)
      : Array.isArray(coordsArr) && typeof coordsArr[0] === "number"
        ? (coordsArr[0] as number)
        : typeof loc?.["lng"] === "number"
          ? (loc!["lng"] as number)
          : 0;

  const placeIdStr =
    typeof rawRec["placeId"] === "string"
      ? (rawRec["placeId"] as string)
      : typeof rawRec["place_id"] === "string"
        ? (rawRec["place_id"] as string)
        : "";

  const formattedAddressStr =
    typeof rawRec["formattedAddress"] === "string"
      ? (rawRec["formattedAddress"] as string)
      : typeof rawRec["formatted_address"] === "string"
        ? (rawRec["formatted_address"] as string)
        : "";

  const nameStr =
    typeof rawRec["name"] === "string"
      ? (rawRec["name"] as string)
      : typeof rawRec["place_name"] === "string"
        ? (rawRec["place_name"] as string)
        : "";

  const components: {
    long_name: string;
    short_name: string;
    types: string[];
  }[] = [];
  if (typeof rawRec["city"] === "string") {
    components.push({
      long_name: rawRec["city"] as string,
      short_name: rawRec["city"] as string,
      types: ["locality"],
    });
  }
  if (typeof rawRec["state"] === "string") {
    components.push({
      long_name: rawRec["state"] as string,
      short_name: rawRec["state"] as string,
      types: ["administrative_area_level_1"],
    });
  }
  if (typeof rawRec["country"] === "string") {
    components.push({
      long_name: rawRec["country"] as string,
      short_name: rawRec["country"] as string,
      types: ["country"],
    });
  }

  return {
    place_id: placeIdStr,
    formatted_address: formattedAddressStr,
    name: nameStr,
    geometry: { location: { lat: latVal, lng: lngVal } },
    address_components: components,
  };
}

// ==================================
// Google Places API Hooks Factory
// ==================================
export const createGooglePlacesApi = () => {
  return {
    /**
     * Hook to get location autocomplete suggestions for sign up
     * GET /v1/google-places/autocomplete
     */
    useGetAutocomplete: (params: GooglePlacesAutocompleteParams) =>
      useQuery<BaseApiResponse<GooglePlacesAutocompleteResult[]>>({
        queryKey: ["google-places", "autocomplete", params],
        queryFn: async () => {
          const response = await apiClient.get(
            ENDPOINTS.GOOGLE_PLACES.AUTOCOMPLETE,
            {
              params: {
                input: params.input,
                ...(params.lat && { lat: params.lat }),
                ...(params.lng && { lng: params.lng }),
              },
            },
          );

          const payload = response.data as { data?: unknown[] } | undefined;
          const rawArr: unknown[] = Array.isArray(payload?.data)
            ? payload!.data!
            : [];
          const mapped = rawArr.map(mapRawAutocompleteItem);
          return { data: mapped } as unknown as BaseApiResponse<
            GooglePlacesAutocompleteResult[]
          >;
        },
        enabled: Boolean(params.input && params.input.trim().length > 0),
        staleTime: 5 * 60 * 1000, // 5 minutes
      }),

    /**
     * Hook to get detailed place information with coordinates for saving user location
     * GET /v1/google-places/details/{placeId}
     */
    useGetPlaceDetails: (placeId: string) =>
      useQuery<BaseApiResponse<GooglePlacesDetailsResult>>({
        queryKey: ["google-places", "details", placeId],
        queryFn: async () => {
          const response = await apiClient.get(
            ENDPOINTS.GOOGLE_PLACES.DETAILS(placeId),
          );

          // Normalize backend place details response to frontend shape
          const payload = response.data as unknown as
            | { data?: unknown }
            | undefined;
          const raw = payload?.data ?? response.data ?? undefined;

          if (!raw) {
            return payload as unknown as BaseApiResponse<GooglePlacesDetailsResult>;
          }

          const mapped = mapRawPlaceDetails(raw);

          return {
            ...(payload || {}),
            data: mapped,
          } as unknown as BaseApiResponse<GooglePlacesDetailsResult>;
        },
        enabled: Boolean(placeId && placeId.trim().length > 0),
        staleTime: 10 * 60 * 1000, // 10 minutes
      }),

    /**
     * Mutation to get place details (alternative to query)
     */
    useGetPlaceDetailsMutation: () =>
      useMutation<
        BaseApiResponse<GooglePlacesDetailsResult>,
        Error,
        string // placeId
      >({
        mutationFn: async (placeId: string) => {
          const response = await apiClient.get(
            ENDPOINTS.GOOGLE_PLACES.DETAILS(placeId),
          );
          const payload = response.data as unknown as
            | { data?: unknown }
            | undefined;
          const raw =
            (payload as { data?: unknown } | undefined)?.data ??
            response.data ??
            undefined;

          const mapped = mapRawPlaceDetails(raw);

          return {
            ...(payload || {}),
            data: mapped,
          } as unknown as BaseApiResponse<GooglePlacesDetailsResult>;
        },
      }),

    /**
     * Hook to search for nearby places (cities, states) around user location
     * GET /v1/google-places/nearby
     */
    useGetNearbyPlaces: (params: GooglePlacesNearbyParams) =>
      useQuery<BaseApiResponse<GooglePlacesNearbyResult[]>>({
        queryKey: ["google-places", "nearby", params],
        queryFn: async () => {
          const response = await apiClient.get<
            BaseApiResponse<GooglePlacesNearbyResult[]>
          >(ENDPOINTS.GOOGLE_PLACES.NEARBY, {
            params: {
              lat: params.lat,
              lng: params.lng,
              ...(params.radius && { radius: params.radius }),
            },
          });
          return response.data;
        },
        enabled: Boolean(params.lat && params.lng),
        staleTime: 10 * 60 * 1000, // 10 minutes
      }),

    /**
     * Mutation to search nearby places
     */
    useGetNearbyPlacesMutation: () =>
      useMutation<
        BaseApiResponse<GooglePlacesNearbyResult[]>,
        Error,
        GooglePlacesNearbyParams
      >({
        mutationFn: async (params: GooglePlacesNearbyParams) => {
          const response = await apiClient.get<
            BaseApiResponse<GooglePlacesNearbyResult[]>
          >(ENDPOINTS.GOOGLE_PLACES.NEARBY, {
            params: {
              lat: params.lat,
              lng: params.lng,
              ...(params.radius && { radius: params.radius }),
            },
          });
          return response.data;
        },
      }),

    /**
     * Hook to convert coordinates to address (for getting current location)
     * GET /v1/google-places/reverse-geocode
     */
    useReverseGeocode: (params: GooglePlacesReverseGeocodeParams) =>
      useQuery<BaseApiResponse<GooglePlacesReverseGeocodeResult>>({
        queryKey: ["google-places", "reverse-geocode", params],
        queryFn: async () => {
          const response = await apiClient.get<
            BaseApiResponse<GooglePlacesReverseGeocodeResult>
          >(ENDPOINTS.GOOGLE_PLACES.REVERSE_GEOCODE, {
            params: {
              lat: params.lat,
              lng: params.lng,
            },
          });
          return response.data;
        },
        enabled: Boolean(params.lat && params.lng),
        staleTime: 10 * 60 * 1000, // 10 minutes
      }),

    /**
     * Mutation to reverse geocode coordinates
     */
    useReverseGeocodeMutation: () =>
      useMutation<
        BaseApiResponse<GooglePlacesReverseGeocodeResult>,
        Error,
        GooglePlacesReverseGeocodeParams
      >({
        mutationFn: async (params: GooglePlacesReverseGeocodeParams) => {
          const response = await apiClient.get<
            BaseApiResponse<GooglePlacesReverseGeocodeResult>
          >(ENDPOINTS.GOOGLE_PLACES.REVERSE_GEOCODE, {
            params: {
              lat: params.lat,
              lng: params.lng,
            },
          });
          return response.data;
        },
      }),
  };
};

// Export Instance
export const GooglePlacesApi = createGooglePlacesApi();
