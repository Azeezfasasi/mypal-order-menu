"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import {
  GooglePlacesApi,
  type GooglePlacesAutocompleteResult,
  type GooglePlacesDetailsResult,
} from "@/services/api/google-places-api";

/** A picked place, in the shape business-admin's address field produces */
export interface MobilityAddress {
  formatted_address: string;
  city: string;
  state: string;
  country: string;
  lat?: number;
  long?: number;
}

interface LocationFieldProps {
  value: MobilityAddress | null;
  onChange: (address: MobilityAddress | null) => void;
  placeholder?: string;
}

const component = (details: GooglePlacesDetailsResult, type: string) =>
  details.address_components?.find((c) => c.types.includes(type))?.long_name ?? "";

/**
 * Address search through the backend's Google Places proxy. A suggestion must
 * be picked so city, state, country and coordinates are known.
 */
export function LocationField({ value, onChange, placeholder = "Search address or location" }: LocationFieldProps) {
  const [input, setInput] = useState(value?.formatted_address ?? "");
  const [open, setOpen] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedInput = useDebounce(input, 300);

  // Only search while the text differs from the chosen address
  const searchInput = open && debouncedInput !== value?.formatted_address ? debouncedInput : "";
  const { data, isFetching } = GooglePlacesApi.useGetAutocomplete({ input: searchInput });
  const suggestions = data?.data ?? [];
  const { mutate: getDetails, isPending: isResolving } = GooglePlacesApi.useGetPlaceDetailsMutation();

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (suggestion: GooglePlacesAutocompleteResult) => {
    setInput(suggestion.description);
    setOpen(false);
    setLookupError(null);
    getDetails(suggestion.place_id, {
      onSuccess: ({ data: details }) => {
        const state = component(details, "administrative_area_level_1");
        const country = component(details, "country");
        if (!state || !country) {
          setLookupError("Choose a more specific address, like a street or area.");
          onChange(null);
          return;
        }
        const address = details.formatted_address || suggestion.description;
        setInput(address);
        onChange({
          formatted_address: address,
          // Some places (e.g. a whole state) have no city; fall back to the state
          city: component(details, "locality") || state,
          state,
          country,
          ...(details.geometry.location.lat || details.geometry.location.lng
            ? { lat: details.geometry.location.lat, long: details.geometry.location.lng }
            : {}),
        });
      },
      onError: () => {
        setLookupError("Couldn't load that address. Please try again.");
        onChange(null);
      },
    });
  };

  const showList = open && searchInput.trim().length > 2;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setOpen(true);
            setLookupError(null);
            // Typing invalidates a previously chosen address
            if (value) onChange(null);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          aria-invalid={!!lookupError}
          aria-autocomplete="list"
          aria-expanded={showList && suggestions.length > 0}
          className="h-11 pl-9 pr-9"
        />
        {(isFetching || isResolving) && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
        )}
      </div>

      {showList && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-white py-1 shadow-lg"
        >
          {suggestions.map((suggestion) => (
            <li key={suggestion.place_id} role="option" aria-selected={false}>
              <button
                type="button"
                onClick={() => handleSelect(suggestion)}
                className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <span className="min-w-0">
                  <span className="block truncate font-medium text-gray-900">
                    {suggestion.structured_formatting?.main_text || suggestion.description}
                  </span>
                  {suggestion.structured_formatting?.secondary_text && (
                    <span className="block truncate text-xs text-gray-500">
                      {suggestion.structured_formatting.secondary_text}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {showList && !isFetching && suggestions.length === 0 && (
        <p className="absolute z-50 mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-500 shadow-lg">
          No matching addresses
        </p>
      )}

      {lookupError && <p className="mt-1 text-sm text-red-600">{lookupError}</p>}
    </div>
  );
}
