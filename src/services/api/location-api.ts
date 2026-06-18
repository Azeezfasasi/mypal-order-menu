/**
 * Location Service - Google Places Autocomplete API Integration
 * Provides autocomplete suggestions and place details using Google Maps API
 */

import type {
  PlacesDetailResponse,
  PlacesResponse,
} from "@/types/location-types";
import axios, { AxiosResponse } from "axios";

// Google Maps API Configuration
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

// Google Places API endpoints
const PLACES_AUTOCOMPLETE_URL =
  "https://maps.googleapis.com/maps/api/place/autocomplete/json";
const PLACES_DETAILS_URL =
  "https://maps.googleapis.com/maps/api/place/details/json";

// Create a dedicated axios instance for Google Places API (no interceptors)
const googlePlacesClient = axios.create({
  timeout: 10000,
});

export class LocationService {
  /**
   * Get autocomplete suggestions for a search query
   * Restricted to Nigeria (country:ng) by default
   * @param query - Search query string
   * @returns Array of place predictions
   */
  static getPlacesAutoComplete = async (
    query: string,
  ): Promise<PlacesResponse[]> => {
    if (!query.trim()) {
      return [];
    }

    try {
      const params = {
        input: query,
        key: GOOGLE_MAPS_API_KEY,
        language: "en",
        components: "country:ng", // Restrict to Nigeria
      };

      const response: AxiosResponse<{
        predictions: PlacesResponse[];
        status: string;
      }> = await googlePlacesClient.get(PLACES_AUTOCOMPLETE_URL, {
        params,
      });

      if (response.data.status === "OK") {
        return response.data.predictions || [];
      }

      if (response.data.status === "ZERO_RESULTS") {
        return [];
      }

      console.warn("Google Places Autocomplete Error:", response.data.status);
      return [];
    } catch (error) {
      console.error("Error fetching places autocomplete:", error);
      return [];
    }
  };

  /**
   * Get detailed information about a specific place
   * @param placeId - The place_id from autocomplete results
   * @returns Place details including coordinates and formatted address
   */
  static getPlacesDetail = async (
    placeId: string,
  ): Promise<PlacesDetailResponse | null> => {
    if (!placeId.trim()) {
      return null;
    }

    try {
      const params = {
        place_id: placeId,
        key: GOOGLE_MAPS_API_KEY,
        fields: "geometry,formatted_address,name",
      };

      const response: AxiosResponse<PlacesDetailResponse> =
        await googlePlacesClient.get(PLACES_DETAILS_URL, {
          params,
        });

      if (response.data.status === "OK") {
        return response.data;
      }

      console.warn("Google Places Details Error:", response.data.status);
      return null;
    } catch (error) {
      console.error("Error fetching place details:", error);
      return null;
    }
  };
}
