"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import Loader from "@/components/shared/loading-spinner";
import { DeliveryApi } from "@/services/api/delivery-api";
import { GooglePlacesApi } from "@/services/api/google-places-api";
import DeliveryZoneMap from "./delivery-zone-map";
import type {
  CreateDeliveryZoneDto,
  CreateDeliveryRiderDto,
  DeliveryZone,
  DeliveryRider,
  DeliveryOrder,
} from "@/types/delivery-types";
import type { GooglePlacesAutocompleteResult } from "@/services/api/google-places-api";
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { Trash2, Edit, Plus, MapPin, Phone, Mail } from "lucide-react";

// ===== UTILITY FUNCTIONS =====
/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 Latitude of first point
 * @param lng1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lng2 Longitude of second point
 * @returns Distance in kilometers
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Estimate delivery time in minutes based on distance
 * @param distanceKm Distance in kilometers
 * @param averageSpeedKmh Average delivery speed in km/h (default: 40 km/h for city traffic)
 * @returns Estimated time in minutes, rounded up to nearest 5 minutes
 */
function estimateDeliveryTime(
  distanceKm: number,
  averageSpeedKmh: number = 40,
): number {
  const timeInHours = distanceKm / averageSpeedKmh;
  const timeInMinutes = timeInHours * 60;
  // Round up to nearest 5 minutes and add 5 minutes buffer
  return Math.ceil((timeInMinutes + 5) / 5) * 5;
}

export default function DeliveryManagement() {
  // ===== ZONES MANAGEMENT =====
  const [showZoneDialog, setShowZoneDialog] = useState(false);
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [pickupCoords, setPickupCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [pickupLocationInput, setPickupLocationInput] = useState("");
  const [pickupLocationSuggestions, setPickupLocationSuggestions] = useState<
    GooglePlacesAutocompleteResult[]
  >([]);
  const [dropoffLocationInput, setDropoffLocationInput] = useState("");
  const [dropoffLocationSuggestions, setDropoffLocationSuggestions] = useState<
    GooglePlacesAutocompleteResult[]
  >([]);

  // Track when we just selected a suggestion to prevent re-showing suggestions
  const justSelectedPickup = useRef(false);
  const justSelectedDropoff = useRef(false);

  const {
    data: zonesData,
    isLoading: zonesLoading,
    error: zonesError,
  } = DeliveryApi.useGetDeliveryZones();
  const createZone = DeliveryApi.useCreateDeliveryZone();
  const updateZone = DeliveryApi.useUpdateDeliveryZone();
  const deleteZone = DeliveryApi.useDeleteDeliveryZone();



  // Google Places for pickup location
  const usePickupAutocomplete = GooglePlacesApi.useGetAutocomplete({
    input: pickupLocationInput,
    lat: pickupCoords?.lat,
    lng: pickupCoords?.lng,
  });

  // Google Places for dropoff location
  const useDropoffAutocomplete = GooglePlacesApi.useGetAutocomplete({
    input: dropoffLocationInput,
    lat: dropoffCoords?.lat,
    lng: dropoffCoords?.lng,
  });

  const getPlaceDetailsMutation =
    GooglePlacesApi.useGetPlaceDetailsMutation();
  
  const reverseGeocodeMutation = GooglePlacesApi.useReverseGeocodeMutation();

  const zoneForm = useForm<CreateDeliveryZoneDto>({
    defaultValues: {
      zone_name: "",
      description: "",
      delivery_fee: 0,
      estimated_delivery_time: 30,
      coverage_area: "",
      latitude: undefined,
      longitude: undefined,
      pickup_address: "",
      pickup_latitude: undefined,
      pickup_longitude: undefined,
      dropoff_address: "",
      dropoff_latitude: undefined,
      dropoff_longitude: undefined,
    },
  });

  const {
    register: registerZone,
    handleSubmit: handleZoneSubmit,
    reset: resetZone,
    setValue: setZoneValue,
    formState: { errors: zoneErrors },
  } = zoneForm;

  // Handle editing zone - populate form when dialog opens for editing
  useEffect(() => {
    if (showZoneDialog && editingZoneId && zonesData?.data) {
      const zoneToEdit = (zonesData.data as DeliveryZone[]).find(
        (z) => z.id === editingZoneId,
      );
      if (zoneToEdit) {
        // Populate form immediately without setTimeout
        setZoneValue("zone_name", zoneToEdit.zone_name);
        setZoneValue("description", zoneToEdit.description || "");
        setZoneValue("delivery_fee", zoneToEdit.delivery_fee);
        setZoneValue("estimated_delivery_time", zoneToEdit.estimated_delivery_time);
        setZoneValue("coverage_area", zoneToEdit.coverage_area || "");
        setZoneValue("latitude", zoneToEdit.latitude);
        setZoneValue("longitude", zoneToEdit.longitude);
        setZoneValue("pickup_address", zoneToEdit.pickup_address || "");
        setZoneValue("pickup_latitude", zoneToEdit.pickup_latitude);
        setZoneValue("pickup_longitude", zoneToEdit.pickup_longitude);
        setZoneValue("dropoff_address", zoneToEdit.dropoff_address || "");
        setZoneValue("dropoff_latitude", zoneToEdit.dropoff_latitude);
        setZoneValue("dropoff_longitude", zoneToEdit.dropoff_longitude);

        // Always populate the input fields with the addresses
        setPickupLocationInput(zoneToEdit.pickup_address || "");
        setDropoffLocationInput(zoneToEdit.dropoff_address || "");

        if (zoneToEdit.pickup_latitude && zoneToEdit.pickup_longitude) {
          setPickupCoords({
            lat: zoneToEdit.pickup_latitude,
            lng: zoneToEdit.pickup_longitude,
          });
        }
        if (zoneToEdit.dropoff_latitude && zoneToEdit.dropoff_longitude) {
          setDropoffCoords({
            lat: zoneToEdit.dropoff_latitude,
            lng: zoneToEdit.dropoff_longitude,
          });
        }
      }
    } else if (!editingZoneId && showZoneDialog) {
      // Reset form when opening for new zone
      resetZone();
      setPickupCoords(null);
      setDropoffCoords(null);
      setPickupLocationInput("");
      setDropoffLocationInput("");
      // Reset selection flags
      justSelectedPickup.current = false;
      justSelectedDropoff.current = false;
    }
  }, [showZoneDialog, editingZoneId, zonesData?.data, resetZone, setZoneValue]);

  const handleAddZone = async (formData: CreateDeliveryZoneDto) => {
    if (editingZoneId) {
      const promise = updateZone.mutateAsync({
        id: editingZoneId,
        data: formData,
      });

      import("sonner").then(({ toast }) => {
        toast.promise(promise, {
          loading: "Updating delivery zone...",
          success: "Delivery zone updated successfully!",
          error: (error) => {
            const errorMessage =
              error instanceof Error
                ? error.message
                : "An unknown error occurred while updating the zone.";
            return `Failed to update zone: ${errorMessage}`;
          },
        });
      });

      promise.then(() => {
        resetZone();
        setPickupCoords(null);
        setDropoffCoords(null);
        setPickupLocationInput("");
        setDropoffLocationInput("");
        setEditingZoneId(null);
        setShowZoneDialog(false);
        // Reset selection flags
        justSelectedPickup.current = false;
        justSelectedDropoff.current = false;
      });
    } else {
      const promise = createZone.mutateAsync(formData);

      import("sonner").then(({ toast }) => {
        toast.promise(promise, {
          loading: "Creating delivery zone...",
          success: "Delivery zone created successfully!",
          error: (error) => {
            const errorMessage =
              error instanceof Error
                ? error.message
                : "An unknown error occurred while creating the zone.";
            return `Failed to create zone: ${errorMessage}`;
          },
        });
      });

      promise.then(() => {
        resetZone();
        setPickupCoords(null);
        setDropoffCoords(null);
        setPickupLocationInput("");
        setDropoffLocationInput("");
        setShowZoneDialog(false);
        // Reset selection flags
        justSelectedPickup.current = false;
        justSelectedDropoff.current = false;
      });
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this delivery zone? This action cannot be undone.",
      )
    ) {
      const promise = deleteZone.mutateAsync(zoneId);

      import("sonner").then(({ toast }) => {
        toast.promise(promise, {
          loading: "Deleting zone...",
          success: "Zone deleted successfully!",
          error: (error) => {
            const errorMessage =
              error instanceof Error
                ? error.message
                : "An unknown error occurred while deleting the zone.";
            return `Failed to delete zone: ${errorMessage}`;
          },
        });
      });
    }
  };



  const handleEditZone = (zone: DeliveryZone) => {
    // Reset selection flags when opening edit dialog
    justSelectedPickup.current = false;
    justSelectedDropoff.current = false;
    
    setEditingZoneId(zone.id);
    setZoneValue("zone_name", zone.zone_name);
    setZoneValue("description", zone.description || "");
    setZoneValue("delivery_fee", zone.delivery_fee);
    setZoneValue("estimated_delivery_time", zone.estimated_delivery_time);
    setZoneValue("coverage_area", zone.coverage_area || "");
    setZoneValue("latitude", zone.latitude);
    setZoneValue("longitude", zone.longitude);

    setShowZoneDialog(true);
  };



  const handlePickupLocationSearch = (input: string) => {
    // If we just selected a suggestion, reset the flag and don't show suggestions
    if (justSelectedPickup.current) {
      justSelectedPickup.current = false;
      setPickupLocationSuggestions([]);
      return;
    }
    setPickupLocationInput(input);
    setZoneValue("pickup_address", input); // Sync with form
    if (input.length > 2 && usePickupAutocomplete.data?.data) {
      setPickupLocationSuggestions(usePickupAutocomplete.data.data);
    } else {
      setPickupLocationSuggestions([]);
    }
  };

  const handleDropoffLocationSearch = (input: string) => {
    // If we just selected a suggestion, reset the flag and don't show suggestions
    if (justSelectedDropoff.current) {
      justSelectedDropoff.current = false;
      setDropoffLocationSuggestions([]);
      return;
    }
    setDropoffLocationInput(input);
    setZoneValue("dropoff_address", input); // Sync with form
    if (input.length > 2 && useDropoffAutocomplete.data?.data) {
      setDropoffLocationSuggestions(useDropoffAutocomplete.data.data);
    } else {
      setDropoffLocationSuggestions([]);
    }
  };

  // Update suggestions when autocomplete data changes
  useEffect(() => {
    // Don't show suggestions if we just selected one
    if (!justSelectedPickup.current && pickupLocationInput.length > 2 && usePickupAutocomplete.data?.data) {
      setPickupLocationSuggestions(usePickupAutocomplete.data.data);
    }
  }, [usePickupAutocomplete.data?.data, pickupLocationInput]);

  useEffect(() => {
    // Don't show suggestions if we just selected one
    if (!justSelectedDropoff.current && dropoffLocationInput.length > 2 && useDropoffAutocomplete.data?.data) {
      setDropoffLocationSuggestions(useDropoffAutocomplete.data.data);
    }
  }, [useDropoffAutocomplete.data?.data, dropoffLocationInput]);

  // Auto-calculate delivery time when both coordinates are available
  useEffect(() => {
    if (pickupCoords && dropoffCoords) {
      const distance = calculateDistance(
        pickupCoords.lat,
        pickupCoords.lng,
        dropoffCoords.lat,
        dropoffCoords.lng,
      );
      const estimatedTime = estimateDeliveryTime(distance);
      setZoneValue("estimated_delivery_time", estimatedTime);
    }
  }, [pickupCoords, dropoffCoords, setZoneValue]);

  const handlePickupLocationSelect = (
    suggestion: GooglePlacesAutocompleteResult,
  ) => {
    getPlaceDetailsMutation.mutate(suggestion.place_id, {
      onSuccess: (response: unknown) => {
        const details = response as {
          data?: { geometry?: { location?: { lat: number; lng: number } }; formatted_address?: string };
        };
        const coords = details?.data?.geometry?.location;
        const address = details?.data?.formatted_address || "";
        if (coords) {
          // Set flag to prevent suggestions from showing when we update the input
          justSelectedPickup.current = true;
          setPickupCoords({ lat: coords.lat, lng: coords.lng });
          setZoneValue("pickup_latitude", coords.lat);
          setZoneValue("pickup_longitude", coords.lng);
          setZoneValue("pickup_address", address);
          setPickupLocationInput(address); // Show selected address in field
          setPickupLocationSuggestions([]);
        }
      },
    });
  };

  const handleDropoffLocationSelect = (
    suggestion: GooglePlacesAutocompleteResult,
  ) => {
    getPlaceDetailsMutation.mutate(suggestion.place_id, {
      onSuccess: (response: unknown) => {
        const details = response as {
          data?: { geometry?: { location?: { lat: number; lng: number } }; formatted_address?: string };
        };
        const coords = details?.data?.geometry?.location;
        const address = details?.data?.formatted_address || "";
        if (coords) {
          // Set flag to prevent suggestions from showing when we update the input
          justSelectedDropoff.current = true;
          setDropoffCoords({ lat: coords.lat, lng: coords.lng });
          setZoneValue("dropoff_latitude", coords.lat);
          setZoneValue("dropoff_longitude", coords.lng);
          setZoneValue("dropoff_address", address);
          setDropoffLocationInput(address); // Show selected address in field
          setDropoffLocationSuggestions([]);
        }
      },
    });
  };

  // ===== RIDERS MANAGEMENT =====
  const [showRiderDialog, setShowRiderDialog] = useState(false);
  const [editingRiderId, setEditingRiderId] = useState<string | null>(null);

  const {
    data: ridersData,
    isLoading: ridersLoading,
    error: ridersError,
  } = DeliveryApi.useGetDeliveryRiders();
  const createRider = DeliveryApi.useCreateDeliveryRider();
  const updateRider = DeliveryApi.useUpdateDeliveryRider();
  const deleteRider = DeliveryApi.useDeleteDeliveryRider();

  const riderForm = useForm<CreateDeliveryRiderDto>({
    defaultValues: {
      name: "",
      phone: "",
      email: "",
    },
  });

  const {
    register: registerRider,
    handleSubmit: handleRiderSubmit,
    reset: resetRider,
    setValue: setRiderValue,
  } = riderForm;

  const handleAddRider = async (formData: CreateDeliveryRiderDto) => {
    if (editingRiderId) {
      const promise = updateRider.mutateAsync({
        id: editingRiderId,
        data: formData,
      });

      import("sonner").then(({ toast }) => {
        toast.promise(promise, {
          loading: "Updating rider...",
          success: "Rider updated successfully!",
          error: (error) => {
            const errorMessage =
              error instanceof Error
                ? error.message
                : "An unknown error occurred while updating the rider.";
            return `Failed to update rider: ${errorMessage}`;
          },
        });
      });

      promise.then(() => {
        resetRider();
        setEditingRiderId(null);
        setShowRiderDialog(false);
      });
    } else {
      const promise = createRider.mutateAsync(formData);

      import("sonner").then(({ toast }) => {
        toast.promise(promise, {
          loading: "Adding rider...",
          success: "Rider added successfully!",
          error: (error) => {
            const errorMessage =
              error instanceof Error
                ? error.message
                : "An unknown error occurred while adding the rider.";
            return `Failed to add rider: ${errorMessage}`;
          },
        });
      });

      promise.then(() => {
        resetRider();
        setShowRiderDialog(false);
      });
    }
  };

  const handleDeleteRider = async (riderId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this rider? This action cannot be undone.",
      )
    ) {
      const promise = deleteRider.mutateAsync(riderId);

      import("sonner").then(({ toast }) => {
        toast.promise(promise, {
          loading: "Deleting rider...",
          success: "Rider deleted successfully!",
          error: (error) => {
            const errorMessage =
              error instanceof Error
                ? error.message
                : "An unknown error occurred while deleting the rider.";
            return `Failed to delete rider: ${errorMessage}`;
          },
        });
      });
    }
  };

  const handleEditRider = (rider: DeliveryRider) => {
    setEditingRiderId(rider.id);
    setRiderValue("name", rider.rider_name);
    setRiderValue("phone", rider.phone_number);
    setRiderValue("email", rider.email || "");
    setShowRiderDialog(true);
  };

  // ===== ORDERS MANAGEMENT =====
  const {
    data: ordersData,
    isLoading: ordersLoading,
    error: ordersError,
  } = DeliveryApi.useGetDeliveryOrders();

  const getErrorMessage = (error: unknown): string => {
    const axiosError = error as unknown as { response?: { data?: { message?: string } } };
    return axiosError?.response?.data?.message || "An error occurred";
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "assigned":
        return "bg-blue-100 text-blue-800";
      case "picked_up":
        return "bg-purple-100 text-purple-800";
      case "in_transit":
        return "bg-indigo-100 text-indigo-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Delivery Zones Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl self-start font-semibold text-primary-600 md:text-lg">Delivery Zones</CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setEditingZoneId(null);
              resetZone();
              setShowZoneDialog(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Zone
          </Button>
        </CardHeader>
        <CardContent>
          {zonesError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <h4 className="font-semibold text-red-900">Error Loading Zones</h4>
              <p className="mt-2 text-sm text-red-800">
                {getErrorMessage(zonesError) ||
                  "Failed to load delivery zones. Please try again."}
              </p>
            </div>
          ) : zonesLoading ? (
            <Loader message="Loading delivery zones" />
          ) : (
            <div className="space-y-3">
              {zonesData?.data && (zonesData.data as DeliveryZone[]).length > 0 ? (
                <div className="grid gap-3">
                  {(zonesData.data as DeliveryZone[]).map((zone) => (
                    <div
                      key={zone.id}
                      className="flex flex-row sm:flex-col justify-between rounded-lg border p-3"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold">{zone.zone_name}</h4>
                        <p className="text-sm text-gray-600">
                          {zone.description}
                        </p>
                        {zone.latitude && zone.longitude && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="h-3 w-3" />
                            {zone.latitude.toFixed(4)}, {zone.longitude.toFixed(4)}
                          </p>
                        )}
                        {zone.pickup_latitude && zone.pickup_longitude && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-green-600">
                            <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
                            Pickup: {zone.pickup_address || `${zone.pickup_latitude.toFixed(4)}, ${zone.pickup_longitude.toFixed(4)}`}
                          </p>
                        )}
                        {zone.dropoff_latitude && zone.dropoff_longitude && (
                          <p className="flex items-center gap-1 text-xs text-blue-600">
                            <span className="inline-block h-2 w-2 rounded-full bg-blue-500"></span>
                            Dropoff: {zone.dropoff_address || `${zone.dropoff_latitude.toFixed(4)}, ${zone.dropoff_longitude.toFixed(4)}`}
                          </p>
                        )}
                        <div className="mt-2 flex gap-4 text-sm">
                          <span>
                            Fee: <strong>₦{zone.delivery_fee}</strong>
                          </span>
                          {/* <span>
                            ETA: <strong>{zone.estimated_delivery_time} min</strong>
                          </span> */}
                          <Badge
                            variant={zone.is_active ? "success" : "secondary"}
                          >
                            {zone.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-row sm:flex-row items-center justify-center gap-2 mt-0 lg:mt-4">
                        <Button
                          variant="outline"
                          className="border border-[#fed7aa] text-[#ff660f] bg-[#ffedd5]"
                          size="sm"
                          onClick={() => handleEditZone(zone)}
                        >
                          <Edit className="h-4 w-4 border" /> Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteZone(zone.id)}
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500">
                  No delivery zones configured yet
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delivery Riders Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl self-start font-semibold text-primary-600 md:text-lg">Delivery Riders</CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setEditingRiderId(null);
              resetRider();
              setShowRiderDialog(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Rider
          </Button>
        </CardHeader>
        <CardContent>
          {ridersError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <h4 className="font-semibold text-red-900">
                Error Loading Riders
              </h4>
              <p className="mt-2 text-sm text-red-800">
                {getErrorMessage(ridersError) ||
                  "Failed to load delivery riders. Please try again."}
              </p>
            </div>
          ) : ridersLoading ? (
            <Loader message="Loading delivery riders" />
          ) : (
            <div className="space-y-3">
              {ridersData?.data &&
              (ridersData.data as DeliveryRider[]).length > 0 ? (
                <div className="grid gap-3">
                  {(ridersData.data as DeliveryRider[]).map((rider) => (
                    <div
                      key={rider.id}
                      className="flex flex-row sm:flex-col justify-between rounded-lg border p-3"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold">{rider.rider_name}</h4>
                        <div className="mt-1 text-sm text-gray-600">
                          <p><Phone className="inline mr-1 h-3 w-3 text-[#ff660f]" /> {rider.phone_number}</p>
                          {rider.email && <p><Mail className="inline mr-1 h-3 w-3 text-[#ff660f]" /> {rider.email}</p>}
                        </div>
                        <div className="mt-2 flex gap-4 text-sm">
                          <Badge
                            variant={
                              rider.status === "active"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {rider.status.replace("_", " ")}
                          </Badge>
                          {/* <span>
                            Deliveries: <strong>{rider.total_deliveries}</strong>
                          </span> */}
                          {rider.rating && (
                            <span>
                              Rating: <strong>⭐ {rider.rating}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-row sm:flex-row items-center justify-center gap-2 mt-0 lg:mt-4">
                        <Button
                          variant="outline"
                          className="border border-[#fed7aa] text-[#ff660f] bg-[#ffedd5]"
                          size="sm"
                          onClick={() => handleEditRider(rider)}
                        >
                          <Edit className="h-4 w-4" /> Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteRider(rider.id)}
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500">
                  No riders added yet
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delivery Orders Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl self-start font-semibold text-primary-600 md:text-lg">Delivery Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {ordersError ? (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <h4 className="font-semibold text-yellow-900">
                ⚠️ Feature Not Available
              </h4>
              {/* <p className="mt-2 text-sm text-yellow-800">
                {getErrorMessage(ordersError).includes("Unknown column")
                  ? "Delivery orders endpoint is not yet fully implemented. Please contact your backend team to complete the setup."
                  : getErrorMessage(ordersError)}
              </p> */}
              <p className="mt-2 text-sm text-yellow-800">
                  {getErrorMessage(ordersError)}
              </p>
            </div>
          ) : ordersLoading ? (
            <Loader message="Loading delivery orders" />
          ) : (
            <div className="space-y-3">
              {ordersData?.data &&
              (ordersData.data as DeliveryOrder[]).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Order ID</th>
                        <th className="px-4 py-2 text-left">Customer</th>
                        <th className="px-4 py-2 text-left">Status</th>
                        <th className="px-4 py-2 text-left">Delivery Fee</th>
                        <th className="px-4 py-2 text-left">Assigned Rider</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(ordersData.data as DeliveryOrder[]).map((order) => (
                        <tr key={order.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-2">{order.order.id}</td>
                          <td className="px-4 py-2">
                            <div>
                              <p className="font-medium">
                                {order.order.user.name}
                              </p>
                              <p className="text-gray-600">
                                {order.order.user.phone}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <Badge
                              className={getStatusBadgeVariant(
                                order.status,
                              )}
                            >
                              {order.status.replace("_", " ")}
                            </Badge>
                          </td>
                          <td className="px-4 py-2">${order.deliveryPrice}</td>
                          <td className="px-4 py-2">
                            {order.rider ? (
                              <span className="rounded bg-blue-50 px-2 py-1 text-blue-700">
                                {order.rider.name} ({order.rider.displayId})
                              </span>
                            ) : (
                              <span className="text-gray-500">Unassigned</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-gray-500">
                  No delivery orders yet
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Zone Dialog */}
      <Dialog open={showZoneDialog} onOpenChange={setShowZoneDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingZoneId ? "Edit Delivery Zone" : "Create New Delivery Zone"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleZoneSubmit(handleAddZone)}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="zone_name">Zone Name *</Label>
              <Input
                id="zone_name"
                placeholder="e.g., Downtown"
                {...registerZone("zone_name", {
                  required: "Zone name is required",
                  minLength: {
                    value: 2,
                    message: "Zone name must be at least 2 characters",
                  },
                })}
              />
              {zoneErrors.zone_name && (
                <p className="mt-1 text-sm text-red-600">
                  {zoneErrors.zone_name.message}
                </p>
              )}
            </div>

            {/* Route-based delivery zone */}
            <div className="rounded-lg border-2 border-orange-200 bg-gray-50 p-4">
              <h3 className="mb-4 font-semibold text-orange-600">🚗 Route-Based Delivery Zone</h3>
              
              <div className="mb-4 space-y-3">
                <div>
                  <Label htmlFor="pickup_address" className="flex items-center gap-2">
                    <span className="inline-block h-3 w-3 rounded-full bg-green-500"></span>
                    Pickup Address
                  </Label>
                  <div className="relative z-30">
                    <Input
                      id="pickup_address"
                      placeholder="Search pickup location..."
                      value={pickupLocationInput}
                      onChange={(e) => handlePickupLocationSearch(e.target.value)}
                      className="mb-2"
                    />
                    {pickupLocationSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-20 mt-1 max-h-48 overflow-y-auto rounded-md border bg-white shadow-lg">
                        {pickupLocationSuggestions.map((suggestion) => (
                          <button
                            key={suggestion.place_id}
                            type="button"
                            onClick={() => handlePickupLocationSelect(suggestion)}
                            className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                          >
                            <p className="font-medium">
                              {suggestion.structured_formatting.main_text}
                            </p>
                            <p className="text-sm text-gray-600">
                              {suggestion.structured_formatting.secondary_text}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="dropoff_address" className="flex items-center gap-2">
                    <span className="inline-block h-3 w-3 rounded-full bg-blue-500"></span>
                    Dropoff Address
                  </Label>
                  <div className="relative z-20">
                    <Input
                      id="dropoff_address"
                      placeholder="Search dropoff location..."
                      value={dropoffLocationInput}
                      onChange={(e) => handleDropoffLocationSearch(e.target.value)}
                      className="mb-2"
                    />
                    {dropoffLocationSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-20 mt-1 max-h-48 overflow-y-auto rounded-md border bg-white shadow-lg">
                        {dropoffLocationSuggestions.map((suggestion) => (
                          <button
                            key={suggestion.place_id}
                            type="button"
                            onClick={() => handleDropoffLocationSelect(suggestion)}
                            className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                          >
                            <p className="font-medium">
                              {suggestion.structured_formatting.main_text}
                            </p>
                            <p className="text-sm text-gray-600">
                              {suggestion.structured_formatting.secondary_text}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <Label>Route Map Preview</Label>
                <DeliveryZoneMap
                  onLocationSelect={() => {}} // Not used in route mode
                  pickupCoords={pickupCoords || undefined}
                  dropoffCoords={dropoffCoords || undefined}
                  mode="route"
                  onPickupSelect={(lat, lng) => {
                    setPickupCoords({ lat, lng });
                    setZoneValue("pickup_latitude", lat);
                    setZoneValue("pickup_longitude", lng);
                    // Reverse geocode to get address name from coordinates
                    reverseGeocodeMutation.mutate(
                      { lat, lng },
                      {
                        onSuccess: (response: unknown) => {
                          const result = response as {
                            data?: { formatted_address?: string };
                          };
                          const address = result?.data?.formatted_address || `📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                          setPickupLocationInput(address);
                          setZoneValue("pickup_address", address);
                        },
                        onError: () => {
                          // Fallback to coordinates if reverse geocoding fails
                          const coordLabel = `📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                          setPickupLocationInput(coordLabel);
                          setZoneValue("pickup_address", coordLabel);
                        },
                      },
                    );
                  }}
                  onDropoffSelect={(lat, lng) => {
                    setDropoffCoords({ lat, lng });
                    setZoneValue("dropoff_latitude", lat);
                    setZoneValue("dropoff_longitude", lng);
                    // Reverse geocode to get address name from coordinates
                    reverseGeocodeMutation.mutate(
                      { lat, lng },
                      {
                        onSuccess: (response: unknown) => {
                          const result = response as {
                            data?: { formatted_address?: string };
                          };
                          const address = result?.data?.formatted_address || `📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                          setDropoffLocationInput(address);
                          setZoneValue("dropoff_address", address);
                        },
                        onError: () => {
                          // Fallback to coordinates if reverse geocoding fails
                          const coordLabel = `📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                          setDropoffLocationInput(coordLabel);
                          setZoneValue("dropoff_address", coordLabel);
                        },
                      },
                    );
                  }}
                />
              </div>

              {pickupCoords && dropoffCoords && (
                <div className="rounded-lg bg-green-50 p-3">
                  <p className="text-sm font-semibold text-green-900">
                    ✓ Route Ready
                  </p>
                  <p className="mt-1 text-sm text-green-800">
                    Pickup: ({pickupCoords.lat.toFixed(6)}, {pickupCoords.lng.toFixed(6)})
                  </p>
                  <p className="text-sm text-green-800">
                    Dropoff: ({dropoffCoords.lat.toFixed(6)}, {dropoffCoords.lng.toFixed(6)})
                  </p>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Zone coverage details"
                {...registerZone("description")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="delivery_fee">Delivery Fee ($)</Label>
                <Input
                  id="delivery_fee"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...registerZone("delivery_fee", {
                    valueAsNumber: true,
                  })}
                />
              </div>
              <div>
                <Label htmlFor="estimated_delivery_time">
                  Est. Delivery Time (minutes)
                </Label>
                <Input
                  id="estimated_delivery_time"
                  type="number"
                  placeholder="30"
                  {...registerZone("estimated_delivery_time", {
                    valueAsNumber: true,
                  })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="coverage_area">Coverage Area</Label>
              <Input
                id="coverage_area"
                placeholder="e.g., Downtown, Suburb areas"
                {...registerZone("coverage_area")}
              />
            </div>

            <Button type="submit" className="w-full">
              {editingZoneId ? "Update Zone" : "Create Zone"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Rider Dialog */}
      <Dialog open={showRiderDialog} onOpenChange={setShowRiderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRiderId ? "Edit Rider" : "Add New Rider"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleRiderSubmit(handleAddRider)}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="name">Rider Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                {...registerRider("name")}
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="+1 (555) 123-4567"
                {...registerRider("phone")}
              />
            </div>

            <div>
              <Label htmlFor="email">Email <span className="text-gray-600">(Optional)</span></Label>
              <Input
                id="email"
                type="email"
                placeholder="rider@example.com"
                {...registerRider("email")}
              />
            </div>

            <Button type="submit" className="w-full">
              {editingRiderId ? "Update Rider" : "Add Rider"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
