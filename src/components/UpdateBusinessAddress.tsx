"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { BusinessAuthApi } from "@/services/api/auth-api";
import { useAuth } from "@/hooks/use-auth";
import { AlertCircle, MapPin, Search, Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { apiClient } from "@/services/api/api-client";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { BaseApiResponse } from "@/types/api";
import type { IBusinessUpdateData } from "@/types/auth-types";
import type { Map, Marker, LeafletMouseEvent } from "leaflet";
import { toast } from "sonner";

// Form validation schema
const addressUpdateSchema = z.object({
  address: z.string().min(1, { message: "Address is required" }),
  latitude: z.number().min(-90).max(90, { message: "Invalid latitude" }),
  longitude: z.number().min(-180).max(180, { message: "Invalid longitude" }),
});

type AddressUpdateFormData = z.infer<typeof addressUpdateSchema>;

interface UpdateBusinessAddressProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  required?: boolean; // If true, user cannot dismiss without saving
}

interface AddressResult {
  placeId: string;
  description: string;
  index?: number;
}

export default function UpdateBusinessAddress({
  isOpen,
  onClose,
  onSuccess,
  required = false,
}: UpdateBusinessAddressProps) {
  const { user: business } = useAuth();
  const [addressSuggestions, setAddressSuggestions] = useState<AddressResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const [isLoadingMap, setIsLoadingMap] = useState(false);
  const [activeTab, setActiveTab] = useState<"search" | "map">("search");

  const form = useForm<AddressUpdateFormData>({
    resolver: zodResolver(addressUpdateSchema),
    defaultValues: {
      address: business?.address || "",
      latitude: business?.lat ? parseFloat(business.lat as string) : undefined,
      longitude: business?.long ? parseFloat(business.long as string) : undefined,
    },
  });

  const updateMutation = BusinessAuthApi.useUpdateBusiness();
  const addressInput = form.watch("address");
  const debouncedAddress = useDebounce(addressInput, 500);

  // Fetch address suggestions from Google Places
  useEffect(() => {
    if (!debouncedAddress || debouncedAddress.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    // Check if the input is just coordinates (from map click)
    // Pattern: "number, number" - skip autocomplete for coordinates
    const isCoordinates = /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/.test(debouncedAddress);
    if (isCoordinates) {
      setAddressSuggestions([]);
      return;
    }

    // Use the GooglePlacesApi hook for autocomplete
    const fetchSuggestions = async () => {
      try {
        // Call the backend endpoint for autocomplete
        const response = await apiClient.get<BaseApiResponse<Record<string, unknown>[]>>(
          ENDPOINTS.GOOGLE_PLACES.AUTOCOMPLETE,
          {
            params: {
              input: debouncedAddress,
            },
          }
        );
        
        console.log("Autocomplete API Response:", response.data);
        
        if (response.data && response.data.data) {
          const results = Array.isArray(response.data.data) ? response.data.data : [];
          const suggestions = results.map((item: Record<string, unknown>, index: number) => {
            // API returns placeId (camelCase), not place_id (snake_case)
            const placeId = (item.placeId || item.place_id) as string;
            console.log("Autocomplete item structure:", item, "placeId:", placeId);
            return {
              placeId: placeId || `suggestion-${index}`,
              description: item.description as string,
              index: index,
            };
          });
          setAddressSuggestions(suggestions);
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setAddressSuggestions([]);
      }
    };

    fetchSuggestions();
  }, [debouncedAddress]);

  // Fetch place details to get coordinates
  const handleSelectAddress = async (result: AddressResult) => {
    try {
      // Validate placeId before making request
      if (!result.placeId || result.placeId.startsWith('suggestion-')) {
        toast.error("Unable to fetch location details", {
          description: "Please select a valid address from the suggestions."
        });
        console.warn("Invalid placeId:", result.placeId);
        return;
      }

      // Fetch place details to get coordinates
      console.log("Fetching place details for placeId:", result.placeId);
      
      const response = await apiClient.get<BaseApiResponse<Record<string, unknown>>>(
        ENDPOINTS.GOOGLE_PLACES.DETAILS(result.placeId)
      );

      console.log("Place details response:", response.data);

      if (response.data && response.data.data) {
        const details = response.data.data as Record<string, unknown>;
        
        // Extract latitude and longitude from the response
        // API returns them directly as latitude and longitude fields
        const lat = details.latitude as number;
        const lng = details.longitude as number;
        
        if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
          form.setValue("address", result.description, { shouldDirty: true, shouldValidate: true });
          form.setValue("latitude", lat, { shouldDirty: true, shouldValidate: true });
          form.setValue("longitude", lng, { shouldDirty: true, shouldValidate: true });
          
          setAddressSuggestions([]);
          setShowSuggestions(false);

          toast.success("Location selected successfully");

          // Initialize map with new coordinates
          if (activeTab === "map") {
            initializeMap(lat, lng);
          }
        } else {
          toast.error("Invalid location data", {
            description: "Could not extract coordinates from the selected address."
          });
          console.warn("Invalid coordinates:", { lat, lng });
        }
      } else {
        toast.error("No location data found", {
          description: "Please try selecting a different address."
        });
      }
    } catch (error) {
      console.error("Error fetching place details:", error);
      toast.error("Failed to fetch location details", {
        description: error instanceof Error ? error.message : "Please try again."
      });
    }
  };

  // Initialize or update the map
  const initializeMap = async (lat: number, lng: number) => {
    if (!mapContainerRef.current) return;
    
    setIsLoadingMap(true);
    try {
      const leaflet = await import("leaflet");
      const L = leaflet as typeof import("leaflet");

      // Clean up existing map
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      // Fix icon paths
      delete ((L.Icon.Default.prototype as unknown) as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "/marker-icon.png",
        iconRetinaUrl: "/marker-icon-2x.png",
        shadowUrl: "/marker-shadow.png",
      });

      // Create new map
      const map = L.map(mapContainerRef.current).setView([lat, lng], 15);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Add marker for current location
      const marker = L.marker([lat, lng]).addTo(map);
      markerRef.current = marker;

      // Handle map clicks to update location
      map.on("click", (e: LeafletMouseEvent) => {
        const { lat: newLat, lng: newLng } = e.latlng;
        
        // Update form values with shouldDirty and shouldValidate to trigger form validation
        form.setValue("latitude", newLat, { shouldDirty: true, shouldValidate: true });
        form.setValue("longitude", newLng, { shouldDirty: true, shouldValidate: true });
        
        // Update address with coordinates (acts as a placeholder)
        // The user selected the location on the map manually
        const coordinateAddress = `${newLat.toFixed(6)}, ${newLng.toFixed(6)}`;
        form.setValue("address", coordinateAddress, { shouldDirty: true, shouldValidate: true });

        // Update marker
        if (markerRef.current) {
          markerRef.current.remove();
        }
        markerRef.current = L.marker([newLat, newLng]).addTo(map);
      });

      mapRef.current = map;
    } catch (error) {
      console.error("Error initializing map:", error);
    } finally {
      setIsLoadingMap(false);
    }
  };

  // Initialize map when tab changes
  useEffect(() => {
    const lat = form.getValues("latitude");
    const lng = form.getValues("longitude");
    
    if (activeTab === "map" && isOpen && lat !== undefined && lng !== undefined) {
      initializeMap(lat, lng);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isOpen]);

  // Clean up map on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, []);

  const onSubmit = async (data: AddressUpdateFormData) => {
    try {
      // Validate coordinates before sending
      if (typeof data.latitude !== "number" || typeof data.longitude !== "number") {
        toast.error("Invalid coordinates", {
          description: "Please ensure latitude and longitude are valid numbers.",
        });
        return;
      }

      // Ensure coordinates are valid
      if (
        data.latitude < -90 ||
        data.latitude > 90 ||
        data.longitude < -180 ||
        data.longitude > 180
      ) {
        toast.error("Invalid coordinates", {
          description: "Latitude must be between -90 and 90, longitude between -180 and 180.",
        });
        return;
      }

      // Build update payload - include existing business data to ensure backend processing works
      const updatePayload: IBusinessUpdateData = {
        address: data.address,
        lat: data.latitude,
        long: data.longitude,
      };

      // Include category and business_type if they exist - backend may require them for validation
      if (business?.category?.id) {
        updatePayload.category = business.category.id;
      }
      if (business?.business_type) {
        updatePayload.business_type = business.business_type;
      }

      console.log("[UpdateBusinessAddress] Submitting:", updatePayload);

      // Update business with new address and coordinates
      await updateMutation.mutateAsync(updatePayload);

      // Close dialog on success
      onClose();
      onSuccess?.();
    } catch (error) {
      console.error("Error updating address:", error);
      
      // Provide more detailed error information
      const errorMessage =
        error instanceof Error 
          ? error.message 
          : typeof (error as Record<string, unknown>)?.statusText === "string"
            ? (error as Record<string, string>).statusText
            : "An unexpected error occurred";
      
      toast.error("Failed to update address", {
        description: errorMessage,
      });
    }
  };

  const isFormValid = form.formState.isDirty && form.formState.isValid;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(newOpen) => {
        // If required, only allow closing when saving (onSuccess will close it)
        // Otherwise allow normal close behavior
        if (!required && !newOpen) {
          onClose();
        }
      }}
    >
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        // Prevent closing by clicking outside when required
        onInteractOutside={(e) => {
          if (required) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Update Business Location
          </DialogTitle>
          <DialogDescription>
            {required ? (
              <>
                Please provide your business address to continue. This helps
                customers find you more easily.
              </>
            ) : (
              <>
                Please provide your business address and confirm the location on
                the map. This helps customers find you more easily.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Info banner */}
        <div className="flex gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Why we need this?</p>
            <p>Your location helps customers locate you and improves your visibility in search results.</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Tabs for search or map */}
            <div className="flex gap-2 border-b">
              <button
                type="button"
                onClick={() => setActiveTab("search")}
                className={cn(
                  "pb-2 px-4 font-medium text-sm border-b-2 transition-colors",
                  activeTab === "search"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                )}
              >
                <Search className="inline w-4 h-4 mr-2" />
                Search Address
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("map")}
                className={cn(
                  "pb-2 px-4 font-medium text-sm border-b-2 transition-colors",
                  activeTab === "map"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                )}
              >
                <MapPin className="inline w-4 h-4 mr-2" />
                Pin on Map
              </button>
            </div>

            <div className="space-y-4">
              {/* Address Field */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Address</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          placeholder="Enter your business address (street, city, state)"
                          {...field}
                          onFocus={() => setShowSuggestions(true)}
                          className="h-10"
                        />
                      </FormControl>
                      
                      {/* Address Suggestions Dropdown */}
                      {showSuggestions && addressSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-10 mt-1">
                          {addressSuggestions.map((suggestion, index) => (
                            <button
                              key={`${suggestion.placeId}-${index}`}
                              type="button"
                              onClick={() => handleSelectAddress(suggestion)}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b last:border-b-0 transition-colors"
                            >
                              <div className="text-sm font-medium">{suggestion.description}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Map Tab Content */}
              {activeTab === "map" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Click on the map to set your location
                  </label>
                  <div
                    ref={mapContainerRef}
                    className="h-80 bg-gray-100 rounded-lg border border-gray-300 relative"
                  >
                    {isLoadingMap && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-lg z-20">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Coordinates Display */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Latitude</FormLabel>
                      <Input
                        type="number"
                        step="0.000001"
                        placeholder="0.000000"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        value={field.value ?? ""}
                        className="h-9 text-sm"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Longitude</FormLabel>
                      <Input
                        type="number"
                        step="0.000001"
                        placeholder="0.000000"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        value={field.value ?? ""}
                        className="h-9 text-sm"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 justify-end pt-4">
              {!required && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={!isFormValid || updateMutation.isPending}
                className="gap-2"
              >
                {updateMutation.isPending && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Save Location
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
