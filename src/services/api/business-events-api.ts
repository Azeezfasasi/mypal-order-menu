// src/services/api/event-api.ts
// Updated to use the unified key system

import { useSafeMutation } from "@/hooks/useEnhancedMutation";
import type { BaseApiResponse, BaseError, PaginationResult } from "@/types/api";
import { EventType } from "@/types/enums";
import type {
  ICreateEventDto,
  IEvent,
  IEventListItem,
  IEventTicket,
  IPaginationOptions,
  IUpdateEventDto,
} from "@/types/event-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  EVENT_QUERY_KEYS,
  EventInvalidationPresets,
  invalidateEventQueries,
} from "../event-query-keys";
import { apiClient } from "./api-client";
import { ENDPOINTS } from "./endpoints";

export const createEventApi = () => {
  return {
    // ===== QUERY HOOKS (using unified keys) =====

    useGetEvents: (options?: {
      type?: EventType;
      page?: number;
      limit?: number;
    }) =>
      useQuery<BaseApiResponse<PaginationResult<IEventListItem[]>>>({
        // Using the EXACT same key function that invalidation uses
        queryKey: EVENT_QUERY_KEYS.list(options),
        queryFn: async () => {
          const params = new URLSearchParams();
          if (options?.type) params.append("type", options.type);
          if (options?.page) params.append("page", options.page.toString());
          if (options?.limit) params.append("limit", options.limit.toString());

          const response = await apiClient.get<
            BaseApiResponse<PaginationResult<IEventListItem[]>>
          >(`${ENDPOINTS.EVENTS.GET_ALL}?${params.toString()}`);
          return response.data;
        },
      }),

    useGetBusinessEvents: (options?: {
      eventType?: EventType;
      page?: number;
      limit?: number;
    }) =>
      useQuery<BaseApiResponse<PaginationResult<IEventListItem[]>>>({
        // Using the EXACT same key function that invalidation uses
        queryKey: EVENT_QUERY_KEYS.businessList(options),
        queryFn: async () => {
          const params = new URLSearchParams();
          if (options?.eventType) params.append("eventType", options.eventType);
          if (options?.page) params.append("page", options.page.toString());
          if (options?.limit) params.append("limit", options.limit.toString());

          const response = await apiClient.get<
            BaseApiResponse<PaginationResult<IEventListItem[]>>
          >(`${ENDPOINTS.EVENTS.GET_BUSINESS_EVENTS}?${params.toString()}`);
          return response.data;
        },
      }),

    useGetUpcomingEvents: (type?: EventType) =>
      useQuery<BaseApiResponse<IEventListItem[]>>({
        // Using the EXACT same key function that invalidation uses
        queryKey: EVENT_QUERY_KEYS.upcoming(type),
        queryFn: async () => {
          const params = new URLSearchParams();
          if (type) params.append("type", type);

          const response = await apiClient.get<
            BaseApiResponse<IEventListItem[]>
          >(`${ENDPOINTS.EVENTS.GET_UPCOMING}?${params.toString()}`);
          return response.data;
        },
      }),

    useGetBusinessUpcomingEvents: (options?: {
      type?: EventType;
      page?: number;
      limit?: number;
    }) =>
      useQuery<BaseApiResponse<PaginationResult<IEventListItem[]>>>({
        // Using the EXACT same key function that invalidation uses
        queryKey: EVENT_QUERY_KEYS.businessUpcoming(options),
        queryFn: async () => {
          const params = new URLSearchParams();
          if (options?.type) params.append("type", options.type);
          if (options?.page) params.append("page", options.page.toString());
          if (options?.limit) params.append("limit", options.limit.toString());

          const response = await apiClient.get<
            BaseApiResponse<PaginationResult<IEventListItem[]>>
          >(`${ENDPOINTS.EVENTS.GET_BUSINESS_UPCOMING}?${params.toString()}`);
          return response.data;
        },
      }),

    useGetEventById: (eventId: string | undefined | null) =>
      useQuery<BaseApiResponse<IEvent>>({
        // Using the EXACT same key function that invalidation uses
        queryKey: EVENT_QUERY_KEYS.detail(eventId!),
        queryFn: async () => {
          if (!eventId) throw new Error("Event ID is required.");
          const response = await apiClient.get<BaseApiResponse<IEvent>>(
            ENDPOINTS.EVENTS.GET_ONE(eventId)
          );
          return response.data;
        },
        enabled: !!eventId,
      }),

    useGetEventTickets: (
      eventId: string | undefined | null,
      options?: IPaginationOptions
    ) =>
      useQuery<BaseApiResponse<PaginationResult<IEventTicket[]>>>({
        // Using the EXACT same key function that invalidation uses
        queryKey: EVENT_QUERY_KEYS.tickets(eventId!, options),
        queryFn: async () => {
          if (!eventId) throw new Error("Event ID is required.");
          const params = new URLSearchParams();
          if (options?.page) params.append("page", options.page.toString());
          if (options?.limit) params.append("limit", options.limit.toString());

          const response = await apiClient.get<
            BaseApiResponse<PaginationResult<IEventTicket[]>>
          >(`${ENDPOINTS.EVENTS.GET_TICKETS(eventId)}?${params.toString()}`);
          return response.data;
        },
        enabled: !!eventId,
      }),

    // ===== MUTATION HOOKS (using unified invalidation) =====
    useCreateEvent: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<BaseApiResponse<IEvent>, FormData>({
        mutationFn: async (data) => {
          console.log("🔍 [useCreateEvent] Sending FormData to backend...");
          console.log("📤 Format: multipart/form-data (dual format mode)");
          console.log("   FormData entries:", Array.from(data.entries()).length);

          const response = await apiClient.post<BaseApiResponse<IEvent>>(
            ENDPOINTS.EVENTS.CREATE,
            data,
            {
              timeout: 120000,
              // CRITICAL: Do NOT set Content-Type header for FormData
              // Axios will automatically set multipart/form-data with correct boundary
              headers: {
                'Content-Type': undefined,
              },
            }
          );
          return response.data;
        },
        onSuccess: (data) => {
          toast.success(data.message || "Event created successfully.");

          // Guaranteed to invalidate the SAME keys used by queries
          invalidateEventQueries(queryClient, EventInvalidationPresets.CREATE);
        },
        onError: (error) => {
          console.error("Failed to create event:", error);
        },
      });
    },

    useUpdateEvent: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<IEvent>,
        { eventId: string; data: FormData }
      >({
        mutationFn: async ({ eventId, data }) => {
          // CRITICAL: For FormData, must NOT set Content-Type header
          // Axios will automatically set the correct multipart/form-data with boundary
          const config: { headers: Record<string, string | undefined>; timeout: number } = {
            headers: {},
            timeout: 120000
          };
          // Delete Content-Type to let axios handle it automatically for FormData
          delete config.headers['Content-Type'];
          
          const response = await apiClient.patch<BaseApiResponse<IEvent>>(
            ENDPOINTS.EVENTS.UPDATE(eventId),
            data,
            config
          );
          return response.data;
        },
        onSuccess: (data, { eventId }) => {
          toast.success(data.message || "Event updated successfully.");

          // Guaranteed to invalidate the SAME keys used by queries
          invalidateEventQueries(
            queryClient,
            EventInvalidationPresets.UPDATE(eventId)
          );
        },
        onError: (error) => {
          console.error("Failed to update event:", error);
        },
      });
    },

    useDeleteEvent: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<BaseApiResponse<null>, string>({
        mutationFn: async (eventId) => {
          const response = await apiClient.delete<BaseApiResponse<null>>(
            ENDPOINTS.EVENTS.DELETE(eventId)
          );
          return response.data;
        },
        onSuccess: (data, eventId) => {
          toast.success(data.message || "Event deleted successfully.");

          // Guaranteed to invalidate the SAME keys used by queries
          invalidateEventQueries(
            queryClient,
            EventInvalidationPresets.DELETE(eventId)
          );
        },
        onError: (error) => {
          console.error("Failed to delete event:", error);
        },
      });
    },

    // Generate flyer using AI
    useGenerateFlyer: () => {
      return useMutation<
        BaseApiResponse<{ image_url: string }>,
        BaseError,
        {
          prompt: string;
          imagePrompt?: string; // Custom AI image prompt - takes precedence over background_uri and auto-generated prompts
          cta?: string;
          eventName?: string;
          eventCaption?: string;
          date?: string;
          businessName?: string;
          mainCatch?: string;
          aboutMainCatch?: string;
          address?: string;
          description?: string;
          startTime?: string;
          endTime?: string;
          gatePass?: string;
          ticketTiers?: Array<{ name: string; price: number }>;
          attractions?: string[];
          caption?: string;
          catchyPhrase?: string;
          offerText?: string;
          duration?: string;
          gatePassType?: string;
          logo?: File;
          background?: File;
          themeStyle?: string;
        }
      >({
        mutationFn: async (data) => {
          // Convert data to FormData to properly handle File objects
          const formData = new FormData();

          // Add all string fields
          formData.append("prompt", data.prompt);
          if (data.imagePrompt) formData.append("imagePrompt", data.imagePrompt);
          if (data.cta) formData.append("cta", data.cta);
          if (data.eventName) formData.append("eventName", data.eventName);
          if (data.eventCaption) formData.append("eventCaption", data.eventCaption);
          if (data.date) formData.append("date", data.date);
          if (data.businessName) formData.append("businessName", data.businessName);
          if (data.mainCatch) formData.append("mainCatch", data.mainCatch);
          if (data.aboutMainCatch) formData.append("aboutMainCatch", data.aboutMainCatch);
          if (data.address) formData.append("address", data.address);
          if (data.description) formData.append("description", data.description);
          if (data.startTime) formData.append("startTime", data.startTime);
          if (data.endTime) formData.append("endTime", data.endTime);
          if (data.gatePass) formData.append("gatePass", data.gatePass);
          if (data.duration) formData.append("duration", data.duration);
          if (data.gatePassType) formData.append("gatePassType", data.gatePassType);
          if (data.caption) formData.append("caption", data.caption);
          if (data.catchyPhrase) formData.append("catchyPhrase", data.catchyPhrase);
          if (data.offerText) formData.append("offerText", data.offerText);
          if (data.themeStyle) formData.append("themeStyle", data.themeStyle);

          // Add ticket tiers array
          if (data.ticketTiers && Array.isArray(data.ticketTiers)) {
            data.ticketTiers.forEach((tier, index) => {
              formData.append(`ticketTiers[${index}][name]`, tier.name);
              formData.append(`ticketTiers[${index}][price]`, String(tier.price));
            });
          }

          // Add attractions array
          if (data.attractions && Array.isArray(data.attractions)) {
            data.attractions.forEach((attraction, index) => {
              formData.append(`attractions[${index}]`, attraction);
            });
          }

          // Add File fields
          if (data.logo instanceof File) {
            formData.append("logo", data.logo);
          }
          if (data.background instanceof File) {
            formData.append("background", data.background);
          }

          const response = await apiClient.post<
            BaseApiResponse<{ image_url: string }>
          >(ENDPOINTS.EVENTS.GENERATE_FLYER, formData, { timeout: 90000 }); // 90 seconds
          return response.data;
        },
        retry: 0, // Set retry limit to 1
        retryDelay: 90000, // Set retry delay to 90 seconds
        onSuccess: (data) => {
          toast.success(data.message || "Flyer generated successfully.");
        },
        onError: (error) => {
          console.error("Failed to generate flyer:", error);
          // toast.error("Failed to generate flyer. Please try again.", {
          //   description: error.response?.data?.message,
          // });
        },
      });
    },

    // Example: Custom invalidation for specific scenarios
    // useUpdateEventTicketsOnly: () => {
    //   const queryClient = useQueryClient();
    //   return useSafeMutation<
    //     BaseApiResponse<IEventTicket[]>,
    //     { eventId: string; tickets: any[] }
    //   >({
    //     mutationFn: async ({ eventId, tickets }) => {
    //       const response = await apiClient.patch(
    //         ENDPOINTS.EVENTS.UPDATE_TICKETS(eventId),
    //         { tickets }
    //       );
    //       return response.data;
    //     },
    //     onSuccess: (data, { eventId }) => {
    //       toast.success("Tickets updated successfully.");

    //       // Only invalidate tickets and event detail - not all lists
    //       invalidateEventQueries(queryClient, EventInvalidationPresets.TICKETS_ONLY(eventId));
    //     },
    //   });
    // },

    // Utility hooks for form data creation
    useCreateEventFormData: () => {
      return {
        createEventFormData: (eventData: ICreateEventDto): FormData => {
          const formData = new FormData();

          // Basic event fields - only append non-empty values
          if (eventData.event_title) formData.append("event_title", eventData.event_title);
          if (eventData.location) formData.append("location", eventData.location);
          formData.append("event_type", eventData.event_type);
          formData.append("event_class", eventData.event_class);
          if (eventData.start_date) formData.append("start_date", eventData.start_date);
          if (eventData.end_date) formData.append("end_date", eventData.end_date);
          if (eventData.start_time) formData.append("start_time", eventData.start_time);
          if (eventData.end_time) formData.append("end_time", eventData.end_time);
          if (eventData.duration) formData.append("duration", eventData.duration);
          if (eventData.about) formData.append("about", eventData.about);
          formData.append(
            "refine_description",
            eventData.refine_description.toString()
          );
          formData.append(
            "is_eighten_plus",
            eventData.is_eighten_plus.toString()
          );

          // Handle image/flyer - either file upload or AI-generated URL
          console.log("📋 FormData creation - Image handling:", {
            image_preference: eventData.image_preference,
            hasImage: !!eventData.image,
            hasFlyerUrl: !!eventData.flyer_url,
            flyerPrompt: eventData.flyer_prompt,
            flyerCta: eventData.flyer_cta,
          });

          if (eventData.image_preference === "upload" && eventData.image) {
            console.log("📋 Adding uploaded image to FormData");
            formData.append("image", eventData.image);
          } else if (
            eventData.image_preference === "generate" &&
            eventData.flyer_url
          ) {
            console.log(
              "📋 Adding flyer URL to FormData:",
              eventData.flyer_url
            );
            formData.append("flyer_url", eventData.flyer_url);

            // Also append related AI generation fields for reference
            if (eventData.flyer_prompt) {
              console.log("📋 Adding flyer prompt to FormData");
              formData.append("flyer_prompt", eventData.flyer_prompt);
            }
            if (eventData.flyer_cta) {
              console.log("📋 Adding flyer CTA to FormData");
              formData.append("flyer_cta", eventData.flyer_cta);
            }
          } else {
            console.warn("⚠️ No image or flyer URL provided!");
          }

          // Optional business ID (for admin)
          if (eventData.businesss_id) {
            formData.append("businesss_id", eventData.businesss_id);
          }

          // Tickets (for ticket-type events)
          if (eventData.tickets && eventData.tickets.length > 0) {
            console.log("🎫 Adding tickets to FormData:", eventData.tickets.length);
            eventData.tickets.forEach((ticket, index) => {
              if (ticket.ticket_name && ticket.ticket_name.trim()) {
                formData.append(
                  `tickets[${index}][ticket_name]`,
                  ticket.ticket_name
                );
                formData.append(
                  `tickets[${index}][price]`,
                  ticket.price.toString()
                );
                if (ticket.id) {
                  formData.append(`tickets[${index}][id]`, ticket.id);
                }
              }
            });
          }

          // Event benefits (for exclusive events)
          if (eventData.benefits && eventData.benefits.length > 0) {
            console.log("✨ Adding benefits to FormData:", eventData.benefits.length);
            eventData.benefits.forEach((benefit, index) => {
              if (benefit.title?.trim() && benefit.description?.trim()) {
                formData.append(
                  `benefits[${index}][title]`,
                  benefit.title || ""
                );
                formData.append(
                  `benefits[${index}][description]`,
                  benefit.description
                );
                if (benefit.id) {
                  formData.append(`benefits[${index}][id]`, benefit.id);
                }
              }
            });
          }

          // Event agendas (for exclusive events)
          if (eventData.agendas && eventData.agendas.length > 0) {
            console.log("📋 Adding agendas to FormData:", eventData.agendas.length);
            eventData.agendas.forEach((agenda, index) => {
              if (agenda.title?.trim() && agenda.description?.trim()) {
                formData.append(`agendas[${index}][title]`, agenda.title);
                formData.append(
                  `agendas[${index}][description]`,
                  agenda.description || ""
                );
                if (agenda.event_id) {
                  formData.append(`agendas[${index}][event_id]`, agenda.event_id);
                }
                if (agenda.id) {
                  formData.append(`agendas[${index}][id]`, agenda.id);
                }
              }
            });
          }

          return formData;
        },

        updateEventFormData: (eventData: IUpdateEventDto): FormData => {
          const formData = new FormData();

          // Only append fields that are provided (partial update)
          if (eventData.event_title !== undefined) {
            formData.append("event_title", eventData.event_title);
          }
          if (eventData.location !== undefined) {
            formData.append("location", eventData.location);
          }
          if (eventData.start_date !== undefined) {
            formData.append("start_date", eventData.start_date);
          }
          if (eventData.end_date !== undefined) {
            formData.append("end_date", eventData.end_date);
          }
          if (eventData.start_time !== undefined) {
            formData.append("start_time", eventData.start_time);
          }
          if (eventData.end_time !== undefined) {
            formData.append("end_time", eventData.end_time);
          }
          if (eventData.duration !== undefined) {
            formData.append("duration", eventData.duration);
          }
          if (eventData.about !== undefined) {
            formData.append("about", eventData.about);
          }
          if (eventData.refine_description !== undefined) {
            formData.append(
              "refine_description",
              eventData.refine_description.toString()
            );
          }
          if (eventData.is_eighten_plus !== undefined) {
            formData.append(
              "is_eighten_plus",
              eventData.is_eighten_plus.toString()
            );
          }

          // Handle image/flyer - either file upload or AI-generated URL
          if (eventData.image_preference === "upload" && eventData.image) {
            formData.append("image", eventData.image);
          } else if (
            eventData.image_preference === "generate" &&
            eventData.flyer_url
          ) {
            formData.append("flyer_url", eventData.flyer_url);

            // Also append related AI generation fields for reference
            if (eventData.flyer_prompt) {
              formData.append("flyer_prompt", eventData.flyer_prompt);
            }
            if (eventData.flyer_cta) {
              formData.append("flyer_cta", eventData.flyer_cta);
            }
          } else if (eventData.image) {
            // Fallback for backward compatibility
            formData.append("image", eventData.image);
          }

          // Handle tickets update
          if (eventData.tickets && eventData.tickets.length > 0) {
            eventData.tickets.forEach((ticket, index) => {
              formData.append(
                `tickets[${index}][ticket_name]`,
                ticket.ticket_name
              );
              formData.append(
                `tickets[${index}][price]`,
                ticket.price.toString()
              );
              if (ticket.id) {
                formData.append(`tickets[${index}][id]`, ticket.id);
              }
            });
          }

          // Handle benefits update
          if (eventData.benefits && eventData.benefits.length > 0) {
            eventData.benefits.forEach((benefit, index) => {
              formData.append(`benefits[${index}][title]`, benefit.title || "");
              formData.append(
                `benefits[${index}][description]`,
                benefit.description
              );
              if (benefit.id) {
                formData.append(`benefits[${index}][id]`, benefit.id);
              }
            });
          }

          // Handle agendas update
          if (eventData.agendas && eventData.agendas.length > 0) {
            eventData.agendas.forEach((agenda, index) => {
              formData.append(`agendas[${index}][title]`, agenda.title);
              formData.append(
                `agendas[${index}][description]`,
                agenda.description || ""
              );
              formData.append(`agendas[${index}][event_id]`, agenda.event_id);
              if (agenda.id) {
                formData.append(`agendas[${index}][id]`, agenda.id);
              }
            });
          }

          return formData;
        },
      };
    },
  };
};

export const EventApi = createEventApi();
