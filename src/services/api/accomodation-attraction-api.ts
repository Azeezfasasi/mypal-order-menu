// accommodation-attraction-api.ts
import { useSafeMutation } from "@/hooks/useEnhancedMutation";
import { buildRansackQuery, RansackParams } from "@/lib/api-helpers";
import type {
  IAccommodation,
  IAttraction,
  ICreateAccommodationDto,
  ICreateAttractionDto,
  IDefaultAttraction,
  IUpdateAccommodationDto,
  IUpdateAttractionDto,
} from "@/types/accomodation-attraction-types";
import type { BaseApiResponse, PaginationResult } from "@/types/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SERVICE_OFFERING_QUERY_KEYS } from "../query-keys";
import { apiClient } from "./api-client";
import { ENDPOINTS } from "./endpoints";
import { uploadAccommodationFiles } from "./upload-utils";
import { BusinessCategoryType } from "@/types/enums";

export interface IAccommodationCategory {
  id: string;
  name: string;
  description?: string;
  business_type?: string;
  is_active?: boolean; // Category may be marked as inactive
  // Additional fields provided by new API shape
  image_url?: string;
  isDefault?: boolean;
  sort_order?: number;
  createdByBusinessId?: string | null;
  business_accommodation_type?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Separates Files and URL strings from a mixed array
 */
function separateFilesAndUrls(images?: Array<File | string>): {
  files: File[];
  urls: string[];
} {
  const files: File[] = [];
  const urls: string[] = [];

  if (Array.isArray(images)) {
    images.forEach((item) => {
      if (item instanceof File) {
        files.push(item);
      } else if (typeof item === "string") {
        urls.push(item);
      }
    });
  }

  return { files, urls };
}

/**
 * Recursively removes null and undefined values from an object
 */
function cleanPayload<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => cleanPayload(item)).filter((item) => item !== null && item !== undefined) as T;
  }

  if (typeof obj === "object") {
    const cleaned: Record<string, unknown> = {};
    Object.keys(obj).forEach((key) => {
      const value = (obj as Record<string, unknown>)[key];
      if (value !== null && value !== undefined) {
        cleaned[key] = cleanPayload(value);
      }
    });
    return cleaned as T;
  }

  return obj;
}

export const createAccommodationAttractionApi = () => {
  return {
    // The API previously returned a flat array of categories (IAccommodationCategory[]).
    // New API returns { default: IAccommodationCategory[], custom: IAccommodationCategory[] }.
    // Keep the query typing flexible to accept either shape for backward compatibility.
    useAccommodationCategories: (businessType?: string) =>
      useQuery<
        BaseApiResponse<
          | IAccommodationCategory[]
          | {
            default: IAccommodationCategory[];
            custom: IAccommodationCategory[];
          }
        >
      >({
        queryKey: [
          ...SERVICE_OFFERING_QUERY_KEYS.all,
          "accommodationCategories",
          businessType,
        ],
        queryFn: async () => {
          const url = ENDPOINTS.ACCOMMODATIONS.CATEGORIES.GET_ALL;
          const response =
            // request may return either a flat array or the new object shape
            await apiClient.get(url);
          return response.data;
        },
        enabled: true,
      }),

    useAccommodation: (id: string) =>
      useQuery<BaseApiResponse<PaginationResult<IAccommodation>>>({
        queryKey: SERVICE_OFFERING_QUERY_KEYS.accommodation(id),
        queryFn: async () => {
          const response = await apiClient.get(
            ENDPOINTS.ACCOMMODATIONS.GET_ONE(id),
          );
          return response.data;
        },
        enabled: !!id,
      }),

    useBusinessAccommodations: (page: number = 1, limit: number = 10) =>
      useQuery<BaseApiResponse<PaginationResult<IAccommodation[]>>>({
        queryKey: [
          ...SERVICE_OFFERING_QUERY_KEYS.businessAccommodations(),
          { page, limit },
        ],
        queryFn: async () => {
          const ransackParams: RansackParams = {
            q: {},
            page,
            limit,
          };

          const query = buildRansackQuery(ransackParams);

          const response = await apiClient.get(
            `${ENDPOINTS.ACCOMMODATIONS.GET_BUSINESS()}?${query}`,
          );

          return response.data;
        },
      }),

    useCreateAccommodation: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<IAccommodation>,
        {
          accommodationData: ICreateAccommodationDto;
          images?: Array<File | string>;
        }
      >({
        mutationFn: async ({ accommodationData, images }) => {
          // Separate files that need uploading from existing URLs
          const { files, urls } = separateFilesAndUrls(images);

          let finalImages = [...urls];

          // Upload new files if any exist
          if (files.length > 0) {
            try {
              const uploadedUrls = await uploadAccommodationFiles(files, {
                compressImages: true,
                maxImageSizeMB: 1,
              });
              finalImages = [...finalImages, ...uploadedUrls];
            } catch (uploadError: unknown) {
              console.error("Image upload failed:", uploadError);
              const err = uploadError as { message?: string };
              throw new Error(
                err?.message || "Failed to upload images. Please try again.",
              );
            }
          }

          // Validate we have at least one image
          if (finalImages.length === 0) {
            throw new Error("At least one image is required");
          }

          // Build payload with uploaded image URLs
          let payload: ICreateAccommodationDto = {
            ...accommodationData,
            images: finalImages,
          };

          // Clean up empty/undefined pricing fields - rebuild pricing object with only valid fields
          if (payload.pricing) {
            const cleanPricing: Record<string, unknown> = {};

            // basePricePerNight must be a valid number before including it
            if (
              typeof payload.pricing.basePricePerNight === "number" &&
              !isNaN(payload.pricing.basePricePerNight)
            ) {
              cleanPricing.basePricePerNight =
                payload.pricing.basePricePerNight;
            } else {
              // choice: throw or handle missing/invalid base price; here we
              // surface an error so the caller can correct the data
              throw new Error(
                "Base price per night must be a valid number",
              );
            }

            // Only include cautionFee if it's a valid positive number
            if (
              typeof payload.pricing.cautionFee === "number" &&
              !isNaN(payload.pricing.cautionFee) &&
              payload.pricing.cautionFee > 0
            ) {
              cleanPricing.cautionFee = payload.pricing.cautionFee;
            }
            // Do NOT include cautionFee at all if it's not valid

            // Preserve discounts array if it exists
            if (
              Array.isArray(payload.pricing.discounts) &&
              payload.pricing.discounts.length > 0
            ) {
              cleanPricing.discounts = payload.pricing.discounts;
            }

            payload.pricing = cleanPricing;
          }

          // Deep clean the entire payload to remove any null/undefined values
          payload = cleanPayload(payload);

          console.log("Accommodation payload being sent to backend:", JSON.stringify(payload, null, 2));

          // Create accommodation with image URLs
          try {
            const response = await apiClient.post<
              BaseApiResponse<IAccommodation>
            >(ENDPOINTS.ACCOMMODATIONS.CREATE, payload);

            return response.data;
          } catch (apiError: unknown) {
            console.error("Accommodation creation failed:", apiError);
            const err = apiError as {
              response?: { data?: { message?: string } };
            };
            throw new Error(
              err?.response?.data?.message ||
              "Failed to create accommodation. Please try again.",
            );
          }
        },
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: SERVICE_OFFERING_QUERY_KEYS.businessAccommodations(),
          });
          queryClient.invalidateQueries({
            queryKey: ['offerings-res']
          });
        },
        onError: () => "Failed to create accommodation",
      });
    },

    useUpdateAccommodation: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<IAccommodation>,
        {
          id: string;
          accommodationData: IUpdateAccommodationDto;
          images?: Array<File | string>;
        }
      >({
        mutationFn: async ({ id, accommodationData, images }) => {
          // Separate files that need uploading from existing URLs
          const { files, urls } = separateFilesAndUrls(images);

          let finalImages = [...urls];

          // Upload new files if any exist
          if (files.length > 0) {
            try {
              const uploadedUrls = await uploadAccommodationFiles(files, {
                compressImages: true,
                maxImageSizeMB: 1,
              });
              finalImages = [...finalImages, ...uploadedUrls];
            } catch (uploadError: unknown) {
              console.error("Image upload failed:", uploadError);
              const err = uploadError as { message?: string };
              throw new Error(
                err?.message || "Failed to upload images. Please try again.",
              );
            }
          }

          // Build payload with image URLs
          // For update, images are optional - only include if we have some
          const payload: IUpdateAccommodationDto = {
            ...accommodationData,
            ...(finalImages.length > 0 ? { images: finalImages } : {}),
          };

          // Update accommodation
          try {
            const response = await apiClient.patch<
              BaseApiResponse<IAccommodation>
            >(ENDPOINTS.ACCOMMODATIONS.UPDATE(id), payload);

            return response.data;
          } catch (apiError: unknown) {
            console.error("Accommodation update failed:", apiError);
            const err = apiError as {
              response?: { data?: { message?: string } };
            };
            throw new Error(
              err?.response?.data?.message ||
              "Failed to update accommodation. Please try again.",
            );
          }
        },
        onSuccess: ({ data }) => {
          queryClient.invalidateQueries({
            queryKey: SERVICE_OFFERING_QUERY_KEYS.accommodation(data.id),
          });
          queryClient.invalidateQueries({
            queryKey: SERVICE_OFFERING_QUERY_KEYS.businessAccommodations(),
          });
        },
        onError: (_, variables) =>
          `Failed to update accommodation with ID ${variables.id}`,
      });
    },

    useDeleteAccommodation: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<BaseApiResponse<null>, string>({
        mutationFn: async (id) => {
          const response = await apiClient.delete(
            ENDPOINTS.ACCOMMODATIONS.DELETE(id),
          );
          return response.data;
        },
        onSuccess: (data, id) => {
          queryClient.invalidateQueries({
            queryKey: SERVICE_OFFERING_QUERY_KEYS.accommodation(id),
          });
          queryClient.invalidateQueries({
            queryKey: SERVICE_OFFERING_QUERY_KEYS.businessAccommodations(),
          });
        },
        onError: (id) => `Failed to delete accommodation with ID ${id}`,
      });
    },

    useDefaultAttractions: (businessType?: string) =>
      useQuery<BaseApiResponse<IDefaultAttraction[]>>({
        queryKey: [
          ...SERVICE_OFFERING_QUERY_KEYS.all,
          "defaultAttractions",
          businessType,
        ],
        queryFn: async () => {

          const businessTypeKey = businessType
            ? Object.entries(BusinessCategoryType).find(
              ([_, value]) => value === businessType
            )?.[0]
            : undefined;

          const url = businessTypeKey
            ? `${ENDPOINTS.ACCOMMODATIONS.PUBLIC.GET_DEFAULT_ATTRACTIONS}?business_accommodation_type=${encodeURIComponent(
              businessTypeKey,
            )}`
            : ENDPOINTS.ACCOMMODATIONS.PUBLIC.GET_DEFAULT_ATTRACTIONS;

          const response =
            await apiClient.get<BaseApiResponse<IDefaultAttraction[]>>(url);

          return response.data;
        },
        enabled: true,
      }),

    useUploadAccommodationImages: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<BaseApiResponse<string[]>, File[]>({
        mutationFn: async (files) => {
          if (!files || files.length === 0) {
            throw new Error("No files provided for upload");
          }

          try {
            const urls = await uploadAccommodationFiles(files, {
              compressImages: true,
              maxImageSizeMB: 1,
            });

            // Wrap into BaseApiResponse shape
            return {
              data: urls,
              status: "success",
              statusCode: 200,
              message: `Successfully uploaded ${urls.length} image(s)`,
            };
          } catch (error: unknown) {
            console.error("Image upload failed:", error);
            const err = error as { message?: string };
            throw new Error(
              err?.message || "Failed to upload images. Please try again.",
            );
          }
        },
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: SERVICE_OFFERING_QUERY_KEYS.businessAccommodations(),
          });
        },
        onError: () => "Failed to upload images",
      });
    },

    useAllAttractions: () =>
      useQuery<BaseApiResponse<IAttraction[]>>({
        queryKey: SERVICE_OFFERING_QUERY_KEYS.attractions(),
        queryFn: async () => {
          const response = await apiClient.get(
            ENDPOINTS.SERVICE_OFFERING.GET_ALL_ATTRACTIONS,
          );
          return response.data;
        },
      }),

    useAttraction: (id: string) =>
      useQuery<BaseApiResponse<IAttraction>, string>({
        queryKey: SERVICE_OFFERING_QUERY_KEYS.attraction(id),
        queryFn: async () => {
          const response = await apiClient.get(
            ENDPOINTS.SERVICE_OFFERING.GET_ATTRACTION(id),
          );
          return response.data;
        },
        enabled: !!id,
      }),

    useCreateAttraction: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<IAttraction>,
        ICreateAttractionDto | FormData
      >({
        mutationFn: async (attractionData) => {
          if (attractionData instanceof FormData) {
            const response = await apiClient.post(
              ENDPOINTS.SERVICE_OFFERING.CREATE_ATTRACTION,
              attractionData,
              { headers: { "Content-Type": "multipart/form-data" } },
            );
            return response.data;
          }

          const dto = attractionData as ICreateAttractionDto;
          const maybeImage = dto?.image;
          if (maybeImage instanceof File) {
            const formData = new FormData();
            formData.append("attraction_name", String(dto.attraction_name));
            if (typeof dto.is_active !== "undefined") {
              formData.append("is_active", String(dto.is_active));
            }
            formData.append("image", maybeImage);

            const response = await apiClient.post(
              ENDPOINTS.SERVICE_OFFERING.CREATE_ATTRACTION,
              formData,
            );

            return response.data;
          }

          const response = await apiClient.post(
            ENDPOINTS.SERVICE_OFFERING.CREATE_ATTRACTION,
            attractionData,
          );
          return response.data;
        },
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: SERVICE_OFFERING_QUERY_KEYS.attractions(),
          });
        },
        onError: () => "Failed to create attraction",
      });
    },

    useUpdateAttraction: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<IAttraction>,
        | { id: string; attractionData: IUpdateAttractionDto }
        | { id: string; attractionData: FormData }
      >({
        mutationFn: async ({ id, attractionData }) => {
          if (attractionData instanceof FormData) {
            const response = await apiClient.patch(
              ENDPOINTS.SERVICE_OFFERING.UPDATE_ATTRACTION(id),
              attractionData,
              { headers: { "Content-Type": "multipart/form-data" } },
            );
            return response.data;
          }

          const dto = attractionData as IUpdateAttractionDto;
          const maybeImage = (dto &&
            (dto as IUpdateAttractionDto).image) as unknown;
          if (maybeImage instanceof File) {
            const formData = new FormData();
            if (typeof dto.attraction_name !== "undefined") {
              formData.append("attraction_name", String(dto.attraction_name));
            }
            if (typeof dto.is_active !== "undefined") {
              formData.append("is_active", String(dto.is_active));
            }
            formData.append("image", maybeImage);

            const response = await apiClient.patch(
              ENDPOINTS.SERVICE_OFFERING.UPDATE_ATTRACTION(id),
              formData,
            );
            return response.data;
          }

          const response = await apiClient.patch(
            ENDPOINTS.SERVICE_OFFERING.UPDATE_ATTRACTION(id),
            attractionData,
          );
          return response.data;
        },
        onSuccess: ({ data }) => {
          queryClient.invalidateQueries({
            queryKey: SERVICE_OFFERING_QUERY_KEYS.attraction(data.id),
          });
          queryClient.invalidateQueries({
            queryKey: SERVICE_OFFERING_QUERY_KEYS.attractions(),
          });
        },
        onError: (error, variables) =>
          `Failed to update attraction with ID ${variables.id}`,
      });
    },

    useDeleteAttraction: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<BaseApiResponse<null>, string>({
        mutationFn: async (id) => {
          const response = await apiClient.delete(
            ENDPOINTS.SERVICE_OFFERING.DELETE_ATTRACTION(id),
          );
          return response.data;
        },
        onSuccess: (data, id) => {
          queryClient.invalidateQueries({
            queryKey: SERVICE_OFFERING_QUERY_KEYS.attraction(id),
          });
          queryClient.invalidateQueries({
            queryKey: SERVICE_OFFERING_QUERY_KEYS.attractions(),
          });
        },
        onError: (id) => `Failed to delete attraction with ID ${id}`,
      });
    },

    useToggleAttractionStatus: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<IAttraction>,
        { id: string; status: "On" | "Off" }
      >({
        mutationFn: async ({ id, status }) => {
          const response = await apiClient.patch(
            `${ENDPOINTS.SERVICE_OFFERING.TOGGLE_ATTRACTION_STATUS(
              id,
            )}?status=${status}`,
          );
          return response.data;
        },
        onSuccess: ({ data }) => {
          queryClient.invalidateQueries({
            queryKey: SERVICE_OFFERING_QUERY_KEYS.attraction(data.id),
          });
          queryClient.invalidateQueries({
            queryKey: SERVICE_OFFERING_QUERY_KEYS.attractions(),
          });
        },
        onError: (error, variables) =>
          `Failed to toggle status for attraction with ID ${variables.id}`,
      });
    },
  };
};

export const AccommodationAttractionApi = createAccommodationAttractionApi();
