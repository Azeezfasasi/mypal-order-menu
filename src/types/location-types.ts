/**
 * Google Places Autocomplete API Types
 */

export type Geo = {
  lat: number;
  lng: number;
};

export interface PlacesResponse {
  description: string;
  place_id: string;
  reference: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  terms: {
    offset: number;
    value: string;
  }[];
}

export interface PlacesDetailGeometry {
  location: Geo;
  viewport: {
    northeast: Geo;
    southwest: Geo;
  };
}

export interface PlacesDetailResult {
  formatted_address: string;
  geometry: PlacesDetailGeometry;
  name: string;
}

export interface PlacesDetailResponse {
  result: PlacesDetailResult;
  status: string;
}

/**
 * Transformed location data for internal use
 */
export interface LocationPlace {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  formattedAddress?: string;
  coordinates?: Geo;
}
