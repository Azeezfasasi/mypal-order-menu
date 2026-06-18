/\*\*

- Google Places Autocomplete Setup Guide
-
- This file documents the setup and usage of the Google Places integration
  \*/

/\*\*

- SETUP REQUIREMENTS
- ===================
-
- 1.  Environment Configuration:
- Add to your .env.local file:
- NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
-
- 2.  Get a Google Maps API Key:
- - Go to Google Cloud Console: https://console.cloud.google.com
- - Create a new project (or use existing)
- - Enable the "Places API" and "Maps JavaScript API"
- - Create an API key (Web API)
- - Restrict the key to your domain
- - Copy the API key to .env.local
-
- 3.  API Restrictions (recommended):
- - HTTP referrers: Add your domain (e.g., localhost, mypal.com)
- - API restrictions: Select "Places API" and "Maps JavaScript API"
    \*/

/\*\*

- AVAILABLE COMPONENTS
- ====================
-
- 1.  Types (@/types/location-types.ts)
- - Geo: Latitude/Longitude coordinates
- - PlacesResponse: Autocomplete suggestion from Google
- - PlacesDetailResult: Detailed place information
- - LocationPlace: Normalized location data for internal use
-
- 2.  API Service (@/services/api/location-api.ts)
- - LocationService.getPlacesAutoComplete(query): Get suggestions
- - LocationService.getPlacesDetail(placeId): Get place details
-
- 3.  Hook (@/hooks/useGooglePlaces.ts)
- - useGooglePlaces(): Complete autocomplete management
    \*/

/\*\*

- USAGE EXAMPLE
- =============
-
- In a React component:
-
- ```tsx

  ```
- "use client";
-
- import { useGooglePlaces } from "@/hooks/useGooglePlaces";
- import { PlacesResponse } from "@/types/location-types";
-
- export function LocationInput() {
- const {
-     query,
-     predictions,
-     selectedPlace,
-     isLoadingPredictions,
-     setQuery,
-     selectPlace,
-     clearSelection,
- } = useGooglePlaces({
-     debounceMs: 300,
-     enabled: true,
- });
-
- return (
-     <div>
-       <input
-         type="text"
-         value={query}
-         onChange={(e) => setQuery(e.target.value)}
-         placeholder="Enter location..."
-       />
-
-       {isLoadingPredictions && <p>Loading suggestions...</p>}
-
-       <ul>
-         {predictions.map((place: PlacesResponse) => (
-           <li
-             key={place.place_id}
-             onClick={() => selectPlace(place)}
-           >
-             {place.description}
-           </li>
-         ))}
-       </ul>
-
-       {selectedPlace && (
-         <div>
-           <p>Selected: {selectedPlace.formattedAddress}</p>
-           <p>Coordinates: {selectedPlace.coordinates?.lat}, {selectedPlace.coordinates?.lng}</p>
-           <button onClick={clearSelection}>Clear</button>
-         </div>
-       )}
-     </div>
- );
- }
- ```
  */
  ```

/\*\*

- HOOK API REFERENCE
- ==================
-
- useGooglePlaces(options?)
-
- Options:
- - debounceMs?: number (default: 300ms) - Delay before fetching suggestions
- - enabled?: boolean (default: true) - Enable/disable the hook
-
- Returns:
- - query: string - Current search query
- - predictions: PlacesResponse[] - Autocomplete suggestions
- - selectedPlace: LocationPlace | null - Currently selected place with details
- - isLoadingPredictions: boolean - Loading state for autocomplete
- - isLoadingDetails: boolean - Loading state for place details
- - isLoadingAutoComplete: boolean - Same as isLoadingPredictions
- - setQuery(query: string): void - Update search query
- - selectPlace(place: PlacesResponse): Promise<void> - Select a place and fetch details
- - clearPredictions(): void - Clear suggestions list
- - clearSelection(): void - Clear selected place
- - reset(): void - Reset all state
    \*/

/\*\*

- NEXT STEPS
- ==========
-
- 1.  Add Google Maps API Key to .env.local
- 2.  Create a location input component using useGooglePlaces hook
- 3.  Integrate with form validation (e.g., CustomInputField)
- 4.  Store coordinates with form submission
- 5.  Display map preview with selected coordinates
      \*/

export {};
