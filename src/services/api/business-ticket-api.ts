import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./api-client";
import type { BaseApiResponse } from "@/types/api";
import { BUSINESS_TICKET_QUERY_KEYS } from "../query-keys";
import type {
  IBusinessTicket,
  ICreateBusinessTicket,
  IUpdateBusinessTicket,
} from "@/types/business-ticket-types";
import { ENDPOINTS } from "./endpoints";

// ==================================
// Business Ticket API Hooks Factory
// ==================================

export const createBusinessTicketApi = () => {
  return {
    // Get all business tickets
    useGetBusinessTickets: () =>
      useQuery<BaseApiResponse<IBusinessTicket[]>>({
        queryKey: BUSINESS_TICKET_QUERY_KEYS.lists(),
        queryFn: async () => {
          const response = await apiClient.get<
            BaseApiResponse<IBusinessTicket[]>
          >(ENDPOINTS.BUSINESS_TICKETS.GET_ALL);
          return response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      }),

    // Get single business ticket
    useGetBusinessTicket: (ticketId: string) =>
      useQuery<BaseApiResponse<IBusinessTicket>>({
        queryKey: BUSINESS_TICKET_QUERY_KEYS.detail(ticketId),
        queryFn: async () => {
          const response = await apiClient.get<
            BaseApiResponse<IBusinessTicket>
          >(ENDPOINTS.BUSINESS_TICKETS.GET_ONE(ticketId));
          return response.data;
        },
        enabled: !!ticketId,
        staleTime: 5 * 60 * 1000, // 5 minutes
      }),

    // Create business ticket
    useCreateBusinessTicket: () => {
      const queryClient = useQueryClient();

      return useMutation<
        BaseApiResponse<IBusinessTicket>,
        Error,
        ICreateBusinessTicket
      >({
        mutationFn: async (data: ICreateBusinessTicket) => {
          const response = await apiClient.post<
            BaseApiResponse<IBusinessTicket>
          >(ENDPOINTS.BUSINESS_TICKETS.CREATE, data);
          return response.data;
        },
        onSuccess: () => {
          // Invalidate and refetch tickets list
          queryClient.invalidateQueries({
            queryKey: BUSINESS_TICKET_QUERY_KEYS.lists(),
          });
        },
      });
    },

    // Update business ticket
    useUpdateBusinessTicket: () => {
      const queryClient = useQueryClient();

      return useMutation<
        BaseApiResponse<IBusinessTicket>,
        Error,
        { ticketId: string; data: IUpdateBusinessTicket }
      >({
        mutationFn: async ({ ticketId, data }) => {
          const response = await apiClient.patch<
            BaseApiResponse<IBusinessTicket>
          >(ENDPOINTS.BUSINESS_TICKETS.UPDATE(ticketId), data);
          return response.data;
        },
        onSuccess: (_, { ticketId }) => {
          // Invalidate and refetch tickets list and specific ticket
          queryClient.invalidateQueries({
            queryKey: BUSINESS_TICKET_QUERY_KEYS.lists(),
          });
          queryClient.invalidateQueries({
            queryKey: BUSINESS_TICKET_QUERY_KEYS.detail(ticketId),
          });
        },
      });
    },

    // Delete business ticket
    useDeleteBusinessTicket: () => {
      const queryClient = useQueryClient();

      return useMutation<BaseApiResponse<void>, Error, string>({
        mutationFn: async (ticketId: string) => {
          const response = await apiClient.delete<BaseApiResponse<void>>(
            ENDPOINTS.BUSINESS_TICKETS.DELETE(ticketId)
          );
          return response.data;
        },
        onSuccess: (_, ticketId) => {
          // Invalidate and refetch tickets list
          queryClient.invalidateQueries({
            queryKey: BUSINESS_TICKET_QUERY_KEYS.lists(),
          });
          // Remove the specific ticket from cache
          queryClient.removeQueries({
            queryKey: BUSINESS_TICKET_QUERY_KEYS.detail(ticketId),
          });
        },
      });
    },
  };
};

// Export Instance
export const BusinessTicketApi = createBusinessTicketApi();
