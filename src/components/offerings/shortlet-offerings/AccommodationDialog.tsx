"use client";

import { FileUploader } from "@/components/offerings/shared/FileUploader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Label } from "@/components/ui/label";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useDebounce } from "@/hooks/useDebounce";
import { useUserLocation } from "@/hooks/useUserLocation";
import {
  AccommodationAttractionApi,
  IAccommodationCategory,
} from "@/services/api/accomodation-attraction-api";
import {
  GooglePlacesApi,
  GooglePlacesAutocompleteResult,
} from "@/services/api/google-places-api";
import { useAuthStore } from "@/stores/auth-store";
import {
  IAccommodation,
  // IAttraction,
  ICreateAccommodationDto,
  IDefaultAttraction,
  IUpdateAccommodationDto,
} from "@/types/accomodation-attraction-types";
import { BusinessCategoryType } from "@/types/enums";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm, type FieldValues } from "react-hook-form";
import { z } from "zod";

const buildAccommodationSchema = (businessType: string) => {
  const baseObject = z.object({
    apartment_name: z.string().min(1, "Accommodation name is required"),
    category_id: z.string().optional().default(""),
    custom_category_name: z.string().optional().default(""),
    apartment_description: z.string().min(1, "Description is required"),
    total_units: z.coerce
      .number({
        invalid_type_error: "Number of rooms must be a number",
      })
      .min(1, "Number of rooms is required"),
    maximum_occupants: z.coerce.number().optional(),
    number_of_bedrooms: z.coerce.number().optional(),
    location: z
      .object({
        address: z.string().min(1, "Address is required"),
        city: z.string().min(1, "City is required"),
        state: z.string().min(1, "State is required"),
        country: z.string().min(1, "Country is required"),
        latitude: z.number({
          invalid_type_error: "Location coordinates are required. Please select your address from the dropdown suggestions.",
        }).min(-90).max(90),
        longitude: z.number({
          invalid_type_error: "Location coordinates are required. Please select your address from the dropdown suggestions.",
        }).min(-180).max(180),
      })
      .strict(),
    specifications: z.record(z.string(), z.any()).optional(),
    pricing: z.object({
      basePricePerNight: z.coerce
        .number({
          invalid_type_error: "Price per night must be a number",
        })
        .gt(0, "Price per night is required"),
      discounts: z
        .array(
          z.object({
            minNights: z.coerce
              .number({
                invalid_type_error: "Minimum nights must be a number",
              })
              .min(1, "Minimum nights must be at least 1"),
            percentage: z.coerce
              .number({
                invalid_type_error: "Percentage must be a number",
              })
              .min(0, "Percentage must be 0 or higher")
              .max(100, "Percentage cannot exceed 100"),
          })
        )
        .optional()
        .default([]),
    }),
    rules: z
      .object({
        checkInTime: z.string().min(1, "Check-in time is required"),
        checkOutTime: z.string().min(1, "Check-out time is required"),
        allowParties: z.boolean().optional(),
        allowPets: z.boolean().optional(),
      })
      .strict(),
    default_attraction_ids: z.array(z.string()).optional().default([]),
    images: z.array(z.string()).optional(),
  });

  let schema;

  switch (businessType) {
    case "SHORTLET":
      schema = baseObject.extend({
        specifications: z
          .object({
            guestCapacity: z.coerce
              .number({ invalid_type_error: "Guest capacity must be a number" })
              .min(1, "Guest capacity is required"),
            bedrooms: z.coerce.number().optional(),
            pools: z.coerce.number().optional(),
            bathrooms: z.coerce.number().optional(),
          })
          .strict(),
      });
      break;

    case "HOTELEXPERIENCE":
      schema = baseObject.extend({
        specifications: z
          .object({
            guestCapacity: z.coerce
              .number({ invalid_type_error: "Guest capacity must be a number" })
              .min(1, "Guest capacity is required"),
            bedType: z.string().min(1, "Bed type is required"),
            hasMinibar: z.boolean().optional(),
            floor: z.coerce
              .number({ invalid_type_error: "Floor must be a number" })
              .min(1, "Floor is required"),
          })
          .strict(),
      });
      break;

    case "BEACHESRESORTS":
      schema = baseObject.extend({
        specifications: z
          .object({
            guestCapacity: z.coerce
              .number({ invalid_type_error: "Guest capacity must be a number" })
              .min(1, "Guest capacity is required"),
            roomView: z.string().optional(),
            deckSizeSqFt: z.coerce.number().optional(),
            bedrooms: z.coerce.number().optional(),
            bathrooms: z.coerce.number().optional(),
          })
          .strict(),
      });
      break;

    default:
      schema = baseObject;
  }

  return schema;
};

type AccommodationFormData = z.infer<
  ReturnType<typeof buildAccommodationSchema>
>;

// ── Category input mode toggle ────────────────────────────────────────────────
type CategoryMode = "standard" | "custom";

interface AccommodationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  accommodation?: IAccommodation | null;
  mode: "create" | "edit";
}

export default function AccommodationDialog({
  isOpen,
  onClose,
  accommodation,
  mode,
}: AccommodationDialogProps) {
  const createAccommodationMutation =
    AccommodationAttractionApi.useCreateAccommodation();
  const updateAccommodationMutation =
    AccommodationAttractionApi.useUpdateAccommodation();

  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>(
    mode === "edit" && accommodation?.image_urls
      ? accommodation.image_urls
      : [],
  );
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<
    GooglePlacesAutocompleteResult[]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Category mode: "standard" uses dropdown, "custom" uses text input ──────
  const [categoryMode, setCategoryMode] = useState<CategoryMode>("standard");

  const isInitializingRef = useRef(false);
  // Prevents the blur handler from hiding the dropdown when the user is clicking a suggestion
  const mouseDownOnSuggestionRef = useRef(false);

  const { location: userLocation } = useUserLocation(false);

  const business = useAuthStore((s) => s.business);
  const signedBusinessType =
    (business && business.category?.business_type) || "";

  const categoriesQuery =
    AccommodationAttractionApi.useAccommodationCategories(signedBusinessType);
  const defaultAttractionsQuery =
    AccommodationAttractionApi.useDefaultAttractions(signedBusinessType);

  const form = useForm<AccommodationFormData>({
    resolver: zodResolver(buildAccommodationSchema(signedBusinessType || "")),
    defaultValues: {
      apartment_name: "",
      category_id: "",
      custom_category_name: "",
      apartment_description: "",
      total_units: undefined,
      maximum_occupants: undefined,
      number_of_bedrooms: undefined,
      location: {
        address: "",
        city: "",
        state: "",
        country: "",
        latitude: undefined,
        longitude: undefined,
      },
      specifications: {},
      pricing: {
        basePricePerNight: undefined,
        discounts: [],
      },
      rules: {
        checkInTime: "14:00",
        checkOutTime: "11:00",
        allowParties: false,
        allowPets: false,
      },
      default_attraction_ids: [],
    },
  });

  const watchedDefaultAttractions = form.watch("default_attraction_ids");
  const addressInput = form.watch("location.address") || "";
  const debouncedAddress = useDebounce(addressInput, 500);

  // ── Mutual exclusivity handlers ────────────────────────────────────────────
  const handleCategoryModeSwitch = useCallback(
    (next: CategoryMode) => {
      setCategoryMode(next);
      if (next === "standard") {
        // Clear custom name when switching to standard dropdown
        form.setValue("custom_category_name", "", { shouldValidate: false });
      } else {
        // Clear standard category when switching to custom
        form.setValue("category_id", "", { shouldValidate: false });
      }
    },
    [form],
  );

  // FileUploader callbacks
  const handleFileChange = (files: File[] | null) => {
    if (files && files.length > 0) {
      setSelectedImages(files);
    } else {
      setSelectedImages([]);
    }
  };

  const handleFilePreviewChange = (previews: string[] | null) => {
    setImagePreviews(previews || []);
  };

  // Business type specific configuration
  const businessConfig = useMemo(() => {
    switch (signedBusinessType) {
      case BusinessCategoryType.SHORTLET:
        return {
          unitLabel: "Number of units",
          specifications: [
            { key: "guestCapacity", label: "Guest capacity", type: "number" },
            { key: "bedrooms", label: "Bedrooms", type: "number" },
            { key: "pools", label: "Pools", type: "number" },
            { key: "bathrooms", label: "Bathrooms", type: "number" },
          ],
          showLocation: true,
        };
      case BusinessCategoryType.HOTELEXPERIENCE:
        return {
          unitLabel: "Number of rooms",
          specifications: [
            { key: "guestCapacity", label: "Guest capacity", type: "number" },
            { key: "bedType", label: "Bed type", type: "text" },
            { key: "hasMinibar", label: "Has minibar", type: "checkbox" },
            { key: "floor", label: "Floor", type: "number" },
          ],
          showLocation: true,
        };
      case BusinessCategoryType.BEACHESRESORTS:
        return {
          unitLabel: "Number of villas/suites",
          specifications: [
            { key: "guestCapacity", label: "Guest capacity", type: "number" },
            { key: "roomView", label: "Room view", type: "text" },
            { key: "deckSizeSqFt", label: "Deck size (sq ft)", type: "number" },
            { key: "bedrooms", label: "Bedrooms", type: "number" },
            { key: "bathrooms", label: "Bathrooms", type: "number" },
          ],
          showLocation: true,
        };
      default:
        return {
          unitLabel: "Number of units",
          specifications: [],
          showLocation: false,
        };
    }
  }, [signedBusinessType]);

  // Debug form validity
  useEffect(() => {
    if (isOpen) {
      const subscription = form.watch(() => {
        const isValid = form.formState.isValid;
        const errors = form.formState.errors;
        if (!isValid) {
          console.debug("Form invalid. Errors:", errors);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [isOpen, form]);

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && accommodation) {
        const accommodationBusinessType = accommodation.category?.business_type;
        const normalizeBusinessType = (type: string) =>
          type.toLowerCase().replace(/[\s_]/g, "");

        const accommodationNormalized = normalizeBusinessType(
          accommodationBusinessType || "",
        );
        const currentNormalized = normalizeBusinessType(signedBusinessType);

        let categoryIdToUse = "";
        if (
          accommodationBusinessType &&
          accommodationNormalized !== currentNormalized
        ) {
          categoryIdToUse = "";
        } else if (
          accommodationBusinessType &&
          accommodationNormalized === currentNormalized
        ) {
          categoryIdToUse = accommodation.category?.id || "";
        } else {
          categoryIdToUse = accommodation.category?.id || "";
        }

        let finalCategoryId = "";
        let finalCustomCategoryName = "";

        if (
          accommodation.custom_category_name &&
          accommodation.custom_category_name.trim() !== ""
        ) {
          finalCustomCategoryName = accommodation.custom_category_name;
          finalCategoryId = "";
          // ── Set mode to custom on edit load ──────────────────────────────
          setCategoryMode("custom");
        } else {
          finalCategoryId = categoryIdToUse;
          finalCustomCategoryName = "";
          setCategoryMode("standard");
        }

        isInitializingRef.current = true;

        form.reset({
          apartment_name: accommodation.apartment_name,
          category_id: finalCategoryId,
          custom_category_name: finalCustomCategoryName,
          apartment_description: accommodation.apartment_description,
          total_units: accommodation.total_units,
          maximum_occupants: (
            accommodation as unknown as { maximum_occupants?: number }
          ).maximum_occupants,
          number_of_bedrooms: (
            accommodation as unknown as { number_of_bedrooms?: number }
          ).number_of_bedrooms,
          location: accommodation.location,
          specifications: accommodation.specifications,
          pricing: {
            basePricePerNight: accommodation.pricing?.basePricePerNight,
            discounts: accommodation.pricing?.discounts || [],
          },
          rules: accommodation.rules,
          default_attraction_ids: accommodation.default_attraction_ids || [],
        });

        queueMicrotask(() => {
          isInitializingRef.current = false;
        });

        setSelectedImages([]);
        setImagePreviews(accommodation.image_urls || []);

        if (
          accommodationBusinessType &&
          accommodationNormalized !== currentNormalized
        ) {
          form.setError("category_id", {
            message: `This accommodation was created for ${accommodationBusinessType}. Please select a category for ${signedBusinessType}.`,
          });
        }
      } else {
        isInitializingRef.current = true;
        setCategoryMode("standard");

        form.reset({
          apartment_name: "",
          category_id: "",
          custom_category_name: "",
          apartment_description: "",
          total_units: undefined,
          maximum_occupants: undefined,
          number_of_bedrooms: undefined,
          location: {
            address: "",
            city: "",
            state: "",
            country: "",
            latitude: undefined,
            longitude: undefined,
          },
          specifications: {},
          pricing: {
            basePricePerNight: undefined,
            discounts: [],
          },
          rules: {
            checkInTime: "14:00",
            checkOutTime: "11:00",
            allowParties: false,
            allowPets: false,
          },
          default_attraction_ids: [],
        });

        queueMicrotask(() => {
          isInitializingRef.current = false;
        });

        setSelectedImages([]);
        setImagePreviews([]);
      }
    }
  }, [isOpen, mode, accommodation, form, signedBusinessType]);

  // After categories load, update form category_id to show in the dropdown
  useEffect(() => {
    if (
      isOpen &&
      mode === "edit" &&
      accommodation &&
      categoriesQuery.data?.data &&
      !form.getValues("category_id")
    ) {
      const data = categoriesQuery.data.data;
      const categories = Array.isArray(data)
        ? data
        : [...(data.default || []), ...(data.custom || [])];

      const categoryId = accommodation.category?.id;
      const categoryExists =
        categoryId && categories.some((cat) => cat.id === categoryId);

      if (categoryExists && categoryId) {
        form.setValue("category_id", categoryId);
      }
    }
  }, [categoriesQuery.data, isOpen, mode, accommodation, form]);

  const getValidSpecifications = (
    specs: Record<string, unknown> | undefined,
  ): Record<string, unknown> | undefined => {
    if (!specs || Object.keys(specs).length === 0) return undefined;

    const filtered: Record<string, unknown> = {};
    Object.entries(specs).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        filtered[key] = value;
      }
    });

    return Object.keys(filtered).length > 0 ? filtered : undefined;
  };

  const onInvalidSubmit = (errors: FieldValues) => {
    // Collect all error messages with their field paths
    const errorMessages: string[] = [];
    let hasLocationError = false;

    const collectErrors = (obj: Record<string, unknown>, prefix = "") => {
      Object.entries(obj).forEach(([key, value]) => {
        const fieldPath = prefix ? `${prefix}.${key}` : key;
        if (
          value &&
          typeof value === "object" &&
          "message" in value &&
          typeof (value as Record<string, unknown>).message === "string"
        ) {
          const message = (value as Record<string, unknown>).message as string;
          errorMessages.push(message);
          
          // Check if this is a location-related field error
          if (
            fieldPath.includes("location") &&
            (fieldPath.includes("latitude") || fieldPath.includes("longitude"))
          ) {
            hasLocationError = true;
          }
        } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          collectErrors(value as Record<string, unknown>, fieldPath);
        }
      });
    };

    collectErrors(errors);

    // Set error message - prioritize location/coordinates errors
    if (
      hasLocationError ||
      errorMessages.some((msg) =>
        msg.includes("coordinates") || msg.includes("Location")
      )
    ) {
      setSubmitError(
        "Please select your accommodation location from the dropdown suggestions to enable location tracking.",
      );
    } else {
      setSubmitError(
        errorMessages.length > 0
          ? errorMessages[0]
          : "Please fill in all required fields",
      );
    }
  };

  const onSubmit = async (data: AccommodationFormData) => {
    setSubmitError(null);
    
    const existingUrls = imagePreviews.filter(
      (p) => !p.startsWith("data:") && !p.startsWith("blob:"),
    );
    const imagesToSend = [...existingUrls, ...selectedImages];

    if (mode === "create" && imagesToSend.length === 0) {
      console.warn("Creating accommodation without images");
    }

    try {
      console.log("Raw form data received:", data);
      console.log("Pricing from form:", data.pricing);
      console.log("Discounts from form:", data.pricing.discounts);
      console.log("Discounts length:", data.pricing.discounts?.length);

      const accommodationData: ICreateAccommodationDto = {
        apartment_name: data.apartment_name,
        ...(data.category_id && { category_id: data.category_id }),
        ...(data.custom_category_name && {
          custom_category_name: data.custom_category_name,
        }),
        apartment_description: data.apartment_description,
        total_units: data.total_units,
        location: {
          address: data.location?.address,
          city: data.location?.city,
          state: data.location?.state,
          country: data.location?.country,
          latitude: data.location?.latitude,
          longitude: data.location?.longitude,
        },
        specifications:
          mode === "edit"
            ? getValidSpecifications(data.specifications)
            : data.specifications,
        pricing: {
          basePricePerNight: data.pricing.basePricePerNight,
          ...(data.pricing.discounts?.length > 0
            ? { discounts: data.pricing.discounts }
            : {}),
        },
        rules: {
          checkInTime: data.rules.checkInTime,
          checkOutTime: data.rules.checkOutTime,
          allowParties: data.rules.allowParties === true,
          allowPets: data.rules.allowPets === true,
        },
        default_attraction_ids: data.default_attraction_ids || [],
      };

      console.log("Submitting accommodationData:", accommodationData);

      if (mode === "create") {
        await createAccommodationMutation.mutateAsync({
          accommodationData,
          images: imagesToSend,
        });
      } else if (mode === "edit" && accommodation) {
        await updateAccommodationMutation.mutateAsync({
          id: accommodation.id,
          accommodationData: accommodationData as IUpdateAccommodationDto,
          images: imagesToSend,
        });
      }

      handleClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : `Failed to ${mode} accommodation`;
      setSubmitError(errorMessage);
      console.error(`Failed to ${mode} accommodation:`, error);
    }
  };

  const handleClose = () => {
    form.reset();
    setSelectedImages([]);
    setImagePreviews([]);
    setAutocompleteSuggestions([]);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    setSubmitError(null);
    onClose();
  };

  const isLoading =
    createAccommodationMutation.isPending ||
    updateAccommodationMutation.isPending;

  // Fetch autocomplete suggestions with debounced input
  const autocompleteQuery = GooglePlacesApi.useGetAutocomplete({
    input: debouncedAddress,
    lat: userLocation?.lat,
    lng: userLocation?.lng,
  });

  // Update suggestions when autocomplete data changes
  useEffect(() => {
    if (autocompleteQuery.data?.data && debouncedAddress.length > 2) {
      setAutocompleteSuggestions(autocompleteQuery.data.data);
      setHighlightedIndex(-1);
      setShowSuggestions(true);
    } else {
      setAutocompleteSuggestions([]);
      setShowSuggestions(false);
    }
  }, [autocompleteQuery.data, debouncedAddress]);

  const { mutate: fetchPlaceDetails, isPending: isFetchingPlaceDetails } =
    GooglePlacesApi.useGetPlaceDetailsMutation();

  const handlePlaceSelect = (suggestion: GooglePlacesAutocompleteResult) => {
    if (!suggestion?.place_id) return;

    form.setValue("location.address", suggestion.description);
    setShowSuggestions(false);
    setHighlightedIndex(-1);

    fetchPlaceDetails(suggestion.place_id, {
      onSuccess: (data) => {
        if (data?.data) {
          const { geometry, formatted_address, address_components } = data.data;

          form.setValue("location.latitude", geometry.location.lat);
          form.setValue("location.longitude", geometry.location.lng);
          form.setValue("location.address", formatted_address);

          if (address_components) {
            const city = address_components.find((comp) =>
              comp.types.includes("locality"),
            );
            const state = address_components.find((comp) =>
              comp.types.includes("administrative_area_level_1"),
            );
            const country = address_components.find((comp) =>
              comp.types.includes("country"),
            );

            if (city) form.setValue("location.city", city.long_name);
            if (state) form.setValue("location.state", state.long_name);
            if (country) form.setValue("location.country", country.long_name);
          }
        }
      },
      onError: (error) => {
        console.error("Failed to fetch place details:", error);
      },
    });
  };

  // ── Keyboard navigation for autocomplete ─────────────────────────────────
  const handleAddressKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || autocompleteSuggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < autocompleteSuggestions.length - 1 ? prev + 1 : 0,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : autocompleteSuggestions.length - 1,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0) {
        handlePlaceSelect(autocompleteSuggestions[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  };

  // ── Clear address ─────────────────────────────────────────────────────────
  const handleClearAddress = () => {
    form.setValue("location.address", "");
    form.setValue("location.city", "");
    form.setValue("location.state", "");
    form.setValue("location.country", "");
    // Note: Keep latitude/longitude as they're required. User must select a new address to get new coordinates.
    setAutocompleteSuggestions([]);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {mode === "create" ? "Add New Accommodation" : "Edit Accommodation"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new accommodation listing for your business"
              : "Update the details of your accommodation"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, onInvalidSubmit)}
            className="space-y-6 py-4"
          >
            {/* Error Alert */}
            {submitError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md flex gap-2">
                <svg
                  className="h-5 w-5 text-red-600 shrink-0 mt-0.5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">{submitError}</p>
                  {submitError.includes("coordinates") && (
                    <p className="text-xs text-red-700 mt-1">
                      💡 Tip: Select your address from the dropdown suggestions to auto-populate the location coordinates.
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSubmitError(null)}
                  className="text-red-400 hover:text-red-600"
                >
                  <svg
                    className="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            )}

            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">
                Basic Information
              </h3>

              <FormField
                control={form.control}
                name="apartment_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Accommodation Name{" "}
                      <span className="text-red-700 font-bold">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Sunset Beach Villa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ── Category toggle ──────────────────────────────────────────── */}
              <div className="space-y-3">
                <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg w-fit">
                  <button
                    type="button"
                    onClick={() => handleCategoryModeSwitch("standard")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      categoryMode === "standard"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Standard category
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCategoryModeSwitch("custom")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      categoryMode === "custom"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Custom category
                  </button>
                </div>

                {categoryMode === "standard" ? (
                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => {
                      const isDisabled =
                        categoriesQuery.isLoading ||
                        !categoriesQuery.data?.data;
                      const categories = (() => {
                        if (!categoriesQuery.data?.data) return [];
                        const data = categoriesQuery.data.data;
                        return Array.isArray(data)
                          ? data
                          : [...(data.default || []), ...(data.custom || [])];
                      })();

                      return (
                        <FormItem>
                          <FormLabel>
                            Category{" "}
                            <span className="text-red-700 font-bold">*</span>
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={isDisabled}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    categoriesQuery.isLoading
                                      ? "Loading categories..."
                                      : "Select accommodation category"
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            {categories.length > 0 && (
                              <SelectContent>
                                {categories.map(
                                  (cat: IAccommodationCategory) => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                      {cat.name}
                                    </SelectItem>
                                  ),
                                )}
                              </SelectContent>
                            )}
                          </Select>
                          {!categoriesQuery.isLoading &&
                            categories.length === 0 && (
                              <p className="text-sm text-red-500 mt-2">
                                No categories available
                              </p>
                            )}
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="custom_category_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Custom Category Name{" "}
                          <span className="text-red-700 font-bold">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Royal Penthouse, Garden Villa"
                            {...field}
                          />
                        </FormControl>
                        <p className="text-xs text-gray-500 mt-1">
                          Use this for unique room types not in the standard
                          list
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <FormField
                control={form.control}
                name="apartment_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Description{" "}
                      <span className="text-red-700 font-bold">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your accommodation, amenities, and features..."
                        rows={4}
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Property Details Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">
                Property Details
              </h3>

              <FormField
                control={form.control}
                name="total_units"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {businessConfig.unitLabel}{" "}
                      <span className="text-red-700 font-bold">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter total units"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || undefined)
                        }
                        min="1"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {businessConfig.specifications.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {businessConfig.specifications.map((spec) => (
                    <FormField
                      key={spec.key}
                      control={form.control}
                      name={
                        `specifications.${spec.key}` as `specifications.${string}`
                      }
                      render={({ field }) => {
                        const isRequiredField =
                          spec.key === "guestCapacity" ||
                          spec.key === "bedType" ||
                          spec.key === "floor";
                        return (
                          <FormItem>
                            <FormLabel>
                              {spec.label}
                              {isRequiredField && (
                                <span className="text-red-700 font-bold">
                                  {" "}
                                  *
                                </span>
                              )}
                            </FormLabel>
                            <FormControl>
                              {spec.type === "checkbox" ? (
                                <div className="flex items-center gap-2 h-10">
                                  <Checkbox
                                    checked={field.value || false}
                                    onCheckedChange={(checked) =>
                                      field.onChange(checked)
                                    }
                                  />
                                </div>
                              ) : (
                                <Input
                                  type={spec.type}
                                  placeholder={`Enter ${spec.label.toLowerCase()}`}
                                  {...field}
                                  onChange={(e) =>
                                    spec.type === "number"
                                      ? field.onChange(
                                          parseInt(e.target.value) || undefined,
                                        )
                                      : field.onChange(e.target.value)
                                  }
                                  min={spec.type === "number" ? "0" : undefined}
                                />
                              )}
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Pricing Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">
                Pricing
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pricing.basePricePerNight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Price per Night (₦){" "}
                        <span className="text-red-700 font-bold">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter base price"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              parseFloat(e.target.value) || undefined,
                            )
                          }
                          min="0"
                          step="1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Tiered Discounts Section */}
              <div className="space-y-3 mt-4 p-4 bg-blue-50 rounded-md">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700">
                      Tiered Discounts <span className="text-orange-500 text-xs">(Optional)</span>
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Add discounts based on minimum night stays
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const currentDiscounts = form.getValues("pricing.discounts") || [];
                      form.setValue("pricing.discounts", [
                        ...currentDiscounts,
                        { minNights: 7, percentage: 10 },
                      ]);
                    }}
                    className="text-blue-600 border-blue-600 hover:bg-blue-100"
                  >
                    + Add Tier
                  </Button>
                </div>

                {form.watch("pricing.discounts")?.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">
                    No discount tiers added yet. Click &quot;Add Tier&quot; to create one.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {form.watch("pricing.discounts")?.map((discount, index) => (
                      <div key={index} className="flex gap-2 items-end">
                        <FormField
                          control={form.control}
                          name={`pricing.discounts.${index}.minNights`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel className="text-xs">Min. Nights</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="7"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value ? parseInt(e.target.value, 10) : 0,
                                    )
                                  }
                                  min="1"
                                  step="1"
                                />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`pricing.discounts.${index}.percentage`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel className="text-xs">Discount %</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="10"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value ? parseInt(e.target.value, 10) : 0,
                                    )
                                  }
                                  min="0"
                                  max="100"
                                  step="1"
                                />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const currentDiscounts =
                              form.getValues("pricing.discounts") || [];
                            form.setValue(
                              "pricing.discounts",
                              currentDiscounts.filter((_, i) => i !== index),
                            );
                          }}
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Location Section */}
            {businessConfig.showLocation && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">
                  Location
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="location.address"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>
                          Address{" "}
                          <span className="text-red-700 font-bold">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder="Start typing to search for an address..."
                              {...field}
                              onChange={(e) => {
                                field.onChange(e.target.value);
                              }}
                              onFocus={() => {
                                if (autocompleteSuggestions.length > 0) {
                                  setShowSuggestions(true);
                                }
                              }}
                              onBlur={() => {
                                // Only close if user is NOT clicking a suggestion row
                                if (!mouseDownOnSuggestionRef.current) {
                                  setShowSuggestions(false);
                                  setHighlightedIndex(-1);
                                }
                              }}
                              onKeyDown={handleAddressKeyDown}
                              disabled={isFetchingPlaceDetails}
                              autoComplete="off"
                              className="pr-16"
                            />

                            {/* Right-side indicators */}
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                              {autocompleteQuery.isLoading &&
                                debouncedAddress.length > 2 && (
                                  <svg
                                    className="animate-spin h-4 w-4 text-gray-400"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    />
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8v8z"
                                    />
                                  </svg>
                                )}
                              {isFetchingPlaceDetails && (
                                <span className="text-xs text-gray-400">
                                  Loading…
                                </span>
                              )}
                              {field.value && !isFetchingPlaceDetails && (
                                <button
                                  type="button"
                                  onClick={handleClearAddress}
                                  className="p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                                  aria-label="Clear address"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        </FormControl>

                        {/* Dropdown suggestions */}
                        {showSuggestions &&
                          autocompleteSuggestions.length > 0 && (
                            <div className="mt-1 border border-gray-200 rounded-md shadow-lg bg-white z-50 max-h-60 overflow-y-auto">
                              {autocompleteSuggestions.map(
                                (suggestion, idx) => (
                                  <div
                                    key={suggestion.place_id}
                                    className={`p-3 cursor-pointer border-b last:border-b-0 transition-colors flex items-start gap-2 ${
                                      idx === highlightedIndex
                                        ? "bg-primary/10 text-primary"
                                        : "hover:bg-gray-50"
                                    }`}
                                    // Use mousedown instead of click so it fires before the input blur
                                    onMouseDown={(e) => {
                                      e.preventDefault(); // Prevents input blur
                                      mouseDownOnSuggestionRef.current = true;
                                      handlePlaceSelect(suggestion);
                                      // Reset flag after the event cycle
                                      setTimeout(() => {
                                        mouseDownOnSuggestionRef.current = false;
                                      }, 0);
                                    }}
                                  >
                                    <svg
                                      className="mt-0.5 shrink-0 text-gray-400"
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="14"
                                      height="14"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                      <circle cx="12" cy="10" r="3" />
                                    </svg>
                                    <div className="min-w-0">
                                      <div className="font-medium text-sm truncate">
                                        {suggestion.structured_formatting
                                          ?.main_text || suggestion.description}
                                      </div>
                                      {suggestion.structured_formatting
                                        ?.secondary_text && (
                                        <div className="text-xs text-gray-500 truncate">
                                          {
                                            suggestion.structured_formatting
                                              .secondary_text
                                          }
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          )}

                        <p className="text-xs text-gray-500 mt-2">
                          <strong>Important:</strong> Select your address from the dropdown suggestions to auto-populate coordinates. Manual entry alone is not enough.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location.city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          City <span className="text-red-700 font-bold">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Victoria Island"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location.state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          State{" "}
                          <span className="text-red-700 font-bold">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Lagos" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location.country"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>
                          Country{" "}
                          <span className="text-red-700 font-bold">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Nigeria" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* House Rules Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">
                House Rules
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="rules.checkInTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Check-in Time{" "}
                        <span className="text-red-700 font-bold">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="time" placeholder="14:00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rules.checkOutTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Check-out Time{" "}
                        <span className="text-red-700 font-bold">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="time" placeholder="11:00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-6">
                <FormField
                  control={form.control}
                  name="rules.allowParties"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value || false}
                          onCheckedChange={(checked) => field.onChange(checked)}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0 font-normal">
                        Allow parties
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rules.allowPets"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value || false}
                          onCheckedChange={(checked) => field.onChange(checked)}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0 font-normal">
                        Allow pets
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Attractions Section */}
            <div className="space-y-2 hidden">
              <Label className="text-sm font-semibold text-gray-700">
                Attractions
              </Label>
              <MultiSelect
                values={(watchedDefaultAttractions || []) as string[]}
                onValuesChange={(vals) =>
                  form.setValue("default_attraction_ids", vals)
                }
              >
                <MultiSelectTrigger className="w-full">
                  <MultiSelectValue placeholder="Select default attractions" />
                </MultiSelectTrigger>
                <MultiSelectContent
                  search={{ placeholder: "Search attractions..." }}
                >
                  {defaultAttractionsQuery.isLoading ? (
                    <div className="p-2 text-sm text-gray-500">Loading...</div>
                  ) : defaultAttractionsQuery.data?.data &&
                    defaultAttractionsQuery.data.data.length > 0 ? (
                    defaultAttractionsQuery.data.data.map(
                      (att: IDefaultAttraction) => (
                        <MultiSelectItem
                          key={att.id}
                          value={att.id}
                          badgeLabel={
                            <div className="flex items-center gap-2">
                              {att.image_url && (
                                <Image
                                  src={att.image_url}
                                  alt={att.label}
                                  width={20}
                                  height={20}
                                  className="rounded"
                                />
                              )}
                              <span className="text-xs">
                                {att.label}
                              </span>
                            </div>
                          }
                        >
                          <div className="flex items-center gap-2">
                            {att.image_url && (
                              <Image
                                src={att.image_url}
                                alt={att.label}
                                width={28}
                                height={28}
                                className="rounded"
                              />
                            )}
                            <span className="text-sm">
                              {att.label}
                            </span>
                          </div>
                        </MultiSelectItem>
                      ),
                    )
                  ) : (
                    <div className="p-2 text-sm text-gray-500">
                      No attractions available
                    </div>
                  )}
                </MultiSelectContent>
              </MultiSelect>
            </div>

            {/* Images Section */}
            <FileUploader
              filePreview={imagePreviews}
              onFileChange={handleFileChange}
              onFilePreviewChange={handleFilePreviewChange}
              inputId={`${mode}-image-upload`}
              disabled={isLoading}
              maxSizeMB={5}
              acceptedTypes={[
                "image/jpeg",
                "image/jpg",
                "image/png",
                "image/webp",
              ]}
              label={`Images ${mode === "create" ? "*" : ""}`}
              description="Drag and drop or click to upload accommodation images"
              multiple={true}
            />

            {/* Error Alert */}
            {submitError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md flex gap-2">
                <svg
                  className="h-5 w-5 text-red-600 shrink-0 mt-0.5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">{submitError}</p>
                  {submitError.includes("coordinates") && (
                    <p className="text-xs text-red-700 mt-1">
                      💡 Tip: Select your address from the dropdown suggestions to auto-populate the location coordinates.
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSubmitError(null)}
                  className="text-red-400 hover:text-red-600"
                >
                  <svg
                    className="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 sm:flex-initial"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 sm:flex-initial bg-primary hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      />
                    </svg>
                    {mode === "create" ? "Creating..." : "Updating..."}
                  </span>
                ) : mode === "create" ? (
                  "Create Accommodation"
                ) : (
                  "Update Accommodation"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
