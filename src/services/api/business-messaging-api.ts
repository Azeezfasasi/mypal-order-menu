import { IGetAllBusinessConversationsResponse, IGetBusinessConversationsParam, IGetConversationDetails, ISendMessagePayload, ISendMessageResponse } from "@/types/business-messaging-types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MESSAGING_QUERY_KEYS } from "../messaging-query-keys";
import { ENDPOINTS } from "./endpoints";
import { apiClient } from "./api-client";
import { useSafeMutation } from "@/hooks/useEnhancedMutation";


export const businessMessagingApi = () => {

  return {

    useGetBusinessConversation: (params?: IGetBusinessConversationsParam) => {
      return useQuery<IGetAllBusinessConversationsResponse>({
        queryKey: MESSAGING_QUERY_KEYS.list(
          params as unknown as Record<string, unknown>,
        ),
        queryFn: async () => {
          const searchParams = new URLSearchParams();
          if (params?.business_id)
            searchParams.append("business_id", String(params.business_id));
          if (params?.page !== undefined)
            searchParams.append("page", String(params.page));
          if (params?.limit !== undefined)
            searchParams.append("limit", String(params.limit));

          const url = searchParams.toString()
            ? `${ENDPOINTS.MESSAGING.GET_ALL}?${searchParams.toString()}`
            : ENDPOINTS.MESSAGING.GET_ALL;


          const response = await apiClient.get<IGetAllBusinessConversationsResponse>(url);
          return response.data;
        },
        enabled: params !== undefined, // Only run query if params is defined
        refetchInterval: 5000
      });
    },

    useGetConversationDetails: ({ conversationId }: { conversationId: number | '' }) => {
      return useQuery<IGetConversationDetails>({
        queryKey: MESSAGING_QUERY_KEYS.single(conversationId),
        queryFn: async () => {
          const url = ENDPOINTS.MESSAGING.GET_SINGLE(conversationId)
          const response = await apiClient.get<IGetConversationDetails>(url);
          return response.data;
        },
        enabled: !!conversationId,
        refetchInterval: conversationId ? 5000 : false,
      });
    },

    // Send message in an existing conversation
    useSendMessage: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<ISendMessageResponse, { conversationId: number | string, data: ISendMessagePayload }>({
        mutationFn: async ({ conversationId , data }) => {
          const response = await apiClient.post<ISendMessageResponse>(
            ENDPOINTS.MESSAGING.SEND_MESSAGE(conversationId),
            data,
          );
          return response.data;
        },
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["business-messages"],
          });
        }
      });
    },

    // Send first message to start a new conversation
    useSendFirstMessage: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<ISendMessageResponse, { data: ISendMessagePayload }>({
        mutationFn: async ({ data }) => {
          const response = await apiClient.post<ISendMessageResponse>(
            ENDPOINTS.MESSAGING.SEND_FIRST_MESSAGE,
            data,
          );
          return response.data;
        },
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["business-messages"],
          });
        }
      });
    },
  };
};

export const BusinessMessagingApi = businessMessagingApi();
